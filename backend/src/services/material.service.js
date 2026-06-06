const materialRepository = require('../repositories/material.repository');
const { pool } = require('../config/db');
const { crearRepositorioClase } = require('../repositories/clase.repository');

const claseRepository = crearRepositorioClase({ pool });

function requerirCampos(body, fields) {
  for (const field of fields) {
    if (body[field] == null || String(body[field]).trim() === '') {
      throw new Error(`Campo obligatorio: ${field}`);
    }
  }
}

function listarMateriales() {
  return materialRepository.buscarTodos();
}

async function crearMaterial(body) {
  const datosMaterial = {
    ...body,
    id_clase: body.id_clase,
  };

  requerirCampos(datosMaterial, ['id_clase', 'titulo']);

  const clase = await claseRepository.buscarPorId(datosMaterial.id_clase);
  if (!clase) throw new Error('id_clase no valido');

  return materialRepository.crear(datosMaterial);
}

module.exports = {
  listarMateriales,
  crearMaterial,
};
