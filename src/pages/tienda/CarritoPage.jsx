/**
 * ============================================================================
 * 🚧 CASCARÓN · Carrito de compras
 * ============================================================================
 * ⚠️ IMPORTANTE para quien tome este módulo: el carrito necesita su propio
 * contexto, porque su estado tiene que sobrevivir mientras el usuario navega
 * entre el catálogo, el detalle y el checkout.
 *CarritoContext	+	CarritoProvider:	estado	del	carrito	(agregar,	quitar,	cambiar	cantidad,	vaciar,	total).	Móntalo	en	App.jsx	junto	a	los	otros providers.
 * Creen `src/context/CarritoContext.jsx` copiando la estructura de
 * InventarioContext.jsx, y monten el provider en src/App.jsx DENTRO de
 * <InventarioProvider> (el carrito consulta precios y stock).
 *
 * 🔴 REGLA: el carrito NO descuenta stock. Agregar algo al carrito no es
 * vender. El stock se descuenta recién al confirmar la compra en el checkout,
 * con `inventario.descontarStock(items)`.
 * ==========================================================================*/

import CascaronModulo from "../../components/comunes/CascaronModulo";

export function CarritoPage() {
  return (
    <div className="contenedor">
      <CascaronModulo
        nombre="Carrito de compras"
        descripcion="Lista de lo que el cliente va a comprar, con el control de cantidades y el resumen del total antes de pasar a pagar."
        archivo="src/pages/tienda/CarritoPage.jsx"
        tareas={[
          "Crear src/context/CarritoContext.jsx con: items, agregar, quitar, cambiarCantidad, vaciar, cantidadTotal y subtotal.",
          "Montar <CarritoProvider> en src/App.jsx, dentro de <InventarioProvider>.",
          "Crear el hook src/hooks/useCarrito.js siguiendo el molde de useInventario.js.",
          "Listar los items con su imagen, nombre, precio unitario y subtotal.",
          "Controles de + / − y botón para eliminar, validando contra el stock disponible.",
          "Resumen con subtotal y el botón 'Continuar compra' que lleva a /checkout.",
          "Estado vacío con <EstadoVacio /> y enlace de vuelta al catálogo.",
          "Activar el contador del carrito en el Navbar (ya está el TODO marcado ahí).",
        ]}
        herramientas={[
          "useInventario() → obtenerProducto(id) para validar stock y precio",
          "formatearSoles(monto) de utils/formato",
          "<Card>, <Boton>, <EstadoVacio>, <Badge>",
          "RUTAS.CHECKOUT de routes/rutas",
        ]}
        patron="El carrito usa Context + useState, o sea el patrón Observer que React ya resuelve: cuando cambian los items, el Navbar, la página del carrito y el checkout se re-renderizan solos. No implementen un Observer manual."
      />
    </div>
  );
}

export default CarritoPage;
