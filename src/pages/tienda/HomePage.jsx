/**
 * ============================================================================
 * HomePage · Landing Supermercado Premium & Vista de Resultados (FASE 3 y 4)
 * ----------------------------------------------------------------------------
 * Estructura de la landing (cuando NO hay búsqueda, categoría ni "todos"):
 *   1. HERO CARRUSEL (3 slides degradados con emoji flotante y entrada animada).
 *   2. QUICK-TILES (4 tarjetas: Delivery rápido, Yape·Plin, Ofertas, Horario).
 *   3. "🔥 Ofertas del día" (productos con promo real + cuenta regresiva HH:MM:SS).
 *   4. "Explora por categoría" (carrusel infinito continuo con pausa en hover).
 *   5. "⭐ Favoritos de los vecinos" (selección destacada de productos reales).
 *   6. "Packs para tu día" (3 tarjetas temáticas: Desayuno, Parrilla, Limpieza).
 *   7. BANDA DE ESTADÍSTICAS (degradado terracota con animación count-up).
 *   8. FRANJA DE BENEFICIOS (panel kraft: delivery, pago, frescura, WhatsApp).
 *   9. REVEAL AL SCROLL (fade-up escalonado con IntersectionObserver).
 *
 * Estructura de la Vista de Resultados (FASE 4, cuando hay ?categoria=, ?q=
 * o ?categoria=todos):
 *   · Cabecera con "← Seguir comprando", h1 con subrayado terracota, contador
 *     "N productos" y dropdown "Ordenar" (Recomendados, Menor precio,
 *     Mayor precio, Nombre A-Z).
 *   · Layout de 2 columnas: Sidebar sticky (~262px, top:70px) con grupos
 *     colapsables (+/−) para Categoría, Marcas reales, Precio y Disponibilidad
 *     + Grilla responsive de TarjetaProducto (3 -> 2 col).
 * ==========================================================================*/

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInventario } from "../../hooks/useInventario";
import { clases, normalizarTexto } from "../../utils/formato";
import { aRuta } from "../../routes/rutas";
import { BODEGA } from "../../constantes";
import {
  Boton,
  EstadoVacio,
  SkeletonTarjeta,
} from "../../components/ui";
import { CarruselHero, TarjetaProducto, useAgregarAlCarrito } from "./catalogo";
import "./HomePage.css";

/** Íconos y subtítulos por categoría para el carrusel "Explora por categoría". */
const META_CATEGORIA = {
  abarrotes: { icono: "🍚", detalle: "Arroz, aceites, fideos y menestras" },
  bebidas: { icono: "🥤", detalle: "Gaseosas, aguas, jugos y cervezas" },
  lacteos: { icono: "🥛", detalle: "Leche, yogurt, quesos y huevos" },
  limpieza: { icono: "🧼", detalle: "Detergentes, lejía y cuidado del hogar" },
  snacks: { icono: "🍪", detalle: "Galletas, piqueos y chocolates" },
  mascotas: { icono: "🐾", detalle: "Alimento y cuidado para tu mascota" },
  gas: { icono: "⛽", detalle: "Balón de gas y básicos del hogar" },
  "cuidado personal": { icono: "🧴", detalle: "Shampoo, jabones y cuidado diario" },
  golosinas: { icono: "🍬", detalle: "Dulces, caramelos y gomitas" },
  panaderia: { icono: "🥖", detalle: "Pan fresco, kekes y tostadas" },
};

/** Los 4 Quick-Tiles bajo el Hero. */
const QUICK_TILES = [
  {
    id: "delivery",
    icono: "🛵",
    tono: "terracota",
    titulo: "Delivery rápido",
    subtitulo: "En todo Piura directo a tu puerta",
  },
  {
    id: "pagos",
    icono: "💳",
    tono: "oro",
    titulo: "Yape · Plin",
    subtitulo: "También tarjeta y efectivo contraentrega",
  },
  {
    id: "ofertas",
    icono: "🔥",
    tono: "rojo",
    titulo: "Ofertas diarias",
    subtitulo: "Descuentos reales en tu canasta",
  },
  {
    id: "horario",
    icono: "🕙",
    tono: "verde",
    titulo: "Abierto hasta 10pm",
    subtitulo: "Atención continua de lunes a sábado",
  },
];

/** Las 3 tarjetas de "Packs para tu día". */
const PACKS_DEL_DIA = [
  {
    id: "desayuno",
    tono: "oro",
    emoji: "🥐",
    etiqueta: "MAÑANAS EN FAMILIA",
    titulo: "Pack Desayuno Piurano",
    descripcion:
      "Leche evaporada, avena, café, azúcar rubia y galletas para empezar el día con energía.",
    cta: "Ver lácteos y desayuno →",
    destino: aRuta.inicioPorCategoria("Lácteos"),
  },
  {
    id: "parrilla",
    tono: "terracota",
    emoji: "🥩",
    etiqueta: "PARA COMPARTIR",
    titulo: "Pack Parrilla & Fin de Semana",
    descripcion:
      "Gaseosas familiares, aguas, piqueos, snacks y carbón listos para tu reunión con amigos.",
    cta: "Ver bebidas y piqueos →",
    destino: aRuta.inicioPorCategoria("Bebidas"),
  },
  {
    id: "limpieza",
    tono: "verde",
    emoji: "🧼",
    etiqueta: "HOGAR IMPECABLE",
    titulo: "Pack Limpieza Total",
    descripcion:
      "Detergente, lejía, lavavajillas, jabón y papel higiénico con rendimiento para todo el mes.",
    cta: "Ver limpieza del hogar →",
    destino: aRuta.inicioPorCategoria("Limpieza"),
  },
];

