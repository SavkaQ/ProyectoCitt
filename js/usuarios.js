// Módulo de usuarios: autenticación, registro y gestión administrativa
window.CIIT = window.CIIT || {};

(function(exports) {
  function init() {
    configurarLogin();
    configurarRegistro();
    configurarGestionUsuarios();
    configurarRecuperacion();
    configurarPerfil();
    configurarReportes();
  }

  function obtenerUsuarios() {
    return exports.storage.obtenerDatos('usuarios');
  }

  function guardarUsuarios(lista) {
    exports.storage.guardarDatos('usuarios', lista);
  }

  function actualizarUsuario(id, cambios) {
    const usuarios = obtenerUsuarios();
    const indice = usuarios.findIndex((item) => item.id === id);
    if (indice === -1) return null;

    usuarios[indice] = {
      ...usuarios[indice],
      ...cambios
    };

    guardarUsuarios(usuarios);
    return usuarios[indice];
  }

  let contenedoresMetricas = [];
  let botonesReporte = [];
  let tablaReservasDirector = null;
  let listaTopInventario = null;
  let mensajeReportes = null;

  function configurarLogin() {
    const formulario = document.querySelector('#formLogin');
    if (!formulario) return;

    const mensaje = formulario.querySelector('.mensaje-form');

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const datos = new FormData(formulario);
      const correo = String(datos.get('correo') || '').trim().toLowerCase();
      const contrasena = String(datos.get('contrasena') || '').trim();

      if (!exports.validaciones.esCorreoInstitucional(correo)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Correo no válido. Utiliza tu cuenta @duocuc.cl.');
        return;
      }

      const usuario = obtenerUsuarios().find(
        (item) => item.correo.toLowerCase() === correo && item.contrasena === contrasena
      );

      if (!usuario) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Usuario o contraseña incorrectos.');
        return;
      }

      if (['estudiante', 'ayudante'].includes(usuario.rol) && usuario.matriculaActiva === false) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Matrícula inactiva, no puede iniciar sesión.');
        return;
      }

      exports.sesion.establecerUsuarioActual(usuario);
      exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Inicio de sesión correcto, redirigiendo...');
      setTimeout(() => exports.sesion.redirigirSegunRol(usuario.rol), 800);
    });
  }

  function configurarRegistro() {
    const formulario = document.querySelector('#formRegistro');
    if (!formulario) return;

    const mensaje = formulario.querySelector('.mensaje-form');

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const datos = new FormData(formulario);

      const usuario = {
        id: exports.storage.generarId('usr'),
        nombre: String(datos.get('nombre') || '').trim(),
        correo: String(datos.get('correo') || '').trim().toLowerCase(),
        matricula: String(datos.get('matricula') || '').trim(),
        matriculaActiva: datos.get('matriculaActiva') === 'si',
        rut: String(datos.get('rut') || '').trim(),
        contrasena: String(datos.get('contrasena') || '').trim(),
        confirmar: String(datos.get('confirmar') || '').trim(),
        rol: 'estudiante',
        telefono: '',
        notificaciones: true
      };

      if (!usuario.nombre || !usuario.correo || !usuario.rut || !usuario.contrasena || !usuario.matricula) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Todos los campos son obligatorios.');
        return;
      }

      if (!exports.validaciones.esCorreoInstitucional(usuario.correo)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'El correo debe ser institucional @duocuc.cl.');
        return;
      }

      if (!exports.validaciones.esRutValido(usuario.rut)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'El RUT ingresado no es válido.');
        return;
      }

      if (!/^[A-Za-z0-9-]{6,}$/.test(usuario.matricula)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Ingresa una matrícula válida (mínimo 6 caracteres alfanuméricos).');
        return;
      }

      if (!usuario.matriculaActiva) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Matrícula inactiva, no puede registrarse.');
        return;
      }

      if (!exports.validaciones.esContrasenaSegura(usuario.contrasena)) {
        exports.validaciones.mostrarMensaje(
          mensaje,
          'error',
          'La contraseña debe tener 8 caracteres, una mayúscula y un número.'
        );
        return;
      }

      if (usuario.contrasena !== usuario.confirmar) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Las contraseñas no coinciden.');
        return;
      }

      const usuarios = obtenerUsuarios();
      const existeCorreo = usuarios.some((item) => item.correo.toLowerCase() === usuario.correo);
      const existeRut = usuarios.some((item) => item.rut === usuario.rut);
      const existeMatricula = usuarios.some(
        (item) => (item.matricula || '').toLowerCase() === usuario.matricula.toLowerCase()
      );

      if (existeCorreo || existeRut || existeMatricula) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Ya existe un usuario con ese correo, RUT o matrícula.');
        return;
      }

      delete usuario.confirmar;
      usuarios.push(usuario);
      guardarUsuarios(usuarios);

      exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Registro exitoso, puedes iniciar sesión.');
      formulario.reset();
      setTimeout(() => {
        window.location.href = '../views/login.html';
      }, 1000);
    });
  }

  function configurarRecuperacion() {
    const boton = document.querySelector('#btnRecuperar');
    const formulario = document.querySelector('#formRecuperar');
    if (!boton || !formulario) return;

    const mensaje = formulario.querySelector('.mensaje-form');
    const campoCorreo = formulario.querySelector('#correoRecuperacion');

    const cerrarFormulario = () => {
      formulario.classList.add('oculto');
      formulario.setAttribute('aria-hidden', 'true');
      formulario.reset();
      if (mensaje) {
        mensaje.textContent = '';
        mensaje.className = 'mensaje-form';
      }
    };

    boton.addEventListener('click', () => {
      formulario.classList.remove('oculto');
      formulario.setAttribute('aria-hidden', 'false');
      campoCorreo?.focus();
    });

    document.querySelector('#btnCerrarRecuperacion')?.addEventListener('click', cerrarFormulario);

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const correo = String(campoCorreo?.value || '').trim().toLowerCase();

      if (!exports.validaciones.esCorreoInstitucional(correo)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Ingresa un correo institucional válido.');
        return;
      }

      const usuario = obtenerUsuarios().find((item) => item.correo.toLowerCase() === correo);
      if (!usuario) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'No se encontró un usuario con ese correo.');
        return;
      }

      exports.validaciones.mostrarMensaje(
        mensaje,
        'exito',
        'Hemos enviado un correo de recuperación. Revisa tu bandeja de entrada.'
      );
      setTimeout(cerrarFormulario, 2000);
    });
  }

  function configurarGestionUsuarios() {
    const formulario = document.querySelector('#formGestionUsuario');
    const tabla = document.querySelector('#cuerpoUsuarios');
    if (!formulario || !tabla) return;

    const contenedorFormulario = formulario.closest('.formulario');
    const tablaCompleta = tabla.closest('table');
    const mensaje = formulario.querySelector('.mensaje-form');
    const usuarioActual = exports.sesion.obtenerUsuarioActual();
    const puedeGestionar = usuarioActual && ['administrador', 'coordinador'].includes(usuarioActual.rol);

    if (!puedeGestionar) {
      if (contenedorFormulario) contenedorFormulario.style.display = 'none';
      if (tablaCompleta) tablaCompleta.style.display = 'none';
      return;
    }

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const datos = new FormData(formulario);

      const registro = {
        id: datos.get('id') || exports.storage.generarId('usr'),
        nombre: String(datos.get('nombre') || '').trim(),
        correo: String(datos.get('correo') || '').trim().toLowerCase(),
        rut: String(datos.get('rut') || '').trim(),
        rol: String(datos.get('rol') || '').trim(),
        matricula: String(datos.get('matricula') || '').trim(),
        telefono: String(datos.get('telefono') || '').trim(),
        matriculaActiva: datos.get('matriculaActiva') === 'si',
        notificaciones: datos.get('notificaciones') === 'si',
        contrasena: String(datos.get('contrasena') || '').trim()
      };

      if (!registro.nombre || !registro.correo || !registro.rut || !registro.rol) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Completa la información del usuario.');
        return;
      }

      if (!exports.validaciones.esCorreoInstitucional(registro.correo)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Correo no válido.');
        return;
      }

      if (!exports.validaciones.esRutValido(registro.rut)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'RUT no válido.');
        return;
      }

      if (registro.matricula && !/^[A-Za-z0-9-]{6,}$/.test(registro.matricula)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Matrícula inválida. Usa al menos 6 caracteres alfanuméricos.');
        return;
      }

      if (['estudiante', 'ayudante'].includes(registro.rol) && !registro.matricula) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Los estudiantes y ayudantes requieren matrícula activa.');
        return;
      }

      if (registro.contrasena && !exports.validaciones.esContrasenaSegura(registro.contrasena)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Contraseña insegura.');
        return;
      }

      const usuarios = obtenerUsuarios();
      const indice = usuarios.findIndex((usuario) => usuario.id === registro.id);
      const conflictoCorreo = usuarios.some(
        (usuario) => usuario.id !== registro.id && usuario.correo.toLowerCase() === registro.correo
      );
      const conflictoRut = usuarios.some(
        (usuario) => usuario.id !== registro.id && usuario.rut === registro.rut
      );
      const conflictoMatricula = registro.matricula
        ? usuarios.some(
            (usuario) =>
              usuario.id !== registro.id &&
              (usuario.matricula || '').toLowerCase() === registro.matricula.toLowerCase()
          )
        : false;

      if (conflictoCorreo || conflictoRut || conflictoMatricula) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Correo, RUT o matrícula ya están en uso.');
        return;
      }

      if (!registro.contrasena && indice === -1) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Ingresa una contraseña para nuevos usuarios.');
        return;
      }

      if (indice >= 0) {
        const actual = usuarios[indice];
        usuarios[indice] = {
          ...actual,
          ...registro,
          contrasena: registro.contrasena || actual.contrasena,
          matricula: registro.matricula || actual.matricula || '',
          telefono: registro.telefono || actual.telefono || '',
          notificaciones: registro.notificaciones,
          matriculaActiva: registro.matricula ? registro.matriculaActiva : actual.matriculaActiva
        };
        exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Usuario actualizado.');
      } else {
        usuarios.push({
          ...registro,
          notificaciones: registro.notificaciones,
          matriculaActiva:
            registro.matricula ? registro.matriculaActiva : registro.rol !== 'estudiante'
        });
        exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Usuario creado.');
      }

      guardarUsuarios(usuarios);
      formulario.reset();
      formulario.querySelector('[name="id"]').value = '';
      renderizarUsuarios();
      refrescarAnalitica();
    });

    renderizarUsuarios();
    refrescarAnalitica();
  }

  function renderizarUsuarios() {
    const tabla = document.querySelector('#cuerpoUsuarios');
    if (!tabla) return;

    const usuarios = [...obtenerUsuarios()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );

    tabla.innerHTML = '';

    if (usuarios.length === 0) {
      const filaVacia = document.createElement('tr');
      const columnas = tabla.closest('table')?.querySelectorAll('th').length || 5;
      filaVacia.innerHTML = `<td colspan="${columnas}">Sin usuarios registrados.</td>`;
      tabla.appendChild(filaVacia);
      return;
    }

    usuarios.forEach((usuario) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${usuario.nombre}</td>
        <td>${usuario.correo}</td>
        <td>${usuario.rut}</td>
        <td>${usuario.rol}</td>
        <td>${usuario.matricula || '—'}</td>
        <td>${usuario.matriculaActiva === false ? 'Inactiva' : 'Activa'}</td>
        <td class="tabla-acciones">
          <button class="btn-accion btn-pequeno" data-accion="editar" data-id="${usuario.id}">Editar</button>
          <button class="btn-secundario btn-pequeno" data-accion="eliminar" data-id="${usuario.id}">Eliminar</button>
        </td>
      `;
      tabla.appendChild(fila);
    });

    tabla.querySelectorAll('button[data-accion="editar"]').forEach((boton) => {
      boton.addEventListener('click', () => cargarUsuarioEnFormulario(boton.dataset.id));
    });

    tabla.querySelectorAll('button[data-accion="eliminar"]').forEach((boton) => {
      boton.addEventListener('click', () => eliminarUsuario(boton.dataset.id));
    });
  }

  function cargarUsuarioEnFormulario(id) {
    const formulario = document.querySelector('#formGestionUsuario');
    if (!formulario) return;

    const usuario = obtenerUsuarios().find((item) => item.id === id);
    if (!usuario) return;

    formulario.querySelector('[name="id"]').value = usuario.id;
    formulario.querySelector('[name="nombre"]').value = usuario.nombre;
    formulario.querySelector('[name="correo"]').value = usuario.correo;
    formulario.querySelector('[name="rut"]').value = usuario.rut;
    formulario.querySelector('[name="rol"]').value = usuario.rol;
    formulario.querySelector('[name="matricula"]').value = usuario.matricula || '';
    formulario.querySelector('[name="telefono"]').value = usuario.telefono || '';
    const matriculaActiva = formulario.querySelector('[name="matriculaActiva"]');
    if (matriculaActiva) matriculaActiva.checked = usuario.matriculaActiva !== false;
    const notificaciones = formulario.querySelector('[name="notificaciones"]');
    if (notificaciones) notificaciones.checked = usuario.notificaciones !== false;
    formulario.querySelector('[name="contrasena"]').value = '';
  }

  function eliminarUsuario(id) {
    const usuarioActual = exports.sesion.obtenerUsuarioActual();
    if (usuarioActual && usuarioActual.id === id) {
      alert('No puedes eliminar tu propio usuario mientras la sesión está activa.');
      return;
    }

    if (!confirm('¿Eliminar usuario del sistema?')) return;

    const usuarios = obtenerUsuarios().filter((usuario) => usuario.id !== id);
    guardarUsuarios(usuarios);
    renderizarUsuarios();
    refrescarAnalitica();
  }

  function configurarPerfil() {
    const formularioDatos = document.querySelector('#formDatosPersonales');
    const formularioPreferencias = document.querySelector('#formPreferencias');
    const formularioContrasena = document.querySelector('#formCambioContrasena');
    const tienePerfil = formularioDatos || formularioPreferencias || formularioContrasena;
    if (!tienePerfil) return;

    let usuarioActual = exports.sesion.obtenerUsuarioActual();
    if (!usuarioActual) return;

    actualizarResumenPerfil(usuarioActual);

    if (formularioDatos) {
      const mensaje = formularioDatos.querySelector('.mensaje-form');
      const nombreCampo = formularioDatos.querySelector('#perfilNombre');
      const correoCampo = formularioDatos.querySelector('#perfilCorreo');
      const telefonoCampo = formularioDatos.querySelector('#perfilTelefono');
      const matriculaCampo = formularioDatos.querySelector('#perfilMatricula');

      const poblarCampos = () => {
        nombreCampo.value = usuarioActual.nombre || '';
        correoCampo.value = usuarioActual.correo || '';
        telefonoCampo.value = usuarioActual.telefono || '';
        matriculaCampo.value = usuarioActual.matricula || '';
      };

      poblarCampos();

      formularioDatos.addEventListener('reset', (evento) => {
        evento.preventDefault();
        poblarCampos();
      });

      formularioDatos.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const nombre = String(nombreCampo.value || '').trim();
        const correo = String(correoCampo.value || '').trim().toLowerCase();
        const telefono = String(telefonoCampo.value || '').trim();
        const matricula = String(matriculaCampo.value || '').trim();

        if (!nombre || !correo) {
          exports.validaciones.mostrarMensaje(mensaje, 'error', 'Nombre y correo son obligatorios.');
          return;
        }

        if (!exports.validaciones.esCorreoInstitucional(correo)) {
          exports.validaciones.mostrarMensaje(mensaje, 'error', 'El correo debe ser institucional @duocuc.cl.');
          return;
        }

        if (['estudiante', 'ayudante'].includes(usuarioActual.rol) && !matricula) {
          exports.validaciones.mostrarMensaje(
            mensaje,
            'error',
            'Debes mantener una matrícula activa para tu rol.'
          );
          return;
        }

        if (matricula && !/^[A-Za-z0-9-]{6,}$/.test(matricula)) {
          exports.validaciones.mostrarMensaje(mensaje, 'error', 'Ingresa una matrícula válida.');
          return;
        }

        const usuarios = obtenerUsuarios();
        const conflictoCorreo = usuarios.some(
          (usuario) => usuario.id !== usuarioActual.id && usuario.correo.toLowerCase() === correo
        );
        const conflictoMatricula = matricula
          ? usuarios.some(
              (usuario) =>
                usuario.id !== usuarioActual.id &&
                (usuario.matricula || '').toLowerCase() === matricula.toLowerCase()
            )
          : false;

        if (conflictoCorreo || conflictoMatricula) {
          exports.validaciones.mostrarMensaje(
            mensaje,
            'error',
            'El correo o la matrícula ya pertenecen a otro usuario.'
          );
          return;
        }

        const actualizado = actualizarUsuario(usuarioActual.id, {
          nombre,
          correo,
          telefono,
          matricula: matricula || usuarioActual.matricula || '',
          matriculaActiva: matricula ? true : usuarioActual.matriculaActiva
        });

        if (actualizado) {
          usuarioActual = actualizado;
          exports.sesion.establecerUsuarioActual(usuarioActual);
          actualizarResumenPerfil(usuarioActual);
          renderizarUsuarios();
          refrescarAnalitica();
          exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Datos personales actualizados.');
        }
      });
    }

    if (formularioPreferencias) {
      const mensaje = formularioPreferencias.querySelector('.mensaje-form');
      const checkbox = formularioPreferencias.querySelector('#preferenciaNotificaciones');
      checkbox.checked = usuarioActual.notificaciones !== false;

      formularioPreferencias.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const actualizado = actualizarUsuario(usuarioActual.id, {
          notificaciones: checkbox.checked
        });
        if (actualizado) {
          usuarioActual = actualizado;
          exports.sesion.establecerUsuarioActual(usuarioActual);
          actualizarResumenPerfil(usuarioActual);
          renderizarUsuarios();
          refrescarAnalitica();
          exports.validaciones.mostrarMensaje(
            mensaje,
            'exito',
            checkbox.checked
              ? 'Notificaciones activadas correctamente.'
              : 'Notificaciones desactivadas.'
          );
        }
      });
    }

    if (formularioContrasena) {
      const mensaje = formularioContrasena.querySelector('.mensaje-form');

      formularioContrasena.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const datos = new FormData(formularioContrasena);
        const actual = String(datos.get('actual') || '').trim();
        const nueva = String(datos.get('nueva') || '').trim();
        const confirmar = String(datos.get('confirmar') || '').trim();

        if (actual !== usuarioActual.contrasena) {
          exports.validaciones.mostrarMensaje(mensaje, 'error', 'La contraseña actual no coincide.');
          return;
        }

        if (!exports.validaciones.esContrasenaSegura(nueva)) {
          exports.validaciones.mostrarMensaje(
            mensaje,
            'error',
            'La nueva contraseña debe tener 8 caracteres, una mayúscula y un número.'
          );
          return;
        }

        if (nueva !== confirmar) {
          exports.validaciones.mostrarMensaje(mensaje, 'error', 'Las contraseñas no coinciden.');
          return;
        }

        const actualizado = actualizarUsuario(usuarioActual.id, { contrasena: nueva });
        if (actualizado) {
          usuarioActual = actualizado;
          exports.sesion.establecerUsuarioActual(usuarioActual);
          formularioContrasena.reset();
          exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Contraseña actualizada correctamente.');
        }
      });
    }
  }

  function actualizarResumenPerfil(usuario) {
    const nombre = document.querySelector('#perfilNombreActual');
    const rol = document.querySelector('#perfilRolActual');
    const matricula = document.querySelector('#perfilMatriculaActual');
    const notificaciones = document.querySelector('#perfilNotificacionesActual');

    if (nombre) nombre.textContent = usuario.nombre || '—';
    if (rol) rol.textContent = usuario.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : '—';
    if (matricula) matricula.textContent = usuario.matricula || '—';
    if (notificaciones) {
      notificaciones.textContent = usuario.notificaciones === false ? 'Desactivadas' : 'Activadas';
    }
  }

  function configurarReportes() {
    contenedoresMetricas = Array.from(document.querySelectorAll('[data-metricas]'));
    botonesReporte = Array.from(document.querySelectorAll('[data-reporte]'));
    tablaReservasDirector = document.querySelector('[data-tabla-reservas]');
    listaTopInventario = document.querySelector('[data-top-inventario]');
    mensajeReportes = document.querySelector('#mensajeReportes');

    if (
      !contenedoresMetricas.length &&
      !botonesReporte.length &&
      !tablaReservasDirector &&
      !listaTopInventario
    ) {
      return;
    }

    refrescarAnalitica();

    botonesReporte.forEach((boton) => {
      if (boton.dataset.reporteListener) return;
      boton.addEventListener('click', () => {
        const dataset = obtenerDatosGenerales();
        const resultado = generarReporte(boton.dataset.reporte, dataset);
        if (!resultado) {
          exports.validaciones.mostrarMensaje(
            mensajeReportes,
            'info',
            'No existen registros para el reporte solicitado.'
          );
          return;
        }

        descargarCSV(resultado.nombre, resultado.encabezados, resultado.filas);
        exports.validaciones.mostrarMensaje(
          mensajeReportes,
          'exito',
          `Reporte "${resultado.nombre}" generado correctamente.`
        );
      });
      boton.dataset.reporteListener = 'true';
    });
  }

  function obtenerDatosGenerales() {
    return {
      usuarios: obtenerUsuarios(),
      reservas: exports.storage.obtenerDatos('reservas'),
      inventario: exports.storage.obtenerDatos('inventario'),
      espacios: exports.storage.obtenerDatos('espacios')
    };
  }

  function renderizarMetricas(contenedor, datos) {
    const usuariosActivos = datos.usuarios.filter((usuario) => usuario.matriculaActiva !== false).length;
    const reservasPendientes = datos.reservas.filter((reserva) => reserva.estado === 'pendiente').length;
    const reservasAprobadas = datos.reservas.filter((reserva) => reserva.estado === 'aprobada').length;
    const reservasRechazadas = datos.reservas.filter((reserva) => reserva.estado === 'rechazada').length;
    const inventarioDisponible = datos.inventario.filter((item) => item.estado === 'disponible').length;
    const inventarioTotal = datos.inventario.length;
    const reservasTotales = datos.reservas.length;
    const roles = datos.usuarios.reduce((acc, usuario) => {
      acc[usuario.rol] = (acc[usuario.rol] || 0) + 1;
      return acc;
    }, {});

    const resumenRoles = Object.entries(roles)
      .map(([rol, total]) => `${rol}: ${total}`)
      .join(', ');

    contenedor.innerHTML = `
      <div class="metrica">
        <h3>Usuarios activos</h3>
        <strong>${usuariosActivos}</strong>
        <span>${resumenRoles || 'Sin registros'}</span>
      </div>
      <div class="metrica">
        <h3>Reservas pendientes</h3>
        <strong>${reservasPendientes}</strong>
        <span>Total registradas: ${reservasTotales}</span>
      </div>
      <div class="metrica">
        <h3>Reservas aprobadas</h3>
        <strong>${reservasAprobadas}</strong>
        <span>Rechazadas: ${reservasRechazadas}</span>
      </div>
      <div class="metrica">
        <h3>Recursos disponibles</h3>
        <strong>${inventarioDisponible}</strong>
        <span>Total en inventario: ${inventarioTotal}</span>
      </div>
    `;
  }

  function renderizarTablaReservas(tabla, datos) {
    const tbody = tabla.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (datos.reservas.length === 0) {
      const fila = document.createElement('tr');
      fila.innerHTML = '<td colspan="4">Sin información de reservas registrada.</td>';
      tbody.appendChild(fila);
      return;
    }

    const registros = [...datos.reservas]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 10);

    registros.forEach((reserva) => {
      const recurso =
        datos.inventario.find((item) => item.id === reserva.referenciaId) ||
        datos.espacios.find((item) => item.id === reserva.referenciaId);
      const nombreRecurso = recurso ? recurso.nombre : 'Recurso no encontrado';
      const tipo = reserva.tipo === 'articulo' ? 'Artículo' : 'Espacio';
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${nombreRecurso}</td>
        <td>${tipo}</td>
        <td>${reserva.fecha}</td>
        <td>${reserva.estado}</td>
      `;
      tbody.appendChild(fila);
    });
  }

  function renderizarTopInventario(lista, datos) {
    const aprobadas = datos.reservas.filter((reserva) => reserva.estado === 'aprobada');
    lista.innerHTML = '';

    if (aprobadas.length === 0) {
      lista.innerHTML = '<li>No hay datos disponibles.</li>';
      return;
    }

    const conteo = aprobadas.reduce((acc, reserva) => {
      acc[reserva.referenciaId] = (acc[reserva.referenciaId] || 0) + 1;
      return acc;
    }, {});

    const top = Object.entries(conteo)
      .map(([referenciaId, total]) => {
        const recurso =
          datos.inventario.find((item) => item.id === referenciaId) ||
          datos.espacios.find((item) => item.id === referenciaId);
        return {
          nombre: recurso ? recurso.nombre : referenciaId,
          tipo: datos.inventario.some((item) => item.id === referenciaId) ? 'Artículo' : 'Espacio',
          total
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    top.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `${item.nombre} · ${item.tipo} · ${item.total} reservas aprobadas`;
      lista.appendChild(li);
    });
  }

  function refrescarAnalitica() {
    if (
      !contenedoresMetricas.length &&
      !tablaReservasDirector &&
      !listaTopInventario
    ) {
      return;
    }

    const datos = obtenerDatosGenerales();
    contenedoresMetricas.forEach((contenedor) => renderizarMetricas(contenedor, datos));
    if (tablaReservasDirector) renderizarTablaReservas(tablaReservasDirector, datos);
    if (listaTopInventario) renderizarTopInventario(listaTopInventario, datos);
  }

  function generarReporte(tipo, datos) {
    const fecha = new Date().toISOString().slice(0, 10);

    if (tipo === 'uso') {
      const usuariosActivos = datos.usuarios.filter((usuario) => usuario.matriculaActiva !== false).length;
      const reservasTotales = datos.reservas.length;
      const inventarioTotal = datos.inventario.length + datos.espacios.length;
      const roles = datos.usuarios.reduce((acc, usuario) => {
        acc[usuario.rol] = (acc[usuario.rol] || 0) + 1;
        return acc;
      }, {});

      const filas = [
        ['Usuarios activos', usuariosActivos],
        ['Reservas registradas', reservasTotales],
        ['Recursos totales', inventarioTotal]
      ];

      Object.entries(roles).forEach(([rol, total]) => {
        filas.push([`Usuarios ${rol}`, total]);
      });

      return {
        nombre: `reporte-uso-${fecha}.csv`,
        encabezados: ['Indicador', 'Valor'],
        filas
      };
    }

    if (tipo === 'prestamos' || tipo === 'devoluciones') {
      const estadoObjetivo = tipo === 'prestamos' ? 'aprobada' : 'rechazada';
      const coincidencias = datos.reservas.filter((reserva) => reserva.estado === estadoObjetivo);

      if (coincidencias.length === 0) {
        return null;
      }

      const filas = coincidencias.map((reserva) => {
        const recurso =
          datos.inventario.find((item) => item.id === reserva.referenciaId) ||
          datos.espacios.find((item) => item.id === reserva.referenciaId);
        const nombreRecurso = recurso ? recurso.nombre : reserva.referenciaId;
        const tipoRecurso = reserva.tipo === 'articulo' ? 'Artículo' : 'Espacio';
        return [reserva.id, nombreRecurso, tipoRecurso, reserva.fecha, reserva.nombre];
      });

      return {
        nombre: `reporte-${tipo}-${fecha}.csv`,
        encabezados: ['ID', 'Recurso', 'Tipo', 'Fecha', 'Solicitante'],
        filas
      };
    }

    return null;
  }

  function descargarCSV(nombre, encabezados, filas) {
    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  }

  exports.usuarios = {
    init,
    renderizarUsuarios
  };

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})(window.CIIT);
