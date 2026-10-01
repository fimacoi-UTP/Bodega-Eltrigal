/**
 * ============================================================================
 * LayoutTienda · Estructura de la TIENDA WEB
 * ----------------------------------------------------------------------------
 * Navbar arriba + contenido + Footer abajo.
 *
 * El <Outlet /> es el hueco donde react-router mete la página que corresponda
 * a la URL. Gracias a eso, el Navbar y el Footer se montan UNA sola vez y no
 * parpadean al navegar entre páginas.
 *
 * ⚠️ Este layout SÍ está terminado. Las páginas que se muestran adentro son
 * las que están como cascarón.
 * ==========================================================================*/

import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BarraFlotanteCarrito from "./BarraFlotanteCarrito";
import { useCarrito } from "../../context/CarritoContext";
import { RUTAS } from "../../routes/rutas";
import "./LayoutTienda.css";

export function LayoutTienda() {
  const { items } = useCarrito();
  const location = useLocation();

  const cantidadTotal = items?.reduce((acc, item) => acc + (item.cantidad || 0), 0) || 0;
  const esPaginaCarritoOCheckout =
    location.pathname === RUTAS.CARRITO || location.pathname === RUTAS.CHECKOUT;
  const mostrarBarra = cantidadTotal > 0 && !esPaginaCarritoOCheckout;

  return (
    <div className={`layout-tienda ${mostrarBarra ? "layout-tienda--con-barra-flotante" : ""}`}>
      {/* Accesibilidad: permite saltarse el menú con el teclado (aparece al tabular). */}
      <a href="#contenido-principal" className="salto-contenido">
        Saltar al contenido
      </a>

      <Navbar />

      <main id="contenido-principal" className="layout-tienda__contenido">
        <Outlet />
      </main>

      <Footer />

      {mostrarBarra && <BarraFlotanteCarrito />}
    </div>
  );
}

export default LayoutTienda;
