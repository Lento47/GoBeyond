# GoBeyond on Cloudflare

Proyecto base de GoBeyond preparado para:

- Cloudflare Pages para el frontend
- Cloudflare Pages Functions / Workers para la API
- Cloudflare D1 para persistencia SQL

## Flujo recomendado

1. Instala dependencias:

```powershell
npm install
```

2. Crea la base D1:

```powershell
wrangler d1 create gobeyond-db
```

3. Copia el `database_id` en [wrangler.toml](/L:/PROJECTS/GoBeyond/wrangler.toml).

4. Configura el secreto bootstrap:

```powershell
wrangler secret put BOOTSTRAP_SECRET
```

5. Aplica migraciones localmente:

```powershell
npm run cf:migrate:local
```

6. Genera el frontend:

```powershell
npm run build
```

7. Levanta Pages + Functions + D1 local:

```powershell
npm run cf:dev
```

8. Abre:

```text
http://localhost:8788
```

## Deploy

```powershell
npm run build
npm run cf:deploy
```

## Endpoints principales

- `GET /api/health`
- `GET /api/public/content`
- `POST /api/auth/bootstrap`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/admin/content`
- `PUT /api/admin/content/:section`
- `POST /api/admin/collections/:section`
- `DELETE /api/admin/collections/:section?id=...`

## Zero-trust aplicado

- UI publica y admin separadas por endpoints
- login admin obligatorio
- sesion Bearer validada en backend
- auditoria guardada en D1
- contenido editable solo por rutas admin autenticadas
