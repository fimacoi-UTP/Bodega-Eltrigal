/**
 * ============================================================================
 * InventarioProvider · Catálogo y stock  (patrón FACADE + OBSERVER)
 * ----------------------------------------------------------------------------
 * 🥇 AQUÍ VIVE LA REGLA DE ORO DEL PROYECTO.
 *
 * Este provider mantiene EN MEMORIA la lista de productos y la sincroniza con
 * el repositorio. Como la tienda web y el dashboard cuelgan del mismo Provider
 * (ver src/App.jsx), ambos ven exactamente los mismos datos:
 *
 *   Cliente compra 2 arroces en /checkout
 *        └─> inventario.descontarStock([...])
 *              └─> productoRepository (localStorage)   ← fuente de verdad
 *              └─> setProductos(...)                   ← re-render automático
 *                    └─> /dashboard/inventario ya muestra el stock nuevo
 *
 * Y al revés: el cajero vende en /dashboard/ventas y el catálogo web se
 * actualiza. Nadie mantiene una segunda copia de los productos.
 *
 * FACADE: los componentes escriben `productos`, `crearProducto(...)`,
 * `descontarStock(...)`. No saben que existe localStorage, ni el repositorio,
 * ni cómo se recargan los datos.
 * ==========================================================================*/

import { useCallback, useEffect, useMemo, useState } from "react";
import { InventarioContext } from "./InventarioContext";
import { productoRepository } from "../repositories";
import { normalizarTexto } from "../utils/formato";

