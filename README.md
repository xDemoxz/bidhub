# BidHub

Plataforma de subastas en línea hecha con Next.js 16 (App Router), TypeScript,
Prisma y PostgreSQL. Los usuarios publican artículos, ofertan en tiempo real
y el sistema aplica 20 reglas de negocio (incremento mínimo, extensión del
cierre en los últimos minutos, cancelaciones, moderación de administrador, etc.).

## 1. Descripción

- **Público:** Home estática (SSG), catálogo con filtros y detalle de subasta (SSR).
- **Usuario:** registro, login, publicar subastas, ofertar, panel con sus subastas y ofertas.
- **Administrador:** cancelar subastas con motivo y gestionar categorías.
- **Idiomas:** español e inglés (`/es`, `/en`).
- El estado de una subasta (activa, cerrada, desierta, cancelada) **se calcula**, no se guarda.

## 2. Prerrequisitos

- Node.js 22 o superior y npm
- PostgreSQL (local o [Supabase](https://supabase.com))
- Docker (opcional, solo para la imagen de producción)

## 3. Variables de entorno

Copia `.env.example` a `.env` y completa:

| Variable | Qué es |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL. En Supabase: *Project Settings > Database > Connection string > Session pooler* (puerto 5432). |
| `JWT_ACCESS_SECRET` | Secreto del token de acceso (32+ caracteres). Genera con `openssl rand -base64 48`. |
| `JWT_REFRESH_SECRET` | Secreto del refresh token. Debe ser **distinto** al anterior. |
| `ACCESS_TOKEN_EXPIRES_IN` | Duración del access token. Por defecto `15m`. |
| `REFRESH_TOKEN_EXPIRES_IN` | Duración del refresh token. Por defecto `7d`. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Credenciales del administrador que crea el seed. |

## 4. Puesta en marcha (en este orden)

```bash
npm install            # instala dependencias y genera el cliente de Prisma
cp .env.example .env   # luego edita los valores
npm run db:migrate     # crea las tablas (en producción: npm run db:deploy)
npm run db:seed        # crea admin, usuarios, categorías y subastas de ejemplo
npm run dev            # http://localhost:3000
```

## 5. Credenciales de ejemplo (seed)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@bidhub.com` | `Admin1234!` (o lo que pongas en `.env`) |
| Usuarios | `ana@bidhub.com`, `luis@bidhub.com`, `marta@bidhub.com` | `User1234!` |

## 6. Docker

```bash
docker build -t bidhub .
docker run -p 3000:3000 --env-file .env bidhub
```

La imagen es multi-etapa y no corre como root. Las migraciones se aplican
aparte con `npm run db:deploy`.

## 7. Scripts

| Script | Función |
|---|---|
| `npm run dev` / `build` / `start` | Desarrollo, compilación y producción |
| `npm run lint` / `typecheck` | ESLint y TypeScript |
| `npm test` | Pruebas unitarias de las reglas de negocio |
| `RUN_DB_TESTS=1 npm test` | Incluye pruebas de integración contra la base (usa `DATABASE_URL`, **borra datos**) |
| `npm run db:migrate` / `db:deploy` / `db:seed` / `db:reset` | Base de datos |

## 8. Estructura

```
prisma/            esquema, migraciones y seed
messages/          textos es.json / en.json
src/proxy.ts       i18n + protección de rutas + renovación de sesión
src/app/[locale]/  páginas: (public) (auth) (private) (admin)
src/app/api/       route handlers REST
src/components/    componentes de interfaz
src/server/domain/ reglas de negocio puras (con pruebas)
src/server/services/ casos de uso con transacciones
src/server/auth/   JWT, cookies, sesión
docs/              DER, contexto, notas de aprendizaje y guía de adaptación
```

## 9. Documentación

- [DER y decisiones del modelo](docs/der.md)
- [Guía de adaptación: "si cambia X, edita Y"](docs/adaptacion.md)
- [Notas de aprendizaje](docs/aprendizaje/00-resumen-epic.md)

## 10. Despliegue

URL desplegada: _pendiente (Vercel + Supabase)_.
