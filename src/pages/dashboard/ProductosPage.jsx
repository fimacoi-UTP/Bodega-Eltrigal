/**
 * ============================================================================
 * 🚧 CASCARÓN · Gestión de productos (CRUD)
 * ============================================================================
 * Ruta: /dashboard/productos · Acceso: SOLO ADMIN
 *
 * Este módulo es el CRUD completo del catálogo. Lo que se cree aquí aparece
 * automáticamente en la tienda web, porque ambos leen del mismo repositorio.
 *
 * Es el módulo donde mejor se ve el patrón Repository en acción: las cuatro
 * operaciones ya están listas en useInventario(), así que este módulo es casi
 * puro formulario y validación.
 * ==========================================================================*/

import CascaronModulo from "../../components/comunes/CascaronModulo";

export function ProductosPage() {
  return (
    <CascaronModulo
      nombre="Gestión de productos"
      descripcion="El alta, edición y baja del catálogo: qué productos vende la bodega, con su nombre, categoría, precio e imagen."
      archivo="src/pages/dashboard/ProductosPage.jsx"
      tareas={[
        "Tabla con todos los productos: nombre, categoría, marca, precio y estado activo.",
        "Botón 'Nuevo producto' que abra un <Modal> con el formulario.",
        "Formulario con nombre, descripción, categoría, marca, precio, stock inicial, stock mínimo, unidad y color.",
        "Validaciones: nombre obligatorio, precio mayor a 0, stock no negativo.",
        "Acción de editar que reutilice el mismo modal, precargado.",
        "Acción de eliminar con confirmación previa (nunca borrar de un solo clic).",
        "Interruptor para activar o desactivar un producto sin borrarlo.",
        "Buscador y filtro por categoría.",
      ]}
      herramientas={[
        "useInventario() → crearProducto(datos), actualizarProducto(id, cambios), eliminarProducto(id)",
        "useInventario() → productos, categorias",
        "<Modal>, <Input>, <Select>, <Boton>, <Badge>, <Alerta>",
        "Clases .ui-tabla y .ui-tabla-scroll de styles/base.css",
      ]}
      patron="Esta pantalla solo la ve el ADMIN. El bloqueo lo hace <RutaProtegida rol={ROLES.ADMIN}> en src/routes/AppRouter.jsx — el patrón Proxy. Prueben entrando como cajero@trigal.pe y escribiendo /dashboard/productos en la barra de direcciones: el Proxy los detiene igual."
    />
  );
}

export default ProductosPage;
