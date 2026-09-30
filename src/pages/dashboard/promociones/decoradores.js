/**
 * ============================================================================
 * 🪝 PATRÓN DECORATOR · Cálculo de precios con promociones
 * ============================================================================
 * 
 * Este archivo implementa el patrón Decorator para el cálculo de precios
 * con múltiples promociones. Cada promoción envuelve la entidad del producto
 * y le agrega su efecto sobre el precio final, sin saber qué otras promociones
 * existen ni perder los atributos originales del producto (id, nombre, stock, etc.).
 * 
 * ==========================================================================*/

import { TIPOS_PROMOCION } from "../../../constantes.js";

/**
 * El "componente base": inicializa la entidad Producto decorada.
 * @param {Object} producto - El producto base de catálogo
 * @returns {Object} - Entidad completa del producto enriquecida con datos de precio y descuentos
 */
const precioBase = (producto) => {
  const precioNum = Number(producto?.precio || 0);
  return {
    ...producto,
    precioOriginal: precioNum,
    precioFinal: precioNum,
    precio: precioNum,
    monto: precioNum, // Compatibilidad hacia atrás
    promocionesAplicadas: [],
    detalle: [], // Compatibilidad hacia atrás
    tieneDescuento: false,
  };
};

/**
 * Decorador: descuento por porcentaje.
 * Envuelve el producto anterior y aplica un descuento porcentual sobre el precio actual.
 */
const conPorcentaje = (prod, promocion) => {
  const descuento = prod.precioFinal * (Number(promocion.valor) / 100);
  const nuevoPrecio = Math.max(0, prod.precioFinal - descuento);
  const texto = `${promocion.nombre} (-${promocion.valor}%)`;
  return {
    ...prod,
    precioFinal: nuevoPrecio,
    precio: nuevoPrecio,
    monto: nuevoPrecio,
    promocionesAplicadas: [...prod.promocionesAplicadas, texto],
    detalle: [...prod.detalle, texto],
    tieneDescuento: true,
  };
};

/**
 * Decorador: descuento por monto fijo.
 * Envuelve el producto anterior y resta un monto fijo en Soles.
 */
const conMontoFijo = (prod, promocion) => {
  const valorDescuento = Number(promocion.valor || 0);
  const nuevoPrecio = Math.max(0, prod.precioFinal - valorDescuento);
  const texto = `${promocion.nombre} (-S/ ${valorDescuento.toFixed(2)})`;
  return {
    ...prod,
    precioFinal: nuevoPrecio,
    precio: nuevoPrecio,
    monto: nuevoPrecio,
    promocionesAplicadas: [...prod.promocionesAplicadas, texto],
    detalle: [...prod.detalle, texto],
    tieneDescuento: true,
  };
};

/**
 * Decorador: 2x1 (el segundo producto es gratis / 50% precio unitario equivalente).
 */
const conDosXUno = (prod, promocion) => {
  const nuevoPrecio = prod.precioFinal * 0.5;
  const texto = `${promocion.nombre} (2x1 - 50% descuento)`;
  return {
    ...prod,
    precioFinal: nuevoPrecio,
    precio: nuevoPrecio,
    monto: nuevoPrecio,
    promocionesAplicadas: [...prod.promocionesAplicadas, texto],
    detalle: [...prod.detalle, texto],
    tieneDescuento: true,
  };
};

/**
 * Decorador: combo (precio especial por varios productos - 20% descuento).
 */
const conCombo = (prod, promocion) => {
  const nuevoPrecio = prod.precioFinal * 0.8;
  const texto = `${promocion.nombre} (Combo - 20% descuento)`;
  return {
    ...prod,
    precioFinal: nuevoPrecio,
    precio: nuevoPrecio,
    monto: nuevoPrecio,
    promocionesAplicadas: [...prod.promocionesAplicadas, texto],
    detalle: [...prod.detalle, texto],
    tieneDescuento: true,
  };
};

/**
 * Mapa de decoradores por tipo de promoción.
 * Principio abierto/cerrado: abierto para extensión, cerrado para modificación.
 */
const DECORADORES = {
  [TIPOS_PROMOCION.PORCENTAJE]: conPorcentaje,
  [TIPOS_PROMOCION.MONTO_FIJO]: conMontoFijo,
  [TIPOS_PROMOCION.DOS_X_UNO]: conDosXUno,
  [TIPOS_PROMOCION.COMBO]: conCombo,
};

/**
 * Calcula el precio final de un producto aplicando todas las promociones
 * vigentes usando el patrón Decorator.
 * 
 * Las promociones se apilan una sobre otra usando reduce(), donde cada
 * promoción envuelve y enriquece el resultado anterior preservando todas las
 * propiedades originales del producto.
 * 
 * @param {Object} producto - El producto a calcular
 * @param {Object[]} promociones - Lista de promociones vigentes para el producto
 * @returns {Object} - Entidad producto enriquecida con { precioOriginal, precioFinal, precio, promocionesAplicadas, tieneDescuento }
 */
export function calcularPrecioFinal(producto, promociones = []) {
  if (!producto) return null;

  // Filtrar solo las promociones que tienen un decorador implementado
  const promocionesValidas = (promociones || []).filter(
    (promo) => promo && DECORADORES[promo.tipo]
  );

  // Apilar todas las promociones usando reduce()
  return promocionesValidas.reduce(
    (productoDecorado, promo) => DECORADORES[promo.tipo](productoDecorado, promo),
    precioBase(producto)
  );
}

export default calcularPrecioFinal;
