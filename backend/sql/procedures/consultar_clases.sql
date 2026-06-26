USE mentorias_bd;

DELIMITER //

CREATE PROCEDURE consultar_clases()
BEGIN
  SELECT
    c.id_clase,
    c.titulo,
    c.descripcion,
    c.fecha,
    c.modalidad,
    c.precio,
    c.cupo_maximo,
    c.cupo_actual,
    u.nombre AS mentor,
    m.nombre AS materia
  FROM clases c
  INNER JOIN usuarios u ON u.id_usuario = c.id_mentor
  LEFT JOIN materias m ON m.id_materia = c.id_materia
  ORDER BY c.fecha;
END //

DELIMITER ;
