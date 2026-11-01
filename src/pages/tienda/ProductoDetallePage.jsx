/**
 * ============================================================================
 * ProductoDetallePage · Ficha detallada de producto estilo Premium (FASE 5)
 * ----------------------------------------------------------------------------
 * Ruta: /producto/:id
 *
 * Estructura en 2 columnas (grid):
 *   1. COLUMNA MEDIA (izquierda, sticky top:70px en desktop):
 *      · Imagen grande (urlImagen) en panel con borde redondeado (--r-xl),
 *        fondo radial crema y object-fit: contain (con zoom suave al hover).
 *      · Fallback elegante con ícono e iniciales si no hay imagen.
 *      · Pill "OFERTA" arriba-izquierda solo si hay promoción activa real.
 *      · BotonFavorito (corazón) arriba-derecha.
 *      · Tira de miniaturas debajo (muestra la imagen activa).
 *   2. COLUMNA INFO (derecha):
 *      · Marca en mayúsculas (terracota) + categoría (chip) + título Fraunces.
 *      · Estado neutro de calificación ("Producto sin calificar") si no existe
 *        rating real en el API.
 *      · Caja de precio (panel crema): precio actual en Fraunces, precioOriginal
 *        tachado + chip "Ahorras S/ X", y precio por kg/L solo si tiene medida.
 *      · Disponibilidad pública: "● Disponible · Llega hoy en Piura 🛵" o
 *        "Agotado" usando producto.disponible (sin exponer stock numérico).
 *      · Acciones: stepper [− N +] + botón "🛒 Agregar al carrito" + botón
 *        secundario "Pedir por WhatsApp".
 *      · Descripción y Tabla de especificaciones con datos reales: Marca,
 *        Categoría, Código de barras, Presentación/Unidad y Disponibilidad.
 *      · Franja de confianza (3 chips).
 *   3. RELACIONADOS: grilla de TarjetaProducto de la misma categoría.
 * ==========================================================================*/

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useInventario } from "../../hooks/useInventario";
import {
  clases,
  formatearSoles,
  obtenerIniciales,
} from "../../utils/formato";
import { RUTAS, aRuta } from "../../routes/rutas";
import { urlImagen } from "../../api/apiClient";
import { BODEGA } from "../../constantes";
import {
  Alerta,
  Boton,
  BotonFavorito,
  Cargando,
  EstadoVacio,
} from "../../components/ui";
import { TarjetaProducto, useAgregarAlCarrito } from "./catalogo";
import "./ProductoDetallePage.css";

const ICONO_POR_CATEGORIA = {
  Abarrotes: "🍚",
  Bebidas: "🥤",
  Lácteos: "🥛",
  Snacks: "🍪",
  Limpieza: "🧼",
  "Cuidado Personal": "🧴",
  Mascotas: "🐾",
  Gas: "⛽",
  Golosinas: "🍬",
  Panadería: "🥖",
};

/**
 * Calcula el precio por unidad estándar (kg o L) SOLO cuando existe un peso
 * o volumen real en el producto. Nunca inventa datos.
 */
function calcularPrecioPorMedida(producto) {
  if (!producto) return null;
  const precio = Number(producto.precio);
  if (!Number.isFinite(precio) || precio <= 0) return null;

  if (Number(producto.pesoKg) > 0) {
    return `${formatearSoles(precio / Number(producto.pesoKg))} por kg`;
  }
  if (Number(producto.volumenLitros) > 0) {
    return `${formatearSoles(precio / Number(producto.volumenLitros))} por L`;
  }

  const textoFuente = `${producto.presentacion || ""} ${producto.peso || ""} ${producto.nombre || ""}`;
  const match = textoFuente.match(
    /(?:^|\s)(\d+(?:[.,]\d+)?)\s*(kg|kilos?|g|gr|gramos?|ml|l|lt|litros?)\b/i,
  );
  if (!match) return null;

  const valor = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) return null;

  const unidadRaw = match[2].toLowerCase();

  if (unidadRaw === "kg" || unidadRaw.startsWith("kilo")) {
    return `${formatearSoles(precio / valor)} por kg`;
  }
  if (unidadRaw === "g" || unidadRaw === "gr" || unidadRaw.startsWith("gramo")) {
    const enKg = valor / 1000;
    return enKg > 0 ? `${formatearSoles(precio / enKg)} por kg` : null;
  }
  if (unidadRaw === "l" || unidadRaw === "lt" || unidadRaw.startsWith("litro")) {
    return `${formatearSoles(precio / valor)} por L`;
  }
  if (unidadRaw === "ml") {
    const enLitros = valor / 1000;
    return enLitros > 0 ? `${formatearSoles(precio / enLitros)} por L` : null;
  }

  return null;
}

