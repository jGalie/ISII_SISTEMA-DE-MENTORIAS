const { mapearClase } = require('../models/clase.model');

/**
 * Repository de clases.
 *
 * Esta capa encapsula el acceso a MySQL. Los services no conocen sentencias SQL
 * ni detalles de tablas; solamente invocan operaciones de persistencia con
 * nombres del dominio.
 */
function crearRepositorioClase({ pool }) {
  /**
   * Consulta base reutilizable para obtener clases con informacion del mentor
   * y de la materia. Centralizarla evita inconsistencias entre listados y
   * busquedas puntuales.
   */
  const baseSelect = `
    SELECT
      c.id_clase,
      c.titulo,
      c.descripcion,
      c.fecha,
      c.modalidad,
      c.id_mentor,
      c.id_materia,
      c.precio,
      c.ubicacion,
      c.cupo_maximo,
      c.cupo_actual,
      u.nombre AS mentor_nombre,
      u.email AS mentor_email,
      u.niveles_educativos AS mentor_niveles_educativos,
      m.nombre AS materia_nombre,
      AVG(v.estrellas) AS promedio_estrellas,
      COUNT(v.id_valoracion) AS cantidad_valoraciones
    FROM clases c
    INNER JOIN usuarios u ON u.id_usuario = c.id_mentor
    LEFT JOIN materias m ON m.id_materia = c.id_materia
    LEFT JOIN valoraciones v ON v.id_clase = c.id_clase
  `;
  const baseGroup = 'GROUP BY c.id_clase, u.id_usuario, m.id_materia';

  return {
    async crearClase({ titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo }) {
      // Inserta la clase y luego vuelve a buscarla para devolver el objeto con
      // el mismo formato que usan las demas consultas.
      const [resultado] = await pool.query(
        `
          INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `,
        [titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo]
      );

      const id_clase_creada = resultado.insertId;
      return this.buscarPorId(id_clase_creada);
    },

    async buscarTodas(filtros = {}) {
      // Se priorizan las clases proximas para que el listado resulte mas util
      // para estudiantes y mentores.
      const condiciones = [];
      const valores = [];
      const busqueda = String(filtros.q || filtros.busqueda || '').trim();
      const modalidad = String(filtros.modalidad || '').trim().toLowerCase();
      const materia = String(filtros.materia || '').trim();
      const idMateria = Number(filtros.id_materia || filtros.materiaId);

      if (busqueda) {
        condiciones.push(`(
          c.titulo LIKE ?
          OR c.descripcion LIKE ?
          OR u.nombre LIKE ?
          OR m.nombre LIKE ?
        )`);
        const patron = `%${busqueda}%`;
        valores.push(patron, patron, patron, patron);
      }

      if (['virtual', 'online'].includes(modalidad)) {
        condiciones.push('c.modalidad = ?');
        valores.push('virtual');
      } else if (['presencial', 'cerca', 'cerca de mi', 'cerca-de-mi'].includes(modalidad)) {
        condiciones.push('c.modalidad = ?');
        valores.push('presencial');
      }

      if (Number.isInteger(idMateria) && idMateria > 0) {
        condiciones.push('c.id_materia = ?');
        valores.push(idMateria);
      } else if (materia) {
        condiciones.push('m.nombre LIKE ?');
        valores.push(`%${materia}%`);
      }

      const whereSql = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
      const [filasClases] = await pool.query(`
        ${baseSelect}
        ${whereSql}
        ${baseGroup}
        ORDER BY c.fecha ASC, c.id_clase ASC
      `, valores);

      return filasClases.map(mapearClase);
    },

    async buscarPorId(id_clase) {
      // LIMIT 1 expresa que el identificador de clase es unico en la tabla.
      const [filasClase] = await pool.query(
        `
          ${baseSelect}
          WHERE c.id_clase = ?
          ${baseGroup}
          LIMIT 1
        `,
        [Number(id_clase)]
      );

      return filasClase.length ? mapearClase(filasClase[0]) : null;
    },

    async buscarPorMentor(id_mentor) {
      // Permite obtener el tablero de clases correspondiente a un mentor.
      const [filasClasesMentor] = await pool.query(
        `
          ${baseSelect}
          WHERE c.id_mentor = ?
          ${baseGroup}
          ORDER BY c.fecha ASC, c.id_clase ASC
        `,
        [Number(id_mentor)]
      );

      return filasClasesMentor.map(mapearClase);
    },

    async actualizarClase(id, { titulo, descripcion, fecha, modalidad, id_materia, precio, ubicacion, cupo_maximo }) {
      // Luego de actualizar, se vuelve a leer el registro para devolverlo
      // normalizado y listo para consumir desde otras capas.
      await pool.query(
        `
          UPDATE clases
          SET titulo = ?, descripcion = ?, fecha = ?, modalidad = ?, id_materia = ?, precio = ?, ubicacion = ?, cupo_maximo = ?
          WHERE id_clase = ?
        `,
        [titulo, descripcion, fecha, modalidad, id_materia, precio, ubicacion, cupo_maximo, Number(id)]
      );

      return this.buscarPorId(id);
    },

    async eliminarClase(id) {
      // Se recupera la clase antes de eliminarla para poder responder con el
      // recurso que fue removido.
      const clase = await this.buscarPorId(id);
      if (!clase) return null;

      await pool.query('DELETE FROM valoraciones WHERE id_clase = ?', [Number(id)]);
      await pool.query('DELETE FROM inscripciones WHERE id_clase = ?', [Number(id)]);
      await pool.query('DELETE FROM clases WHERE id_clase = ?', [Number(id)]);
      return clase;
    },

    async incrementarCupoActual(id_clase) {
      const [resultado] = await pool.query(
        `
          UPDATE clases
          SET cupo_actual = cupo_actual + 1
          WHERE id_clase = ?
            AND cupo_actual < cupo_maximo
        `,
        [Number(id_clase)]
      );

      if (resultado.affectedRows === 0) return null;
      return this.buscarPorId(id_clase);
    },

    async decrementarCupoActual(id_clase) {
      await pool.query(
        `
          UPDATE clases
          SET cupo_actual = GREATEST(cupo_actual - 1, 0)
          WHERE id_clase = ?
        `,
        [Number(id_clase)]
      );

      return this.buscarPorId(id_clase);
    },
  };
}

module.exports = {
  crearRepositorioClase,
};
