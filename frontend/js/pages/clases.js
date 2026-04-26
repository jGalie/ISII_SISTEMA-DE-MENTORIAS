(async function () {
  /**
   * Listado general de clases.
   *
   * Esta pantalla integra la informacion recuperada desde la API con acciones
   * propias del rol autenticado. Desde la interfaz se decide que botones mostrar,
   * mientras que las autorizaciones definitivas quedan en el backend.
   */
  if (!MentoriasAuth.requireAuth()) return;
  await MentoriasUI.mountNavbar();

  const box = document.getElementById('clases-list');
  const err = document.getElementById('clases-error');
  const q = document.getElementById('q');
  const count = document.getElementById('clases-count');
  const createButton = document.getElementById('btn-crear-clase');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const eyebrow = document.getElementById('clases-eyebrow');
  const title = document.getElementById('clases-title');
  const subtitle = document.getElementById('clases-subtitle');
  const user = MentoriasAuth.getUser();

  let clases = [];
  let inscripcionesPorClase = {};
  let activeFilter = 'todas';

  if (user && user.rol === 'mentor') {
    createButton.classList.remove('d-none');
    eyebrow.textContent = 'Gestión de mentorías';
    title.textContent = 'Mis clases publicadas';
    subtitle.textContent = 'Administra tus mentorías, fechas, modalidad y publicaciones.';
    q.placeholder = 'Buscar por título, descripción o materia';
  }

  function showError(message) {
    err.textContent = message;
    err.classList.remove('alert-success');
    err.classList.add('alert-danger');
    err.classList.remove('d-none');
  }

  function showSuccess(message) {
    err.textContent = message;
    err.classList.remove('alert-danger');
    err.classList.add('alert-success');
    err.classList.remove('d-none');
  }

  function hideError() {
    err.classList.add('d-none');
    err.classList.remove('alert-success');
    err.classList.add('alert-danger');
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) return 'Fecha a definir';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Fecha a definir';
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function modalityLabel(value) {
    return value === 'presencial' ? 'Presencial' : 'Virtual';
  }

  function buildClassCard(clase) {
    const canManage =
      user &&
      user.rol === 'mentor' &&
      Number(user.id) === Number(clase.mentorId);
    const canEnroll =
      user &&
      user.rol === 'estudiante' &&
      Number(user.id) !== Number(clase.mentorId);
    const enrollment = inscripcionesPorClase[clase.id];
    const enrollmentLabels = {
      pendiente: 'Solicitud pendiente',
      aceptada: 'Inscripcion aceptada',
      rechazada: 'Solicitud rechazada',
    };
    const enrollmentAction = enrollment
      ? `<button class="btn btn-outline-secondary btn-sm px-3" type="button" disabled>${escapeHtml(enrollmentLabels[enrollment.estado] || 'Inscripcion registrada')}</button>`
      : '';
    const enrollButton =
      canEnroll && !enrollment
        ? `<button class="btn btn-detail btn-sm px-3 enroll-clase-btn" data-id="${encodeURIComponent(clase.id)}" type="button">Inscribirse</button>`
        : enrollmentAction;

    return `
      <article class="class-card">
        <div class="class-card__header">
          <h2 class="class-card__title">${escapeHtml(clase.titulo || 'Clase sin titulo')}</h2>
          <span class="class-date">${escapeHtml(formatDate(clase.fecha))}</span>
        </div>

        <div class="class-meta">
          <div class="class-meta__item">
            <i class="bi bi-person-circle"></i>
            <span>${escapeHtml(clase.mentorNombre || 'Mentor')}</span>
          </div>
          <div class="class-meta__item">
            <i class="bi bi-journal-bookmark"></i>
            <span>${escapeHtml(clase.materiaNombre || 'Materia a definir')}</span>
          </div>
          <div class="class-meta__item">
            <i class="bi ${clase.modalidad === 'presencial' ? 'bi-geo-alt' : 'bi-camera-video'}"></i>
            <span>${escapeHtml(modalityLabel(clase.modalidad))}</span>
          </div>
          <div class="class-meta__item">
            <i class="bi bi-cash-coin"></i>
            <span>${escapeHtml(clase.precio != null ? `$${Number(clase.precio).toLocaleString('es-AR')}` : 'Precio a coordinar')}</span>
          </div>
          ${
            clase.modalidad === 'presencial' && clase.ubicacion
              ? `<div class="class-meta__item"><i class="bi bi-pin-map"></i><span>${escapeHtml(clase.ubicacion)}</span></div>`
              : ''
          }
        </div>

        <p class="class-card__description">${escapeHtml(clase.descripcion || 'Sin descripcion.')}</p>

        <div class="class-card__actions">
          <a class="btn btn-detail btn-sm px-3" href="/pages/detalle-clase.html?id=${encodeURIComponent(clase.id)}">Ver detalle</a>
          ${enrollButton}
          ${canManage ? `<a class="btn btn-edit btn-sm px-3" href="/pages/crear-clase.html?id=${encodeURIComponent(clase.id)}">Editar</a>` : ''}
          ${canManage ? `<button class="btn btn-danger-soft btn-sm px-3 delete-clase-btn" data-id="${encodeURIComponent(clase.id)}" type="button">Eliminar</button>` : ''}
        </div>
      </article>
    `;
  }

  function attachDeleteHandlers() {
    // Los mentores pueden solicitar la eliminacion desde el listado, pero el
    // backend vuelve a validar que sean propietarios de la clase.
    box.querySelectorAll('.delete-clase-btn').forEach((button) => {
      button.addEventListener('click', async function () {
        const classId = this.getAttribute('data-id');
        if (!classId || !user) return;
        const confirmarEliminacion = await MentoriasUI.showConfirmDialog({
          title: 'Eliminar clase',
          message: 'Esta accion no se puede deshacer. Queres eliminar la clase?',
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          tone: 'danger',
        });
        if (!confirmarEliminacion) return;

        try {
          this.disabled = true;
          await MentoriasApi.eliminarClase(classId, { mentorId: user.id });
          clases = clases.filter((item) => String(item.id) !== String(classId));
          applyFilter();
        } catch (error) {
          showError(error.message);
          this.disabled = false;
        }
      });
    });
  }

  function attachEnrollmentHandlers() {
    // La inscripcion se ejecuta desde la UI y luego se vuelve a consultar el
    // estado para reflejar la respuesta real del sistema.
    box.querySelectorAll('.enroll-clase-btn').forEach((button) => {
      button.addEventListener('click', async function () {
        const classId = Number(this.getAttribute('data-id'));
        if (!classId || !user || user.rol !== 'estudiante') return;

        try {
          this.disabled = true;
          await MentoriasApi.createInscripcion({
            id_usuario: user.id,
            id_clase: classId,
          });
          const response = await MentoriasApi.getInscripcionesUsuario(user.id);
          const items = Array.isArray(response.data) ? response.data : [];
          inscripcionesPorClase = Object.fromEntries(items.map((item) => [item.claseId, item]));
          showSuccess('Tu solicitud fue enviada al mentor.');
          applyFilter();
        } catch (error) {
          showError(error.message);
          this.disabled = false;
        }
      });
    });
  }

  function render(list) {
    if (!Array.isArray(list) || !list.length) {
      box.innerHTML = '<div class="classes-empty">No hay clases que coincidan con tu busqueda.</div>';
      count.textContent = user?.rol === 'mentor' ? '0 clases publicadas' : '0 clases';
      return;
    }

    box.innerHTML = `<div class="classes-grid">${list.map(buildClassCard).join('')}</div>`;
    attachDeleteHandlers();
    attachEnrollmentHandlers();
    const label = `${list.length} clase${list.length === 1 ? '' : 's'}`;
    count.textContent = user?.rol === 'mentor' ? `${label} publicada${list.length === 1 ? '' : 's'}` : label;
  }

  function applyFilter() {
    const term = normalize(q.value);
    const filtered = clases.filter((clase) => {
      const searchable = [clase.titulo, clase.descripcion, clase.mentorNombre, clase.materiaNombre].map(normalize).join(' ');
      const matchesSearch = !term || searchable.includes(term);
      const matchesModality = activeFilter === 'todas' || normalize(clase.modalidad) === activeFilter;
      return matchesSearch && matchesModality;
    });

    render(filtered);
  }

  try {
    // Se cargan en paralelo las clases y, cuando corresponde, las inscripciones
    // del estudiante para mostrar estados coherentes desde el primer render.
    const [response, inscripcionesResponse] = await Promise.all([
      user && user.rol === 'mentor'
        ? MentoriasApi.obtenerClases({ id_mentor: user.id })
        : MentoriasApi.obtenerClases(),
      user && user.rol === 'estudiante'
        ? MentoriasApi.getInscripcionesUsuario(user.id)
        : Promise.resolve({ data: [] }),
    ]);

    clases = Array.isArray(response.data) ? response.data : [];
    const inscripciones = Array.isArray(inscripcionesResponse.data) ? inscripcionesResponse.data : [];
    inscripcionesPorClase = Object.fromEntries(inscripciones.map((item) => [item.claseId, item]));
    hideError();
    render(clases);
  } catch (error) {
    showError(error.message);
    render([]);
  }

  q.addEventListener('input', applyFilter);
  filterButtons.forEach((button) => {
    button.addEventListener('click', function () {
      activeFilter = this.getAttribute('data-filter') || 'todas';
      filterButtons.forEach((item) => item.classList.toggle('is-active', item === this));
      applyFilter();
    });
  });
})();
