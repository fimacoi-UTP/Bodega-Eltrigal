/**
 * ============================================================================
 * REPOSITORIO DE PROMOCIONES
 * ----------------------------------------------------------------------------
 * Descuentos y ofertas que el ADMIN crea desde el dashboard y que la tienda
 * web aplica en el catálogo y en el checkout.
 *
 * Forma sugerida de una promoción (el módulo puede ampliarla):
 * {
 *   id, nombre, descripcion, tipo,
 *   valor,                 // 15 (%) o 5.00 (soles), según el tipo
 *   aplicaA,               // 'PRODUCTO' | 'CATEGORIA' | 'TODO'
 *   objetivo,              // id del producto o nombre de la categoría
 *   desde, hasta,          // fechas ISO de vigencia
 *   activa                 // boolean
 * }
 * ==========================================================================*/

import { crearRepositorioBase } from "./repositorioBase";
import { CLAVES } from "./claves";

const base = crearRepositorioBase({
  clave: CLAVES.PROMOCIONES,
  prefijoId: "promo",
  nombre: "promociones",
});

export const promocionRepository = {
  ...base,

  /**
   * Promociones activas y dentro de su rango de fechas EN ESTE MOMENTO.
   * Es la que debe usar la tienda web: que una promo esté marcada como activa
   * no significa que ya haya empezado o que no haya vencido.
   */
  async obtenerVigentes() {
    const ahora = Date.now();

    return base.obtenerDonde((promocion) => {
      if (promocion.activa === false) return false;

      const inicio = promocion.desde ? new Date(promocion.desde).getTime() : -Infinity;
      const fin = promocion.hasta ? new Date(promocion.hasta).getTime() : Infinity;

      return ahora >= inicio && ahora <= fin;
    });
  },

  /** Promociones vigentes que afectan a un producto concreto. */
  async obtenerParaProducto(producto) {
    const vigentes = await this.obtenerVigentes();

    return vigentes.filter((promocion) => {
      if (promocion.aplicaA === "TODO") return true;
      if (promocion.aplicaA === "PRODUCTO") return promocion.objetivo === producto.id;
      if (promocion.aplicaA === "CATEGORIA") return promocion.objetivo === producto.categoria;
      return false;
    });
  },

  /* ==========================================================================
   * 🪝 GANCHO — PATRÓN DECORATOR (rama: promociones)
   * --------------------------------------------------------------------------
   * Este es EL punto de extensión del módulo de promociones.
   *
   * El problema real: sobre un mismo producto pueden caer varias promos a la
   * vez (10% por categoría + S/ 2 de descuento por producto + 5% por ser
   * cliente frecuente). Si eso se resuelve con `if`s dentro del cálculo del
   * precio, cada promo nueva obliga a abrir y modificar esa función, y se
   * vuelve inmantenible.
   *
   * Con Decorator, cada promoción ENVUELVE al precio anterior y le agrega su
   * efecto, sin que ninguna sepa de la existencia de las otras:
   *
   *   // src/pages/dashboard/promociones/decoradores.js
   *
   *   // El "componente base": el precio pelado del producto.
   *   const precioBase = (producto) => ({
   *     monto: producto.precio,
   *     detalle: [],
   *   })
   *
   *   // Un decorador: recibe el cálculo anterior y devuelve uno nuevo.
   *   const conPorcentaje = (calculo, promocion) => ({
   *     monto: calculo.monto * (1 - promocion.valor / 100),
   *     detalle: [...calculo.detalle, `${promocion.nombre} (-${promocion.valor}%)`],
   *   })
   *
   *   const conMontoFijo = (calculo, promocion) => ({
   *     monto: Math.max(0, calculo.monto - promocion.valor),
   *     detalle: [...calculo.detalle, `${promocion.nombre} (-S/ ${promocion.valor})`],
   *   })
   *
   *   // Y se apilan todas las promos vigentes, una sobre otra:
   *   export function calcularPrecioFinal(producto, promociones) {
   *     return promociones.reduce(
   *       (calculo, promo) => DECORADORES[promo.tipo](calculo, promo),
   *       precioBase(producto),
   *     )
   *   }
   *
   * Agregar un tipo de promoción nuevo = agregar una función al mapa
   * DECORADORES. Cero cambios en el código existente (principio abierto/cerrado).
   *
   * NO lo implementen aquí: esto es la base. Va en el módulo de promociones.
   * ========================================================================*/
};
