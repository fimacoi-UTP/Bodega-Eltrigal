/**
 * ============================================================================
 * CLIENTE API REUTILIZABLE · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Cliente base para consumir el backend real en Spring Boot (http://localhost:8080).
 * Maneja el almacenamiento del JWT en localStorage, la inyección automática
 * del encabezado Authorization: Bearer <token>, y la captura de errores 401.
 * ==========================================================================*/

export const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:8080";

export const TOKEN_KEY = "trigal:token";
export const USUARIO_KEY = "trigal:usuario";

/**
 * Guarda el token JWT en localStorage.
 * @param {string} token
 */
export function guardarToken(token) {
  if (token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (err) {
      console.warn("[El Trigal] Error al guardar token en localStorage:", err);
    }
  }
}

/**
 * Recupera el token JWT guardado en localStorage.
 * @returns {string|null}
 */
export function obtenerToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Elimina el token JWT de localStorage.
 */
export function borrarToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn("[El Trigal] Error al borrar token de localStorage:", err);
  }
}

/**
 * Función genérica para realizar peticiones HTTP hacia el backend.
 *
 * Características:
 *  - Construye la URL completa anteponiendo BASE_URL.
 *  - Asigna 'Content-Type': 'application/json' por defecto.
 *  - Si hay token JWT guardado, añade 'Authorization: Bearer <token>'.
 *  - Si la respuesta es 401 (no autorizado o expirado), borra el token y lanza un error claro.
 *  - Devuelve el JSON parseado; si la respuesta no es ok, lanza un error con el mensaje del backend.
 *
 * @param {string} ruta - Ruta relativa (ej. "/api/auth/login") o URL completa.
 * @param {RequestInit} [opciones={}] - Opciones estándar de fetch.
 * @returns {Promise<any>} Datos JSON devueltos por el servidor.
 * @throws {Error} Con el mensaje descriptivo del fallo.
 */
export async function apiFetch(ruta, opciones = {}) {
  const url = ruta.startsWith("http://") || ruta.startsWith("https://")
    ? ruta
    : `${BASE_URL}${ruta.startsWith("/") ? "" : "/"}${ruta}`;

  const token = obtenerToken();
  const esFormData = typeof FormData !== "undefined" && opciones.body instanceof FormData;

  const headers = {
    ...(!esFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opciones.headers || {}),
  };

  let respuesta;
  try {
    respuesta = await fetch(url, {
      ...opciones,
      headers,
    });
  } catch (errorRed) {
    throw new Error(
      `No se pudo conectar con el servidor en ${BASE_URL}. Verifica que el backend esté ejecutándose. Detalle: ${errorRed.message}`,
      { cause: errorRed }
    );
  }

  // 401 No autorizado: expiró el token o credenciales inválidas
  if (respuesta.status === 401) {
    borrarToken();
    localStorage.removeItem(USUARIO_KEY);

    let mensaje401 = "Credenciales incorrectas o sesión expirada. Por favor, inicia sesión nuevamente.";
    try {
      const errorJson = await respuesta.json();
      if (errorJson?.message || errorJson?.mensaje || errorJson?.error) {
        mensaje401 = errorJson.message || errorJson.mensaje || errorJson.error;
      }
    } catch {
      // Si la respuesta no contiene JSON válido, se mantiene el mensaje por defecto
    }

    throw new Error(mensaje401);
  }

  // Otros errores HTTP (400, 403, 404, 500, etc.)
  if (!respuesta.ok) {
    let mensajeError = `Error en el servidor (${respuesta.status})`;
    try {
      const errorJson = await respuesta.json();
      mensajeError =
        errorJson?.message ||
        errorJson?.mensaje ||
        errorJson?.error ||
        mensajeError;
    } catch {
      try {
        const texto = await respuesta.text();
        if (texto) mensajeError = texto;
      } catch {
        // Ignorar error al leer texto
      }
    }
    const error = new Error(mensajeError);
    error.status = respuesta.status;
    throw error;
  }

  // Si no hay contenido (ej. HTTP 204)
  if (respuesta.status === 204) {
    return null;
  }

  // Parsear y devolver JSON
  try {
    const texto = await respuesta.text();
    return texto ? JSON.parse(texto) : null;
  } catch (parseError) {
    throw new Error(
      `Error al procesar la respuesta del servidor: ${parseError.message}`,
      { cause: parseError }
    );
  }
}

/**
 * Convierte una ruta relativa de imagen (/uploads/...) a una URL absoluta
 * apuntando al backend, o conserva la URL si ya es absoluta.
 * @param {string|null} path
 * @returns {string}
 */
export function urlImagen(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/uploads")) return `${BASE_URL}${path}`;
  return path;
}

