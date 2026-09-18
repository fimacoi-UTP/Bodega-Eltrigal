import { METODOS_PAGO } from "../../../../constantes";
import { FormularioYape } from "./FormularioYape";

/**
 * ============================================================================
 * PATRÓN STRATEGY · Estrategia Concreta: YAPE
 * ----------------------------------------------------------------------------
 * Encapsula la lógica de validación, renderizado de formulario y procesamiento
 * para pagos con la billetera digital Yape del BCP.
 * ==========================================================================*/

export const estrategiaYape = {
  id: METODOS_PAGO.YAPE,
  nombre: "Yape",
  icono: "📱",
  descripcion: "Transfiere al instante desde tu app Yape a nuestro número.",

  validar(datos) {
    const errores = {};
    const tel = String(datos.telefonoYape ?? "").trim();
    const codigo = String(datos.codigoAprobacion ?? "").trim();

    if (!tel) {
      errores.telefonoYape = "Ingresa el celular con el que realizaste el Yape.";
    } else if (!/^9\d{8}$/.test(tel)) {
      errores.telefonoYape = "El celular debe tener 9 dígitos y empezar con 9.";
    }

    if (!codigo) {
      errores.codigoAprobacion = "Ingresa el código de aprobación de 6 dígitos.";
    } else if (!/^\d{6}$/.test(codigo)) {
      errores.codigoAprobacion = "El código debe contener exactamente 6 números.";
    }

    return {
      valido: Object.keys(errores).length === 0,
      errores,
    };
  },

  async procesarPago(monto, datos) {
    await new Promise((resolver) => setTimeout(resolver, 300));

    const codigo = datos.codigoAprobacion || Math.floor(100000 + Math.random() * 900000);
    const referencia = `YAP-${codigo}`;

    return {
      exito: true,
      referencia,
      detalle: `Yape verificado desde el celular ${datos.telefonoYape} (Cód: ${codigo})`,
      monto,
      fecha: new Date().toISOString(),
      metodo: METODOS_PAGO.YAPE,
    };
  },

  Formulario: FormularioYape,
};
