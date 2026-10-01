/**
 * ============================================================================
 * BarraFlotanteCarrito · Barra flotante de carrito para vista móvil
 * ----------------------------------------------------------------------------
 * Aparece en la parte inferior de la pantalla en dispositivos móviles cuando el
 * carrito tiene al menos 1 producto. Permite ver la cantidad acumulada, el total
 * en soles y navegar directamente a la página del carrito con un solo toque.
 *
 * Se oculta automáticamente en pantallas de escritorio (donde el carrito es
 * accesible desde el navbar) y en las vistas de carrito y checkout.
 * ==========================================================================*/

import { Link } from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import { RUTAS } from "../../routes/rutas";
import { formatearSoles } from "../../utils/formato";
import "./BarraFlotanteCarrito.css";

export function BarraFlotanteCarrito() {
  const { items, total } = useCarrito();

  const cantidadTotal = items?.reduce((acc, item) => acc + (item.cantidad || 0), 0) || 0;

  if (cantidadTotal === 0) return null;

  const textoProductos =
    cantidadTotal === 1 ? "1 producto" : `${cantidadTotal} productos`;

  return (
    <aside
      className="barra-flotante-carrito"
      aria-label="Acceso rápido al carrito de compras"
    >
      <Link
        to={RUTAS.CARRITO}
        className="barra-flotante-carrito__caja"
        aria-label={`Ver carrito: ${textoProductos}, total ${formatearSoles(total)}`}
      >
        <div className="barra-flotante-carrito__info">
          <span className="barra-flotante-carrito__icono" aria-hidden="true">
            🛒
          </span>
          <div className="barra-flotante-carrito__textos">
            <span className="barra-flotante-carrito__conteo">{textoProductos}</span>
            <span className="barra-flotante-carrito__separador" aria-hidden="true">
              ·
            </span>
            <span className="barra-flotante-carrito__total">{formatearSoles(total)}</span>
          </div>
        </div>

        <span className="barra-flotante-carrito__accion">
          <span>Ver carrito</span>
          <span className="barra-flotante-carrito__flecha" aria-hidden="true">
            →
          </span>
        </span>
      </Link>
    </aside>
  );
}

export default BarraFlotanteCarrito;
