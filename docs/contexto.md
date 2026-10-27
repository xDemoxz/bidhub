# Contexto del proyecto: BidHub (Simulacro de prueba de desempeño)

> Fuente de verdad del alcance: enunciado en el gist
> https://gist.github.com/carlosdcastano/a87d1d3d50ec121f5786bd010325119d
> Convención de este documento:
> - **[Enunciado]** = viene impuesto por el gist, no se negocia.
> - **[Propuesta]** = lo propone el agente, espera tu aprobación.
> - **[Por confirmar]** = dato que solo tú puedes dar.

---

## 1. Identificación
- **Tipo:** Riwi (simulacro de prueba de desempeño)
- **Tamaño:** mediano
  (propuesto por el agente: mediano, porque son ~16 áreas técnicas pero con un dominio acotado de 5 entidades · confirmado por mí: **[Por confirmar]**)
- **Modo por defecto:** ensamble (recomendado) · **[Por confirmar]**
- **Trabajo por:** tareas (por defecto) · si lo declaras epic, el modo aplica a toda la epic: **[Por confirmar]**
- **Fase actual:** fase 2 (alcance) cerrada con este documento; sigue fase 3 (decisiones técnicas) y fase 4 (datos)

## 2. Negocio (fase 1)
- **Problema que resuelve:** las personas que coleccionan artículos (cartas, relojes, vinilos, figuras) no tienen un lugar donde vender a quien más ofrezca y comprar con reglas claras y transparentes.
- **Para quién:**
  - **Usuario:** se registra, explora subastas, publica las suyas y oferta en las de otros. Puede ser vendedor y postor a la vez.
  - **Administrador:** todo lo del usuario, más gestionar categorías y cancelar subastas como moderador. Se crea por seed, nunca desde el registro público.
- **Qué NO es:**
  - No consume una API externa: toda la información vive en base de datos propia y se expone con route handlers de Next.js **[Enunciado]**.
  - No procesa pagos ni envíos (el enunciado no los menciona).
  - No tiene cierre de subastas por tareas programadas ni procesos externos (regla 13).
  - No tiene notificaciones, chat ni favoritos (no están en el enunciado).
- **En 3 frases:** BidHub es una plataforma fullstack de subastas en línea de artículos de colección. Los usuarios publican artículos con precio inicial, incremento mínimo y fecha de cierre, y otros usuarios ofertan hasta que cierra. Las reglas (quién puede ofertar, cuánto, cuándo cierra, quién gana) se garantizan en el backend.

## 3. Alcance (fase 2)

- **Flujo principal:**
  1. Visitante entra al Home y al catálogo público (filtros por categoría y estado) y ve el detalle con historial de ofertas.
  2. Se registra e inicia sesión (cookies httpOnly; renovación automática del access token).
  3. Publica una subasta (precio inicial, incremento mínimo, cierre entre 1 hora y 7 días, categoría).
  4. Otro usuario oferta; si faltan 5 min o menos, el cierre se extiende 5 min.
  5. Al llegar el cierre, la subasta queda **cerrada** (con ganador), **desierta** (sin ofertas) o fue **cancelada**.
  6. En su Dashboard cada usuario ve sus subastas y sus ofertas.
  7. El administrador gestiona categorías y modera subastas.

- **Requisitos funcionales [Enunciado]:**
  - RF-1 Registro e inicio de sesión.
  - RF-2 Catálogo público con filtro por categoría y por estado.
  - RF-3 Detalle de subasta con historial de ofertas.
  - RF-4 Publicar subasta (usuario autenticado).
  - RF-5 Ofertar (usuario autenticado).
  - RF-6 Ver mis subastas publicadas y mis ofertas realizadas.
  - RF-7 Administrador: CRUD de categorías y cancelación de subastas.

- **Reglas de negocio [Enunciado]** (numeración del gist, para trazabilidad y para tests):

