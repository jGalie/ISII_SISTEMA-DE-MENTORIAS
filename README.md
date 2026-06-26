# Mentorix

Mentorix es un sistema web de mentorias desarrollado como proyecto fullstack para gestionar el encuentro entre estudiantes y mentores. La aplicacion permite registrar usuarios, iniciar sesion, publicar clases, consultar propuestas disponibles, solicitar inscripciones y realizar seguimiento del estado de cada solicitud.

El objetivo del proyecto es centralizar la gestion de clases de apoyo academico en una plataforma simple, organizada y facil de usar, manteniendo una separacion clara entre frontend, backend y base de datos.

## Creadoras

- Barbero Asselborn, Valentina Nerea
- Gauna, Julieta Itati

## Funcionalidades principales

- Registro e inicio de sesion de usuarios.
- Roles diferenciados para mentores y estudiantes.
- Creacion y administracion de clases por parte de mentores.
- Consulta de clases disponibles para estudiantes.
- Solicitudes de inscripcion a clases.
- Seguimiento de estados de inscripcion: pendiente, aceptada o rechazada.
- Gestion de materias, materiales, mensajes, valoraciones y seguimientos.

## Tecnologias utilizadas

- Node.js
- Express
- MySQL
- JavaScript
- HTML
- CSS
- Bootstrap

## Estructura del proyecto

```text
backend/
  src/
    controllers/
    services/
    repositories/
    models/
    routes/
    config/
  sql/
    procedures/
  tests/

frontend/
  pages/
  js/
  styles/
  components/

docs/
```

## Arquitectura

El backend esta organizado en capas para separar responsabilidades:

```text
Controller -> Service -> Repository
```

- Los controllers reciben las peticiones HTTP.
- Los services contienen la logica de negocio.
- Los repositories concentran el acceso a la base de datos.

Esta organizacion facilita el mantenimiento, las pruebas y la evolucion del sistema.

## Base de datos

El script principal de inicializacion se encuentra en:

[backend/sql/init.sql](backend/sql/init.sql)

La base de datos incluye, entre otras, las siguientes entidades:

- `usuarios`
- `materias`
- `clases`
- `mentor_materias`
- `inscripciones`
- `seguimientos`
- `materiales`
- `mensajes`
- `valoraciones`

Tambien se incluye una carpeta para procedimientos almacenados:

[backend/sql/procedures](backend/sql/procedures)

## Procedimientos almacenados

El proyecto incluye procedimientos almacenados para operaciones de consulta y actualizacion:

- `consultar_clases_disponibles`: consulta clases con cupo disponible, incluyendo informacion del mentor, materia, modalidad, cupos y valoracion promedio del mentor. Permite filtrar por materia.
- `actualizar_estado_inscripcion`: actualiza el estado de una inscripcion.

Para cargarlos en MySQL desde la terminal:

```powershell
mysql -u root -p < backend/sql/procedures/consultar_clases_disponibles.sql
mysql -u root -p < backend/sql/procedures/actualizar_estado_inscripcion.sql
```

Para ejecutarlos desde MySQL:

```sql
USE mentorias_bd;

CALL consultar_clases_disponibles(NULL);
CALL consultar_clases_disponibles(1);
CALL actualizar_estado_inscripcion(1, 'aceptada');
```

En `consultar_clases_disponibles`, el parametro `NULL` trae clases de todas las materias y un numero filtra por el `id_materia`.


