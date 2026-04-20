const { Router } = require('express');
const mensajeController = require('../controllers/mensaje.controller');

const router = Router();

router.get('/', mensajeController.list);
router.post('/', mensajeController.create);

module.exports = router;
