/**
 * ============================================================================
 * PATRÓN STATE · Interfaz Base de Estado de Pedido
 * ----------------------------------------------------------------------------
 * En lugar de tener un switch/case disperso o dejar que el pedido acepte
 * transiciones ilógicas (como pasar de ENTREGADO a PENDIENTE), el patrón State
 * delega las reglas de negocio a objetos de estado independientes.
 *
 * Cada estado encapsula:
 * - A qué estados siguientes tiene permitido transicionar según el tipo de entrega.
 * - Si el pedido puede ser cancelado en este punto por el cliente.
 * - Acciones automáticas al entrar o salir (ej. reponer stock si se cancela).
 * - Metadatos de presentación (etiqueta, variante de Badge, ícono, descripción).
 * ==========================================================================*/

export class EstadoPedidoBase {
  /**
   * @param {Object} config
   * @param {string} config.nombre - Valor de ESTADOS_PEDIDO
   * @param {string} config.etiqueta - Nombre legible
   * @param {string} config.icono - Ícono o emoji
   * @param {string} config.varianteBadge - Variante de estilo para el componente Badge
   * @param {string} config.descripcion - Qué significa este estado para el cliente
   * @param {number} config.pasoIndice - Posición en la línea de tiempo (1 a 4)
   * @param {boolean} [config.esFinal=false] - Indica si el ciclo termina aquí
   */
  constructor({ nombre, etiqueta, icono, varianteBadge, descripcion, pasoIndice, esFinal = false }) {
    this.nombre = nombre;
    this.etiqueta = etiqueta;
    this.icono = icono;
    this.varianteBadge = varianteBadge;
    this.descripcion = descripcion;
    this.pasoIndice = pasoIndice;
    this.esFinal = esFinal;
  }

  /**
   * Devuelve los estados a los que se puede pasar desde el estado actual.
   * @returns {string[]} Lista de nombres de estados permitidos
   */
  obtenerSiguientes() {
    return [];
  }

  /**
   * Determina si el cliente puede cancelar el pedido en este estado.
   * @returns {boolean}
   */
  puedeCancelar() {
    return false;
  }

  /**
   * Valida si la transición hacia el nuevo estado es permitida.
   * @param {Object} pedido
   * @param {string} nuevoEstado
   * @returns {boolean}
   */
  puedeTransicionarA(pedido, nuevoEstado) {
    const siguientes = this.obtenerSiguientes(pedido);
    return siguientes.includes(nuevoEstado);
  }

  /**
   * Hook ejecutado antes de persistir la transición.
   */
  async alTransicionar() {
    // Implementado por subclases si requieren acciones secundarias
  }
}
