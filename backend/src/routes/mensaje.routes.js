const { Router } = require('express');

function crearRutasMensaje({ mensajeController }) {
  const router = Router();

  router.post('/:id_inscripcion/mensajes', mensajeController.crear);
  router.get('/:id_inscripcion/mensajes', mensajeController.listarPorInscripcion);

  return router;
}

module.exports = {
  crearRutasMensaje,
};
