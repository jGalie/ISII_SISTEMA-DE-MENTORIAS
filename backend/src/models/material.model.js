function mapearMaterial(row) {
  if (!row) return null;
  return {
    id_material: row.id_material,
    id_clase: row.id_clase,
    titulo: row.titulo,
    url: row.url,
    fecha_creacion: row.fecha_creacion,
  };
}

module.exports = {
  mapearMaterial,
};
