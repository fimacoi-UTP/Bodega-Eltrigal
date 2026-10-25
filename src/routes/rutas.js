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
  SEGUIMIENTO: "/seguimiento/:codigo",
  LOGIN: "/login",
  REGISTRO: "/registro",
  NOSOTROS: "/nosotros",
  UBICACION: "/ubicacion",

  /* ------------------------- MI CUENTA (cliente autenticado) ------------- */
  MI_CUENTA: "/mi-cuenta",
  MI_CUENTA_PEDIDOS: "/mi-cuenta/pedidos",
  MI_CUENTA_PROMOCIONES: "/mi-cuenta/promociones",
  MI_CUENTA_DIRECCIONES: "/mi-cuenta/direcciones",
  MI_CUENTA_DESPENSA: "/mi-cuenta/despensa",
  MI_CUENTA_PERFIL: "/mi-cuenta/perfil",

  /* ------------------------- DASHBOARD (protegido por rol) -------------- */
  DASHBOARD: "/dashboard",
  DASHBOARD_CATALOGO: "/dashboard/catalogo",
  DASHBOARD_PEDIDOS: "/dashboard/pedidos",
  DASHBOARD_INVENTARIO: "/dashboard/inventario",
  DASHBOARD_PRODUCTOS: "/dashboard/productos",
  DASHBOARD_PROMOCIONES: "/dashboard/promociones",
  DASHBOARD_VENTAS: "/dashboard/ventas",
  DASHBOARD_USUARIOS: "/dashboard/usuarios",

  /* --------------------------------- SISTEMA ---------------------------- */
  SIN_ACCESO: "/sin-acceso",
};

/**
 * Constructores para las rutas con parámetros.
 * @example <Link to={aRuta.productoDetalle(producto.id)}>
 */
export const aRuta = {
  productoDetalle: (id) => `/producto/${id}`,
  seguimiento: (codigo) => `/seguimiento/${codigo}`,
  /** Catálogo filtrado por categoría. Lo usa el Navbar. */
  inicioPorCategoria: (categoria) =>
    `/?categoria=${encodeURIComponent(categoria)}`,
};
