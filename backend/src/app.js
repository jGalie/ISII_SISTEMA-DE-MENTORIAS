const express = require('express');
const path = require('path');
const cors = require('cors');

const { pool } = require('./config/db');
const { crearRepositorioUsuario } = require('./repositories/usuario.repository');
const { crearRepositorioClase } = require('./repositories/clase.repository');
const { crearRepositorioInscripcion } = require('./repositories/inscripcion.repository');
const { crearRepositorioValoracion } = require('./repositories/valoracion.repository');
const { crearRepositorioMensaje } = require('./repositories/mensaje.repository');
const { crearRepositorioSeguimiento } = require('./repositories/seguimiento.repository');
const { crearRepositorioMaterial } = require('./repositories/material.repository');
const { crearRepositorioMateria } = require('./repositories/materia.repository');
const { crearRepositorioMentorMateria } = require('./repositories/mentor-materia.repository');
const { crearServicioUsuario } = require('./services/usuario.service');
const { crearServicioClase } = require('./services/clase.service');
const { crearServicioInscripcion } = require('./services/inscripcion.service');
const { crearServicioValoracion } = require('./services/valoracion.service');
const { crearServicioMensaje } = require('./services/mensaje.service');
const { crearServicioSeguimiento } = require('./services/seguimiento.service');
const { crearServicioMaterial } = require('./services/material.service');
const { crearServicioMateria } = require('./services/materia.service');
const { crearServicioMentorMateria } = require('./services/mentor-materia.service');
const { crearServicioAuth } = require('./services/auth.service');
const { crearControladorUsuario } = require('./controllers/usuario.controller');
const { crearControladorClase } = require('./controllers/clase.controller');
const { crearControladorInscripcion } = require('./controllers/inscripcion.controller');
const { crearControladorValoracion } = require('./controllers/valoracion.controller');
const { crearControladorMensaje } = require('./controllers/mensaje.controller');
const { crearControladorSeguimiento } = require('./controllers/seguimiento.controller');
const { crearControladorMaterial } = require('./controllers/material.controller');
const { crearControladorMateria } = require('./controllers/materia.controller');
const { crearControladorMentorMateria } = require('./controllers/mentor-materia.controller');
const { crearControladorAuth } = require('./controllers/auth.controller');
const { crearRutasUsuario } = require('./routes/usuario.routes');
const { crearRutasClase } = require('./routes/clase.routes');
const { crearRutasInscripcion } = require('./routes/inscripcion.routes');
const { crearRutasValoracion } = require('./routes/valoracion.routes');
const { crearRutasMensaje } = require('./routes/mensaje.routes');
const { crearRutasSeguimiento } = require('./routes/seguimiento.routes');
const { crearRutasMaterial } = require('./routes/material.routes');
const { crearRutasMateria } = require('./routes/materia.routes');
const { crearRutasMentorMateria } = require('./routes/mentor-materia.routes');
const { crearRutasAuth } = require('./routes/auth.routes');
const { crearPublicadorEventosInscripcion } = require('./events/inscripcion-event.publisher');
const { crearObservadorMensajeAutomaticoInscripcion } = require('./observers/mensaje-automatico-inscripcion.observer');

const usuarioRepository = crearRepositorioUsuario({ pool });
const claseRepository = crearRepositorioClase({ pool });
const inscripcionRepository = crearRepositorioInscripcion({ pool });
const valoracionRepository = crearRepositorioValoracion({ pool });
const mensajeRepository = crearRepositorioMensaje({ pool });
const seguimientoRepository = crearRepositorioSeguimiento({ pool });
const materialRepository = crearRepositorioMaterial({ pool });
const materiaRepository = crearRepositorioMateria({ pool });
const mentorMateriaRepository = crearRepositorioMentorMateria({ pool });
const inscripcionEventPublisher = crearPublicadorEventosInscripcion();
const mensajeAutomaticoInscripcionObserver = crearObservadorMensajeAutomaticoInscripcion({
  mensajeRepository,
});
inscripcionEventPublisher.suscribir(mensajeAutomaticoInscripcionObserver);

