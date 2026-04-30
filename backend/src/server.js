const app = require('./app');
const { asegurarEsquemaBaseDatos, pool } = require('./config/db');

const PORT = Number(process.env.PORT) || 3000;

/**
 * Antes de escuchar peticiones, el sistema verifica que la base
 * este disponible y que el esquema minimo exista.
 */
async function iniciarServidor() {
  try {
    await asegurarEsquemaBaseDatos();
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

iniciarServidor();
