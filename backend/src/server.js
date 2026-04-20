const app = require('./app');
const { ensureDatabaseSchema, pool } = require('./config/db');

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await ensureDatabaseSchema();
    app.listen(PORT, () => {
      console.log(`Servidor MVP en http://localhost:${PORT}`);
    });
  } catch (error) {
    const detail =
      error?.message ||
      error?.code ||
      error?.sqlMessage ||
      'Error desconocido al conectar con MySQL.';
    console.error('No se pudo iniciar la API por un problema de base de datos:', detail);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

startServer();
