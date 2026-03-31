# GoBeyond: arquitectura inicial

## Objetivo

Mover la plataforma desde una vista aislada con contenido hardcoded hacia una aplicacion evolutiva donde:

- el frontend renderiza datos, no texto quemado
- el contenido se administra desde una Web UI
- existe un backend responsable de persistencia y reglas de negocio
- mas adelante se pueda conectar autenticacion, pagos y acceso por 45 dias

## Estructura propuesta

### Frontend

- `src/features/platform/GoBeyondApp.jsx`
  Punto de entrada de la experiencia.
- `src/features/platform/PublicExperience.jsx`
  Vista del estudiante.
- `src/features/platform/AdminExperience.jsx`
  Vista administrativa para crear y editar contenido.
- `src/hooks/useGoBeyondContent.js`
  Orquesta carga y mutaciones del contenido.
- `src/services/contentApi.js`
  Capa de acceso a datos; hoy usa memoria, luego puede usar HTTP.

### Backend

- `server/server.js`
  API REST minima con Node nativo.
- `server/contentStore.js`
  Capa de persistencia.
- `server/store/content-store.json`
  Persistencia temporal basada en archivo.

## Base de datos recomendada

Como quieres que la base de datos sea manejada por ustedes mismos, la recomendacion es:

- PostgreSQL autohospedado
- backend propio como unica capa con acceso a la base
- backups diarios y restauracion probada
- credenciales fuera del frontend y fuera del repositorio

## Zero-trust aplicado

- frontend solo consume endpoints permitidos por rol
- contenido publico y operaciones admin estan separados
- el panel admin requiere autenticacion y token Bearer
- el backend valida origen, payload, sesion y rol
- las acciones administrativas se auditan
- ningun permiso sensible depende del frontend

## Modelo funcional recomendado para la siguiente fase

1. Autenticacion
   Admin, estudiante y profesor.
2. Base de datos real
   PostgreSQL autogestionado.
3. Reglas de acceso
   Fecha de compra, fecha de expiracion a 45 dias y renovacion por suscripcion.
4. Modulos de contenido
   Cursos, clases, recursos descargables, sesiones en vivo y grabaciones.
5. Pagos
   Integrar despues con el proveedor que elijan.

## Decision recomendada

Si quieres que GoBeyond sea un producto real y no solo un prototipo visual, el siguiente salto correcto es:

- migrar a `React + router + backend REST`
- conectar persistencia real
- proteger el panel admin con login
- modelar estudiantes, cursos, sesiones y suscripciones
