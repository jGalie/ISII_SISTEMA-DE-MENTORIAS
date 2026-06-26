USE mentorias_bd;

DROP PROCEDURE IF EXISTS consultar_clases_disponibles;

DELIMITER //

CREATE PROCEDURE consultar_clases_disponibles(
  IN p_id_materia INT
)
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
    (c.cupo_maximo - c.cupo_actual) AS cupos_disponibles,
    u.nombre AS mentor,
    m.nombre AS materia,
    COALESCE(ROUND(AVG(v.estrellas), 2), 0) AS valoracion_promedio_mentor
  FROM clases c
  INNER JOIN usuarios u ON u.id_usuario = c.id_mentor
  LEFT JOIN materias m ON m.id_materia = c.id_materia
  LEFT JOIN valoraciones v ON v.id_mentor = c.id_mentor
  WHERE c.cupo_actual < c.cupo_maximo
    AND (p_id_materia IS NULL OR c.id_materia = p_id_materia)
  GROUP BY
    c.id_clase,
    c.titulo,
    c.descripcion,
    c.fecha,
    c.modalidad,
    c.precio,
    c.cupo_maximo,
    c.cupo_actual,
    u.nombre,
    m.nombre
  ORDER BY c.fecha;
END //

DELIMITER ;
