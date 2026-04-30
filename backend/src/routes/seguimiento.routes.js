const { Router } = require('express');
const seguimientoController = require('../controllers/seguimiento.controller');

const router = Router();

router.get('/', seguimientoController.listar);
router.post('/', seguimientoController.crear);

module.exports = router;
