const materialService = require('../services/material.service');

function listar(req, res) {
  try {
    const data = materialService.listarMateriales();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function crear(req, res) {
  try {
    // La creacion puede requerir consultar la clase asociada, por eso se espera
    // la respuesta del service antes de contestar al cliente.
    const data = await materialService.crearMaterial(req.body || {});
    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { listar, crear };
