# Guía de adaptación: "si cambia X, edita Y"

Pensada para el día de la prueba, cuando la lógica cambie. Busca el cambio
en la tabla y ve directo al archivo. En el código, los comentarios
`REGLA N:` marcan dónde vive cada regla y `ADAPTAR:` marca los puntos
pensados para modificarse.

> Para listar todo: `grep -rn "ADAPTAR:" src prisma` y `grep -rn "REGLA " src prisma`.

## Cambios de reglas de negocio

| Si cambia... | Edita | Luego |
|---|---|---|
| Un número (duración mín/máx, máx. subastas activas, ventana/extensión de cierre) | `src/server/domain/constants.ts` | Ajustar pruebas en `*.test.ts` |
| Cómo se calcula el estado (activa/cerrada/desierta/cancelada) | `src/server/domain/auction-status.ts` | Una sola función; todo el sistema la usa |
| Reglas de publicar, editar o cancelar | `src/server/domain/auction-rules.ts` | Prueba en `auction-rules.test.ts` |
| Reglas de ofertar (incremento, vendedor no oferta, mayor oferta) | `src/server/domain/bid-rules.ts` | Prueba en `bid-rules.test.ts` |
| Alias del postor (anonimización) | `src/server/domain/alias.ts` | |
| Flujo/transacción de un caso de uso | `src/server/services/*.ts` | Mantener el `lock` de fila (`locks.ts`) si hay concurrencia |

## Cambios de datos

| Si cambia... | Edita |
|---|---|
| Entidades o campos | `prisma/schema.prisma` → `npx prisma migrate dev --name <cambio>` |
| Datos de ejemplo | `prisma/seed.ts` |
| Forma de los datos que ve el cliente | `src/server/mappers.ts` y `src/lib/types.ts` |
| Validación de entrada (campos, longitudes) | `src/server/validation.ts` (esquemas Zod) |
| Códigos/mensajes de error | `src/server/errors.ts` y `messages/*.json` (clave `errors.*`) |

## Cambios de API y seguridad

| Si cambia... | Edita |
|---|---|
| Un endpoint nuevo | `src/app/api/<ruta>/route.ts` usando `withErrors` de `src/server/http.ts` |
| Qué rutas exigen sesión o rol admin | `PRIVATE_PATHS` / `ADMIN_PATHS` en `src/proxy.ts` y la guarda del servicio |
| Duración de sesión | `.env` (`ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`) |
| Roles nuevos | enum `Role` en `schema.prisma`, `src/server/auth/session.ts` |
| Dominio de imágenes | `images.remotePatterns` en `next.config.ts` |

## Cambios de interfaz

| Si cambia... | Edita |
|---|---|
| Textos | `messages/es.json` y `messages/en.json` (mantener las mismas claves) |
| Idiomas | `src/i18n/routing.ts` y un nuevo `messages/<loc>.json` |
| Una página | `src/app/[locale]/(grupo)/.../page.tsx` |
| Formulario | `src/components/forms/*` |
| Tarjeta/lista de subastas | `src/components/auctions/*` |

## Receta rápida para una regla nueva

1. Ponla en `constants.ts` si es un número.
2. Escribe la validación en `domain/*-rules.ts` (función pura que lanza `AppError`).
3. Llámala desde el servicio dentro de la transacción.
4. Agrega el mensaje en `errors.ts`/`messages`.
5. Agrega una prueba unitaria.
