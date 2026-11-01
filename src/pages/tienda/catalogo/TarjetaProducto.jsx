/**
 * ============================================================================
 * TarjetaProducto · Tarjeta de producto estilo Supermercado Premium (FASE 2)
 * ----------------------------------------------------------------------------
 * Estructura y microinteracciones:
 *   1. Contenedor con elevación en hover + inclinación 3D suave siguiendo el
 *      cursor (perspective 820px, rotateX/Y máx ~6°).
 *   2. Zona de imagen 1:1 con fondo radial crema, foto real con urlImagen(),
 *      fallback elegante (ícono/iniciales), pill "OFERTA" (#F6C500) solo si
 *      hay descuento real, BotonFavorito en círculo blanco arriba-derecha y
 *      destello (sheen) al pasar el mouse.
 *   3. Cuerpo: marca en mayúsculas color terracota, nombre con altura mínima
 *      alineada, precio actual en Fraunces + tabular-nums, precio original
 *      tachado + chip "Ahorras S/ X" cuando hay promoción, y precio por kg/L
 *      calculado solo cuando el producto tiene peso/volumen real.
 *   4. Acción al pie: botón "+ Agregar" (terracota con shine) que se transforma
 *      en Stepper [ − N + ] sincronizado con CarritoProvider.
 *   5. Animación "vuela al carrito" hacia el ícono del Navbar + Toast premium.
 * ==========================================================================*/

import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BotonFavorito, Toast } from "../../../components/ui";
import { useCarrito } from "../../../context/CarritoContext";
import { RUTAS, aRuta } from "../../../routes/rutas";
import {
  clases,
  formatearSoles,
  obtenerIniciales,
} from "../../../utils/formato";
import { urlImagen } from "../../../api/apiClient";
import { useAgregarAlCarrito } from "./useAgregarAlCarrito";
import "./TarjetaProducto.css";

/**
 * Ícono representativo por categoría para productos sin imagen.
 */
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
 * Calcula el precio por unidad de medida estándar (por kg o por L) SOLO si el
 * producto posee un peso o volumen explícito en sus campos o en su nombre
 * (ej. "Arroz Costeño Extra 5 kg" -> "S/ 4.98 por kg", "Aceite 900 ml" -> "S/ 11.00 por L").
 * Si no existe ese dato, retorna null para omitir la línea sin inventar datos.
 */
function calcularPrecioPorMedida(producto) {
  if (!producto) return null;
  const precio = Number(producto.precio);
  if (!Number.isFinite(precio) || precio <= 0) return null;

  // 1. Campos explícitos si existieran en el objeto
  if (Number(producto.pesoKg) > 0) {
    return `${formatearSoles(precio / Number(producto.pesoKg))} por kg`;
  }
  if (Number(producto.volumenLitros) > 0) {
    return `${formatearSoles(precio / Number(producto.volumenLitros))} por L`;
  }

  // 2. Extraer medida explícita del nombre o presentación (ej. "5 kg", "500 g", "900 ml", "1.5 L")
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
    if (enKg <= 0) return null;
    return `${formatearSoles(precio / enKg)} por kg`;
  }
  if (unidadRaw === "l" || unidadRaw === "lt" || unidadRaw.startsWith("litro")) {
    return `${formatearSoles(precio / valor)} por L`;
  }
  if (unidadRaw === "ml") {
    const enLitros = valor / 1000;
    if (enLitros <= 0) return null;
    return `${formatearSoles(precio / enLitros)} por L`;
  }

  return null;
}

/**
 * Crea un clon visual ligero de la imagen/ícono del producto y lo anima
 * volando hacia el botón del carrito en el Navbar.
 */
