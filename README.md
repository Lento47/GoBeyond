# GoBeyond

Plataforma educativa construida sobre Cloudflare para servir la experiencia publica, la operacion administrativa y flujos autenticados para estudiantes y profesores desde una sola base de codigo.

## Que incluye este repositorio

- Frontend en `React + Vite`
- API serverless con `Cloudflare Pages Functions`
- Persistencia SQL en `Cloudflare D1`
- Archivos y media en `Cloudflare R2`
- Proteccion de formularios con `Cloudflare Turnstile`
- Flujos de autenticacion, recuperacion de contrasena y verificacion por correo

## Stack tecnico

- `React 18`
- `Vite 6`
- `Cloudflare Pages`
- `Cloudflare Functions / Workers runtime`
- `Cloudflare D1`
- `Cloudflare R2`
- `Tailwind CSS 4`

## Modulos principales

- Experiencia publica con contenido editorial y recursos multimedia
- Panel administrativo para contenido, usuarios, matriculas y SOPs
- Area de estudiante con dashboard, comunidad, tickets y notificaciones
- Area de profesor con cursos, asignaciones, soporte y seguimiento de matriculas
- Webhooks y automatizaciones para ingestion de contenido externo

## Estructura del proyecto

```text
.
|- src/               Frontend de la aplicacion
|- functions/         Endpoints serverless de Cloudflare Pages
|- server/            Logica compartida de negocio y acceso a datos
|- migrations/        Migraciones SQL para D1
|- docs/              Documentacion tecnica y de arquitectura
|- public/            Assets estaticos
|- dist/              Build de produccion generado por Vite
```

## Primer arranque local

1. Instala dependencias:

```powershell
npm install
```

2. Crea tu archivo de entorno a partir del ejemplo:

```powershell
Copy-Item .env.example .env
```

3. Si todavia no existe, crea la base D1:

```powershell
wrangler d1 create gobeyond-db
```

4. Coloca el `database_id` correcto en [wrangler.toml](/L:/PROJECTS/GoBeyond/wrangler.toml).

5. Aplica las migraciones locales:

```powershell
npm run cf:migrate:local
```

6. Genera el frontend:

```powershell
npm run build
```

7. Ejecuta Pages + Functions localmente:

```powershell
npm run cf:dev
```

8. Abre la aplicacion en:

```text
http://localhost:8788
```

## Scripts disponibles

```powershell
npm run dev
npm run build
npm run preview
npm run cf:dev
npm run cf:deploy
npm run cf:migrate:local
npm run cf:migrate:remote
```

## Variables de entorno importantes

Toma como base [`.env.example`](/L:/PROJECTS/GoBeyond/.env.example). Estas son las mas relevantes para levantar o desplegar el proyecto:

- `APP_ORIGIN`
- `GOBEYOND_BOOTSTRAP_SECRET`
- `GOBEYOND_TOKEN_SIGNING_KEY`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `EMAIL_REPLY_TO`

Para correos transaccionales tambien puedes configurar:

- `RESEND_TEMPLATE_AUTH`
- `RESEND_TEMPLATE_VERIFY`
- `RESEND_TEMPLATE_RESET`
- `RESEND_TEMPLATE_ENROLLMENT`

Si prefieres usar webhooks propios para emails:

- `RESET_EMAIL_WEBHOOK_URL`
- `RESET_EMAIL_WEBHOOK_SECRET`
- `AUTH_EMAIL_WEBHOOK_URL`
- `AUTH_EMAIL_WEBHOOK_SECRET`

## Endpoints de referencia

### Salud y contenido publico

- `GET /api/health`
- `GET /api/public/content`
- `GET /api/public/media`
- `GET /api/public/testimonials`

### Autenticacion

- `POST /api/auth/bootstrap`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/send-verification`
- `POST /api/auth/verify-email`
- `POST /api/auth/switch-role`

### Admin

- `GET /api/admin/content`
- `PUT /api/admin/content/:section`
- `POST /api/admin/collections/:section`
- `DELETE /api/admin/collections/:section?id=...`
- `GET /api/admin/users`
- `GET /api/admin/enrollments`
- `GET /api/admin/sops`
- `POST /api/admin/uploads`

### Estudiante y profesor

- `GET /api/student/dashboard`
- `GET /api/student/community`
- `POST /api/student/tickets`
- `GET /api/teacher/dashboard`
- `GET /api/teacher/courses`
- `GET /api/teacher/assignments`

## Seguridad

- Separacion entre rutas publicas, administrativas y autenticadas por rol
- Sesiones validadas en backend
- Auditoria de acciones administrativas
- Edicion de contenido protegida por autenticacion
- Integracion preparada para Turnstile y secretos por entorno

## Despliegue

Para publicar en Cloudflare Pages:

```powershell
npm run build
npm run cf:deploy
```

Antes de desplegar, confirma:

- que `wrangler.toml` tenga el `database_id` correcto
- que los bindings de `DB`, `AI` y `MEDIA_BUCKET` existan en tu proyecto
- que los secretos productivos hayan sido configurados en Cloudflare

## Documentacion adicional

- [Arquitectura inicial](/L:/PROJECTS/GoBeyond/docs/gobeyond-architecture.md)
- [Hardening de seguridad en Cloudflare](/L:/PROJECTS/GoBeyond/docs/cloudflare-security-hardening.md)

## Estado del proyecto

Este repositorio ya cubre una base funcional para evolucionar GoBeyond como producto: frontend, API, autenticacion, panel admin y persistencia administrada en Cloudflare. Si vas a subirlo a GitHub, este README ya sirve como punto de entrada para developers, colaboradores y despliegues.
