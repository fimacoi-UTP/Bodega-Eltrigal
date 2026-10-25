/**
 * ============================================================================
 * SERVICIO DE FAVORITOS API · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Endpoints bajo /api/usuarios/me/favoritos para gestionar la lista de
 * productos favoritos del cliente autenticado.
 * ==========================================================================*/

import { apiFetch } from "./apiClient";

export const favoritosApi = {
  /**
   * Obtiene la lista de favoritos del cliente autenticado.
   * @returns {Promise<Array<object|string|number>>}
   */
  async listar() {
    const data = await apiFetch("/api/usuarios/me/favoritos");
    return Array.isArray(data) ? data : [];
  },

  /**
   * Agrega un producto a los favoritos del cliente.
   * @param {string|number} productoId
   * @returns {Promise<object>}
   */
  async agregar(productoId) {
    return apiFetch(`/api/usuarios/me/favoritos/${encodeURIComponent(productoId)}`, {
      method: "POST",
    });
  },

  /**
   * Elimina un producto de los favoritos del cliente.
   * @param {string|number} productoId
   * @returns {Promise<void>}
   */
  async quitar(productoId) {
    return apiFetch(`/api/usuarios/me/favoritos/${encodeURIComponent(productoId)}`, {
      method: "DELETE",
    });
  },
};

export default favoritosApi;
