const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mentorias_bd',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

async function hasColumn(tableName, columnName) {
  const [rows] = await pool.query(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [dbConfig.database, tableName, columnName]
  );

  return rows.length > 0;
}

async function ensureDatabaseSchema() {
  const bootstrapPool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
  });

  await bootstrapPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  await bootstrapPool.end();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id_usuario INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      rol ENUM('mentor', 'estudiante') NOT NULL DEFAULT 'estudiante'
    )
  `);

  const legacyClases =
    (await hasColumn('clases', 'materia_id')) ||
    (await hasColumn('clases', 'mentor_id')) ||
    (await hasColumn('clases', 'fecha_inicio'));
  const legacyInscripciones =
    (await hasColumn('inscripciones', 'estudiante_id')) ||
    (await hasColumn('inscripciones', 'fecha'));

  if (legacyInscripciones || legacyClases) {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DROP TABLE IF EXISTS mensajes');
    await pool.query('DROP TABLE IF EXISTS materiales');
    await pool.query('DROP TABLE IF EXISTS seguimientos');
    await pool.query('DROP TABLE IF EXISTS inscripciones');
    await pool.query('DROP TABLE IF EXISTS clases');
    await pool.query('DROP TABLE IF EXISTS mentor_materias');
    await pool.query('DROP TABLE IF EXISTS materias');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clases (
      id_clase INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(100) NOT NULL,
      descripcion TEXT NOT NULL,
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      id_mentor INT NOT NULL,
      FOREIGN KEY (id_mentor) REFERENCES usuarios(id_usuario)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inscripciones (
      id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      id_clase INT NOT NULL,
      estado ENUM('pendiente', 'aceptada', 'rechazada') NOT NULL DEFAULT 'pendiente',
      fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
      FOREIGN KEY (id_clase) REFERENCES clases(id_clase),
      CONSTRAINT uq_inscripcion_usuario_clase UNIQUE (id_usuario, id_clase)
    )
  `);

  const mentorHash = '$2a$10$nbSbLJy8ssc6yeBDeJznTOo/8r03KSWi9h.zDSPsxM0SVVDod9aFu';

  await pool.query(
    `
      INSERT INTO usuarios (nombre, email, password_hash, rol)
      SELECT ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM usuarios WHERE email = ?
      )
    `,
    ['Mentor Demo', 'mentor@mentorix.com', mentorHash, 'mentor', 'mentor@mentorix.com']
  );

  await pool.query(
    `
      INSERT INTO clases (titulo, descripcion, fecha, id_mentor)
      SELECT ?, ?, ?, id_usuario
      FROM usuarios
      WHERE email = ?
      AND NOT EXISTS (
        SELECT 1 FROM clases WHERE titulo = ?
      )
    `,
    [
      'Mentoría de Arquitectura en Capas',
      'Sesión práctica para entender controllers, services y repositories en aplicaciones Node.js.',
      '2026-05-05 18:00:00',
      'mentor@mentorix.com',
      'Mentoría de Arquitectura en Capas',
    ]
  );

  await pool.query(
    `
      INSERT INTO clases (titulo, descripcion, fecha, id_mentor)
      SELECT ?, ?, ?, id_usuario
      FROM usuarios
      WHERE email = ?
      AND NOT EXISTS (
        SELECT 1 FROM clases WHERE titulo = ?
      )
    `,
    [
      'API REST con Express y MySQL',
      'Buenas prácticas para modelar recursos, validar entradas y persistir datos con mysql2/promise.',
      '2026-05-07 19:30:00',
      'mentor@mentorix.com',
      'API REST con Express y MySQL',
    ]
  );
}

module.exports = {
  dbConfig,
  pool,
  ensureDatabaseSchema,
};
