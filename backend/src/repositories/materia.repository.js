const { pool: defaultPool } = require('../config/db');
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

function crearRepositorioMateria({ pool = defaultPool } = {}) {
  return {
    async buscarTodos() {
      const [rows] = await pool.query(
        'SELECT id_materia, nombre, codigo FROM materias ORDER BY nombre ASC, id_materia ASC'
      );
      return rows.map(mapearMateria);
    },

    async buscarPorId(id_materia) {
      const [rows] = await pool.query(
        'SELECT id_materia, nombre, codigo FROM materias WHERE id_materia = ? LIMIT 1',
        [Number(id_materia)]
      );
      return rows.length ? mapearMateria(rows[0]) : null;
    },

    async buscarPorNombre(nombre) {
      const nombre_normalizado = normalizarNombre(nombre);
      if (!nombre_normalizado) return null;

      const [rows] = await pool.query(
        'SELECT id_materia, nombre, codigo FROM materias WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
        [nombre_normalizado]
      );
      return rows.length ? mapearMateria(rows[0]) : null;
    },

    async crear(data, executor = pool) {
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
        id_materia: result.insertId,
        nombre,
        codigo,
      };
    },

    async buscarOCrearPorNombre(nombre, executor = pool) {
      const nombre_normalizado = normalizarNombre(nombre);
      if (!nombre_normalizado) return null;

      const [rows] = await executor.query(
        'SELECT id_materia, nombre, codigo FROM materias WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
        [nombre_normalizado]
      );

      if (rows.length) {
        return mapearMateria(rows[0]);
      }

      const codigo_base = normalizarCodigo(nombre_normalizado) || 'MATERIA';
      let codigo = codigo_base;
      let attempt = 1;

      while (true) {
        try {
          return await this.crear({ nombre: nombre_normalizado, codigo }, executor);
        } catch (error) {
          if (error?.code !== 'ER_DUP_ENTRY') throw error;
          attempt += 1;
          codigo = `${codigo_base}_${attempt}`.slice(0, 30);
        }
      }
    },
  };
}

const materiaRepository = crearRepositorioMateria({ pool: defaultPool });

module.exports = {
  crearRepositorioMateria,
  ...materiaRepository,
};
