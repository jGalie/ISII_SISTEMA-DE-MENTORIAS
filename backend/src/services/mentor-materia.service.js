const mentorMateriaRepository = require('../repositories/mentor-materia.repository');
const usuarioRepository = require('../repositories/usuario.repository');
const materiaRepository = require('../repositories/materia.repository');

function requireFields(body, fields) {
  for (const field of fields) {
    if (body[field] == null || String(body[field]).trim() === '') {
      throw new Error(`Campo obligatorio: ${field}`);
    }
  }
}

async function listar(filtros = {}) {
  if (filtros.mentorId) {
    return mentorMateriaRepository.findByMentorId(filtros.mentorId);
  }

  return mentorMateriaRepository.findAll();
}

async function crear(body) {
  requireFields(body, ['mentorId', 'materiaId']);

  const mentor = await usuarioRepository.findById(body.mentorId);
  if (!mentor || mentor.rol !== 'mentor') {
    throw new Error('mentorId debe ser un usuario mentor');
  }

  const materia = await materiaRepository.findById(body.materiaId);
  if (!materia) {
    throw new Error('materiaId no valido');
  }

  return mentorMateriaRepository.create(body);
}

module.exports = {
  listar,
  crear,
};
