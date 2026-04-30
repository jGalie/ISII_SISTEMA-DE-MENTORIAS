const { Router } = require('express');

function crearRutasInscripcion({ inscripcionController }) {
  const router = Router();

  router.post('/', inscripcionController.crear);
  router.get('/usuario/:id', inscripcionController.obtenerPorUsuario);
  router.get('/mentor/:id', inscripcionController.obtenerPorMentor);
  router.put('/:id/estado', inscripcionController.actualizarEstado);

  return router;
}

module.exports = {
  crearRutasInscripcion,
};
