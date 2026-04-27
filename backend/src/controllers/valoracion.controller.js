function resolveStatus(error, fallbackStatus = 500) {
  if (error.code === 'VALIDATION_ERROR' || error.code === 'DUPLICATE_REVIEW') return 400;
  if (error.code === 'FORBIDDEN') return 403;
  if (error.code === 'NOT_FOUND') return 404;
  return fallbackStatus;
}

function createValoracionController({ valoracionService }) {
  return {
    async crear(req, res) {
      try {
        const data = await valoracionService.crearValoracion(req.body || {});
        res.status(201).json({ success: true, data });
      } catch (error) {
        res.status(resolveStatus(error)).json({ success: false, error: error.message });
      }
    },

    async listarPorClase(req, res) {
      try {
        const data = await valoracionService.listarPorClase(req.params.idClase);
        res.json({ success: true, data });
      } catch (error) {
        res.status(resolveStatus(error)).json({ success: false, error: error.message });
      }
    },

    async listarPorMentor(req, res) {
      try {
        const data = await valoracionService.listarPorMentor(req.params.idMentor);
        res.json({ success: true, data });
      } catch (error) {
        res.status(resolveStatus(error)).json({ success: false, error: error.message });
      }
    },
  };
}

module.exports = {
  createValoracionController,
};
