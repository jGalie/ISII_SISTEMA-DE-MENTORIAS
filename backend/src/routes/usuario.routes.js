const { Router } = require('express');

function crearRutasUsuario({ usuarioController }) {
  const router = Router();

  router.get('/', usuarioController.listar);
  router.get('/mentores/:id/publico', usuarioController.obtenerPerfilPublicoMentor);
  router.get('/:id', usuarioController.obtenerPorId);
  router.post('/', usuarioController.crear);
  router.put('/:id', usuarioController.actualizar);

  return router;
}

module.exports = {
  crearRutasUsuario,
};
