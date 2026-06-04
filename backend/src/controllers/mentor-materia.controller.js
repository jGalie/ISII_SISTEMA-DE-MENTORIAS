const mentorMateriaService = require('../services/mentor-materia.service');

async function listar(req, res) {
  try {
    const data = await mentorMateriaService.listarMateriasDelMentor(req.query || {});
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function crear(req, res) {
  try {
    const data = await mentorMateriaService.asociarMateriaMentor(req.body || {});
    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { listar, crear };
