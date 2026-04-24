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
    user: getAuthenticatedUser(),
  };

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

  function getStoredUser(store) {
    if (!store) return null;
    try {
      const user = JSON.parse(store.getItem('usuarioLogueado') || 'null');
      return user && user.id && user.email ? user : null;
    } catch {
      return null;
    }
  }

  function getAuthenticatedUser() {
    if (window.MentoriasAuth && typeof window.MentoriasAuth.getUser === 'function') {
      const user = window.MentoriasAuth.getUser();
      if (user && user.id && user.email) return user;
    }

    return getStoredUser(window.localStorage) || getStoredUser(window.sessionStorage);
  }

  function getRoleHomePath(user) {
    if (!user) return '/index.html';
    if (user.rol === 'mentor') return '/pages/dashboard.html';
    if (user.rol === 'estudiante') return '/pages/clases.html';
    return '/index.html';
  }

  function renderHomeNavbar() {
    if (!homeNavActions) return;

    const user = getAuthenticatedUser();
    state.user = user;

    if (!user) {
      homeNavActions.innerHTML = `
        <a class="btn btn-soft" href="/pages/register.html">Dar clases</a>
        <a class="btn btn-brand px-4 py-2" href="/pages/login.html">Iniciar sesion</a>
      `;
      return;
    }

    const firstName = escapeHtml(String(user.nombre || user.email || 'Usuario').split(' ')[0]);
    const roleLabel = user.rol === 'mentor' ? 'Mentor' : 'Estudiante';
    const roleIcon = user.rol === 'mentor' ? 'bi-person-workspace' : 'bi-person-badge';
    const homePath = getRoleHomePath(user);
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
          <span class="role-pill">${escapeHtml(roleLabel)}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="home-user-menu">
          <li><h6 class="dropdown-header">${escapeHtml(user.email || roleLabel)}</h6></li>
          <li><a class="dropdown-item" href="/pages/perfil.html"><i class="bi bi-person-gear me-2"></i>Modificar perfil</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><button id="home-logout" class="dropdown-item" type="button"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesion</button></li>
        </ul>
      </div>
    `;

    const logoutButton = document.getElementById('home-logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        if (window.MentoriasAuth && typeof window.MentoriasAuth.logout === 'function') {
          window.MentoriasAuth.logout();
        }
        window.sessionStorage.removeItem('usuarioLogueado');
        window.location.href = '/index.html';
      });
    }
  }

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function randomFromSeed(seed, items) {
    const number = Number(seed) || 1;
    return items[number % items.length];
  }

  function getSubjectFromText(text) {
    const haystack = normalize(text);
    const found = SUBJECT_ALIASES.find((subject) => subject.matches.some((match) => haystack.includes(match)));
    return found ? found.key : 'programacion';
  }

  function getSubjectMeta(clase) {
    // Aun si los datos llegan de formas distintas, se intenta mapear
    // cada clase a una categoria visual coherente.
    const rawSubject = clase.materiaNombre || clase.titulo || clase.descripcion || '';
    const subjectKey = getSubjectFromText(rawSubject);
    const subject = SUBJECT_CONFIG[subjectKey] || SUBJECT_CONFIG.default;
    return {
      key: subjectKey,
      label: clase.materiaNombre || subject.label,
      icon: subject.icon,
    };
  }

  function getTeacherLocation(clase) {
    return randomFromSeed(clase.mentorId || clase.id, [
      'Buenos Aires, Argentina',
      'Cordoba, Argentina',
      'Rosario, Argentina',
      'Mendoza, Argentina',
      'La Plata, Argentina',
    ]);
  }

  function getTeacherRating(clase) {
    const base = 4.6;
    const extra = ((Number(clase.id) || 0) % 4) * 0.1;
    return (base + extra).toFixed(1);
  }

  function getTeacherPrice(clase) {
    if (clase.precio != null) {
      return `$${Number(clase.precio).toLocaleString('es-AR')} / clase`;
    }
    const base = 7000;
    const extra = ((Number(clase.id) || 1) % 5) * 1200;
    return `$${(base + extra).toLocaleString('es-AR')} / clase`;
  }

  function getModalityMeta(clase) {
    const modalidad = clase.modalidad === 'presencial' ? 'presencial' : 'virtual';
    return modalidad === 'presencial'
      ? { label: 'Presencial', icon: 'bi-geo-alt', className: 'modality-presencial' }
      : { label: 'Virtual', icon: 'bi-camera-video', className: 'modality-virtual' };
  }

  function formatDescription(clase) {
    const description = clase.descripcion || 'Clase personalizada para avanzar paso a paso con acompanamiento individual.';
    return description.length > 120 ? `${description.slice(0, 117)}...` : description;
  }

  function formatClassDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Fecha a coordinar';
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function createAvatarDataUri(name, subjectKey) {
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

  function starsMarkup() {
    return new Array(5).fill('<i class="bi bi-star-fill"></i>').join('');
  }

  function getEnrollmentBadge(claseId) {
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

  function buildActionArea(clase) {
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

    return `<button class="btn btn-brand enroll-button" type="button" data-class-id="${escapeHtml(clase.id)}">Inscribirse</button>`;
  }

  function buildTeacherCard(clase) {
    const subject = getSubjectMeta(clase);
    const mentorName = clase.mentorNombre || `Profesor ${clase.mentorId || clase.id}`;
    const location = getTeacherLocation(clase);
    const rating = getTeacherRating(clase);
    const avatar = createAvatarDataUri(mentorName, subject.key);
    const modality = getModalityMeta(clase);

    return `
      <div class="col-12 col-md-6 col-xl-4">
        <article class="card teacher-card">
          <img class="teacher-avatar" src="${avatar}" alt="${escapeHtml(mentorName)}" />
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span class="badge rounded-pill text-bg-light border">${escapeHtml(subject.label)}</span>
                  <span class="badge rounded-pill modality-badge ${escapeHtml(modality.className)}"><i class="bi ${escapeHtml(modality.icon)} me-1"></i>${escapeHtml(modality.label)}</span>
                  <span class="teacher-meta small"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(location)}</span>
                  ${getEnrollmentBadge(clase.id)}
                </div>
                <h3 class="h4 mb-1">${escapeHtml(mentorName)}</h3>
                <p class="teacher-meta mb-0">${escapeHtml(clase.titulo || 'Clase individual')}</p>
              </div>
              <span class="price-pill">${escapeHtml(getTeacherPrice(clase))}</span>
            </div>

            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="rating-stars">${starsMarkup()}</span>
              <span class="fw-semibold">${escapeHtml(rating)}</span>
            </div>

            <p class="text-muted small mb-3"><i class="bi bi-calendar-event me-1"></i>${escapeHtml(formatClassDate(clase.fecha))}</p>
            <p class="text-muted flex-grow-1 mb-4">${escapeHtml(formatDescription(clase))}</p>

            <div class="d-flex justify-content-between align-items-center mt-auto gap-2 flex-wrap">
              <span class="text-muted small">
                <i class="bi ${escapeHtml(subject.icon)} me-1"></i>${escapeHtml(subject.label)}
              </span>
              <div class="d-flex gap-2">
                <a class="btn btn-soft" href="/pages/detalle-clase.html?id=${encodeURIComponent(clase.id)}">Ver perfil</a>
                ${buildActionArea(clase)}
              </div>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function buildEmptyState() {
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

  function renderSubjects() {
    // Los filtros visibles se renderizan dinamicamente segun las materias
    // disponibles y el estado activo en ese momento.
    subjectsTrack.innerHTML = state.subjects
      .map((subject) => {
        const meta = SUBJECT_CONFIG[subject.key] || SUBJECT_CONFIG.default;
        return `
          <button
            type="button"
            class="subject-chip ${subject.key === state.activeSubject ? 'is-active' : ''}"
            data-subject="${escapeHtml(subject.key)}"
            aria-pressed="${subject.key === state.activeSubject}"
          >
            <span class="icon-wrap subject-icon-${escapeHtml(meta.key || 'default')}">
              <i class="bi ${escapeHtml(meta.icon)}"></i>
            </span>
            <span class="subject-label">${escapeHtml(meta.label || subject.label)}</span>
          </button>
        `;
      })
      .join('');

    subjectsTrack.querySelectorAll('[data-subject]').forEach((button) => {
      button.addEventListener('click', function () {
        const nextSubject = this.getAttribute('data-subject') || '';
        state.activeSubject = state.activeSubject === nextSubject ? '' : nextSubject;
        applyFilters();
      });
    });
  }

  function attachEnrollHandlers() {
    teachersGrid.querySelectorAll('.enroll-button').forEach((button) => {
      button.addEventListener('click', async function () {
        const classId = Number(this.getAttribute('data-class-id'));
        if (!classId || !state.user) return;

        this.disabled = true;
        try {
          const { data } = await MentoriasApi.createInscripcion({
            id_usuario: state.user.id,
            id_clase: classId,
          });
          state.enrollmentByClassId[classId] = data;
          clearError();
          applyFilters();
        } catch (error) {
          setError(error.message);
          this.disabled = false;
        }
      });
    });
  }

  function renderTeachers() {
    teachersGrid.innerHTML = state.filteredClasses.length
      ? state.filteredClasses.map(buildTeacherCard).join('')
      : buildEmptyState();

    const total = state.filteredClasses.length;
    resultsCount.textContent = total === 1 ? '1 clase disponible' : `${total} clases disponibles`;
    attachEnrollHandlers();
  }

  function applyFilters() {
    // Esta funcion resume la logica de busqueda del catalogo.
    const query = normalize(state.query);
    state.filteredClasses = state.classes.filter((clase) => {
      const subject = getSubjectMeta(clase);
      const mentorName = clase.mentorNombre || '';
      const modalidad = clase.modalidad === 'presencial' ? 'presencial' : 'virtual';
      const searchable = [clase.titulo, clase.descripcion, clase.materiaNombre, subject.label, mentorName, modalidad]
        .map(normalize)
        .join(' ');
      const matchesSubject = !state.activeSubject || subject.key === state.activeSubject;
      const matchesModality = !state.activeModality || modalidad === state.activeModality;
      const matchesQuery = !query || searchable.includes(query);
      return matchesSubject && matchesModality && matchesQuery;
    });

    renderSubjects();
    renderTeachers();
  }

  function setError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove('d-none');
  }

  function clearError() {
    errorAlert.classList.add('d-none');
    errorAlert.textContent = '';
  }

  function buildSubjectsFromClasses(classes) {
    const dynamicSubjects = new Map();

    DEFAULT_SUBJECTS.forEach((subject) => dynamicSubjects.set(subject.key, subject));
    classes.forEach((clase) => {
      const subject = getSubjectMeta(clase);
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

  async function loadEnrollmentsIfNeeded() {
    // Las inscripciones solo se necesitan para estudiantes; por eso se evita
    // una llamada innecesaria cuando navega un mentor o una persona no logueada.
    if (!state.user || state.user.rol !== 'estudiante') return;
    const response = await MentoriasApi.getInscripcionesUsuario(state.user.id);
    const items = Array.isArray(response.data) ? response.data : [];
    state.enrollmentByClassId = Object.fromEntries(items.map((item) => [item.claseId, item]));
  }

  async function loadData() {
    // Se cargan clases y, en paralelo, las inscripciones del estudiante
    // para mostrar botones y estados correctos desde el primer render.
    try {
      const [clasesPayload] = await Promise.all([MentoriasApi.obtenerClases(), loadEnrollmentsIfNeeded()]);

      const clases = Array.isArray(clasesPayload.data) ? clasesPayload.data : [];
      state.classes = clases;
      state.subjects = buildSubjectsFromClasses(clases);

      clearError();
      applyFilters();
    } catch (error) {
      state.classes = [];
      state.filteredClasses = [];
      renderSubjects();
      renderTeachers();
      setError(error.message || 'No pudimos cargar las clases.');
      console.error(error);
    }
  }

  searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    state.query = searchInput.value;
    applyFilters();
  });

  searchInput.addEventListener('input', function () {
    state.query = this.value;
    applyFilters();
  });

  modalityButtons.forEach((button) => {
    button.addEventListener('click', function () {
      state.activeModality = this.getAttribute('data-modalidad') || '';
      modalityButtons.forEach((item) => item.classList.toggle('is-active', item === this));
      applyFilters();
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

  renderHomeNavbar();
  renderSubjects();
  loadData();
})();
