# Mentorix

Sistema de mentorías fullstack con Node.js, Express, MySQL y frontend Bootstrap/JavaScript. La aplicación implementa registro y login reales, visualización de clases, gestión completa de clases por mentor, solicitudes de inscripción y seguimiento de estados desde un dashboard coherente con la identidad visual de Mentorix.

## DER

### Entidades

- `usuarios`
  - `id_usuario`
  - `nombre`
  - `email`
  - `password_hash`
  - `rol` (`mentor` o `estudiante`)
- `clases`
  - `id_clase`
  - `titulo`
  - `descripcion`
  - `fecha`
  - `id_mentor`
- `inscripciones`
  - `id_inscripcion`
  - `id_usuario`
  - `id_clase`
  - `estado` (`pendiente`, `aceptada`, `rechazada`)
  - `fecha_solicitud`

### Relaciones

- Un `usuario` con rol `mentor` puede tener muchas `clases`.
- Un `usuario` con rol `estudiante` puede tener muchas `inscripciones`.
- Una `clase` puede tener muchas `inscripciones`.
- `inscripciones` es la entidad puente que resuelve la relación entre estudiantes y clases y agrega el estado del proceso.

## Arquitectura

El backend respeta 3 capas:

1. `controllers`
2. `services`
3. `repositories`

Flujo:

`Controller -> Service -> Repository`

Los services usan inyección de dependencias y no hacen `require` directo de repositories.

## SQL

El script está en [backend/sql/init.sql](backend/sql/init.sql) y crea:

- `usuarios`
- `materias`
- `clases`
- `mentor_materias`
- `inscripciones`
- `seguimientos`
- `materiales`
- `mensajes`

Incluye un mentor demo:

- email: `mentor@mentorix.com`
- password: `Mentor123`