export function InventarioProvider({ children }) {
  /** Copia en memoria del catálogo. Es lo que React observa y renderiza. */
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Vuelve a leer el catálogo desde el repositorio.
   * La llamamos después de cada operación de escritura, para que lo que se ve
   * en pantalla coincida con lo que quedó guardado.
   */
  const refrescar = useCallback(async () => {
    try {
      const lista = await productoRepository.obtenerTodos();
      setProductos(lista);
      setError(null);
    } catch (fallo) {
      console.error("[El Trigal] Error al recargar el inventario:", fallo);
      setError("No se pudo cargar el catálogo de productos.");
    } finally {
      setCargando(false);
    }
  }, []);

  /* ------------------------------------------------------------------------
   * Carga inicial, al montar la aplicación.
   *
   * La lectura va escrita DENTRO del efecto, en su propia función async, en vez
   * de llamar a `refrescar()`. Dos razones:
   *   · La bandera `cancelado` evita actualizar el estado si el componente ya
   *     se desmontó (React 19 en modo estricto monta y desmonta dos veces en
   *     desarrollo, así que esto pasa de verdad).
   *   · ESLint (react-hooks/set-state-in-effect) pide que un efecto no dispare
   *     cambios de estado a través de funciones externas, porque eso encadena
   *     renders difíciles de seguir.
   * --------------------------------------------------------------------- */
  useEffect(() => {
    let cancelado = false;

    async function cargarCatalogo() {
      try {
        const lista = await productoRepository.obtenerTodos();
        if (cancelado) return;
        setProductos(lista);
        setError(null);
      } catch (fallo) {
        console.error("[El Trigal] Error al cargar el inventario:", fallo);
        if (!cancelado) setError("No se pudo cargar el catálogo de productos.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarCatalogo();

    return () => {
      cancelado = true;
    };
  }, []);

  /* ========================================================================
   * OPERACIONES DE ESCRITURA
   * Todas siguen el mismo patrón: escriben en el repositorio (persistencia) y
   * luego refrescan el estado (re-render). Nunca modifican `productos`
   * directamente sin pasar por el repositorio, porque entonces el cambio se
   * perdería al recargar la página.
   * ===================================================================== */

  /** Registra un producto nuevo. Lo usa el módulo de gestión de productos. */
  const crearProducto = useCallback(
    async (datos) => {
      const creado = await productoRepository.crear({
        activo: true,
        stock: 0,
        stockMinimo: 0,
        ...datos,
      });
      await refrescar();
      return creado;
    },
    [refrescar],
  );

  /** Modifica un producto (precio, nombre, categoría, etc.). */
  const actualizarProducto = useCallback(
    async (id, cambios) => {
      const actualizado = await productoRepository.actualizar(id, cambios);
      await refrescar();
      return actualizado;
    },
    [refrescar],
  );

  /** Elimina un producto del catálogo. */
  const eliminarProducto = useCallback(
    async (id) => {
      await productoRepository.eliminar(id);
      await refrescar();
      return true;
    },
    [refrescar],
  );

  /**
   * Suma o resta stock de un producto.
   * Para ingresos de mercadería usen delta positivo; para mermas, negativo.
   */
  const ajustarStock = useCallback(
    async (id, delta) => {
      const actualizado = await productoRepository.ajustarStock(id, delta);
      await refrescar();
      return actualizado;
    },
    [refrescar],
  );

  /**
   * ⭐ DESCUENTA STOCK POR UNA VENTA ⭐
   *
   * Este es el método que DEBEN llamar tanto el checkout de la tienda web como
   * el registro de ventas del dashboard. Es lo que mantiene el stock cuadrado
   * entre las dos zonas.
   *
   * Es atómico: si un solo producto no tiene stock suficiente, lanza un error
   * y NO descuenta nada.
   *
   * @param {{ productoId: string, cantidad: number }[]} items
   * @throws {Error} con un mensaje listo para mostrar, ej.
   *                 "Stock insuficiente de 'Inca Kola 1.5 L'. Disponible: 2..."
   *
   * @example
   * try {
   *   await descontarStock(carrito.map(i => ({ productoId: i.id, cantidad: i.cantidad })))
   *   await pedidoRepository.crear({ ... })
   * } catch (e) {
   *   mostrarError(e.message)
   * }
   */
  const descontarStock = useCallback(
    async (items) => {
      await productoRepository.descontarStock(items);
      await refrescar();
      return true;
    },
    [refrescar],
  );

  /** Devuelve stock al inventario (venta anulada / pedido cancelado). */
  const reponerStock = useCallback(
    async (items) => {
      await productoRepository.reponerStock(items);
      await refrescar();
      return true;
    },
    [refrescar],
  );

  /* ========================================================================
   * CONSULTAS DERIVADAS
   * Se calculan a partir de `productos` que ya está en memoria: son síncronas
   * y no tocan el almacenamiento. Perfectas para usar dentro del render.
   * ===================================================================== */

  /** Categorías existentes, sin repetir y ordenadas. Las usa el Navbar. */
  const categorias = useMemo(() => {
    const unicas = new Set(productos.map((p) => p.categoria).filter(Boolean));
    return [...unicas].sort((a, b) => a.localeCompare(b, "es"));
  }, [productos]);

  /** Solo los productos visibles en la tienda web. */
  const productosActivos = useMemo(
    () => productos.filter((p) => p.activo !== false),
    [productos],
  );

  /** Busca un producto ya cargado, sin ir al repositorio. */
  const obtenerProducto = useCallback(
    (id) => productos.find((p) => p.id === id) ?? null,
    [productos],
  );

  /** Filtra por categoría. Pasen null o "Todos" para no filtrar. */
  const filtrarPorCategoria = useCallback(
    (categoria) => {
      if (!categoria || categoria === "Todos") return productosActivos;
      return productosActivos.filter((p) => p.categoria === categoria);
    },
    [productosActivos],
  );

  /** Búsqueda por texto, ignorando tildes y mayúsculas. */
  const buscar = useCallback(
    (texto) => {
      const consulta = normalizarTexto(texto).trim();
      if (!consulta) return productosActivos;

      return productosActivos.filter((producto) =>
        [producto.nombre, producto.marca, producto.categoria]
          .map(normalizarTexto)
          .some((campo) => campo.includes(consulta)),
      );
    },
    [productosActivos],
  );

  /* --------------------------------------------------------------------- */

  const valor = useMemo(
    () => ({
      // Estado
      productos,
      productosActivos,
      categorias,
      cargando,
      error,

      // Escritura
      crearProducto,
      actualizarProducto,
      eliminarProducto,
      ajustarStock,
      descontarStock,
      reponerStock,
      refrescar,

      // Consultas
      obtenerProducto,
      filtrarPorCategoria,
      buscar,
    }),
    [
      productos,
      productosActivos,
      categorias,
      cargando,
      error,
      crearProducto,
      actualizarProducto,
      eliminarProducto,
      ajustarStock,
      descontarStock,
      reponerStock,
      refrescar,
      obtenerProducto,
      filtrarPorCategoria,
      buscar,
    ],
  );

  return (
    <InventarioContext.Provider value={valor}>{children}</InventarioContext.Provider>
  );
}

export default InventarioProvider;

/* ============================================================================
 * 🪝 NOTA PARA EL MÓDULO DE CARRITO (rama: carrito)
 * ----------------------------------------------------------------------------
 * El carrito NO va aquí. Quien tome ese módulo debe crear su propio
 * CarritoContext.js + CarritoProvider.jsx siguiendo este mismo molde (separado
 * en dos archivos, por el Fast Refresh), y montar el provider en src/App.jsx
 * dentro de <InventarioProvider>, porque el carrito necesita consultar stock
 * y precios.
 *
 * Responsabilidades sugeridas del CarritoContext:
 *   items, agregar(producto, cantidad), quitar(id), cambiarCantidad(id, n),
 *   vaciar(), cantidadTotal, subtotal
 *
 * Y recuerden: el carrito NO descuenta stock al agregar. El stock se descuenta
 * recién al confirmar la compra en el checkout, con `descontarStock()`.
 * ==========================================================================*/
