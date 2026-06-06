function mapearValoracion(row) {
  if (!row) return null;
  return {
    id: row.id ?? row.id_valoracion,
    id_clase: row.id_clase,
    id_estudiante: row.id_estudiante,
    id_mentor: row.id_mentor,
    estrellas: Number(row.estrellas),
    comentario: row.comentario || '',
    fecha: row.fecha,
    estudianteNombre: row.estudianteNombre ?? row.estudiante_nombre ?? null,
    claseTitulo: row.claseTitulo ?? row.clase_titulo ?? null,
  };
}

module.exports = {
  mapearValoracion,
};
