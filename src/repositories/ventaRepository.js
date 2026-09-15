/**
 * ============================================================================
 * REPOSITORIO DE VENTAS (mostrador / tienda física)
 * ----------------------------------------------------------------------------
 * Registra lo que el CAJERO vende presencialmente en la bodega.
 * Su hermano es `pedidoRepository`, que guarda las compras hechas por la web.
 *
 * ¿Por qué separarlos si ambos son "ventas"?
 * Porque tienen datos distintos: un pedido web necesita cliente, dirección,
 * tipo de entrega y estado de envío; una venta de mostrador necesita quién
 * cobró, con qué pagó y cuánto vuelto se dio. Meterlos en una sola tabla
 * llenaría de campos vacíos a los dos.
 * Lo que sí comparten es el STOCK, y eso vive en productoRepository.
 *
 * Forma de una venta:
 * {
 *   id, fecha (ISO), cajeroId, cajeroNombre,
 *   items: [{ productoId, nombre, cantidad, precioUnitario, subtotal }],
 *   total, metodoPago, montoRecibido, vuelto, anulada
 * }
 * ==========================================================================*/

import { crearRepositorioBase } from "./repositorioBase";
import { CLAVES } from "./claves";

const base = crearRepositorioBase({
  clave: CLAVES.VENTAS,
  prefijoId: "vta",
  nombre: "ventas",
});

export const ventaRepository = {
  ...base,

  /**
   * Ventas de un cajero.
   * Sirve para el cierre de caja por turno.
   */
  async obtenerPorCajero(cajeroId) {
    return base.obtenerDonde((venta) => venta.cajeroId === cajeroId);
  },

  /**
   * Ventas dentro de un rango de fechas.
   * @param {string|Date} desde
   * @param {string|Date} hasta
   */
  async obtenerPorRango(desde, hasta) {
    const inicio = new Date(desde).getTime();
    const fin = new Date(hasta).getTime();

    return base.obtenerDonde((venta) => {
      const momento = new Date(venta.fecha).getTime();
      return momento >= inicio && momento <= fin;
    });
  },

  /** Ventas de hoy. Atajo cómodo para el panel de estadísticas. */
  async obtenerDeHoy() {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);
    return this.obtenerPorRango(inicio, fin);
  },

  /**
   * Marca una venta como anulada (NO la borra).
   * En un negocio real las ventas no se eliminan: se anulan, para que quede
   * el rastro. Quien implemente el módulo de ventas debe acordarse de
   * devolver el stock con `productoRepository.reponerStock(venta.items)`.
   */
  async anular(id, motivo = "") {
    return base.actualizar(id, {
      anulada: true,
      motivoAnulacion: motivo,
      anuladaEn: new Date().toISOString(),
    });
  },

  /* ==========================================================================
   * 🪝 GANCHO PARA EL MÓDULO DE VENTAS (rama: ventas)
   * --------------------------------------------------------------------------
   * Quien tome este módulo debe armar el flujo completo de una venta:
   *
   *   1. Construir los items con producto, cantidad y precio.
   *   2. Descontar stock:  await inventario.descontarStock(items)
   *      ← ESTE PASO ES LA REGLA DE ORO. Sin él, la web seguiría vendiendo
   *        productos que ya no existen en el almacén.
   *   3. Registrar la venta: await ventaRepository.crear({ ... })
   *   4. Mostrar el comprobante / ticket.
   *
   * Ojo con el orden: descuenten el stock ANTES de registrar la venta. Si el
   * stock falla (no alcanza), la venta no debe quedar guardada.
   * ========================================================================*/
};
