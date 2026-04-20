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
  return {
    id: row.id ?? row.id_usuario,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
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