export function ProductoDetallePage() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { obtenerProducto, filtrarPorCategoria, cargando } = useInventario();
  const { agregarAlCarrito, agregandoId } = useAgregarAlCarrito();

  // Estado local asociado al id actual para que al navegar entre relacionados
  // se reinicie automáticamente sin necesidad de setState en useEffect
  const [estadoInteraccion, setEstadoInteraccion] = useState({
    productoId: id,
    cantidad: 1,
    errorImagen: false,
    indiceMiniatura: 0,
    agregadoExitoso: false,
  });

  const estadoActual =
    estadoInteraccion.productoId === id
      ? estadoInteraccion
      : {
        productoId: id,
        cantidad: 1,
        errorImagen: false,
        indiceMiniatura: 0,
        agregadoExitoso: false,
      };

  const { cantidad, errorImagen, indiceMiniatura, agregadoExitoso } = estadoActual;

  const actualizarEstado = (parcial) => {
    setEstadoInteraccion((prev) => {
      const base =
        prev.productoId === id
          ? prev
          : {
            productoId: id,
            cantidad: 1,
            errorImagen: false,
            indiceMiniatura: 0,
            agregadoExitoso: false,
          };
      return { ...base, ...parcial };
    });
  };

  const imgRef = useRef(null);
  const paginaRef = useRef(null);

  const producto = obtenerProducto(id);
  const existeProducto = Boolean(producto);

  // Desplazar suavemente al tope al cambiar de producto
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Reveal al scroll con IntersectionObserver
  useEffect(() => {
    const contenedor = paginaRef.current;
    if (!contenedor) return undefined;

    const elementos = contenedor.querySelectorAll(".detalle-reveal");
    if (elementos.length === 0) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      elementos.forEach((el) => el.classList.add("detalle-reveal--visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("detalle-reveal--visible");
            observer.unobserve(entrada.target);
          }
        }
      },
      { threshold: 0.08 },
    );

    elementos.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [id, cargando, existeProducto]);

  // Zoom suave de la imagen principal siguiendo el cursor
  const handleMouseMove = (e) => {
    if (e.nativeEvent?.pointerType === "touch") return;
    if (window.matchMedia && !window.matchMedia("(hover: hover)").matches) return;
    const img = imgRef.current;
    if (!img) return;

    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = "scale(1.65)";
  };

  const handleMouseLeave = () => {
    const img = imgRef.current;
    if (!img) return;

    img.style.transform = "scale(1)";
    img.style.transformOrigin = "center";
  };

  // Productos relacionados de la misma categoría (excluyendo el actual)
  const productosRelacionados = useMemo(() => {
    if (!producto?.categoria) return [];
    return filtrarPorCategoria(producto.categoria)
      .filter((p) => p.id !== producto.id)
      .slice(0, 4);
  }, [producto, filtrarPorCategoria]);

  if (cargando) {
    return (
      <div className="contenedor seccion">
        <Cargando texto="Cargando información del producto…" />
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="contenedor seccion">
        <EstadoVacio
          icono="📦"
          titulo="Producto no encontrado"
          descripcion="El producto que buscas no existe o ha sido retirado de nuestra tienda."
          accion={
            <Boton como={Link} to={RUTAS.INICIO} variante="primario">
              ← Volver al catálogo
            </Boton>
          }
        />
      </div>
    );
  }

  // Disponibilidad pública evaluada con producto.disponible (sin exponer stock numérico)
  const tieneStockNumerico =
    producto.stock !== undefined &&
    producto.stock !== null &&
    Number.isFinite(Number(producto.stock));
  const stockDisponible = tieneStockNumerico ? Number(producto.stock) : null;

  const disponible =
    typeof producto.disponible === "boolean"
      ? producto.disponible
      : tieneStockNumerico
        ? stockDisponible > 0
        : true;

  const sinStock = !disponible;
  const limiteSuperiorCantidad =
    tieneStockNumerico && stockDisponible > 0 ? stockDisponible : 99;

  // Promoción activa real (precioOriginal > precio)
  const precioActual = Number(producto.precio) || 0;
  const precioOriginal = Number(producto.precioOriginal) || 0;
  const tienePromoActiva =
    Boolean(producto.tieneDescuento) && precioOriginal > precioActual;
  const montoAhorro = tienePromoActiva ? precioOriginal - precioActual : 0;

  const precioPorMedida = calcularPrecioPorMedida(producto);
  const presentacionUnidad =
    producto.unidadMedida || producto.unidad || "Unidad";

  // Galería de imágenes reales del producto (soporta galería futura o imagen única)
  const listaImagenes =
    Array.isArray(producto.imagenes) && producto.imagenes.length > 0
      ? producto.imagenes.filter(Boolean)
      : producto.imagen
        ? [producto.imagen]
        : [];
  const imagenActivaRaw =
    listaImagenes[indiceMiniatura] || listaImagenes[0] || null;
  const mostrarImagenReal = Boolean(imagenActivaRaw) && !errorImagen;

  const iconoCategoria = ICONO_POR_CATEGORIA[producto.categoria] || "🌾";
  const inicialesProducto = obtenerIniciales(producto.nombre || "ET");
  const estaAgregando = agregandoId === producto.id;

  // Rating real (si algún día el API lo provee); si no, estado neutro sin inventar
  const ratingReal =
    Number(producto.calificacion ?? producto.rating) > 0
      ? Number(producto.calificacion ?? producto.rating)
      : null;

  // Parámetros de contacto para WhatsApp (se mantiene la lógica existente)
  const digitosTelefono = (BODEGA.telefono || "").replace(/\D/g, "");
  const numeroWhatsApp = digitosTelefono.startsWith("51")
    ? digitosTelefono
    : `51${digitosTelefono}`;
  const mensajeWhatsApp =
    "Hola Bodega El Trigal, quiero pedir: " +
    producto.nombre +
    " - " +
    formatearSoles(producto.precio) +
    ". ¿Está disponible?";
  const hrefWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeWhatsApp)}`;

  const incrementarCantidad = () => {
    if (cantidad < limiteSuperiorCantidad) {
      actualizarEstado({ cantidad: cantidad + 1 });
    }
  };

  const decrementarCantidad = () => {
    if (cantidad > 1) {
      actualizarEstado({ cantidad: cantidad - 1 });
    }
  };

  const handleAgregarAlCarrito = async () => {
    if (sinStock || estaAgregando) return;

    await agregarAlCarrito(producto, cantidad);
    actualizarEstado({ agregadoExitoso: true });

    setTimeout(() => {
      actualizarEstado({ agregadoExitoso: false });
    }, 3200);
  };

  const manejarVolver = () => {
    if (window.history.length > 2) {
      navegar(-1);
    } else {
      navegar(RUTAS.INICIO);
    }
  };

  return (
    <div ref={paginaRef} className="contenedor detalle-producto">
      {/* BARRA SUPERIOR: Botón "← Volver" + migas de pan */}
      <nav className="detalle-producto__navegacion" aria-label="Ruta de navegación">
        <button
          type="button"
          className="detalle-producto__btn-volver"
          onClick={manejarVolver}
        >
          <span aria-hidden="true">←</span>
          <span>Volver</span>
        </button>

        <ol className="detalle-producto__migas">
          <li>
            <Link to={RUTAS.INICIO}>Inicio</Link>
          </li>
          {producto.categoria && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={aRuta.inicioPorCategoria(producto.categoria)}>
                  {producto.categoria}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="detalle-producto__miga-actual">
            {producto.nombre}
          </li>
        </ol>
      </nav>

      {/* Alerta de confirmación al agregar */}
      {agregadoExitoso && (
        <div className="detalle-producto__alerta">
          <Alerta
            variante="exito"
            alCerrar={() => actualizarEstado({ agregadoExitoso: false })}
          >
            <div className="detalle-producto__alerta-contenido">
              <span>
                ✓ ¡Agregaste{" "}
                <strong>
                  {cantidad}{" "}
                  {cantidad === 1
                    ? presentacionUnidad.toLowerCase()
                    : `${presentacionUnidad.toLowerCase()}s`}
                </strong>{" "}
                de <em>{producto.nombre}</em> al carrito!
              </span>
              <Boton
                como={Link}
                to={RUTAS.CARRITO}
                variante="contorno"
                tamano="sm"
              >
                Ver carrito →
              </Boton>
            </div>
          </Alerta>
        </div>
      )}

      {/* ====================================================================
       * LAYOUT 2 COLUMNAS: MEDIA (izquierda sticky) + INFO (derecha)
       * ================================================================== */}
      <section
        className="detalle-producto__grid detalle-reveal detalle-reveal--visible"
        aria-label={`Ficha de ${producto.nombre}`}
      >
        {/* ------------------------------------------------------------------
         * 1) COLUMNA MEDIA (izquierda, sticky top:70px en desktop)
         * ---------------------------------------------------------------- */}
        <div className="detalle-media">
          <div
            className="detalle-media__visor"
            onMouseMove={mostrarImagenReal ? handleMouseMove : undefined}
            onMouseLeave={mostrarImagenReal ? handleMouseLeave : undefined}
          >
            {/* Pill "OFERTA" arriba-izquierda SOLO si hay promoción activa */}
            {tienePromoActiva && (
              <span className="detalle-media__pill-oferta">OFERTA</span>
            )}

            {/* BotonFavorito (corazón) arriba-derecha */}
            <div className="detalle-media__favorito">
              <BotonFavorito productoId={producto.id} tamano="md" />
            </div>

            {mostrarImagenReal ? (
              <img
                ref={imgRef}
                src={urlImagen(imagenActivaRaw)}
                alt={producto.nombre}
                className="detalle-media__imagen"
                decoding="async"
                onError={() => actualizarEstado({ errorImagen: true })}
              />
            ) : (
              <div className="detalle-media__fallback" aria-label={producto.nombre}>
                <span className="detalle-media__fallback-icono" aria-hidden="true">
                  {iconoCategoria}
                </span>
                <span className="detalle-media__fallback-iniciales serif">
                  {inicialesProducto}
                </span>
                {producto.categoria && (
                  <span className="detalle-media__fallback-cat">
                    {producto.categoria}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tira de miniaturas debajo (si solo hay 1 imagen, la muestra como única activa) */}
          <div className="detalle-media__miniaturas" role="list" aria-label="Vista en miniatura">
            {(listaImagenes.length > 0 ? listaImagenes : [null]).map(
              (imgItem, index) => {
                const activa = index === indiceMiniatura;
                return (
                  <button
                    key={imgItem || `thumb-${index}`}
                    type="button"
                    role="listitem"
                    className={clases(
                      "detalle-media__miniatura",
                      activa && "detalle-media__miniatura--activa",
                    )}
                    onClick={() =>
                      actualizarEstado({
                        indiceMiniatura: index,
                        errorImagen: false,
                      })
                    }
                    aria-label={`Ver imagen ${index + 1} de ${producto.nombre}`}
                    aria-current={activa ? "true" : undefined}
                  >
                    {imgItem && !errorImagen ? (
                      <img
                        src={urlImagen(imgItem)}
                        alt=""
                        className="detalle-media__miniatura-img"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span
                        className="detalle-media__miniatura-icono"
                        aria-hidden="true"
                      >
                        {iconoCategoria}
                      </span>
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------
         * 2) COLUMNA INFO (derecha)
         * ---------------------------------------------------------------- */}
        <div className="detalle-info">
          {/* Marca en mayúsculas (terracota) + categoría (chip) */}
          <div className="detalle-info__meta-superior">
            <span className="detalle-info__marca">
              {producto.marca || "BODEGA EL TRIGAL"}
            </span>
            {producto.categoria && (
              <Link
                to={aRuta.inicioPorCategoria(producto.categoria)}
                className="detalle-info__chip-categoria"
              >
                <span aria-hidden="true">{iconoCategoria}</span>
                <span>{producto.categoria}</span>
              </Link>
            )}
          </div>

          {/* Nombre grande en Fraunces */}
          <h1 className="detalle-info__titulo serif">{producto.nombre}</h1>

          {/* Calificación: sin inventar estrellas */}
          <div className="detalle-info__calificacion">
            {ratingReal ? (
              <span className="detalle-info__rating-real numero">
                ★ {ratingReal.toFixed(1)}
              </span>
            ) : (
              <span className="detalle-info__rating-neutro">
                ☆ Producto sin calificar
              </span>
            )}
            {producto.codigoBarras && (
              <>
                <span className="detalle-info__separador" aria-hidden="true">·</span>
                <span className="detalle-info__ean numero">
                  EAN {producto.codigoBarras}
                </span>
              </>
            )}
          </div>

          {/* CAJA DE PRECIO (panel crema) */}
          <div className="detalle-precio-caja">
            <div className="detalle-precio-caja__fila-principal">
              <span className="detalle-precio-caja__actual serif numero">
                {formatearSoles(precioActual)}
              </span>

              {tienePromoActiva && (
                <del className="detalle-precio-caja__original numero">
                  {formatearSoles(precioOriginal)}
                </del>
              )}

              {tienePromoActiva && (
                <span className="detalle-precio-caja__ahorro numero">
                  Ahorras {formatearSoles(montoAhorro)}
                </span>
              )}
            </div>

            <div className="detalle-precio-caja__subfila">
              <span className="detalle-precio-caja__presentacion">
                Precio por {presentacionUnidad.toLowerCase()}
              </span>
              {precioPorMedida && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="detalle-precio-caja__por-medida numero">
                    ({precioPorMedida})
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Estado de disponibilidad (usa producto.disponible; sin stock numérico) */}
          <div
            className={clases(
              "detalle-disponibilidad",
              sinStock
                ? "detalle-disponibilidad--agotado"
                : "detalle-disponibilidad--disponible",
            )}
          >
            <span className="detalle-disponibilidad__punto" aria-hidden="true" />
            {sinStock ? (
              <span className="detalle-disponibilidad__texto">
                Agotado temporalmente en tienda web
              </span>
            ) : (
              <span className="detalle-disponibilidad__texto">
                <strong>Disponible</strong> · Llega hoy en Piura 🛵
              </span>
            )}
          </div>

          {/* ACCIONES: Stepper [− N +] + Agregar al carrito + Pedir por WhatsApp */}
          <div className="detalle-acciones">
            <div className="detalle-acciones__fila-principal">
              {/* Stepper de cantidad [− N +] */}
              <div
                className={clases(
                  "detalle-stepper",
                  sinStock && "detalle-stepper--deshabilitado",
                )}
                aria-label="Selector de cantidad"
              >
                <button
                  type="button"
                  className="detalle-stepper__btn"
                  onClick={decrementarCantidad}
                  disabled={cantidad <= 1 || sinStock}
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span
                  className="detalle-stepper__valor numero"
                  aria-live="polite"
                >
                  {cantidad}
                </span>
                <button
                  type="button"
                  className="detalle-stepper__btn"
                  onClick={incrementarCantidad}
                  disabled={cantidad >= limiteSuperiorCantidad || sinStock}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              {/* Botón principal "🛒 Agregar al carrito" */}
              <button
                type="button"
                className={clases(
                  "detalle-acciones__btn-carrito",
                  agregadoExitoso && "detalle-acciones__btn-carrito--exito",
                )}
                disabled={sinStock || estaAgregando}
                onClick={handleAgregarAlCarrito}
              >
                {sinStock ? (
                  <span>Agotado</span>
                ) : estaAgregando ? (
                  <span>Agregando…</span>
                ) : agregadoExitoso ? (
                  <span>✓ ¡Agregado al carrito!</span>
                ) : (
                  <>
                    <span aria-hidden="true">🛒</span>
                    <span>Agregar al carrito</span>
                    <span className="detalle-acciones__subtotal numero">
                      · {formatearSoles(precioActual * cantidad)}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Botón secundario "Pedir por WhatsApp" */}
            <a
              href={hrefWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="detalle-acciones__btn-whatsapp"
            >
              <span aria-hidden="true">💬</span>
              <span>Pedir por WhatsApp</span>
            </a>
          </div>

          {/* Franja de confianza (3 chips) */}
          <div className="detalle-confianza" aria-label="Garantías de compra">
            <div className="detalle-confianza__chip">
              <span className="detalle-confianza__icono" aria-hidden="true">🛵</span>
              <span>Delivery gratis desde S/ 50</span>
            </div>
            <div className="detalle-confianza__chip">
              <span className="detalle-confianza__icono" aria-hidden="true">💳</span>
              <span>Pago Yape / Plin / tarjeta</span>
            </div>
            <div className="detalle-confianza__chip">
              <span className="detalle-confianza__icono" aria-hidden="true">🌾</span>
              <span>Garantía El Trigal</span>
            </div>
          </div>

          {/* DESCRIPCIÓN (producto.descripcion) */}
          <div className="detalle-bloque">
            <h2 className="detalle-bloque__titulo serif">Descripción</h2>
            <p className="detalle-bloque__parrafo">
              {producto.descripcion && producto.descripcion.trim()
                ? producto.descripcion
                : `${producto.nombre} seleccionado con control de frescura y calidad por Bodega El Trigal en Piura.`}
            </p>
          </div>

          {/* TABLA DE ESPECIFICACIONES con datos REALES */}
          <div className="detalle-bloque">
            <h2 className="detalle-bloque__titulo serif">Especificaciones</h2>
            <dl className="detalle-especificaciones">
              <div className="detalle-especificaciones__fila">
                <dt>Marca</dt>
                <dd>{producto.marca || "Sin marca especificada"}</dd>
              </div>
              <div className="detalle-especificaciones__fila">
                <dt>Categoría</dt>
                <dd>{producto.categoria || "General"}</dd>
              </div>
              <div className="detalle-especificaciones__fila">
                <dt>Código de barras</dt>
                <dd className="numero">
                  {producto.codigoBarras || "No especificado"}
                </dd>
              </div>
              <div className="detalle-especificaciones__fila">
                <dt>Presentación / Unidad</dt>
                <dd>{presentacionUnidad}</dd>
              </div>
              <div className="detalle-especificaciones__fila">
                <dt>Disponibilidad</dt>
                <dd
                  className={
                    sinStock
                      ? "detalle-especificaciones__estado--agotado"
                      : "detalle-especificaciones__estado--ok"
                  }
                >
                  {sinStock ? "Agotado" : "Disponible"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * 3) RELACIONADOS: "Más productos en <categoría>"
       * ================================================================== */}
      {productosRelacionados.length > 0 && (
        <section
          className="detalle-relacionados detalle-reveal"
          aria-labelledby="titulo-productos-relacionados"
        >
          <header className="detalle-relacionados__cabecera">
            <div className="detalle-relacionados__izquierda">
              <span className="detalle-relacionados__chip">
                También te puede gustar
              </span>
              <h2
                id="titulo-productos-relacionados"
                className="detalle-relacionados__titulo serif"
              >
                Más productos en {producto.categoria}
              </h2>
            </div>

            <Link
              to={aRuta.inicioPorCategoria(producto.categoria)}
              className="detalle-relacionados__enlace"
            >
              Ver todos en {producto.categoria} →
            </Link>
          </header>

          <div className="detalle-relacionados__rejilla">
            {productosRelacionados.map((relacionado) => (
              <TarjetaProducto
                key={relacionado.id}
                producto={relacionado}
                alAgregar={(prod) => agregarAlCarrito(prod, 1)}
                agregando={agregandoId === relacionado.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductoDetallePage;
