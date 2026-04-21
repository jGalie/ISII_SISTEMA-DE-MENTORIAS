const express = require('express');
const path = require('path');
const cors = require('cors');

const { pool } = require('./config/db');
const { createUsuarioRepository } = require('./repositories/usuario.repository');
const { createClaseRepository } = require('./repositories/clase.repository');
const { createInscripcionRepository } = require('./repositories/inscripcion.repository');
const mentorMateriaRepository = require('./repositories/mentor-materia.repository');
const { createUsuarioService } = require('./services/usuario.service');
const { createClaseService } = require('./services/clase.service');
const { createInscripcionService } = require('./services/inscripcion.service');
const { createAuthService } = require('./services/auth.service');
const { createUsuarioController } = require('./controllers/usuario.controller');
const { createClaseController } = require('./controllers/clase.controller');
const { createInscripcionController } = require('./controllers/inscripcion.controller');
const { createAuthController } = require('./controllers/auth.controller');
const { createUsuarioRoutes } = require('./routes/usuario.routes');
const { createClaseRoutes } = require('./routes/clase.routes');
const { createInscripcionRoutes } = require('./routes/inscripcion.routes');
const { createAuthRoutes } = require('./routes/auth.routes');

const materiaRoutes = require('./routes/materia.routes');
const seguimientoRoutes = require('./routes/seguimiento.routes');
const materialRoutes = require('./routes/material.routes');
const mensajeRoutes = require('./routes/mensaje.routes');
const mentorMateriaRoutes = require('./routes/mentor-materia.routes');

const usuarioRepository = createUsuarioRepository({ pool });
const claseRepository = createClaseRepository({ pool });
const inscripcionRepository = createInscripcionRepository({ pool });

const usuarioService = createUsuarioService({ usuarioRepository });
const claseService = createClaseService({
  claseRepository,
  usuarioRepository,
  mentorMateriaRepository,
});
const inscripcionService = createInscripcionService({
  inscripcionRepository,
  claseRepository,
  usuarioRepository,
});
const authService = createAuthService({ usuarioRepository });

const usuarioController = createUsuarioController({ usuarioService });
const claseController = createClaseController({ claseService });
const inscripcionController = createInscripcionController({ inscripcionService });
const authController = createAuthController({ authService });

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', createAuthRoutes({ authController }));
app.use('/usuarios', createUsuarioRoutes({ usuarioController }));
app.use('/clases', createClaseRoutes({ claseController }));
app.use('/inscripciones', createInscripcionRoutes({ inscripcionController }));
app.use('/materias', materiaRoutes);
app.use('/seguimientos', seguimientoRoutes);
app.use('/materiales', materialRoutes);
app.use('/mensajes', mensajeRoutes);
app.use('/mentor-materias', mentorMateriaRoutes);

const frontendRoot = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendRoot));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mentorix-api' });
});

module.exports = app;
