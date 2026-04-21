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

async function ensureColumn(tableName, columnName, sql) {
  if (!(await hasColumn(tableName, columnName))) {
    await pool.query(sql);
  }
}

async function seedSubjects() {
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

  await ensureColumn(
    'usuarios',
    'niveles_educativos',
    'ALTER TABLE usuarios ADD COLUMN niveles_educativos TEXT NULL AFTER rol'
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

  await ensureColumn(
    'clases',
    'modalidad',
    "ALTER TABLE clases ADD COLUMN modalidad ENUM('virtual', 'presencial') NOT NULL DEFAULT 'virtual' AFTER fecha"
  );
  await ensureColumn(
    'clases',
    'id_materia',
    'ALTER TABLE clases ADD COLUMN id_materia INT NULL AFTER id_mentor'
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

  await seedSubjects();

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
      INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia)
      SELECT ?, ?, ?, ?, u.id_usuario, m.id_materia
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
      'Ingenieria de Software II',
      'mentor@mentorix.com',
      'Mentoria de Arquitectura en Capas',
    ]
  );

  await pool.query(
    `
      INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia)
      SELECT ?, ?, ?, ?, u.id_usuario, m.id_materia
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
      'Bases de Datos',
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
