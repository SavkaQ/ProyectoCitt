// Módulo de control de permisos y visibilidad según roles
window.CIIT = window.CIIT || {};

(function(exports) {
  /**
   * Verifica la sesión y redirige si el usuario no cumple con el rol requerido.
   * @param {string[]} rolesPermitidos
   */
  function requerirSesion(rolesPermitidos = []) {
    const usuario = exports.sesion.obtenerUsuarioActual();
    if (!usuario) {
      window.location.href = '../views/login.html';
      return;
    }

    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
      alert('No cuentas con permisos para acceder a esta vista.');
      exports.sesion.redirigirSegunRol(usuario.rol);
    }
  }

  /**
   * Aplica visibilidad en el DOM para los nodos marcados con data-rol.
   */
  function aplicarVisibilidad() {
    const usuario = exports.sesion.obtenerUsuarioActual();
    const nodos = document.querySelectorAll('[data-rol]');

    nodos.forEach((elemento) => {
      const roles = elemento.dataset.rol.split(',').map((rol) => rol.trim());
      const esVisible = usuario && roles.includes(usuario.rol);
      if (esVisible) {
        elemento.classList.add('visible');
      } else {
        elemento.classList.remove('visible');
      }
    });
  }

  exports.permisos = {
    requerirSesion,
    aplicarVisibilidad
  };
})(window.CIIT);
