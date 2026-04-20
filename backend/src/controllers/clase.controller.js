function resolveStatus(error, fallbackStatus = 500) {
  if (error.code === 'VALIDATION_ERROR') return 400;
  if (error.code === 'FORBIDDEN') return 403;
  if (error.code === 'NOT_FOUND') return 404;
  return fallbackStatus;
}

function createClaseController({ claseService }) {
  return {
    async list(req, res) {
      try {
        const mentorId = req.query.id_mentor;
        const data = mentorId
          ? await claseService.listarClasesPorMentor(mentorId)
          : await claseService.listarClases();
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolveStatus(err)).json({ success: false, error: err.message });
      }
    },

    async getById(req, res) {
      try {
        const data = await claseService.obtenerClase(req.params.id);
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolveStatus(err)).json({ success: false, error: err.message });
      }
    },

    async create(req, res) {
      try {
        const data = await claseService.crearClase(req.body || {});
        res.status(201).json({ success: true, data });
      } catch (err) {
        res.status(resolveStatus(err)).json({ success: false, error: err.message });
      }
    },

    async update(req, res) {
      try {
        const data = await claseService.actualizarClase(req.params.id, req.body || {});
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolveStatus(err)).json({ success: false, error: err.message });
      }
    },

    async remove(req, res) {
      try {
        const data = await claseService.eliminarClase(req.params.id, req.body || {});
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolveStatus(err)).json({ success: false, error: err.message });
      }
    },
  };
}

module.exports = {
  createClaseController,
};
