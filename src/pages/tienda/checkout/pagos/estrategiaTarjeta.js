import { METODOS_PAGO } from "../../../../constantes";
import { FormularioTarjeta } from "./FormularioTarjeta";

/**
 * ============================================================================
 * PATRÓN STRATEGY · Estrategia Concreta: TARJETA DE CRÉDITO / DÉBITO
 * ----------------------------------------------------------------------------
 * Encapsula la lógica de validación, formateo de números, verificación de
 * fecha de caducidad y procesamiento simulado con pasarela de pagos.
 * ==========================================================================*/

export const estrategiaTarjeta = {
  id: METODOS_PAGO.TARJETA,
  nombre: "Tarjeta de crédito / débito",
  icono: "💳",
  descripcion: "Paga de forma rápida y segura con tu tarjeta Visa o Mastercard.",

  validar(datos) {
    const errores = {};
    const numeroLimpio = String(datos.numeroTarjeta ?? "").replace(/\s/g, "");
    const titular = String(datos.nombreTitular ?? "").trim();
    const expiracion = String(datos.expiracion ?? "").trim();
    const cvv = String(datos.cvv ?? "").trim();

    if (!numeroLimpio) {
      errores.numeroTarjeta = "Ingresa el número de tu tarjeta.";
    } else if (!/^\d{16}$/.test(numeroLimpio)) {
      errores.numeroTarjeta = "El número de tarjeta debe tener 16 dígitos.";
    }

    if (!titular) {
      errores.nombreTitular = "Ingresa el nombre del titular como figura en el plástico.";
    } else if (titular.length < 3) {
      errores.nombreTitular = "El nombre del titular es demasiado corto.";
    }

    if (!expiracion) {
      errores.expiracion = "Ingresa la fecha de vencimiento (MM/AA).";
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiracion)) {
      errores.expiracion = "Formato inválido. Debe ser MM/AA.";
    } else {
      const [mesStr, anioStr] = expiracion.split("/");
      const mes = parseInt(mesStr, 10);
      const anio = 2000 + parseInt(anioStr, 10);
      const ahora = new Date();
      const anioActual = ahora.getFullYear();
      const mesActual = ahora.getMonth() + 1;

      if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
        errores.expiracion = "La tarjeta ingresada está vencida.";
      }
    }

    if (!cvv) {
      errores.cvv = "Ingresa el código CVV.";
    } else if (!/^\d{3,4}$/.test(cvv)) {
      errores.cvv = "El CVV debe tener 3 o 4 dígitos.";
    }

    return {
      valido: Object.keys(errores).length === 0,
      errores,
    };
  },

  async procesarPago(monto, datos) {
    await new Promise((resolver) => setTimeout(resolver, 500));

    const numLimpio = String(datos.numeroTarjeta ?? "").replace(/\s/g, "");
    const ultimos4 = numLimpio.slice(-4) || "0000";
    const authCode = Math.floor(100000 + Math.random() * 900000);
    const referencia = `TAR-${authCode}`;

    return {
      exito: true,
      referencia,
      detalle: `Tarjeta terminada en •••• ${ultimos4} (Aut: ${authCode})`,
      monto,
      fecha: new Date().toISOString(),
      metodo: METODOS_PAGO.TARJETA,
    };
  },

  Formulario: FormularioTarjeta,
};
