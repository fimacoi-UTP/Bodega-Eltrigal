import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO } from "../../../../constantes";
import { EstadoPedidoBase } from "./estadoBase";

/**
 * ============================================================================
 * PATRÓN STATE · Estado Concreto: EN_CAMINO
 * ----------------------------------------------------------------------------
 * El pedido salió en el vehículo de reparto hacia el domicilio del cliente.
 * Regla de negocio del patrón State:
 *   - Una vez en camino, el cliente ya NO puede cancelar el pedido por la web.
 *   - La única transición válida hacia adelante es ENTREGADO.
 * ==========================================================================*/
export class EstadoEnCamino extends EstadoPedidoBase {
  constructor() {
    super({
      nombre: ESTADOS_PEDIDO.EN_CAMINO,
      etiqueta: ETIQUETAS_ESTADO_PEDIDO[ESTADOS_PEDIDO.EN_CAMINO],
      icono: "🛵",
      varianteBadge: "marca",
      descripcion: "El repartidor salió de la bodega y va en ruta hacia tu dirección de entrega en Piura.",
      pasoIndice: 3,
      esFinal: false,
    });
  }

  obtenerSiguientes() {
    return [ESTADOS_PEDIDO.ENTREGADO];
  }

  puedeCancelar() {
    return false;
  }
}

export const estadoEnCamino = new EstadoEnCamino();
