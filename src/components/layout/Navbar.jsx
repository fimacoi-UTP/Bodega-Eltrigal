/**
 * ============================================================================
 * Navbar · Cabecera y Navegación estilo Supermercado Premium (FASE 1)
 * ----------------------------------------------------------------------------
 * Estructura en 5 niveles:
 *   1. TIRA SUPERIOR (topbar): marca Piura, indicador "● Abierto ahora",
 *      delivery y teléfono.
 *   2. HEADER PRINCIPAL: Logo espiga + Buscador pill centrado conectado al
 *      catálogo + Acciones (Entregar en Piura, Cuenta/Sesión, Tema, Carrito
 *      con total en S/ y badge animado).
 *   3. BARRA DE CATEGORÍAS (sticky top:0): botón "☰ Todas las categorías"
 *      que despliega el Mega-Menú + enlaces horizontales de categorías y
 *      "🔥 Ofertas".
 *   4. MEGA-MENÚ desplegable: grid de 4 columnas con categorías y
 *      subcategorías, cierre con clic fuera o tecla Escape.
 *   5. CINTA DE PROMOS (ticker): carrusel continuo con pausa en hover.
 * ==========================================================================*/

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useInventario } from "../../hooks/useInventario";
import { useTema } from "../../hooks/useTema";
import { useCarrito } from "../../context/CarritoContext";
import { Badge } from "../ui";
import Logo from "./Logo";
import { RUTAS, aRuta } from "../../routes/rutas";
import { BODEGA, ETIQUETAS_ROL } from "../../constantes";
import {
  clases,
  formatearSoles,
  normalizarTexto,
  obtenerIniciales,
} from "../../utils/formato";
import { urlImagen } from "../../api/apiClient";
import "./Navbar.css";

/** Enlaces institucionales de la tienda. */
const ENLACES = [
  { a: RUTAS.INICIO, texto: "Catálogo", exacto: true },
  { a: RUTAS.NOSOTROS, texto: "Nosotros" },
  { a: RUTAS.UBICACION, texto: "Ubicación" },
];

/** Categorías base del supermercado para la barra horizontal. */
const CATEGORIAS_BASE = [
  { nombre: "Abarrotes", icono: "🍚" },
  { nombre: "Bebidas", icono: "🥤" },
  { nombre: "Lácteos", icono: "🥛" },
  { nombre: "Limpieza", icono: "🧼" },
  { nombre: "Snacks", icono: "🍪" },
  { nombre: "Mascotas", icono: "🐾" },
  { nombre: "Gas", icono: "⛽" },
];

/** Estructura del Mega-Menú (4 columnas con subcategorías). */
const COLUMNAS_MEGA_MENU = [
  {
    categoria: "Abarrotes",
    icono: "🍚",
    subcategorias: [
      { texto: "Arroz", q: "Arroz" },
      { texto: "Aceites", q: "Aceite" },
      { texto: "Menestras", q: "Menestra" },
      { texto: "Fideos y pastas", q: "Fideo" },
      { texto: "Azúcar y sal", q: "Azúcar" },
      { texto: "Conservas y atún", q: "Atún" },
    ],
  },
  {
    categoria: "Bebidas",
    icono: "🥤",
    subcategorias: [
      { texto: "Gaseosas", q: "Gaseosa" },
      { texto: "Aguas de mesa", q: "Agua" },
      { texto: "Jugos y néctares", q: "Jugo" },
      { texto: "Rehidratantes", q: "Sporade" },
      { texto: "Cervezas", q: "Cerveza" },
    ],
  },
  {
    categoria: "Lácteos",
    icono: "🥛",
    subcategorias: [
      { texto: "Leche evaporada", q: "Leche" },
      { texto: "Yogurt", q: "Yogurt" },
      { texto: "Quesos y mantequilla", q: "Mantequilla" },
      { texto: "Huevos frescos", q: "Huevo" },
      { texto: "Avenas y cereales", q: "Avena" },
    ],
  },
  {
    categoria: "Limpieza",
    icono: "🧼",
    subcategorias: [
      { texto: "Detergentes", q: "Detergente" },
      { texto: "Lejía y desinfectantes", q: "Lejía" },
      { texto: "Lavavajillas", q: "Lavavajilla" },
      { texto: "Papel higiénico", q: "Papel" },
      { texto: "Jabón de lavar", q: "Jabón" },
    ],
  },
  {
    categoria: "Snacks",
    icono: "🍪",
    subcategorias: [
      { texto: "Galletas dulces y saladas", q: "Galleta" },
      { texto: "Papas y piqueos", q: "Papas" },
      { texto: "Chocolates", q: "Chocolate" },
      { texto: "Caramelos y gomitas", q: "Caramelo" },
    ],
  },
  {
    categoria: "Mascotas",
    icono: "🐾",
    subcategorias: [
      { texto: "Alimento para perros", q: "Perro" },
      { texto: "Alimento para gatos", q: "Gato" },
      { texto: "Premios y snacks", q: "Mascota" },
    ],
  },
  {
    categoria: "Gas",
    icono: "⛽",
    subcategorias: [
      { texto: "Balón de gas 10 kg", q: "Gas" },
      { texto: "Agua en bidón 20 L", q: "Bidón" },
      { texto: "Fósforos y encendedores", q: "Fósforo" },
    ],
  },
  {
    categoria: "Cuidado Personal",
    icono: "🧴",
    subcategorias: [
      { texto: "Shampoo y cabello", q: "Shampoo" },
      { texto: "Jabón de tocador", q: "Tocador" },
      { texto: "Pasta y cepillo dental", q: "Dental" },
      { texto: "Desodorantes", q: "Desodorante" },
    ],
  },
];

