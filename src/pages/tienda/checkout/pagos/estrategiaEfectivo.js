import { METODOS_PAGO } from "../../../../constantes";
import { formatearSoles } from "../../../../utils/formato";
import { FormularioEfectivo } from "./FormularioEfectivo";

/**
 * ============================================================================
 * PATRÓN STRATEGY · Estrategia Concreta: EFECTIVO (Pago Contra Entrega / Recojo)
 * ----------------------------------------------------------------------------
 * Encapsula la lógica de validación, cálculo de vuelto requerido y confirmación
 * de pago en efectivo al momento de recibir el pedido o recogerlo en bodega.
 * ==========================================================================*/

export const estrategiaEfectivo = {
  id: METODOS_PAGO.EFECTIVO,
  nombre: "Efectivo",
  icono: "💵",
  descripcion: "Paga al recibir en tu domicilio o al recoger en el mostrador.",

  validar(datos, monto = 0) {
    const errores = {};
    const montoExacto = Boolean(datos.montoExacto);

    if (!montoExacto) {
      const pagaCon = Number(datos.pagaCon);
      if (!datos.pagaCon || Number.isNaN(pagaCon)) {
        errores.pagaCon = "Indica con cuánto dinero vas a pagar.";
      } else if (pagaCon < monto) {
        errores.pagaCon = `El monto a pagar (${formatearSoles(pagaCon)}) debe ser al menos ${formatearSoles(monto)}.`;
      }
    }

    return {
      valido: Object.keys(errores).length === 0,
      errores,
    };
  },

  async procesarPago(monto, datos) {
    await new Promise((resolver) => setTimeout(resolver, 200));

    const montoExacto = Boolean(datos.montoExacto);
    const pagaCon = montoExacto ? monto : Number(datos.pagaCon) || monto;
    const vuelto = Math.max(0, pagaCon - monto);
    const referencia = `EFE-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      exito: true,
      referencia,
      detalle: montoExacto
        ? `Pago con monto exacto (${formatearSoles(monto)})`
        : `Paga con ${formatearSoles(pagaCon)} (Vuelto: ${formatearSoles(vuelto)})`,
      monto,
      pagaCon,
      vuelto,
      fecha: new Date().toISOString(),
      metodo: METODOS_PAGO.EFECTIVO,
    };
  },

  Formulario: FormularioEfectivo,
};
