/**
 * ============================================================================
 * REPOSITORIO DE PROMOCIONES
 * ----------------------------------------------------------------------------
 * Conecta las promociones y descuentos con el backend Spring Boot vía
 * promocionesApi.
 * ==========================================================================*/

import { promocionesApi } from "../api/promocionesApi";

export const promocionRepository = {
  /**
   * Obtiene todas las promociones registradas en el backend.
   */
  async obtenerTodos() {
    return promocionesApi.listar();
  },

  /** Alias para obtenerTodos() */
  async listar() {
    return promocionesApi.listar();
  },

  /**
   * Promociones activas y vigentes por fecha en este momento.
   */
  async obtenerVigentes() {
    return promocionesApi.obtenerVigentes();
  },

  /**
   * Registra una nueva promoción en el backend.
   */
  async crear(datos) {
    return promocionesApi.crear(datos);
  },

  /**
   * Actualiza una promoción existente en el backend.
   */
  async actualizar(id, datos) {
    return promocionesApi.actualizar(id, datos);
  },

  /**
   * Elimina una promoción por su identificador.
   */
  async eliminar(id) {
    return promocionesApi.eliminar(id);
  },

  /**
   * Promociones vigentes que afectan a un producto concreto:
   * promo.aplicaTodos, O producto.id ∈ promo.productoIds, O producto.categoriaId ∈ promo.categoriaIds.
   */
  async obtenerParaProducto(producto) {
    if (!producto) return [];
    const vigentes = await this.obtenerVigentes();

    const prodId = String(producto.id);
    const catId = producto.categoriaId != null ? Number(producto.categoriaId) : null;

    return vigentes.filter((promo) => {
      if (promo.activa === false) return false;
      return (
        Boolean(promo.aplicaTodos) ||
        (Array.isArray(promo.productoIds) && promo.productoIds.map(String).includes(prodId)) ||
        (catId != null && Array.isArray(promo.categoriaIds) && promo.categoriaIds.map(Number).includes(catId))
      );
    });
  },
};

export default promocionRepository;
