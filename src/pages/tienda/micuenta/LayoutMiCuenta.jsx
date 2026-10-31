import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { RUTAS } from "../../../routes/rutas";
import { obtenerIniciales } from "../../../utils/formato";
import { urlImagen } from "../../../api/apiClient";
import { pedidosApi } from "../../../api/pedidosApi";
import "./LayoutMiCuenta.css";

const PESTANAS = [
  { ruta: RUTAS.MI_CUENTA_PEDIDOS, etiqueta: "Mis Pedidos", icono: "📦" },
  { ruta: RUTAS.MI_CUENTA_PROMOCIONES, etiqueta: "Mis Promociones", icono: "🏷️" },
  { ruta: RUTAS.MI_CUENTA_DIRECCIONES, etiqueta: "Direcciones", icono: "📍" },
  { ruta: RUTAS.MI_CUENTA_DESPENSA, etiqueta: "Mi Despensa", icono: "🛒" },
  { ruta: RUTAS.MI_CUENTA_PERFIL, etiqueta: "Datos y Seguridad", icono: "👤" },
];

/**
 * ============================================================================
 * LayoutMiCuenta · Panel de gestión para clientes autenticados
 * ----------------------------------------------------------------------------
 * Sidebar con pestañas y área principal para Mis Pedidos, Direcciones, etc.
 * ==========================================================================*/
export function LayoutMiCuenta() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [errorPedidos, setErrorPedidos] = useState(null);

  const refrescarPedidos = useCallback(async () => {
    setCargandoPedidos(true);
    try {
      const data = await pedidosApi.obtenerMios();
      setPedidos(Array.isArray(data) ? data : []);
      setErrorPedidos(null);
    } catch (err) {
      setErrorPedidos(err?.message || "Error al cargar tus pedidos");
    } finally {
      setCargandoPedidos(false);
    }
  }, []);

  useEffect(() => {
    let cancelado = false;

    pedidosApi
      .obtenerMios()
      .then((data) => {
        if (!cancelado) {
          setPedidos(Array.isArray(data) ? data : []);
          setErrorPedidos(null);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setErrorPedidos(err?.message || "Error al cargar tus pedidos");
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoPedidos(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const nombreMostrar =
    usuario?.nombres
      ? `${usuario.nombres} ${usuario?.apellidos ?? ""}`.trim()
      : (usuario?.nombre || "Mi Cuenta");

  const primerNombre =
    (usuario?.nombres || usuario?.nombre || "")
      .trim()
      .split(/\s+/)[0] || "Casero";

  return (
    <div className="contenedor seccion mi-cuenta-layout">
      {/* ==================== CARNET DE CASERO ==================== */}
      <header className="mi-cuenta-carnet">
        <div className="mi-cuenta-carnet__portada" aria-hidden="true">
          <svg
            className="mi-cuenta-carnet__espigas"
            viewBox="0 0 260 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M180 110 C185 75, 205 45, 235 15 M195 80 C202 72, 215 70, 222 75 M205 60 C214 52, 228 52, 235 58 M215 40 C224 32, 238 32, 245 38 M155 110 C162 82, 175 60, 195 40 M165 88 C173 82, 185 82, 190 88 M178 68 C186 62, 196 62, 202 68 M130 110 C140 88, 150 72, 160 55"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="mi-cuenta-carnet__cuerpo">
          <div className="mi-cuenta-carnet__avatar-envoltorio">
            {usuario?.avatarUrl ? (
              <img
                src={urlImagen(usuario.avatarUrl)}
                alt={nombreMostrar}
                className="mi-cuenta-avatar mi-cuenta-avatar--foto"
              />
            ) : (
              <div className="mi-cuenta-avatar serif" aria-hidden="true">
                {obtenerIniciales(nombreMostrar)}
              </div>
            )}
          </div>

          <div className="mi-cuenta-carnet__info">
            <div className="mi-cuenta-carnet__fila-superior">
              <span className="mi-cuenta-saludo">Hola de nuevo, {primerNombre}</span>
              <span className="mi-cuenta-chip-casero">
                <span className="mi-cuenta-chip-casero__icono" aria-hidden="true">🌾</span> Casero de El Trigal
              </span>
            </div>

            <h1 className="mi-cuenta-nombre serif">{nombreMostrar}</h1>
            <p className="mi-cuenta-correo">{usuario?.email || usuario?.correo || ""}</p>
          </div>
        </div>
      </header>

      <div className="mi-cuenta-grid">
        <aside className="mi-cuenta-sidebar">
          <nav className="mi-cuenta-nav" aria-label="Navegación de mi cuenta">
            {PESTANAS.map((pestana) => (
              <NavLink
                key={pestana.ruta}
                to={pestana.ruta}
                className={({ isActive }) =>
                  `mi-cuenta-tab ${isActive ? "mi-cuenta-tab--activo" : ""}`
                }
              >
                <span className="mi-cuenta-tab__icono" aria-hidden="true">
                  {pestana.icono}
                </span>
                <span className="mi-cuenta-tab__texto">{pestana.etiqueta}</span>
                {pestana.ruta === RUTAS.MI_CUENTA_PEDIDOS && !cargandoPedidos && (
                  <span className="mi-cuenta-tab__badge">{pedidos.length}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="mi-cuenta-contenido">
          <Outlet context={{ pedidos, cargandoPedidos, errorPedidos, refrescarPedidos }} />
        </main>
      </div>
    </div>
  );
}

export default LayoutMiCuenta;