| # | Regla | Grupo |
|---|---|---|
| 1 | Al publicar: precio inicial > 0, incremento mínimo > 0 y fecha de cierre | Publicación |
| 2 | Cierre entre 1 hora y 7 días desde la publicación | Publicación |
| 3 | Toda subasta pertenece a una categoría existente | Publicación |
| 4 | Máximo 5 subastas activas por usuario como vendedor | Publicación |
| 5 | Editar solo si no tiene ofertas y está activa | Publicación |
| 6 | No se puede ofertar en la propia subasta | Ofertas |
| 7 | Solo se oferta en subasta activa (no cancelada y con cierre no vencido) | Ofertas |
| 8 | Primera oferta ≥ precio inicial; siguientes ≥ oferta más alta + incremento mínimo | Ofertas |
| 9 | Quien tiene la oferta más alta no puede volver a ofertar en esa subasta | Ofertas |
| 10 | Las ofertas no se editan ni se eliminan | Ofertas |
| 11 | Oferta con ≤ 5 min para el cierre extiende el cierre 5 min; se repite cuantas veces ocurra | Ofertas |
| 12 | Cuatro estados: activa, cerrada (ganador = oferta más alta), desierta (sin ofertas), cancelada | Cierre |
| 13 | El estado es correcto en cualquier consulta, sin cron ni procesos externos | Cierre |
| 14 | El vendedor cancela solo si no hay ofertas | Cancelación |
| 15 | El admin cancela cualquier subasta activa (aun con ofertas) con motivo obligatorio registrado | Cancelación |
| 16 | Subasta cancelada o cerrada no se elimina; se conserva con historial | Cancelación |
| 17 | Categoría con subastas asociadas no se puede eliminar | Categorías |
| 18 | Historial público muestra monto y fecha, con alias parcial del postor (sin nombre completo ni correo) | Privacidad |
| 19 | Un usuario no edita ni cancela subastas ajenas, aunque cambie el id en la URL | Seguridad |
| 20 | Un usuario solo ve el listado completo de sus propias ofertas | Seguridad |

- **Requisitos técnicos [Enunciado]:**

| # | Área | Qué exige |
|---|---|---|
| T1 | Estructura | Next.js 16, App Router, TypeScript; carpetas y componentes ordenados; sin arquitectura obligatoria |
| T2 | Rutas | Route groups `(public)`, `(auth)`, `(private)`, `(admin)`; ruta dinámica `[id]` para el detalle |
| T3 | Páginas mínimas | Home, Catálogo, Detalle, Registro, Login, Dashboard (mis subastas y mis ofertas), Publicar subasta, Panel de administración |
| T4 | Layouts | Root layout + un layout por group: public (navbar y footer), auth (centrado y simple), private (navbar con menú de usuario), admin (propio) |
| T5 | Componentes | Compartidos y reutilizables (navbar, footer, botones, formularios, tarjetas); estilos libres |
| T6 | Renderizado | SSG: Home · SSR: catálogo y detalle · CSR: dashboard |
| T7 | Route handlers | Auth (registro, login, refresh, logout); subastas (listar, detalle, crear, editar, cancelar); ofertas (crear, historial de una subasta, listar las propias); categorías (listar público; crear, editar y eliminar admin); moderación (cancelar como admin). Todos validan entrada y responden error consistente con 400, 401, 403, 404, 409 |
| T8 | Datos | Modelo relacional coherente; ORM a elección (Prisma, TypeORM, MikroORM, Drizzle); migraciones; seed (admin, categorías, subastas en los 4 estados); PostgreSQL en Supabase; reglas garantizadas en backend |
| T9 | Auth | Contraseñas hasheadas; access y refresh token en cookies `httpOnly`, `secure`, `sameSite`; nada en localStorage ni en el body; refresh token hasheado en BD y revocado en logout; renovación sin re-login; los handlers validan sesión y rol por sí mismos |
| T10 | Proxy | `proxy.ts` protege rutas privadas (redirige a login) y de admin (bloquea a no admin) |
| T11 | i18n | Español e inglés con selector de idioma visible; solución libre |
| T12 | Hidratación | Al menos un componente dependiente del cliente (cuenta regresiva) sin errores de hidratación |
| T13 | Optimización | `next/image` para las imágenes de los artículos |
| T14 | Docker | Dockerfile que construya y ejecute la app; compose opcional |
| T15 | Entorno | `.env.example` completo, sin secretos (DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRES_IN=15m, REFRESH_TOKEN_EXPIRES_IN=7d) |
| T16 | README | Entregable evaluado (ver sección 10) |
| T17 | Despliegue | BD en Supabase, app en Vercel, con handlers, rutas dinámicas y auth funcionando |
| T18 | Calidad | TypeScript sin `any`; nombres claros; funciones de una responsabilidad; sin duplicación |

