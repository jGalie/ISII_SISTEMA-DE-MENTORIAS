const { Router } = require('express');

function createAuthRoutes({ authController }) {
  const router = Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);

  return router;
}

module.exports = {
  createAuthRoutes,
};
