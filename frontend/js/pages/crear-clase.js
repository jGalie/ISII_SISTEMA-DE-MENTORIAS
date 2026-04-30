(async function () {
  /**
   * Pantalla de alta y edicion de clases.
   *
   * Desde la capa de interfaz, este modulo muestra el formulario, recopila los
   * datos ingresados por el mentor y delega la validacion funcional al backend.
   * La pantalla no decide si una clase es valida: solo comunica la solicitud y
   * renderiza la respuesta.
   */
  if (!MentoriasAuth.requerirAutenticacion()) return;
  await MentoriasUI.montarNavbar();

  const usuario = MentoriasAuth.obtenerUsuario();
  if (!usuario) return;

  const parametros = new URLSearchParams(window.location.search);
  const idClase = parametros.get('id');
  const esEdicion = Boolean(idClase);
  const rutaMisClasesPublicadas = '/pages/clases.html';

  const formulario = document.getElementById('form-clase');
  const mensaje = document.getElementById('form-msg');
  const botonGuardar = document.getElementById('btn-guardar');
  const botonEliminar = document.getElementById('btn-delete');
  const tituloPagina = document.getElementById('page-title');
  const selectorMateria = document.getElementById('materia');
  const ayudaMateria = document.getElementById('materia-help');
  const selectorModalidad = document.getElementById('modalidad');
  const inputPrecio = document.getElementById('precio');
  const inputCupoMaximo = document.getElementById('cupo-maximo');
  const contenedorUbicacion = document.getElementById('ubicacion-wrapper');
  const inputUbicacion = document.getElementById('ubicacion');
  let formDirty = false;
  let allowNavigation = false;

  /**
   * Centraliza los mensajes del formulario para comunicar errores, avances y
   * confirmaciones sin duplicar manipulacion directa del DOM.
   */
  function mostrarMensaje(tipo, texto) {
    mensaje.className = `alert alert-${tipo}`;
    mensaje.textContent = texto;
    mensaje.classList.remove('d-none');
  }

  function mostrarAvisoSuperior(texto) {
    const avisoAnterior = document.querySelector('.clase-toast');
    if (avisoAnterior) avisoAnterior.remove();

    const aviso = document.createElement('div');
    aviso.className = 'clase-toast';
    aviso.setAttribute('role', 'status');
    aviso.textContent = texto;
    document.body.appendChild(aviso);
  }

  function confirmarSalida() {
    if (!formDirty) return Promise.resolve(true);
    return MentoriasUI.mostrarDialogoConfirmacion({
      title: 'Cambios sin guardar',
      message: 'Tenes cambios sin guardar. Queres salir sin guardar?',
      confirmText: 'Salir sin guardar',
      cancelText: 'Seguir editando',
    });
  }

  /**
   * Sincroniza la visibilidad del campo ubicacion con la modalidad elegida.
   * Es una decision de presentacion; la obligatoriedad real se valida en el
   * service del backend.
   */
  function sincronizarCampoUbicacion() {
    const esPresencial = selectorModalidad && selectorModalidad.value === 'presencial';
    contenedorUbicacion?.classList.toggle('d-none', !esPresencial);
    if (inputUbicacion && !esPresencial) {
      inputUbicacion.value = '';
    }
  }

  /**
   * Renderiza las materias asociadas al mentor. La pantalla solo muestra las
   * opciones recibidas; la pertenencia final se comprueba en la capa de negocio.
   */
  function renderizarMaterias(items, idSeleccionado) {
    if (!selectorMateria) return;

    if (!items.length) {
      selectorMateria.innerHTML = '<option value="">No tienes materias registradas</option>';
      if (ayudaMateria) {
        ayudaMateria.textContent = 'Primero debes registrarte como mentor con al menos una materia.';
      }
      return;
    }

    selectorMateria.innerHTML = items
      .map((item) => `<option value="${item.materiaId || item.id}" ${Number(idSeleccionado) === Number(item.materiaId || item.id) ? 'selected' : ''}>${item.materiaNombre || item.nombre}</option>`)
      .join('');
  }

  let materiasMentor = [];
  let claseActual = null;

  try {
    // La carga inicial obtiene las materias del mentor y, si corresponde,
    // tambien recupera la clase existente para completar el formulario.
    const respuestaMaterias = await MentoriasApi.obtenerMateriasMentor(usuario.id);
    materiasMentor = Array.isArray(respuestaMaterias.data) ? respuestaMaterias.data : [];

    if (esEdicion) {
      tituloPagina.textContent = 'Editar clase';
      botonGuardar.textContent = 'Guardar cambios';
      botonEliminar.classList.remove('d-none');

      const { data: datosClase } = await MentoriasApi.obtenerClase(idClase);
      claseActual = datosClase;
      document.getElementById('titulo').value = datosClase.titulo || '';
      document.getElementById('descripcion').value = datosClase.descripcion || '';
      document.getElementById('modalidad').value = datosClase.modalidad || 'virtual';
      document.getElementById('precio').value = datosClase.precio != null ? datosClase.precio : '';
      document.getElementById('cupo-maximo').value = datosClase.cupoMaximo || 1;
      document.getElementById('ubicacion').value = datosClase.ubicacion || '';
      if (datosClase.fecha) {
        const fechaClase = new Date(datosClase.fecha);
        const diferenciaHoraria = fechaClase.getTimezoneOffset();
        const fechaLocal = new Date(fechaClase.getTime() - diferenciaHoraria * 60000).toISOString().slice(0, 16);
        document.getElementById('fecha').value = fechaLocal;
      }
    }

    renderizarMaterias(materiasMentor, claseActual?.materiaId);
    sincronizarCampoUbicacion();
  } catch (error) {
    mostrarMensaje('danger', error.message);
    return;
  }

  if (!inputCupoMaximo.value) {
    inputCupoMaximo.value = '1';
  }

  if (selectorModalidad) {
    selectorModalidad.addEventListener('change', sincronizarCampoUbicacion);
  }

  formulario.addEventListener('input', () => {
    formDirty = true;
  });
  formulario.addEventListener('change', () => {
    formDirty = true;
  });

  window.addEventListener('beforeunload', (event) => {
    if (!formDirty || allowNavigation) return;
    event.preventDefault();
    event.returnValue = '';
  });

  document.addEventListener('click', async (event) => {
    const link = event.target.closest('a[href]');
    if (!link || allowNavigation) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#') || link.target === '_blank') return;
    if (link.hasAttribute('data-back-link')) {
      event.preventDefault();
      if (!formDirty || (await confirmarSalida())) {
        allowNavigation = true;
        MentoriasUI.volverOAInicio(href);
      }
      return;
    }
    if (!formDirty) return;
    event.preventDefault();
    if (await confirmarSalida()) {
      allowNavigation = true;
      window.location.href = href;
    }
  });

  /**
   * Construye el objeto de clase y lo envia a la API. La validez de los datos
   * se resuelve en la capa de servicios del backend.
   */
  formulario.addEventListener('submit', async function (event) {
    event.preventDefault();

    const valorFecha = document.getElementById('fecha').value;
    const modalidad = document.getElementById('modalidad').value;
    const ubicacion = inputUbicacion.value.trim();

    const datosClase = {
      titulo: document.getElementById('titulo').value,
      descripcion: document.getElementById('descripcion').value,
      fecha: valorFecha,
      modalidad,
      materiaId: selectorMateria.value,
      precio: inputPrecio.value,
      cupoMaximo: inputCupoMaximo.value,
      ubicacion: modalidad === 'presencial' ? ubicacion : null,
      mentorId: usuario.id,
    };

    try {
      botonGuardar.disabled = true;
      mostrarMensaje('info', esEdicion ? 'Guardando cambios...' : 'Creando clase...');

      if (esEdicion) {
        await MentoriasApi.actualizarClase(idClase, datosClase);
      } else {
        await MentoriasApi.crearClase(datosClase);
      }

      formDirty = false;
      allowNavigation = true;
      if (esEdicion) {
        mostrarMensaje('success', 'Clase actualizada correctamente.');
      } else {
        mostrarAvisoSuperior('Clase creada con éxito');
      }

      setTimeout(() => {
        window.location.href = rutaMisClasesPublicadas;
      }, esEdicion ? 600 : 1200);
    } catch (error) {
      mostrarMensaje('danger', error.message);
    } finally {
      botonGuardar.disabled = false;
    }
  });

  if (botonEliminar) {
    // La eliminacion se expone solamente en modo edicion y envia el mentorId
    // para que el backend pueda corroborar la propiedad de la clase.
    botonEliminar.addEventListener('click', async function () {
      if (!esEdicion) return;
      const confirmarEliminacion = await MentoriasUI.mostrarDialogoConfirmacion({
        title: 'Eliminar clase',
        message: 'Esta accion no se puede deshacer. Queres eliminar la clase?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        tone: 'danger',
      });
      if (!confirmarEliminacion) return;

      try {
        botonEliminar.disabled = true;
        mostrarMensaje('warning', 'Eliminando clase...');
        await MentoriasApi.eliminarClase(idClase, { mentorId: usuario.id });
        formDirty = false;
        allowNavigation = true;
        mostrarMensaje('success', 'Clase eliminada.');
        setTimeout(() => {
          window.location.href = '/pages/clases.html';
        }, 600);
      } catch (error) {
        mostrarMensaje('danger', error.message);
        botonEliminar.disabled = false;
      }
    });
  }
})();
