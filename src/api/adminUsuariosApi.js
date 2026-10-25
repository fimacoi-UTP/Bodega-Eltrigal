/**
 * ============================================================================
 * API GESTIÓN DE USUARIOS (ADMIN) · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Endpoints administrativos para listar, crear, modificar, cambiar estado
 * y resetear contraseñas de usuarios. Requiere rol ADMIN (token JWT).
 * ==========================================================================*/

import { apiFetch } from "./apiClient";

export const adminUsuariosApi = {
  /**
   * Obtiene la lista completa de usuarios del sistema.
   * @returns {Promise<Array>} Lista de usuarios
   */
  listar: () => apiFetch("/api/admin/usuarios"),

  /**
   * Crea un nuevo usuario en el sistema.
   * @param {Object} datos - { nombres, apellidos, email, password, rol, telefono }
   * @returns {Promise<Object>} Usuario creado
   */
  crear: (datos) =>
    apiFetch("/api/admin/usuarios", {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  /**
   * Actualiza los datos de un usuario existente.
   * @param {number|string} id - ID del usuario
   * @param {Object} datos - { nombres, apellidos, telefono, rol }
   * @returns {Promise<Object>} Usuario actualizado
   */
  actualizar: (id, datos) =>
    apiFetch(`/api/admin/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),

  /**
   * Activa o desactiva a un usuario.
   * @param {number|string} id - ID del usuario
   * @param {boolean} activo - true para activar, false para desactivar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  cambiarEstado: (id, activo) =>
    apiFetch(`/api/admin/usuarios/${id}/estado?activo=${Boolean(activo)}`, {
      method: "PUT",
    }),

  /**
   * Restablece la contraseña de un usuario por parte del administrador.
   * @param {number|string} id - ID del usuario
   * @param {string} passwordNuevo - Nueva contraseña
   * @returns {Promise<Object>} Resultado
   */
  resetPassword: (id, passwordNuevo) =>
    apiFetch(`/api/admin/usuarios/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({
        passwordNuevo,
        password: passwordNuevo,
        nuevaPassword: passwordNuevo,
      }),
    }),

  /**
   * Elimina definitivamente a un usuario del sistema.
   * @param {number|string} id - ID del usuario
   * @returns {Promise<any>}
   */
  eliminar: (id) =>
    apiFetch(`/api/admin/usuarios/${id}`, {
      method: "DELETE",
    }),
};

export default adminUsuariosApi;
