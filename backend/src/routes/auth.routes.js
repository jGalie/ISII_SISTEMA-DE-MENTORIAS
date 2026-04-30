const { Router } = require('express');

function crearRutasAuth({ authController }) {
  const router = Router();

  router.post('/register', authController.registrar);
  router.post('/login', authController.iniciarSesion);

  return router;
}

module.exports = {
  crearRutasAuth,
};
