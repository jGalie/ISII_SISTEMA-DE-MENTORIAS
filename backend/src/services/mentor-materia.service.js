const mentorMateriaRepository = require('../repositories/mentor-materia.repository');
const usuarioRepository = require('../repositories/usuario.repository');
const materiaRepository = require('../repositories/materia.repository');

function requireFields(body, fields) {
  for (const f of fields) {
    if (body[f] == null || String(body[f]).trim() === '') {
      throw new Error(`Campo obligatorio: ${f}`);
    }
  }
}

function listar() {
  return mentorMateriaRepository.findAll();
}

function crear(body) {
  requireFields(body, ['mentorId', 'materiaId']);
  const mentor = usuarioRepository.findById(body.mentorId);
  if (!mentor || mentor.rol !== 'mentor') {
    throw new Error('mentorId debe ser un usuario mentor');
  }
  if (!materiaRepository.findById(body.materiaId)) {
    throw new Error('materiaId no válido');
  }
  return mentorMateriaRepository.create(body);
}

module.exports = {
  listar,
  crear,
};