/** Mensajes de la cinta de promociones (ticker). */
const MENSAJES_TICKER = [
  "🔥 Hasta 30% dcto en abarrotes",
  "🛵 Delivery gratis desde S/ 50",
  "💳 Paga con Yape o Plin",
  "🌾 Productos frescos de confianza",
  "🕑 Abierto hasta las 10 p.m.",
];

export function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [megaMenuAbierto, setMegaMenuAbierto] = useState(false);
  const [animarBadge, setAnimarBadge] = useState(false);
  const [hayMasDerecha, setHayMasDerecha] = useState(false);

  const { usuario, estaAutenticado, esPersonal, cerrarSesion } = useAuth();
  const { categorias } = useInventario();
  const { items, total, abrirDrawerCarrito } = useCarrito();
  const { esOscuro, alternarTema } = useTema();

  const navegar = useNavigate();
  const location = useLocation();
  const [parametros, setParametros] = useSearchParams();

  const queryActual = parametros.get("q") || "";
  const categoriaActiva = parametros.get("categoria") || "";
  const [borradorBusqueda, setBorradorBusqueda] = useState(null);
  const textoBusqueda = borradorBusqueda !== null ? borradorBusqueda : queryActual;

  const megaMenuRef = useRef(null);
  const botonCategoriasRef = useRef(null);
  const listaCategoriasRef = useRef(null);
  const prevCantidadRef = useRef(null);

  /* Cantidad total de unidades en el carrito */
  const cantidadTotal = useMemo(
    () => items.reduce((suma, item) => suma + (Number(item.cantidad) || 0), 0),
    [items],
  );

  /* Categorías para la barra horizontal: usa los nombres reales del API cuando
     coinciden con las 7 categorías principales de la barra para que en
     escritorio entren todas junto con "🔥 Ofertas" sin ningún recorte. */
  const listaCategoriasBarra = useMemo(() => {
    const mapaReal = new Map();
    for (const cat of categorias) {
      const clave = normalizarTexto(cat);
      if (clave) mapaReal.set(clave, cat);
    }

    return CATEGORIAS_BASE.map((item) => {
      const clave = normalizarTexto(item.nombre);
      return {
        nombre: mapaReal.get(clave) || item.nombre,
        icono: item.icono,
      };
    });
  }, [categorias]);

  // Detectar si el track de categorías tiene contenido adicional hacia la derecha
  useEffect(() => {
    const el = listaCategoriasRef.current;
    if (!el) return;

    const actualizarEstadoScroll = () => {
      const restanteDerecha = el.scrollWidth - el.clientWidth - el.scrollLeft;
      setHayMasDerecha(restanteDerecha > 6);
    };

    actualizarEstadoScroll();
    el.addEventListener("scroll", actualizarEstadoScroll, { passive: true });
    window.addEventListener("resize", actualizarEstadoScroll);

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(actualizarEstadoScroll);
      ro.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", actualizarEstadoScroll);
      window.removeEventListener("resize", actualizarEstadoScroll);
      if (ro) ro.disconnect();
    };
  }, [listaCategoriasBarra]);

  // Animación pop del badge cuando cambia la cantidad de ítems en el carrito
  useEffect(() => {
    if (prevCantidadRef.current !== null && prevCantidadRef.current !== cantidadTotal) {
      const tInicio = setTimeout(() => setAnimarBadge(true), 0);
      const tFin = setTimeout(() => setAnimarBadge(false), 380);
      prevCantidadRef.current = cantidadTotal;
      return () => {
        clearTimeout(tInicio);
        clearTimeout(tFin);
      };
    }
    prevCantidadRef.current = cantidadTotal;
  }, [cantidadTotal]);

  const cerrarMenu = () => setMenuAbierto(false);
  const cerrarMegaMenu = () => setMegaMenuAbierto(false);

  // Bloquear scroll del fondo cuando el cajón móvil está abierto
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  // Cerrar mega-menú al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!megaMenuAbierto) return;

    const manejarClickFuera = (e) => {
      if (
        megaMenuRef.current &&
        !megaMenuRef.current.contains(e.target) &&
        botonCategoriasRef.current &&
        !botonCategoriasRef.current.contains(e.target)
      ) {
        setMegaMenuAbierto(false);
      }
    };

    const manejarTecla = (e) => {
      if (e.key === "Escape") {
        setMegaMenuAbierto(false);
        botonCategoriasRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", manejarClickFuera);
    document.addEventListener("keydown", manejarTecla);
    return () => {
      document.removeEventListener("mousedown", manejarClickFuera);
      document.removeEventListener("keydown", manejarTecla);
    };
  }, [megaMenuAbierto]);

  const alCambiarBusqueda = (e) => {
    const valor = e.target.value;

    // Si ya estamos en el catálogo (inicio), filtramos en tiempo real vía URL
    if (location.pathname === RUTAS.INICIO) {
      setBorradorBusqueda(null);
      const nuevos = new URLSearchParams(parametros);
      if (valor.trim()) {
        nuevos.set("q", valor);
      } else {
        nuevos.delete("q");
      }
      setParametros(nuevos, { replace: true });
    } else {
      setBorradorBusqueda(valor);
    }
  };

  const alEnviarBusqueda = (e) => {
    e.preventDefault();
    const limpio = textoBusqueda.trim();
    setBorradorBusqueda(null);
    if (location.pathname !== RUTAS.INICIO) {
      navegar(limpio ? aRuta.inicioPorBusqueda(limpio) : RUTAS.INICIO);
    } else {
      const nuevos = new URLSearchParams(parametros);
      if (limpio) {
        nuevos.set("q", limpio);
      } else {
        nuevos.delete("q");
      }
      setParametros(nuevos);
    }
  };

  const limpiarBusquedaHeader = () => {
    setBorradorBusqueda(null);
    if (location.pathname === RUTAS.INICIO) {
      const nuevos = new URLSearchParams(parametros);
      nuevos.delete("q");
      setParametros(nuevos, { replace: true });
    }
  };

  const alCerrarSesion = async () => {
    await cerrarSesion();
    cerrarMenu();
    navegar(RUTAS.INICIO);
  };

  const primerNombre = usuario
    ? (usuario.nombres || usuario.nombre || "Cliente").split(" ")[0]
    : "";

  return (
    <>
      {/* ====================================================================
       * 1. TIRA SUPERIOR (Topbar · ~38px · fondo tinta · texto claro)
       * ================================================================== */}
      <div className="topbar">
        <div className="contenedor topbar__contenido">
          <div className="topbar__izquierda">
            <span className="topbar__marca">🌾 Bodega El Trigal · Piura</span>
            <nav className="topbar__enlaces-institucionales" aria-label="Enlaces informativos">
              <NavLink to={RUTAS.NOSOTROS} className="topbar__enlace">
                Nosotros
              </NavLink>
              <span className="topbar__separador" aria-hidden="true">·</span>
              <NavLink to={RUTAS.UBICACION} className="topbar__enlace">
                Ubicación
              </NavLink>
            </nav>
          </div>

          <div className="topbar__derecha">
            <span className="topbar__estado topbar__secundario">
              <span className="topbar__punto-verde" aria-hidden="true" />
              Abierto ahora
            </span>
            <span className="topbar__item topbar__secundario">🛵 Delivery en Piura</span>
            <a href={`tel:${BODEGA.telefono.replace(/\s+/g, "")}`} className="topbar__telefono">
              📞 {BODEGA.telefono}
            </a>
          </div>
        </div>
      </div>

      {/* ====================================================================
       * 2. HEADER PRINCIPAL (~78px · fondo panel · borde hairline)
       * ================================================================== */}
      <header className="header-principal">
        <div className="contenedor header-principal__contenido">
          {/* Hamburguesa móvil */}
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

          {/* Logo El Trigal */}
          <Logo />

          {/* Buscador grande y centrado (pill 48px) */}
          <form
            className="header-buscador"
            role="search"
            onSubmit={alEnviarBusqueda}
          >
            <input
              type="search"
              className="header-buscador__input"
              placeholder="Buscar arroz, aceite, leche, gaseosas..."
              value={textoBusqueda}
              onChange={alCambiarBusqueda}
              aria-label="Buscar productos en Bodega El Trigal"
            />
            {textoBusqueda && (
              <button
                type="button"
                className="header-buscador__limpiar"
                onClick={limpiarBusquedaHeader}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="header-buscador__boton"
              aria-label="Buscar"
            >
              <span aria-hidden="true">🔍</span>
            </button>
          </form>

          {/* Acciones a la derecha (pill-buttons con ícono + etiqueta en 2 líneas) */}
          <div className="header-acciones">
            {/* 1. Selector de entrega (visual por ahora) */}
            <button
              type="button"
              className="header-pill header-pill--entrega"
              title="Zona de cobertura: Piura"
              aria-label="Zona de entrega: Piura"
            >
              <span className="header-pill__icono" aria-hidden="true">📍</span>
              <span className="header-pill__textos">
                <span className="header-pill__sub">Entregar en</span>
                <span className="header-pill__principal">Piura ▾</span>
              </span>
            </button>

            {/* 2. Cuenta / Sesión */}
            {estaAutenticado ? (
              <div className="header-cuenta-grupo">
                <Link
                  to={esPersonal ? RUTAS.DASHBOARD : RUTAS.MI_CUENTA}
                  className="header-pill header-pill--cuenta"
                  title={esPersonal ? "Ir al panel de gestión" : "Ir a mi cuenta"}
                >
                  {usuario.avatarUrl ? (
                    <img
                      src={urlImagen(usuario.avatarUrl)}
                      alt={usuario.nombre}
                      className="navbar__avatar navbar__avatar--foto"
                    />
                  ) : (
                    <span className="navbar__avatar" aria-hidden="true">
                      {obtenerIniciales(usuario.nombre)}
                    </span>
                  )}
                  <span className="header-pill__textos">
                    <span className="header-pill__sub">Hola, {primerNombre}</span>
                    <span className="header-pill__principal">
                      {esPersonal ? ETIQUETAS_ROL[usuario.rol] || "Panel" : "Mi cuenta"}
                    </span>
                  </span>
                </Link>

                <button
                  type="button"
                  className="header-salir-btn"
                  onClick={alCerrarSesion}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link
                to={RUTAS.LOGIN}
                className="header-pill header-pill--cuenta"
                aria-label="Mi cuenta · Ingresar"
              >
                <span className="header-pill__icono" aria-hidden="true">👤</span>
                <span className="header-pill__textos">
                  <span className="header-pill__sub">Mi cuenta</span>
                  <span className="header-pill__principal">Ingresar</span>
                </span>
              </Link>
            )}

            {/* 3. Toggle de tema Día / Noche */}
            <button
              type="button"
              className="navbar__accion navbar__tema-btn"
              onClick={alternarTema}
              aria-label={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={esOscuro ? "Modo día" : "Modo noche"}
            >
              {esOscuro ? (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M12 2.5v2.2M12 19.3v2.2M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2.5 12h2.2M19.3 12h2.2M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* 4. CARRITO (fondo oro-50, borde oro, ícono 🛒, total S/ y badge pop -> abre Drawer lateral) */}
            <button
              type="button"
              onClick={abrirDrawerCarrito}
              className="header-pill header-pill--carrito"
              aria-haspopup="dialog"
              aria-controls="carrito-drawer-lateral"
              aria-label={
                cantidadTotal > 0
                  ? `Abrir carrito, ${cantidadTotal} ${
                      cantidadTotal === 1 ? "producto" : "productos"
                    }, total ${formatearSoles(total)}`
                  : "Abrir carrito"
              }
            >
              <span className="header-pill__icono header-pill__icono--carrito" aria-hidden="true">
                🛒
              </span>
              <span className="header-pill__textos">
                <span className="header-pill__sub">Carrito</span>
                <span className="header-pill__principal numero">{formatearSoles(total)}</span>
              </span>

              <span
                className={clases(
                  "header-carrito__badge",
                  animarBadge && "header-carrito__badge--pop",
                )}
                aria-hidden="true"
              >
                {cantidadTotal > 99 ? "99+" : cantidadTotal}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
       * 3. BARRA DE CATEGORÍAS (sticky top:0 · ~52px) + 4. MEGA-MENÚ
       * ================================================================== */}
      <div className="barra-categorias-wrapper">
        <div className="contenedor barra-categorias">
          {/* Botón Todas las categorías -> Mega-Menú */}
          <button
            ref={botonCategoriasRef}
            type="button"
            className={clases(
              "barra-categorias__boton-todas",
              megaMenuAbierto && "barra-categorias__boton-todas--activo",
            )}
            onClick={() => setMegaMenuAbierto((prev) => !prev)}
            aria-expanded={megaMenuAbierto}
            aria-controls="mega-menu-categorias"
          >
            <span aria-hidden="true">{megaMenuAbierto ? "✕" : "☰"}</span>
            <span>Todas las categorías</span>
          </button>

          {/* Track horizontal desplazable con indicador fade derecho */}
          <div
            className={clases(
              "barra-categorias__track",
              hayMasDerecha && "barra-categorias__track--hay-mas",
            )}
          >
            <nav
              ref={listaCategoriasRef}
              className="barra-categorias__lista"
              aria-label="Categorías del supermercado"
            >
              <Link
                to={aRuta.inicioCatalogoCompleto()}
                onClick={cerrarMegaMenu}
                className={clases(
                  "barra-categorias__enlace",
                  location.pathname === RUTAS.INICIO &&
                    ["todos", "todas", "todo"].includes(
                      normalizarTexto(categoriaActiva),
                    ) &&
                    "barra-categorias__enlace--activo",
                )}
              >
                Todo el catálogo
              </Link>

              {listaCategoriasBarra.map((cat) => {
                const activa =
                  location.pathname === RUTAS.INICIO &&
                  normalizarTexto(categoriaActiva) === normalizarTexto(cat.nombre);
                return (
                  <Link
                    key={cat.nombre}
                    to={aRuta.inicioPorCategoria(cat.nombre)}
                    onClick={cerrarMegaMenu}
                    className={clases(
                      "barra-categorias__enlace",
                      activa && "barra-categorias__enlace--activo",
                    )}
                  >
                    <span aria-hidden="true">{cat.icono}</span>
                    <span>{cat.nombre}</span>
                  </Link>
                );
              })}

              {/* Enlace destacado de Ofertas en pill roja */}
              <Link
                to={aRuta.inicioPorCategoria("Ofertas")}
                onClick={cerrarMegaMenu}
                className={clases(
                  "barra-categorias__enlace barra-categorias__enlace--ofertas",
                  location.pathname === RUTAS.INICIO &&
                    normalizarTexto(categoriaActiva) === "ofertas" &&
                    "barra-categorias__enlace--ofertas-activo",
                )}
              >
                <span aria-hidden="true">🔥</span>
                <span>Ofertas</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* ==================================================================
         * 4. MEGA-MENÚ (panel desplegable bajo la barra, 4 columnas)
         * ================================================================ */}
        <div
          id="mega-menu-categorias"
          ref={megaMenuRef}
          className={clases("mega-menu", megaMenuAbierto && "mega-menu--abierto")}
          aria-hidden={!megaMenuAbierto}
          inert={!megaMenuAbierto || undefined}
        >
          <div className="contenedor mega-menu__interior">
            <div className="mega-menu__cabecera">
              <div>
                <p className="mega-menu__eyebrow">DEPARTAMENTOS EL TRIGAL</p>
                <h2 className="mega-menu__titulo serif">Explora nuestras categorías</h2>
              </div>
              <Link
                to={aRuta.inicioCatalogoCompleto()}
                className="mega-menu__ver-todo"
                onClick={cerrarMegaMenu}
              >
                Ver catálogo completo →
              </Link>
            </div>

            <div className="mega-menu__grid">
              {COLUMNAS_MEGA_MENU.map((grupo) => (
                <div key={grupo.categoria} className="mega-menu__columna">
                  <Link
                    to={aRuta.inicioPorCategoria(grupo.categoria)}
                    className="mega-menu__categoria-titulo"
                    onClick={cerrarMegaMenu}
                  >
                    <span className="mega-menu__categoria-icono" aria-hidden="true">
                      {grupo.icono}
                    </span>
                    <span className="serif">{grupo.categoria}</span>
                  </Link>
                  <ul className="mega-menu__sublista">
                    {grupo.subcategorias.map((sub) => (
                      <li key={sub.texto}>
                        <Link
                          to={aRuta.inicioPorSubcategoria(grupo.categoria, sub.q)}
                          className="mega-menu__subenlace"
                          onClick={cerrarMegaMenu}
                        >
                          {sub.texto}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
       * 5. CINTA DE PROMOS (Ticker en loop infinito con pausa al hover)
       * ================================================================== */}
      <div className="ticker-promos" aria-label="Promociones destacadas">
        <div className="ticker-promos__pista">
          {[0, 1, 2].map((bloque) => (
            <div
              key={bloque}
              className="ticker-promos__grupo"
              aria-hidden={bloque > 0 ? "true" : undefined}
            >
              {MENSAJES_TICKER.map((msg) => (
                <span key={`${bloque}-${msg}`} className="ticker-promos__item">
                  <span>{msg}</span>
                  <span className="ticker-promos__punto" aria-hidden="true">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ==================== MENÚ MÓVIL (cajón lateral) ==================== */}
      {menuAbierto && (
        <div
          className="cajon__fondo"
          onClick={cerrarMenu}
          aria-hidden="true"
        />
      )}

      <aside
        id="menu-movil"
        className={clases("cajon", menuAbierto && "cajon--abierto")}
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
          <button
            type="button"
            className="cajon__enlace"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => {
              cerrarMenu();
              abrirDrawerCarrito();
            }}
          >
            🛒 Mi carrito ({cantidadTotal})
          </button>
        </nav>

        <div className="cajon__seccion">
          <p className="cajon__titulo-seccion">Categorías</p>
          <div className="cajon__categorias">
            <Link
              to={aRuta.inicioCatalogoCompleto()}
              className="cajon__categoria"
              onClick={cerrarMenu}
            >
              🛒 Todo el catálogo
            </Link>
            {listaCategoriasBarra.map((cat) => (
              <Link
                key={cat.nombre}
                to={aRuta.inicioPorCategoria(cat.nombre)}
                className="cajon__categoria"
                onClick={cerrarMenu}
              >
                {cat.icono} {cat.nombre}
              </Link>
            ))}
            <Link
              to={aRuta.inicioPorCategoria("Ofertas")}
              className="cajon__categoria cajon__categoria--ofertas"
              onClick={cerrarMenu}
            >
              🔥 Ofertas
            </Link>
          </div>
        </div>

        <div className="cajon__pie">
          {estaAutenticado ? (
            <>
              <div className="cajon__usuario">
                {usuario.avatarUrl ? (
                  <img
                    src={urlImagen(usuario.avatarUrl)}
                    alt={usuario.nombre}
                    className="navbar__avatar navbar__avatar--foto"
                  />
                ) : (
                  <span className="navbar__avatar" aria-hidden="true">
                    {obtenerIniciales(usuario.nombre)}
                  </span>
                )}
                <div>
                  <p className="cajon__usuario-nombre">{usuario.nombre}</p>
                  <Badge variante="marca" tamano="sm">
                    {ETIQUETAS_ROL[usuario.rol]}
                  </Badge>
                </div>
              </div>

              {!esPersonal && (
                <Link to={RUTAS.MI_CUENTA} className="cajon__micuenta" onClick={cerrarMenu}>
                  Mi cuenta
                </Link>
              )}

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
            <div className="cajon__auth-botones">
              <Link to={RUTAS.LOGIN} className="cajon__ingresar" onClick={cerrarMenu}>
                Iniciar sesión
              </Link>
              <Link to={RUTAS.REGISTRO} className="cajon__registrarse" onClick={cerrarMenu}>
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Navbar;
