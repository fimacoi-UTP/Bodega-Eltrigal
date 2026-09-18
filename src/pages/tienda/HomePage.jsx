/**
 * ============================================================================
 * HomePage · Catálogo principal de la tienda web
 * ----------------------------------------------------------------------------
 * Es la portada de Bodega El Trigal y la primera impresión del cliente.
 *
 * Características:
 *   · Sección de bienvenida (Hero) con la identidad piurana de la bodega.
 *   · Filtro dinámico por categoría leyendo ?categoria= de la URL (sincronizado
 *     con los enlaces del Navbar).
 *   · Buscador en tiempo real por texto (nombre, marca, categoría).
 *   · Rejilla responsive de productos mediante la clase CSS .rejilla.
 *   · Manejo de estados de carga (<Cargando />) y vacío (<EstadoVacio />).
 *   · Integración con la firma acordada del Carrito.
 * ==========================================================================*/

import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInventario } from "../../hooks/useInventario";
import { normalizarTexto } from "../../utils/formato";
import { RUTAS } from "../../routes/rutas";
import {
  Alerta,
  Badge,
  Boton,
  Cargando,
  EstadoVacio,
  Input,
} from "../../components/ui";
import { TarjetaProducto, useAgregarAlCarrito } from "./catalogo";
import "./HomePage.css";

export function HomePage() {
  const { productosActivos, categorias, cargando } = useInventario();
  const [parametros, setParametros] = useSearchParams();
  const [busqueda, setBusqueda] = useState("");
  const { agregarAlCarrito, ultimoAgregado, limpiarAviso, agregandoId } =
    useAgregarAlCarrito();

  const categoriaActiva = parametros.get("categoria") || "";

  // Conteo de productos por categoría
  const conteoPorCategoria = useMemo(() => {
    const conteo = {};
    for (const prod of productosActivos) {
      if (prod.categoria) {
        conteo[prod.categoria] = (conteo[prod.categoria] || 0) + 1;
      }
    }
    return conteo;
  }, [productosActivos]);

  // Filtrado reactivo por categoría y búsqueda textual
  const productosVisibles = useMemo(() => {
    let lista = productosActivos;

    if (categoriaActiva && categoriaActiva !== "Todas") {
      lista = lista.filter((p) => p.categoria === categoriaActiva);
    }

    if (busqueda.trim()) {
      const consulta = normalizarTexto(busqueda).trim();
      lista = lista.filter((producto) =>
        [producto.nombre, producto.marca, producto.categoria]
          .map(normalizarTexto)
          .some((campo) => campo.includes(consulta)),
      );
    }

    return lista;
  }, [productosActivos, categoriaActiva, busqueda]);

  const seleccionarCategoria = (cat) => {
    if (!cat || cat === "Todas" || cat === categoriaActiva) {
      // Quitar filtro de categoría
      const nuevos = new URLSearchParams(parametros);
      nuevos.delete("categoria");
      setParametros(nuevos);
    } else {
      setParametros({ categoria: cat });
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setParametros({});
  };

  const hayFiltrosActivos = Boolean(categoriaActiva || busqueda.trim());

  return (
    <div className="contenedor">
      {/* 1. SECCIÓN DE BIENVENIDA (HERO) */}
      <section className="catalogo-hero" aria-label="Bienvenida a Bodega El Trigal">
        <div className="catalogo-hero__contenido">
          <Badge variante="marca" tamano="sm" className="catalogo-hero__insignia">
            🌾 Tu bodega de barrio en Piura
          </Badge>
          <h1 className="catalogo-hero__titulo">
            Todo para tu hogar, <span className="catalogo-hero__destaque">fresco y al mejor precio</span>
          </h1>
          <p className="catalogo-hero__descripcion">
            Abarrotes, bebidas, lácteos y productos esenciales directo a tu puerta en Piura.
            Atención cercana, calidad garantizada y la confianza de los vecinos.
          </p>
          <div className="catalogo-hero__beneficios">
            <span className="catalogo-hero__beneficio">🚚 Delivery rápido en Piura</span>
            <span className="catalogo-hero__beneficio">💳 Yape, Plin y Efectivo</span>
            <span className="catalogo-hero__beneficio">⭐ Stock garantizado</span>
          </div>
        </div>
      </section>

      {/* AVISO TEMPORAL DE PRODUCTO AGREGADO */}
      {ultimoAgregado && (
        <div className="catalogo-aviso-agregado" role="status">
          <Alerta variante="exito">
            <div className="catalogo-aviso-agregado__contenido">
              <span>
                ✓ ¡Agregaste <strong>{ultimoAgregado.producto.nombre}</strong> al carrito!
              </span>
              <Boton
                como={Link}
                to={RUTAS.CARRITO}
                variante="contorno"
                tamano="sm"
                onClick={limpiarAviso}
              >
                Ver carrito
              </Boton>
            </div>
          </Alerta>
        </div>
      )}

      {/* 2. FILTROS Y BUSCADOR */}
      <section className="catalogo-filtros" aria-label="Filtros del catálogo">
        <div className="catalogo-filtros__barra-superior">
          {/* Buscador en tiempo real */}
          <div className="catalogo-filtros__buscador">
            <Input
              type="search"
              placeholder="Buscar arroz, leche, gaseosa, marca..."
              prefijo="🔍"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar productos en el catálogo"
            />
          </div>

          {/* Resumen de resultados en pantallas medianas */}
          <div className="catalogo-resumen">
            <span>
              {productosVisibles.length === 1
                ? "1 producto encontrado"
                : `${productosVisibles.length} productos`}
              {categoriaActiva && ` en ${categoriaActiva}`}
            </span>
            {hayFiltrosActivos && (
              <button
                type="button"
                className="catalogo-resumen__limpiar"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Pastillas de categorías con scroll horizontal */}
        {categorias.length > 0 && (
          <div className="catalogo-categorias-scroll">
            <nav className="catalogo-categorias" aria-label="Filtrar por categoría">
              <button
                type="button"
                className={`catalogo-categoria-btn ${
                  !categoriaActiva ? "catalogo-categoria-btn--activa" : ""
                }`}
                onClick={() => seleccionarCategoria("Todas")}
              >
                Todas <span className="catalogo-categoria-btn__conteo">({productosActivos.length})</span>
              </button>

              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`catalogo-categoria-btn ${
                    categoriaActiva === cat ? "catalogo-categoria-btn--activa" : ""
                  }`}
                  onClick={() => seleccionarCategoria(cat)}
                >
                  {cat}{" "}
                  {conteoPorCategoria[cat] && (
                    <span className="catalogo-categoria-btn__conteo">
                      ({conteoPorCategoria[cat]})
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}
      </section>

      {/* 3. CONTENIDO: CARGANDO / VACÍO / GRILLA */}
      <section className="seccion" style={{ paddingTop: 0 }} aria-label="Lista de productos">
        {cargando ? (
          <Cargando texto="Cargando catálogo de productos…" />
        ) : productosVisibles.length === 0 ? (
          <EstadoVacio
            icono="🔍"
            titulo="No encontramos productos"
            descripcion={
              hayFiltrosActivos
                ? "Prueba cambiando el término de búsqueda o seleccionando otra categoría."
                : "Aún no hay productos disponibles en la tienda."
            }
            accion={
              hayFiltrosActivos ? (
                <Boton onClick={limpiarFiltros} variante="contorno">
                  Ver todo el catálogo
                </Boton>
              ) : null
            }
          />
        ) : (
          <div className="rejilla">
            {productosVisibles.map((producto) => (
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
  );
}

export default HomePage;