/** Cifras de la banda de estadísticas con animación Count-Up. */
const ESTADISTICAS = [
  {
    id: "caseros",
    prefijo: "+",
    valorFinal: 500,
    sufijo: "",
    decimales: 0,
    etiqueta: "Caseros felices en Piura",
  },
  {
    id: "pedidos",
    prefijo: "+",
    valorFinal: 1200,
    sufijo: "",
    decimales: 0,
    etiqueta: "Pedidos entregados a tiempo",
  },
  {
    id: "anios",
    prefijo: "",
    valorFinal: 25,
    sufijo: " años",
    decimales: 0,
    etiqueta: "De tradición y confianza",
  },
  {
    id: "rating",
    prefijo: "",
    valorFinal: 4.9,
    sufijo: "★",
    decimales: 1,
    etiqueta: "Calificación de nuestros vecinos",
  },
];

/** Rangos reales de precio para el sidebar de filtros (FASE 4). */
const RANGOS_PRECIO = [
  {
    id: "hasta_5",
    etiqueta: "Hasta S/ 5",
    evaluar: (precio) => precio <= 5,
  },
  {
    id: "5_15",
    etiqueta: "S/ 5 – S/ 15",
    evaluar: (precio) => precio > 5 && precio <= 15,
  },
  {
    id: "15_30",
    etiqueta: "S/ 15 – S/ 30",
    evaluar: (precio) => precio > 15 && precio <= 30,
  },
  {
    id: "mas_30",
    etiqueta: "Más de S/ 30",
    evaluar: (precio) => precio > 30,
  },
];

/** Opciones de ordenamiento con datos reales del producto. */
const OPCIONES_ORDEN = [
  { valor: "recomendados", etiqueta: "Recomendados" },
  { valor: "precio_asc", etiqueta: "Menor precio" },
  { valor: "precio_desc", etiqueta: "Mayor precio" },
  { valor: "nombre_asc", etiqueta: "Nombre A-Z" },
];

/** Determina si el parámetro de categoría representa "ver todo el catálogo". */
function esValorTodoCatalogo(valor) {
  const norm = normalizarTexto(valor);
  return norm === "todos" || norm === "todas" || norm === "todo";
}

/** Determina si un producto está disponible usando el booleano público o stock. */
function estaProductoDisponible(producto) {
  if (!producto) return false;
  if (typeof producto.stock === "number" && Number.isFinite(producto.stock)) {
    return producto.stock > 0;
  }
  if (typeof producto.disponible === "boolean") {
    return producto.disponible;
  }
  return true;
}

/** Calcula los segundos restantes hasta las 23:59:59 de hoy. */
function calcularTiempoRestanteHoy() {
  const ahora = new Date();
  const finDia = new Date(ahora);
  finDia.setHours(23, 59, 59, 999);
  const diffSeg = Math.max(0, Math.floor((finDia.getTime() - ahora.getTime()) / 1000));
  const horas = String(Math.floor(diffSeg / 3600)).padStart(2, "0");
  const minutos = String(Math.floor((diffSeg % 3600) / 60)).padStart(2, "0");
  const segundos = String(diffSeg % 60).padStart(2, "0");
  return `${horas}:${minutos}:${segundos}`;
}

