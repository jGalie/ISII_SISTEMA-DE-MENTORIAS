function mapearValoracion(row) {
  if (!row) return null;
  return {
    id: row.id ?? row.id_valoracion,
    claseId: row.claseId ?? row.id_clase,
    estudianteId: row.estudianteId ?? row.id_estudiante,
    mentorId: row.mentorId ?? row.id_mentor,
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
