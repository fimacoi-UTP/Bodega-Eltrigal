/**
 * ============================================================================
 * 🚧 CASCARÓN · Gestión de inventario
 * ============================================================================
 * Ruta: /dashboard/inventario · Acceso: ADMIN y CAJERO
 *
 * OJO con la diferencia entre este módulo y el de Productos:
 *   · INVENTARIO (aquí)  → controla CUÁNTO hay. Entradas, salidas, mermas.
 *   · PRODUCTOS          → controla QUÉ se vende. Alta, precio, categoría.
 *
 * Por eso aquí se usa `ajustarStock(id, delta)` y no `actualizarProducto`.
 * Pásenle un delta positivo para una entrada de mercadería y uno negativo para
 * una merma. Nunca escriban el stock a mano con actualizarProducto: se
 * perderían los ajustes que otro haga al mismo tiempo.
 * ==========================================================================*/

import CascaronModulo from "../../components/comunes/CascaronModulo";

export function InventarioPage() {
  return (
    <CascaronModulo
      nombre="Gestión de inventario"
      descripcion="El control de existencias del almacén: cuánto hay de cada producto, qué está por agotarse y el registro de entradas y salidas."
      archivo="src/pages/dashboard/InventarioPage.jsx"
      tareas={[
        "Tabla de productos con stock actual, stock mínimo y estado (usen la clase .ui-tabla dentro de .ui-tabla-scroll).",
        "Semáforo visual con <Badge>: verde si hay stock, ámbar si está en el mínimo, rojo si está agotado.",
        "Filtro por categoría y buscador por nombre.",
        "Filtro rápido de 'solo productos bajo stock'.",
        "Acción de ingreso de mercadería con ajustarStock(id, +cantidad).",
        "Acción de registro de merma con ajustarStock(id, -cantidad).",
        "Usar <Modal> para el formulario de ajuste.",
        "Verificar que la tabla se pueda desplazar horizontalmente en celular.",
      ]}
      herramientas={[
        "useInventario() → productos, ajustarStock(id, delta), categorias",
        "productoRepository.obtenerBajoStock()",
        "Clases .ui-tabla y .ui-tabla-scroll de styles/base.css",
        "<Modal>, <Input>, <Select>, <Badge>, <Boton>",
      ]}
      patron="Fíjense en que aquí NO se toca localStorage ni el repositorio directamente: todo pasa por useInventario(). Eso es el patrón Facade funcionando. Gracias a eso, cuando el stock cambie aquí, la tienda web se entera sola."
    />
  );
}

export default InventarioPage;