/** Chip de cuenta regresiva en vivo para "🔥 Ofertas del día". */
function CuentaRegresivaOfertas() {
  const [tiempo, setTiempo] = useState(calcularTiempoRestanteHoy);

  useEffect(() => {
    const id = setInterval(() => {
      setTiempo(calcularTiempoRestanteHoy());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="home-sechead__countdown numero" aria-label={`Ofertas terminan en ${tiempo}`}>
      <span aria-hidden="true">⏱</span>
      <span>Termina en {tiempo}</span>
    </span>
  );
}

/** Ítem individual de estadística con animación Count-Up al entrar en pantalla. */
function ItemEstadisticaCountUp({ item, activo }) {
  const [valorActual, setValorActual] = useState(0);

  useEffect(() => {
    if (!activo) return undefined;

    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const t = setTimeout(() => setValorActual(item.valorFinal), 0);
      return () => clearTimeout(t);
    }

    let frameId;
    const duracion = 1300;
    const inicio = performance.now();

    const animar = (ahora) => {
      const progreso = Math.min(1, (ahora - inicio) / duracion);
      // Cubic ease-out
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      setValorActual(item.valorFinal * suavizado);
      if (progreso < 1) {
        frameId = requestAnimationFrame(animar);
      }
    };

    frameId = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frameId);
  }, [activo, item.valorFinal]);

  const textoNumero =
    item.decimales > 0
      ? valorActual.toFixed(item.decimales)
      : Math.round(valorActual).toLocaleString("es-PE");

  return (
    <div className="home-stats__item">
      <span className="home-stats__cifra serif numero">
        {item.prefijo}
        {textoNumero}
        {item.sufijo}
      </span>
      <span className="home-stats__etiqueta">{item.etiqueta}</span>
    </div>
  );
}

/* ============================================================================
 * VISTA DE RESULTADOS REDISEÑADA (FASE 4)
 * ==========================================================================*/
function VistaResultadosCatalogo({
  productosActivos,
  productosEnOferta,
  categorias,
  cargando,
  busqueda,
  categoriaActiva,
  esVistaTodo,
  agregarAlCarrito,
  agregandoId,
  volverALaPortada,
}) {
  // Estados de filtros del sidebar (se reinician automáticamente al cambiar de categoría en la URL gracias a `key`)
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState([]);
  const [rangosPrecioSeleccionados, setRangosPrecioSeleccionados] = useState([]);
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [orden, setOrden] = useState("recomendados");
  const [sidebarMovilAbierto, setSidebarMovilAbierto] = useState(false);

  // Estado de grupos colapsables (+ / −)
  const [gruposAbiertos, setGruposAbiertos] = useState({
    categoria: true,
    marcas: true,
    precio: true,
    disponibilidad: true,
  });

  const rejillaRef = useRef(null);

  const alternarGrupo = (clave) => {
    setGruposAbiertos((prev) => ({
      ...prev,
      [clave]: !prev[clave],
    }));
  };

  // Mostrar grupo "Categoría" cuando estamos en "Todo el catálogo" o en búsqueda libre
  const mostrarFiltroCategorias =
    esVistaTodo || !categoriaActiva || esValorTodoCatalogo(categoriaActiva);

  // 1. Set base según el contexto de URL (?categoria= y ?q=)
  const productosBaseContexto = useMemo(() => {
    let lista = productosActivos;

    if (categoriaActiva && !esValorTodoCatalogo(categoriaActiva)) {
      if (normalizarTexto(categoriaActiva) === "ofertas") {
        lista = productosEnOferta;
      } else {
        const catNorm = normalizarTexto(categoriaActiva);
        lista = lista.filter((p) => normalizarTexto(p.categoria) === catNorm);
      }
    }

    if (busqueda.trim()) {
      const consulta = normalizarTexto(busqueda).trim();
      lista = lista.filter((producto) =>
        [
          producto.nombre,
          producto.marca,
          producto.categoria,
          producto.descripcion,
        ]
          .map(normalizarTexto)
          .some((campo) => campo.includes(consulta)),
      );
    }

    return lista;
  }, [productosActivos, productosEnOferta, categoriaActiva, busqueda]);

  // 2. Categorías reales con conteo dentro del set base (para "Todo el catálogo" / búsqueda)
  const categoriasConConteo = useMemo(() => {
    const mapa = new Map();
    for (const prod of productosBaseContexto) {
      const cat = (prod.categoria || "").trim();
      if (!cat) continue;
      mapa.set(cat, (mapa.get(cat) || 0) + 1);
    }
    // Respetar el orden de `categorias` del API y anexar cualquier otra presente
    const resultado = [];
    const visitadas = new Set();
    for (const cat of categorias) {
      if (mapa.has(cat)) {
        resultado.push({ nombre: cat, conteo: mapa.get(cat) });
        visitadas.add(cat);
      }
    }
    for (const [cat, conteo] of mapa.entries()) {
      if (!visitadas.has(cat)) {
        resultado.push({ nombre: cat, conteo });
      }
    }
    return resultado;
  }, [productosBaseContexto, categorias]);

  // Set intermedio tras aplicar filtro de categorías del sidebar (para derivar marcas reales de esas categorías)
  const productosTrasCategoriaSidebar = useMemo(() => {
    if (categoriasSeleccionadas.length === 0) return productosBaseContexto;
    const setNorm = new Set(categoriasSeleccionadas.map(normalizarTexto));
    return productosBaseContexto.filter((p) =>
      setNorm.has(normalizarTexto(p.categoria)),
    );
  }, [productosBaseContexto, categoriasSeleccionadas]);

  // 3. Marcas reales presentes en el resultado actual + su conteo exacto
  const marcasConConteo = useMemo(() => {
    const mapa = new Map();
    for (const prod of productosTrasCategoriaSidebar) {
      const marcaLimpia = (prod.marca || "").trim();
      if (!marcaLimpia) continue;
      const clave = normalizarTexto(marcaLimpia);
      const actual = mapa.get(clave);
      if (actual) {
        actual.conteo += 1;
      } else {
        mapa.set(clave, { nombre: marcaLimpia, clave, conteo: 1 });
      }
    }
    return Array.from(mapa.values()).sort(
      (a, b) =>
        b.conteo - a.conteo ||
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
    );
  }, [productosTrasCategoriaSidebar]);

  // 4. Conteo real por rango de precio sobre el resultado actual
  const conteosPorRangoPrecio = useMemo(() => {
    const conteos = {};
    for (const rango of RANGOS_PRECIO) {
      conteos[rango.id] = 0;
    }
    for (const prod of productosTrasCategoriaSidebar) {
      const precio = Number(prod.precio) || 0;
      for (const rango of RANGOS_PRECIO) {
        if (rango.evaluar(precio)) {
          conteos[rango.id] += 1;
        }
      }
    }
    return conteos;
  }, [productosTrasCategoriaSidebar]);

  // Conteo de disponibles en el resultado actual
  const conteoDisponibles = useMemo(
    () =>
      productosTrasCategoriaSidebar.filter((p) => estaProductoDisponible(p))
        .length,
    [productosTrasCategoriaSidebar],
  );

  // 5. Filtrado client-side completo + ordenamiento real
  const productosFiltradosYOrdenados = useMemo(() => {
    let lista = productosTrasCategoriaSidebar;

    // Filtro por marca(s)
    if (marcasSeleccionadas.length > 0) {
      const setMarcas = new Set(marcasSeleccionadas.map(normalizarTexto));
      lista = lista.filter((p) => setMarcas.has(normalizarTexto(p.marca)));
    }

    // Filtro por rango(s) de precio
    if (rangosPrecioSeleccionados.length > 0) {
      const rangosActivos = RANGOS_PRECIO.filter((r) =>
        rangosPrecioSeleccionados.includes(r.id),
      );
      lista = lista.filter((p) => {
        const precio = Number(p.precio) || 0;
        return rangosActivos.some((rango) => rango.evaluar(precio));
      });
    }

    // Filtro por disponibilidad ("Solo disponibles")
    if (soloDisponibles) {
      lista = lista.filter((p) => estaProductoDisponible(p));
    }

    // Ordenamiento con datos reales
    const copia = [...lista];
    if (orden === "precio_asc") {
      copia.sort((a, b) => (Number(a.precio) || 0) - (Number(b.precio) || 0));
    } else if (orden === "precio_desc") {
      copia.sort((a, b) => (Number(b.precio) || 0) - (Number(a.precio) || 0));
    } else if (orden === "nombre_asc") {
      copia.sort((a, b) =>
        (a.nombre || "").localeCompare(b.nombre || "", "es", {
          sensitivity: "base",
        }),
      );
    } else {
      // "recomendados": disponibles primero, luego ofertas activas
      copia.sort((a, b) => {
        const dispA = estaProductoDisponible(a) ? 1 : 0;
        const dispB = estaProductoDisponible(b) ? 1 : 0;
        if (dispA !== dispB) return dispB - dispA;
        const promoA =
          a.tieneDescuento && Number(a.precioOriginal) > Number(a.precio) ? 1 : 0;
        const promoB =
          b.tieneDescuento && Number(b.precioOriginal) > Number(b.precio) ? 1 : 0;
        return promoB - promoA;
      });
    }

    return copia;
  }, [
    productosTrasCategoriaSidebar,
    marcasSeleccionadas,
    rangosPrecioSeleccionados,
    soloDisponibles,
    orden,
  ]);

  // Handlers de checkboxes
  const alternarCategoriaSidebar = (cat) => {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const alternarMarca = (marca) => {
    setMarcasSeleccionadas((prev) =>
      prev.includes(marca) ? prev.filter((m) => m !== marca) : [...prev, marca],
    );
  };

  const alternarRangoPrecio = (idRango) => {
    setRangosPrecioSeleccionados((prev) =>
      prev.includes(idRango)
        ? prev.filter((id) => id !== idRango)
        : [...prev, idRango],
    );
  };

  const totalFiltrosSidebarActivos =
    categoriasSeleccionadas.length +
    marcasSeleccionadas.length +
    rangosPrecioSeleccionados.length +
    (soloDisponibles ? 1 : 0);

  const borrarFiltrosSidebar = () => {
    setCategoriasSeleccionadas([]);
    setMarcasSeleccionadas([]);
    setRangosPrecioSeleccionados([]);
    setSoloDisponibles(false);
    setOrden("recomendados");
  };

  const aplicarFiltros = () => {
    setSidebarMovilAbierto(false);
    if (rejillaRef.current && typeof window !== "undefined" && window.innerWidth < 820) {
      rejillaRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Título contextual (según ?q=, ?categoria= o ?categoria=todos)
  const tituloContexto = useMemo(() => {
    const qLimpia = busqueda.trim();
    if (qLimpia) {
      return `Resultados para '${qLimpia}'`;
    }
    if (esVistaTodo || !categoriaActiva || esValorTodoCatalogo(categoriaActiva)) {
      return "Todo el catálogo";
    }
    if (normalizarTexto(categoriaActiva) === "ofertas") {
      return "🔥 Ofertas del día";
    }
    return categoriaActiva;
  }, [busqueda, esVistaTodo, categoriaActiva]);

  return (
    <div className="contenedor resultados-pagina">
      {/* 1) CABECERA DE RESULTADOS */}
      <header className="resultados-cabecera">
        <button
          type="button"
          className="resultados-cabecera__volver"
          onClick={volverALaPortada}
        >
          <span aria-hidden="true">←</span>
          <span>Seguir comprando</span>
        </button>

        <div className="resultados-cabecera__fila-principal">
          <div className="resultados-cabecera__titulo-grupo">
            <h1 className="resultados-cabecera__titulo serif">
              {tituloContexto}
            </h1>
            <span className="resultados-cabecera__contador numero" aria-live="polite">
              {productosFiltradosYOrdenados.length}{" "}
              {productosFiltradosYOrdenados.length === 1 ? "producto" : "productos"}
            </span>
          </div>

          <div className="resultados-cabecera__controles">
            {/* Botón para abrir/cerrar filtros en móvil/tablet (<820px) */}
            <button
              type="button"
              className={clases(
                "resultados-cabecera__btn-filtros-movil",
                sidebarMovilAbierto && "resultados-cabecera__btn-filtros-movil--activo",
              )}
              onClick={() => setSidebarMovilAbierto((prev) => !prev)}
              aria-expanded={sidebarMovilAbierto}
              aria-controls="sidebar-filtros-catalogo"
            >
              <span aria-hidden="true">☰</span>
              <span>Filtros</span>
              {totalFiltrosSidebarActivos > 0 && (
                <span className="resultados-cabecera__badge-filtros numero">
                  {totalFiltrosSidebarActivos}
                </span>
              )}
            </button>

            {/* Dropdown Ordenar */}
            <label className="resultados-orden">
              <span className="resultados-orden__etiqueta">Ordenar:</span>
              <select
                className="resultados-orden__select"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                aria-label="Ordenar productos"
              >
                {OPCIONES_ORDEN.map((op) => (
                  <option key={op.valor} value={op.valor}>
                    {op.etiqueta}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      {/* 2) LAYOUT 2 COLUMNAS: SIDEBAR (~262px sticky) + GRILLA (1fr) */}
      <div className="resultados-layout">
        {/* SIDEBAR DE FILTROS */}
        <aside
          id="sidebar-filtros-catalogo"
          className={clases(
            "resultados-sidebar",
            sidebarMovilAbierto && "resultados-sidebar--abierto",
          )}
          aria-label="Filtros de productos"
        >
          <div className="resultados-sidebar__cabecera">
            <h2 className="resultados-sidebar__titulo serif">Filtros</h2>
            <button
              type="button"
              className="resultados-sidebar__borrar"
              onClick={borrarFiltrosSidebar}
              disabled={totalFiltrosSidebarActivos === 0 && orden === "recomendados"}
            >
              Borrar filtros
            </button>
          </div>

          {/* Grupo: Categoría (cuando se explora "Todo el catálogo" o una búsqueda) */}
          {mostrarFiltroCategorias && categoriasConConteo.length > 0 && (
            <div className="filtro-grupo">
              <button
                type="button"
                className="filtro-grupo__cabecera"
                onClick={() => alternarGrupo("categoria")}
                aria-expanded={gruposAbiertos.categoria}
              >
                <span className="filtro-grupo__titulo">Categoría</span>
                <span className="filtro-grupo__icono" aria-hidden="true">
                  {gruposAbiertos.categoria ? "−" : "+"}
                </span>
              </button>

              {gruposAbiertos.categoria && (
                <div className="filtro-grupo__lista">
                  {categoriasConConteo.map((cat) => {
                    const marcado = categoriasSeleccionadas.includes(cat.nombre);
                    return (
                      <label key={cat.nombre} className="filtro-opcion">
                        <input
                          type="checkbox"
                          className="filtro-opcion__checkbox"
                          checked={marcado}
                          onChange={() => alternarCategoriaSidebar(cat.nombre)}
                        />
                        <span className="filtro-opcion__caja" aria-hidden="true" />
                        <span className="filtro-opcion__texto">{cat.nombre}</span>
                        <span className="filtro-opcion__conteo numero">
                          ({cat.conteo})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Grupo: Marcas reales presentes en el resultado actual */}
          <div className="filtro-grupo">
            <button
              type="button"
              className="filtro-grupo__cabecera"
              onClick={() => alternarGrupo("marcas")}
              aria-expanded={gruposAbiertos.marcas}
            >
              <span className="filtro-grupo__titulo">Marcas</span>
              <span className="filtro-grupo__icono" aria-hidden="true">
                {gruposAbiertos.marcas ? "−" : "+"}
              </span>
            </button>

            {gruposAbiertos.marcas && (
              <div className="filtro-grupo__lista filtro-grupo__lista--scroll">
                {marcasConConteo.length === 0 ? (
                  <p className="filtro-grupo__vacio">
                    Sin marcas específicas en esta vista
                  </p>
                ) : (
                  marcasConConteo.map((item) => {
                    const marcado = marcasSeleccionadas.includes(item.nombre);
                    return (
                      <label key={item.clave} className="filtro-opcion">
                        <input
                          type="checkbox"
                          className="filtro-opcion__checkbox"
                          checked={marcado}
                          onChange={() => alternarMarca(item.nombre)}
                        />
                        <span className="filtro-opcion__caja" aria-hidden="true" />
                        <span className="filtro-opcion__texto">{item.nombre}</span>
                        <span className="filtro-opcion__conteo numero">
                          ({item.conteo})
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Grupo: Precio */}
          <div className="filtro-grupo">
            <button
              type="button"
              className="filtro-grupo__cabecera"
              onClick={() => alternarGrupo("precio")}
              aria-expanded={gruposAbiertos.precio}
            >
              <span className="filtro-grupo__titulo">Precio</span>
              <span className="filtro-grupo__icono" aria-hidden="true">
                {gruposAbiertos.precio ? "−" : "+"}
              </span>
            </button>

            {gruposAbiertos.precio && (
              <div className="filtro-grupo__lista">
                {RANGOS_PRECIO.map((rango) => {
                  const marcado = rangosPrecioSeleccionados.includes(rango.id);
                  const cantidad = conteosPorRangoPrecio[rango.id] || 0;
                  return (
                    <label key={rango.id} className="filtro-opcion">
                      <input
                        type="checkbox"
                        className="filtro-opcion__checkbox"
                        checked={marcado}
                        onChange={() => alternarRangoPrecio(rango.id)}
                      />
                      <span className="filtro-opcion__caja" aria-hidden="true" />
                      <span className="filtro-opcion__texto">{rango.etiqueta}</span>
                      <span className="filtro-opcion__conteo numero">
                        ({cantidad})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grupo: Disponibilidad */}
          <div className="filtro-grupo">
            <button
              type="button"
              className="filtro-grupo__cabecera"
              onClick={() => alternarGrupo("disponibilidad")}
              aria-expanded={gruposAbiertos.disponibilidad}
            >
              <span className="filtro-grupo__titulo">Disponibilidad</span>
              <span className="filtro-grupo__icono" aria-hidden="true">
                {gruposAbiertos.disponibilidad ? "−" : "+"}
              </span>
            </button>

            {gruposAbiertos.disponibilidad && (
              <div className="filtro-grupo__lista">
                <label className="filtro-opcion">
                  <input
                    type="checkbox"
                    className="filtro-opcion__checkbox"
                    checked={soloDisponibles}
                    onChange={(e) => setSoloDisponibles(e.target.checked)}
                  />
                  <span className="filtro-opcion__caja" aria-hidden="true" />
                  <span className="filtro-opcion__texto">Solo disponibles</span>
                  <span className="filtro-opcion__conteo numero">
                    ({conteoDisponibles})
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Botón Aplicar filtros */}
          <button
            type="button"
            className="resultados-sidebar__aplicar"
            onClick={aplicarFiltros}
          >
            Aplicar filtros
            {totalFiltrosSidebarActivos > 0 && ` (${totalFiltrosSidebarActivos})`}
          </button>
        </aside>

        {/* COLUMNA PRINCIPAL: CHIPS ACTIVOS + GRILLA DE PRODUCTOS */}
        <section
          ref={rejillaRef}
          id="catalogo-productos"
          className="resultados-contenido"
          aria-label="Lista de productos"
        >
          {/* Pastillas de filtros activos para quitar con un clic */}
          {totalFiltrosSidebarActivos > 0 && (
            <div className="resultados-chips-activos" aria-label="Filtros aplicados">
              {categoriasSeleccionadas.map((cat) => (
                <button
                  key={`cat-${cat}`}
                  type="button"
                  className="resultados-chip-activo"
                  onClick={() => alternarCategoriaSidebar(cat)}
                >
                  <span>{cat}</span>
                  <span aria-hidden="true">✕</span>
                </button>
              ))}

              {marcasSeleccionadas.map((marca) => (
                <button
                  key={`marca-${marca}`}
                  type="button"
                  className="resultados-chip-activo"
                  onClick={() => alternarMarca(marca)}
                >
                  <span>Marca: {marca}</span>
                  <span aria-hidden="true">✕</span>
                </button>
              ))}

              {rangosPrecioSeleccionados.map((idRango) => {
                const info = RANGOS_PRECIO.find((r) => r.id === idRango);
                if (!info) return null;
                return (
                  <button
                    key={`precio-${idRango}`}
                    type="button"
                    className="resultados-chip-activo"
                    onClick={() => alternarRangoPrecio(idRango)}
                  >
                    <span>{info.etiqueta}</span>
                    <span aria-hidden="true">✕</span>
                  </button>
                );
              })}

              {soloDisponibles && (
                <button
                  type="button"
                  className="resultados-chip-activo"
                  onClick={() => setSoloDisponibles(false)}
                >
                  <span>Solo disponibles</span>
                  <span aria-hidden="true">✕</span>
                </button>
              )}

              <button
                type="button"
                className="resultados-chip-limpiar"
                onClick={borrarFiltrosSidebar}
              >
                Borrar todos
              </button>
            </div>
          )}

          {/* 4) SKELETON LOADERS (SHIMMER) MIENTRAS CARGA LA GRILLA */}
          {cargando ? (
            <div
              className="resultados-rejilla"
              aria-busy="true"
              aria-label="Cargando productos"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonTarjeta key={index} />
              ))}
            </div>
          ) : productosFiltradosYOrdenados.length === 0 ? (
            <div className="resultados-vacio">
              <EstadoVacio
                icono="🌾"
                titulo="No encontramos productos con esos filtros"
                descripcion="Prueba quitando algún filtro de marca, rango de precio o disponibilidad para ver más opciones de nuestra bodega."
                accion={
                  totalFiltrosSidebarActivos > 0 ? (
                    <Boton onClick={borrarFiltrosSidebar} variante="primario">
                      Borrar filtros
                    </Boton>
                  ) : (
                    <Boton onClick={volverALaPortada} variante="contorno">
                      ← Seguir comprando
                    </Boton>
                  )
                }
              />
            </div>
          ) : (
            <div className="resultados-rejilla">
              {productosFiltradosYOrdenados.map((producto) => (
                <TarjetaProducto
                  key={producto.id}
                  producto={producto}
                  alAgregar={(prod) => agregarAlCarrito(prod, 1)}
                  agregando={agregandoId === producto.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ============================================================================
 * COMPONENTE PRINCIPAL: HomePage
 * ==========================================================================*/
export function HomePage() {
  const { productosActivos, categorias, cargando } = useInventario();
  const [parametros, setParametros] = useSearchParams();
  const busqueda = parametros.get("q") || "";
  const categoriaActiva = parametros.get("categoria") || "";
  const verTodoParam = esValorTodoCatalogo(parametros.get("ver") || "");
  const { agregarAlCarrito, agregandoId } = useAgregarAlCarrito();

  const statsRef = useRef(null);
  const landingRef = useRef(null);
  const [statsVisibles, setStatsVisibles] = useState(false);

  const esVistaTodo = esValorTodoCatalogo(categoriaActiva) || verTodoParam;
  const hayFiltrosActivos = Boolean(
    categoriaActiva || busqueda.trim() || verTodoParam,
  );

  // Conteo real de productos por categoría
  const conteoPorCategoria = useMemo(() => {
    const conteo = {};
    for (const prod of productosActivos) {
      if (prod.categoria) {
        conteo[prod.categoria] = (conteo[prod.categoria] || 0) + 1;
      }
    }
    return conteo;
  }, [productosActivos]);

  // Lista base para una mitad del carrusel infinito de categorías
  const categoriasCarruselMitad = useMemo(() => {
    if (categorias.length === 0) return [];
    const MIN_ITEMS_POR_MITAD = 6;
    const base = [...categorias];
    while (base.length < MIN_ITEMS_POR_MITAD) {
      base.push(...categorias);
    }
    return base;
  }, [categorias]);

  // Duración proporcional a la cantidad de categorías para velocidad uniforme
  const duracionCarruselSeg = useMemo(
    () => Math.max(24, Math.round(categoriasCarruselMitad.length * 4.5)),
    [categoriasCarruselMitad.length],
  );

  // Productos con promoción activa real (precioOriginal > precio)
  const productosEnOferta = useMemo(
    () =>
      productosActivos.filter(
        (p) =>
          Boolean(p.tieneDescuento) &&
          Number(p.precioOriginal) > Number(p.precio),
      ),
    [productosActivos],
  );

  // Selección de productos para "⭐ Favoritos de los vecinos" (datos reales del API)
  const productosFavoritosVecinos = useMemo(() => {
    const disponibles = productosActivos.filter((p) => p.disponible !== false);
    const fuente = disponibles.length > 0 ? disponibles : productosActivos;
    return fuente.slice(0, 8);
  }, [productosActivos]);

  // IntersectionObserver para Count-Up de estadísticas
  useEffect(() => {
    const nodo = statsRef.current;
    if (!nodo || statsVisibles) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setStatsVisibles(true), 0);
      return () => clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setStatsVisibles(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(nodo);
    return () => observer.disconnect();
  }, [statsVisibles, hayFiltrosActivos]);

  // IntersectionObserver para Reveal al Scroll de las secciones de la landing
  useEffect(() => {
    const contenedor = landingRef.current;
    if (!contenedor) return undefined;

    const elementos = contenedor.querySelectorAll(".home-reveal");
    if (elementos.length === 0) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      elementos.forEach((el) => el.classList.add("home-reveal--visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("home-reveal--visible");
            observer.unobserve(entrada.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    elementos.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [hayFiltrosActivos, cargando, productosEnOferta.length, categorias.length]);

  const volverALaPortada = () => {
    setParametros({});
  };

  const hrefWhatsApp = `https://wa.me/${BODEGA.whatsapp}?text=${encodeURIComponent(
    "Hola Bodega El Trigal, tengo una consulta sobre mi pedido.",
  )}`;

  /* ========================================================================
   * VISTA DE RESULTADOS (con ?q=, ?categoria= o ?categoria=todos)
   * ===================================================================== */
  if (hayFiltrosActivos) {
    return (
      <VistaResultadosCatalogo
        key={normalizarTexto(categoriaActiva) || "todo"}
        productosActivos={productosActivos}
        productosEnOferta={productosEnOferta}
        categorias={categorias}
        cargando={cargando}
        busqueda={busqueda}
        categoriaActiva={categoriaActiva}
        esVistaTodo={esVistaTodo}
        agregarAlCarrito={agregarAlCarrito}
        agregandoId={agregandoId}
        volverALaPortada={volverALaPortada}
      />
    );
  }

  /* ========================================================================
   * VISTA LANDING SUPERMERCADO PREMIUM (sin filtros ni vista "todos" activa)
   * ===================================================================== */
  return (
    <div ref={landingRef} className="contenedor home-landing">
      {/* 1. HERO CARRUSEL */}
      <CarruselHero />

      {/* 2. QUICK-TILES (fila de 4 bajo el hero) */}
      <section
        className="home-quick-tiles home-reveal home-reveal--visible"
        aria-label="Ventajas rápidas de Bodega El Trigal"
      >
        {QUICK_TILES.map((tile) => (
          <div key={tile.id} className="home-quick-tile">
            <span
              className={`home-quick-tile__icono home-quick-tile__icono--${tile.tono}`}
              aria-hidden="true"
            >
              {tile.icono}
            </span>
            <div className="home-quick-tile__textos">
              <strong className="home-quick-tile__titulo">{tile.titulo}</strong>
              <span className="home-quick-tile__subtitulo">{tile.subtitulo}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 3. "🔥 Ofertas del día" (se oculta si no hay promociones activas) */}
      {productosEnOferta.length > 0 && (
        <section
          id="ofertas-del-dia"
          className="home-seccion home-reveal"
          aria-labelledby="titulo-ofertas-dia"
        >
          <header className="home-sechead">
            <div className="home-sechead__izquierda">
              <span className="home-sechead__chip home-sechead__chip--rojo">
                Hoy
              </span>
              <h2 id="titulo-ofertas-dia" className="home-sechead__titulo serif">
                🔥 Ofertas del día
              </h2>
              <CuentaRegresivaOfertas />
            </div>

            <Link
              to={aRuta.inicioPorCategoria("Ofertas")}
              className="home-sechead__enlace"
            >
              Ver todas →
            </Link>
          </header>

          <div className="catalogo-rejilla">
            {productosEnOferta.slice(0, 8).map((producto) => (
              <TarjetaProducto
                key={producto.id}
                producto={producto}
                alAgregar={(prod) => agregarAlCarrito(prod, 1)}
                agregando={agregandoId === producto.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. "Explora por categoría" (carrusel infinito en una sola fila con pausa en hover) */}
      {categorias.length > 0 && (
        <section
          id="explorar-categorias"
          className="home-seccion home-reveal"
          aria-labelledby="titulo-explora-categorias"
        >
          <header className="home-sechead">
            <div className="home-sechead__izquierda">
              <span className="home-sechead__chip">Pasillos</span>
              <h2
                id="titulo-explora-categorias"
                className="home-sechead__titulo serif"
              >
                Explora por categoría
              </h2>
            </div>

            <Link
              to={aRuta.inicioCatalogoCompleto()}
              className="home-sechead__enlace"
            >
              Todo el catálogo →
            </Link>
          </header>

          <div
            className="home-categorias-carrusel"
            aria-label="Carrusel de categorías del supermercado"
          >
            <div
              className="home-categorias-carrusel__pista"
              style={{ "--duracion-carrusel": `${duracionCarruselSeg}s` }}
            >
              {[0, 1].map((mitadIdx) => (
                <div
                  key={mitadIdx}
                  className="home-categorias-carrusel__grupo"
                  aria-hidden={mitadIdx === 1 ? "true" : undefined}
                >
                  {categoriasCarruselMitad.map((cat, idx) => {
                    const clave = normalizarTexto(cat);
                    const meta = META_CATEGORIA[clave] || {
                      icono: "🌾",
                      detalle: "Productos seleccionados",
                    };
                    const cantidad = conteoPorCategoria[cat] || 0;

                    return (
                      <Link
                        key={`${mitadIdx}-${cat}-${idx}`}
                        to={aRuta.inicioPorCategoria(cat)}
                        className="home-categoria-tile"
                        tabIndex={mitadIdx === 1 ? -1 : undefined}
                      >
                        <span
                          className="home-categoria-tile__icono"
                          aria-hidden="true"
                        >
                          {meta.icono}
                        </span>
                        <div className="home-categoria-tile__cuerpo">
                          <h3 className="home-categoria-tile__nombre serif">
                            {cat}
                          </h3>
                          <p className="home-categoria-tile__detalle">
                            {meta.detalle}
                          </p>
                          {cantidad > 0 && (
                            <span className="home-categoria-tile__conteo numero">
                              {cantidad}{" "}
                              {cantidad === 1 ? "producto" : "productos"} →
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. "⭐ Favoritos de los vecinos" */}
      <section
        id="favoritos-vecinos"
        className="home-seccion home-reveal"
        aria-labelledby="titulo-favoritos-vecinos"
      >
        <header className="home-sechead">
          <div className="home-sechead__izquierda">
            <span className="home-sechead__chip home-sechead__chip--oro">
              Destacados
            </span>
            <h2
              id="titulo-favoritos-vecinos"
              className="home-sechead__titulo serif"
            >
              ⭐ Favoritos de los vecinos
            </h2>
          </div>

          <Link
            to={aRuta.inicioCatalogoCompleto()}
            className="home-sechead__enlace"
          >
            Ver todo el catálogo →
          </Link>
        </header>

        {cargando ? (
          <div className="catalogo-rejilla" aria-busy="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonTarjeta key={index} />
            ))}
          </div>
        ) : productosFavoritosVecinos.length === 0 ? (
          <EstadoVacio
            icono="🌾"
            titulo="Catálogo en preparación"
            descripcion="Muy pronto encontrarás aquí los productos favoritos de nuestros caseros."
          />
        ) : (
          <div className="catalogo-rejilla">
            {productosFavoritosVecinos.map((producto) => (
              <TarjetaProducto
                key={producto.id}
                producto={producto}
                alAgregar={(prod) => agregarAlCarrito(prod, 1)}
                agregando={agregandoId === producto.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. "Packs para tu día" (3 tarjetas de color estáticas con CTA) */}
      <section
        id="packs-del-dia"
        className="home-seccion home-reveal"
        aria-labelledby="titulo-packs-dia"
      >
        <header className="home-sechead">
          <div className="home-sechead__izquierda">
            <span className="home-sechead__chip">Ideas prácticas</span>
            <h2 id="titulo-packs-dia" className="home-sechead__titulo serif">
              Packs para tu día
            </h2>
          </div>
        </header>

        <div className="home-packs-grid">
          {PACKS_DEL_DIA.map((pack) => (
            <article
              key={pack.id}
              className={`home-pack-card home-pack-card--${pack.tono}`}
            >
              <div className="home-pack-card__top">
                <span className="home-pack-card__etiqueta">{pack.etiqueta}</span>
                <span className="home-pack-card__emoji" aria-hidden="true">
                  {pack.emoji}
                </span>
              </div>

              <h3 className="home-pack-card__titulo serif">{pack.titulo}</h3>
              <p className="home-pack-card__descripcion">{pack.descripcion}</p>

              <Link to={pack.destino} className="home-pack-card__cta">
                {pack.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* 7. BANDA DE ESTADÍSTICAS (panel degradado terracota + Count-Up) */}
      <section
        ref={statsRef}
        className="home-stats home-reveal"
        aria-label="Bodega El Trigal en cifras"
      >
        <div className="home-stats__grid">
          {ESTADISTICAS.map((stat) => (
            <ItemEstadisticaCountUp
              key={stat.id}
              item={stat}
              activo={statsVisibles}
            />
          ))}
        </div>
      </section>

      {/* 8. FRANJA DE BENEFICIOS (panel kraft) */}
      <section
        className="home-beneficios home-reveal"
        aria-label="Garantías y beneficios de compra"
      >
        <div className="home-beneficios__item">
          <span className="home-beneficios__icono" aria-hidden="true">🛵</span>
          <div>
            <h3 className="home-beneficios__titulo serif">Delivery en Piura</h3>
            <p className="home-beneficios__texto">
              Recibe tu pedido en casa o recógelo listo en nuestra bodega sin hacer colas.
            </p>
          </div>
        </div>

        <div className="home-beneficios__item">
          <span className="home-beneficios__icono" aria-hidden="true">🔒</span>
          <div>
            <h3 className="home-beneficios__titulo serif">Pago 100% seguro</h3>
            <p className="home-beneficios__texto">
              Aceptamos Yape, Plin, tarjetas y efectivo con comprobante inmediato.
            </p>
          </div>
        </div>

        <div className="home-beneficios__item">
          <span className="home-beneficios__icono" aria-hidden="true">🌾</span>
          <div>
            <h3 className="home-beneficios__titulo serif">Productos frescos</h3>
            <p className="home-beneficios__texto">
              Rotación diaria, marcas de confianza y control riguroso de calidad.
            </p>
          </div>
        </div>

        <div className="home-beneficios__item">
          <span className="home-beneficios__icono" aria-hidden="true">💬</span>
          <div>
            <h3 className="home-beneficios__titulo serif">Atención WhatsApp</h3>
            <p className="home-beneficios__texto">
              ¿Necesitas ayuda con tu compra?{" "}
              <a
                href={hrefWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="home-beneficios__link"
              >
                Escríbenos al {BODEGA.telefono}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
