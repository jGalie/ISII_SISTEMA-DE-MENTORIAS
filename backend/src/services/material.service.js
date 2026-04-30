const materialRepository = require('../repositories/material.repository');
const { pool } = require('../config/db');
const { crearRepositorioClase } = require('../repositories/clase.repository');

/**
 * Servicio de materiales.
 *
 * Aunque este modulo es mas simple que el flujo de clases, tambien conserva la
 * idea de capas: antes de crear un material valida que la clase asociada exista
 * y luego delega la persistencia al repository correspondiente.
 */
const claseRepository = crearRepositorioClase({ pool });

function requerirCampos(body, fields) {
  for (const f of fields) {
    if (body[f] == null || String(body[f]).trim() === '') {
      throw new Error(`Campo obligatorio: ${f}`);
    }
  }
}

function listar() {
  return materialRepository.buscarTodos();
}

async function crear(body) {
  requerirCampos(body, ['claseId', 'titulo']);
  // El material no debe existir aislado: siempre se vincula a una clase valida.
  const clase = await claseRepository.buscarPorId(body.claseId);
  if (!clase) throw new Error('claseId no válido');
  return materialRepository.crear(body);
}

module.exports = {
  listar,
  crear,
};
