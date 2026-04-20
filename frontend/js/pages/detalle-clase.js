(async function () {
  await MentoriasUI.mountNavbar();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const err = document.getElementById('detalle-error');
  const success = document.getElementById('detalle-success');
  const panel = document.getElementById('detalle-content');
  const editLink = document.getElementById('dc-edit');
  const enrollButton = document.getElementById('dc-enroll');
  const dashboardLink = document.getElementById('dc-dashboard');
  const user = MentoriasAuth.getUser();

  if (!id) {
    err.classList.remove('d-none');
    err.textContent = 'Falta el parámetro id en la URL.';
    return;
  }

  try {
    const { data } = await MentoriasApi.getClase(id);

    document.getElementById('dc-titulo').textContent = data.titulo;
    document.getElementById('dc-desc').textContent = data.descripcion || 'Sin descripción.';
    document.getElementById('dc-id').textContent = String(data.id);
    document.getElementById('dc-mentor').textContent = `Mentor: ${data.mentorNombre || 'Mentorix'}`;
    document.getElementById('dc-email').textContent = data.mentorEmail || 'No disponible';
    document.getElementById('dc-fecha').textContent = MentoriasUI.formatDate(data.fecha);

    if (user && user.rol === 'mentor' && Number(user.id) === Number(data.mentorId)) {
      editLink.href = `/pages/crear-clase.html?id=${encodeURIComponent(data.id)}`;
      editLink.classList.remove('d-none');
    }

    if (user && user.rol === 'estudiante') {
      const inscripcionesResponse = await MentoriasApi.getInscripcionesUsuario(user.id);
      const inscripciones = Array.isArray(inscripcionesResponse.data) ? inscripcionesResponse.data : [];
      const existing = inscripciones.find((item) => Number(item.claseId) === Number(data.id));

      if (existing) {
        dashboardLink.textContent = `Solicitud ${existing.estado}. Ver mis inscripciones`;
        dashboardLink.classList.remove('d-none');
      } else {
        enrollButton.classList.remove('d-none');
        enrollButton.addEventListener('click', async function () {
          this.disabled = true;
          err.classList.add('d-none');
          success.classList.add('d-none');

          try {
            await MentoriasApi.createInscripcion({
              id_usuario: user.id,
              id_clase: data.id,
            });
            this.classList.add('d-none');
            success.textContent = 'Solicitud enviada. Quedó pendiente de aprobación del mentor.';
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

    if (!user) {
      enrollButton.textContent = 'Iniciar sesión para inscribirme';
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
