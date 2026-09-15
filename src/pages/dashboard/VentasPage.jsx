/**
 * ============================================================================
 * 🚧 CASCARÓN · Registro de ventas presenciales
 * ============================================================================
 * Ruta: /dashboard/ventas · Acceso: ADMIN y CAJERO
 *
 * Es el "punto de venta" de la bodega: el cajero arma la compra del cliente
 * que está en el mostrador, cobra y entrega su comprobante.
 *
 * 🥇 AQUÍ SE CIERRA LA REGLA DE ORO DEL LADO FÍSICO.
 * Igual que el checkout web, este módulo DEBE llamar a
 * `inventario.descontarStock(items)`. Si no lo hace, la tienda web va a seguir
 * ofreciendo productos que ya se vendieron en el mostrador.
 *
 * ORDEN OBLIGATORIO:
 *   1. Armar los items de la venta.
 *   2. await inventario.descontarStock(items)   ← primero el stock
 *   3. await ventaRepository.crear({ ... })     ← después el registro
 *   4. Mostrar el ticket y limpiar para la siguiente venta.
 * ==========================================================================*/

import CascaronModulo from "../../components/comunes/CascaronModulo";

export function VentasPage() {
  return (
    <CascaronModulo
      nombre="Ventas en tienda"
      descripcion="El punto de venta del mostrador: el cajero busca productos, arma la compra, cobra y registra la venta descontando el stock."
      archivo="src/pages/dashboard/VentasPage.jsx"
      tareas={[
        "Buscador rápido de productos por nombre (pensado para usarse con el cliente esperando).",
        "Detalle de la venta en curso: producto, cantidad, precio unitario y subtotal.",
        "Cálculo automático del total.",
        "Selección del medio de pago y cálculo del vuelto si es en efectivo.",
        "Al confirmar: descontarStock(items) y DESPUÉS ventaRepository.crear({ ... }).",
        "Guardar en la venta quién la hizo: cajeroId y cajeroNombre desde useAuth().",
        "Mostrar el comprobante o ticket de la venta registrada.",
        "Historial de ventas del día con la opción de anular (ventaRepository.anular).",
        "Al anular, devolver el stock con inventario.reponerStock(items).",
        "Manejar el error de stock insuficiente con <Alerta variante='peligro'>.",
      ]}
      herramientas={[
        "useInventario() → buscar(texto), descontarStock(items)  🥇, reponerStock(items)",
        "ventaRepository → crear, obtenerDeHoy, obtenerPorCajero, anular",
        "useAuth() → usuario, para registrar quién cobró",
        "METODOS_PAGO de src/constantes.js",
        "formatearSoles(monto) y formatearFecha(fecha, { conHora: true })",
        "<Input>, <Boton>, <Badge>, <Alerta>, <Modal>, <EstadoVacio>",
      ]}
      patron="Este módulo y el checkout de la tienda web hacen lo mismo con el stock, y los dos usan el mismo descontarStock(). Esa es la prueba de que la fuente de datos es única: no hay dos inventarios que después haya que cuadrar."
    />
  );
}

export default VentasPage;
