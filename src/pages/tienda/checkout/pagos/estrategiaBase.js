/**
 * ============================================================================
 * PATRÓN STRATEGY · Interfaz Base para Estrategias de Pago
 * ----------------------------------------------------------------------------
 * En el módulo de Checkout, cada medio de pago (Yape, Plin, Tarjeta, Efectivo)
 * tiene reglas de validación distintas, datos requeridos particulares y formas
 * diferentes de procesar la transacción.
 *
 * El patrón Strategy encapsula cada algoritmo / método de pago en un objeto
 * independiente con una interfaz idéntica:
 *
 *   - id: Identificador único (de METODOS_PAGO en src/constantes.js)
 *   - nombre: Nombre para mostrar en UI
 *   - icono: Ícono representativo
 *   - descripcion: Resumen o instrucción para el usuario
 *   - validar(datos, monto): Valida los campos específicos requeridos
 *   - procesarPago(monto, datos): Ejecuta el cobro y retorna la referencia
 *   - Formulario: Componente React para capturar los datos requeridos
 *
 * De este modo, la página CheckoutPage no contiene una cadena interminable
 * de "if (metodo === 'YAPE') ... else if (metodo === 'TARJETA') ...", sino que
 * delega toda la responsabilidad en la estrategia activa:
 *   await estrategia.procesarPago(total, datosPago)
 * ==========================================================================*/

export const EstrategiaPagoContrato = {
  id: "",
  nombre: "",
  icono: "",
  descripcion: "",
  /**
   * Valida los datos introducidos por el cliente para este método de pago.
   */
  validar() {
    return { valido: true, errores: {} };
  },
  /**
   * Procesa el pago de forma asíncrona.
   */
  async procesarPago() {
    throw new Error("El método procesarPago(monto, datos) debe ser implementado por la estrategia concreta.");
  },
};
