(async function () {
  await MentoriasUI.mountNavbar();

  const input = document.getElementById('busqueda');
  const list = document.getElementById('lista-clases');
  const err = document.getElementById('landing-error');
  const counter = document.getElementById('contador');

  let clases = [];
  let materiasById = {};

  function showError(message) {
    if (!err) return;
    err.textContent = message;
    err.classList.remove('d-none');
  }

  function hideError() {
    if (!err) return;
    err.classList.add('d-none');
  }

  function normalize(s) {
    return String(s || '').toLowerCase().trim();
  }

  function render(filtered) {
    MentoriasUI.renderClasesCards(list, filtered, materiasById);
    if (counter) counter.textContent = `${filtered.length} clase(s)`;
  }

  function applyFilter() {
    const q = normalize(input ? input.value : '');
    if (!q) {
      render(clases);
      return;
    }
    const filtered = clases.filter((c) => {
      const titulo = normalize(c.titulo);
      const materia = normalize(materiasById[c.materiaId]?.nombre || '');
      return titulo.includes(q) || materia.includes(q);
    });
    render(filtered);
  }

  try {
    const [cl, mat] = await Promise.all([MentoriasApi.getClases(), MentoriasApi.getMaterias()]);
    clases = Array.isArray(cl.data) ? cl.data : [];
    const materias = Array.isArray(mat.data) ? mat.data : [];
    materiasById = Object.fromEntries(materias.map((m) => [m.id, m]));
    hideError();
    render(clases);
  } catch (e) {
    showError(`No se pudo cargar el listado: ${e.message}`);
    render([]);
  }

  if (input) {
    input.addEventListener('input', applyFilter);
  }
})();

