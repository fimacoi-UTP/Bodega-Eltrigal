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

import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { RUTAS } from "../../routes/rutas";
import { ROLES, ROLES_DASHBOARD, ETIQUETAS_ROL, BODEGA } from "../../constantes";
import { clases, obtenerIniciales } from "../../utils/formato";
import Logo from "./Logo";
import "./SidebarDashboard.css";

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
    a: RUTAS.DASHBOARD_INVENTARIO,
    texto: "Inventario",
    icono: "📦",
    roles: ROLES_DASHBOARD,
  },
  {
    a: RUTAS.DASHBOARD_PRODUCTOS,
    texto: "Productos",
    icono: "🏷️",
    roles: [ROLES.ADMIN], // solo el administrador
  },
  {
    a: RUTAS.DASHBOARD_PROMOCIONES,
    texto: "Promociones",
    icono: "🎁",
    roles: [ROLES.ADMIN], // solo el administrador
  },
];

export function SidebarDashboard({ abierto, alCerrar }) {
  const { usuario, tieneRol } = useAuth();

  // Filtramos el menú con el mismo `tieneRol` que usa el control de acceso.
  const seccionesVisibles = SECCIONES.filter((seccion) => tieneRol(seccion.roles));

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

      <p className="panel-lateral__etiqueta">Panel de gestión</p>

      <nav className="panel-lateral__nav" aria-label="Secciones del panel">
        {seccionesVisibles.map((seccion) => (
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
            {seccion.texto}
          </NavLink>
        ))}
      </nav>

      <div className="panel-lateral__pie">
        {usuario && (
          <div className="panel-lateral__usuario">
            <span className="panel-lateral__avatar" aria-hidden="true">
              {obtenerIniciales(usuario.nombre)}
            </span>
            <div className="panel-lateral__usuario-datos">
              <p className="panel-lateral__usuario-nombre">{usuario.nombre}</p>
              <p className="panel-lateral__usuario-rol">{ETIQUETAS_ROL[usuario.rol]}</p>
            </div>
          </div>
        )}

        <NavLink to={RUTAS.INICIO} className="panel-lateral__volver">
          ← Ver la tienda web
        </NavLink>

        <p className="panel-lateral__nota">{BODEGA.nombre}</p>
      </div>
    </aside>
  );
}

export default SidebarDashboard;
