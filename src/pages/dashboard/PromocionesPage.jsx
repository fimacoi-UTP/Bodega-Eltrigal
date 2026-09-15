/**
 * ============================================================================
 * 🚧 CASCARÓN · Gestión de promociones
 * ============================================================================
 * Ruta: /dashboard/promociones · Acceso: SOLO ADMIN
 *
 * 🪝 PATRÓN DECORATOR: el gancho está documentado con código de ejemplo en
 *    src/repositories/promocionRepository.js
 *
 * El problema que resuelve: sobre un mismo producto pueden caer varias promos
 * a la vez, y cada una modifica el precio. Con Decorator, cada promoción
 * envuelve el cálculo anterior sin saber de las otras.
 * ==========================================================================*/

import CascaronModulo from "../../components/comunes/CascaronModulo";

export function PromocionesPage() {
  return (
    <CascaronModulo
      nombre="Promociones y descuentos"
      descripcion="Las ofertas de la bodega: descuentos por producto o por categoría, con su vigencia, que la tienda web aplica automáticamente."
      archivo="src/pages/dashboard/PromocionesPage.jsx"
      tareas={[
        "Lista de promociones con su tipo, valor, vigencia y estado.",
        "Formulario en <Modal> para crear y editar promociones.",
        "Campos: nombre, tipo de descuento, valor, a qué aplica (producto / categoría / todo), fecha desde y hasta.",
        "Validar que la fecha 'hasta' sea posterior a la fecha 'desde'.",
        "Implementar el patrón Decorator para el cálculo del precio final.",
        "Vista previa que muestre cómo queda el precio de un producto con la promo aplicada.",
        "Distinguir visualmente las promociones vigentes, programadas y vencidas.",
        "Conectar el resultado con el catálogo para que muestre el precio con descuento.",
      ]}
      herramientas={[
        "promocionRepository → crear, actualizar, eliminar, obtenerVigentes, obtenerParaProducto",
        "useInventario() → productos, categorias (para elegir el objetivo de la promo)",
        "formatearSoles(monto) y formatearFecha(fecha) de utils/formato",
        "<Modal>, <Input>, <Select>, <Badge>, <Boton>, <EstadoVacio>",
      ]}
      patron="DECORATOR en el cálculo de precios. Cada promoción envuelve el precio anterior y le agrega su descuento, sin saber qué otras promociones existen. Apilar promos se vuelve un reduce() y agregar un tipo nuevo no obliga a tocar el código que ya funciona."
    />
  );
}

export default PromocionesPage;
