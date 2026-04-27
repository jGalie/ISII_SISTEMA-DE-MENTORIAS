/**
 * Entidad: Clase.
 *
 * Este modelo documenta la forma en que la aplicacion representa una clase una
 * vez que sale de la base de datos. Su finalidad es independizar al resto del
 * sistema de los nombres fisicos de las columnas SQL.
 *
 * @typedef {Object} Clase
 * @property {number} id
 * @property {string} titulo
 * @property {string} descripcion
 * @property {string} fecha
 * @property {'virtual'|'presencial'} modalidad
 * @property {number} mentorId
 * @property {?number} materiaId
 * @property {?string} materiaNombre
 * @property {?number} precio
 * @property {?string} ubicacion
 * @property {number} cupoMaximo
 * @property {number} cupoActual
 * @property {boolean} completa
 * @property {?number} promedioEstrellas
 * @property {number} cantidadValoraciones
 * @property {string} mentorNombre
 * @property {string} mentorEmail
 */

/**
 * Convierte una fila obtenida desde MySQL en un objeto de dominio. Esta funcion
 * actua como frontera entre la estructura relacional de la base de datos y el
 * formato que consume el frontend.
 */
function mapearClase(row) {
  if (!row) return null;
  let mentorNivelesEducativos = [];
  if (typeof row.mentor_niveles_educativos === 'string' && row.mentor_niveles_educativos.trim()) {
    try {
      mentorNivelesEducativos = JSON.parse(row.mentor_niveles_educativos);
    } catch {
      mentorNivelesEducativos = [];
    }
  }
  return {
    id: row.id ?? row.id_clase,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fecha: row.fecha,
    modalidad: row.modalidad || 'virtual',
    mentorId: row.mentorId ?? row.id_mentor,
    materiaId: row.materiaId ?? row.id_materia ?? null,
    materiaNombre: row.materiaNombre ?? row.materia_nombre ?? null,
    precio: row.precio != null ? Number(row.precio) : null,
    ubicacion: row.ubicacion ?? null,
    cupoMaximo: Number(row.cupoMaximo ?? row.cupo_maximo ?? 1),
    cupoActual: Number(row.cupoActual ?? row.cupo_actual ?? 0),
    completa: Number(row.cupoActual ?? row.cupo_actual ?? 0) >= Number(row.cupoMaximo ?? row.cupo_maximo ?? 1),
    promedioEstrellas:
      row.promedioEstrellas != null || row.promedio_estrellas != null
        ? Number(row.promedioEstrellas ?? row.promedio_estrellas)
        : null,
    cantidadValoraciones: Number(row.cantidadValoraciones ?? row.cantidad_valoraciones ?? 0),
    mentorNombre: row.mentorNombre ?? row.mentor_nombre ?? null,
    mentorEmail: row.mentorEmail ?? row.mentor_email ?? null,
    mentorNivelesEducativos,
  };
}

module.exports = { mapearClase };
