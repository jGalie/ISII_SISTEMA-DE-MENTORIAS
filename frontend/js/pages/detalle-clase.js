(async function () {
  /**
   * Esta pantalla muestra el detalle completo de una clase y modifica
   * las acciones disponibles segun el tipo de usuario autenticado.
   * La logica pertenece a la capa de presentacion: organiza datos para la vista,
   * pero no decide permisos finales ni modifica directamente la base de datos.
   */
  await MentoriasUI.montarNavbar();
  MentoriasUI.vincularBotonesVolver();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const err = document.getElementById('detalle-error');
  const success = document.getElementById('detalle-success');
  const panel = document.getElementById('detalle-content');
  const editLink = document.getElementById('dc-edit');
  const enrollButton = document.getElementById('dc-enroll');
  const dashboardLink = document.getElementById('dc-dashboard');
  const reviewSection = document.getElementById('review-section');
  const reviewsList = document.getElementById('reviews-list');
  const reviewForm = document.getElementById('review-form');
  const reviewStars = document.getElementById('review-estrellas');
  const reviewComment = document.getElementById('review-comment');
  const reviewSubmit = document.getElementById('review-submit');
  const user = MentoriasAuth.obtenerUsuario();

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function renderizarValoraciones(classId) {
    const response = await MentoriasApi.obtenerValoracionesClase(classId);
    const reviews = Array.isArray(response.data) ? response.data : [];
    reviewsList.innerHTML = reviews.length
      ? reviews
          .map(
            (review) => `
              <article class="review-item">
                <div class="d-flex justify-content-between gap-3">
                  <strong>${esc(review.estudianteNombre || 'Estudiante')}</strong>
                  <span class="text-warning">${'\u2605'.repeat(review.estrellas)}${'\u2606'.repeat(5 - review.estrellas)}</span>
                </div>
                <p class="mb-0 text-muted">${esc(review.comentario || 'Sin comentario.')}</p>
              </article>
            `
          )
          .join('')
      : '<div class="text-muted">Todavia no hay valoraciones para esta clase.</div>';
    reviewSection.classList.remove('d-none');
    return reviews;
  }

  if (!id) {
    err.classList.remove('d-none');
    err.textContent = 'Falta el parametro id en la URL.';
    return;
  }

  try {
    // La clase se obtiene por identificador y luego se proyecta sobre los
    // elementos visuales de la ficha.
    const { data } = await MentoriasApi.obtenerClase(id);

    // La respuesta del backend se proyecta directamente sobre la ficha visual.
    document.getElementById('dc-titulo').textContent = data.titulo;
    document.getElementById('dc-desc').textContent = data.descripcion || 'Sin descripcion.';
    document.getElementById('dc-id').textContent = String(data.id);
    document.getElementById('dc-mentor').textContent = `Mentor: ${data.mentorNombre || 'Mentorix'}`;
    document.getElementById('dc-email').textContent = data.mentorEmail || 'No disponible';
    document.getElementById('dc-materia').textContent = data.materiaNombre || 'Materia a definir';
    document.getElementById('dc-fecha').textContent = MentoriasUI.formatearFecha(data.fecha);
    document.getElementById('dc-modalidad').textContent =
      data.modalidad === 'presencial' ? 'Presencial' : 'Virtual';
    document.getElementById('dc-precio').textContent =
      data.precio != null ? `$${Number(data.precio).toLocaleString('es-AR')}` : 'A coordinar';
    document.getElementById('dc-cupos').textContent = `${data.cupoActual || 0}/${data.cupoMaximo || 1} ${data.completa ? '(completa)' : 'disponibles'}`;
    document.getElementById('dc-rating').textContent = data.promedioEstrellas
      ? `${Number(data.promedioEstrellas).toFixed(1)} estrellas (${data.cantidadValoraciones})`
      : 'Sin valoraciones';
    document.getElementById('dc-ubicacion').textContent =
      data.modalidad === 'presencial' ? data.ubicacion || 'No informada' : 'No aplica';

    if (user && user.rol === 'mentor' && Number(user.id) === Number(data.mentorId)) {
      // Solo se muestra el acceso a edicion cuando el mentor autenticado es el
      // creador de la clase.
      editLink.href = `/pages/crear-clase.html?id=${encodeURIComponent(data.id)}`;
      editLink.classList.remove('d-none');
    }

    if (user && user.rol === 'estudiante') {
      // Si ya existe una solicitud previa, no se vuelve a ofrecer la misma accion.
      const inscripcionesResponse = await MentoriasApi.buscarInscripcionesDelEstudiante(user.id);
      const inscripciones = Array.isArray(inscripcionesResponse.data) ? inscripcionesResponse.data : [];
      const existing = inscripciones.find((item) => Number(item.claseId) === Number(data.id));

      if (existing) {
        dashboardLink.textContent = `Solicitud ${existing.estado}. Ver mis inscripciones`;
        dashboardLink.classList.remove('d-none');
      } else {
        enrollButton.classList.remove('d-none');
        if (data.completa) {
          enrollButton.textContent = 'Clase completa';
          enrollButton.disabled = true;
        }
        enrollButton.addEventListener('click', async function () {
          this.disabled = true;
          err.classList.add('d-none');
          success.classList.add('d-none');

          try {
            await MentoriasApi.crearInscripcion({
              id_usuario: user.id,
              id_clase: data.id,
            });
            this.classList.add('d-none');
            success.textContent = 'Solicitud enviada. Quedo pendiente de aprobacion del mentor.';
            success.classList.remove('d-none');
            dashboardLink.textContent = 'Ver mis inscripciones';
            dashboardLink.classList.remove('d-none');
          } catch (error) {
            err.classList.remove('d-none');
            err.textContent = error.message;
            this.disabled = false;
          }
        });
      }
    }

    const reviews = await renderizarValoraciones(data.id);
    const currentUserReview = reviews.find((review) => Number(review.estudianteId) === Number(user?.id));
    if (user && user.rol === 'estudiante' && currentUserReview) {
      reviewForm.classList.add('d-none');
    } else if (user && user.rol === 'estudiante') {
      const inscripcionesResponse = await MentoriasApi.buscarInscripcionesDelEstudiante(user.id);
      const inscripciones = Array.isArray(inscripcionesResponse.data) ? inscripcionesResponse.data : [];
      const accepted = inscripciones.some((item) => Number(item.claseId) === Number(data.id) && item.estado === 'aceptada');
      if (accepted) reviewForm.classList.remove('d-none');
    }

    if (reviewForm && user && user.rol === 'estudiante') {
      reviewForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        reviewSubmit.disabled = true;
        err.classList.add('d-none');
        try {
          await MentoriasApi.crearValoracion({
            claseId: data.id,
            estudianteId: user.id,
            estrellas: Number(reviewStars.value),
            comentario: reviewComment.value,
          });
          reviewForm.classList.add('d-none');
          success.textContent = 'Valoracion enviada correctamente.';
          success.classList.remove('d-none');
          await renderizarValoraciones(data.id);
        } catch (error) {
          err.classList.remove('d-none');
          err.textContent = error.message;
          reviewSubmit.disabled = false;
        }
      });
    }

    if (!user) {
      enrollButton.textContent = 'Iniciar sesion para inscribirme';
      enrollButton.classList.remove('d-none');
      enrollButton.addEventListener('click', function () {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/pages/login.html?next=${next}`;
      });
    }

    panel.classList.remove('d-none');
  } catch (error) {
    err.classList.remove('d-none');
    err.textContent = error.message;
  }
})();
