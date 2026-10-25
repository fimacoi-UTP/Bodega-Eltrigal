/**
 * ============================================================================
 * REPOSITORIO DE PRODUCTOS
 * ----------------------------------------------------------------------------
 * Esta es LA FUENTE ÚNICA DE VERDAD del catálogo y del stock.
 *
 * 🥇 LA REGLA DE ORO DEL PROYECTO:
 * La tienda web y el dashboard leen y escriben en este mismo repositorio.
 * Si un cliente compra 2 arroces por la web, el stock baja aquí, y el
 * inventario del dashboard lo ve al instante. Si el cajero vende 3 en tienda,
 * el catálogo web muestra menos stock. No hay dos listas de productos: hay una.
 *
 * Forma de un producto:
 * {
 *   id, nombre, descripcion, categoria, marca,
 *   precio (number, soles), stock (number), stockMinimo (number),
 *   unidad, imagen, color, activo (boolean)
 * }
 * ==========================================================================*/

import { crearRepositorioBase } from "./repositorioBase";
import { CLAVES } from "./claves";
import { normalizarTexto } from "../utils/formato";
import { productosApi } from "../api/productosApi";
import { movimientosApi } from "../api/movimientosApi";

const base = crearRepositorioBase({
  clave: CLAVES.PRODUCTOS,
  prefijoId: "prod",
  nombre: "productos",
});

export const productoRepository = {
  // Hereda métodos utilitarios de base (claves, almacenamiento auxiliar, etc.)
  ...base,

  /* ------------------------------------------------------------- ESCRITURA (API) */

  /**
   * Crea un producto en el backend Spring Boot.
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async crear(datos) {
    return productosApi.crear(datos);
  },

  /**
   * Actualiza un producto en el backend Spring Boot.
   * @param {string|number} id
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async actualizar(id, datos) {
    return productosApi.actualizar(id, datos);
  },

  /**
   * Elimina un producto en el backend Spring Boot (soft delete).
   * @param {string|number} id
   * @returns {Promise<boolean>}
   */
  async eliminar(id) {
    return productosApi.eliminar(id);
  },

  /* ------------------------------------------------------------- LECTURA (API) */

  /**
   * Obtiene todos los productos desde el backend Spring Boot.
   * Por defecto consume /api/productos/gestion (para Dashboard y POS).
   * @param {{ publico?: boolean }} [opciones={}]
   * @returns {Promise<Array<object>>}
   */
  async obtenerTodos(opciones = {}) {
    return productosApi.listar(opciones);
  },

  /** Alias para listar() */
  async listar(opciones = {}) {
    return this.obtenerTodos(opciones);
  },

  /** Obtiene explícitamente el catálogo de gestión */
  async obtenerGestion() {
    return productosApi.listarGestion();
  },

  /** Obtiene explícitamente el catálogo público */
  async obtenerPublico() {
    return productosApi.listarPublico();
  },

  /**
   * Busca un producto por su id en el backend Spring Boot.
   * @param {string|number} id
   * @param {{ publico?: boolean }} [opciones={}]
   * @returns {Promise<object|null>}
   */
  async obtenerPorId(id, opciones = {}) {
    return productosApi.obtenerPorId(id, opciones);
  },

  /**
   * Devuelve los productos que cumplan una condición dada.
   * Filtra en memoria sobre la lista obtenida de la API.
   * @param {(producto: object) => boolean} condicion
   */
  async obtenerDonde(condicion) {
    const productos = await this.obtenerTodos();
    return productos.filter(condicion);
  },

  /**
   * Cuenta cuántos productos existen en el catálogo.
   * @returns {Promise<number>}
   */
  async contar() {
    const productos = await this.obtenerTodos();
    return productos.length;
  },

  /* ------------------------------------------------------------- CONSULTAS */

  /**
   * Solo los productos activos (los que se muestran en la tienda web).
   * El dashboard sí usa `obtenerTodos()` porque necesita ver también los
   * desactivados para poder reactivarlos.
   */
  async obtenerActivos() {
    return this.obtenerDonde((producto) => producto.activo !== false);
  },

  /** Productos de una categoría. @param {string} categoria */
  async obtenerPorCategoria(categoria) {
    return this.obtenerDonde((producto) => producto.categoria === categoria);
  },

  /**
   * Lista de categorías existentes, sin repetir y ordenadas alfabéticamente.
   * Se CALCULA a partir de los productos en vez de guardarse aparte: así nunca
   * puede quedar desincronizada (esto también es "una sola fuente de verdad").
   * @returns {Promise<string[]>}
   */
  async obtenerCategorias() {
    const productos = await this.obtenerTodos();
    const categorias = new Set(
      productos.map((producto) => producto.categoria).filter(Boolean),
    );
    return [...categorias].sort((a, b) => a.localeCompare(b, "es"));
  },

  /**
   * Busca por nombre, marca o categoría, ignorando tildes y mayúsculas.
   * @param {string} texto
   */
  async buscar(texto) {
    const consulta = normalizarTexto(texto).trim();
    if (!consulta) return this.obtenerTodos();

    return this.obtenerDonde((producto) =>
      [producto.nombre, producto.marca, producto.categoria]
        .filter(Boolean)
        .map(normalizarTexto)
        .some((campo) => campo.includes(consulta)),
    );
  },

  /**
   * Productos cuyo stock llegó o bajó de su mínimo. Lo necesita el módulo de
   * inventario para las alertas de reposición.
   */
  async obtenerBajoStock() {
    return this.obtenerDonde(
      (producto) => Number(producto.stock) <= Number(producto.stockMinimo ?? 0),
    );
  },

  /* ---------------------------------------------------------------- STOCK */

  /**
   * Suma o resta unidades al stock de UN producto mediante la API de movimientos.
   *
   * @param {string|number} id
   * @param {number} delta - positivo para ingresar mercadería, negativo para salida/merma.
   * @param {string} [motivo=""]
   * @returns {Promise<object>} resultado del movimiento registrado.
   */
  async ajustarStock(id, delta, motivo = "") {
    return movimientosApi.registrar({ productoId: id, delta, motivo });
  },
};

