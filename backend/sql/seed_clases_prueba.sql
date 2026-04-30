USE mentorias_bd;

-- Lote de prueba para validar listado, filtros, perfiles de mentor y cupos.
-- Password de usuarios demo: reutiliza el hash del usuario demo del init.sql.

INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol, niveles_educativos, ubicacion, telefono, mentor_bio, mentor_experiencia, mentor_link) VALUES
('Laura Benitez', 'laura.mentor@mentorix.com', '$2a$10$nbSbLJy8ssc6yeBDeJznTOo/8r03KSWi9h.zDSPsxM0SVVDod9aFu', 'mentor', '["secundaria","universitario"]', 'Buenos Aires', '1122334455', 'Mentora de matematica y fisica con foco en resolucion de ejercicios.', '8 anios preparando estudiantes universitarios.', 'https://mentorix.com/laura'),
('Diego Sosa', 'diego.mentor@mentorix.com', '$2a$10$nbSbLJy8ssc6yeBDeJznTOo/8r03KSWi9h.zDSPsxM0SVVDod9aFu', 'mentor', '["universitario","adultos"]', 'Cordoba', '1133445566', 'Desarrollador backend y docente de programacion.', '10 anios creando APIs y bases de datos.', 'https://mentorix.com/diego'),
('Carla Ruiz', 'carla.mentor@mentorix.com', '$2a$10$nbSbLJy8ssc6yeBDeJznTOo/8r03KSWi9h.zDSPsxM0SVVDod9aFu', 'mentor', '["secundaria","terciario"]', 'Rosario', '1144556677', 'Profesora de ingles orientada a conversacion y examenes.', '6 anios de clases online y presenciales.', 'https://mentorix.com/carla'),
('Alumno Cupo Uno', 'alumno.cupo1@mentorix.com', '$2a$10$nbSbLJy8ssc6yeBDeJznTOo/8r03KSWi9h.zDSPsxM0SVVDod9aFu', 'estudiante', NULL, 'Buenos Aires', NULL, NULL, NULL, NULL),
('Alumno Cupo Dos', 'alumno.cupo2@mentorix.com', '$2a$10$nbSbLJy8ssc6yeBDeJznTOo/8r03KSWi9h.zDSPsxM0SVVDod9aFu', 'estudiante', NULL, 'Cordoba', NULL, NULL, NULL, NULL);

INSERT IGNORE INTO mentor_materias (id_mentor, id_materia)
SELECT u.id_usuario, m.id_materia
FROM usuarios u
JOIN materias m ON m.codigo IN ('MAT', 'FIS')
WHERE u.email = 'laura.mentor@mentorix.com';

INSERT IGNORE INTO mentor_materias (id_mentor, id_materia)
SELECT u.id_usuario, m.id_materia
FROM usuarios u
JOIN materias m ON m.codigo IN ('PROG', 'BD', 'ISII')
WHERE u.email = 'diego.mentor@mentorix.com';

INSERT IGNORE INTO mentor_materias (id_mentor, id_materia)
SELECT u.id_usuario, m.id_materia
FROM usuarios u
JOIN materias m ON m.codigo IN ('ING', 'HIS')
WHERE u.email = 'carla.mentor@mentorix.com';

INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
SELECT 'Algebra para parciales', 'Repaso intensivo de ecuaciones, funciones y ejercicios tipo parcial.', '2026-05-12 17:00:00', 'virtual', u.id_usuario, m.id_materia, 9000, NULL, 5, 2
FROM usuarios u JOIN materias m ON m.codigo = 'MAT'
WHERE u.email = 'laura.mentor@mentorix.com'
  AND NOT EXISTS (SELECT 1 FROM clases c WHERE c.titulo = 'Algebra para parciales' AND c.id_mentor = u.id_usuario);

INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
SELECT 'Fisica presencial: dinamica', 'Clase con ejercicios de fuerzas, rozamiento y diagramas de cuerpo libre.', '2026-05-14 18:30:00', 'presencial', u.id_usuario, m.id_materia, 11000, 'Aula 3, Sede Centro', 3, 3
FROM usuarios u JOIN materias m ON m.codigo = 'FIS'
WHERE u.email = 'laura.mentor@mentorix.com'
  AND NOT EXISTS (SELECT 1 FROM clases c WHERE c.titulo = 'Fisica presencial: dinamica' AND c.id_mentor = u.id_usuario);

INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
SELECT 'Node.js y Express desde cero', 'Construccion de rutas, controllers, services y repositories con ejemplos practicos.', '2026-05-16 19:00:00', 'virtual', u.id_usuario, m.id_materia, 14000, NULL, 4, 0
FROM usuarios u JOIN materias m ON m.codigo = 'PROG'
WHERE u.email = 'diego.mentor@mentorix.com'
  AND NOT EXISTS (SELECT 1 FROM clases c WHERE c.titulo = 'Node.js y Express desde cero' AND c.id_mentor = u.id_usuario);

INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
SELECT 'Consultas SQL y JOINs', 'Practica guiada de SELECT, JOIN, filtros, agregaciones e indices basicos.', '2026-05-20 20:00:00', 'virtual', u.id_usuario, m.id_materia, 12500, NULL, 2, 2
FROM usuarios u JOIN materias m ON m.codigo = 'BD'
WHERE u.email = 'diego.mentor@mentorix.com'
  AND NOT EXISTS (SELECT 1 FROM clases c WHERE c.titulo = 'Consultas SQL y JOINs' AND c.id_mentor = u.id_usuario);

INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
SELECT 'Arquitectura Mentorix en capas', 'Analisis de un proyecto Node.js con separacion frontend, backend y base de datos.', '2026-05-22 18:00:00', 'presencial', u.id_usuario, m.id_materia, 16000, 'Laboratorio 2, Campus Norte', 6, 1
FROM usuarios u JOIN materias m ON m.codigo = 'ISII'
WHERE u.email = 'diego.mentor@mentorix.com'
  AND NOT EXISTS (SELECT 1 FROM clases c WHERE c.titulo = 'Arquitectura Mentorix en capas' AND c.id_mentor = u.id_usuario);

INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
SELECT 'Ingles conversacional online', 'Practica de speaking para entrevistas, viajes y presentaciones.', '2026-05-18 10:00:00', 'virtual', u.id_usuario, m.id_materia, 8500, NULL, 8, 4
FROM usuarios u JOIN materias m ON m.codigo = 'ING'
WHERE u.email = 'carla.mentor@mentorix.com'
  AND NOT EXISTS (SELECT 1 FROM clases c WHERE c.titulo = 'Ingles conversacional online' AND c.id_mentor = u.id_usuario);

INSERT INTO clases (titulo, descripcion, fecha, modalidad, id_mentor, id_materia, precio, ubicacion, cupo_maximo, cupo_actual)
SELECT 'Historia argentina presencial', 'Linea de tiempo, procesos politicos y preparacion para examen oral.', '2026-05-24 09:30:00', 'presencial', u.id_usuario, m.id_materia, 7500, 'Biblioteca Popular, Sala B', 2, 2
FROM usuarios u JOIN materias m ON m.codigo = 'HIS'
WHERE u.email = 'carla.mentor@mentorix.com'
  AND NOT EXISTS (SELECT 1 FROM clases c WHERE c.titulo = 'Historia argentina presencial' AND c.id_mentor = u.id_usuario);

