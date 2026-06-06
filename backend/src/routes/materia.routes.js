const { Router } = require('express');

function crearRutasMateria({ materiaController }) {
  const router = Router();

  router.get('/', materiaController.listar);
  router.post('/', materiaController.crear);

  return router;
}

module.exports = {
  crearRutasMateria,
};
