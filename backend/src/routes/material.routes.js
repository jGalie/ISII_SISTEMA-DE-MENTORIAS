const { Router } = require('express');
const materialController = require('../controllers/material.controller');

const router = Router();

router.get('/', materialController.listar);
router.post('/', materialController.crear);

module.exports = router;
