/**
 * ============================================================================
 * RUTAS DE LA APLICACIÓN
 * ----------------------------------------------------------------------------
 * Todas las direcciones del proyecto en un solo lugar. Usen estas constantes
 * en vez de escribir los strings a mano:
 *
 *   ✅ <Link to={RUTAS.CARRITO}>
 *   ❌ <Link to="/carrito">
 *
 * Así, si mañana cambiamos "/carrito" por "/mi-carrito", se cambia aquí y
 * listo, en vez de buscar el string por todo el proyecto.
 * ==========================================================================*/

export const RUTAS = {
  /* ------------------------------ TIENDA WEB (pública) ------------------ */
  INICIO: "/",
  PRODUCTO_DETALLE: "/producto/:id",
  CARRITO: "/carrito",
  CHECKOUT: "/checkout",
  LOGIN: "/login",
  NOSOTROS: "/nosotros",
  UBICACION: "/ubicacion",

  /* ------------------------- DASHBOARD (protegido por rol) -------------- */
  DASHBOARD: "/dashboard",
  DASHBOARD_INVENTARIO: "/dashboard/inventario",
  DASHBOARD_PRODUCTOS: "/dashboard/productos",
  DASHBOARD_PROMOCIONES: "/dashboard/promociones",
  DASHBOARD_VENTAS: "/dashboard/ventas",

  /* --------------------------------- SISTEMA ---------------------------- */
  SIN_ACCESO: "/sin-acceso",
};

/**
 * Constructores para las rutas con parámetros.
 * @example <Link to={aRuta.productoDetalle(producto.id)}>
 */
export const aRuta = {
  productoDetalle: (id) => `/producto/${id}`,
  /** Catálogo filtrado por categoría. Lo usa el Navbar. */
  inicioPorCategoria: (categoria) =>
    `/?categoria=${encodeURIComponent(categoria)}`,
};
