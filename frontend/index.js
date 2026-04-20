(function () {
  const SUBJECT_CONFIG = {
    matematica: { label: 'Matemática', icon: 'bi-calculator' },
    ingles: { label: 'Inglés', icon: 'bi-globe2' },
    programacion: { label: 'Programación', icon: 'bi-code-slash' },
    musica: { label: 'Música', icon: 'bi-music-note-beamed' },
    fisica: { label: 'Física', icon: 'bi-radioactive' },
    diseno: { label: 'Diseño', icon: 'bi-palette2' },
    negocios: { label: 'Negocios', icon: 'bi-briefcase' },
    default: { label: 'Mentorías', icon: 'bi-book' },
  };

  const SUBJECT_ALIASES = [
    { key: 'matematica', matches: ['matematica', 'matemática', 'algebra', 'cálculo', 'calculo'] },
    { key: 'ingles', matches: ['ingles', 'inglés', 'english', 'idioma'] },
    { key: 'programacion', matches: ['programacion', 'programación', 'codigo', 'código', 'api', 'software', 'node', 'mysql'] },
    { key: 'musica', matches: ['musica', 'música', 'guitarra', 'piano', 'canto'] },
    { key: 'fisica', matches: ['fisica', 'física', 'mecanica', 'mecánica'] },
    { key: 'diseno', matches: ['diseno', 'diseño', 'ux', 'ui', 'grafico', 'gráfico'] },
    { key: 'negocios', matches: ['negocios', 'empresa', 'marketing', 'ventas', 'liderazgo'] },
  ];

  const DEFAULT_SUBJECTS = [
    { key: 'ingles', label: 'Inglés', icon: 'bi-globe2' },
    { key: 'matematica', label: 'Matemática', icon: 'bi-calculator' },
    { key: 'programacion', label: 'Programación', icon: 'bi-code-slash' },
    { key: 'musica', label: 'Música', icon: 'bi-music-note-beamed' },
    { key: 'diseno', label: 'Diseño', icon: 'bi-palette2' },
    { key: 'fisica', label: 'Física', icon: 'bi-radioactive' },
    { key: 'negocios', label: 'Negocios', icon: 'bi-briefcase' },
  ];

  const state = {
    classes: [],
    filteredClasses: [],
    activeSubject: '',
    query: '',
    subjects: DEFAULT_SUBJECTS,
    enrollmentByClassId: {},
    user: window.MentoriasAuth ? window.MentoriasAuth.getUser() : null,
  };

  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const resultsCount = document.getElementById('results-count');
  const teachersGrid = document.getElementById('teachers-grid');
  const subjectsTrack = document.getElementById('subjects-track');
  const subjectsPrev = document.getElementById('subjects-prev');
  const subjectsNext = document.getElementById('subjects-next');
  const errorAlert = document.getElementById('error-alert');

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
    const rawSubject = clase.titulo || clase.descripcion || '';
    const subjectKey = getSubjectFromText(rawSubject);
    const subject = SUBJECT_CONFIG[subjectKey] || SUBJECT_CONFIG.default;
    return {
      key: subjectKey,
      label: subject.label,
      icon: subject.icon,
    };
  }

  function getTeacherLocation(clase) {
    return randomFromSeed(clase.mentorId || clase.id, [
      'Buenos Aires, Argentina',
      'Córdoba, Argentina',
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
    const base = 7000;
    const extra = ((Number(clase.id) || 1) % 5) * 1200;
    return `$${(base + extra).toLocaleString('es-AR')} / clase`;
  }

  function formatDescription(clase) {
    const description = clase.descripcion || 'Clase personalizada para avanzar paso a paso con acompañamiento individual.';
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
    const user = state.user;
    if (!user) {
      return `<a class="btn btn-soft" href="/pages/login.html">Iniciar sesión</a>`;
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
      return `<button class="btn btn-outline-secondary" type="button" disabled>${labels[inscripcion.estado] || 'Inscripción registrada'}</button>`;
    }

    return `<button class="btn btn-brand enroll-button" type="button" data-class-id="${escapeHtml(clase.id)}">Inscribirse</button>`;
  }

  function buildTeacherCard(clase) {
    const subject = getSubjectMeta(clase);
    const mentorName = clase.mentorNombre || `Profesor ${clase.mentorId || clase.id}`;
    const location = getTeacherLocation(clase);
    const rating = getTeacherRating(clase);
    const avatar = createAvatarDataUri(mentorName, subject.key);

    return `
      <div class="col-12 col-md-6 col-xl-4">
        <article class="card teacher-card">
          <img class="teacher-avatar" src="${avatar}" alt="${escapeHtml(mentorName)}" />
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span class="badge rounded-pill text-bg-light border">${escapeHtml(subject.label)}</span>
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
            <p class="text-muted mb-0">Probá con otra materia, otro profesor o limpiá los filtros activos.</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderSubjects() {
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
    const query = normalize(state.query);
    state.filteredClasses = state.classes.filter((clase) => {
      const subject = getSubjectMeta(clase);
      const mentorName = clase.mentorNombre || '';
      const searchable = [clase.titulo, clase.descripcion, subject.label, mentorName].map(normalize).join(' ');
      const matchesSubject = !state.activeSubject || subject.key === state.activeSubject;
      const matchesQuery = !query || searchable.includes(query);
      return matchesSubject && matchesQuery;
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
    if (!state.user || state.user.rol !== 'estudiante') return;
    const response = await MentoriasApi.getInscripcionesUsuario(state.user.id);
    const items = Array.isArray(response.data) ? response.data : [];
    state.enrollmentByClassId = Object.fromEntries(items.map((item) => [item.claseId, item]));
  }

  async function loadData() {
    try {
      const [clasesPayload] = await Promise.all([
        MentoriasApi.getClases(),
        loadEnrollmentsIfNeeded(),
      ]);

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

  renderSubjects();
  loadData();
})();
