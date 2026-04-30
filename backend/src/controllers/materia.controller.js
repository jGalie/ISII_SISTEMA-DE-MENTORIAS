const materiaService = require('../services/materia.service');

async function listar(req, res) {
  try {
    const data = await materiaService.listar();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function crear(req, res) {
  try {
    const data = await materiaService.crear(req.body || {});
    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { listar, crear };
