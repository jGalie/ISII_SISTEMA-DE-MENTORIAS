const express = require('express');
const path = require('path');
const cors = require('cors');

const { pool } = require('./config/db');
const { crearRepositorioUsuario } = require('./repositories/usuario.repository');
const { crearRepositorioClase } = require('./repositories/clase.repository');
const { crearRepositorioInscripcion } = require('./repositories/inscripcion.repository');
const { crearRepositorioValoracion } = require('./repositories/valoracion.repository');
const mentorMateriaRepository = require('./repositories/mentor-materia.repository');
const { crearServicioUsuario } = require('./services/usuario.service');
const { crearServicioClase } = require('./services/clase.service');
const { crearServicioInscripcion } = require('./services/inscripcion.service');
const { crearServicioValoracion } = require('./services/valoracion.service');
const { crearServicioAuth } = require('./services/auth.service');
const { crearControladorUsuario } = require('./controllers/usuario.controller');
const { crearControladorClase } = require('./controllers/clase.controller');
const { crearControladorInscripcion } = require('./controllers/inscripcion.controller');
const { crearControladorValoracion } = require('./controllers/valoracion.controller');
const { crearControladorAuth } = require('./controllers/auth.controller');
const { crearRutasUsuario } = require('./routes/usuario.routes');
const { crearRutasClase } = require('./routes/clase.routes');
const { crearRutasInscripcion } = require('./routes/inscripcion.routes');
const { crearRutasValoracion } = require('./routes/valoracion.routes');
const { crearRutasAuth } = require('./routes/auth.routes');

const materiaRoutes = require('./routes/materia.routes');
const seguimientoRoutes = require('./routes/seguimiento.routes');
const materialRoutes = require('./routes/material.routes');
const mensajeRoutes = require('./routes/mensaje.routes');
const mentorMateriaRoutes = require('./routes/mentor-materia.routes');

const usuarioRepository = crearRepositorioUsuario({ pool });
const claseRepository = crearRepositorioClase({ pool });
const inscripcionRepository = crearRepositorioInscripcion({ pool });
const valoracionRepository = crearRepositorioValoracion({ pool });

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
});
const valoracionService = crearServicioValoracion({
  valoracionRepository,
  claseRepository,
  usuarioRepository,
  inscripcionRepository,
});
const authService = crearServicioAuth({ usuarioRepository });

const usuarioController = crearControladorUsuario({ usuarioService });
const claseController = crearControladorClase({ claseService });
const inscripcionController = crearControladorInscripcion({ inscripcionService });
const valoracionController = crearControladorValoracion({ valoracionService });
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
app.use('/valoraciones', crearRutasValoracion({ valoracionController }));
app.use('/materias', materiaRoutes);
app.use('/seguimientos', seguimientoRoutes);
app.use('/materiales', materialRoutes);
app.use('/mensajes', mensajeRoutes);
app.use('/mentor-materias', mentorMateriaRoutes);

const frontendRoot = path.join(__dirname, '..', '..', 'frontend');

// El servidor tambien publica el frontend estatico para simplificar
// la ejecucion del MVP en un unico entorno.
app.use(express.static(frontendRoot));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mentorix-api' });
});

module.exports = app;
