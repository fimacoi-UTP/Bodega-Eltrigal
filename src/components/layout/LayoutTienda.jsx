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

import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./LayoutTienda.css";

export function LayoutTienda() {
  return (
    <div className="layout-tienda">
      {/* Accesibilidad: permite saltarse el menú con el teclado (aparece al tabular). */}
      <a href="#contenido-principal" className="salto-contenido">
        Saltar al contenido
      </a>

      <Navbar />

      <main id="contenido-principal" className="layout-tienda__contenido">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default LayoutTienda;
