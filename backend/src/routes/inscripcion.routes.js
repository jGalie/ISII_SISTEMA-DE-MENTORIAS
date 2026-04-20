const { Router } = require('express');

function createInscripcionRoutes({ inscripcionController }) {
  const router = Router();

  router.post('/', inscripcionController.create);
  router.get('/usuario/:id', inscripcionController.getByUsuario);
  router.get('/mentor/:id', inscripcionController.getByMentor);
  router.put('/:id/estado', inscripcionController.updateEstado);

  return router;
}

module.exports = {
  createInscripcionRoutes,
};
