const mensajeRepository = require('../repositories/mensaje.repository');
const usuarioRepository = require('../repositories/usuario.repository');

function requerirCampos(body, fields) {
  for (const f of fields) {
    if (body[f] == null || String(body[f]).trim() === '') {
      throw new Error(`Campo obligatorio: ${f}`);
    }
  }
}

function listar() {
  return mensajeRepository.buscarTodos();
}

function crear(body) {
  requerirCampos(body, ['remitenteId', 'destinatarioId', 'contenido']);
  if (!usuarioRepository.buscarPorId(body.remitenteId)) {
    throw new Error('remitenteId no válido');
  }
  if (!usuarioRepository.buscarPorId(body.destinatarioId)) {
    throw new Error('destinatarioId no válido');
  }
  return mensajeRepository.crear(body);
}

module.exports = {
  listar,
  crear,
};
