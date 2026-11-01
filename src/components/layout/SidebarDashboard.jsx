/**
 * ============================================================================
 * SidebarDashboard · Menú lateral del panel de gestión
 * ----------------------------------------------------------------------------
 * Los enlaces se filtran según el rol del usuario: el CAJERO no ve "Productos"
 * ni "Promociones" porque no puede entrar ahí.
 *
 * ⚠️ Esto es solo COMODIDAD VISUAL (no mostrarle puertas cerradas al usuario).
 * El bloqueo real lo hace <RutaProtegida> en src/routes/AppRouter.jsx: si el
 * cajero escribe /dashboard/productos a mano en la barra de direcciones, el
 * Proxy lo detiene igual. Ocultar un enlace NUNCA es un control de acceso.
 * ==========================================================================*/

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { RUTAS } from "../../routes/rutas";
import { ROLES, ROLES_DASHBOARD, ETIQUETAS_ROL, BODEGA } from "../../constantes";
import { clases, obtenerIniciales } from "../../utils/formato";
import { urlImagen } from "../../api/apiClient";
import Logo from "./Logo";
import "./SidebarDashboard.css";

/**
 * Normaliza la URL del avatar:
 * Si es null, undefined, o el string "null" / "undefined", devuelve null.
 */
function normalizarAvatarUrl(url) {
  if (!url || typeof url !== "string") return null;
  const limpia = url.trim();
  if (limpia === "" || limpia === "null" || limpia === "undefined") {
    return null;
  }
  return urlImagen(limpia);
}

/**
 * Menú del dashboard.
 * `roles` indica quién puede ver (y entrar a) cada sección.
 */
const SECCIONES = [
  {
    a: RUTAS.DASHBOARD,
    texto: "Resumen",
    icono: "▤",
    exacto: true,
    roles: ROLES_DASHBOARD, // ADMIN y CAJERO
  },
  {
    a: RUTAS.DASHBOARD_VENTAS,
    texto: "Ventas",
    icono: "🧾",
    roles: ROLES_DASHBOARD,
  },
  {
    a: RUTAS.DASHBOARD_PEDIDOS,
    texto: "Pedidos web",
    icono: "🛍️",
    roles: ROLES_DASHBOARD,
  },
  {
    a: RUTAS.DASHBOARD_CATALOGO,
    texto: "Catálogo",
    icono: "📦",
    roles: ROLES_DASHBOARD,
  },
  {
    a: RUTAS.DASHBOARD_PROMOCIONES,
    texto: "Promociones",
    icono: "🎁",
    roles: [ROLES.ADMIN], // solo el administrador
  },
  {
    a: RUTAS.DASHBOARD_USUARIOS,
    texto: "Gestión de usuarios",
    icono: "👥",
    roles: [ROLES.ADMIN], // solo el administrador
  },
  {
    a: RUTAS.DASHBOARD_RECLAMOS,
    texto: "Libro de Reclamaciones",
    icono: "⚖️",
    roles: [ROLES.ADMIN], // solo el administrador
  },
];

export function SidebarDashboard({
  abierto,
  alCerrar,
  pedidosPendientes = 0,
  onAbrirPerfil,
}) {
  const { usuario, tieneRol } = useAuth();
  const [avatarFallido, setAvatarFallido] = useState(null);

  // Filtramos el menú con el mismo `tieneRol` que usa el control de acceso.
  const seccionesVisibles = SECCIONES.filter((seccion) => tieneRol(seccion.roles));

  const avatarSrc = normalizarAvatarUrl(usuario?.avatarUrl);
  const rolUsuario = usuario?.rol;
  const rolClase = `panel-lateral__avatar-wrap--${String(rolUsuario || "").toLowerCase()}`;

  // Nota: aquí NO marcamos el <aside> como `inert` cuando está cerrado, a
  // diferencia del cajón de la tienda. En escritorio este sidebar está siempre
  // visible aunque `abierto` sea false, así que volverlo inerte lo dejaría
  // inutilizable justo donde más se usa.
  return (
    <aside className={clases("panel-lateral", abierto && "panel-lateral--abierto")}>
      <div className="panel-lateral__cabecera">
        <Logo tamano="sm" destino={RUTAS.DASHBOARD} />
        <button
          type="button"
          className="panel-lateral__cerrar"
          onClick={alCerrar}
          aria-label="Cerrar menú"
        >
          ✕
        </button>
      </div>

      {/* Tarjeta de usuario Staff en la parte superior (clickeable -> abre Mi Perfil) */}
      {usuario && (
        <button
          type="button"
          className="panel-lateral__usuario-tarjeta"
          onClick={() => {
            alCerrar?.();
            onAbrirPerfil?.();
          }}
          aria-label={`Mi perfil: ${usuario.nombre || usuario.email}`}
          title="Ver y editar mi perfil"
        >
          <div className={clases("panel-lateral__avatar-wrap", rolClase)}>
            {avatarSrc && avatarFallido !== avatarSrc ? (
              <img
                src={avatarSrc}
                alt={usuario.nombre || "Usuario"}
                className="panel-lateral__avatar-img"
                onError={() => setAvatarFallido(avatarSrc)}
              />
            ) : (
              <span className="panel-lateral__avatar-iniciales" aria-hidden="true">
                {obtenerIniciales(usuario.nombre || usuario.email)}
              </span>
            )}
          </div>

          <div className="panel-lateral__usuario-textos">
            <span className="panel-lateral__usuario-nombre">
              {usuario.nombre || usuario.email}
            </span>
            <span
              className={clases(
                "panel-lateral__rol-pill",
                `panel-lateral__rol-pill--${String(rolUsuario || "").toLowerCase()}`,
              )}
            >
              <span className="panel-lateral__rol-punto" aria-hidden="true" />
              {ETIQUETAS_ROL[usuario.rol] || usuario.rol}
            </span>
          </div>

          <span className="panel-lateral__usuario-flecha" aria-hidden="true">
            ›
          </span>
        </button>
      )}

      <p className="panel-lateral__etiqueta">Panel de gestión</p>

      <nav className="panel-lateral__nav" aria-label="Secciones del panel">
        {seccionesVisibles.map((seccion) => {
          const esPedidos = seccion.a === RUTAS.DASHBOARD_PEDIDOS;
          const hayPendientes = esPedidos && pedidosPendientes > 0;

          return (
            <NavLink
              key={seccion.a}
              to={seccion.a}
              end={seccion.exacto}
              onClick={alCerrar}
              className={({ isActive }) =>
                clases("panel-lateral__enlace", isActive && "panel-lateral__enlace--activo")
              }
            >
              <span className="panel-lateral__icono" aria-hidden="true">
                {seccion.icono}
              </span>
              <span className="panel-lateral__texto">{seccion.texto}</span>

              {hayPendientes && (
                <span
                  className="panel-lateral__badge-pedidos"
                  title={`${pedidosPendientes} pedidos pendientes`}
                  aria-label={`${pedidosPendientes} pedidos pendientes`}
                >
                  {pedidosPendientes}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="panel-lateral__pie">
        <NavLink to={RUTAS.INICIO} className="panel-lateral__volver">
          ← Ver la tienda web
        </NavLink>

        <p className="panel-lateral__nota">{BODEGA.nombre}</p>
      </div>
    </aside>
  );
}

export default SidebarDashboard;
