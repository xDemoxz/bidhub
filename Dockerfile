# Imagen de producción de BidHub (multi-stage, requisito T14).
#
# Construir:  docker build -t bidhub .
# Ejecutar:   docker run -p 3000:3000 --env-file .env bidhub
#
# Las migraciones NO se ejecutan dentro de la imagen: se aplican una vez
# desde tu máquina con `npm run db:deploy` apuntando a la base de datos.
# ADAPTAR: si cambia la versión de Node del proyecto, cambiar las 3 líneas FROM.

# --- Etapa 1: dependencias -------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# prisma.config.ts y el esquema deben existir porque `postinstall` genera el cliente.
COPY prisma ./prisma
COPY prisma.config.ts ./
# Valor de relleno: solo para que la CLI de Prisma pueda leer la config al generar.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm ci

# --- Etapa 2: compilación --------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Etapa 3: ejecución (imagen final, mínima) -----------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Usuario sin privilegios: el contenedor no corre como root.
RUN addgroup -S app && adduser -S app -G app
# `standalone` ya trae solo las dependencias necesarias.
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
