/**
 * ============================================================================
 * Navbar · Barra superior de la TIENDA WEB
 * ----------------------------------------------------------------------------
 * Esta barra SÍ funciona de verdad (no es un cascarón):
 *   · Menú lateral en móvil que abre, cierra y se cierra solo al navegar.
 *   · Categorías traídas del inventario real (useInventario).
 *   · Estado de sesión real (useAuth): entrar, salir, y acceso al dashboard
 *     solo si el rol lo permite.
 * ==========================================================================*/

import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useInventario } from "../../hooks/useInventario";
import { Badge } from "../ui";
import Logo from "./Logo";
import { RUTAS, aRuta } from "../../routes/rutas";
import { ETIQUETAS_ROL } from "../../constantes";
import { clases, obtenerIniciales } from "../../utils/formato";
import "./Navbar.css";

/** Enlaces fijos de la tienda. */
const ENLACES = [
  { a: RUTAS.INICIO, texto: "Catálogo", exacto: true },
  { a: RUTAS.NOSOTROS, texto: "Nosotros" },
  { a: RUTAS.UBICACION, texto: "Ubicación" },
];

export function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { usuario, estaAutenticado, esPersonal, cerrarSesion } = useAuth();
  const { categorias } = useInventario();
  const navegar = useNavigate();

  /**
   * Cierra el cajón móvil. Se llama desde el onClick de cada enlace de adentro.
   *
   * Lo hacemos en el evento y no con un useEffect que vigile la URL porque el
   * efecto obligaría a un render extra en CADA cambio de página, incluso en
   * escritorio, donde el cajón ni siquiera se muestra.
   */
  const cerrarMenu = () => setMenuAbierto(false);

  // Bloqueamos el scroll del fondo mientras el menú está abierto.
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  const alCerrarSesion = async () => {
    await cerrarSesion();
    navegar(RUTAS.INICIO);
  };

  return (
    <>
      {/* Cinta superior: horario y aviso de delivery */}
      <div className="cinta">
        <div className="contenedor cinta__contenido">
          <span>🚚 Delivery en Piura · Pedidos hasta las 9:00 p.m.</span>
          <span className="cinta__extra">📞 969 000 000</span>
        </div>
      </div>

      <header className="navbar">
        <div className="contenedor navbar__contenido">
          {/* --- Botón hamburguesa (solo móvil) --- */}
          <button
            type="button"
            className="navbar__hamburguesa"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            <span className={clases("navbar__icono-menu", menuAbierto && "navbar__icono-menu--x")}>
              <span />
              <span />
              <span />
            </span>
          </button>

          <Logo />

          {/* --- Navegación de escritorio --- */}
          <nav className="navbar__nav" aria-label="Navegación principal">
            {ENLACES.map((enlace) => (
              <NavLink
                key={enlace.a}
                to={enlace.a}
                end={enlace.exacto}
                className={({ isActive }) =>
                  clases("navbar__enlace", isActive && "navbar__enlace--activo")
                }
              >
                {enlace.texto}
              </NavLink>
            ))}
          </nav>

          {/* --- Acciones de la derecha --- */}
          <div className="navbar__acciones">
            {/* Carrito.
                TODO rama carrito: cuando exista el CarritoContext, mostrar aquí
                el contador de items:
                  {cantidadTotal > 0 && <span className="navbar__contador">{cantidadTotal}</span>} */}
            <Link to={RUTAS.CARRITO} className="navbar__accion" aria-label="Ver carrito">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L20 8H6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
                <circle cx="17" cy="20" r="1.4" fill="currentColor" />
              </svg>
            </Link>

            {/* Sesión */}
            {estaAutenticado ? (
              <div className="navbar__usuario">
                <span className="navbar__avatar" aria-hidden="true">
                  {obtenerIniciales(usuario.nombre)}
                </span>

                <div className="navbar__usuario-datos">
                  <span className="navbar__usuario-nombre">
                    {usuario.nombre.split(" ")[0]}
                  </span>
                  <span className="navbar__usuario-rol">{ETIQUETAS_ROL[usuario.rol]}</span>
                </div>

                {/* El acceso al dashboard solo se muestra si el rol lo permite.
                    Ojo: esto es cosmética. Quien realmente bloquea el acceso es
                    <RutaProtegida>. */}
                {esPersonal && (
                  <Link to={RUTAS.DASHBOARD} className="navbar__enlace-panel">
                    Panel
                  </Link>
                )}

                <button
                  type="button"
                  className="navbar__salir"
                  onClick={alCerrarSesion}
                  aria-label="Cerrar sesión"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link to={RUTAS.LOGIN} className="navbar__ingresar">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ==================== MENÚ MÓVIL (cajón lateral) ==================== */}
      {menuAbierto && (
        <div
          className="cajon__fondo"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="menu-movil"
        className={clases("cajon", menuAbierto && "cajon--abierto")}
        // Cerrado, el cajón sigue en el DOM pero fuera de pantalla: `inert` evita
        // que se pueda llegar a sus enlaces con el tabulador.
        inert={!menuAbierto || undefined}
      >
        <div className="cajon__cabecera">
          <Logo tamano="sm" onClick={cerrarMenu} />
          <button
            type="button"
            className="cajon__cerrar"
            onClick={cerrarMenu}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="cajon__nav" aria-label="Navegación móvil">
          {ENLACES.map((enlace) => (
            <NavLink
              key={enlace.a}
              to={enlace.a}
              end={enlace.exacto}
              onClick={cerrarMenu}
              className={({ isActive }) =>
                clases("cajon__enlace", isActive && "cajon__enlace--activo")
              }
            >
              {enlace.texto}
            </NavLink>
          ))}
          <NavLink to={RUTAS.CARRITO} className="cajon__enlace" onClick={cerrarMenu}>
            Mi carrito
          </NavLink>
        </nav>

        {/* Categorías reales, leídas del inventario.
            TODO rama catálogo: la página de inicio debe leer ?categoria= de la
            URL (useSearchParams) y filtrar el catálogo con
            inventario.filtrarPorCategoria(categoria). */}
        {categorias.length > 0 && (
          <div className="cajon__seccion">
            <p className="cajon__titulo-seccion">Categorías</p>
            <div className="cajon__categorias">
              {categorias.map((categoria) => (
                <Link
                  key={categoria}
                  to={aRuta.inicioPorCategoria(categoria)}
                  className="cajon__categoria"
                  onClick={cerrarMenu}
                >
                  {categoria}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="cajon__pie">
          {estaAutenticado ? (
            <>
              <div className="cajon__usuario">
                <span className="navbar__avatar" aria-hidden="true">
                  {obtenerIniciales(usuario.nombre)}
                </span>
                <div>
                  <p className="cajon__usuario-nombre">{usuario.nombre}</p>
                  <Badge variante="marca" tamano="sm">
                    {ETIQUETAS_ROL[usuario.rol]}
                  </Badge>
                </div>
              </div>

              {esPersonal && (
                <Link to={RUTAS.DASHBOARD} className="cajon__enlace" onClick={cerrarMenu}>
                  Ir al panel de gestión
                </Link>
              )}

              <button type="button" className="cajon__salir" onClick={alCerrarSesion}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to={RUTAS.LOGIN} className="cajon__ingresar" onClick={cerrarMenu}>
              Iniciar sesión
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

export default Navbar;
