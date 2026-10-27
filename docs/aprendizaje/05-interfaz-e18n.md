# 05 · Interfaz e i18n

**Qué es:** páginas en `[locale]` con grupos (public)(auth)(private)(admin) y textos en es/en con next-intl.

**Cómo funciona:**
- Home SSG; catálogo y detalle SSR; dashboard cargado desde el cliente.
- Zona horaria fija (America/Bogota) y cuenta regresiva que empieza en `null` para evitar errores de hidratación.

**Se conecta con:** API y proxy.
