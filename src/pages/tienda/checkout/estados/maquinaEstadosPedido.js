/**
 * ============================================================================
 * MÁQUINA DE ESTADOS · Orquestador del Patrón State
 * ----------------------------------------------------------------------------
 * Centraliza la consulta de estados y la ejecución segura de transiciones.
 *
 * En vez de permitir cualquier cambio de estado arbitrario, este gestor:
 * 1. Recupera el objeto de estado actual.
 * 2. Le pregunta si la transición solicitada es válida según el negocio
 *    (ej. PENDIENTE -> CONFIRMADO -> EN_CAMINO/ENTREGADO -> ENTREGADO).
 * 3. Ejecuta acciones secundarias (como reponer stock con inventario.reponerStock
 *    al cancelar).
 * 4. Llama a pedidoRepository.cambiarEstado(id, nuevoEstado).
 * ==========================================================================*/

import { ESTADOS_PEDIDO } from "../../../../constantes";
import { pedidoRepository } from "../../../../repositories";
import { estadoPendiente } from "./estadoPendiente";
import { estadoConfirmado } from "./estadoConfirmado";
import { estadoEnCamino } from "./estadoEnCamino";
import { estadoEntregado } from "./estadoEntregado";
import { estadoCancelado } from "./estadoCancelado";

export const mapaEstadosPedido = {
  [ESTADOS_PEDIDO.PENDIENTE]: estadoPendiente,
  [ESTADOS_PEDIDO.CONFIRMADO]: estadoConfirmado,
  [ESTADOS_PEDIDO.EN_CAMINO]: estadoEnCamino,
  [ESTADOS_PEDIDO.ENTREGADO]: estadoEntregado,
  [ESTADOS_PEDIDO.CANCELADO]: estadoCancelado,
};

/**
 * Obtiene el objeto de estado correspondiente al string de ESTADOS_PEDIDO.
 * @param {string} nombreEstado
 * @returns {import('./estadoBase').EstadoPedidoBase}
 */
export function obtenerEstadoPedido(nombreEstado) {
  const estado = mapaEstadosPedido[nombreEstado];
  if (!estado) {
    throw new Error(`Estado de pedido desconocido: "${nombreEstado}".`);
  }
  return estado;
}

/**
 * Ejecuta una transición de estado validada por el patrón State.
 *
 * @param {Object} pedido - Objeto completo del pedido
 * @param {string} nuevoEstado - Uno de ESTADOS_PEDIDO
 * @param {Object} [contexto] - Callbacks de contexto (ej. reponerStock de useInventario)
 * @returns {Promise<Object>} El pedido actualizado desde el repositorio
 */
export async function transicionarEstadoPedido(pedido, nuevoEstado, contexto = {}) {
  if (!pedido || !pedido.id) {
    throw new Error("Se requiere un pedido válido para realizar la transición.");
  }

  const estadoActual = obtenerEstadoPedido(pedido.estado);
  const estadoDestino = obtenerEstadoPedido(nuevoEstado);

  // 1. Delegar en el estado actual la validación de la transición
  if (!estadoActual.puedeTransicionarA(pedido, nuevoEstado)) {
    throw new Error(
      `Transición inválida: No es posible pasar de "${estadoActual.etiqueta}" a "${estadoDestino.etiqueta}".`
    );
  }

  // 2. Ejecutar efectos secundarios del estado destino (p. ej. reponer stock si es CANCELADO)
  await estadoDestino.alTransicionar(pedido, nuevoEstado, contexto);

  // 3. Persistir el cambio de estado en la capa Repository
  const pedidoActualizado = await pedidoRepository.cambiarEstado(pedido.id, nuevoEstado);

  return pedidoActualizado;
}