- **MVP (lo mínimo para estar terminado):** RF-1 a RF-7 + reglas 1 a 20 + T1 a T18. Todo lo anterior es obligatorio en el enunciado.
- **Después (fuera del MVP, puntos extra [Enunciado]):**
  - Rate limiting en login y ofertas.
  - Idempotencia al crear ofertas.
  - Manejo de concurrencia cuando dos usuarios ofertan a la vez.
  - `docker-compose`.
  - Pipeline de CI.
  - Pruebas de al menos una regla de negocio.

## 4. Decisiones técnicas (fase 3)

> Lo impuesto está marcado **[Enunciado]**; el resto son **[Propuesta]** hasta que apruebes. "Mi nivel" lo completas tú.

| Pieza | Tecnología | Por qué | Mi nivel |
|---|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript **[Enunciado]** | Fullstack en un solo proyecto: páginas y route handlers | [Por confirmar] |
| Estilos | Tailwind CSS **[Propuesta]** | Estilos libres; ya lo usas, así no gastas tiempo aprendiendo CSS nuevo | [Por confirmar] |
| Backend | Route handlers de Next.js **[Enunciado]** | No se permite API externa | [Por confirmar] |
| Validación | Zod **[Propuesta]** | Un esquema valida entrada y da los tipos TS (cumple "sin any") | nuevo / práctica |
| Auth | JWT propio con cookies httpOnly **[Enunciado]**; librería `jose` **[Propuesta]** | `jose` funciona en `proxy.ts` y en handlers; no se usa Supabase Auth porque el enunciado pide access y refresh propios | nuevo |
| Hash de contraseña | `bcrypt` o `argon2` **[Propuesta: elegir uno]** | Contraseñas hasheadas **[Enunciado]**; bcrypt es más común y simple | [Por confirmar] |
| Base de datos | PostgreSQL en Supabase **[Enunciado]** | Imposición del enunciado; Supabase solo se usa como hosting de Postgres | [Por confirmar] |
| ORM | Prisma **[Propuesta]** | Migraciones y seed integrados y tipos generados; es de las 4 opciones del enunciado | [Por confirmar] |
| i18n | `next-intl` **[Propuesta]** | Solución libre; encaja con App Router y SSR | nuevo |
| Imágenes | `next/image` **[Enunciado]** | Obligatorio para imágenes de artículos | [Por confirmar] |
| Docker | Dockerfile **[Enunciado]**; compose opcional | Ver sección 6 | [Por confirmar] |
| Despliegue | Vercel (app) + Supabase (BD) **[Enunciado]** | Imposición del enunciado | [Por confirmar] |
| Pruebas | Vitest **[Propuesta, solo si llegamos a puntos extra]** | Para probar al menos una regla de negocio | nuevo |

## 5. Datos (fase 4)
- **Entidades principales [Propuesta, parte del DER en fase 4]:**

