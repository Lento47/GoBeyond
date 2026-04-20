# Make.com webhook payloads

Este proyecto acepta un `POST` JSON al webhook con el header `X-Secret-Token`.

## Endpoint

- Pages/Functions integrado en este repo: `POST https://gobeyondcr.org/webhook`
- Worker standalone de ejemplo: `POST https://<tu-worker>/webhook`

## Headers requeridos

```http
Content-Type: application/json
X-Secret-Token: <WEBHOOK_SECRET>
```

## Payload esperado por el backend

```json
{
  "titulo": "string",
  "contenido": "string",
  "imagen_url": "string o null",
  "url_original": "string",
  "fuente": "facebook, linkedin o instagram",
  "source_id": "opcional, id de social_sources"
}
```

`source_id` es opcional, pero recomendado para asociar la publicacion con una fuente configurada desde el admin.

## A) Facebook Page Post

### Modulos Make sugeridos

- `Facebook Pages > Watch Posts`
- `HTTP > Make a request` para enviar el webhook

### Mapeo recomendado

- `titulo`: usar el inicio del campo `message` o un texto derivado tipo `Publicacion de Facebook`
- `contenido`: `message`
- `imagen_url`: primera imagen disponible del post, por ejemplo `attachments.data[1].media.image.src`
- `url_original`: `permalink_url`
- `fuente`: `"facebook"`
- `source_id`: `"source-facebook-gobeyond"` o el id que exista en `social_sources`

### JSON de ejemplo

```json
{
  "titulo": "Go Beyond comparte una nueva publicacion",
  "contenido": "{{1.message}}",
  "imagen_url": "{{1.attachments.data[].media.image.src}}",
  "url_original": "{{1.permalink_url}}",
  "fuente": "facebook",
  "source_id": "source-facebook-gobeyond"
}
```

### Notas

- Si el post no trae imagen, enviar `null` o `""` en `imagen_url`.
- Si `message` viene vacio, Make puede construir un titulo fijo y reutilizarlo en `contenido` con un fallback.

## B) LinkedIn Company Update

### Modulos Make sugeridos

- `LinkedIn > Watch Organization Posts` o el modulo equivalente disponible en tu cuenta
- `HTTP > Make a request` para enviar el webhook

### Mapeo recomendado

- `titulo`: usar el inicio del texto publicado o un texto derivado tipo `Actualizacion de LinkedIn`
- `contenido`: texto del update, por ejemplo commentary/text content
- `imagen_url`: URL del asset o thumbnail si existe
- `url_original`: URL publica del post compartido
- `fuente`: `"linkedin"`
- `source_id`: `"source-linkedin-gobeyond"` o el id que exista en `social_sources`

### JSON de ejemplo

```json
{
  "titulo": "Go Beyond publica una actualizacion en LinkedIn",
  "contenido": "{{1.text}}",
  "imagen_url": "{{1.imageUrl}}",
  "url_original": "{{1.postUrl}}",
  "fuente": "linkedin",
  "source_id": "source-linkedin-gobeyond"
}
```

### Notas

- Los nombres exactos de campos en LinkedIn pueden variar segun el modulo Make habilitado; lo importante es mapear el texto del post, la URL publica y la imagen si existe.
- Si el modulo no entrega un titulo nativo, Make debe derivarlo a partir de los primeros caracteres del texto.

## C) Instagram Business / Creator Post

### Modulos Make sugeridos

- `Instagram for Business > Watch Media` o el modulo equivalente disponible en tu cuenta
- `HTTP > Make a request` para enviar el webhook

### Mapeo recomendado

- `titulo`: usar el inicio del caption o un texto derivado tipo `Publicacion de Instagram`
- `contenido`: `caption`
- `imagen_url`: `media_url` o thumbnail del reel/post
- `url_original`: `permalink`
- `fuente`: `"instagram"`
- `source_id`: `"source-instagram-gobeyond"` o el id que exista en `social_sources`

### JSON de ejemplo

```json
{
  "titulo": "Go Beyond publica en Instagram",
  "contenido": "{{1.caption}}",
  "imagen_url": "{{1.media_url}}",
  "url_original": "{{1.permalink}}",
  "fuente": "instagram",
  "source_id": "source-instagram-gobeyond"
}
```

### Notas

- Si el modulo entrega un reel sin `media_url` directo, usa el thumbnail disponible.
- Si no hay caption, Make debe construir un titulo fallback y puede enviar ese mismo texto como contenido.

## Extensibilidad para futuras redes

- Crear una nueva fuente desde el admin con plataforma `instagram`.
- Agregar un nuevo escenario o una nueva rama en Make para esa cuenta.
- Cuando el backend habilite otra plataforma, Make podra empezar a enviar:

```json
{
  "titulo": "Publicacion social",
  "contenido": "<caption>",
  "imagen_url": "<media_url>",
  "url_original": "<permalink>",
  "fuente": "<plataforma>",
  "source_id": "<id-configurado>"
}
```

Hoy la automatizacion activa en backend queda lista para Facebook, LinkedIn e Instagram.
