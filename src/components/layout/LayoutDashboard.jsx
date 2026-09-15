/**
 * ============================================================================
 * LayoutDashboard · Estructura del PANEL DE GESTIÓN
 * ----------------------------------------------------------------------------
 * Sidebar + barra superior + contenido. Es un layout distinto al de la tienda
 * porque el personal trabaja de otra forma: necesita navegar entre secciones
 * rápido y ver más datos en pantalla.
 *
 * Este layout SÍ está terminado. Las páginas de adentro son cascarones.
 * ==========================================================================*/

import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SidebarDashboard from "./SidebarDashboard";
import { useAuth } from "../../hooks/useAuth";
import { RUTAS } from "../../routes/rutas";
import { ETIQUETAS_ROL } from "../../constantes";
import { obtenerIniciales } from "../../utils/formato";
import "./LayoutDashboard.css";

/** Título de la barra superior según la URL. */
const TITULOS = {
  [RUTAS.DASHBOARD]: "Resumen general",
  [RUTAS.DASHBOARD_INVENTARIO]: "Inventario",
  [RUTAS.DASHBOARD_PRODUCTOS]: "Gestión de productos",
  [RUTAS.DASHBOARD_PROMOCIONES]: "Promociones",
  [RUTAS.DASHBOARD_VENTAS]: "Ventas en tienda",
};

export function LayoutDashboard() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { usuario, cerrarSesion } = useAuth();
  const ubicacion = useLocation();
  const navegar = useNavigate();

  const titulo = TITULOS[ubicacion.pathname] ?? "Panel de gestión";

  // Nota: el cajón se cierra desde el propio enlace que se toca. SidebarDashboard
  // recibe `alCerrar` y lo llama en el onClick de cada <NavLink>. Hacerlo así, en
  // el evento, es mejor que un useEffect que vigile la URL: el efecto provocaría
  // un render extra en CADA cambio de ruta, incluso en escritorio donde el cajón
  // ni siquiera existe.

  const alCerrarSesion = async () => {
    await cerrarSesion();
    navegar(RUTAS.INICIO);
  };

  return (
    <div className="layout-panel">
      {/* Fondo oscuro del cajón, solo en móvil */}
      {menuAbierto && (
        <div
          className="layout-panel__fondo"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      <SidebarDashboard abierto={menuAbierto} alCerrar={() => setMenuAbierto(false)} />

      <div className="layout-panel__principal">
        {/* --- Barra superior --- */}
        <header className="panel-barra">
          <button
            type="button"
            className="panel-barra__menu"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
          >
            <span />
            <span />
            <span />
          </button>

          <h1 className="panel-barra__titulo">{titulo}</h1>

          <div className="panel-barra__acciones">
            {usuario && (
              <div className="panel-barra__usuario">
                <span className="panel-barra__avatar" aria-hidden="true">
                  {obtenerIniciales(usuario.nombre)}
                </span>
                <div className="panel-barra__usuario-datos">
                  <span className="panel-barra__usuario-nombre">{usuario.nombre}</span>
                  <span className="panel-barra__usuario-rol">
                    {ETIQUETAS_ROL[usuario.rol]}
                  </span>
                </div>
              </div>
            )}

            <button type="button" className="panel-barra__salir" onClick={alCerrarSesion}>
              Salir
            </button>
          </div>
        </header>

        {/* --- Contenido de cada sección --- */}
        <main className="panel-contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LayoutDashboard;
