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

    async create(req, res) {
      try {
        const data = await usuarioService.crear(req.body || {});
        res.status(201).json({ data });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },
  };
}

module.exports = {
  createUsuarioController,
};
