/**
 * ============================================================================
 * REGISTRO DEL PATRÓN STRATEGY (Medios de Pago)
 * ----------------------------------------------------------------------------
 * Este módulo centraliza las estrategias de pago disponibles.
 *
 * Ventajas del patrón Strategy aplicado aquí:
 * 1. Abierto para extensión, cerrado para modificación (Principio OCP):
 *    Para agregar un nuevo método de pago (ej. PagoEfectivo o Apple Pay),
 *    solo se crea un nuevo archivo de estrategia con la misma interfaz
 *    y se registra aquí. No hace falta tocar nada dentro de CheckoutPage.
 * 2. Desacoplamiento total:
 *    La pantalla de Checkout no conoce los campos internos de Yape o Tarjeta;
 *    solo delega la validación, el renderizado de campos y el procesamiento.
 * ==========================================================================*/

import { METODOS_PAGO } from "../../../../constantes";
import { estrategiaEfectivo } from "./estrategiaEfectivo";
import { estrategiaYape } from "./estrategiaYape";
import { estrategiaPlin } from "./estrategiaPlin";
import { estrategiaTarjeta } from "./estrategiaTarjeta";

export const estrategiasPago = {
  [METODOS_PAGO.YAPE]: estrategiaYape,
  [METODOS_PAGO.PLIN]: estrategiaPlin,
  [METODOS_PAGO.TARJETA]: estrategiaTarjeta,
  [METODOS_PAGO.EFECTIVO]: estrategiaEfectivo,
};

/**
 * Obtiene la estrategia correspondiente a un método de pago.
 * @param {string} metodo - Uno de los valores de METODOS_PAGO
 * @returns {typeof estrategiaYape} La estrategia concreta
 */
export function obtenerEstrategiaPago(metodo) {
  const estrategia = estrategiasPago[metodo];
  if (!estrategia) {
    throw new Error(`No se encontró una estrategia para el método de pago "${metodo}".`);
  }
  return estrategia;
}

/**
 * Retorna todas las estrategias registradas para iterar en la interfaz.
 */
export function listarEstrategiasPago() {
  return [
    estrategiasPago[METODOS_PAGO.YAPE],
    estrategiasPago[METODOS_PAGO.PLIN],
    estrategiasPago[METODOS_PAGO.TARJETA],
    estrategiasPago[METODOS_PAGO.EFECTIVO],
  ];
}

export {
  estrategiaEfectivo,
  estrategiaYape,
  estrategiaPlin,
  estrategiaTarjeta,
};
