const mensajeRepository = require('../repositories/mensaje.repository');
const usuarioRepository = require('../repositories/usuario.repository');

function requireFields(body, fields) {
  for (const f of fields) {
    if (body[f] == null || String(body[f]).trim() === '') {
      throw new Error(`Campo obligatorio: ${f}`);
    }
  }
}

function listar() {
  return mensajeRepository.findAll();
}

function crear(body) {
  requireFields(body, ['remitenteId', 'destinatarioId', 'contenido']);
  if (!usuarioRepository.findById(body.remitenteId)) {
    throw new Error('remitenteId no válido');
  }
  if (!usuarioRepository.findById(body.destinatarioId)) {
    throw new Error('destinatarioId no válido');
  }
  return mensajeRepository.create(body);
}

module.exports = {
  listar,
  crear,
};
