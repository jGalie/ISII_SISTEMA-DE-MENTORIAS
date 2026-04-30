const seguimientoService = require('../services/seguimiento.service');

function listar(req, res) {
  try {
    const data = seguimientoService.listar();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function crear(req, res) {
  try {
    const data = seguimientoService.crear(req.body || {});
    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { listar, crear };
