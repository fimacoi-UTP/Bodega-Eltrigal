/**
 * ============================================================================
 * REPOSITORIO DE PEDIDOS (compras hechas por la tienda web)
 * ----------------------------------------------------------------------------
 * Guarda lo que el CLIENTE compra online, con su tipo de entrega (recojo en
 * tienda o delivery) y el estado en el que va el pedido.
 *
 * Forma de un pedido:
 * {
 *   id, fecha (ISO), clienteId, clienteNombre,
 *   items: [{ productoId, nombre, cantidad, precioUnitario, subtotal }],
 *   subtotal, costoEnvio, total,
 *   tipoEntrega (ver TIPOS_ENTREGA), direccionEntrega,
 *   metodoPago (ver METODOS_PAGO),
 *   estado (ver ESTADOS_PEDIDO), historialEstados: [{ estado, fecha }]
 * }
 * ==========================================================================*/

import { crearRepositorioBase } from "./repositorioBase";
import { CLAVES } from "./claves";
import { ESTADOS_PEDIDO } from "../constantes";

const base = crearRepositorioBase({
  clave: CLAVES.PEDIDOS,
  prefijoId: "ped",
  nombre: "pedidos",
});

export const pedidoRepository = {
  ...base,

  /**
   * Crea un pedido. Si no se indica estado, nace como PENDIENTE y se le abre
   * su historial de estados.
   */
  async crear(datos) {
    const ahora = new Date().toISOString();
    const estadoInicial = datos.estado ?? ESTADOS_PEDIDO.PENDIENTE;

    return base.crear({
      ...datos,
      fecha: datos.fecha ?? ahora,
      estado: estadoInicial,
      historialEstados: [{ estado: estadoInicial, fecha: ahora }],
    });
  },

  /** Pedidos de un cliente, para su sección "Mis pedidos". */
  async obtenerPorCliente(clienteId) {
    return base.obtenerDonde((pedido) => pedido.clienteId === clienteId);
  },

  /** Pedidos en un estado dado. El dashboard los usa para la bandeja. */
  async obtenerPorEstado(estado) {
    return base.obtenerDonde((pedido) => pedido.estado === estado);
  },

  /** Pedidos que aún requieren atención del personal. */
  async obtenerActivos() {
    const cerrados = [ESTADOS_PEDIDO.ENTREGADO, ESTADOS_PEDIDO.CANCELADO];
    return base.obtenerDonde((pedido) => !cerrados.includes(pedido.estado));
  },

  /**
   * Cambia el estado de un pedido y lo anota en su historial.
   *
   * ⚠️ OJO: hoy este método acepta CUALQUIER cambio de estado. Deja pasar
   * cosas absurdas como ENTREGADO → PENDIENTE. Eso es justamente lo que el
   * patrón State viene a arreglar (ver el gancho de abajo).
   *
   * @param {string} id
   * @param {string} nuevoEstado - uno de ESTADOS_PEDIDO
   */
  async cambiarEstado(id, nuevoEstado) {
    const pedido = await base.obtenerPorId(id);
    if (!pedido) {
      throw new Error(`No existe el pedido "${id}".`);
    }

    if (!Object.values(ESTADOS_PEDIDO).includes(nuevoEstado)) {
      throw new Error(`"${nuevoEstado}" no es un estado de pedido válido.`);
    }

    const historial = [
      ...(pedido.historialEstados ?? []),
      { estado: nuevoEstado, fecha: new Date().toISOString() },
    ];

    return base.actualizar(id, { estado: nuevoEstado, historialEstados: historial });
  },

  /* ==========================================================================
   * 🪝 GANCHO — PATRÓN STATE (rama: pedidos / seguimiento)
   * --------------------------------------------------------------------------
   * Quien tome este módulo debe reemplazar el `cambiarEstado` permisivo de
   * arriba por una máquina de estados donde CADA estado sepa a cuáles puede
   * pasar y qué se permite hacer en él.
   *
   * Idea (NO implementar aquí, va en el módulo):
   *
   *   // src/pages/dashboard/pedidos/estados/estadoPendiente.js
   *   export const estadoPendiente = {
   *     nombre: ESTADOS_PEDIDO.PENDIENTE,
   *     siguientesPermitidos: [CONFIRMADO, CANCELADO],
   *     puedeCancelarCliente: true,
   *     alEntrar(pedido) { /* notificar a la bodega * / },
   *   }
   *
   *   // y el repositorio pasa a preguntar antes de permitir el cambio:
   *   if (!estados[pedido.estado].siguientesPermitidos.includes(nuevoEstado)) {
   *     throw new Error(`No se puede pasar de ${pedido.estado} a ${nuevoEstado}`)
   *   }
   *
   * Transiciones válidas del negocio:
   *   PENDIENTE  → CONFIRMADO | CANCELADO
   *   CONFIRMADO → EN_CAMINO (si es delivery) | ENTREGADO (si es recojo) | CANCELADO
   *   EN_CAMINO  → ENTREGADO
   *   ENTREGADO  → (final, no se mueve más)
   *   CANCELADO  → (final; al cancelar hay que devolver el stock con
   *                 productoRepository.reponerStock(pedido.items))
   * ========================================================================*/

  /* ==========================================================================
   * 🪝 GANCHO PARA EL MÓDULO DE CHECKOUT (rama: checkout)
   * --------------------------------------------------------------------------
   * El flujo de compra web termina así:
   *   1. Elegir entrega (TIPOS_ENTREGA) y calcular costoEnvio.
   *   2. Cobrar con la estrategia de pago elegida (ver METODOS_PAGO en
   *      src/constantes.js → patrón Strategy).
   *   3. Descontar stock:  await inventario.descontarStock(items)  ← regla de oro
   *   4. Crear el pedido:  await pedidoRepository.crear({ ... })
   *   5. Vaciar el carrito y mostrar la confirmación.
   * ========================================================================*/
};
