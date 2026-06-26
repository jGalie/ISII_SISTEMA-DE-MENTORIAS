USE mentorias_bd;

DELIMITER //

CREATE PROCEDURE actualizar_estado_inscripcion(
  IN p_id_inscripcion INT,
  IN p_estado VARCHAR(20)
)
BEGIN
  UPDATE inscripciones
  SET estado = p_estado
  WHERE id_inscripcion = p_id_inscripcion;
END //

DELIMITER ;
