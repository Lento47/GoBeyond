# Cloudflare Security Hardening

## Baseline recomendado

1. Activa el `Cloudflare Free Managed Ruleset` en el dominio.
2. Crea una aplicacion de `Cloudflare Access` para:
   - `/admin*`
   - `/api/admin/*`
3. Usa una politica `Allow` con lista explicita de correos admin y metodo `One-Time PIN`.
4. Mantén `Bot Fight Mode` apagado en esta fase inicial para no interferir con flujos API/browser.

## Rate limiting en Cloudflare Free

Usa la regla disponible para cubrir `POST` anonimos sensibles en el borde:

- Expresion sugerida:
  - `http.request.method eq "POST" and starts_with(http.request.uri.path, "/api/auth/")`
  - o agrupa tambien `/api/public/testimonials`
- Accion:
  - `Managed Challenge` o `Block` temporal segun el nivel de abuso real

La app ya aplica throttling fino por ruta; esta regla solo da una capa amplia adicional.

## Turnstile

Configura dos secretos por entorno:

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

Recomendaciones:

- Restringe el widget por hostname.
- Usa llaves separadas para produccion y preview.
- Mantén Turnstile en:
  - registro
  - recuperacion de contrasena
  - reenvio de verificacion
  - testimonios publicos

## Headers y transforms

La app ya incluye:

- headers API desde Functions
- `public/_headers` para Pages

Si necesitas reforzarlos a nivel zona, usa:

- `Managed Transforms`
- `Response Header Transform Rules`

## Access paths sugeridos

- Aplicacion 1:
  - `https://tu-dominio/admin*`
- Aplicacion 2:
  - `https://tu-dominio/api/admin/*`

Con esto agregas una barrera previa al login interno sin cambiar la app.

## Checklist de despliegue

- Cargar `TURNSTILE_SECRET_KEY` como secreto en Cloudflare.
- Confirmar `TURNSTILE_SITE_KEY` en `vars`.
- Verificar que `/api/public/content` expone `securityPublic.enabled: true`.
- Validar que `/admin` pida Access antes del login.
- Revisar que los embeds permitidos sigan renderizando.

## Referencias oficiales

- Turnstile: https://developers.cloudflare.com/turnstile/get-started/
- WAF: https://developers.cloudflare.com/waf/
- Managed Rules: https://developers.cloudflare.com/waf/managed-rules/
- Rate limiting rules: https://developers.cloudflare.com/waf/rate-limiting-rules/
- Cloudflare Access: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/
- Application paths: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- Pages headers: https://developers.cloudflare.com/pages/configuration/headers/
- Managed Transforms: https://developers.cloudflare.com/rules/transform/managed-transforms/
