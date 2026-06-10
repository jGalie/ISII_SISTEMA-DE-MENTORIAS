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
  const inputTitulo = document.getElementById('titulo');
  const inputDescripcion = document.getElementById('descripcion');
  const inputFecha = document.getElementById('fecha');
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

  function ocultarMensaje() {
    mensaje.className = 'alert d-none';
    mensaje.textContent = '';
  }

  function establecerErrorCampo(input, idFeedback, texto) {
    const feedback = document.getElementById(idFeedback);
    input?.classList.add('is-invalid');
    if (feedback) {
      feedback.textContent = texto;
      feedback.classList.remove('d-none');
      feedback.classList.add('d-block');
    }
  }

  function limpiarErrorCampo(input, idFeedback) {
    input?.classList.remove('is-invalid');
    const feedback = document.getElementById(idFeedback);
    feedback?.classList.remove('d-block');
    feedback?.classList.add('d-none');
  }

  function validarFormulario() {
    const errores = [];
    const titulo = inputTitulo.value.trim();
    const descripcion = inputDescripcion.value.trim();
    const valorFecha = inputFecha.value;
    const fecha = valorFecha ? new Date(valorFecha) : null;
    const precio = Number(inputPrecio.value);
    const cupoMaximo = Number(inputCupoMaximo.value);
    const modalidad = selectorModalidad.value;

    const validar = (input, feedback, condicion, texto) => {
      if (condicion) {
        limpiarErrorCampo(input, feedback);
        return;
      }
      establecerErrorCampo(input, feedback, texto);
      errores.push({ input, texto });
    };

    validar(selectorMateria, 'materia-error', Boolean(selectorMateria.value), 'Selecciona una materia.');
    validar(inputTitulo, 'titulo-error', titulo.length >= 5 && titulo.length <= 100, titulo
      ? 'El titulo debe tener entre 5 y 100 caracteres.'
      : 'Ingresa un titulo para la clase.');
    validar(
      inputDescripcion,
      'descripcion-error',
      descripcion.length >= 10 && descripcion.length <= 1000,
      descripcion ? 'La descripcion debe tener entre 10 y 1000 caracteres.' : 'Ingresa una descripcion.'
    );
    validar(
      inputFecha,
      'fecha-error',
      Boolean(fecha && !Number.isNaN(fecha.getTime()) && (esEdicion || fecha.getTime() > Date.now())),
      !valorFecha
        ? 'Ingresa la fecha y hora de la clase.'
        : esEdicion
          ? 'Ingresa una fecha y hora validas.'
          : 'La fecha y hora deben ser futuras.'
    );
    validar(
      inputPrecio,
      'precio-error',
      inputPrecio.value.trim() !== '' && Number.isFinite(precio) && precio >= 0,
      'Ingresa un precio mayor o igual a cero.'
    );
    validar(
      inputCupoMaximo,
      'cupo-maximo-error',
      inputCupoMaximo.value.trim() !== '' && Number.isInteger(cupoMaximo) && cupoMaximo >= 1,
      'Ingresa un cupo entero mayor o igual a uno.'
    );
    validar(
      inputUbicacion,
      'ubicacion-error',
      modalidad !== 'presencial' || Boolean(inputUbicacion.value.trim()),
      'Ingresa una ubicacion para la clase presencial.'
    );

    if (errores.length) {
      mostrarMensaje('danger', errores[0].texto);
      errores[0].input?.focus();
      return false;
    }

    ocultarMensaje();
    return true;
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
      limpiarErrorCampo(inputUbicacion, 'ubicacion-error');
    }
    if (inputUbicacion) inputUbicacion.required = esPresencial;
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
      .map((item) => {
        const id_materia = item.id_materia ?? item.id;
        const nombre = item.materia_nombre ?? item.materiaNombre ?? item.nombre;
        return `<option value="${id_materia}" ${Number(idSeleccionado) === Number(id_materia) ? 'selected' : ''}>${nombre}</option>`;
      })
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
      document.getElementById('cupo-maximo').value = datosClase.cupo_maximo ?? datosClase.cupoMaximo ?? 1;
      document.getElementById('ubicacion').value = datosClase.ubicacion || '';
      if (datosClase.fecha) {
        const fechaClase = new Date(datosClase.fecha);
        const diferenciaHoraria = fechaClase.getTimezoneOffset();
        const fechaLocal = new Date(fechaClase.getTime() - diferenciaHoraria * 60000).toISOString().slice(0, 16);
        document.getElementById('fecha').value = fechaLocal;
      }
    }

    renderizarMaterias(materiasMentor, claseActual?.id_materia);
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

  const feedbackPorCampo = {
    materia: 'materia-error',
    titulo: 'titulo-error',
    descripcion: 'descripcion-error',
    fecha: 'fecha-error',
    precio: 'precio-error',
    'cupo-maximo': 'cupo-maximo-error',
    ubicacion: 'ubicacion-error',
  };

  formulario.addEventListener('input', (event) => {
    formDirty = true;
    ocultarMensaje();
    const feedback = feedbackPorCampo[event.target?.id];
    if (feedback) limpiarErrorCampo(event.target, feedback);
  });
  formulario.addEventListener('change', (event) => {
    formDirty = true;
    ocultarMensaje();
    const feedback = feedbackPorCampo[event.target?.id];
    if (feedback) limpiarErrorCampo(event.target, feedback);
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

    if (!validarFormulario()) return;

    const valorFecha = document.getElementById('fecha').value;
    const modalidad = document.getElementById('modalidad').value;
    const ubicacion = inputUbicacion.value.trim();

    const datosClase = {
      titulo: document.getElementById('titulo').value,
      descripcion: document.getElementById('descripcion').value,
      fecha: valorFecha,
      modalidad,
      id_materia: selectorMateria.value,
      precio: inputPrecio.value,
      cupo_maximo: inputCupoMaximo.value,
      ubicacion: modalidad === 'presencial' ? ubicacion : null,
      id_mentor: usuario.id,
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
    // La eliminacion se expone solamente en modo edicion y envia el id_mentor
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
        await MentoriasApi.eliminarClase(idClase, { id_mentor: usuario.id });
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
