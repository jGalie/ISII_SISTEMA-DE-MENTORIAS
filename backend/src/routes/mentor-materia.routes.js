const { Router } = require('express');
const mentorMateriaController = require('../controllers/mentor-materia.controller');

const router = Router();

router.get('/', mentorMateriaController.list);
router.post('/', mentorMateriaController.create);

module.exports = router;
