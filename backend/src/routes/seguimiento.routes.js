const { Router } = require('express');
const seguimientoController = require('../controllers/seguimiento.controller');

const router = Router();

router.get('/', seguimientoController.list);
router.post('/', seguimientoController.create);

module.exports = router;
