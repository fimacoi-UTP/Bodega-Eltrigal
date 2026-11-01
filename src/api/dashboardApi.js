import { apiFetch } from "./apiClient";

/**
 * ============================================================================
 * API DASHBOARD · Bodega El Trigal
 * ============================================================================
 * Métricas, KPIs en tiempo real y series cronológicas para gráficos.
 * Base path en backend: /api/dashboard
 * ==========================================================================*/
export const dashboardApi = {
  /**
   * Obtiene los KPIs clave de negocio (ventas de hoy, mes, ticket promedio, pedidos por estado, stock bajo).
   * GET /api/dashboard/kpis
   */
  async obtenerKpis() {
    return apiFetch("/api/dashboard/kpis");
  },

  /**
   * Obtiene la serie temporal de ventas por día para gráficos de línea o barras.
   * GET /api/dashboard/ventas-por-dia?dias={dias}
   * @param {number} dias - 7 o 30
   */
  async obtenerVentasPorDia(dias = 7) {
    return apiFetch(`/api/dashboard/ventas-por-dia?dias=${dias}`);
  },

  /**
   * Obtiene el total de ventas agrupado por categoría para gráfico de dona/circular.
   * GET /api/dashboard/ventas-por-categoria
   */
  async obtenerVentasPorCategoria() {
    return apiFetch("/api/dashboard/ventas-por-categoria");
  },

  /**
   * Obtiene el ranking de productos más vendidos para gráfico de barras horizontales.
   * GET /api/dashboard/top-productos?limit={limit}
   * @param {number} limit - por defecto 5
   */
  async obtenerTopProductos(limit = 5) {
    return apiFetch(`/api/dashboard/top-productos?limit=${limit}`);
  },

  /**
   * Obtiene el total de ventas agrupado por método de pago.
   * GET /api/dashboard/ventas-por-metodo-pago
   */
  async obtenerVentasPorMetodoPago() {
    return apiFetch("/api/dashboard/ventas-por-metodo-pago");
  },
};

export default dashboardApi;

