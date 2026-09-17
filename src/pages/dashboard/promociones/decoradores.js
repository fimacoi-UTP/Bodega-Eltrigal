/**
 * ============================================================================
 * 🪝 PATRÓN DECORATOR · Cálculo de precios con promociones
 * ============================================================================
 * 
 * Este archivo implementa el patrón Decorator para el cálculo de precios
 * con múltiples promociones. Cada promoción envuelve el cálculo anterior
 * y le agrega su efecto, sin saber qué otras promociones existen.
 * 
 * El problema que resuelve: sobre un mismo producto pueden caer varias
 * promociones a la vez (10% por categoría + S/ 2 de descuento por producto).
 * Con Decorator, cada promoción envuelve el precio anterior sin que ninguna
 * sepa de la existencia de las otras.
 * 
 * 🪝 GANCHO: Este es el punto de extensión documentado en
 * src/repositories/promocionRepository.js (líneas 62-106)
 * ==========================================================================*/

import { TIPOS_PROMOCION } from "../../../constantes";

/**
 * El "componente base": el precio pelado del producto.
 * @param {Object} producto - El producto con su precio base
 * @returns {{ monto: number, detalle: string[] }} - Cálculo inicial
 */
const precioBase = (producto) => ({
  monto: producto.precio,
  detalle: [],
});

/**
 * Decorador: descuento por porcentaje.
 * Envuelve el cálculo anterior y aplica un descuento porcentual.
 * 
 * @param {{ monto: number, detalle: string[] }} calculo - Cálculo anterior
 * @param {Object} promocion - Promoción con tipo PORCENTAJE
 * @returns {{ monto: number, detalle: string[] }} - Nuevo cálculo
 */
const conPorcentaje = (calculo, promocion) => ({
  monto: calculo.monto * (1 - promocion.valor / 100),
  detalle: [...calculo.detalle, `${promocion.nombre} (-${promocion.valor}%)`],
});

/**
 * Decorador: descuento por monto fijo.
 * Envuelve el cálculo anterior y resta un monto fijo.
 * 
 * @param {{ monto: number, detalle: string[] }} calculo - Cálculo anterior
 * @param {Object} promocion - Promoción con tipo MONTO_FIJO
 * @returns {{ monto: number, detalle: string[] }} - Nuevo cálculo
 */
const conMontoFijo = (calculo, promocion) => ({
  monto: Math.max(0, calculo.monto - promocion.valor),
  detalle: [...calculo.detalle, `${promocion.nombre} (-S/ ${promocion.valor.toFixed(2)})`],
});

/**
 * Decorador: 2x1 (el segundo producto es gratis).
 * Este decorador es especial porque depende de la cantidad, pero para
 * simplificar el cálculo de precio unitario, aplicamos un 50% de descuento.
 * 
 * @param {{ monto: number, detalle: string[] }} calculo - Cálculo anterior
 * @param {Object} promocion - Promoción con tipo DOS_X_UNO
 * @returns {{ monto: number, detalle: string[] }} - Nuevo cálculo
 */
const conDosXUno = (calculo, promocion) => ({
  monto: calculo.monto * 0.5,
  detalle: [...calculo.detalle, `${promocion.nombre} (2x1 - 50% descuento)`],
});

/**
 * Decorador: combo (precio especial por varios productos).
 * Para simplificar, este decorador aplica un descuento fijo del 20%
 * sobre el cálculo anterior. En una implementación real, necesitaría
 * información sobre qué productos componen el combo.
 * 
 * @param {{ monto: number, detalle: string[] }} calculo - Cálculo anterior
 * @param {Object} promocion - Promoción con tipo COMBO
 * @returns {{ monto: number, detalle: string[] }} - Nuevo cálculo
 */
const conCombo = (calculo, promocion) => ({
  monto: calculo.monto * 0.8,
  detalle: [...calculo.detalle, `${promocion.nombre} (Combo - 20% descuento)`],
});

/**
 * Mapa de decoradores por tipo de promoción.
 * Agregar un tipo nuevo = agregar una función a este mapa.
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
 * promoción envuelve el resultado de la anterior.
 * 
 * @param {Object} producto - El producto a calcular
 * @param {Object[]} promociones - Lista de promociones vigentes para el producto
 * @returns {{ monto: number, detalle: string[] }} - Precio final y detalle de descuentos
 * 
 * @example
 * const producto = { nombre: "Arroz", precio: 10 };
 * const promociones = [
 *   { nombre: "Descuento categoría", tipo: "PORCENTAJE", valor: 10 },
 *   { nombre: "Descuento producto", tipo: "MONTO_FIJO", valor: 1 },
 * ];
 * const resultado = calcularPrecioFinal(producto, promociones);
 * // resultado.monto = 8 (10 - 10% = 9, 9 - 1 = 8)
 * // resultado.detalle = ["Descuento categoría (-10%)", "Descuento producto (-S/ 1.00)"]
 */
export function calcularPrecioFinal(producto, promociones) {
  // Filtrar solo las promociones que tienen un decorador implementado
  const promocionesValidas = promociones.filter(
    (promo) => DECORADORES[promo.tipo]
  );

  // Apilar todas las promociones usando reduce()
  // Cada promoción envuelve el cálculo anterior
  return promocionesValidas.reduce(
    (calculo, promo) => DECORADORES[promo.tipo](calculo, promo),
    precioBase(producto)
  );
}
