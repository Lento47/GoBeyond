# FRM-GB-RSK-001 - Matriz de Riesgos y Controles de la Plataforma GoBeyond

## Identificacion del documento
- Codigo: `FRM-GB-RSK-001`
- Version: `1.0`
- Estado: `Vigente`
- Fecha de emision: `05 de abril de 2026`
- Area responsable: `Administracion / Tecnologia / Control Interno`
- Elaborado por: `Lejzer Trana`
- Revisado por: `Lejzer Trana`
- Aprobado por: `Lejzer Trana`

## Objetivo
Identificar, evaluar y controlar los riesgos operativos, tecnicos, documentales y de seguridad de GoBeyond, asignando responsables, evidencias y acciones de mitigacion.

## Alcance
Aplica a la operacion de la plataforma, sus procesos documentales, accesos, soporte, continuidad, archivos y componentes tecnicos.

## Escala de evaluacion
| Valor | Probabilidad | Impacto |
|---|---|---|
| 1 | Bajo | Bajo |
| 2 | Medio | Medio |
| 3 | Alto | Alto |

Nivel de riesgo = `Probabilidad x Impacto`

## Estructura de la matriz
| Campo | Descripcion |
|---|---|
| ID de riesgo | Consecutivo unico |
| Proceso | Proceso afectado |
| Riesgo identificado | Riesgo principal |
| Causa | Origen del riesgo |
| Consecuencia | Impacto esperado |
| Tipo de riesgo | Operativo / Tecnico / Seguridad / Documental / Continuidad / Academico |
| Probabilidad | 1 a 3 |
| Impacto | 1 a 3 |
| Nivel de riesgo | Resultado de la multiplicacion |
| Control existente | Control aplicado actualmente |
| Tipo de control | Preventivo / Detectivo / Correctivo |
| Responsable del control | Dueno del control |
| Evidencia del control | Registro verificable |
| Accion adicional requerida | Mejora pendiente |
| Estado | Abierto / En seguimiento / Mitigado / Cerrado |
| Fecha de revision | Fecha mas reciente |
| Proxima revision | Fecha siguiente comprometida |

## Matriz base
| ID de riesgo | Proceso | Riesgo identificado | Causa | Consecuencia | Tipo de riesgo | Probabilidad | Impacto | Nivel de riesgo | Control existente | Tipo de control | Responsable del control | Evidencia del control | Accion adicional requerida | Estado | Fecha de revision | Proxima revision |
|---|---|---|---|---|---|---:|---:|---:|---|---|---|---|---|---|---|---|
| R-001 | Accesos | Usuario opera fuera de su rol | Configuracion incorrecta o falta de revision | Exposicion o modificacion indebida | Seguridad | 2 | 3 | 6 | Validacion por rol y alcance en backend | Preventivo | Tecnologia / Administracion | Logs y pruebas de acceso | Revision mensual de permisos | En seguimiento | 05 de abril de 2026 | 05 de mayo de 2026 |
| R-002 | Documentacion | SOP desactualizado en uso | Falta de revision documental | Error operativo por instrucciones obsoletas | Documental | 2 | 3 | 6 | Control de version y fecha de revision | Preventivo | Responsable documental | Matriz documental | Calendario de revision formal | En seguimiento | 05 de abril de 2026 | 05 de mayo de 2026 |
| R-003 | Matriculas | Matricula asignada al estudiante incorrecto | Error humano en el registro | Acceso academico indebido o reclamo | Operativo | 2 | 3 | 6 | Validacion previa del registro | Preventivo | Administracion | Historial de matriculas | Doble revision en casos sensibles | Abierto | 05 de abril de 2026 | 05 de mayo de 2026 |
| R-004 | Soporte | Ticket critico sin atencion oportuna | Falta de clasificacion o dueno | Interrupcion o deterioro del servicio | Operativo | 2 | 3 | 6 | Flujo de tickets con estado y seguimiento | Detectivo | Soporte / Admin | Historial de tickets | Definir SLA formal | En seguimiento | 05 de abril de 2026 | 05 de mayo de 2026 |
| R-005 | Archivos | Archivo sensible expuesto | Configuracion incorrecta | Riesgo de seguridad y confidencialidad | Seguridad | 1 | 3 | 3 | Descarga segura autenticada | Preventivo | Tecnologia | Validacion de rutas seguras | Revision trimestral de acceso a archivos | Mitigado | 05 de abril de 2026 | 05 de julio de 2026 |
| R-006 | Plataforma | Falla de autenticacion o sesion | Error tecnico o configuracion incompleta | Usuarios sin acceso o acceso inconsistente | Tecnico | 2 | 3 | 6 | Validacion de sesion y estado | Preventivo | Tecnologia | Logs de autenticacion | Prueba periodica de login | En seguimiento | 05 de abril de 2026 | 05 de mayo de 2026 |
| R-007 | Comunidad | Hilo no moderado oportunamente | Falta de seguimiento | Riesgo reputacional u operativo | Operativo | 2 | 2 | 4 | Revision administrativa y docente | Detectivo | Admin / Docencia | Historial de hilos | Checklist de revision semanal | Abierto | 05 de abril de 2026 | 05 de mayo de 2026 |
| R-008 | Continuidad | Perdida de informacion critica | Respaldo insuficiente o no probado | Interrupcion operativa | Continuidad | 1 | 3 | 3 | Backups y procedimiento de recuperacion | Preventivo | Tecnologia | Bitacora de respaldo | Prueba formal de restauracion | En seguimiento | 05 de abril de 2026 | 05 de julio de 2026 |
| R-009 | Notificaciones | Usuario no recibe aviso relevante | Error de envio o seguimiento | Perdida de visibilidad operativa | Tecnico | 2 | 2 | 4 | Registro de notificaciones y estado | Detectivo | Tecnologia / Admin | Historial de notificaciones | Monitoreo periodico del flujo | Abierto | 05 de abril de 2026 | 05 de mayo de 2026 |
| R-010 | Cambios | Cambio aplicado sin actualizacion documental | Cierre incompleto del cambio | Desalineacion entre operacion y documentacion | Documental | 2 | 2 | 4 | SOP de gestion de cambios | Preventivo | Admin / Tecnologia | Registro de cambios | Validacion documental obligatoria en cierre | En seguimiento | 05 de abril de 2026 | 05 de mayo de 2026 |

## Control de cambios
| Version | Fecha | Descripcion del cambio |
|---|---|---|
| 1.0 | 05 de abril de 2026 | Emision inicial de la Matriz de Riesgos y Controles de la Plataforma GoBeyond |
