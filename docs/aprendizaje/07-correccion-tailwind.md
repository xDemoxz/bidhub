# 07 · Corrección de Tailwind

**Qué se hizo:** Tailwind no generaba clases; se integró con su plugin oficial de PostCSS.

**Cómo funciona:**
1. Next detecta `postcss.config.mjs` y pasa cada CSS por sus plugins.
2. `@tailwindcss/postcss` resuelve el `@import "tailwindcss"` de `src/app/globals.css`.
3. Escanea el código, encuentra las clases usadas (`flex`, `p-4`…) y genera solo esas.

**Con qué se conecta:** `postcss.config.mjs`, `src/app/globals.css`, `src/app/[locale]/layout.tsx` (importa el CSS) y `package.json`.

**Decisiones y criterios:**
- Causa: estaba instalado `@tailwindcss/turbopack` pero nunca se registró en `next.config.ts`. Sin procesador, el `@import` solo traía el CSS base y ninguna utilidad.
- Se eligió PostCSS y no el loader de Turbopack porque es lo que documenta Next 16 y funciona igual con Turbopack, webpack, `next build` y Docker.
- Tras cambiar `postcss.config.mjs` hay que reiniciar `npm run dev` (y borrar `.next` si persiste el CSS viejo).

**Para aprender:** si la interfaz sale "sin diseño", revisa en DevTools si el CSS servido contiene las clases; si no, el problema es la integración, no las clases.
