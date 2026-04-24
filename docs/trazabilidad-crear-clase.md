# Trazabilidad del Caso de Uso: Crear Clase

Este documento conecta el diagrama de secuencia compartido con la implementacion real del proyecto. La idea es que cualquier persona pueda seguir el recorrido funcional sin inferencias: desde la pantalla `crear-clase` hasta la persistencia en MySQL.

## Alcance

Caso cubierto: alta de una clase por parte de un usuario con rol `mentor`.

Participantes del diagrama:

- `Mentor`
- `Interfaz`
- `MateriaMentor`
- `Usuario`
- `Clase`
- `BD`

## Matriz de Trazabilidad

| Paso | Mensaje del diagrama | Capa real | Implementacion |
| --- | --- | --- | --- |
| UI_01 | `solicitarCrearClase()` | Frontend | `frontend/js/pages/crear-clase.js` al cargar la pagina |
| UI_02 | `mostrarFormularioClase()` | Frontend | `frontend/pages/crear-clase.html` + `frontend/js/pages/crear-clase.js` |
| MM_01 | `getMentorMaterias(mentorId)` | Frontend -> API -> Service -> Repository | `frontend/js/api.js` -> `backend/src/controllers/mentor-materia.controller.js` -> `backend/src/services/mentor-materia.service.js:listar` -> `backend/src/repositories/mentor-materia.repository.js:findByMentorId` |
| UI_03 | `habilitarCargaClase()` | Frontend | `alternarDisponibilidadFormulario` y `renderizarMaterias` en `frontend/js/pages/crear-clase.js` |
| UI_04 | `ingresarDatosClase(...)` | Frontend | `formulario.addEventListener('submit', ...)` en `frontend/js/pages/crear-clase.js` |
| UI_05 | `recibirDatosClase()` | Frontend | armado de `datosClase` en `frontend/js/pages/crear-clase.js` |
| UI_06 | `confirmarCreacionClase()` | Frontend | llamada `MentoriasApi.crearClase(datosClase)` |
| CL_01 | `crearClase(datosClase)` | Controller | `backend/src/controllers/clase.controller.js:crear` |
| CL_02 | `validarDatosClase(datosClase)` | Service | `backend/src/services/clase.service.js:validarDatosClase` |
| US_01 | `findById(mentorId)` | Repository usuario | `backend/src/repositories/usuario.repository.js:findById` |
| MM_02 | `exists(mentorId, materiaId)` | Repository mentor-materia | `backend/src/repositories/mentor-materia.repository.js:exists` |
| CL_03 | `registrarClase(datosClase)` | Repository clase | `backend/src/repositories/clase.repository.js:crearClase` |
| BD_01 | `INSERT clases` | Base de datos | tabla `clases` en MySQL |
| UI_07 | `mostrarMensajeConfirmacion()` | Frontend | `mostrarMensaje('success', ...)` en `frontend/js/pages/crear-clase.js` |

## Recorrido End-to-End

1. El mentor abre la pantalla de creacion de clases.
2. La interfaz valida que exista sesion y que el usuario tenga rol `mentor`.
3. La interfaz consulta las materias asociadas al mentor autenticado.
4. Si hay materias, habilita el formulario; si no hay, lo bloquea.
5. El mentor completa `titulo`, `descripcion`, `fecha`, `modalidad`, `materiaId`, `precio` y `ubicacion` cuando corresponde.
6. La interfaz construye `datosClase` y ejecuta `POST /clases`.
7. El controller delega la solicitud al service.
8. El service valida datos obligatorios, modalidad, precio y consistencia de la ubicacion.
9. El service busca al usuario mentor y confirma su rol.
10. El service verifica que la materia seleccionada pertenezca al mentor.
11. El repository de clases inserta el registro en la base.
12. La respuesta vuelve al frontend y se muestra el mensaje de confirmacion.

## Validaciones que materializan el diagrama

- La interfaz no deja operar a usuarios que no sean mentores.
- La interfaz no deja enviar una clase presencial sin ubicacion.
- El service no permite crear una clase sin `mentorId`.
- El service no permite crear una clase si el usuario no existe o no es mentor.
- El service no permite crear una clase para una materia que no este asociada al mentor.

## Diferencias menores entre diagrama y codigo

- El diagrama muestra `MateriaMentor` y `Usuario` como participantes separados; en el codigo eso se resuelve mediante repositories especializados.
- El diagrama muestra `Clase` como entidad activa; en el backend real esa responsabilidad se distribuye entre `clase.controller.js`, `clase.service.js` y `clase.repository.js`.
- El mensaje final de confirmacion en UI hoy redirige a `pages/clases.html` luego de mostrar el estado exitoso.
