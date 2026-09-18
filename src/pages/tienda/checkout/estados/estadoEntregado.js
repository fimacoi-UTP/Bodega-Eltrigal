import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO } from "../../../../constantes";
import { EstadoPedidoBase } from "./estadoBase";

/**
 * ============================================================================
 * PATRÓN STATE · Estado Concreto: ENTREGADO
 * ----------------------------------------------------------------------------
 * El cliente recibió sus productos a satisfacción (o retiró en tienda).
 * Es un estado TERMINAL: no permite más transiciones ni cancelaciones.
 * ==========================================================================*/
export class EstadoEntregado extends EstadoPedidoBase {
  constructor() {
    super({
      nombre: ESTADOS_PEDIDO.ENTREGADO,
      etiqueta: ETIQUETAS_ESTADO_PEDIDO[ESTADOS_PEDIDO.ENTREGADO],
      icono: "✅",
      varianteBadge: "exito",
      descripcion: "¡Tu pedido fue entregado con total satisfacción! Muchas gracias por tu preferencia en Bodega El Trigal.",
      pasoIndice: 4,
      esFinal: true,
    });
  }

  obtenerSiguientes() {
    return [];
  }

  puedeCancelar() {
    return false;
  }
}

export const estadoEntregado = new EstadoEntregado();
