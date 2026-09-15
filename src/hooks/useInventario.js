/**
 * ============================================================================
 * useInventario · La puerta de entrada al catálogo y al stock
 * ----------------------------------------------------------------------------
 * Este hook es la FACHADA que deben usar TODOS los módulos, tanto los de la
 * tienda web como los del dashboard. No importen `productoRepository` en un
 * componente si este hook ya les da lo que necesitan.
 *
 * @example Listar productos (módulo catálogo)
 * const { productosActivos, categorias, cargando } = useInventario()
 * if (cargando) return <Cargando />
 * return productosActivos.map(p => <TarjetaProducto key={p.id} producto={p} />)
 *
 * @example Editar un producto (módulo gestión de productos)
 * const { actualizarProducto } = useInventario()
 * await actualizarProducto('prod-001', { precio: 26.5 })
 *
 * @example Vender (módulos checkout y ventas) — LA REGLA DE ORO
 * const { descontarStock } = useInventario()
 * await descontarStock([{ productoId: 'prod-001', cantidad: 2 }])
 * // ↑ con esto el stock baja para las DOS zonas a la vez
 * ==========================================================================*/

import { useContext } from "react";
import { InventarioContext } from "../context/InventarioContext";

export function useInventario() {
  const contexto = useContext(InventarioContext);

  if (contexto === null) {
    throw new Error(
      "useInventario() debe usarse dentro de <InventarioProvider>. " +
        "Revisa que src/App.jsx envuelva la aplicación con el provider.",
    );
  }

  return contexto;
}
