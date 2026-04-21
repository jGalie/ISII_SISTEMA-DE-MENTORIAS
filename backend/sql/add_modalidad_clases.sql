USE mentorias_bd;

ALTER TABLE clases
  ADD COLUMN modalidad ENUM('virtual', 'presencial') NOT NULL DEFAULT 'virtual'
  AFTER fecha;

UPDATE clases
SET modalidad = 'virtual'
WHERE modalidad IS NULL;
