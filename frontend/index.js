(function () {
  /**
   * Este archivo maneja la vista principal de descubrimiento de clases.
   * Su responsabilidad central es cargar informacion, filtrarla y
   * convertirla en tarjetas utiles para la persona usuaria.
   *
   * Como parte de la capa de presentacion, trabaja con datos ya normalizados
   * por el backend y organiza la experiencia de busqueda e inscripcion.
   */
  const SUBJECT_CONFIG = {
    matematica: { label: 'Matematica', icon: 'bi-calculator' },
    ingles: { label: 'Ingles', icon: 'bi-globe2' },
    programacion: { label: 'Programacion', icon: 'bi-code-slash' },
    musica: { label: 'Musica', icon: 'bi-music-note-beamed' },
    fisica: { label: 'Fisica', icon: 'bi-radioactive' },
    diseno: { label: 'Diseno', icon: 'bi-palette2' },
    negocios: { label: 'Negocios', icon: 'bi-briefcase' },
    quimica: { label: 'Quimica', icon: 'bi-flask' },
    biologia: { label: 'Biologia', icon: 'bi-tree' },
    historia: { label: 'Historia', icon: 'bi-bank' },
    geografia: { label: 'Geografia', icon: 'bi-map' },
    literatura: { label: 'Literatura', icon: 'bi-book-half' },
    algebra: { label: 'Algebra', icon: 'bi-superscript' },
    calculo: { label: 'Calculo', icon: 'bi-graph-up' },
    economia: { label: 'Economia', icon: 'bi-cash-coin' },
    default: { label: 'Mentorias', icon: 'bi-book' },
  };

  const SUBJECT_ALIASES = [
    { key: 'matematica', matches: ['matematica', 'algebra', 'geometria'] },
    { key: 'ingles', matches: ['ingles', 'english', 'idioma'] },
    { key: 'programacion', matches: ['programacion', 'codigo', 'api', 'software', 'node', 'mysql'] },
    { key: 'musica', matches: ['musica', 'guitarra', 'piano', 'canto'] },
    { key: 'fisica', matches: ['fisica', 'mecanica'] },
    { key: 'diseno', matches: ['diseno', 'ux', 'ui', 'grafico'] },
    { key: 'negocios', matches: ['negocios', 'empresa', 'marketing', 'ventas', 'liderazgo'] },
    { key: 'quimica', matches: ['quimica', 'organica'] },
    { key: 'biologia', matches: ['biologia', 'genetica'] },
    { key: 'historia', matches: ['historia'] },
    { key: 'geografia', matches: ['geografia', 'mapas'] },
    { key: 'literatura', matches: ['literatura', 'lengua', 'lectura'] },
    { key: 'algebra', matches: ['algebra'] },
    { key: 'calculo', matches: ['calculo'] },
    { key: 'economia', matches: ['economia', 'finanzas'] },
  ];

  const DEFAULT_SUBJECTS = [
    { key: 'ingles', label: 'Ingles', icon: 'bi-globe2' },
    { key: 'matematica', label: 'Matematica', icon: 'bi-calculator' },
    { key: 'programacion', label: 'Programacion', icon: 'bi-code-slash' },
    { key: 'musica', label: 'Musica', icon: 'bi-music-note-beamed' },
    { key: 'diseno', label: 'Diseno', icon: 'bi-palette2' },
    { key: 'fisica', label: 'Fisica', icon: 'bi-radioactive' },
    { key: 'negocios', label: 'Negocios', icon: 'bi-briefcase' },
    { key: 'quimica', label: 'Quimica', icon: 'bi-flask' },
    { key: 'biologia', label: 'Biologia', icon: 'bi-tree' },
    { key: 'historia', label: 'Historia', icon: 'bi-bank' },
    { key: 'geografia', label: 'Geografia', icon: 'bi-map' },
    { key: 'literatura', label: 'Literatura', icon: 'bi-book-half' },
    { key: 'algebra', label: 'Algebra', icon: 'bi-superscript' },
    { key: 'calculo', label: 'Calculo', icon: 'bi-graph-up' },
    { key: 'economia', label: 'Economia', icon: 'bi-cash-coin' },
  ];

  const state = {
    // El estado local permite recalcular la vista sin framework
    // cada vez que se modifican filtros o inscripciones.
    classes: [],
    filteredClasses: [],
    activeSubject: '',
    activeModality: '',
    query: '',
    subjects: DEFAULT_SUBJECTS,
    enrollmentByClassId: {},
    user: obtenerUsuarioAutenticado(),
  };
  const urlParams = new URLSearchParams(window.location.search);

  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const resultsCount = document.getElementById('results-count');
  const teachersGrid = document.getElementById('teachers-grid');
  const subjectsTrack = document.getElementById('subjects-track');
  const subjectsPrev = document.getElementById('subjects-prev');
  const subjectsNext = document.getElementById('subjects-next');
  const errorAlert = document.getElementById('error-alert');
  const modalityButtons = document.querySelectorAll('[data-modalidad]');
  const homeNavActions = document.getElementById('home-nav-actions');

  function obtenerUsuarioGuardado(store) {
    if (!store) return null;
    try {
      const user = JSON.parse(store.getItem('usuarioLogueado') || 'null');
      return user && user.id && user.email ? user : null;
    } catch {
      return null;
    }
  }

  function obtenerUsuarioAutenticado() {
    if (window.MentoriasAuth && typeof window.MentoriasAuth.obtenerUsuario === 'function') {
      const user = window.MentoriasAuth.obtenerUsuario();
      if (user && user.id && user.email) return user;
    }

    return obtenerUsuarioGuardado(window.localStorage) || obtenerUsuarioGuardado(window.sessionStorage);
  }

  function obtenerRutaInicioPorRol(user) {
    if (!user) return '/index.html';
    if (user.rol === 'mentor') return '/pages/dashboard.html';
    if (user.rol === 'estudiante') return '/pages/clases.html';
    return '/index.html';
  }

  function renderizarNavbarInicio() {
    if (!homeNavActions) return;

    const user = obtenerUsuarioAutenticado();
    state.user = user;

    if (!user) {
      homeNavActions.innerHTML = `
        <a class="btn btn-soft" href="/pages/register.html">Dar clases</a>
        <a class="btn btn-brand px-4 py-2" href="/pages/login.html">Iniciar sesion</a>
      `;
      return;
    }

    const firstName = escaparHtml(String(user.nombre || user.email || 'Usuario').split(' ')[0]);
    const roleLabel = user.rol === 'mentor' ? 'Mentor' : 'Estudiante';
    const roleIcon = user.rol === 'mentor' ? 'bi-person-workspace' : 'bi-person-badge';
    const homePath = obtenerRutaInicioPorRol(user);
    const roleNav =
      user.rol === 'mentor'
        ? `
          <a class="btn btn-soft" href="/pages/dashboard.html">Mis mentorias</a>
          <a class="btn btn-soft" href="/pages/crear-clase.html">Crear clase</a>
        `
        : `
          <a class="btn btn-soft" href="/pages/clases.html">Clases</a>
          <a class="btn btn-soft" href="/pages/dashboard.html">Mis inscripciones</a>
        `;

    homeNavActions.innerHTML = `
      ${roleNav}
      <div class="dropdown">
        <button
          class="btn btn-brand px-4 py-2 dropdown-toggle d-inline-flex align-items-center gap-2"
          id="home-user-menu"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i class="bi ${roleIcon}"></i>
          <span>${firstName}</span>
          <span class="role-pill">${escaparHtml(roleLabel)}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="home-user-menu">
          <li><h6 class="dropdown-header">${escaparHtml(user.email || roleLabel)}</h6></li>
          <li><a class="dropdown-item" href="/pages/perfil.html"><i class="bi bi-person-gear me-2"></i>Modificar perfil</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><button id="home-logout" class="dropdown-item" type="button"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesion</button></li>
        </ul>
      </div>
    `;

    const logoutButton = document.getElementById('home-logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        const confirmarSalida = await window.MentoriasUI.mostrarDialogoConfirmacion({
          title: 'Cerrar sesion',
          message: 'Queres cerrar tu sesion en Mentorix?',
          confirmText: 'Cerrar sesion',
          cancelText: 'Cancelar',
        });
        if (!confirmarSalida) return;
        if (window.MentoriasAuth && typeof window.MentoriasAuth.cerrarSesion === 'function') {
          window.MentoriasAuth.cerrarSesion();
        }
        window.sessionStorage.removeItem('usuarioLogueado');
        window.location.href = '/index.html';
      });
    }
  }

  function normalizar(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function escaparHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function obtenerAleatorioDesdeSemilla(seed, items) {
    const number = Number(seed) || 1;
    return items[number % items.length];
  }

  function obtenerMateriaDesdeTexto(text) {
    const haystack = normalizar(text);
    const found = SUBJECT_ALIASES.find((subject) => subject.matches.some((match) => haystack.includes(match)));
    return found ? found.key : 'programacion';
  }

  function obtenerMetaMateria(clase) {
    // Aun si los datos llegan de formas distintas, se intenta mapear
    // cada clase a una categoria visual coherente.
    const rawSubject = clase.materiaNombre || clase.titulo || clase.descripcion || '';
    const subjectKey = obtenerMateriaDesdeTexto(rawSubject);
    const subject = SUBJECT_CONFIG[subjectKey] || SUBJECT_CONFIG.default;
    return {
      key: subjectKey,
      label: clase.materiaNombre || subject.label,
      icon: subject.icon,
    };
  }

  function obtenerUbicacionMentor(clase) {
    return obtenerAleatorioDesdeSemilla(clase.mentorId || clase.id, [
      'Buenos Aires, Argentina',
      'Cordoba, Argentina',
      'Rosario, Argentina',
      'Mendoza, Argentina',
      'La Plata, Argentina',
    ]);
  }

  function obtenerValoracionMentor(clase) {
    const base = 4.6;
    const extra = ((Number(clase.id) || 0) % 4) * 0.1;
    return (base + extra).toFixed(1);
  }

  function obtenerPrecioClase(clase) {
    if (clase.precio != null) {
      return `$${Number(clase.precio).toLocaleString('es-AR')} / clase`;
    }
    const base = 7000;
    const extra = ((Number(clase.id) || 1) % 5) * 1200;
    return `$${(base + extra).toLocaleString('es-AR')} / clase`;
  }

  function obtenerMetaModalidad(clase) {
    const modalidad = clase.modalidad === 'presencial' ? 'presencial' : 'virtual';
    return modalidad === 'presencial'
      ? { label: 'Presencial', icon: 'bi-geo-alt', className: 'modality-presencial' }
      : { label: 'Virtual', icon: 'bi-camera-video', className: 'modality-virtual' };
  }

  function formatearDescripcion(clase) {
    const description = clase.descripcion || 'Clase personalizada para avanzar paso a paso con acompanamiento individual.';
    return description.length > 120 ? `${description.slice(0, 117)}...` : description;
  }

  function formatearFechaClase(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Fecha a coordinar';
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function crearUriDatosAvatar(name, subjectKey) {
    const palette = {
      matematica: ['#f9d6e8', '#f6eefc'],
      ingles: ['#d8efff', '#eef8ff'],
      programacion: ['#dff7e8', '#ecfbf2'],
      musica: ['#ffe1e8', '#fff4fa'],
      fisica: ['#e3f5ff', '#eef7ff'],
      diseno: ['#ffe8ce', '#fff4e7'],
      negocios: ['#e9eef5', '#f5f8fb'],
      quimica: ['#e8f5d8', '#f6fff0'],
      biologia: ['#d9f7e8', '#f2fff7'],
      historia: ['#f6ead8', '#fff7ef'],
      geografia: ['#dff2ff', '#f5fbff'],
      literatura: ['#f7e7ef', '#fff8fb'],
      algebra: ['#efe4ff', '#faf6ff'],
      calculo: ['#dff4ff', '#eefbff'],
      economia: ['#e5f5da', '#f6fff1'],
    };
    const [start, end] = palette[subjectKey] || ['#f6deed', '#f2efff'];
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${start}" />
            <stop offset="100%" stop-color="${end}" />
          </linearGradient>
        </defs>
        <rect width="640" height="480" rx="32" fill="url(#bg)" />
        <circle cx="320" cy="185" r="82" fill="rgba(255,255,255,0.68)" />
        <path d="M192 382c24-70 86-106 128-106s104 36 128 106" fill="rgba(255,255,255,0.68)" />
        <text x="320" y="410" text-anchor="middle" font-size="56" font-family="Segoe UI, sans-serif" fill="#6d3bc6" font-weight="700">
          ${initials}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function htmlEstrellas() {
    return new Array(5).fill('<i class="bi bi-star-fill"></i>').join('');
  }

  function obtenerInsigniaInscripcion(claseId) {
    const inscripcion = state.enrollmentByClassId[claseId];
    if (!inscripcion) return '';

    const config = {
      pendiente: { label: 'Pendiente', className: 'bg-warning-subtle text-warning-emphasis' },
      aceptada: { label: 'Aceptada', className: 'bg-success-subtle text-success-emphasis' },
      rechazada: { label: 'Rechazada', className: 'bg-danger-subtle text-danger-emphasis' },
    }[inscripcion.estado];

    if (!config) return '';
    return `<span class="badge rounded-pill ${config.className}">${config.label}</span>`;
  }

  function construirAreaAccion(clase) {
    // La accion disponible depende del rol y del historial de inscripcion.
    const user = state.user;
    if (!user) {
      return `<a class="btn btn-soft" href="/pages/login.html">Iniciar sesion</a>`;
    }

    if (user.rol === 'mentor') {
      return `<a class="btn btn-soft" href="/pages/dashboard.html">Ver dashboard</a>`;
    }

    const inscripcion = state.enrollmentByClassId[clase.id];
    if (inscripcion) {
      const labels = {
        pendiente: 'Solicitud enviada',
        aceptada: 'Clase aceptada',
        rechazada: 'Solicitud rechazada',
      };
      return `<button class="btn btn-outline-secondary" type="button" disabled>${labels[inscripcion.estado] || 'Inscripcion registrada'}</button>`;
    }

    if (clase.completa) {
      return '<button class="btn btn-outline-secondary" type="button" disabled>Cupo completo</button>';
    }

    return `<button class="btn btn-brand enroll-button" type="button" data-class-id="${escaparHtml(clase.id)}">Inscribirse</button>`;
  }

  function construirTarjetaMentor(clase) {
    const subject = obtenerMetaMateria(clase);
    const mentorName = clase.mentorNombre || `Profesor ${clase.mentorId || clase.id}`;
    const location = obtenerUbicacionMentor(clase);
    const rating = obtenerValoracionMentor(clase);
    const avatar = crearUriDatosAvatar(mentorName, subject.key);
    const modality = obtenerMetaModalidad(clase);

    return `
      <div class="col-12 col-md-6 col-xl-4">
        <article class="card teacher-card">
          <img class="teacher-avatar" src="${avatar}" alt="${escaparHtml(mentorName)}" />
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span class="badge rounded-pill text-bg-light border">${escaparHtml(subject.label)}</span>
                  <span class="badge rounded-pill modality-badge ${escaparHtml(modality.className)}"><i class="bi ${escaparHtml(modality.icon)} me-1"></i>${escaparHtml(modality.label)}</span>
                  <span class="teacher-meta small"><i class="bi bi-geo-alt me-1"></i>${escaparHtml(location)}</span>
                  ${obtenerInsigniaInscripcion(clase.id)}
                </div>
                <h3 class="h4 mb-1">
                  <a class="text-decoration-none text-reset" href="/pages/mentor.html?id=${encodeURIComponent(clase.mentorId)}">${escaparHtml(mentorName)}</a>
                </h3>
                <p class="teacher-meta mb-0">${escaparHtml(clase.titulo || 'Clase individual')}</p>
              </div>
              <span class="price-pill">${escaparHtml(obtenerPrecioClase(clase))}</span>
            </div>

            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="rating-stars">${htmlEstrellas()}</span>
              <span class="fw-semibold">${escaparHtml(rating)}</span>
            </div>

            <p class="text-muted small mb-3"><i class="bi bi-calendar-event me-1"></i>${escaparHtml(formatearFechaClase(clase.fecha))}</p>
            <p class="text-muted flex-grow-1 mb-4">${escaparHtml(formatearDescripcion(clase))}</p>

            <div class="d-flex justify-content-between align-items-center mt-auto gap-2 flex-wrap">
              <span class="text-muted small">
                <i class="bi ${escaparHtml(subject.icon)} me-1"></i>${escaparHtml(subject.label)}
              </span>
              <div class="d-flex gap-2">
                <a class="btn btn-soft" href="/pages/mentor.html?id=${encodeURIComponent(clase.mentorId)}">Ver perfil</a>
                <a class="btn btn-soft" href="/pages/detalle-clase.html?id=${encodeURIComponent(clase.id)}">Ver clase</a>
                ${construirAreaAccion(clase)}
              </div>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function construirEstadoVacio() {
    return `
      <div class="col-12">
        <div class="card border-0 shadow-sm rounded-4">
          <div class="card-body p-4 text-center">
            <i class="bi bi-search fs-2 text-muted d-block mb-3"></i>
            <h3 class="h4 mb-2">No encontramos resultados</h3>
            <p class="text-muted mb-0">Proba con otra materia, otro profesor o limpia los filtros activos.</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderizarMaterias() {
    // Los filtros visibles se renderizan dinamicamente segun las materias
    // disponibles y el estado activo en ese momento.
    subjectsTrack.innerHTML = state.subjects
      .map((subject) => {
        const meta = SUBJECT_CONFIG[subject.key] || SUBJECT_CONFIG.default;
        return `
          <button
            type="button"
            class="subject-chip ${subject.key === state.activeSubject ? 'is-active' : ''}"
            data-subject="${escaparHtml(subject.key)}"
            aria-pressed="${subject.key === state.activeSubject}"
          >
            <span class="icon-wrap subject-icon-${escaparHtml(meta.key || 'default')}">
              <i class="bi ${escaparHtml(meta.icon)}"></i>
            </span>
            <span class="subject-label">${escaparHtml(meta.label || subject.label)}</span>
          </button>
        `;
      })
      .join('');

    subjectsTrack.querySelectorAll('[data-subject]').forEach((button) => {
      button.addEventListener('click', function () {
        const nextSubject = this.getAttribute('data-subject') || '';
        state.activeSubject = state.activeSubject === nextSubject ? '' : nextSubject;
        aplicarFiltros();
      });
    });
  }

  function adjuntarManejadoresInscripcion() {
    teachersGrid.querySelectorAll('.enroll-button').forEach((button) => {
      button.addEventListener('click', async function () {
        const classId = Number(this.getAttribute('data-class-id'));
        if (!classId || !state.user) return;

        this.disabled = true;
        try {
          const { data } = await MentoriasApi.crearInscripcion({
            id_usuario: state.user.id,
            id_clase: classId,
          });
          state.enrollmentByClassId[classId] = data;
          establecerExito('Tu solicitud fue enviada al mentor.');
          aplicarFiltros();
        } catch (error) {
          establecerError(error.message);
          this.disabled = false;
        }
      });
    });
  }

  function renderizarMentores() {
    teachersGrid.innerHTML = state.filteredClasses.length
      ? state.filteredClasses.map(construirTarjetaMentor).join('')
      : construirEstadoVacio();

    const total = state.filteredClasses.length;
    resultsCount.textContent = total === 1 ? '1 clase disponible' : `${total} clases disponibles`;
    adjuntarManejadoresInscripcion();
  }

  function aplicarFiltros() {
    // Esta funcion resume la logica de busqueda del catalogo.
    const query = normalizar(state.query);
    state.filteredClasses = state.classes.filter((clase) => {
      const subject = obtenerMetaMateria(clase);
      const mentorName = clase.mentorNombre || '';
      const modalidad = clase.modalidad === 'presencial' ? 'presencial' : 'virtual';
      const searchable = [clase.titulo, clase.descripcion, clase.materiaNombre, subject.label, mentorName, modalidad]
        .map(normalizar)
        .join(' ');
      const matchesSubject = !state.activeSubject || subject.key === state.activeSubject;
      const matchesModality = !state.activeModality || modalidad === state.activeModality;
      const matchesQuery = !query || searchable.includes(query);
      return matchesSubject && matchesModality && matchesQuery;
    });

    renderizarMaterias();
    renderizarMentores();
  }

  function establecerError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove('alert-success');
    errorAlert.classList.add('alert-danger');
    errorAlert.classList.remove('d-none');
  }

  function establecerExito(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove('alert-danger');
    errorAlert.classList.add('alert-success');
    errorAlert.classList.remove('d-none');
  }

  function limpiarError() {
    errorAlert.classList.add('d-none');
    errorAlert.textContent = '';
    errorAlert.classList.remove('alert-success');
    errorAlert.classList.add('alert-danger');
  }

  function construirMateriasDesdeClases(classes) {
    const dynamicSubjects = new Map();

    DEFAULT_SUBJECTS.forEach((subject) => dynamicSubjects.set(subject.key, subject));
    classes.forEach((clase) => {
      const subject = obtenerMetaMateria(clase);
      if (!dynamicSubjects.has(subject.key)) {
        dynamicSubjects.set(subject.key, {
          key: subject.key,
          label: subject.label,
          icon: subject.icon,
        });
      }
    });

    return Array.from(dynamicSubjects.values());
  }

  async function cargarInscripcionesSiCorresponde() {
    // Las inscripciones solo se necesitan para estudiantes; por eso se evita
    // una llamada innecesaria cuando navega un mentor o una persona no logueada.
    if (!state.user || state.user.rol !== 'estudiante') return;
    const response = await MentoriasApi.obtenerInscripcionesUsuario(state.user.id);
    const items = Array.isArray(response.data) ? response.data : [];
    state.enrollmentByClassId = Object.fromEntries(items.map((item) => [item.claseId, item]));
  }

  async function cargarDatos() {
    // Se cargan clases y, en paralelo, las inscripciones del estudiante
    // para mostrar botones y estados correctos desde el primer render.
    try {
      const [clasesPayload] = await Promise.all([
        MentoriasApi.obtenerClases({
          q: state.query,
          modalidad: state.activeModality,
          materia: state.activeSubject,
        }),
        cargarInscripcionesSiCorresponde(),
      ]);

      const clases = Array.isArray(clasesPayload.data) ? clasesPayload.data : [];
      state.classes = clases;
      state.subjects = construirMateriasDesdeClases(clases);

      limpiarError();
      aplicarFiltros();
    } catch (error) {
      state.classes = [];
      state.filteredClasses = [];
      renderizarMaterias();
      renderizarMentores();
      establecerError(error.message || 'No pudimos cargar las clases.');
      console.error(error);
    }
  }

  searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    state.query = searchInput.value;
    const destino = new URL('/pages/clases.html', window.location.origin);
    if (state.query) destino.searchParams.set('q', state.query);
    if (state.activeModality) destino.searchParams.set('modalidad', state.activeModality);
    window.location.href = destino.pathname + destino.search;
  });

  searchInput.addEventListener('input', function () {
    state.query = this.value;
    aplicarFiltros();
  });

  modalityButtons.forEach((button) => {
    button.addEventListener('click', function () {
      state.activeModality = this.getAttribute('data-modalidad') || '';
      modalityButtons.forEach((item) => item.classList.toggle('is-active', item === this));
      aplicarFiltros();
    });
  });

  if (subjectsPrev) {
    subjectsPrev.addEventListener('click', function () {
      subjectsTrack.scrollBy({ left: -280, behavior: 'smooth' });
    });
  }

  if (subjectsNext) {
    subjectsNext.addEventListener('click', function () {
      subjectsTrack.scrollBy({ left: 280, behavior: 'smooth' });
    });
  }

  renderizarNavbarInicio();
  state.query = urlParams.get('q') || '';
  state.activeModality = urlParams.get('modalidad') || '';
  if (searchInput) searchInput.value = state.query;
  modalityButtons.forEach((item) => item.classList.toggle('is-active', (item.getAttribute('data-modalidad') || '') === state.activeModality));
  renderizarMaterias();
  cargarDatos();
})();
