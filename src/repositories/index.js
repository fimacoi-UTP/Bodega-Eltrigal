/**
 * ============================================================================
 * PUNTO DE ENTRADA DE LA CAPA REPOSITORY
 * ----------------------------------------------------------------------------
 * Importen siempre desde aquí, no desde cada archivo suelto:
 *
 *   import { productoRepository, ventaRepository } from '../repositories'
 *
 * Así, si mañana reorganizamos los archivos internos de la capa, los módulos
 * no se enteran.
 *
 * ⚠️ RECORDATORIO: en la medida de lo posible, sus componentes NO deberían
 * importar repositorios directamente, sino usar los hooks (useInventario,
 * useAuth), que son la FACHADA (patrón Facade) sobre esta capa. Vayan al
 * repositorio directo solo cuando necesiten algo que el hook no expone
 * (típicamente ventas, pedidos y promociones, que aún no tienen contexto
 * propio porque los construye cada módulo).
 * ==========================================================================*/

export { productoRepository } from "./productoRepository";
export { usuarioRepository } from "./usuarioRepository";
export { ventaRepository } from "./ventaRepository";
export { pedidoRepository } from "./pedidoRepository";
export { promocionRepository } from "./promocionRepository";

export { inicializarDatos, reiniciarDatos } from "./semilla";
export { CLAVES } from "./claves";
