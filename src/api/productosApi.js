/**
 * ============================================================================
 * SERVICIO DE PRODUCTOS API · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Conecta el catálogo de productos con el backend Spring Boot (/api/productos).
 * Traduce y mapea la estructura de datos del backend a la interfaz esperada
 * por los componentes y hooks de la aplicación.
 * ==========================================================================*/

import { apiFetch } from "./apiClient";

/**
 * Traduce la respuesta de un producto desde el backend a la estructura que
 * consumen los componentes de la interfaz.
 *
 * Mapeo exacto:
 *   id            <- api.id
 *   nombre        <- api.nombre
 *   descripcion   <- api.descripcion
 *   precio        <- api.precio
 *   stock         <- api.stock
 *   stockMinimo   <- api.stockMinimo
 *   unidad        <- api.unidadMedida      // RENOMBRAR
 *   categoria     <- api.categoriaNombre   // APLANAR a string
 *   marca         <- api.marcaNombre       // APLANAR a string
 *   color         <- api.color
 *   imagen        <- api.imagen
 *   activo        <- api.activo
 *   visibleWeb    <- api.visibleWeb
 *   categoriaId   <- api.categoriaId
 *   marcaId       <- api.marcaId
 *   codigoBarras  <- api.codigoBarras
 *
 * @param {object} api - Objeto producto retornado por el backend
 * @returns {object|null} Producto formateado para el frontend
 */
export function mapProductoDesdeApi(api) {
  if (!api) return null;

  return {
    id: String(api.id),
    nombre: api.nombre,
    descripcion: api.descripcion,
    precio: api.precio,
    stock: api.stock,
    stockMinimo: api.stockMinimo,
    unidad: api.unidadMedida,
    categoria: api.categoriaNombre,
    marca: api.marcaNombre,
    color: api.color,
    imagen: api.imagen,
    activo: api.activo,
    visibleWeb: api.visibleWeb,
    categoriaId: api.categoriaId,
    marcaId: api.marcaId,
    codigoBarras: api.codigoBarras,
    creadoEn: api.creadoEn,
    actualizadoEn: api.actualizadoEn,
  };
}

export const productosApi = {
  /**
   * Obtiene la lista completa de productos desde el backend.
   * GET /api/productos -> array de productos ya mapeados
   * @returns {Promise<Array<object>>}
   */
  async listar() {
    const data = await apiFetch("/api/productos");
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map(mapProductoDesdeApi);
  },

  /**
   * Obtiene un producto específico por su identificador.
   * GET /api/productos/{id} -> producto mapeado
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async obtenerPorId(id) {
    const data = await apiFetch(`/api/productos/${id}`);
    return mapProductoDesdeApi(data);
  },
};

export default productosApi;
