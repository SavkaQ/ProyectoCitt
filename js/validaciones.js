// Módulo de validaciones reutilizables para el proyecto CIIT
window.CIIT = window.CIIT || {};

(function(exports) {
  /**
   * Valida que el correo pertenezca a la institución Duoc UC.
   * @param {string} correo - Correo electrónico a validar.
   * @returns {boolean}
   */
  function esCorreoInstitucional(correo) {
    return /^[\w.-]+@duocuc\.cl$/i.test(String(correo).trim());
  }

  /**
   * Valida el formato general del RUT chileno (sin verificación de dígito).
   * @param {string} rut
   * @returns {boolean}
   */
  function esRutValido(rut) {
    const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
    if (limpio.length < 8) return false;

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i], 10) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);
    let dvCalculado = '';

    if (resto === 11) dvCalculado = '0';
    else if (resto === 10) dvCalculado = 'K';
    else dvCalculado = String(resto);

    return dvCalculado === dv;
  }

  /**
   * Reglas para contraseñas seguras del CIIT.
   * Deben tener al menos 8 caracteres, 1 mayúscula y 1 número.
   * @param {string} contrasena
   * @returns {boolean}
   */
  function esContrasenaSegura(contrasena) {
    return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(contrasena));
  }

  /**
   * Muestra un mensaje en contenedores de alertas reutilizable.
   * @param {HTMLElement|null} contenedor
   * @param {'exito'|'error'|'info'} tipo
   * @param {string} mensaje
   */
  function mostrarMensaje(contenedor, tipo, mensaje) {
    if (!contenedor) {
      alert(mensaje);
      return;
    }

    contenedor.textContent = mensaje;
    contenedor.className = `alerta alerta-${tipo}`;
    contenedor.setAttribute('role', 'alert');
  }

  exports.validaciones = {
    esCorreoInstitucional,
    esRutValido,
    esContrasenaSegura,
    mostrarMensaje
  };
})(window.CIIT);
