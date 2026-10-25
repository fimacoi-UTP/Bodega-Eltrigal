/**
 * ============================================================================
 * SERVICIO DE USUARIOS API · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Endpoints del usuario autenticado para consulta y actualización de perfil,
 * así como cambio de contraseña.
 * ==========================================================================*/

import { apiFetch } from "./apiClient";

export const usuariosApi = {
  /**
   * Obtiene los datos del usuario autenticado mediante su token JWT.
   * @returns {Promise<{ id: number|string, email: string, nombres: string, apellidos: string, telefono: string, avatarUrl: string|null, rol: string }>}
   */
  async obtenerMe() {
    return apiFetch("/api/usuarios/me");
  },

  /**
   * Actualiza el perfil del usuario autenticado.
   * @param {object} datos
   * @param {string} datos.nombres
   * @param {string} datos.apellidos
   * @param {string} [datos.telefono]
   * @param {string|null} [datos.avatarUrl]
   * @returns {Promise<object>} usuario actualizado
   */
  async actualizarPerfil(datos) {
    return apiFetch("/api/usuarios/me", {
      method: "PUT",
      body: JSON.stringify({
        nombres: datos.nombres?.trim() ?? "",
        apellidos: datos.apellidos?.trim() ?? "",
        telefono: datos.telefono?.trim() || null,
        avatarUrl: datos.avatarUrl || null,
      }),
    });
  },
  /**
   * Actualiza el avatar del usuario autenticado.
   * PUT /api/usuarios/me/avatar
   * @param {string|null} avatarUrl
   * @returns {Promise<object>} usuario actualizado
   */
  async actualizarAvatar(avatarUrl) {
    const urlLimpia =
      avatarUrl && avatarUrl !== "null" && avatarUrl !== "undefined"
        ? avatarUrl.trim()
        : null;
    try {
      return await apiFetch("/api/usuarios/me/avatar", {
        method: "PUT",
        body: JSON.stringify({ avatarUrl: urlLimpia }),
      });
    } catch {
      // Fallback a actualizarPerfil si /avatar no estuviera disponible
      const me = await this.obtenerMe();
      return await this.actualizarPerfil({
        nombres: me.nombres,
        apellidos: me.apellidos,
        telefono: me.telefono,
        avatarUrl: urlLimpia,
      });
    }
  },

  /**
   * Actualiza la contraseña del usuario autenticado.
   * @param {object} datos
   * @param {string} datos.passwordActual
   * @param {string} datos.passwordNuevo
   * @returns {Promise<object>}
   */
  async cambiarPassword(datos) {
    return apiFetch("/api/usuarios/me/password", {
      method: "PUT",
      body: JSON.stringify({
        passwordActual: datos.passwordActual,
        passwordNuevo: datos.passwordNuevo,
      }),
    });
  },
};

export default usuariosApi;
