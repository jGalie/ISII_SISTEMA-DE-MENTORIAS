/**
 * Entidad: Usuario (mentor o estudiante).
 * @typedef {Object} Usuario
 * @property {number} id
 * @property {string} nombre
 * @property {string} email
 * @property {'mentor'|'estudiante'} rol
 */

function toUsuario(row) {
  if (!row) return null;
  let nivelesEducativos = [];
  if (Array.isArray(row.niveles_educativos)) {
    nivelesEducativos = row.niveles_educativos;
  } else if (typeof row.niveles_educativos === 'string' && row.niveles_educativos.trim()) {
    try {
      nivelesEducativos = JSON.parse(row.niveles_educativos);
    } catch {
      nivelesEducativos = [];
    }
  }

  return {
    id: row.id ?? row.id_usuario,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
    nivelesEducativos,
  };
}

function toUsuarioConPassword(row) {
  if (!row) return null;
  return {
    ...toUsuario(row),
    password_hash: row.password_hash,
  };
}

module.exports = { toUsuario, toUsuarioConPassword };
