# 02 · Reglas de negocio

**Qué es:** funciones puras en `src/server/domain` que lanzan `AppError` cuando se rompe una regla.

**Cómo funciona:**
- Los números viven en `constants.ts`.
- Los servicios abren una transacción, bloquean la fila (`SELECT ... FOR UPDATE`) y llaman las reglas.
- El bloqueo evita que dos ofertas simultáneas rompan el incremento mínimo.

**Se conecta con:** API (traduce errores a HTTP) y pruebas Vitest.

**Para aprender:** idempotencia de ofertas y rate limiting quedan como extras.
