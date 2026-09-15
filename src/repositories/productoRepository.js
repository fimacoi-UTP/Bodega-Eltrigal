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

const base = crearRepositorioBase({
  clave: CLAVES.PRODUCTOS,
  prefijoId: "prod",
  nombre: "productos",
});

export const productoRepository = {
  // Hereda: obtenerTodos, obtenerPorId, obtenerDonde, contar,
  //         crear, actualizar, eliminar, reemplazarTodos
  ...base,

  /* ------------------------------------------------------------- CONSULTAS */

  /**
   * Solo los productos activos (los que se muestran en la tienda web).
   * El dashboard sí usa `obtenerTodos()` porque necesita ver también los
   * desactivados para poder reactivarlos.
   */
  async obtenerActivos() {
    return base.obtenerDonde((producto) => producto.activo !== false);
  },

  /** Productos de una categoría. @param {string} categoria */
  async obtenerPorCategoria(categoria) {
    return base.obtenerDonde((producto) => producto.categoria === categoria);
  },

  /**
   * Lista de categorías existentes, sin repetir y ordenadas alfabéticamente.
   * Se CALCULA a partir de los productos en vez de guardarse aparte: así nunca
   * puede quedar desincronizada (esto también es "una sola fuente de verdad").
   * @returns {Promise<string[]>}
   */
  async obtenerCategorias() {
    const productos = await base.obtenerTodos();
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
    if (!consulta) return base.obtenerTodos();

    return base.obtenerDonde((producto) =>
      [producto.nombre, producto.marca, producto.categoria]
        .map(normalizarTexto)
        .some((campo) => campo.includes(consulta)),
    );
  },

  /**
   * Productos cuyo stock llegó o bajó de su mínimo. Lo necesita el módulo de
   * inventario para las alertas de reposición.
   */
  async obtenerBajoStock() {
    return base.obtenerDonde(
      (producto) => Number(producto.stock) <= Number(producto.stockMinimo ?? 0),
    );
  },

  /* ---------------------------------------------------------------- STOCK */

  /**
   * Suma o resta unidades al stock de UN producto.
   *
   * @param {string} id
   * @param {number} delta - positivo para ingresar mercadería, negativo para
   *                         descontar por una venta.
   * @returns {Promise<object>} el producto actualizado.
   */
  async ajustarStock(id, delta) {
    const producto = await base.obtenerPorId(id);
    if (!producto) {
      throw new Error(`No existe el producto "${id}".`);
    }

    const nuevoStock = Number(producto.stock) + Number(delta);
    if (nuevoStock < 0) {
      throw new Error(
        `Stock insuficiente de "${producto.nombre}". Disponible: ${producto.stock}, solicitado: ${Math.abs(delta)}.`,
      );
    }

    return base.actualizar(id, { stock: nuevoStock });
  },

  /**
   * ⭐ EL MÉTODO DE LA REGLA DE ORO ⭐
   *
   * Descuenta el stock de VARIOS productos a la vez, de forma atómica: o baja
   * todo, o no baja nada. Lo usan por igual el checkout de la tienda web y el
   * registro de ventas del dashboard.
   *
   * ¿Por qué todo junto y no un `ajustarStock` por producto en un bucle?
   * Porque si el carrito tiene 3 productos y el tercero no tiene stock, un
   * bucle ya habría descontado los dos primeros y quedaría el inventario
   * cuadrado a medias. Aquí validamos TODO primero y recién después guardamos
   * una sola vez.
   *
   * @param {{ productoId: string, cantidad: number }[]} items
   * @returns {Promise<object[]>} la lista de productos ya actualizada.
   *
   * @example
   * await productoRepository.descontarStock([
   *   { productoId: 'prod-001', cantidad: 2 },
   *   { productoId: 'prod-013', cantidad: 1 },
   * ])
   */
  async descontarStock(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("descontarStock espera una lista de items con productoId y cantidad.");
    }

    const productos = base._leerColeccion();

    // --- Paso 1: validar TODO antes de escribir nada -----------------------
    const cambios = items.map(({ productoId, cantidad }) => {
      const indice = productos.findIndex((p) => p.id === productoId);
      if (indice === -1) {
        throw new Error(`No existe el producto "${productoId}".`);
      }

      const unidades = Number(cantidad);
      if (!Number.isFinite(unidades) || unidades <= 0) {
        throw new Error(
          `La cantidad de "${productos[indice].nombre}" debe ser un número mayor a 0.`,
        );
      }

      const restante = Number(productos[indice].stock) - unidades;
      if (restante < 0) {
        throw new Error(
          `Stock insuficiente de "${productos[indice].nombre}". ` +
            `Disponible: ${productos[indice].stock}, solicitado: ${unidades}.`,
        );
      }

      return { indice, restante };
    });

    // --- Paso 2: recién ahora sí, aplicar y guardar de una sola vez --------
    const momento = new Date().toISOString();
    cambios.forEach(({ indice, restante }) => {
      productos[indice] = {
        ...productos[indice],
        stock: restante,
        actualizadoEn: momento,
      };
    });

    base._guardarColeccion(productos);
    return productos;

    /* 🔌 Al migrar a Spring Boot: esta lógica de validar-y-descontar se va al
       backend (@Transactional en un @Service), y este método queda como:
           await fetch(`${API}/productos/descontar-stock`, {
             method: 'POST', body: JSON.stringify(items), ...
           })
       Los componentes siguen llamando `descontarStock(items)` igual que hoy. */
  },

  /**
   * Devuelve stock al inventario (venta anulada, pedido cancelado).
   * @param {{ productoId: string, cantidad: number }[]} items
   */
  async reponerStock(items) {
    const productos = base._leerColeccion();
    const momento = new Date().toISOString();

    items.forEach(({ productoId, cantidad }) => {
      const indice = productos.findIndex((p) => p.id === productoId);
      if (indice === -1) return; // el producto ya no existe: lo ignoramos
      productos[indice] = {
        ...productos[indice],
        stock: Number(productos[indice].stock) + Number(cantidad),
        actualizadoEn: momento,
      };
    });

    base._guardarColeccion(productos);
    return productos;
  },
};
