/**
 * ============================================================================
 * 🚧 CASCARÓN · Checkout (pago y entrega)
 * ============================================================================
 * Este es el módulo MÁS DELICADO del proyecto, porque es donde se cierra la
 * regla de oro: aquí una compra web se convierte en menos stock para todos.
 *
 * ORDEN OBLIGATORIO al confirmar la compra:
 *
 *   1. Validar el formulario (entrega, dirección si es delivery, pago).
 *   2. Cobrar con la estrategia de pago elegida.        ← patrón Strategy
 *   3. await inventario.descontarStock(items)           ← 🥇 REGLA DE ORO
 *   4. await pedidoRepository.crear({ ... })
 *   5. Vaciar el carrito y mostrar la confirmación.
 *
 * El paso 3 va ANTES del 4 a propósito: si no hay stock suficiente,
 * descontarStock lanza un error y el pedido NO se llega a registrar. Si lo
 * hicieran al revés, quedaría un pedido guardado que la bodega no puede
 * cumplir.
 *
 * 🪝 PATRÓN STRATEGY: ver el gancho documentado con código de ejemplo en
 *    src/constantes.js → METODOS_PAGO
 * ==========================================================================*/

import CascaronModulo from "../../components/comunes/CascaronModulo";

export function CheckoutPage() {
  return (
    <div className="contenedor">
      <CascaronModulo
        nombre="Checkout — pago y entrega"
        descripcion="El paso final de la compra: datos del cliente, elección entre recojo en tienda o delivery, medio de pago y confirmación del pedido."
        archivo="src/pages/tienda/CheckoutPage.jsx"
        tareas={[
          "Formulario con los datos del cliente (prellenarlo con useAuth() si ya inició sesión).",
          "Elección del tipo de entrega usando TIPOS_ENTREGA: recojo en tienda o delivery.",
          "Si es delivery: pedir dirección y sumar el costo de envío al total.",
          "Selección del medio de pago usando METODOS_PAGO (efectivo, Yape, Plin, tarjeta).",
          "Implementar el patrón Strategy: una estrategia por medio de pago, con la misma interfaz.",
          "Al confirmar: descontarStock(items) ANTES de crear el pedido.",
          "Registrar el pedido con pedidoRepository.crear({ ... }).",
          "Vaciar el carrito y mostrar la pantalla de confirmación con el número de pedido.",
          "Manejar el error de stock insuficiente mostrando el mensaje con <Alerta variante='peligro'>.",
        ]}
        herramientas={[
          "useInventario() → descontarStock(items)  🥇",
          "pedidoRepository.crear(datos) de repositories",
          "useAuth() → usuario, para prellenar los datos",
          "TIPOS_ENTREGA, METODOS_PAGO, ESTADOS_PEDIDO de src/constantes.js",
          "formatearSoles(monto) de utils/formato",
          "<Input>, <Select>, <Boton>, <Alerta>, <Card>",
        ]}
        patron="STRATEGY en los medios de pago. Cada método (efectivo, Yape, Plin, tarjeta) es una estrategia independiente con la misma interfaz: validar(datos) y procesar(monto, datos). El checkout solo llama a la estrategia elegida, sin un solo if por método. Agregar un medio de pago nuevo = crear un archivo, sin tocar el checkout."
      />
    </div>
  );
}

export default CheckoutPage;
