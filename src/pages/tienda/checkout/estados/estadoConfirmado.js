import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO, TIPOS_ENTREGA } from "../../../../constantes";
import { EstadoPedidoBase } from "./estadoBase";

/**
 * ============================================================================
 * PATRÓN STATE · Estado Concreto: CONFIRMADO
 * ----------------------------------------------------------------------------
 * La bodega ya validó y empaquetó los productos.
 * Según el tipo de entrega:
 *   - Si es DELIVERY: la siguiente etapa lógica es EN_CAMINO (el motorizado parte).
 *   - Si es RECOJO_TIENDA: pasa directo a ENTREGADO cuando el cliente se acerca a caja.
 * Permite cancelación en caso extraordinario antes de la salida.
 * ==========================================================================*/
export class EstadoConfirmado extends EstadoPedidoBase {
  constructor() {
    super({
      nombre: ESTADOS_PEDIDO.CONFIRMADO,
      etiqueta: ETIQUETAS_ESTADO_PEDIDO[ESTADOS_PEDIDO.CONFIRMADO],
      icono: "📋",
      varianteBadge: "info",
      descripcion: "Tu pedido fue verificado y empaquetado por nuestro equipo en la bodega.",
      pasoIndice: 2,
      esFinal: false,
    });
  }

  obtenerSiguientes(pedido) {
    const esRecojo = pedido?.tipoEntrega === TIPOS_ENTREGA.RECOJO_TIENDA;
    if (esRecojo) {
      return [ESTADOS_PEDIDO.ENTREGADO, ESTADOS_PEDIDO.CANCELADO];
    }
    return [ESTADOS_PEDIDO.EN_CAMINO, ESTADOS_PEDIDO.CANCELADO];
  }

  puedeCancelar() {
    return true;
  }
}

export const estadoConfirmado = new EstadoConfirmado();
