Reporte de Auditoría Técnica - Módulo de Citas
He analizado los archivos proporcionados (Rutas, Controladores, Servicios, Esquemas, Middleware y SQL) con el objetivo de identificar áreas de mejora orientadas a un entorno de producción B2B (SaaS). A continuación presento los hallazgos categorizados:

1. Seguridad 🔒
Hallazgos Críticos y Medios:

JWT Secret Débil (Fallback): En 
src/middleware/auth.ts
, si no está definida la variable de entorno JWT_SECRET, hace fallback a un string quemado en el código. Esto es un riesgo crítico si se omite la variable en producción.
Validación del Token (Revocación): Actualmente, si un administrador elimina a un usuario o le quita permisos, su JWT actual seguirá siendo válido hasta que expire. No hay una "blacklist" de tokens o validación de estado del usuario en cada petición (más allá de refrescar permissos dinamicos).
Callback asíncrono en jwt.verify: En 
auth.ts
, se hace jwt.verify(..., async (err, user) => {...}). El manejo de errores dentro de este callback asíncrono (si permissionService.getUserPermissions falla estrepitosamente) puede causar fugas de memoria o peticiones colgadas (unhandled promise rejections) si no llama a next(err).
Falta Rate Limiting: No hay evidencia de un límite de peticiones (Rate Limit) explícito, lo que hace vulnerables los endpoints a ataques de fuerza bruta o DDoS.
2. Escalabilidad 🚀
¿Soportará 1,000 citas diarias sin bloquearse? A corto plazo sí, pero se degradará rápidamente sin estos ajustes:

Ausencia Crítica de Índices SQL: Para agendar o editar una cita, el sistema hace consultas buscando solapamientos: start_time < $3 AND end_time > $2 filtrados por staff_id y client_id. PostgreSQL no crea índices automáticamente en Foreign Keys. Buscar 1,000 citas diarias (30k/mes) forzará un Sequential Scan en toda la tabla cada vez que alguien agende. Solución: Crear índices en spa_id, staff_id, start_time, end_time.
Paginación Antipatrón (COUNT(*) OVER()): En 
appointment.service.ts
 (
getBySpa
), se usa COUNT(*) OVER() para la paginación. Esto obliga a la base de datos a materializar absolutamente toda la consulta antes de devolver los resultados, afectando severamente el CPU y bloqueos si hay miles de citas concurrentes. Solución: Separar la consulta del conteo total.
Manejo de Transacciones Manual: Está bien ejecutado en términos de ACID (uso de BEGIN, COMMIT, ROLLBACK), pero depende en el mismo proceso de Node.js de liberar el pool en caso de errores en promesas largas, lo que en picos de tráfico podría agotar el connection pool si no se maneja un timeout.
3. Deuda Técnica 🏚️
Código Duplicado en Lógica Core: La lógica para comprobar solapamiento (staffOverlap y clientOverlap) de horarios está copiada y pegada casi de forma idéntica en 
createAppointment
 y 
updateAppointment
. Esto viola el principio DRY (Don't Repeat Yourself) y propicia bugs (si corriges una validación, olvidarás la otra).
Lógica de Conversión de Zonas Horarias Acoplada: La lógica para transformar UTC a la hora local para el mensaje de error de colisión de horarios se repite hasta 4 veces.
Responsabilidades de Autorización en el Controlador: En 
appointment.controller.ts
, el controlador se encarga de determinar si el usuario tiene appointments:view-all y altera el scope de búsqueda. Esta regla de negocio debería vivir en el servicio o, idealmente, en un middleware o capa de políticas de autorización.
4. Mantenibilidad (SOLID / Clean Code) 🛠️
Violación de SRP (Single Responsibility Principle): El 
AppointmentService
 es un "God Class". Al mismo tiempo actúa como:
Repositorio de Base de Datos (escribe strings de SQL en crudo).
Proveedor de Lógica de Negocio (validar tiempos, solapamientos, crear clientes desde citas). Manejar pool.query esparcido en el código acopla fuertemente el servicio a Postgres. Idealmente, debería haber un AppointmentRepository inyectado en el 
AppointmentService
.
Violación de OCP (Open/Closed Principle): En 
getBySpa
, la construcción de la query se hace concatenando strings (query += ' AND a.staff_id =...'). Si añades 5 filtros más, el código se vuelve inmanejable. Usar un Query Builder simple (como Knex o kysely) evitaría inyección de SQL por descuido y mejoraría la legibilidad.
Tipado Flexible (any): En 
appointment.controller.ts
 hay casteos como const user = (req as any).user; en lugar de extender correctamente las interfaces de Express (como se hizo a medias en 
auth.ts
 con 
AuthRequest
). Esto desaprovecha los beneficios de TypeScript.
Resumen Ejecutivo: El sistema funciona a nivel lógico y el diseño de la BD es robusto (buen uso de UUIDs y constraint checks). Sin embargo, los índices vacíos en la base de datos y la concatenación manual de SQL en el servicio son los focos rojos más urgentes si planean el lanzamiento en la nube pronto.

¿Quieres que te proponga un plan de acción priorizado para refactorizar estas secciones o comenzamos corrigiendo la base de datos y el servicio?