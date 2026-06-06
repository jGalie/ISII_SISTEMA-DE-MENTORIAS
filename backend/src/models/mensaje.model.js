function mapearMensaje(row) {
  if (!row) return null;
  return {
    id_mensaje: row.id_mensaje ?? row.id,
    id_inscripcion: row.id_inscripcion,
    id_remitente: row.id_remitente,
    id_destinatario: row.id_destinatario,
    contenido: row.contenido,
    fecha_envio: row.fecha_envio,
    fecha_lectura: row.fecha_lectura ?? null,
    remitente_nombre: row.remitente_nombre ?? null,
    destinatario_nombre: row.destinatario_nombre ?? null,
  };
}

module.exports = { mapearMensaje };
