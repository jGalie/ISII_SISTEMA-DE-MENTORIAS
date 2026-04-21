function resolveStatus(error, fallbackStatus = 500) {
  if (error.code === 'VALIDATION_ERROR' || error.code === 'DUPLICATE_USER') return 400;
  if (error.code === 'FORBIDDEN') return 403;
  if (error.code === 'NOT_FOUND') return 404;
  return fallbackStatus;
}

function createUsuarioController({ usuarioService }) {
  return {
    async list(req, res) {
      try {
        const data = await usuarioService.listar();
        res.json({ data });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    async getById(req, res) {
      try {
        const data = await usuarioService.obtener(req.params.id);
        res.json({ data });
      } catch (err) {
        res.status(resolveStatus(err)).json({ error: err.message });
      }
    },

    async create(req, res) {
      try {
        const data = await usuarioService.crear(req.body || {});
        res.status(201).json({ data });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    async update(req, res) {
      try {
        const data = await usuarioService.actualizar(req.params.id, req.body || {});
        res.json({ data });
      } catch (err) {
        res.status(resolveStatus(err)).json({ error: err.message });
      }
    },
  };
}

module.exports = {
  createUsuarioController,
};