function animarVueloAlCarrito(nodoOrigen, srcImagen, iconoFallback) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const destino = document.querySelector(
    ".header-pill--carrito, [data-carrito-destino], .navbar__accion[href='/carrito']",
  );
  if (!nodoOrigen || !destino) return;

  const rectOrigen = nodoOrigen.getBoundingClientRect();
  const rectDestino = destino.getBoundingClientRect();

  // Si el destino está oculto (display:none), no animar
  if (rectDestino.width === 0 && rectDestino.height === 0) return;

  const tamano = 56;
  const inicioX = rectOrigen.left + rectOrigen.width / 2 - tamano / 2;
  const inicioY = rectOrigen.top + rectOrigen.height / 2 - tamano / 2;
  const finX = rectDestino.left + rectDestino.width / 2 - tamano / 2;
  const finY = rectDestino.top + rectDestino.height / 2 - tamano / 2;

  const clon = document.createElement("div");
  clon.className = "catalogo-vuelo-clon";
  clon.setAttribute("aria-hidden", "true");
  clon.style.left = `${inicioX}px`;
  clon.style.top = `${inicioY}px`;
  clon.style.width = `${tamano}px`;
  clon.style.height = `${tamano}px`;

  if (srcImagen) {
    const img = document.createElement("img");
    img.src = srcImagen;
    img.alt = "";
    img.className = "catalogo-vuelo-clon__img";
    clon.appendChild(img);
  } else {
    const span = document.createElement("span");
    span.textContent = iconoFallback || "🌾";
    span.className = "catalogo-vuelo-clon__icono";
    clon.appendChild(span);
  }

  document.body.appendChild(clon);

  const deltaX = finX - inicioX;
  const deltaY = finY - inicioY;

  if (typeof clon.animate === "function") {
    const animacion = clon.animate(
      [
        {
          transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)",
          opacity: 0.96,
        },
        {
          transform: `translate3d(${deltaX * 0.55}px, ${deltaY * 0.55 - 42}px, 0) scale(0.72) rotate(8deg)`,
          opacity: 0.92,
          offset: 0.55,
        },
        {
          transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.22) rotate(16deg)`,
          opacity: 0.15,
        },
      ],
      {
        duration: 620,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );

    animacion.onfinish = () => {
      clon.remove();
      destino.classList.add("header-pill--carrito-recibe");
      setTimeout(() => {
        destino.classList.remove("header-pill--carrito-recibe");
      }, 360);
    };
  } else {
    setTimeout(() => clon.remove(), 620);
  }
}

export function TarjetaProducto({ producto, alAgregar, agregando = false }) {
  const [errorImagen, setErrorImagen] = useState(false);
  const [inclinando, setInclinando] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const tarjetaRef = useRef(null);
  const visualRef = useRef(null);
  const navegar = useNavigate();

  const { agregarAlCarrito: agregarPorDefecto, agregandoId } = useAgregarAlCarrito();
  const { items, cambiarCantidad, quitar } = useCarrito();

  if (!producto) return null;

  const tieneStockNumerico =
    producto.stock !== undefined &&
    producto.stock !== null &&
    Number.isFinite(Number(producto.stock));
  const stockNumerico = tieneStockNumerico ? Number(producto.stock) : null;

  const disponible =
    typeof producto.disponible === "boolean"
      ? producto.disponible
      : tieneStockNumerico
        ? stockNumerico > 0
        : true;

  const sinStock = !disponible;

  const estaCargando = agregando || agregandoId === producto.id;
  const iconoCategoria = ICONO_POR_CATEGORIA[producto.categoria] || "🌾";
  const inicialesProducto = obtenerIniciales(producto.nombre);

  // Datos reales de precio y promoción activa
  const precioActual = Number(producto.precio) || 0;
  const precioOriginal = Number(producto.precioOriginal) || 0;
  const tienePromo =
    Boolean(producto.tieneDescuento) && precioOriginal > precioActual;
  const montoAhorro = tienePromo ? precioOriginal - precioActual : 0;

  // Precio por unidad de medida (kg / L) solo cuando hay dato real
  const textoPrecioPorMedida = calcularPrecioPorMedida(producto);

  // Sincronización con el estado global del carrito
  const itemEnCarrito = items?.find(
    (item) => String(item.id) === String(producto.id),
  );
  const cantidadEnCarrito = itemEnCarrito ? Number(itemEnCarrito.cantidad) : 0;
  const limiteAlcanzado =
    tieneStockNumerico && stockNumerico > 0
      ? cantidadEnCarrito >= stockNumerico
      : false;

  const tieneFotoValida = Boolean(producto.imagen) && !errorImagen;
  const srcFotoReal = tieneFotoValida ? urlImagen(producto.imagen) : null;

  // Inclinación 3D suave siguiendo el cursor (máx ~6°)
  const manejarMouseMove = (e) => {
    const el = tarjetaRef.current;
    if (!el) return;
    if (
      window.matchMedia &&
      (!window.matchMedia("(hover: hover)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      return;
    }

    const rect = el.getBoundingClientRect();
    const xRel = (e.clientX - rect.left) / rect.width - 0.5;
    const yRel = (e.clientY - rect.top) / rect.height - 0.5;

    const maxGrados = 6;
    const rotY = Math.max(-maxGrados, Math.min(maxGrados, xRel * 12));
    const rotX = Math.max(-maxGrados, Math.min(maxGrados, -yRel * 12));

    el.style.setProperty("--rx", `${rotX.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${rotY.toFixed(2)}deg`);
    if (!inclinando) setInclinando(true);
  };

  const manejarMouseLeave = () => {
    const el = tarjetaRef.current;
    if (el) {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    }
    setInclinando(false);
  };

  const handleAgregar = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (sinStock || estaCargando) return;

    // 1. Disparar animación "vuela al carrito"
    animarVueloAlCarrito(visualRef.current, srcFotoReal, iconoCategoria);

    // 2. Agregar al CarritoProvider real
    if (typeof alAgregar === "function") {
      await alAgregar(producto);
    } else {
      await agregarPorDefecto(producto, 1);
    }

    // 3. Mostrar Toast premium de confirmación
    setToastVisible(true);
  };

  const handleAumentar = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (limiteAlcanzado) return;
    animarVueloAlCarrito(visualRef.current, srcFotoReal, iconoCategoria);
    cambiarCantidad(producto.id, cantidadEnCarrito + 1);
  };

  const handleDisminuir = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (cantidadEnCarrito <= 1) {
      quitar(producto.id);
    } else {
      cambiarCantidad(producto.id, cantidadEnCarrito - 1);
    }
  };

  const enlaceDetalle = aRuta.productoDetalle(producto.id);

  return (
    <>
      <article
        ref={tarjetaRef}
        className={clases(
          "catalogo-tarjeta",
          inclinando && "catalogo-tarjeta--inclinando",
          sinStock && "catalogo-tarjeta--agotado",
        )}
        onMouseMove={manejarMouseMove}
        onMouseLeave={manejarMouseLeave}
      >
        {/* ================================================================
         * 1. ZONA DE IMAGEN (aspect-ratio 1/1, fondo radial crema, sheen)
         * ============================================================== */}
        <div ref={visualRef} className="catalogo-tarjeta__visual">
          <Link
            to={enlaceDetalle}
            className="catalogo-tarjeta__enlace-visual"
            aria-label={`Ver detalle de ${producto.nombre}`}
          >
            {tieneFotoValida ? (
              <img
                src={srcFotoReal}
                alt={producto.nombre}
                className="catalogo-tarjeta__imagen"
                loading="lazy"
                decoding="async"
                onError={() => setErrorImagen(true)}
              />
            ) : (
              <div
                className="catalogo-tarjeta__placeholder"
                style={
                  producto.color
                    ? { "--color-fallback": producto.color }
                    : undefined
                }
              >
                <div className="catalogo-tarjeta__fallback-circulo">
                  <span
                    className="catalogo-tarjeta__icono-categoria"
                    role="img"
                    aria-label={producto.categoria || "Producto"}
                  >
                    {iconoCategoria}
                  </span>
                  <span className="catalogo-tarjeta__iniciales">
                    {inicialesProducto}
                  </span>
                </div>
                {producto.categoria && (
                  <span className="catalogo-tarjeta__categoria-texto">
                    {producto.categoria}
                  </span>
                )}
              </div>
            )}
          </Link>

          {/* Pill "OFERTA" arriba-izquierda (#F6C500) SOLO si tiene promoción activa */}
          <div className="catalogo-tarjeta__insignias">
            {tienePromo && (
              <span className="catalogo-tarjeta__pill-oferta">OFERTA</span>
            )}
            {sinStock && (
              <span className="catalogo-tarjeta__pill-stock catalogo-tarjeta__pill-stock--agotado">
                Agotado
              </span>
            )}
          </div>

          {/* BotonFavorito arriba-derecha en círculo blanco */}
          <div className="catalogo-tarjeta__favorito-envoltorio">
            <BotonFavorito productoId={producto.id} tamano="sm" />
          </div>
        </div>

        {/* ================================================================
         * 2. CUERPO (Marca, Nombre, Bloque de Precio Fraunces, Precio/kg)
         * ============================================================== */}
        <div className="catalogo-tarjeta__cuerpo">
          <span className="catalogo-tarjeta__marca">
            {producto.marca || producto.categoria || "EL TRIGAL"}
          </span>

          <h3 className="catalogo-tarjeta__titulo">
            <Link to={enlaceDetalle} className="catalogo-tarjeta__nombre">
              {producto.nombre}
            </Link>
          </h3>

          <div className="catalogo-tarjeta__precio-bloque">
            <div className="catalogo-tarjeta__precios-contenedor">
              <span className="catalogo-tarjeta__precio serif numero">
                {formatearSoles(precioActual)}
              </span>

              {tienePromo && (
                <del className="catalogo-tarjeta__precio-original numero">
                  {formatearSoles(precioOriginal)}
                </del>
              )}
            </div>

            {tienePromo && montoAhorro > 0.009 && (
              <span className="catalogo-tarjeta__chip-ahorro numero">
                Ahorras {formatearSoles(montoAhorro)}
              </span>
            )}

            {textoPrecioPorMedida ? (
              <span className="catalogo-tarjeta__precio-medida numero">
                {textoPrecioPorMedida}
              </span>
            ) : (
              producto.unidad && (
                <span className="catalogo-tarjeta__unidad">
                  Presentación: {producto.unidad}
                </span>
              )
            )}
          </div>
        </div>

        {/* ================================================================
         * 3. ACCIÓN AL PIE (Botón "+ Agregar" con shine o Stepper [ − N + ])
         * ============================================================== */}
        <div className="catalogo-tarjeta__pie">
          {cantidadEnCarrito > 0 ? (
            <div
              className="catalogo-tarjeta__stepper"
              role="group"
              aria-label={`Control de cantidad para ${producto.nombre} en el carrito`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                className="catalogo-tarjeta__stepper-btn catalogo-tarjeta__stepper-btn--menos"
                onClick={handleDisminuir}
                aria-label={
                  cantidadEnCarrito === 1
                    ? `Quitar ${producto.nombre} del carrito`
                    : `Disminuir cantidad de ${producto.nombre}`
                }
                title={
                  cantidadEnCarrito === 1
                    ? "Quitar del carrito"
                    : "Disminuir cantidad"
                }
              >
                <span aria-hidden="true">−</span>
              </button>

              <div className="catalogo-tarjeta__stepper-info">
                <span className="catalogo-tarjeta__stepper-cantidad numero">
                  {cantidadEnCarrito}
                </span>
                <span className="catalogo-tarjeta__stepper-etiqueta">
                  en carrito
                </span>
              </div>

              <button
                type="button"
                className="catalogo-tarjeta__stepper-btn catalogo-tarjeta__stepper-btn--mas"
                onClick={handleAumentar}
                disabled={limiteAlcanzado}
                aria-label={`Aumentar cantidad de ${producto.nombre}`}
                title={
                  limiteAlcanzado
                    ? "Cantidad máxima disponible alcanzada"
                    : "Aumentar cantidad"
                }
              >
                <span aria-hidden="true">+</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="catalogo-tarjeta__btn-agregar"
              disabled={sinStock || estaCargando}
              onClick={handleAgregar}
              aria-label={`Agregar ${producto.nombre} al carrito`}
            >
              {sinStock ? (
                <span>Agotado</span>
              ) : (
                <>
                  <span className="catalogo-tarjeta__btn-mas" aria-hidden="true">
                    +
                  </span>
                  <span>Agregar</span>
                </>
              )}
            </button>
          )}
        </div>
      </article>

      {/* Toast premium de confirmación al agregar */}
      <Toast
        visible={toastVisible}
        onCerrar={() => setToastVisible(false)}
        onClick={() => {
          setToastVisible(false);
          navegar(RUTAS.CARRITO);
        }}
        variante="exito"
        titulo="¡Agregado al carrito!"
        accionTexto="Ver mi carrito →"
        duracion={2800}
      >
        <strong>{producto.nombre}</strong> ({formatearSoles(precioActual)})
      </Toast>
    </>
  );
}

export default TarjetaProducto;
