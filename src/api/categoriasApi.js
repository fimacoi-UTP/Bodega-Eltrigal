import { apiFetch } from "./apiClient";

export const categoriasApi = {
  /**
   * Resuelve una categoría por nombre creando o recuperando la existente.
   * POST /api/categorias -> { id, nombre }
   * @param {string} nombre
   * @returns {Promise<{ id: number, nombre: string }>}
   */
  async resolver(nombre) {
    const data = await apiFetch("/api/categorias", {
      method: "POST",
      body: JSON.stringify({ nombre: String(nombre).trim() }),
    });
    return {
      id: Number(data.id),
      nombre: data.nombre,
    };
  },

  /**
   * Lista todas las categorías registradas en el backend.
   * GET /api/categorias -> Array<{ id, nombre }>
   * @returns {Promise<Array<{ id: number, nombre: string }>>}
   */
  async listar() {
    const data = await apiFetch("/api/categorias");
    if (!Array.isArray(data)) return [];
    return data.map((c) => ({
      id: Number(c.id),
      nombre: c.nombre,
    }));
  },
};

export default categoriasApi;
