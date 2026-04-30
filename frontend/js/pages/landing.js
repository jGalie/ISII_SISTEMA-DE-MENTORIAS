(async function () {
  /**
   * Vista inicial de exploracion.
   *
   * Este modulo carga clases y materias para presentar un catalogo resumido.
   * Su responsabilidad es exclusivamente visual y de filtrado local; la
   * informacion fuente proviene de la API.
   */
  await MentoriasUI.montarNavbar();

  const input = document.getElementById('busqueda');
  const list = document.getElementById('lista-clases');
  const err = document.getElementById('landing-error');
  const counter = document.getElementById('contador');

  let clases = [];
  let materiasById = {};

  function mostrarError(message) {
    if (!err) return;
    err.textContent = message;
    err.classList.remove('d-none');
  }

  function ocultarError() {
    if (!err) return;
    err.classList.add('d-none');
  }

  function normalizar(s) {
    return String(s || '').toLowerCase().trim();
  }

  function renderizar(filtered) {
    MentoriasUI.renderizarTarjetasClases(list, filtered, materiasById);
    if (counter) counter.textContent = `${filtered.length} clase(s)`;
  }

  function aplicarFiltro() {
    // El filtro se aplica en memoria sobre los datos ya obtenidos para lograr
    // una respuesta inmediata en la interfaz.
    const q = normalizar(input ? input.value : '');
    if (!q) {
      renderizar(clases);
      return;
    }
    const filtered = clases.filter((c) => {
      const titulo = normalizar(c.titulo);
      const materia = normalizar(materiasById[c.materiaId]?.nombre || '');
      return titulo.includes(q) || materia.includes(q);
    });
    renderizar(filtered);
  }

  try {
    // Clases y materias se consultan en paralelo porque no dependen una de la
    // otra para ser solicitadas.
    const [cl, mat] = await Promise.all([MentoriasApi.obtenerClases(), MentoriasApi.obtenerMaterias()]);
    clases = Array.isArray(cl.data) ? cl.data : [];
    const materias = Array.isArray(mat.data) ? mat.data : [];
    materiasById = Object.fromEntries(materias.map((m) => [m.id, m]));
    ocultarError();
    renderizar(clases);
  } catch (e) {
    mostrarError(`No se pudo cargar el listado: ${e.message}`);
    renderizar([]);
  }

  if (input) {
    input.addEventListener('input', aplicarFiltro);
  }
})();

