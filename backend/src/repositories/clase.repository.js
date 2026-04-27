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
      const [result] = await pool.query(
        `
          INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `,
        [titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo]
      );

      return this.buscarPorId(result.insertId);
    },

    async buscarTodas() {
      // Se priorizan las clases proximas para que el listado resulte mas util
      // para estudiantes y mentores.
      const [rows] = await pool.query(`
        ${baseSelect}
        ${baseGroup}
        ORDER BY c.fecha ASC, c.id_clase ASC
      `);

      return rows.map(mapearClase);
    },

    async buscarPorId(id) {
      // LIMIT 1 expresa que el identificador de clase es unico en la tabla.
      const [rows] = await pool.query(
        `
          ${baseSelect}
          WHERE c.id_clase = ?
          ${baseGroup}
          LIMIT 1
        `,
        [Number(id)]
      );

      return rows.length ? mapearClase(rows[0]) : null;
    },

    async buscarPorMentor(id_mentor) {
      // Permite obtener el tablero de clases correspondiente a un mentor.
      const [rows] = await pool.query(
        `
          ${baseSelect}
          WHERE c.id_mentor = ?
          ${baseGroup}
          ORDER BY c.fecha ASC, c.id_clase ASC
        `,
        [Number(id_mentor)]
      );

      return rows.map(mapearClase);
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

    async incrementarCupoActual(id) {
      const [result] = await pool.query(
        `
          UPDATE clases
          SET cupo_actual = cupo_actual + 1
          WHERE id_clase = ?
            AND cupo_actual < cupo_maximo
        `,
        [Number(id)]
      );

      if (result.affectedRows === 0) return null;
      return this.buscarPorId(id);
    },

    async decrementarCupoActual(id) {
      await pool.query(
        `
          UPDATE clases
          SET cupo_actual = GREATEST(cupo_actual - 1, 0)
          WHERE id_clase = ?
        `,
        [Number(id)]
      );

      return this.buscarPorId(id);
    },
  };
}

module.exports = {
  crearRepositorioClase,
};
