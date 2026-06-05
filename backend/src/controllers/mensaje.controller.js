function resolverEstadoHttp(error, fallbackStatus = 500) {
  if (error.code === 'VALIDATION_ERROR') return 400;
  if (error.code === 'FORBIDDEN') return 403;
  if (error.code === 'NOT_FOUND') return 404;
  return fallbackStatus;
}

function obtenerDatosActor(req) {
  return {
    ...(req.query || {}),
    ...(req.body || {}),
    id_usuario:
      req.user?.id
      || req.user?.id_usuario
      || req.body?.id_usuario
      || req.body?.usuarioId
      || req.query?.id_usuario
      || req.query?.usuarioId,
  };
}

function crearControladorMensaje({ mensajeService }) {
  return {
    async crear(req, res) {
      try {
        const data = await mensajeService.enviarMensaje(req.params.idInscripcion, obtenerDatosActor(req));
        res.status(201).json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async listarPorInscripcion(req, res) {
      try {
        const data = await mensajeService.listarConversacion(req.params.idInscripcion, obtenerDatosActor(req));
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },
  };
}

module.exports = {
  crearControladorMensaje,
};
