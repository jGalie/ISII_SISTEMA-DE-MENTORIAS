USE mentorias_bd;

CREATE TABLE IF NOT EXISTS seguimientos (
  id_seguimiento INT AUTO_INCREMENT PRIMARY KEY,
  id_inscripcion INT NOT NULL,
  progreso TINYINT NOT NULL,
  notas TEXT NOT NULL,
  fecha_seguimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_inscripcion) REFERENCES inscripciones(id_inscripcion) ON DELETE CASCADE,
  CONSTRAINT chk_seguimiento_progreso CHECK (progreso BETWEEN 0 AND 100)
);

DROP PROCEDURE IF EXISTS asegurar_columna_seguimientos;

DELIMITER //
CREATE PROCEDURE asegurar_columna_seguimientos(
  IN nombre_columna VARCHAR(64),
  IN sentencia_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'seguimientos'
      AND COLUMN_NAME = nombre_columna
  ) THEN
    SET @sql = sentencia_sql;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//
DELIMITER ;

CALL asegurar_columna_seguimientos(
  'id_inscripcion',
  'ALTER TABLE seguimientos ADD COLUMN id_inscripcion INT NULL AFTER id_seguimiento'
);
CALL asegurar_columna_seguimientos(
  'progreso',
  'ALTER TABLE seguimientos ADD COLUMN progreso TINYINT NOT NULL DEFAULT 0 AFTER id_inscripcion'
);
CALL asegurar_columna_seguimientos(
  'notas',
  'ALTER TABLE seguimientos ADD COLUMN notas TEXT NOT NULL AFTER progreso'
);
CALL asegurar_columna_seguimientos(
  'fecha_seguimiento',
  'ALTER TABLE seguimientos ADD COLUMN fecha_seguimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER notas'
);

DROP PROCEDURE IF EXISTS asegurar_columna_seguimientos;
