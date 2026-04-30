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

/**
 * Estas utilidades permiten que el backend revise si faltan columnas
 * y adapte el esquema durante el arranque del proyecto.
 */
async function tieneColumna(tableName, columnName) {
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

async function asegurarColumna(tableName, columnName, sql) {
  if (!(await tieneColumna(tableName, columnName))) {
    await pool.query(sql);
  }
}

async function sembrarMaterias() {
  // Se cargan materias base para contar con datos iniciales del dominio.
  const subjects = [
    ['Matematica', 'MAT'],
    ['Fisica', 'FIS'],
    ['Quimica', 'QUI'],
    ['Biologia', 'BIO'],
    ['Lengua y Literatura', 'LYL'],
    ['Historia', 'HIS'],
    ['Geografia', 'GEO'],
    ['Ingles', 'ING'],
    ['Programacion', 'PROG'],
    ['Bases de Datos', 'BD'],
    ['Ingenieria de Software II', 'ISII'],
    ['Algebra', 'ALG'],
    ['Calculo', 'CAL'],
    ['Economia', 'ECO'],
    ['Contabilidad', 'CONT'],
  ];

  for (const [nombre, codigo] of subjects) {
    await pool.query(
      `
        INSERT INTO materias (nombre, codigo)
        SELECT ?, ?
        WHERE NOT EXISTS (
          SELECT 1 FROM materias WHERE LOWER(nombre) = LOWER(?)
        )
      `,
      [nombre, codigo, nombre]
    );
  }
}

async function asegurarEsquemaBaseDatos() {
  /**
   * Esta funcion prepara la base de datos completa del MVP:
   * crea la base, crea tablas, incorpora nuevas columnas y
   * deja datos de ejemplo para probar el flujo funcional.
   */
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

  await asegurarColumna(
    'usuarios',
    'niveles_educativos',
    'ALTER TABLE usuarios ADD COLUMN niveles_educativos TEXT NULL AFTER rol'
  );
  await asegurarColumna(
    'usuarios',
    'ubicacion',
    'ALTER TABLE usuarios ADD COLUMN ubicacion VARCHAR(120) NULL AFTER niveles_educativos'
  );
  await asegurarColumna(
    'usuarios',
    'telefono',
    'ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(40) NULL AFTER ubicacion'
  );
  await asegurarColumna(
    'usuarios',
    'mentor_bio',
    'ALTER TABLE usuarios ADD COLUMN mentor_bio TEXT NULL AFTER telefono'
  );
  await asegurarColumna(
    'usuarios',
    'mentor_experiencia',
    'ALTER TABLE usuarios ADD COLUMN mentor_experiencia VARCHAR(120) NULL AFTER mentor_bio'
  );
  await asegurarColumna(
    'usuarios',
    'mentor_link',
    'ALTER TABLE usuarios ADD COLUMN mentor_link VARCHAR(255) NULL AFTER mentor_experiencia'
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS materias (
      id_materia INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      codigo VARCHAR(30) NOT NULL UNIQUE
    )
  `);

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

  await asegurarColumna(
    'clases',
    'modalidad',
    "ALTER TABLE clases ADD COLUMN modalidad ENUM('virtual', 'presencial') NOT NULL DEFAULT 'virtual' AFTER fecha"
  );
  await asegurarColumna(
    'clases',
    'id_materia',
    'ALTER TABLE clases ADD COLUMN id_materia INT NULL AFTER id_mentor'
  );
  await asegurarColumna(
    'clases',
    'precio',
    'ALTER TABLE clases ADD COLUMN precio DECIMAL(10,2) NULL AFTER id_materia'
  );
  await asegurarColumna(
    'clases',
    'ubicacion',
    'ALTER TABLE clases ADD COLUMN ubicacion VARCHAR(255) NULL AFTER precio'
  );
  await asegurarColumna(
    'clases',
    'cupo_maximo',
    'ALTER TABLE clases ADD COLUMN cupo_maximo INT NOT NULL DEFAULT 1 AFTER ubicacion'
  );
  await asegurarColumna(
    'clases',
    'cupo_actual',
    'ALTER TABLE clases ADD COLUMN cupo_actual INT NOT NULL DEFAULT 0 AFTER cupo_maximo'
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mentor_materias (
      id_mentor_materia INT AUTO_INCREMENT PRIMARY KEY,
      id_mentor INT NOT NULL,
      id_materia INT NOT NULL,
      FOREIGN KEY (id_mentor) REFERENCES usuarios(id_usuario),
      FOREIGN KEY (id_materia) REFERENCES materias(id_materia),
      CONSTRAINT uq_mentor_materia UNIQUE (id_mentor, id_materia)
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS valoraciones (
      id_valoracion INT AUTO_INCREMENT PRIMARY KEY,
      id_clase INT NOT NULL,
      id_estudiante INT NOT NULL,
      id_mentor INT NOT NULL,
      estrellas TINYINT NOT NULL,
      comentario TEXT NULL,
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_clase) REFERENCES clases(id_clase),
      FOREIGN KEY (id_estudiante) REFERENCES usuarios(id_usuario),
      FOREIGN KEY (id_mentor) REFERENCES usuarios(id_usuario),
      CONSTRAINT uq_valoracion_clase_estudiante UNIQUE (id_clase, id_estudiante),
      CONSTRAINT chk_valoracion_estrellas CHECK (estrellas BETWEEN 1 AND 5)
    )
  `);

  await pool.query(`
    UPDATE clases c
    SET c.cupo_actual = (
      SELECT COUNT(*)
      FROM inscripciones i
      WHERE i.id_clase = c.id_clase
        AND i.estado = 'aceptada'
    )
  `);

  await sembrarMaterias();

  // Se crea un mentor demo para facilitar pruebas y presentaciones.
  const mentorHash = '$2a$10$nbSbLJy8ssc6yeBDeJznTOo/8r03KSWi9h.zDSPsxM0SVVDod9aFu';

  await pool.query(
    `
      INSERT INTO usuarios (nombre, email, password_hash, rol, niveles_educativos)
      SELECT ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM usuarios WHERE email = ?
      )
    `,
    [
      'Mentor Demo',
      'mentor@mentorix.com',
      mentorHash,
      'mentor',
      JSON.stringify(['secundaria', 'universitario']),
      'mentor@mentorix.com',
    ]
  );

  await pool.query(
    `
      INSERT IGNORE INTO mentor_materias (id_mentor, id_materia)
      SELECT u.id_usuario, m.id_materia
      FROM usuarios u
      INNER JOIN materias m ON LOWER(m.nombre) = LOWER(?)
      WHERE u.email = ?
    `,
    ['Ingenieria de Software II', 'mentor@mentorix.com']
  );

  await pool.query(
    `
      INSERT IGNORE INTO mentor_materias (id_mentor, id_materia)
      SELECT u.id_usuario, m.id_materia
      FROM usuarios u
      INNER JOIN materias m ON LOWER(m.nombre) = LOWER(?)
      WHERE u.email = ?
    `,
    ['Bases de Datos', 'mentor@mentorix.com']
  );

  await pool.query(
    `
      INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
      SELECT ?, ?, ?, ?, u.id_usuario, m.id_materia, ?, ?, ?, 0
      FROM usuarios u
      INNER JOIN materias m ON LOWER(m.nombre) = LOWER(?)
      WHERE u.email = ?
      AND NOT EXISTS (
        SELECT 1 FROM clases WHERE titulo = ?
      )
    `,
    [
      'Mentoria de Arquitectura en Capas',
      'Sesion practica para entender controllers, services y repositories en aplicaciones Node.js.',
      '2026-05-05 18:00:00',
      'virtual',
      12000,
      null,
      6,
      'Ingenieria de Software II',
      'mentor@mentorix.com',
      'Mentoria de Arquitectura en Capas',
    ]
  );

  await pool.query(
    `
      INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
      SELECT ?, ?, ?, ?, u.id_usuario, m.id_materia, ?, ?, ?, 0
      FROM usuarios u
      INNER JOIN materias m ON LOWER(m.nombre) = LOWER(?)
      WHERE u.email = ?
      AND NOT EXISTS (
        SELECT 1 FROM clases WHERE titulo = ?
      )
    `,
    [
      'API REST con Express y MySQL',
      'Buenas practicas para modelar recursos, validar entradas y persistir datos con mysql2/promise.',
      '2026-05-07 19:30:00',
      'presencial',
      15000,
      'Aula 204, Sede Centro',
      8,
      'Bases de Datos',
      'mentor@mentorix.com',
      'API REST con Express y MySQL',
    ]
  );
}

module.exports = {
  dbConfig,
  pool,
  asegurarEsquemaBaseDatos,
};
