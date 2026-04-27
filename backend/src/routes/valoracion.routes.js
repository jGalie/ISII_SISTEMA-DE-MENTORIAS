const { Router } = require('express');

function createValoracionRoutes({ valoracionController }) {
  const router = Router();

  router.post('/', valoracionController.crear);
  router.get('/clase/:idClase', valoracionController.listarPorClase);
  router.get('/mentor/:idMentor', valoracionController.listarPorMentor);

  return router;
}

module.exports = {
  createValoracionRoutes,
};