| Entidad | Campos clave | Notas |
|---|---|---|
| User | id, nombre, email (único), passwordHash, rol (USER / ADMIN), createdAt | El ADMIN solo nace en el seed |
| Category | id, nombre (único) | No se borra si tiene subastas (regla 17) |
| Auction | id, sellerId, categoryId, título, descripción, imagen, precio inicial, incremento mínimo, cierre actual (se extiende), createdAt, cancelledAt, cancelReason, cancelledById | El estado **no se guarda** salvo la cancelación: se calcula al consultar (regla 13) |
| Bid | id, auctionId, bidderId, monto, createdAt | Inmutable (regla 10); la oferta más alta se deduce del monto |
| RefreshToken | id, userId, tokenHash, expiresAt, revokedAt | Se guarda hasheado; el logout lo revoca |

- **Relaciones:** User 1—N Auction (vendedor) · User 1—N Bid (postor) · Category 1—N Auction · Auction 1—N Bid · User 1—N RefreshToken.
- **Estado de una subasta (derivado):** cancelada si `cancelledAt` existe; si no, activa si ahora < cierre; si no, cerrada si tiene ofertas, desierta si no.
- **Estado del DER:** no iniciado (siguiente paso, fase 4; enlace en docs/ cuando exista)

## 6. Convenciones
- **Idioma de commits y documentación:** español **[Por confirmar]**
- **Clave de Jira:** **[Por confirmar]** (si no usas Jira para el simulacro: "sin Jira")
- **Estructura de ramas:** según 06-convenciones-git.md (ajustes: ninguno por ahora)
- **Docker:** compose de desarrollo: no en el MVP (es punto extra; se puede pasar a sí si llegamos) · Dockerfile: sí, obligatorio, al final

## 7. Equipo (G)
- **Integrantes y rol de cada uno:** simulacro individual **[Por confirmar]**
- **Mi rol:** desarrollador único (frontend, backend, datos, documentación y despliegue)

## 8. Plazo y restricciones
- **Fecha de entrega:** **[Por confirmar]** (el gist se publicó el 25 de octubre de 2026)
- **Tiempo disponible por día/semana:** **[Por confirmar]**
- **Criterios de evaluación o requisitos impuestos:**
  - El README es un entregable evaluado y se penaliza si el proyecto no se puede ejecutar siguiendo solo el README.
  - Cumplimiento de las 20 reglas de negocio en el backend.
  - Rutas con route groups y layouts propios por grupo.
  - Estrategia de renderizado correcta por página (SSG, SSR, CSR).
  - Seguridad de auth (cookies, refresh hasheado, revocación).
  - App desplegada y funcionando.
  - Calidad de código: sin `any`, sin duplicación, funciones de una responsabilidad.
- **Restricciones técnicas obligatorias:** Next.js 16 + App Router + TypeScript; sin API externa; PostgreSQL en Supabase; deploy en Vercel; tokens solo en cookies; `proxy.ts`; `next/image`; Dockerfile; `.env.example`.

## 9. Objetivos de aprendizaje
- **Qué quiero aprender o practicar en este proyecto [Propuesta basada en el enunciado, confirma o ajusta]:**
  - Route groups y layouts anidados en App Router.
  - Diferencia práctica entre SSG, SSR y CSR.
  - Route handlers con validación y errores consistentes.
  - Auth con access y refresh token en cookies (flujo completo).
  - Protección de rutas con `proxy.ts` y por qué los handlers validan por su cuenta.
  - Hidratación (cuenta regresiva sin errores) e i18n.
  - Reglas de negocio garantizadas en backend, incluida la concurrencia.
  - Docker y despliegue Vercel + Supabase.
- **Qué NO quiero que me compliquen:** **[Por confirmar]** (sugerencia: nada de capas ni patrones sin justificación; el enunciado dice que no exige arquitectura específica)

