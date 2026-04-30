function resolverEstadoHttp(error, fallbackStatus = 500) {
  if (error.code === 'VALIDATION_ERROR' || error.code === 'DUPLICATE_ENROLLMENT') return 400;
  if (error.code === 'FORBIDDEN') return 403;
  if (error.code === 'NOT_FOUND') return 404;
  return fallbackStatus;
}

function crearControladorInscripcion({ inscripcionService }) {
  return {
    async crear(req, res) {
      try {
        const data = await inscripcionService.solicitarInscripcion(req.body || {});
        res.status(201).json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async obtenerPorUsuario(req, res) {
      try {
        const data = await inscripcionService.obtenerInscripcionesUsuario(req.params.id);
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async obtenerPorMentor(req, res) {
      try {
        const data = await inscripcionService.obtenerInscripcionesMentor(req.params.id);
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async actualizarEstado(req, res) {
      try {
        const data = await inscripcionService.cambiarEstadoInscripcion(req.params.id, req.body || {});
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },
  };
}

module.exports = {
  crearControladorInscripcion,
};
