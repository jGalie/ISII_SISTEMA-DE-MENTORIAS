const mentorMateriaRepository = require('../repositories/mentor-materia.repository');
const usuarioRepository = require('../repositories/usuario.repository');
const materiaRepository = require('../repositories/materia.repository');

function requerirCampos(body, fields) {
  for (const field of fields) {
    if (body[field] == null || String(body[field]).trim() === '') {
      throw new Error(`Campo obligatorio: ${field}`);
    }
  }
}

async function listar(filtros = {}) {
  if (filtros.mentorId) {
    return mentorMateriaRepository.buscarPorMentorId(filtros.mentorId);
  }

  return mentorMateriaRepository.buscarTodos();
}

async function crear(body) {
  requerirCampos(body, ['mentorId', 'materiaId']);

  const mentor = await usuarioRepository.buscarPorId(body.mentorId);
  if (!mentor || mentor.rol !== 'mentor') {
    throw new Error('mentorId debe ser un usuario mentor');
  }

  const materia = await materiaRepository.buscarPorId(body.materiaId);
  if (!materia) {
    throw new Error('materiaId no valido');
  }

  return mentorMateriaRepository.crear(body);
}

module.exports = {
  listar,
  crear,
};
