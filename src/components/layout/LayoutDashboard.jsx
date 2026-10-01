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
import { Toast } from "../ui";
import { useAuth } from "../../hooks/useAuth";
import { usePedidosEnVivo } from "../../hooks/usePedidosEnVivo";
import { RUTAS } from "../../routes/rutas";
import { ETIQUETAS_ROL } from "../../constantes";
import { formatearSoles, obtenerIniciales } from "../../utils/formato";
import "./LayoutDashboard.css";

/** Título de la barra superior según la URL. */
const TITULOS = {
  [RUTAS.DASHBOARD]: "Resumen general",
  [RUTAS.DASHBOARD_CATALOGO]: "Catálogo y existencias",
  [RUTAS.DASHBOARD_INVENTARIO]: "Inventario",
  [RUTAS.DASHBOARD_PRODUCTOS]: "Gestión de productos",
  [RUTAS.DASHBOARD_PROMOCIONES]: "Promociones",
  [RUTAS.DASHBOARD_VENTAS]: "Ventas en tienda",
  [RUTAS.DASHBOARD_PEDIDOS]: "Pedidos web",
};

export function LayoutDashboard() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { usuario, cerrarSesion } = useAuth();
  const {
    pedidosPendientesCount,
    ultimoPedidoNuevo,
    cerrarToast,
    sonidoHabilitado,
    toggleSonido,
  } = usePedidosEnVivo();

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

  const handleIrAPedidos = () => {
    cerrarToast();
    navegar(RUTAS.DASHBOARD_PEDIDOS);
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

      <SidebarDashboard
        abierto={menuAbierto}
        alCerrar={() => setMenuAbierto(false)}
        pedidosPendientes={pedidosPendientesCount}
      />

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
            {/* Control opcional de alertas sonoras */}
            <button
              type="button"
              className="panel-barra__sonido"
              onClick={toggleSonido}
              aria-label={
                sonidoHabilitado
                  ? "Silenciar alertas sonoras"
                  : "Activar alertas sonoras"
              }
              title={
                sonidoHabilitado
                  ? "Alertas sonoras activadas (clic para silenciar)"
                  : "Alertas sonoras silenciadas (clic para activar)"
              }
            >
              <span aria-hidden="true">{sonidoHabilitado ? "🔔" : "🔕"}</span>
            </button>

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

      {/* --- Toast emergente en vivo al recibir pedido web --- */}
      {ultimoPedidoNuevo && (
        <Toast
          visible={true}
          onCerrar={cerrarToast}
          onClick={handleIrAPedidos}
          variante="marca"
          icono="🛍️"
          titulo="¡Nuevo pedido web recibido!"
          accionTexto="Ver pedidos web →"
        >
          <p>
            Pedido <strong>#{ultimoPedidoNuevo.id}</strong>
            {ultimoPedidoNuevo.clienteNombre && ` · ${ultimoPedidoNuevo.clienteNombre}`}
          </p>
          <p className="layout-panel__toast-total">
            Total: <strong>{formatearSoles(ultimoPedidoNuevo.total)}</strong>
          </p>
        </Toast>
      )}
    </div>
  );
}

export default LayoutDashboard;
