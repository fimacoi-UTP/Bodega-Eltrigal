/**
 * ============================================================================
 * SERVICIO DE PRODUCTOS API · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Conecta el catálogo de productos con el backend Spring Boot (/api/productos).
 * Traduce y mapea la estructura de datos del backend a la interfaz esperada
 * por los componentes y hooks de la aplicación.
 * ==========================================================================*/

import { apiFetch } from "./apiClient";
import { categoriasApi } from "./categoriasApi";
import { marcasApi } from "./marcasApi";

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
 *   activo        <- api.visibleWeb        // FRONT: activo = visible en web
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
    costo: api.costo != null ? Number(api.costo) : (api.precioCosto != null ? Number(api.precioCosto) : null),
    unidad: api.unidadMedida,
    categoria: api.categoriaNombre,
    marca: api.marcaNombre,
    color: api.color,
    imagen: api.imagen,
    activo: api.visibleWeb,
    visibleWeb: api.visibleWeb,
    categoriaId: api.categoriaId,
    marcaId: api.marcaId,
    codigoBarras: api.codigoBarras,
    creadoEn: api.creadoEn,
    actualizadoEn: api.actualizadoEn,
  };
}

/**
 * Traduce los datos de producto desde la interfaz hacia el formato que espera
 * el backend Spring Boot (/api/productos).
 *
 * @param {object} datos - Objeto producto desde el front
 * @param {{ crear?: boolean }} [opciones={}]
 * @returns {object} Payload para el backend (sin categoriaId ni marcaId)
 */
export function mapProductoHaciaApi(datos, { crear } = {}) {
  const payload = {
    nombre: datos.nombre,
    descripcion: datos.descripcion ?? null,
    precio: Number(datos.precio),
    stockMinimo: Number(datos.stockMinimo) || 0,
    unidadMedida: datos.unidad,
    visibleWeb: datos.activo !== false,
    color: datos.color ?? null,
  };

  if (crear) {
    payload.stock = Number(datos.stock) || 0;
  }
  if (datos.costo !== undefined && datos.costo !== null && datos.costo !== "") {
    payload.costo = Number(datos.costo);
  }

  if (datos.codigoBarras) {
    payload.codigoBarras = datos.codigoBarras;
  }
  if (datos.imagen !== undefined) {
    payload.imagen = datos.imagen;
  }

  return payload;
}

export const productosApi = {
  /**
   * Obtiene la lista completa de productos para gestión (incluye stock, costo, mínimo).
   * Por defecto consume GET /api/productos/gestion (para Dashboard y POS).
   * Si se especifica { publico: true } o si no hay sesión staff, obtiene GET /api/productos.
   *
   * @param {{ publico?: boolean }} [opciones={}]
   * @returns {Promise<Array<object>>}
   */
  async listar(opciones = {}) {
    if (opciones.publico) {
      return this.listarPublico();
    }

    try {
      const data = await apiFetch("/api/productos/gestion");
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map(mapProductoDesdeApi);
    } catch (err) {
      // Fallback a catálogo público si se accede sin permisos de gestión (401/403)
      const status = err?.status || err?.codigo;
      if (status === 401 || status === 403 || String(err?.message).includes("401") || String(err?.message).includes("403")) {
        return this.listarPublico();
      }
      throw err;
    }
  },

  /**
   * Obtiene la lista pública de productos (sin costo ni existencias).
   * GET /api/productos
   * @returns {Promise<Array<object>>}
   */
  async listarPublico() {
    const data = await apiFetch("/api/productos");
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map(mapProductoDesdeApi);
  },

  /**
   * Alias explícito para el catálogo completo de gestión.
   * GET /api/productos/gestion
   * @returns {Promise<Array<object>>}
   */
  async listarGestion() {
    const data = await apiFetch("/api/productos/gestion");
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map(mapProductoDesdeApi);
  },

  /**
   * Obtiene un producto específico con detalle completo de gestión.
   * Por defecto consume GET /api/productos/gestion/{id}.
   * @param {string|number} id
   * @param {{ publico?: boolean }} [opciones={}]
   * @returns {Promise<object|null>}
   */
  async obtenerPorId(id, opciones = {}) {
    if (opciones.publico) {
      return this.obtenerPublicoPorId(id);
    }

    try {
      const data = await apiFetch(`/api/productos/gestion/${id}`);
      return mapProductoDesdeApi(data);
    } catch (err) {
      const status = err?.status || err?.codigo;
      if (status === 401 || status === 403 || String(err?.message).includes("401") || String(err?.message).includes("403")) {
        return this.obtenerPublicoPorId(id);
      }
      throw err;
    }
  },

  /**
   * Obtiene el detalle público de un producto (tienda web).
   * GET /api/productos/{id}
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async obtenerPublicoPorId(id) {
    const data = await apiFetch(`/api/productos/${id}`);
    return mapProductoDesdeApi(data);
  },

  /**
   * Alias explícito para el detalle completo de gestión.
   * GET /api/productos/gestion/{id}
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async obtenerGestionPorId(id) {
    const data = await apiFetch(`/api/productos/gestion/${id}`);
    return mapProductoDesdeApi(data);
  },

  /**
   * Crea un nuevo producto en el backend, resolviendo categoría y marca por nombre.
   * POST /api/productos -> producto mapeado
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async crear(datos) {
    const categoriaId = (await categoriasApi.resolver(datos.categoria)).id;
    const marcaId = datos.marca?.trim()
      ? (await marcasApi.resolver(datos.marca.trim())).id
      : null;

    const body = {
      ...mapProductoHaciaApi(datos, { crear: true }),
      categoriaId,
      marcaId,
    };

    const resp = await apiFetch("/api/productos", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return mapProductoDesdeApi(resp);
  },

  /**
   * Actualiza un producto existente en el backend.
   * PUT /api/productos/{id} -> producto mapeado
   * @param {string|number} id
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async actualizar(id, datos) {
    const categoriaId = datos.categoria
      ? (await categoriasApi.resolver(datos.categoria)).id
      : (datos.categoriaId ?? null);
    const marcaId = datos.marca?.trim()
      ? (await marcasApi.resolver(datos.marca.trim())).id
      : null;

    const body = {
      ...mapProductoHaciaApi(datos, { crear: false }),
      categoriaId,
      marcaId,
    };

    const resp = await apiFetch(`/api/productos/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return mapProductoDesdeApi(resp);
  },

  /**
   * Elimina un producto por su id (soft-delete en el backend).
   * DELETE /api/productos/{id}
   * @param {string|number} id
   * @returns {Promise<boolean>}
   */
  async eliminar(id) {
    await apiFetch(`/api/productos/${id}`, {
      method: "DELETE",
    });
    return true;
  },
};

export default productosApi;
