function obtenerDatosActor(req) {
  return {
    ...(req.query || {}),
    ...(req.body || {}),
    id_usuario: req.user?.id_usuario || req.user?.id || req.body?.id_usuario || req.query?.id_usuario,
  };
}

function crearControladorMensaje({ mensajeService }) {
  return {
    async crear(req, res, next) {
      try {
        const data = await mensajeService.enviarMensaje({
          ...obtenerDatosActor(req),
          id_inscripcion: req.params.id_inscripcion,
        });
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },

    async listarPorInscripcion(req, res, next) {
      try {
        const data = await mensajeService.listarMensajesPorInscripcion(req.params.id_inscripcion, obtenerDatosActor(req));
        res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  crearControladorMensaje,
};
