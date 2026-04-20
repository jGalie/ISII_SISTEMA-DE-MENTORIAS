/**
 * Entidad: Inscripción de un estudiante a una clase.
 * @typedef {Object} Inscripcion
 * @property {number} id
 * @property {number} usuarioId
 * @property {number} claseId
 * @property {'pendiente'|'aceptada'|'rechazada'} estado
 * @property {string} fechaSolicitud
 */

function toInscripcion(row) {
  if (!row) return null;
  return {
    id: row.id ?? row.id_inscripcion,
    usuarioId: row.usuarioId ?? row.id_usuario,
    claseId: row.claseId ?? row.id_clase,
    estado: row.estado,
    fechaSolicitud: row.fechaSolicitud ?? row.fecha_solicitud,
    claseTitulo: row.claseTitulo ?? row.clase_titulo ?? null,
    claseDescripcion: row.claseDescripcion ?? row.clase_descripcion ?? null,
    claseFecha: row.claseFecha ?? row.clase_fecha ?? null,
    mentorId: row.mentorId ?? row.id_mentor ?? null,
    mentorNombre: row.mentorNombre ?? row.mentor_nombre ?? null,
    usuarioNombre: row.usuarioNombre ?? row.usuario_nombre ?? null,
    usuarioEmail: row.usuarioEmail ?? row.usuario_email ?? null,
  };
}

module.exports = { toInscripcion };
