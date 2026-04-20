const { Router } = require('express');

function createUsuarioRoutes({ usuarioController }) {
  const router = Router();

  router.get('/', usuarioController.list);
  router.post('/', usuarioController.create);

  return router;
}

module.exports = {
  createUsuarioRoutes,
};
