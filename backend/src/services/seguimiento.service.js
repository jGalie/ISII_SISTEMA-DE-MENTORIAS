const seguimientoRepository = require('../repositories/seguimiento.repository');
const inscripcionRepository = require('../repositories/inscripcion.repository');

function requireFields(body, fields) {
  for (const f of fields) {
    if (body[f] == null || String(body[f]).trim() === '') {
      throw new Error(`Campo obligatorio: ${f}`);
    }
  }
}

function listar() {
  return seguimientoRepository.findAll();
}

function crear(body) {
  requireFields(body, ['inscripcionId', 'notas']);
  const ins = inscripcionRepository.findById(body.inscripcionId);
  if (!ins) throw new Error('inscripcionId no válido');
  return seguimientoRepository.create(body);
}

module.exports = {
  listar,
  crear,
};