## 10. Definición de terminado
- [ ] MVP funcionando (RF-1 a RF-7, reglas 1 a 20, T1 a T18)
- [ ] Documentación y notas de aprendizaje al día (`docs/aprendizaje/`)
- [ ] Checklist de cierre completo (fase 9)
- [ ] Criterios de entrega cumplidos:
  - [ ] README con las 10 secciones: descripción breve · requisitos previos · variables de entorno explicadas (para qué sirve, qué valor lleva, cómo obtenerlo) · ejecución en desarrollo en orden (clonar e instalar, `.env`, migraciones, seed, dev) · credenciales del admin del seed · ejecución con Docker (build, run y variables) · scripts del `package.json` · estructura de carpetas · URL desplegada
  - [ ] Probado desde cero siguiendo solo el README
  - [ ] `.env.example` completo y sin secretos
  - [ ] Dockerfile construye y ejecuta
  - [ ] Seed crea admin, categorías y subastas en los 4 estados
  - [ ] Desplegado en Vercel con BD en Supabase, y auth, handlers y rutas dinámicas funcionando
  - [ ] TypeScript sin `any`

## 11. Riesgos e incógnitas (G)

| Qué no sé o qué podría fallar | Cómo lo reduzco |
|---|---|
| Estado de subasta calculado al consultar (regla 13): si se calcula en un solo lugar y se olvida en otro, hay inconsistencias | Una única función de dominio que calcule el estado y se use en catálogo, detalle, ofertas y dashboard |
| Reglas 8, 9 y 11 con ofertas simultáneas: dos ofertas a la vez pueden pasar la validación | Validar y guardar dentro de una transacción; el bloqueo de filas y la idempotencia quedan para puntos extra |
| Flujo de refresh: renovar el access token sin que el usuario lo note es fácil de hacer mal | Dibujar el flujo antes de codificar; probar con access token expirado a propósito |
| `proxy.ts` no basta: el enunciado exige que los handlers validen sesión y rol por su cuenta | Un helper de autorización compartido que usen todos los handlers |
| Home como SSG con datos que cambian | Decidir qué muestra el Home (ver sección 13) |
| Errores de hidratación en la cuenta regresiva (fecha del servidor vs. cliente) | Renderizar la cuenta en cliente después de montar |
| Tiempo: son 18 áreas técnicas y el README se evalúa | Construir por features en orden y dejar el README y el despliegue con tiempo reservado, no al último día |
| El deploy en Vercel + Supabase puede fallar por conexión a BD (pooler) o variables | Desplegar una versión mínima temprano, no al final |

## 12. Decisiones tomadas

| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-10-27 | El gist de BidHub es la fuente de verdad del alcance y del criterio de evaluación | Es el enunciado oficial del simulacro |
| 2026-10-27 | Modo **efectivo** para toda la epic | Se necesita el proyecto listo como base de la prueba |
| 2026-10-27 | Excepción: comentarios explicativos en el código, con marcas `REGLA N:` y `ADAPTAR:` | Servirán de guía para adaptar la base a la lógica nueva de la prueba |
| 2026-10-27 | Stack: Prisma, Zod, jose (JWT), bcryptjs, next-intl, Tailwind | Aprobado ("procede") |
| 2026-10-27 | Regla 11: se suman 5 min al cierre vigente | Propuesta aceptada |
| 2026-10-27 | Home estática (SSG) con categorías; imágenes por URL externa | Propuesta aceptada |
| 2026-10-27 | Alias del postor `An***`; sin paginación en el MVP (límite 100) | Propuesta aceptada |
| 2026-10-27 | Sin Jira: solo Git con commits convencionales en español (main, develop, feat/*) | Indicación del usuario |
| 2026-10-27 | Mantener Prisma aunque no se pudo verificar `migrate` en el entorno de desarrollo | Decisión del usuario |

## 13. Estado actual
- **Última sesión:** 2026-10-27, MVP completo (modelo, reglas, auth, API, interfaz, Docker, README, notas).
- **Próximo paso:** en tu máquina, verificar con `npm run db:migrate` que no haya diferencias con la migración escrita a mano, construir la imagen Docker y desplegar (Vercel + Supabase).
- **Pendientes:** despliegue, extras (rate limiting de login y ofertas, idempotencia de ofertas, CI), edición de subastas en la UI y paginación.
