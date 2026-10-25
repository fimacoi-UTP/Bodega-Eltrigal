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
import { productoRepository, promocionRepository } from "../repositories";
import { normalizarTexto } from "../utils/formato";
import { calcularPrecioFinal } from "../pages/dashboard/promociones/decoradores";
import { useAuth } from "../hooks/useAuth";

export function InventarioProvider({ children }) {
  const { usuario } = useAuth();
  const esStaff = usuario?.rol === "ADMIN" || usuario?.rol === "CAJERO";

  /** Copia en memoria del catálogo. Es lo que React observa y renderiza. */
  const [productos, setProductos] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Vuelve a leer el catálogo y promociones desde los repositorios.
   * Si el usuario es ADMIN o CAJERO, consulta el catálogo completo de gestión.
   * Si es visitante o cliente, consulta el catálogo público.
   */
  const refrescar = useCallback(async () => {
    try {
      const [lista, promos] = await Promise.all([
        productoRepository.obtenerTodos({ publico: !esStaff }),
        promocionRepository.obtenerVigentes(),
      ]);
      setProductos(lista);
      setPromociones(promos);
      setError(null);
    } catch (fallo) {
      console.error("[El Trigal] Error al recargar el inventario:", fallo);
      setError("No se pudo cargar el catálogo de productos.");
    } finally {
      setCargando(false);
    }
  }, [esStaff]);

  /* ------------------------------------------------------------------------
   * Carga inicial y al cambiar de rol/sesión (Staff <-> Público).
   * --------------------------------------------------------------------- */
  useEffect(() => {
    let cancelado = false;

    async function cargarCatalogo() {
      try {
        const [lista, promos] = await Promise.all([
          productoRepository.obtenerTodos({ publico: !esStaff }),
          promocionRepository.obtenerVigentes(),
        ]);
        if (cancelado) return;
        setProductos(lista);
        setPromociones(promos);
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
  }, [esStaff]);

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
      const actual = productos.find((p) => String(p.id) === String(id));
      const actualizado = await productoRepository.actualizar(id, { ...actual, ...cambios });
      await refrescar();
      return actualizado;
    },
    [productos, refrescar],
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
    async (id, delta, motivo = "") => {
      const r = await productoRepository.ajustarStock(id, delta, motivo);
      await refrescar();
      return r;
    },
    [refrescar],
  );

  /* ========================================================================
   * CONSULTAS DERIVADAS Y DESCUENTOS (Patrón Decorator)
   * Se calculan a partir de `productos` y `promociones` en memoria: son síncronas
   * y no tocan el almacenamiento. Perfectas para usar dentro del render.
   * ===================================================================== */

  /**
   * Aplica las promociones vigentes a un producto usando el patrón Decorator.
   */
  const aplicarDescuentoAProducto = useCallback(
    (producto, listaPromociones = promociones) => {
      if (!producto) return null;
      const prodId = String(producto.id);
      const catId = producto.categoriaId != null ? Number(producto.categoriaId) : null;

      const promosParaProducto = (listaPromociones || []).filter((promo) => {
        if (promo.activa === false) return false;
        return (
          Boolean(promo.aplicaTodos) ||
          Boolean(promo.productoIds?.includes(prodId)) ||
          (catId != null && Boolean(promo.categoriaIds?.includes(catId)))
        );
      });
      return calcularPrecioFinal(producto, promosParaProducto);
    },
    [promociones],
  );

  /**
   * Obtiene la entidad de un producto enriquecida con sus descuentos calculados.
   */
  const obtenerProductoConDescuento = useCallback(
    (productoId) => {
      const base = productos.find((p) => p.id === productoId);
      if (!base) return null;
      return aplicarDescuentoAProducto(base, promociones);
    },
    [productos, promociones, aplicarDescuentoAProducto],
  );

  /** Categorías existentes, sin repetir y ordenadas. Las usa el Navbar. */
  const categorias = useMemo(() => {
    const unicas = new Set(productos.map((p) => p.categoria).filter(Boolean));
    return [...unicas].sort((a, b) => a.localeCompare(b, "es"));
  }, [productos]);

  /** Solo los productos visibles en la tienda web, enriquecidos con promociones. */
  const productosActivos = useMemo(
    () =>
      productos
        .filter((p) => p.activo !== false)
        .map((p) => aplicarDescuentoAProducto(p, promociones)),
    [productos, promociones, aplicarDescuentoAProducto],
  );

  /** Busca un producto ya cargado y decorado con promociones. */
  const obtenerProducto = useCallback(
    (id) => {
      const base = productos.find((p) => p.id === id);
      return base ? aplicarDescuentoAProducto(base, promociones) : null;
    },
    [productos, promociones, aplicarDescuentoAProducto],
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
      promociones,
      productosActivos,
      categorias,
      cargando,
      error,

      // Escritura
      crearProducto,
      actualizarProducto,
      eliminarProducto,
      ajustarStock,
      refrescar,

      // Consultas y descuentos
      obtenerProducto,
      obtenerProductoConDescuento,
      aplicarDescuentoAProducto,
      filtrarPorCategoria,
      buscar,
    }),
    [
      productos,
      promociones,
      productosActivos,
      categorias,
      cargando,
      error,
      crearProducto,
      actualizarProducto,
      eliminarProducto,
      ajustarStock,
      refrescar,
      obtenerProducto,
      obtenerProductoConDescuento,
      aplicarDescuentoAProducto,
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
