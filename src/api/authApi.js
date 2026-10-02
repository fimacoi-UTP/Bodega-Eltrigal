/**
 * ============================================================================
 * SERVICIO DE AUTENTICACIÓN · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Conecta las operaciones de inicio/cierre de sesión con los endpoints reales
 * de autenticación en Spring Boot (/api/auth/login).
 * ==========================================================================*/

import {
  apiFetch,
  guardarToken,
  borrarToken,
  obtenerToken,
  USUARIO_KEY,
} from "./apiClient";

/**
 * Guarda los datos del usuario en localStorage para persistencia de sesión.
 * @param {object} usuario
 */
export function guardarUsuarioSesion(usuario) {
  if (usuario) {
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  }
}

/**
 * Obtiene los datos del usuario guardado en localStorage.
 * @returns {object|null}
 */
export function obtenerUsuarioSesion() {
  const token = obtenerToken();
  if (!token) {
    borrarUsuarioSesion();
    return null;
  }

  const guardado = localStorage.getItem(USUARIO_KEY);
  if (!guardado) return null;

  try {
    return JSON.parse(guardado);
  } catch {
    borrarUsuarioSesion();
    return null;
  }
}

/**
 * Elimina los datos del usuario de localStorage.
 */
export function borrarUsuarioSesion() {
  localStorage.removeItem(USUARIO_KEY);
}

/**
 * Servicio de autenticación con el backend Spring Boot.
 */
export const authApi = {
  /**
   * Inicia sesión enviando credenciales a Spring Boot.
   *
   * @param {string} email - Correo del usuario.
   * @param {string} password - Contraseña en texto plano (Spring Security la valida contra BCrypt).
   * @returns {Promise<{ email: string, rol: string, nombres: string, nombre: string, correo: string, id: string|number }>}
   */
  async login(email, password) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // Guardar token JWT en localStorage
    if (data?.token) {
      guardarToken(data.token);
    }

    // Normalizar objeto de usuario asegurando compatibilidad con:
    // - El backend: { email, rol, nombres }
    // - Los componentes existentes del frontend: usuario.nombre, usuario.correo, usuario.rol, usuario.id
    const usuario = {
      id: data?.id ?? data?.email ?? email,
      email: data?.email ?? email,
      correo: data?.email ?? email,
      nombres: data?.nombres ?? "",
      nombre: data?.nombres || data?.nombre || data?.email || email,
      rol: data?.rol,
    };

    // Guardar sesión en almacenamiento local para no perderla al recargar
    guardarUsuarioSesion(usuario);

    return usuario;
  },

  /**
   * Cierra sesión eliminando el token JWT y los datos de usuario de localStorage.
   */
  logout() {
    borrarToken();
    borrarUsuarioSesion();
  },

  /**
   * Restaura la sesión activa desde localStorage si existe un token válido.
   * @returns {object|null}
   */
  obtenerUsuarioSesion,
};

export default authApi;
