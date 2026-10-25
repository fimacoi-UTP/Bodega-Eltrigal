/**
 * ============================================================================
 * SERVICIO DE DIRECCIONES API · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Endpoints bajo /api/usuarios/me/direcciones para la gestión de direcciones
 * de entrega del cliente autenticado.
 * ==========================================================================*/

import { apiFetch } from "./apiClient";

export const direccionesApi = {
  /**
   * Lista todas las direcciones activas del usuario autenticado.
   * @returns {Promise<Array<object>>}
   */
  async listar() {
    const data = await apiFetch("/api/usuarios/me/direcciones");
    return Array.isArray(data) ? data : [];
  },

  /**
   * Registra una nueva dirección para el usuario autenticado.
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async crear(datos) {
    return apiFetch("/api/usuarios/me/direcciones", {
      method: "POST",
      body: JSON.stringify({
        etiqueta: datos.etiqueta?.trim(),
        destinatario: datos.destinatario?.trim() || null,
        telefono: datos.telefono?.trim() || null,
        direccion: datos.direccion?.trim(),
        referencia: datos.referencia?.trim() || null,
        distrito: datos.distrito?.trim() || null,
        ciudad: datos.ciudad?.trim() || "Piura",
        predeterminada: Boolean(datos.predeterminada),
      }),
    });
  },

  /**
   * Actualiza una dirección existente.
   * @param {number|string} id
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async actualizar(id, datos) {
    return apiFetch(`/api/usuarios/me/direcciones/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        etiqueta: datos.etiqueta?.trim(),
        destinatario: datos.destinatario?.trim() || null,
        telefono: datos.telefono?.trim() || null,
        direccion: datos.direccion?.trim(),
        referencia: datos.referencia?.trim() || null,
        distrito: datos.distrito?.trim() || null,
        ciudad: datos.ciudad?.trim() || "Piura",
        predeterminada: Boolean(datos.predeterminada),
      }),
    });
  },

  /**
   * Realiza la baja lógica de una dirección.
   * @param {number|string} id
   * @returns {Promise<void>}
   */
  async eliminar(id) {
    return apiFetch(`/api/usuarios/me/direcciones/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Marca una dirección específica como predeterminada.
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async marcarPredeterminada(id) {
    return apiFetch(`/api/usuarios/me/direcciones/${id}/predeterminada`, {
      method: "PUT",
    });
  },
};

export default direccionesApi;
