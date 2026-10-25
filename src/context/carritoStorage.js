/**
 * ============================================================================
 * UTILIDADES DE ALMACENAMIENTO DEL CARRITO · Bodega El Trigal
 * ============================================================================
 * Centraliza la persistencia, lectura y limpieza del carrito en localStorage
 * con protección completa try/catch para evitar excepciones si el almacenamiento
 * no está disponible o las cuotas son excedidas.
 * ==========================================================================*/

export const CLAVES_CARRITO = [
  "trigal:carrito",
  "carrito",
  "cart",
  "trigal:carrito_usuario",
  "trigal:carrito_dueno",
  "carrito_dueno",
  "cart_user",
];

export const CLAVE_CARRITO_ITEMS = "trigal:carrito";
export const CLAVE_CARRITO_DUENO = "trigal:carrito_dueno";
export const EVENTO_LIMPIAR_CARRITO = "trigal:limpiar-carrito";

/**
 * Lee los items guardados del carrito desde localStorage de forma segura.
 * @returns {Array} lista de items o array vacío si no existe o falla.
 */
export function leerCarritoStorage() {
  try {
    for (const clave of ["trigal:carrito", "carrito", "cart"]) {
      const crudo = localStorage.getItem(clave);
      if (crudo) {
        const items = JSON.parse(crudo);
        if (Array.isArray(items)) {
          return items;
        }
      }
    }
  } catch (error) {
    console.warn("[El Trigal] Error al leer el carrito de localStorage:", error);
  }
  return [];
}

/**
 * Guarda los items del carrito en localStorage de forma segura.
 * @param {Array} items
 * @param {string|number|null} [duenoId=null]
 */
export function guardarCarritoStorage(items, duenoId = null) {
  try {
    if (!Array.isArray(items) || items.length === 0) {
      localStorage.removeItem(CLAVE_CARRITO_ITEMS);
      localStorage.removeItem("carrito");
      localStorage.removeItem("cart");
      return;
    }

    const serializado = JSON.stringify(items);
    localStorage.setItem(CLAVE_CARRITO_ITEMS, serializado);

    if (duenoId != null) {
      localStorage.setItem(CLAVE_CARRITO_DUENO, String(duenoId));
    }
  } catch (error) {
    console.warn("[El Trigal] Error al guardar el carrito en localStorage:", error);
  }
}

/**
 * Obtiene el identificador del dueño del carrito guardado en localStorage.
 * @returns {string|null} ID del usuario dueño o null si no existe.
 */
export function obtenerDuenoCarritoStorage() {
  try {
    return (
      localStorage.getItem(CLAVE_CARRITO_DUENO) ||
      localStorage.getItem("trigal:carrito_usuario") ||
      localStorage.getItem("carrito_dueno") ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Guarda el dueño actual del carrito en localStorage.
 * @param {string|number|null} duenoId
 */
export function guardarDuenoCarritoStorage(duenoId) {
  try {
    if (duenoId == null) {
      localStorage.removeItem(CLAVE_CARRITO_DUENO);
      localStorage.removeItem("trigal:carrito_usuario");
      localStorage.removeItem("carrito_dueno");
    } else {
      localStorage.setItem(CLAVE_CARRITO_DUENO, String(duenoId));
    }
  } catch (error) {
    console.warn("[El Trigal] Error al guardar dueño del carrito en localStorage:", error);
  }
}

/**
 * Elimina todas las claves asociadas al carrito de localStorage y emite el
 * evento para que los providers en memoria reseteen su estado.
 */
export function limpiarCarritoStorage() {
  try {
    for (const clave of CLAVES_CARRITO) {
      localStorage.removeItem(clave);
    }
  } catch (error) {
    console.warn("[El Trigal] Error al limpiar carrito de localStorage:", error);
  }

  // Notificar a CarritoProvider para resetear su estado en memoria
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(EVENTO_LIMPIAR_CARRITO));
    } catch {
      /* noop */
    }
  }
}
