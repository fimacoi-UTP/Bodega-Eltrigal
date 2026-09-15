/**
 * ============================================================================
 * 🚧 CASCARÓN · Catálogo de productos (página de inicio de la tienda)
 * ============================================================================
 * Esta página es un PLACEHOLDER. Quien tome el módulo de catálogo debe borrar
 * el <CascaronModulo> y construir aquí la tienda de verdad.
 *
 * La infraestructura ya está lista: los productos, las categorías y la
 * búsqueda salen del hook `useInventario()`. No hace falta tocar localStorage
 * ni los repositorios.
 *
 * Arranque sugerido:
 *
 *   import { useSearchParams } from 'react-router-dom'
 *   import { useInventario } from '../../hooks/useInventario'
 *   import { formatearSoles } from '../../utils/formato'
 *   import { Card, Badge, Boton, Cargando } from '../../components/ui'
 *
 *   export function HomePage() {
 *     const { productosActivos, categorias, filtrarPorCategoria, cargando } = useInventario()
 *     const [parametros, setParametros] = useSearchParams()
 *     const categoria = parametros.get('categoria')          // ← lo manda el Navbar
 *     const visibles = filtrarPorCategoria(categoria)
 *
 *     if (cargando) return <Cargando texto="Cargando productos…" />
 *     return ( ...hero + filtros + rejilla de tarjetas... )
 *   }
 * ==========================================================================*/

import CascaronModulo from "../../components/comunes/CascaronModulo";

export function HomePage() {
  return (
    <div className="contenedor">
      <CascaronModulo
        nombre="Catálogo de productos"
        descripcion="Es la portada de la tienda web y la primera impresión del proyecto: sección de bienvenida, filtros por categoría, buscador y la rejilla de productos con su precio, stock y botón de agregar al carrito."
        archivo="src/pages/tienda/HomePage.jsx"
        tareas={[
          "Sección de bienvenida (hero) con el nombre de la bodega y su propuesta.",
          "Filtro por categoría leyendo ?categoria= de la URL con useSearchParams (el Navbar ya envía ese parámetro).",
          "Buscador por nombre o marca usando inventario.buscar(texto).",
          "Rejilla responsive de tarjetas de producto (pueden usar la clase .rejilla ya definida).",
          "En cada tarjeta: imagen o color, nombre, precio con formatearSoles(), estado del stock y botón de agregar.",
          "Estado vacío con <EstadoVacio /> cuando el filtro no devuelva resultados.",
        ]}
        herramientas={[
          "useInventario() → productosActivos, categorias",
          "inventario.filtrarPorCategoria(categoria)",
          "inventario.buscar(texto)",
          "formatearSoles(precio) de utils/formato",
          "aRuta.productoDetalle(id) de routes/rutas",
          "<Card>, <Badge>, <Boton>, <Cargando>, <EstadoVacio>",
        ]}
      />
    </div>
  );
}

export default HomePage;
