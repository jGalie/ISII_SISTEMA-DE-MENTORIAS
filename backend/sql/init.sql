CREATE DATABASE IF NOT EXISTS mentorias_bd;
USE mentorias_bd;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS mensajes;
DROP TABLE IF EXISTS materiales;
DROP TABLE IF EXISTS seguimientos;
DROP TABLE IF EXISTS inscripciones;
DROP TABLE IF EXISTS mentor_materias;
DROP TABLE IF EXISTS clases;
DROP TABLE IF EXISTS materias;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('mentor', 'estudiante') NOT NULL DEFAULT 'estudiante'
);

CREATE TABLE materias (
  id_materia INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE clases (
  id_clase INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATETIME NOT NULL,
  modalidad ENUM('virtual', 'presencial') NOT NULL DEFAULT 'virtual',
  id_mentor INT NOT NULL,
  FOREIGN KEY (id_mentor) REFERENCES usuarios(id_usuario)
);

CREATE TABLE mentor_materias (
  id_mentor_materia INT AUTO_INCREMENT PRIMARY KEY,
  id_mentor INT NOT NULL,
  id_materia INT NOT NULL,
  FOREIGN KEY (id_mentor) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_materia) REFERENCES materias(id_materia),
  CONSTRAINT uq_mentor_materia UNIQUE (id_mentor, id_materia)
);

CREATE TABLE inscripciones (
  id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_clase INT NOT NULL,
  estado ENUM('pendiente', 'aceptada', 'rechazada') NOT NULL DEFAULT 'pendiente',
  fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_clase) REFERENCES clases(id_clase),
  CONSTRAINT uq_inscripcion_usuario_clase UNIQUE (id_usuario, id_clase)
);

CREATE TABLE seguimientos (
  id_seguimiento INT AUTO_INCREMENT PRIMARY KEY,
  id_inscripcion INT NOT NULL,
  notas TEXT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_inscripcion) REFERENCES inscripciones(id_inscripcion)
);

CREATE TABLE materiales (
  id_material INT AUTO_INCREMENT PRIMARY KEY,
  id_clase INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  url VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_clase) REFERENCES clases(id_clase)
);

CREATE TABLE mensajes (
  id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
  id_remitente INT NOT NULL,
  id_destinatario INT NOT NULL,
  contenido TEXT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_clase INT NULL,
  FOREIGN KEY (id_remitente) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_clase) REFERENCES clases(id_clase)
);

INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Mentor Demo', 'mentor@mentorix.com', '$2a$10$nbSbLJy8ssc6yeBDeJznTOo/8r03KSWi9h.zDSPsxM0SVVDod9aFu', 'mentor');

INSERT INTO materias (nombre, codigo) VALUES
('Ingeniería de Software II', 'ISII'),
('Bases de Datos', 'BD');

INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor) VALUES
(
  'Mentoría de Arquitectura en Capas',
  'Sesión práctica para entender controllers, services y repositories en aplicaciones Node.js.',
  '2026-05-05 18:00:00',
  'virtual',
  1
),
(
  'API REST con Express y MySQL',
  'Buenas prácticas para modelar recursos, validar entradas y persistir datos con mysql2/promise.',
  '2026-05-07 19:30:00',
  'presencial',
  1
);

INSERT INTO mentor_materias (id_mentor, id_materia) VALUES
(1, 1),
(1, 2);
