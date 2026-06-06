const { Router } = require('express');

function crearRutasMentorMateria({ mentorMateriaController }) {
  const router = Router();

  router.get('/', mentorMateriaController.listar);
  router.post('/', mentorMateriaController.crear);

  return router;
}

module.exports = {
  crearRutasMentorMateria,
};
