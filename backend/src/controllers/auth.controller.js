function resolveStatus(error, fallbackStatus) {
  if (error.code === 'VALIDATION_ERROR' || error.code === 'DUPLICATE_USER') {
    return 400;
  }
  if (error.code === 'INVALID_CREDENTIALS') {
    return 401;
  }
  return fallbackStatus;
}

function createAuthController({ authService }) {
  return {
    async register(req, res) {
      try {
        const data = await authService.register(req.body || {});
        res.status(201).json({ success: true, data });
      } catch (err) {
        res.status(resolveStatus(err, 500)).json({ success: false, error: err.message });
      }
    },

    async login(req, res) {
      try {
        const data = await authService.login(req.body || {});
        res.json({ success: true, data });
      } catch (err) {
        res.status(resolveStatus(err, 500)).json({ success: false, error: err.message });
      }
    },
  };
}

module.exports = {
  createAuthController,
};
