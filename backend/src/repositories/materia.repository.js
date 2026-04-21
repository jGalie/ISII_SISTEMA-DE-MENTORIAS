const { pool } = require('../config/db');
const { toMateria } = require('../models/materia.model');

function normalizeName(value) {
  return String(value || '').trim();
}

function normalizeCode(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 30);
}

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id_materia, nombre, codigo FROM materias ORDER BY nombre ASC, id_materia ASC'
  );
  return rows.map(toMateria);
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id_materia, nombre, codigo FROM materias WHERE id_materia = ? LIMIT 1',
    [Number(id)]
  );
  return rows.length ? toMateria(rows[0]) : null;
}

async function findByNombre(nombre) {
  const normalized = normalizeName(nombre);
  if (!normalized) return null;

  const [rows] = await pool.query(
    'SELECT id_materia, nombre, codigo FROM materias WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
    [normalized]
  );
  return rows.length ? toMateria(rows[0]) : null;
}

async function create(data, executor = pool) {
  const nombre = normalizeName(data?.nombre);
  const codigo = normalizeCode(data?.codigo || nombre);

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

async function findOrCreateByNombre(nombre, executor = pool) {
  const normalized = normalizeName(nombre);
  if (!normalized) return null;

  const [rows] = await executor.query(
    'SELECT id_materia, nombre, codigo FROM materias WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
    [normalized]
  );

  if (rows.length) {
    return toMateria(rows[0]);
  }

  let codigoBase = normalizeCode(normalized) || 'MATERIA';
  let codigo = codigoBase;
  let attempt = 1;

  while (true) {
    try {
      return await create({ nombre: normalized, codigo }, executor);
    } catch (error) {
      if (error?.code !== 'ER_DUP_ENTRY') throw error;
      attempt += 1;
      codigo = `${codigoBase}_${attempt}`.slice(0, 30);
    }
  }
}

module.exports = {
  findAll,
  findById,
  findByNombre,
  findOrCreateByNombre,
  create,
};
