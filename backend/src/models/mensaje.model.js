function mapearMensaje(row) {
  if (!row) return null;
  return {
    id: row.id ?? row.id_mensaje,
    id_mensaje: row.id_mensaje ?? row.id,
    id_inscripcion: row.id_inscripcion ?? row.inscripcionId,
    inscripcionId: row.inscripcionId ?? row.id_inscripcion,
    id_remitente: row.id_remitente ?? row.remitenteId,
    remitenteId: row.remitenteId ?? row.id_remitente,
    id_destinatario: row.id_destinatario ?? row.destinatarioId,
    destinatarioId: row.destinatarioId ?? row.id_destinatario,
    contenido: row.contenido,
    fechaEnvio: row.fechaEnvio ?? row.fecha_envio,
    fechaLectura: row.fechaLectura ?? row.fecha_lectura ?? null,
    remitenteNombre: row.remitenteNombre ?? row.remitente_nombre ?? null,
    destinatarioNombre: row.destinatarioNombre ?? row.destinatario_nombre ?? null,
  };
}

module.exports = { mapearMensaje };
