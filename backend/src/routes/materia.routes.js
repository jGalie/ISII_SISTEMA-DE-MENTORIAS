const { Router } = require('express');
const materiaController = require('../controllers/materia.controller');

const router = Router();

router.get('/', materiaController.list);
router.post('/', materiaController.create);

module.exports = router;
