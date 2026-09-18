import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO } from "../../../../constantes";
import { EstadoPedidoBase } from "./estadoBase";

/**
 * ============================================================================
 * PATRÓN STATE · Estado Concreto: PENDIENTE
 * ----------------------------------------------------------------------------
 * El pedido acaba de ser creado en la tienda web con canal 'web'.
 * La bodega debe revisarlo para confirmar disponibilidad y preparación.
 * Transiciones válidas:
 *   - CONFIRMADO (la bodega acepta el pedido)
 *   - CANCELADO (el cliente o la bodega deciden cancelarlo)
 * ==========================================================================*/
export class EstadoPendiente extends EstadoPedidoBase {
  constructor() {
    super({
      nombre: ESTADOS_PEDIDO.PENDIENTE,
      etiqueta: ETIQUETAS_ESTADO_PEDIDO[ESTADOS_PEDIDO.PENDIENTE],
      icono: "⏳",
      varianteBadge: "advertencia",
      descripcion: "Tu pedido fue registrado en la tienda web y está pendiente de confirmación por el personal de la bodega.",
      pasoIndice: 1,
      esFinal: false,
    });
  }

  obtenerSiguientes() {
    return [ESTADOS_PEDIDO.CONFIRMADO, ESTADOS_PEDIDO.CANCELADO];
  }

  puedeCancelar() {
    return true;
  }
}

export const estadoPendiente = new EstadoPendiente();
