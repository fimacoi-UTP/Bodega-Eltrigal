import { apiFetch } from "./apiClient";

export const marcasApi = {
  /**
   * Resuelve una marca por nombre creando o recuperando la existente.
   * POST /api/marcas -> { id, nombre }
   * @param {string} nombre
   * @returns {Promise<{ id: number, nombre: string }>}
   */
  async resolver(nombre) {
    const data = await apiFetch("/api/marcas", {
      method: "POST",
      body: JSON.stringify({ nombre: String(nombre).trim() }),
    });
    return {
      id: Number(data.id),
      nombre: data.nombre,
    };
  },

  /**
   * Lista todas las marcas registradas en el backend.
   * GET /api/marcas -> Array<{ id, nombre }>
   * @returns {Promise<Array<{ id: number, nombre: string }>>}
   */
  async listar() {
    const data = await apiFetch("/api/marcas");
    if (!Array.isArray(data)) return [];
    return data.map((m) => ({
      id: Number(m.id),
      nombre: m.nombre,
    }));
  },
};

export default marcasApi;
