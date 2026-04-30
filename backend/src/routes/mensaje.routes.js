const { Router } = require('express');
const mensajeController = require('../controllers/mensaje.controller');

const router = Router();

router.get('/', mensajeController.listar);
router.post('/', mensajeController.crear);

module.exports = router;
