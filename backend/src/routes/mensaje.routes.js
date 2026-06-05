const { Router } = require('express');

function crearRutasMensaje({ mensajeController }) {
  const router = Router();

  router.post('/:idInscripcion/mensajes', mensajeController.crear);
  router.get('/:idInscripcion/mensajes', mensajeController.listarPorInscripcion);

  return router;
}

module.exports = {
  crearRutasMensaje,
};
