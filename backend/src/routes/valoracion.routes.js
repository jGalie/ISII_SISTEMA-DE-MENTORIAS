const { Router } = require('express');

function crearRutasValoracion({ valoracionController }) {
  const router = Router();

  router.post('/', valoracionController.crear);
  router.get('/clase/:idClase', valoracionController.listarValoracionesPorClase);
  router.get('/mentor/:idMentor', valoracionController.listarValoracionesPorMentor);

  return router;
}

module.exports = {
  crearRutasValoracion,
};
