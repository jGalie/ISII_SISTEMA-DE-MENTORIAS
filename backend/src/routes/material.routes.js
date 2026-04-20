const { Router } = require('express');
const materialController = require('../controllers/material.controller');

const router = Router();

router.get('/', materialController.list);
router.post('/', materialController.create);

module.exports = router;
