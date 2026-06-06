function mapearSeguimiento(row) {
  if (!row) return null;
  return {
    id_seguimiento: row.id_seguimiento,
    id_inscripcion: row.id_inscripcion,
    notas: row.notas,
    fecha_seguimiento: row.fecha_seguimiento,
  };
}

module.exports = { mapearSeguimiento };
