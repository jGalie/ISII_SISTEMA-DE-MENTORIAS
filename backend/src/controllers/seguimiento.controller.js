const seguimientoService = require('../services/seguimiento.service');

function list(req, res) {
  try {
    const data = seguimientoService.listar();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function create(req, res) {
  try {
    const data = seguimientoService.crear(req.body || {});
    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { list, create };
