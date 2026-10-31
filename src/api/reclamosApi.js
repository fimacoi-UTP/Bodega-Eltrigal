/**
 * ============================================================================
 * SERVICIO DE RECLAMOS API · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Endpoints bajo /api/reclamos para el Libro de Reclamaciones Virtual.
 * - crearReclamo: PÚBLICO y NO envía token.
 * - listarReclamos: ADMIN (con token JWT).
 * - obtenerReclamo: ADMIN (con token JWT).
 * - actualizarEstadoReclamo: ADMIN (con token JWT).
 *
 * Consume EXCLUSIVAMENTE los endpoints reales del backend.
 * Sin persistencia de contingencia ni datos semilla.
 * ==========================================================================*/

import { BASE_URL, apiFetch } from "./apiClient";

export const reclamosApi = {
  /**
   * Registra una nueva hoja en el Libro de Reclamaciones (PÚBLICO, SIN token).
   * @param {object} payload - Datos de identificación del consumidor y detalle del reclamo.
   * @returns {Promise<{
   *   id?: number|string,
   *   numeroCorrelativo: string,
   *   estado: string,
   *   fechaCreacion: string,
   *   fechaLimiteRespuesta: string
   * }>}
   */
  async crearReclamo(payload) {
    const url = `${BASE_URL}/api/reclamos`;

    const respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!respuesta.ok) {
      let mensaje = `Error al registrar el reclamo (${respuesta.status})`;
      try {
        const errorJson = await respuesta.json();
        mensaje =
          errorJson?.message ||
          errorJson?.mensaje ||
          errorJson?.error ||
          mensaje;
      } catch {
        // Respuesta no JSON
      }
      throw new Error(mensaje);
    }

    return await respuesta.json();
  },

  /**
   * Lista todos los reclamos con filtro opcional de estado (ADMIN, con token JWT).
   * Consume estrictamente GET /api/reclamos[?estado=ESTADO].
   * @param {string} [estado] - PENDIENTE | EN_PROCESO | RESUELTO | TODOS
   * @returns {Promise<Array<object>>}
   */
  async listarReclamos(estado) {
    const query = estado && estado !== "TODOS" ? `?estado=${encodeURIComponent(estado)}` : "";
    const data = await apiFetch(`/api/reclamos${query}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene el detalle completo de un reclamo por su ID (ADMIN, con token JWT).
   * Consume estrictamente GET /api/reclamos/{id}.
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async obtenerReclamo(id) {
    return await apiFetch(`/api/reclamos/${id}`);
  },

  /**
   * Actualiza el estado y las acciones tomadas por la empresa (ADMIN, con token JWT).
   * Consume estrictamente PATCH /api/reclamos/{id}/estado.
   * @param {number|string} id
   * @param {{ estado: string, accionesTomadas: string }} datos
   * @returns {Promise<object>}
   */
  async actualizarEstadoReclamo(id, { estado, accionesTomadas }) {
    return await apiFetch(`/api/reclamos/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado, accionesTomadas }),
    });
  },
};

export default reclamosApi;
