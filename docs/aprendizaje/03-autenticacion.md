# 03 · Autenticación

**Qué es:** JWT firmado con jose; access (15 min) y refresh (7 días) en cookies httpOnly.

**Cómo funciona:**
- El refresh se guarda hasheado (SHA-256) y rota en cada uso.
- Si se reutiliza un refresh ya rotado, se revocan todas las sesiones.
- El proxy redirige a `/api/auth/refresh?next=` cuando el access venció; `safeNextPath` evita open redirect.

**Se conecta con:** proxy, `apiFetch` del cliente y rutas privadas.
