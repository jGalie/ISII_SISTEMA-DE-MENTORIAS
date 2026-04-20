const materialRepository = require('../repositories/material.repository');
const claseRepository = require('../repositories/clase.repository');

function requireFields(body, fields) {
  for (const f of fields) {
    if (body[f] == null || String(body[f]).trim() === '') {
      throw new Error(`Campo obligatorio: ${f}`);
    }
  }
}

function listar() {
  return materialRepository.findAll();
}

function crear(body) {
  requireFields(body, ['claseId', 'titulo']);
  const clase = claseRepository.findById(body.claseId);
  if (!clase) throw new Error('claseId no válido');
  return materialRepository.create(body);
}

module.exports = {
  listar,
  crear,
};
