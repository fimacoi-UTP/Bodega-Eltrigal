/**
 * ============================================================================
 * 🚧 CASCARÓN · Detalle de producto
 * ============================================================================
 * Ruta: /producto/:id
 *
 * El id de la URL se lee con `useParams()`, y el producto se obtiene del
 * inventario ya cargado (sin volver a pedir datos):
 *
 *   const { id } = useParams()
 *   const { obtenerProducto, cargando } = useInventario()
 *   const producto = obtenerProducto(id)
 *
 *   if (cargando) return <Cargando />
 *   if (!producto) return <EstadoVacio titulo="Producto no encontrado" ... />
 * ==========================================================================*/

import { useParams } from "react-router-dom";
import CascaronModulo from "../../components/comunes/CascaronModulo";
import { Badge } from "../../components/ui";

export function ProductoDetallePage() {
  // Se lee el parámetro solo para demostrar que la ruta dinámica funciona.
  const { id } = useParams();

  return (
    <div className="contenedor">
      <CascaronModulo
        nombre="Detalle de producto"
        descripcion="La ficha completa de un producto: imagen grande, descripción, precio, disponibilidad, selector de cantidad y el botón para agregarlo al carrito."
        archivo="src/pages/tienda/ProductoDetallePage.jsx"
        tareas={[
          "Leer el id de la URL con useParams() y buscar el producto con obtenerProducto(id).",
          "Manejar el caso de producto inexistente (id inválido en la URL).",
          "Mostrar imagen o color de fondo, nombre, marca, categoría y descripción.",
          "Mostrar precio con formatearSoles() y el estado del stock.",
          "Selector de cantidad que no permita pedir más de lo que hay en stock.",
          "Botón 'Agregar al carrito' (conectado al CarritoContext del módulo de carrito).",
          "Sección de productos relacionados de la misma categoría (opcional).",
        ]}
        herramientas={[
          "useParams() de react-router-dom",
          "useInventario() → obtenerProducto(id)",
          "inventario.filtrarPorCategoria(categoria) para los relacionados",
          "formatearSoles(precio) de utils/formato",
        ]}
      >
        <p className="cascaron__nota">
          Ruta dinámica funcionando · parámetro recibido:{" "}
          <Badge variante="info">id = {id}</Badge>
        </p>
      </CascaronModulo>
    </div>
  );
}

export default ProductoDetallePage;
