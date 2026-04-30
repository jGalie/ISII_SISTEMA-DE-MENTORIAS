const seguimientoRepository = require('../repositories/seguimiento.repository');
const inscripcionRepository = require('../repositories/inscripcion.repository');

function requerirCampos(body, fields) {
  for (const f of fields) {
    if (body[f] == null || String(body[f]).trim() === '') {
      throw new Error(`Campo obligatorio: ${f}`);
    }
  }
}

function listar() {
  return seguimientoRepository.buscarTodos();
}

function crear(body) {
  requerirCampos(body, ['inscripcionId', 'notas']);
  const ins = inscripcionRepository.buscarPorId(body.inscripcionId);
  if (!ins) throw new Error('inscripcionId no válido');
  return seguimientoRepository.crear(body);
}

module.exports = {
  listar,
  crear,
};
