const { Router } = require('express');

function createUsuarioRoutes({ usuarioController }) {
  const router = Router();

  router.get('/', usuarioController.list);
  router.get('/:id', usuarioController.getById);
  router.post('/', usuarioController.create);
  router.put('/:id', usuarioController.update);

  return router;
}

module.exports = {
  createUsuarioRoutes,
};