// En esta seccion se realiza la inyeccion manual de dependencias. Cada capa
// recibe solamente los objetos que necesita, lo que disminuye el acoplamiento y
// facilita explicar el flujo Repository -> Service -> Controller -> Route.
const usuarioService = crearServicioUsuario({ usuarioRepository, claseRepository, valoracionRepository });
const claseService = crearServicioClase({
  claseRepository,
  usuarioRepository,
  mentorMateriaRepository,
});
const inscripcionService = crearServicioInscripcion({
  inscripcionRepository,
  claseRepository,
  usuarioRepository,
  inscripcionEventPublisher,
});
const valoracionService = crearServicioValoracion({
  valoracionRepository,
  claseRepository,
  usuarioRepository,
  inscripcionRepository,
});
const mensajeService = crearServicioMensaje({
  mensajeRepository,
  inscripcionRepository,
  usuarioRepository,
});
const seguimientoService = crearServicioSeguimiento({
  seguimientoRepository,
  inscripcionRepository,
  usuarioRepository,
});
const materialService = crearServicioMaterial({
  materialRepository,
  claseRepository,
  inscripcionRepository,
  usuarioRepository,
});
const materiaService = crearServicioMateria({ materiaRepository });
const mentorMateriaService = crearServicioMentorMateria({
  mentorMateriaRepository,
  usuarioRepository,
  materiaRepository,
});
const authService = crearServicioAuth({ usuarioRepository });

const usuarioController = crearControladorUsuario({ usuarioService });
const claseController = crearControladorClase({ claseService });
const inscripcionController = crearControladorInscripcion({ inscripcionService });
const valoracionController = crearControladorValoracion({ valoracionService });
const mensajeController = crearControladorMensaje({ mensajeService });
const seguimientoController = crearControladorSeguimiento({ seguimientoService });
const materialController = crearControladorMaterial({ materialService });
const materiaController = crearControladorMateria({ materiaService });
const mentorMateriaController = crearControladorMentorMateria({ mentorMateriaService });
const authController = crearControladorAuth({ authService });

const app = express();

/**
 * En este archivo se concentra el ensamblado principal del backend.
 * Aqui se conectan repositories, services, controllers y routes,
 * siguiendo una arquitectura en capas.
 *
 * La logica puntual de negocio no vive en este modulo: su responsabilidad
 * es dejar preparadas todas las dependencias y exponer la API. Esta separacion
 * permite que el modulo funcione como punto de composicion del sistema.
 */
app.use(cors());
app.use(express.json());

// Cada prefijo delega el procesamiento a su modulo especializado.
app.use('/auth', crearRutasAuth({ authController }));
app.use('/usuarios', crearRutasUsuario({ usuarioController }));
app.use('/clases', crearRutasClase({ claseController }));
app.use('/inscripciones', crearRutasInscripcion({ inscripcionController }));
app.use('/inscripciones', crearRutasMensaje({ mensajeController }));
app.use('/valoraciones', crearRutasValoracion({ valoracionController }));
app.use('/materias', crearRutasMateria({ materiaController }));
app.use('/seguimientos', crearRutasSeguimiento({ seguimientoController }));
app.use('/materiales', crearRutasMaterial({ materialController }));
app.use('/mentor-materias', crearRutasMentorMateria({ mentorMateriaController }));

const frontendRoot = path.join(__dirname, '..', '..', 'frontend');

// El servidor tambien publica el frontend estatico para simplificar
// la ejecucion del MVP en un unico entorno.
app.use(express.static(frontendRoot));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mentorix-api' });
});

function resolverEstadoHttp(error, fallbackStatus = 500) {
  if (error.code === 'VALIDATION_ERROR') return 400;
  if (error.code === 'FORBIDDEN') return 403;
  if (error.code === 'NOT_FOUND') return 404;
  if (error.code === 'DUPLICATE_USER') return 409;
  if (error.code === 'DUPLICATE_ENROLLMENT') return 409;
  return fallbackStatus;
}

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(resolverEstadoHttp(error)).json({
    success: false,
    error: error.message,
  });
});

module.exports = app;
