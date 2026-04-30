const { pool } = require('../config/db');
const { mapearMateria } = require('../models/materia.model');

function normalizarNombre(value) {
  return String(value || '').trim();
}

function normalizarCodigo(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 30);
}

async function buscarTodos() {
  const [rows] = await pool.query(
    'SELECT id_materia, nombre, codigo FROM materias ORDER BY nombre ASC, id_materia ASC'
  );
  return rows.map(mapearMateria);
}

async function buscarPorId(id) {
  const [rows] = await pool.query(
    'SELECT id_materia, nombre, codigo FROM materias WHERE id_materia = ? LIMIT 1',
    [Number(id)]
  );
  return rows.length ? mapearMateria(rows[0]) : null;
}

async function buscarPorNombre(nombre) {
  const normalized = normalizarNombre(nombre);
  if (!normalized) return null;

  const [rows] = await pool.query(
    'SELECT id_materia, nombre, codigo FROM materias WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
    [normalized]
  );
  return rows.length ? mapearMateria(rows[0]) : null;
}

async function crear(data, executor = pool) {
  const nombre = normalizarNombre(data?.nombre);
  const codigo = normalizarCodigo(data?.codigo || nombre);

  const [result] = await executor.query(
    `
      INSERT INTO materias (nombre, codigo)
      VALUES (?, ?)
    `,
    [nombre, codigo]
  );

  return {
    id: result.insertId,
    nombre,
    codigo,
  };
}

async function buscarOCrearPorNombre(nombre, executor = pool) {
  const normalized = normalizarNombre(nombre);
  if (!normalized) return null;

  const [rows] = await executor.query(
    'SELECT id_materia, nombre, codigo FROM materias WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
    [normalized]
  );

  if (rows.length) {
    return mapearMateria(rows[0]);
  }

  let codigoBase = normalizarCodigo(normalized) || 'MATERIA';
  let codigo = codigoBase;
  let attempt = 1;

  while (true) {
    try {
      return await crear({ nombre: normalized, codigo }, executor);
    } catch (error) {
      if (error?.code !== 'ER_DUP_ENTRY') throw error;
      attempt += 1;
      codigo = `${codigoBase}_${attempt}`.slice(0, 30);
    }
  }
}

module.exports = {
  buscarTodos,
  buscarPorId,
  buscarPorNombre,
  buscarOCrearPorNombre,
  crear,
};
