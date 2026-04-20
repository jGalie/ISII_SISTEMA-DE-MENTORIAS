const { Router } = require('express');

function createClaseRoutes({ claseController }) {
  const router = Router();

  router.get('/', claseController.list);
  router.get('/:id', claseController.getById);
  router.post('/', claseController.create);
  router.put('/:id', claseController.update);
  router.delete('/:id', claseController.remove);

  return router;
}

module.exports = {
  createClaseRoutes,
};
