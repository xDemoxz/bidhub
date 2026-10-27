# 01 · Modelo de datos

**Qué es:** cinco tablas (User, Category, Auction, Bid, RefreshToken) en PostgreSQL con Prisma.

**Cómo funciona:**
- Dinero en `Decimal(12,2)`; el estado de la subasta no se guarda, se calcula.
- `onDelete: Restrict` en categoría protege la regla 17.
- El seed crea subastas en los 4 estados para ver todo desde el inicio.

**Se conecta con:** servicios (`src/server/services`) y mappers.

**Para aprender:** migraciones con `migrate dev` vs `migrate deploy`.
