function resolverEstadoHttp(error, fallbackStatus) {
  if (error.code === 'VALIDATION_ERROR' || error.code === 'DUPLICATE_USER') {
    return 400;
  }
  if (error.code === 'INVALID_CREDENTIALS') {
    return 401;
  }
  return fallbackStatus;
}

function crearControladorAuth({ authService }) {
  return {
    async registrar(req, res) {
      try {
        const data = await authService.registrar(req.body || {});
        res.status(201).json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err, 500)).json({ success: false, error: err.message });
      }
    },

    async iniciarSesion(req, res) {
      try {
        const data = await authService.iniciarSesion(req.body || {});
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolverEstadoHttp(err, 500)).json({ success: false, error: err.message });
      }
    },
  };
}

module.exports = {
  crearControladorAuth,
};
