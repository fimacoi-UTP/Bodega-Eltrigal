import { METODOS_PAGO } from "../../../../constantes";
import { FormularioPlin } from "./FormularioPlin";

/**
 * ============================================================================
 * PATRÓN STRATEGY · Estrategia Concreta: PLIN
 * ----------------------------------------------------------------------------
 * Encapsula la lógica de validación, formulario y procesamiento para pagos
 * con la billetera interbancaria Plin (BBVA, Interbank, Scotiabank, BanBif).
 * ==========================================================================*/

export const estrategiaPlin = {
  id: METODOS_PAGO.PLIN,
  nombre: "Plin",
  icono: "⚡",
  descripcion: "Transfiere vía Plin desde BBVA, Interbank, Scotiabank o BanBif.",

  validar(datos) {
    const errores = {};
    const banco = String(datos.bancoPlin ?? "").trim();
    const tel = String(datos.telefonoPlin ?? "").trim();
    const codigo = String(datos.codigoOperacion ?? "").trim();

    if (!banco) {
      errores.bancoPlin = "Selecciona el banco desde donde realizaste el Plin.";
    }

    if (!tel) {
      errores.telefonoPlin = "Ingresa tu número de celular registrado en Plin.";
    } else if (!/^9\d{8}$/.test(tel)) {
      errores.telefonoPlin = "El número debe tener 9 dígitos y empezar con 9.";
    }

    if (!codigo) {
      errores.codigoOperacion = "Ingresa el número de operación del Plin.";
    } else if (codigo.length < 6) {
      errores.codigoOperacion = "El código debe tener al menos 6 dígitos.";
    }

    return {
      valido: Object.keys(errores).length === 0,
      errores,
    };
  },

  async procesarPago(monto, datos) {
    await new Promise((resolver) => setTimeout(resolver, 300));

    const codigo = datos.codigoOperacion || Math.floor(100000 + Math.random() * 900000);
    const referencia = `PLI-${codigo}`;

    return {
      exito: true,
      referencia,
      detalle: `Plin verificado desde ${datos.bancoPlin} (${datos.telefonoPlin}) - Op: ${codigo}`,
      monto,
      fecha: new Date().toISOString(),
      metodo: METODOS_PAGO.PLIN,
    };
  },

  Formulario: FormularioPlin,
};
