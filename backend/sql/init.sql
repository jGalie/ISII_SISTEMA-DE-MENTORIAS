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
  rol ENUM('mentor', 'estudiante') NOT NULL DEFAULT 'estudiante',
  niveles_educativos TEXT NULL
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
  id_materia INT NULL,
  precio DECIMAL(10,2) NULL,
  ubicacion VARCHAR(255) NULL,
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

INSERT INTO usuarios (nombre, email, password_hash, rol, niveles_educativos) VALUES
('Mentor Demo', 'mentor@mentorix.com', '$2a$10$nbSbLJy8ssc6yeBDeJznTOo/8r03KSWi9h.zDSPsxM0SVVDod9aFu', 'mentor', '["secundaria","universitario"]');

INSERT INTO materias (nombre, codigo) VALUES
('Ingenieria de Software II', 'ISII'),
('Bases de Datos', 'BD'),
('Matematica', 'MAT'),
('Ingles', 'ING'),
('Programacion', 'PROG'),
('Fisica', 'FIS'),
('Quimica', 'QUI'),
('Biologia', 'BIO'),
('Historia', 'HIS'),
('Geografia', 'GEO');

INSERT INTO mentor_materias (id_mentor, id_materia) VALUES
(1, 1),
(1, 2);

INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion) VALUES
(
  'Mentoria de Arquitectura en Capas',
  'Sesion practica para entender controllers, services y repositories en aplicaciones Node.js.',
  '2026-05-05 18:00:00',
  'virtual',
  1,
  1,
  12000,
  NULL
),
(
  'API REST con Express y MySQL',
  'Buenas practicas para modelar recursos, validar entradas y persistir datos con mysql2/promise.',
  '2026-05-07 19:30:00',
  'presencial',
  1,
  2,
  15000,
  'Aula 204, Sede Centro'
);
