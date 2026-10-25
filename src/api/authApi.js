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
    try {
      localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
    } catch (err) {
      console.warn("[El Trigal] Error al guardar usuario en localStorage:", err);
    }
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

  try {
    const guardado = localStorage.getItem(USUARIO_KEY);
    if (!guardado) return null;
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
  try {
    localStorage.removeItem(USUARIO_KEY);
  } catch (err) {
    console.warn("[El Trigal] Error al borrar usuario de localStorage:", err);
  }
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
    // - El backend: { email, rol, nombres, apellidos, telefono }
    // - Los componentes existentes del frontend: usuario.nombre, usuario.correo, usuario.rol, usuario.id
    const usuario = {
      id: data?.id ?? data?.email ?? email,
      email: data?.email ?? email,
      correo: data?.email ?? email,
      nombres: data?.nombres ?? "",
      apellidos: data?.apellidos ?? "",
      nombre: data?.nombres || data?.nombre || data?.email || email,
      telefono: data?.telefono ?? "",
      rol: data?.rol,
      avatarUrl: data?.avatarUrl ?? null,
    };

    // Guardar sesión en almacenamiento local para no perderla al recargar
    guardarUsuarioSesion(usuario);

    return usuario;
  },

  /**
   * Registra un nuevo cliente en Spring Boot con auto-login.
   *
   * @param {object} datos
   * @param {string} datos.nombres
   * @param {string} datos.apellidos
   * @param {string} datos.email
   * @param {string} [datos.telefono]
   * @param {string} datos.password
   * @returns {Promise<{ email: string, rol: string, nombres: string, nombre: string, correo: string, id: string|number }>}
   */
  async registro(datos) {
    const data = await apiFetch("/api/auth/registro", {
      method: "POST",
      body: JSON.stringify({
        nombres: datos.nombres?.trim(),
        apellidos: datos.apellidos?.trim(),
        email: datos.email?.trim().toLowerCase(),
        telefono: datos.telefono?.trim() || null,
        password: datos.password,
      }),
    });

    // Guardar token JWT en localStorage
    if (data?.token) {
      guardarToken(data.token);
    }

    // Normalizar objeto de usuario
    const usuario = {
      id: data?.id ?? data?.email ?? datos.email,
      email: data?.email ?? datos.email,
      correo: data?.email ?? datos.email,
      nombres: data?.nombres ?? datos.nombres ?? "",
      apellidos: data?.apellidos ?? datos.apellidos ?? "",
      nombre: data?.nombres || datos.nombres || data?.email || datos.email,
      telefono: data?.telefono ?? datos?.telefono ?? "",
      rol: data?.rol,
      avatarUrl: data?.avatarUrl ?? null,
    };

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
