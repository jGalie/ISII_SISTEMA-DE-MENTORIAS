const { Router } = require('express');
const materiaController = require('../controllers/materia.controller');

const router = Router();

router.get('/', materiaController.listar);
router.post('/', materiaController.crear);

module.exports = router;
