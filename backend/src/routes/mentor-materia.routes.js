const { Router } = require('express');
const mentorMateriaController = require('../controllers/mentor-materia.controller');

const router = Router();

router.get('/', mentorMateriaController.listar);
router.post('/', mentorMateriaController.crear);

module.exports = router;
