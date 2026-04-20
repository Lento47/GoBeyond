# GoBeyond DB

## Decision

La base de datos sera autogestionada por el equipo de GoBeyond.

La recomendacion para este proyecto es:

- PostgreSQL instalado en un VPS propio o servidor propio
- backups automáticos diarios
- acceso privado por VPN o firewall por IP
- API backend como unico consumidor directo de la base

## Por que PostgreSQL

- maduro y estable
- excelente para relaciones como usuarios, cursos, clases y progreso
- soporta bien crecimiento gradual
- permite mover luego archivos y reportes sin rediseñar todo

## Principios

- la Web UI nunca se conecta directo a la base
- solo el backend tiene credenciales
- el backend aplica autenticacion, autorizacion y reglas de acceso
- el acceso de 45 dias debe calcularse en backend, no en frontend

## Regla de acceso inicial

Al matricular un estudiante:

- `access_start_at = fecha de activacion`
- `access_end_at = access_start_at + 45 dias`

Si luego paga continuidad:

- `subscription_status = active`
- el backend decide si mantiene acceso continuo segun el estado del pago

## Siguiente implementacion recomendada

1. Instalar PostgreSQL autohospedado.
2. Crear una API Node/Express o Node/Fastify.
3. Usar un ORM o query builder.
   Recomendado: Prisma o Drizzle.
4. Proteger panel admin con login.
5. Mover la UI admin para consumir endpoints reales.
