function resolverEstadoHttp(error, fallbackStatus = 500) {
  if (error.code === 'VALIDATION_ERROR' || error.code === 'DUPLICATE_USER') return 400;
  if (error.code === 'FORBIDDEN') return 403;
  if (error.code === 'NOT_FOUND') return 404;
  return fallbackStatus;
}

function crearControladorUsuario({ usuarioService }) {
  return {
    async obtenerPorId(req, res) {
      try {
        const data = await usuarioService.obtenerUsuario(req.params.id);
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

    async actualizar(req, res) {
      try {
        const data = await usuarioService.actualizarUsuario(req.params.id, req.body || {});
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
