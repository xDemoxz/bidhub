# 04 · API y proxy

**Qué es:** route handlers REST con formato de error uniforme `{error:{code,message,details}}`.

**Cómo funciona:**
- 400 datos inválidos, 401 sin sesión, 403 sin permiso, 404 no existe, 409 conflicto de estado.
- `src/proxy.ts` (reemplaza middleware) une i18n, protección de rutas y renovación de sesión.

**Se conecta con:** servicios, validación Zod y la capa de UI.
