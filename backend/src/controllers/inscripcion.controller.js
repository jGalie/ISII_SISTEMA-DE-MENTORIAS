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
        const inscripcionCreada = await inscripcionService.solicitarInscripcion(req.body || {});
        res.status(201).json({ success: true, data: inscripcionCreada });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async buscarInscripcionesDelEstudiante(req, res) {
      try {
        const inscripcionesEstudiante = await inscripcionService.buscarInscripcionesDelEstudiante(req.params.id);
        res.json({ success: true, data: inscripcionesEstudiante });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async buscarSolicitudesDelMentor(req, res) {
      try {
        const solicitudesMentor = await inscripcionService.buscarSolicitudesDelMentor(req.params.id);
        res.json({ success: true, data: solicitudesMentor });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },

    async actualizarEstado(req, res) {
      try {
        const inscripcionActualizada = await inscripcionService.cambiarEstadoInscripcion(req.params.id, req.body || {});
        res.json({ success: true, data: inscripcionActualizada });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ success: false, error: err.message });
      }
    },
  };
}

module.exports = {
  crearControladorInscripcion,
};
