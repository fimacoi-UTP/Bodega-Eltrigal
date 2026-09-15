/**
 * ============================================================================
 * 🚧 CASCARÓN · Resumen del dashboard (panel de estadísticas)
 * ============================================================================
 * Ruta: /dashboard · Acceso: ADMIN y CAJERO
 *
 * Es la primera pantalla que ve el personal al entrar. Debe responder de un
 * vistazo: ¿cómo va el día? ¿qué se está por acabar? ¿hay pedidos pendientes?
 *
 * Los datos salen de cruzar las tres fuentes que ya existen:
 *   · useInventario()   → productos y stock
 *   · ventaRepository   → ventas de mostrador
 *   · pedidoRepository  → pedidos web
 * ==========================================================================*/

import CascaronModulo from "../../components/comunes/CascaronModulo";

export function ResumenPage() {
  return (
    <CascaronModulo
      nombre="Resumen y estadísticas"
      descripcion="El tablero de control de la bodega: ventas del día, productos por agotarse, pedidos web pendientes y los productos que más se venden."
      archivo="src/pages/dashboard/ResumenPage.jsx"
      tareas={[
        "Fila de tarjetas con los indicadores clave: ventas de hoy, total vendido, pedidos pendientes y productos bajo stock.",
        "Lista de alertas de reposición (productos con stock <= stockMinimo).",
        "Ranking de los productos más vendidos, cruzando los items de ventas y pedidos.",
        "Bandeja de últimos pedidos web con su estado.",
        "Algún gráfico simple de ventas por día (pueden dibujarlo con CSS o divs, sin librerías).",
        "Mostrar <Cargando /> mientras llegan los datos y un estado vacío si aún no hay ventas.",
      ]}
      herramientas={[
        "useInventario() → productos, categorias",
        "ventaRepository.obtenerDeHoy() y .obtenerPorRango(desde, hasta)",
        "pedidoRepository.obtenerActivos()",
        "productoRepository.obtenerBajoStock()",
        "formatearSoles(monto) y formatearFecha(fecha) de utils/formato",
        "<Card>, <CardCabecera>, <Badge>, <Cargando>, <EstadoVacio>",
      ]}
    />
  );
}

export default ResumenPage;
