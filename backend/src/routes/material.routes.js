const { Router } = require('express');

function crearRutasMaterial({ materialController }) {
  const router = Router();

  router.get('/clase/:id_clase', materialController.listarPorClase);
  router.post('/', materialController.crear);

  return router;
}

module.exports = {
  crearRutasMaterial,
};
