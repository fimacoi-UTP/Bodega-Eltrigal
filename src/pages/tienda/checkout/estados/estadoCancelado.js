import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO } from "../../../../constantes";
import { EstadoPedidoBase } from "./estadoBase";

/**
 * ============================================================================
 * PATRÓN STATE · Estado Concreto: CANCELADO
 * ----------------------------------------------------------------------------
 * Estado terminal de cancelación.
 * Regla de negocio crucial (ver gancho en pedidoRepository.js):
 *   - Al pasar a CANCELADO, el stock reservado debe ser DEVUELTO al inventario
 *     de la bodega para que otros clientes puedan adquirir los productos.
 *   - Delega la reposición en `contexto.reponerStock(items)`.
 * ==========================================================================*/
export class EstadoCancelado extends EstadoPedidoBase {
  constructor() {
    super({
      nombre: ESTADOS_PEDIDO.CANCELADO,
      etiqueta: ETIQUETAS_ESTADO_PEDIDO[ESTADOS_PEDIDO.CANCELADO],
      icono: "❌",
      varianteBadge: "peligro",
      descripcion: "Este pedido fue cancelado. Las unidades de los productos fueron devueltas al inventario general.",
      pasoIndice: -1,
      esFinal: true,
    });
  }

  obtenerSiguientes() {
    return [];
  }

  puedeCancelar() {
    return false;
  }

  /**
   * Hook de transición: devuelve el stock de los items al inventario
   */
  async alTransicionar(pedido, _nuevoEstado, contexto) {
    if (contexto?.reponerStock && Array.isArray(pedido?.items)) {
      const itemsParaReponer = pedido.items.map((it) => ({
        productoId: it.productoId,
        cantidad: it.cantidad,
      }));
      await contexto.reponerStock(itemsParaReponer);
    }
  }
}

export const estadoCancelado = new EstadoCancelado();
