// Módulo de usuarios: autenticación, registro y gestión administrativa
window.CIIT = window.CIIT || {};

(function(exports) {
  function init() {
    configurarLogin();
    configurarRegistro();
    configurarGestionUsuarios();
  }

  function configurarLogin() {
    const formulario = document.querySelector('#formLogin');
    if (!formulario) return;

    const mensaje = formulario.querySelector('.mensaje-form');

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const datos = new FormData(formulario);
      const correo = datos.get('correo').trim().toLowerCase();
      const contrasena = datos.get('contrasena').trim();

      if (!exports.validaciones.esCorreoInstitucional(correo)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Utiliza tu correo institucional @duocuc.cl');
        return;
      }

      const usuarios = exports.storage.obtenerDatos('usuarios');
      const usuario = usuarios.find((item) => item.correo.toLowerCase() === correo && item.contrasena === contrasena);

      if (!usuario) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Credenciales incorrectas.');
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
        nombre: datos.get('nombre').trim(),
        correo: datos.get('correo').trim().toLowerCase(),
        rut: datos.get('rut').trim(),
        contrasena: datos.get('contrasena').trim(),
        confirmar: datos.get('confirmar').trim(),
        rol: 'estudiante'
      };

      if (!usuario.nombre || !usuario.correo || !usuario.rut || !usuario.contrasena) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Todos los campos son obligatorios.');
        return;
      }

      if (!exports.validaciones.esCorreoInstitucional(usuario.correo)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'El correo debe ser institucional @duocuc.cl');
        return;
      }

      if (!exports.validaciones.esRutValido(usuario.rut)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'El RUT ingresado no es válido.');
        return;
      }

      if (!exports.validaciones.esContrasenaSegura(usuario.contrasena)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'La contraseña debe tener 8 caracteres, una mayúscula y un número.');
        return;
      }

      if (usuario.contrasena !== usuario.confirmar) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Las contraseñas no coinciden.');
        return;
      }

      const usuarios = exports.storage.obtenerDatos('usuarios');
      const existeCorreo = usuarios.some((item) => item.correo.toLowerCase() === usuario.correo);
      const existeRut = usuarios.some((item) => item.rut === usuario.rut);

      if (existeCorreo || existeRut) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Ya existe un usuario registrado con ese correo o RUT.');
        return;
      }

      delete usuario.confirmar;
      usuarios.push(usuario);
      exports.storage.guardarDatos('usuarios', usuarios);

      exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Registro exitoso, puedes iniciar sesión.');
      formulario.reset();
      setTimeout(() => {
        window.location.href = '../views/login.html';
      }, 1000);
    });
  }

  function configurarGestionUsuarios() {
    const formulario = document.querySelector('#formGestionUsuario');
    const tabla = document.querySelector('#cuerpoUsuarios');

    if (!formulario || !tabla) return;

    const mensaje = formulario.querySelector('.mensaje-form');
    const usuarioActual = exports.sesion.obtenerUsuarioActual();

    if (!usuarioActual || usuarioActual.rol !== 'administrador') {
      formulario.closest('.formulario').style.display = 'none';
      tabla.closest('table').style.display = 'none';
      return;
    }

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const datos = new FormData(formulario);

      const registro = {
        id: datos.get('id') || exports.storage.generarId('usr'),
        nombre: datos.get('nombre').trim(),
        correo: datos.get('correo').trim().toLowerCase(),
        rut: datos.get('rut').trim(),
        contrasena: datos.get('contrasena').trim(),
        rol: datos.get('rol')
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

      if (registro.contrasena && !exports.validaciones.esContrasenaSegura(registro.contrasena)) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Contraseña insegura.');
        return;
      }

      const usuarios = exports.storage.obtenerDatos('usuarios');
      const existe = usuarios.findIndex((usuario) => usuario.id === registro.id);
      const conflictoCorreo = usuarios.some((usuario) => usuario.correo === registro.correo && usuario.id !== registro.id);
      const conflictoRut = usuarios.some((usuario) => usuario.rut === registro.rut && usuario.id !== registro.id);

      if (conflictoCorreo || conflictoRut) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Correo o RUT en uso por otro usuario.');
        return;
      }

      if (!registro.contrasena && existe === -1) {
        exports.validaciones.mostrarMensaje(mensaje, 'error', 'Ingresa una contraseña para nuevos usuarios.');
        return;
      }

      if (existe >= 0) {
        const actual = usuarios[existe];
        usuarios[existe] = {
          ...actual,
          ...registro,
          contrasena: registro.contrasena || actual.contrasena
        };
        exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Usuario actualizado.');
      } else {
        usuarios.push(registro);
        exports.validaciones.mostrarMensaje(mensaje, 'exito', 'Usuario creado.');
      }

      exports.storage.guardarDatos('usuarios', usuarios);
      formulario.reset();
      formulario.querySelector('[name="id"]').value = '';
      renderizarUsuarios();
    });

    renderizarUsuarios();
  }

  function renderizarUsuarios() {
    const tabla = document.querySelector('#cuerpoUsuarios');
    if (!tabla) return;

    const usuarios = exports.storage.obtenerDatos('usuarios');
    tabla.innerHTML = '';

    usuarios.forEach((usuario) => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${usuario.nombre}</td>
        <td>${usuario.correo}</td>
        <td>${usuario.rut}</td>
        <td>${usuario.rol}</td>
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

    const usuarios = exports.storage.obtenerDatos('usuarios');
    const usuario = usuarios.find((item) => item.id === id);
    if (!usuario) return;

    formulario.querySelector('[name="id"]').value = usuario.id;
    formulario.querySelector('[name="nombre"]').value = usuario.nombre;
    formulario.querySelector('[name="correo"]').value = usuario.correo;
    formulario.querySelector('[name="rut"]').value = usuario.rut;
    formulario.querySelector('[name="rol"]').value = usuario.rol;
    formulario.querySelector('[name="contrasena"]').value = '';
  }

  function eliminarUsuario(id) {
    const usuarioActual = exports.sesion.obtenerUsuarioActual();
    if (usuarioActual && usuarioActual.id === id) {
      alert('No puedes eliminar tu propio usuario mientras la sesión está activa.');
      return;
    }

    if (!confirm('¿Eliminar usuario del sistema?')) return;

    const usuarios = exports.storage.obtenerDatos('usuarios');
    const filtrados = usuarios.filter((usuario) => usuario.id !== id);
    exports.storage.guardarDatos('usuarios', filtrados);
    renderizarUsuarios();
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
