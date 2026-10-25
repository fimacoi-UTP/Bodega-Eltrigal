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

import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SidebarDashboard from "./SidebarDashboard";
import { Toast } from "../ui";
import { ModalMiPerfil } from "../dashboard/ModalMiPerfil";
import { useAuth } from "../../hooks/useAuth";
import { usePedidosEnVivo } from "../../hooks/usePedidosEnVivo";
import { RUTAS } from "../../routes/rutas";
import { ETIQUETAS_ROL, ROLES } from "../../constantes";
import { formatearSoles, obtenerIniciales, clases } from "../../utils/formato";
import { urlImagen } from "../../api/apiClient";
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
  [RUTAS.DASHBOARD_USUARIOS]: "Gestión de usuarios",
};

export function LayoutDashboard() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);
  const [avatarFallidoTopbar, setAvatarFallidoTopbar] = useState(null);
  const dropdownRef = useRef(null);

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

  const esCatalogo = ubicacion.pathname === RUTAS.DASHBOARD_CATALOGO;
  const titulo = TITULOS[ubicacion.pathname] ?? "Panel de gestión";

  // Cerrar dropdown al hacer click fuera o presionar Esc
  useEffect(() => {
    if (!menuPerfilAbierto) return;

    const manejarClickFuera = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuPerfilAbierto(false);
      }
    };

    const manejarTecla = (e) => {
      if (e.key === "Escape") {
        setMenuPerfilAbierto(false);
      }
    };

    document.addEventListener("mousedown", manejarClickFuera);
    document.addEventListener("keydown", manejarTecla);

    return () => {
      document.removeEventListener("mousedown", manejarClickFuera);
      document.removeEventListener("keydown", manejarTecla);
    };
  }, [menuPerfilAbierto]);

  const alCerrarSesion = async () => {
    await cerrarSesion();
    navegar(RUTAS.INICIO);
  };

  const handleIrAPedidos = () => {
    cerrarToast();
    navegar(RUTAS.DASHBOARD_PEDIDOS);
  };

  const avatarSrc =
    usuario?.avatarUrl &&
    usuario.avatarUrl !== "null" &&
    usuario.avatarUrl !== "undefined"
      ? urlImagen(usuario.avatarUrl)
      : null;

  const rolUsuario = usuario?.rol || ROLES.CLIENTE;
  const rolClase = `panel-barra__avatar-wrap--${String(rolUsuario).toLowerCase()}`;

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
        onAbrirPerfil={() => setModalPerfilAbierto(true)}
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

            {/* Menú de usuario con Dropdown Premium */}
            {usuario && (
              <div className="panel-barra__usuario-contenedor" ref={dropdownRef}>
                <button
                  type="button"
                  className={clases(
                    "panel-barra__usuario-btn",
                    menuPerfilAbierto && "panel-barra__usuario-btn--activo",
                  )}
                  onClick={() => setMenuPerfilAbierto((prev) => !prev)}
                  aria-expanded={menuPerfilAbierto}
                  aria-haspopup="true"
                  aria-label="Menú de perfil"
                  title="Opciones de perfil y cuenta"
                >
                  <div className={clases("panel-barra__avatar-wrap", rolClase)}>
                    {avatarSrc && avatarFallidoTopbar !== avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={usuario.nombre || "Usuario"}
                        className="panel-barra__avatar-img"
                        onError={() => setAvatarFallidoTopbar(avatarSrc)}
                      />
                    ) : (
                      <span className="panel-barra__avatar-iniciales" aria-hidden="true">
                        {obtenerIniciales(usuario.nombre || usuario.email)}
                      </span>
                    )}
                  </div>

                  <div className="panel-barra__usuario-datos">
                    <span className="panel-barra__usuario-nombre">
                      {usuario.nombre || usuario.email}
                    </span>
                    <span className="panel-barra__usuario-rol">
                      {ETIQUETAS_ROL[usuario.rol] || usuario.rol}
                    </span>
                  </div>

                  <span
                    className={clases(
                      "panel-barra__chevron",
                      menuPerfilAbierto && "panel-barra__chevron--abierto",
                    )}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {/* Dropdown Premium 2.0 */}
                {menuPerfilAbierto && (
                  <div
                    className="panel-dropdown-perfil"
                    role="menu"
                    aria-label="Opciones de usuario"
                  >
                    {/* Cabecera mini con avatar, nombre y email */}
                    <div className="panel-dropdown-perfil__cabecera">
                      <div className={clases("panel-dropdown-perfil__avatar", rolClase)}>
                        {avatarSrc && avatarFallidoTopbar !== avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={usuario.nombre || "Usuario"}
                            className="panel-dropdown-perfil__avatar-img"
                          />
                        ) : (
                          <span aria-hidden="true">
                            {obtenerIniciales(usuario.nombre || usuario.email)}
                          </span>
                        )}
                      </div>
                      <div className="panel-dropdown-perfil__info">
                        <span className="panel-dropdown-perfil__nombre">
                          {usuario.nombre || "Usuario"}
                        </span>
                        <span className="panel-dropdown-perfil__email">
                          {usuario.email || usuario.correo}
                        </span>
                        <span
                          className={clases(
                            "panel-dropdown-perfil__rol-pill",
                            `panel-dropdown-perfil__rol-pill--${String(rolUsuario).toLowerCase()}`,
                          )}
                        >
                          <span
                            className="panel-dropdown-perfil__rol-punto"
                            aria-hidden="true"
                          />
                          {ETIQUETAS_ROL[usuario.rol] || usuario.rol}
                        </span>
                      </div>
                    </div>

                    <div className="panel-dropdown-perfil__separador" role="separator" />

                    {/* Opción "Mi perfil" */}
                    <button
                      type="button"
                      className="panel-dropdown-perfil__item"
                      role="menuitem"
                      onClick={() => {
                        setMenuPerfilAbierto(false);
                        setModalPerfilAbierto(true);
                      }}
                    >
                      <span className="panel-dropdown-perfil__item-icono" aria-hidden="true">
                        👤
                      </span>
                      <div className="panel-dropdown-perfil__item-textos">
                        <span className="panel-dropdown-perfil__item-titulo">
                          Mi perfil
                        </span>
                        <span className="panel-dropdown-perfil__item-subtitulo">
                          Foto, datos personales y clave
                        </span>
                      </div>
                    </button>

                    <div className="panel-dropdown-perfil__separador" role="separator" />

                    {/* Opción "Cerrar sesión" en rojo suave */}
                    <button
                      type="button"
                      className="panel-dropdown-perfil__item panel-dropdown-perfil__item--cerrar"
                      role="menuitem"
                      onClick={() => {
                        setMenuPerfilAbierto(false);
                        alCerrarSesion();
                      }}
                    >
                      <span className="panel-dropdown-perfil__item-icono" aria-hidden="true">
                        ⏻
                      </span>
                      <div className="panel-dropdown-perfil__item-textos">
                        <span className="panel-dropdown-perfil__item-titulo">
                          Cerrar sesión
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* --- Modal Mi Perfil (Staff) --- */}
        {modalPerfilAbierto && (
          <ModalMiPerfil
            abierto={modalPerfilAbierto}
            alCerrar={() => setModalPerfilAbierto(false)}
          />
        )}

        {/* --- Contenido de cada sección --- */}
        <main className={clases("panel-contenido", esCatalogo && "panel-contenido--catalogo")}>
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
