function resolverEstadoHttp(error, fallbackStatus = 500) {
  if (error.code === 'VALIDATION_ERROR' || error.code === 'DUPLICATE_USER') return 400;
  if (error.code === 'FORBIDDEN') return 403;
  if (error.code === 'NOT_FOUND') return 404;
  return fallbackStatus;
}

function crearControladorUsuario({ usuarioService }) {
  return {
    async listar(req, res) {
      try {
        const data = await usuarioService.listar();
        res.json({ data });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    async obtenerPorId(req, res) {
      try {
        const data = await usuarioService.obtener(req.params.id);
        res.json({ data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ error: err.message });
      }
    },

    async obtenerPerfilPublicoMentor(req, res) {
      try {
        const data = await usuarioService.obtenerPerfilPublicoMentor(req.params.id);
        res.json({ data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ error: err.message });
      }
    },

    async crear(req, res) {
      try {
        const data = await usuarioService.crear(req.body || {});
        res.status(201).json({ data });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    async actualizar(req, res) {
      try {
        const data = await usuarioService.actualizar(req.params.id, req.body || {});
        res.json({ data });
      } catch (err) {
        res.status(resolverEstadoHttp(err)).json({ error: err.message });
      }
    },
  };
}

module.exports = {
  crearControladorUsuario,
};
