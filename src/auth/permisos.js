/**
 * ============================================================================
 * PERMISOS Y ROLES · Bodega El Trigal
 * ============================================================================
 * Helper centralizado para consultar roles y capacidades en la aplicación.
 * Evita condiciones repetidas tipo `usuario?.rol === 'ADMIN'` esparcidas
 * por toda la app.
 * ==========================================================================*/

import { ROLES, ROLES_DASHBOARD } from "../constantes";

/**
 * ¿El usuario tiene rol de Administrador?
 * @param {object|null} usuario
 * @returns {boolean}
 */
export function esAdmin(usuario) {
  return usuario?.rol === ROLES.ADMIN;
}

/**
 * ¿El usuario tiene rol de Cajero?
 * @param {object|null} usuario
 * @returns {boolean}
 */
export function esCajero(usuario) {
  return usuario?.rol === ROLES.CAJERO;
}

/**
 * ¿El usuario tiene rol de Cliente?
 * @param {object|null} usuario
 * @returns {boolean}
 */
export function esCliente(usuario) {
  return usuario?.rol === ROLES.CLIENTE;
}

/**
 * ¿El usuario pertenece al personal de la tienda (Admin o Cajero)?
 * @param {object|null} usuario
 * @returns {boolean}
 */
export function esPersonal(usuario) {
  if (!usuario?.rol) return false;
  return ROLES_DASHBOARD.includes(usuario.rol);
}

/**
 * ¿Tiene permiso para crear nuevos productos en el catálogo?
 * Solo ADMIN.
 * @param {object|null} usuario
 * @returns {boolean}
 */
export function puedeCrearProducto(usuario) {
  return esAdmin(usuario);
}

/**
 * ¿Tiene permiso para editar la ficha completa del producto?
 * Solo ADMIN.
 * @param {object|null} usuario
 * @returns {boolean}
 */
export function puedeEditarProducto(usuario) {
  return esAdmin(usuario);
}

/**
 * ¿Tiene permiso para alternar la visibilidad (ocultar / mostrar) en la tienda?
 * Solo ADMIN.
 * @param {object|null} usuario
 * @returns {boolean}
 */
export function puedeAlternarVisibilidad(usuario) {
  return esAdmin(usuario);
}

/**
 * ¿Tiene permiso para eliminar productos definitivamente?
 * Solo ADMIN.
 * @param {object|null} usuario
 * @returns {boolean}
 */
export function puedeEliminarProducto(usuario) {
  return esAdmin(usuario);
}

/**
 * ¿Tiene permiso para realizar ajustes de existencias (entradas, mermas)?
 * ADMIN y CAJERO.
 * @param {object|null} usuario
 * @returns {boolean}
 */
export function puedeAjustarStock(usuario) {
  return esAdmin(usuario) || esCajero(usuario);
}
