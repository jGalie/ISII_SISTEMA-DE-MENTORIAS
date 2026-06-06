const { Router } = require('express');

function crearRutasSeguimiento({ seguimientoController }) {
  const router = Router();

  router.get('/inscripcion/:id_inscripcion', seguimientoController.listarPorInscripcion);
  router.post('/', seguimientoController.crear);

  return router;
}

module.exports = {
  crearRutasSeguimiento,
};
