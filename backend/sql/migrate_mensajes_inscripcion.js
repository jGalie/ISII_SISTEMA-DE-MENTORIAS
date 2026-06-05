const { asegurarEsquemaBaseDatos, pool } = require('../src/config/db');

async function main() {
  await asegurarEsquemaBaseDatos();

  const [columns] = await pool.query(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mensajes'
    ORDER BY ORDINAL_POSITION
  `);

  const [foreignKeys] = await pool.query(`
    SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mensajes'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION
  `);

  console.log(JSON.stringify({ table: 'mensajes', columns, foreignKeys }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
