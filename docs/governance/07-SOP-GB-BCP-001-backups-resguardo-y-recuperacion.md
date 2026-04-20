# SOP-GB-BCP-001 - SOP de Backups, Resguardo y Recuperacion Operativa de GoBeyond

## Identificacion del documento
- Codigo: `SOP-GB-BCP-001`
- Version: `1.0`
- Estado: `Vigente`
- Fecha de emision: `05 de abril de 2026`
- Area responsable: `Tecnologia / Continuidad Operativa`
- Elaborado por: `Lejzer Trana`
- Revisado por: `Lejzer Trana`
- Aprobado por: `Lejzer Trana`

## Objetivo
Definir el procedimiento para resguardar y recuperar la informacion critica y los componentes esenciales de GoBeyond, asegurando continuidad operativa ante incidentes o perdida de informacion.

## Alcance
Aplica a base de datos, biblioteca documental, archivos criticos, configuraciones esenciales documentadas y demas evidencia operativa que soporte la continuidad del servicio.

## Responsables
- Responsable de Tecnologia.
- Administracion GoBeyond.
- Responsable documental.
- Autoridad designada para continuidad, cuando exista.

## Politicas y lineamientos
1. Todo activo critico debera tener un mecanismo de respaldo definido.
2. Los respaldos deberan revisarse y verificarse periodicamente.
3. Toda recuperacion debera ejecutarse de forma controlada y quedar documentada.
4. Los respaldos no sustituyen los controles de acceso ni la auditoria.

## Activos minimos a resguardar
- Base de datos operativa.
- Biblioteca de SOPs y documentos oficiales.
- Archivos criticos cargados a la plataforma.
- Matriz documental y registros clave de operacion.
- Configuraciones no secretas documentadas por entorno.

## Procedimiento de respaldo
1. Identificar activos criticos sujetos a respaldo.
2. Ejecutar respaldo segun periodicidad definida.
3. Verificar integridad basica del respaldo.
4. Almacenar respaldo en ubicacion autorizada.
5. Registrar fecha, responsable y resultado.

## Procedimiento de recuperacion
1. Identificar el evento, la perdida o la afectacion.
2. Determinar el alcance de recuperacion requerido.
3. Seleccionar el respaldo valido mas reciente o el aprobado por la organizacion.
4. Ejecutar la recuperacion en entorno controlado.
5. Validar funcionamiento posterior y consistencia de la informacion.
6. Registrar el resultado y cualquier desviacion detectada.

## Registros / evidencias
- Bitacora de respaldo.
- Bitacora de restauracion.
- Inventario de activos criticos.
- Resultado de pruebas de recuperacion.
- Registro de incidentes asociados a continuidad.

## Indicadores
- Numero de respaldos ejecutados versus programados.
- Numero de pruebas de recuperacion realizadas.
- Porcentaje de recuperaciones exitosas.
- Tiempo de recuperacion observado en pruebas o eventos reales.

## Control de cambios
| Version | Fecha | Descripcion del cambio |
|---|---|---|
| 1.0 | 05 de abril de 2026 | Emision inicial del SOP de Backups, Resguardo y Recuperacion Operativa de GoBeyond |
