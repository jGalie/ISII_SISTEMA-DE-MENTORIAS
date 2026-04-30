(async function () {
  await MentoriasUI.montarNavbar();

  const params = new URLSearchParams(window.location.search);
  const mentorId = params.get('id');
  const profile = document.getElementById('mentor-profile');
  const errorBox = document.getElementById('mentor-error');

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function estrellas(value) {
    const rating = Math.round(Number(value || 0));
    return '\u2605'.repeat(rating) + '\u2606'.repeat(Math.max(0, 5 - rating));
  }

  function renderizarEtiquetas(items, emptyText) {
    if (!Array.isArray(items) || !items.length) return `<span class="text-muted">${esc(emptyText)}</span>`;
    return items.map((item) => `<span class="mentor-tag">${esc(item.nombre || item)}</span>`).join('');
  }

  function renderizarClases(classes) {
    if (!Array.isArray(classes) || !classes.length) {
      return '<div class="text-muted">Este mentor todavia no tiene clases publicadas.</div>';
    }

    return `
      <div class="row g-3">
        ${classes
          .map(
            (clase) => `
              <div class="col-12 col-md-6">
                <article class="mentor-class-card">
                  <div class="d-flex justify-content-between gap-3 mb-2">
                    <h3 class="h6 fw-bold mb-0">${esc(clase.titulo)}</h3>
                    <span class="badge rounded-pill text-bg-light border">${esc(MentoriasUI.formatearFecha(clase.fecha))}</span>
                  </div>
                  <p class="text-muted small mb-3">${esc(clase.descripcion || 'Sin descripcion.')}</p>
                  <a class="btn btn-dark btn-sm rounded-pill px-3" href="/pages/detalle-clase.html?id=${encodeURIComponent(clase.id)}">Ver clase</a>
                </article>
              </div>
            `
          )
          .join('')}
      </div>
    `;
  }

  function renderizarValoraciones(reviews) {
    if (!Array.isArray(reviews) || !reviews.length) {
      return '<div class="text-muted">Todavia no hay valoraciones para este mentor.</div>';
    }

    return reviews
      .map(
        (review) => `
          <article class="mentor-review">
            <div class="d-flex justify-content-between gap-3 mb-2">
              <strong>${esc(review.estudianteNombre || 'Estudiante')}</strong>
              <span class="mentor-review-estrellas">${estrellas(review.estrellas)}</span>
            </div>
            <p class="text-muted small mb-1">${esc(review.claseTitulo || 'Clase')}</p>
            <p class="mb-0">${esc(review.comentario || 'Sin comentario.')}</p>
          </article>
        `
      )
      .join('');
  }

  if (!mentorId) {
    errorBox.textContent = 'Falta el mentor en la URL.';
    errorBox.classList.remove('d-none');
    return;
  }

  try {
    const { data } = await MentoriasApi.obtenerMentorPublico(mentorId);
    const average = data.promedioEstrellas ? Number(data.promedioEstrellas).toFixed(1) : 'Sin valoraciones';

    profile.innerHTML = `
      <div class="mentor-hero">
        <div class="d-flex justify-content-between align-items-start gap-4 flex-wrap">
          <div class="d-flex gap-3 align-items-start">
            <div class="mentor-avatar"><i class="bi bi-person-workspace"></i></div>
            <div>
              <p class="text-uppercase small fw-bold text-secondary mb-2">Perfil del mentor</p>
              <h1 class="h2 fw-bold mb-2">${esc(data.nombre)}</h1>
              <p class="text-muted mb-3">${esc(data.mentorBio || 'Este mentor aun no cargo una presentacion.')}</p>
              <div class="mentor-tags">${renderizarEtiquetas(data.materias, 'Sin materias cargadas')}</div>
            </div>
          </div>
          <div class="mentor-rating">
            <i class="bi bi-star-fill"></i>
            <span>${esc(average)}</span>
            <span class="text-muted">(${esc(data.cantidadValoraciones || 0)})</span>
          </div>
        </div>
      </div>

      <section class="mentor-section">
        <h2 class="h5 fw-bold mb-3">Experiencia y modalidad</h2>
        <p class="mb-2"><strong>Experiencia:</strong> ${esc(data.mentorExperiencia || 'No informada')}</p>
        <p class="mb-2"><strong>Niveles:</strong> ${esc((data.nivelesEducativos || []).join(', ') || 'No informados')}</p>
        ${data.mentorLink ? `<a href="${esc(data.mentorLink)}" target="_blank" rel="noreferrer">Ver enlace profesional</a>` : ''}
      </section>

      <section class="mentor-section">
        <h2 class="h5 fw-bold mb-3">Clases disponibles</h2>
        ${renderizarClases(data.clases)}
      </section>

      <section class="mentor-section">
        <h2 class="h5 fw-bold mb-3">Valoraciones</h2>
        <div class="d-grid gap-3">${renderizarValoraciones(data.valoraciones)}</div>
      </section>
    `;

    profile.classList.remove('d-none');
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove('d-none');
  }
})();
