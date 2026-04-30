(async function () {
  /**
   * Listado general de clases.
   *
   * Esta pantalla integra la informacion recuperada desde la API con acciones
   * propias del rol autenticado. Desde la interfaz se decide que botones mostrar,
   * mientras que las autorizaciones definitivas quedan en el backend.
   */
  if (!MentoriasAuth.requerirAutenticacion()) return;
  await MentoriasUI.montarNavbar();
  MentoriasUI.vincularBotonesVolver();

  const box = document.getElementById('clases-list');
  const err = document.getElementById('clases-error');
  const q = document.getElementById('q');
  const count = document.getElementById('clases-count');
  const createButton = document.getElementById('btn-crear-clase');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const materiaFilter = document.getElementById('filter-materia');
  const nivelFilter = document.getElementById('filter-nivel');
  const precioFilter = document.getElementById('filter-precio');
  const fechaFilter = document.getElementById('filter-fecha');
  const horarioFilter = document.getElementById('filter-horario');
  const valoracionFilter = document.getElementById('filter-valoracion');
  const eyebrow = document.getElementById('clases-eyebrow');
  const title = document.getElementById('clases-title');
  const subtitle = document.getElementById('clases-subtitle');
  const user = MentoriasAuth.obtenerUsuario();
  const urlParams = new URLSearchParams(window.location.search);

  let clases = [];
  let inscripcionesPorClase = {};
  let activeFilter = 'todas';

  if (user && user.rol === 'mentor') {
    createButton.classList.remove('d-none');
    eyebrow.textContent = 'Gestion de mentorias';
    title.textContent = 'Mis clases publicadas';
    subtitle.textContent = 'Administra tus mentorias, fechas, modalidad y publicaciones.';
    q.placeholder = 'Buscar por titulo, descripcion o materia';
  }

  function mostrarError(message) {
    err.textContent = message;
    err.classList.remove('alert-success');
    err.classList.add('alert-danger');
    err.classList.remove('d-none');
  }

  function mostrarExito(message) {
    err.textContent = message;
    err.classList.remove('alert-danger');
    err.classList.add('alert-success');
    err.classList.remove('d-none');
  }

  function ocultarError() {
    err.classList.add('d-none');
    err.classList.remove('alert-success');
    err.classList.add('alert-danger');
  }

  function normalizar(value) {
    return String(value || '').toLowerCase().trim();
  }

  function escaparHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatearFecha(value) {
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

  function formatearFechaInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function etiquetaModalidad(value) {
    return value === 'presencial' ? 'Presencial' : 'Virtual';
  }

  function popularFiltroMateria(items) {
    const materias = Array.from(
      new Map(
        items
          .filter((clase) => clase.materiaId && clase.materiaNombre)
          .map((clase) => [String(clase.materiaId), clase.materiaNombre])
      ).entries()
    );

    materiaFilter.innerHTML = '<option value="">Todas las materias</option>' +
      materias
        .map(([id, nombre]) => `<option value="${escaparHtml(id)}">${escaparHtml(nombre)}</option>`)
        .join('');
  }

  function construirTarjetaClase(clase) {
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
      ? `<button class="btn btn-outline-secondary btn-sm px-3" type="button" disabled>${escaparHtml(enrollmentLabels[enrollment.estado] || 'Inscripcion registrada')}</button>`
      : '';
    const enrollButton =
      canEnroll && !enrollment
        ? clase.completa
          ? '<button class="btn btn-outline-secondary btn-sm px-3" type="button" disabled>Cupo completo</button>'
          : `<button class="btn btn-detail btn-sm px-3 enroll-clase-btn" data-id="${encodeURIComponent(clase.id)}" type="button">Inscribirse</button>`
        : enrollmentAction;
    const rating = clase.promedioEstrellas
      ? `<div class="class-meta__item"><i class="bi bi-star-fill"></i><span>${Number(clase.promedioEstrellas).toFixed(1)} (${clase.cantidadValoraciones})</span></div>`
      : '';

    return `
      <article class="class-card">
        <div class="class-card__header">
          <h2 class="class-card__title">${escaparHtml(clase.titulo || 'Clase sin titulo')}</h2>
          <span class="class-date">${escaparHtml(formatearFecha(clase.fecha))}</span>
        </div>

        <div class="class-meta">
          <div class="class-meta__item">
            <i class="bi bi-person-circle"></i>
            <a href="/pages/mentor.html?id=${encodeURIComponent(clase.mentorId)}">${escaparHtml(clase.mentorNombre || 'Mentor')}</a>
          </div>
          <div class="class-meta__item">
            <i class="bi bi-journal-bookmark"></i>
            <span>${escaparHtml(clase.materiaNombre || 'Materia a definir')}</span>
          </div>
          <div class="class-meta__item">
            <i class="bi ${clase.modalidad === 'presencial' ? 'bi-geo-alt' : 'bi-camera-video'}"></i>
            <span>${escaparHtml(etiquetaModalidad(clase.modalidad))}</span>
          </div>
          <div class="class-meta__item">
            <i class="bi bi-cash-coin"></i>
            <span>${escaparHtml(clase.precio != null ? `$${Number(clase.precio).toLocaleString('es-AR')}` : 'Precio a coordinar')}</span>
          </div>
          <div class="class-meta__item">
            <i class="bi bi-people"></i>
            <span>${escaparHtml(`${clase.cupoActual || 0}/${clase.cupoMaximo || 1} cupos`)}</span>
          </div>
          ${rating}
          ${
            clase.modalidad === 'presencial' && clase.ubicacion
              ? `<div class="class-meta__item"><i class="bi bi-pin-map"></i><span>${escaparHtml(clase.ubicacion)}</span></div>`
              : ''
          }
        </div>

        <span class="class-status ${clase.completa ? 'is-full' : ''}">
          ${clase.completa ? 'Clase completa' : 'Cupos disponibles'}
        </span>

        <p class="class-card__description">${escaparHtml(clase.descripcion || 'Sin descripcion.')}</p>

        <div class="class-card__actions">
          <a class="btn btn-detail btn-sm px-3" href="/pages/detalle-clase.html?id=${encodeURIComponent(clase.id)}">Ver detalle</a>
          ${enrollButton}
          ${canManage ? `<a class="btn btn-edit btn-sm px-3" href="/pages/crear-clase.html?id=${encodeURIComponent(clase.id)}">Editar</a>` : ''}
          ${canManage ? `<button class="btn btn-danger-soft btn-sm px-3 delete-clase-btn" data-id="${encodeURIComponent(clase.id)}" type="button">Eliminar</button>` : ''}
        </div>
      </article>
    `;
  }

  function adjuntarManejadoresEliminacion() {
    // Los mentores pueden solicitar la eliminacion desde el listado, pero el
    // backend vuelve a validar que sean propietarios de la clase.
    box.querySelectorAll('.delete-clase-btn').forEach((button) => {
      button.addEventListener('click', async function () {
        const classId = this.getAttribute('data-id');
        if (!classId || !user) return;
        const confirmarEliminacion = await MentoriasUI.mostrarDialogoConfirmacion({
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
          aplicarFiltro();
        } catch (error) {
          mostrarError(error.message);
          this.disabled = false;
        }
      });
    });
  }

  function adjuntarManejadoresInscripcion() {
    // La inscripcion se ejecuta desde la UI y luego se vuelve a consultar el
    // estado para reflejar la respuesta real del sistema.
    box.querySelectorAll('.enroll-clase-btn').forEach((button) => {
      button.addEventListener('click', async function () {
        const classId = Number(this.getAttribute('data-id'));
        if (!classId || !user || user.rol !== 'estudiante') return;

        try {
          this.disabled = true;
          await MentoriasApi.crearInscripcion({
            id_usuario: user.id,
            id_clase: classId,
          });
          const response = await MentoriasApi.obtenerInscripcionesUsuario(user.id);
          const items = Array.isArray(response.data) ? response.data : [];
          inscripcionesPorClase = Object.fromEntries(items.map((item) => [item.claseId, item]));
          mostrarExito('Tu solicitud fue enviada al mentor.');
          aplicarFiltro();
        } catch (error) {
          mostrarError(error.message);
          this.disabled = false;
        }
      });
    });
  }

  function renderizar(list) {
    if (!Array.isArray(list) || !list.length) {
      box.innerHTML = '<div class="classes-empty">No se encontraron clases con esos filtros.</div>';
      count.textContent = user?.rol === 'mentor' ? '0 clases publicadas' : '0 clases';
      return;
    }

    box.innerHTML = `<div class="classes-grid">${list.map(construirTarjetaClase).join('')}</div>`;
    adjuntarManejadoresEliminacion();
    adjuntarManejadoresInscripcion();
    const label = `${list.length} clase${list.length === 1 ? '' : 's'}`;
    count.textContent = user?.rol === 'mentor' ? `${label} publicada${list.length === 1 ? '' : 's'}` : label;
  }

  function aplicarFiltro() {
    const term = normalizar(q.value);
    const filtered = clases.filter((clase) => {
      const searchable = [clase.titulo, clase.descripcion, clase.mentorNombre, clase.materiaNombre].map(normalizar).join(' ');
      const matchesSearch = !term || searchable.includes(term);
      const matchesModality = activeFilter === 'todas' || normalizar(clase.modalidad) === activeFilter;
      const matchesSubject = !materiaFilter.value || String(clase.materiaId) === materiaFilter.value;
      const mentorLevels = Array.isArray(clase.mentorNivelesEducativos) ? clase.mentorNivelesEducativos : [];
      const matchesLevel = !nivelFilter.value || mentorLevels.includes(nivelFilter.value);
      const maxPrice = Number(precioFilter.value);
      const matchesPrice = !precioFilter.value || (clase.precio != null && Number(clase.precio) <= maxPrice);
      const claseFecha = clase.fecha ? new Date(clase.fecha) : null;
      const matchesDate =
        !fechaFilter.value ||
        (claseFecha && !Number.isNaN(claseFecha.getTime()) && formatearFechaInput(claseFecha) === fechaFilter.value);
      const hour = claseFecha && !Number.isNaN(claseFecha.getTime()) ? claseFecha.getHours() : null;
      const matchesSchedule =
        !horarioFilter.value ||
        (horarioFilter.value === 'manana' && hour != null && hour < 12) ||
        (horarioFilter.value === 'tarde' && hour != null && hour >= 12 && hour < 19) ||
        (horarioFilter.value === 'noche' && hour != null && hour >= 19);
      const minRating = Number(valoracionFilter.value);
      const matchesRating = !valoracionFilter.value || Number(clase.promedioEstrellas || 0) >= minRating;
      return matchesSearch && matchesModality && matchesSubject && matchesLevel && matchesPrice && matchesDate && matchesSchedule && matchesRating;
    });

    renderizar(filtered);
  }

  try {
    // Se cargan en paralelo las clases y, cuando corresponde, las inscripciones
    // del estudiante para mostrar estados coherentes desde el primer renderizar.
    const [response, inscripcionesResponse] = await Promise.all([
      user && user.rol === 'mentor'
        ? MentoriasApi.obtenerClases({ id_mentor: user.id })
        : MentoriasApi.obtenerClases({
            q: urlParams.get('q') || '',
            modalidad: urlParams.get('modalidad') || '',
            materia: urlParams.get('materia') || '',
            id_materia: urlParams.get('id_materia') || '',
          }),
      user && user.rol === 'estudiante'
        ? MentoriasApi.obtenerInscripcionesUsuario(user.id)
        : Promise.resolve({ data: [] }),
    ]);

    clases = Array.isArray(response.data) ? response.data : [];
    popularFiltroMateria(clases);
    q.value = urlParams.get('q') || '';
    const modalidadInicial = urlParams.get('modalidad');
    if (modalidadInicial) {
      activeFilter = modalidadInicial === 'online' ? 'virtual' : modalidadInicial;
      filterButtons.forEach((item) => item.classList.toggle('is-active', item.getAttribute('data-filter') === activeFilter));
    }
    const idMateriaInicial = urlParams.get('id_materia');
    if (idMateriaInicial) materiaFilter.value = idMateriaInicial;
    const inscripciones = Array.isArray(inscripcionesResponse.data) ? inscripcionesResponse.data : [];
    inscripcionesPorClase = Object.fromEntries(inscripciones.map((item) => [item.claseId, item]));
    ocultarError();
    aplicarFiltro();
  } catch (error) {
    mostrarError(error.message);
    renderizar([]);
  }

  q.addEventListener('input', aplicarFiltro);
  [materiaFilter, nivelFilter, precioFilter, fechaFilter, horarioFilter, valoracionFilter].forEach((input) => {
    input.addEventListener('input', aplicarFiltro);
    input.addEventListener('change', aplicarFiltro);
  });
  filterButtons.forEach((button) => {
    button.addEventListener('click', function () {
      activeFilter = this.getAttribute('data-filter') || 'todas';
      filterButtons.forEach((item) => item.classList.toggle('is-active', item === this));
      aplicarFiltro();
    });
  });
})();
