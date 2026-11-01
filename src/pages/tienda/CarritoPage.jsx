/**
 * ============================================================================
 * CarritoPage · Página de Carrito de Compras (/carrito) — Rediseño Premium
 * ----------------------------------------------------------------------------
 * Diseño Supermercado Premium coherente con CheckoutPage y las 9 fases de la
 * tienda. Usa exclusivamente los tokens de la Fase 0 (--panel, --crema,
 * --kraft, --terracota, --oro, --verde, --rojo, --tinta, --hairline, --r-*).
 *
 * Estructura:
 *   1. Layout 2 columnas en desktop (≥ 980px):
 *      - Izquierda (flex: 1): Cabecera + Barra de Delivery Gratis + Lista de ítems.
 *      - Derecha (360px, sticky top: 100px): Tarjeta "Resumen del pedido".
 *   2. En móvil (< 980px): 1 columna con resumen al final y barra sticky inferior
 *      con total + botón "Proceder al pago".
 *   3. Lógica de CarritoProvider intacta: items, quitar, cambiarCantidad,
 *      vaciar y total.
 * ==========================================================================*/

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import { Boton } from "../../components/ui";
import {
  clases,
  formatearSoles,
  obtenerIniciales,
} from "../../utils/formato";
import { urlImagen } from "../../api/apiClient";
import { RUTAS, aRuta } from "../../routes/rutas";
import { UMBRAL_DELIVERY_GRATIS } from "../../constantes";
import "./CarritoPage.css";

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
 * Tarjeta individual de un producto dentro de CarritoPage.
 */
function ItemCarritoCard({ item, alCambiarCantidad, alQuitar }) {
  const [errorImg, setErrorImg] = useState(false);
  const [removiendo, setRemoviendo] = useState(false);

  const precioUnitario = Number(item.precio ?? item.precioUnitario ?? 0);
  const precioOriginal = Number(item.precioOriginal ?? 0);
  const tienePromo =
    Boolean(item.tieneDescuento) && precioOriginal > precioUnitario;

  const cantidad = Number(item.cantidad) || 1;
  const subtotalItem = precioUnitario * cantidad;

  // Límite superior cuando existe stock numérico; si es tienda pública (boolean), permite hasta 99
  const tieneStockNumerico =
    item.stock !== undefined &&
    item.stock !== null &&
    Number.isFinite(Number(item.stock));
  const limiteMax =
    tieneStockNumerico && Number(item.stock) > 0 ? Number(item.stock) : 99;

  const mostrarFoto = Boolean(item.imagen) && !errorImg;
  const iconoCat = ICONO_POR_CATEGORIA[item.categoria] || "🌾";
  const iniciales = obtenerIniciales(item.nombre || "ET");
  const enlaceProducto = aRuta.productoDetalle(item.id);

  const subtituloMeta = [
    item.categoria,
    item.unidadMedida || item.unidad,
    item.marca,
  ]
    .filter(Boolean)
    .join(" · ");

  const manejarQuitarSuave = () => {
    if (removiendo) return;
    setRemoviendo(true);
    setTimeout(() => {
      alQuitar(item.id);
    }, 210);
  };

  const iconoPapelera = (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );

  return (
    <article
      className={clases(
        "carrito-item",
        removiendo && "carrito-item--removiendo",
      )}
    >
      {/* 1. Miniatura del producto a la izquierda (72–88px, radio --r, object-fit: cover) */}
      <Link
        to={enlaceProducto}
        className="carrito-item__miniatura"
        aria-label={`Ver detalle de ${item.nombre}`}
      >
        {mostrarFoto ? (
          <img
            src={urlImagen(item.imagen)}
            alt={item.nombre}
            className="carrito-item__img"
            loading="lazy"
            decoding="async"
            onError={() => setErrorImg(true)}
          />
        ) : (
          <div className="carrito-item__fallback" aria-hidden="true">
            <span className="carrito-item__fallback-icono">{iconoCat}</span>
            <span className="carrito-item__fallback-ini serif">
              {iniciales}
            </span>
          </div>
        )}

        {tienePromo && (
          <span className="carrito-item__pill-oferta">OFERTA</span>
        )}
      </Link>

      {/* 2. Información central + controles inferiores */}
      <div className="carrito-item__cuerpo">
        <div className="carrito-item__fila-superior">
          <div className="carrito-item__info">
            <h3 className="carrito-item__nombre serif">
              <Link to={enlaceProducto} className="carrito-item__enlace">
                {item.nombre}
              </Link>
            </h3>

            {subtituloMeta && (
              <span className="carrito-item__meta">{subtituloMeta}</span>
            )}

            {/* Precio unitario (con oferta si aplica) */}
            <div className="carrito-item__precios numero">
              <span
                className={clases(
                  "carrito-item__unitario",
                  tienePromo && "carrito-item__unitario--oferta",
                )}
              >
                {formatearSoles(precioUnitario)} c/u
              </span>

              {tienePromo && (
                <>
                  <del className="carrito-item__original">
                    {formatearSoles(precioOriginal)}
                  </del>
                  <span className="carrito-item__chip-oferta">OFERTA</span>
                </>
              )}
            </div>
          </div>

          {/* Quitar producto: ícono papelera sutil + texto que pasa a --rojo en hover */}
          <button
            type="button"
            className="carrito-item__btn-quitar"
            onClick={manejarQuitarSuave}
            aria-label={`Quitar ${item.nombre} del carrito`}
            title="Quitar del carrito"
          >
            {iconoPapelera}
            <span className="carrito-item__quitar-texto">Quitar</span>
          </button>
        </div>

        {/* Fila inferior: Stepper premium [−] [ N ] [+] y Subtotal en --terracota */}
        <div className="carrito-item__fila-inferior">
          <div
            className="carrito-item__stepper"
            role="group"
            aria-label={`Cantidad de ${item.nombre}`}
          >
            <button
              type="button"
              className="carrito-item__stepper-btn"
              onClick={() => alCambiarCantidad(item.id, cantidad - 1)}
              disabled={cantidad <= 1}
              aria-label={`Disminuir cantidad de ${item.nombre}`}
            >
              −
            </button>

            <span
              className="carrito-item__stepper-valor numero"
              aria-live="polite"
            >
              {cantidad}
            </span>

            <button
              type="button"
              className="carrito-item__stepper-btn"
              onClick={() => alCambiarCantidad(item.id, cantidad + 1)}
              disabled={cantidad >= limiteMax}
              aria-label={`Aumentar cantidad de ${item.nombre}`}
            >
              +
            </button>
          </div>

          <div className="carrito-item__subtotal-bloque">
            <span className="carrito-item__subtotal-etiqueta">Subtotal</span>
            <strong className="carrito-item__subtotal serif numero">
              {formatearSoles(subtotalItem)}
            </strong>
          </div>
        </div>
      </div>
    </article>
  );
}

export const CarritoPage = () => {
  const { items, quitar, cambiarCantidad, vaciar, total } = useCarrito();
  const [confirmandoVaciar, setConfirmandoVaciar] = useState(false);

  // Cálculo de unidades y ahorro total real (cuando hay productos con promoción)
  const { unidades, ahorroTotal } = useMemo(() => {
    let sumaUnidades = 0;
    let sumaAhorro = 0;

    for (const item of items) {
      const cant = Number(item.cantidad) || 0;
      const precioActual = Number(item.precio) || 0;
      const precioOriginal = Number(item.precioOriginal) || 0;

      sumaUnidades += cant;

      if (item.tieneDescuento && precioOriginal > precioActual) {
        sumaAhorro += (precioOriginal - precioActual) * cant;
      }
    }

    return { unidades: sumaUnidades, ahorroTotal: sumaAhorro };
  }, [items]);

  // Progreso hacia Delivery Gratis (umbral S/ 50)
  const umbral = Number(UMBRAL_DELIVERY_GRATIS) || 50;
  const montoFaltante = Math.max(0, umbral - total);
  const porcentajeDelivery = Math.min(
    100,
    Math.round((total / umbral) * 100),
  );
  const tieneDeliveryGratis = total >= umbral;

  /* ========================================================================
   * ESTADO VACÍO PREMIUM (sin productos en el carrito)
   * ===================================================================== */
  if (items.length === 0) {
    return (
      <div className="contenedor seccion carrito-vacio-wrapper">
        <div className="carrito-vacio-card">
          <div className="carrito-vacio-card__icono-aro" aria-hidden="true">
            <span className="carrito-vacio-card__icono">🛒</span>
            <span className="carrito-vacio-card__espiga">🌾</span>
          </div>

          <span className="carrito-vacio-card__chip">Tu canasta piurana</span>
          <h1 className="carrito-vacio-card__titulo serif">
            Tu carrito está vacío
          </h1>
          <p className="carrito-vacio-card__texto">
            Explora nuestros pasillos y añade abarrotes, lácteos, bebidas o
            ofertas del día. Te los llevamos a casa en Piura o los recoges
            listos en la bodega.
          </p>

          <div className="carrito-vacio-card__acciones">
            <Boton
              como={Link}
              to={RUTAS.INICIO}
              variante="primario"
              tamano="lg"
              className="carrito-btn-primario"
            >
              Explorar productos →
            </Boton>
            <Link
              to={aRuta.inicioPorCategoria("Ofertas")}
              className="carrito-vacio-card__ofertas"
            >
              🔥 Ver ofertas del día
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor carrito-pagina">
      {/* ====================================================================
       * LAYOUT 2 COLUMNAS (≥ 980px): IZQUIERDA (Ítems) + DERECHA (Resumen)
       * ================================================================== */}
      <div className="carrito-layout">
        {/* ------------------------------------------------------------------
         * COLUMNA IZQUIERDA: Cabecera + Barra Delivery + Lista de productos
         * ---------------------------------------------------------------- */}
        <section
          className="carrito-columna-principal"
          aria-labelledby="titulo-carrito-compras"
        >
          <header className="carrito-cabecera">
            <div className="carrito-cabecera__top">
              <Link to={RUTAS.INICIO} className="carrito-cabecera__volver">
                <span aria-hidden="true">←</span>
                <span>Seguir comprando</span>
              </Link>
              <span className="carrito-cabecera__chip">Bodega El Trigal</span>
            </div>

            <div className="carrito-cabecera__fila-titulo">
              <h1
                id="titulo-carrito-compras"
                className="carrito-cabecera__titulo serif"
              >
                Carrito de compras
              </h1>

              <span className="carrito-cabecera__contador numero">
                {items.length} {items.length === 1 ? "producto" : "productos"} ·{" "}
                {unidades} {unidades === 1 ? "unidad" : "unidades"}
              </span>
            </div>
          </header>

          {/* BARRA DE DELIVERY GRATIS (umbral S/ 50) */}
          <div
            className={clases(
              "carrito-delivery-barra",
              tieneDeliveryGratis && "carrito-delivery-barra--completado",
            )}
            role="status"
            aria-live="polite"
          >
            <div className="carrito-delivery-barra__cabecera">
              <span
                className="carrito-delivery-barra__icono"
                aria-hidden="true"
              >
                {tieneDeliveryGratis ? "🎉" : "🚚"}
              </span>

              {tieneDeliveryGratis ? (
                <p className="carrito-delivery-barra__texto">
                  <strong>¡Tienes delivery gratis!</strong> Tu compra supera los{" "}
                  <span className="numero">{formatearSoles(umbral)}</span>.
                </p>
              ) : (
                <p className="carrito-delivery-barra__texto">
                  Te faltan{" "}
                  <strong className="numero">
                    {formatearSoles(montoFaltante)}
                  </strong>{" "}
                  para <strong>delivery gratis 🚚</strong>
                </p>
              )}

              <span className="carrito-delivery-barra__porcentaje numero">
                {porcentajeDelivery}%
              </span>
            </div>

            <div
              className="carrito-delivery-barra__pista"
              role="progressbar"
              aria-valuenow={porcentajeDelivery}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso para obtener delivery gratis"
            >
              <div
                className="carrito-delivery-barra__relleno"
                style={{ width: `${porcentajeDelivery}%` }}
              />
            </div>
          </div>

          {/* LISTA DE ÍTEMS */}
          <div className="carrito-lista" role="list" aria-label="Productos en tu carrito">
            {items.map((item) => (
              <div key={item.id} role="listitem">
                <ItemCarritoCard
                  item={item}
                  alCambiarCantidad={cambiarCantidad}
                  alQuitar={quitar}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------
         * COLUMNA DERECHA (~360px, sticky top: 100px): RESUMEN DEL PEDIDO
         * ---------------------------------------------------------------- */}
        <aside
          className="carrito-columna-resumen"
          aria-labelledby="titulo-resumen-carrito"
        >
          <div className="carrito-resumen-card">
            <header className="carrito-resumen-card__cabecera">
              <h2
                id="titulo-resumen-carrito"
                className="carrito-resumen-card__titulo serif"
              >
                Resumen del pedido
              </h2>
              <span className="carrito-resumen-card__badge numero">
                {unidades} {unidades === 1 ? "und." : "unds."}
              </span>
            </header>

            <div className="carrito-resumen-card__desglose">
              <div className="carrito-resumen-card__fila">
                <span>
                  Subtotal ({items.length}{" "}
                  {items.length === 1 ? "producto" : "productos"})
                </span>
                <span className="numero">
                  {formatearSoles(total + ahorroTotal)}
                </span>
              </div>

              {ahorroTotal > 0.009 && (
                <div className="carrito-resumen-card__fila carrito-resumen-card__fila--ahorro">
                  <span>Ahorro en ofertas</span>
                  <span className="numero">
                    − {formatearSoles(ahorroTotal)}
                  </span>
                </div>
              )}

              <div className="carrito-resumen-card__fila">
                <span>Envío</span>
                <span className="carrito-resumen-card__envio-nota">
                  {tieneDeliveryGratis
                    ? "¡Gratis en Piura!"
                    : `Gratis desde ${formatearSoles(umbral)}`}
                </span>
              </div>

              <p className="carrito-resumen-card__subnota">
                El método de entrega (Recojo en tienda gratis o Delivery) se
                elige en el siguiente paso.
              </p>

              <hr className="carrito-resumen-card__divisor" />

              <div className="carrito-resumen-card__total-fila">
                <div className="carrito-resumen-card__total-textos">
                  <span>Total estimado</span>
                  <small>Incluye IGV</small>
                </div>
                <strong className="carrito-resumen-card__total-monto serif numero">
                  {formatearSoles(total)}
                </strong>
              </div>
            </div>

            <div className="carrito-resumen-card__acciones">
              <Boton
                como={Link}
                to={RUTAS.CHECKOUT}
                variante="primario"
                tamano="lg"
                bloque
                className="carrito-btn-primario"
              >
                Proceder al pago →
              </Boton>

              <Link
                to={RUTAS.INICIO}
                className="carrito-resumen-card__seguir"
              >
                ← Seguir comprando
              </Link>

              {/* Vaciar carrito como acción secundaria discreta con confirmación */}
              <div className="carrito-vaciar-bloque">
                {!confirmandoVaciar ? (
                  <button
                    type="button"
                    className="carrito-vaciar-link"
                    onClick={() => setConfirmandoVaciar(true)}
                  >
                    Vaciar carrito
                  </button>
                ) : (
                  <div
                    className="carrito-vaciar-confirmacion"
                    role="alertdialog"
                    aria-label="Confirmar vaciado de carrito"
                  >
                    <span className="carrito-vaciar-confirmacion__pregunta">
                      ¿Quitar todos los productos?
                    </span>
                    <div className="carrito-vaciar-confirmacion__botones">
                      <button
                        type="button"
                        className="carrito-vaciar-confirmacion__si"
                        onClick={() => {
                          vaciar();
                          setConfirmandoVaciar(false);
                        }}
                      >
                        Sí, vaciar
                      </button>
                      <button
                        type="button"
                        className="carrito-vaciar-confirmacion__no"
                        onClick={() => setConfirmandoVaciar(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sellos de confianza */}
            <div className="carrito-resumen-card__confianza">
              <span>🔒 Pago 100% seguro</span>
              <span>·</span>
              <span>📱 Yape · Plin · Efectivo</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ====================================================================
       * BARRA STICKY INFERIOR EN MÓVIL (< 980px)
       * ================================================================== */}
      <div
        className="carrito-barra-movil"
        aria-label="Resumen rápido para pagar en móvil"
      >
        <div className="carrito-barra-movil__interior">
          <div className="carrito-barra-movil__info">
            <span className="carrito-barra-movil__etiqueta">
              Total ({unidades} {unidades === 1 ? "und." : "unds."})
            </span>
            <strong className="carrito-barra-movil__total serif numero">
              {formatearSoles(total)}
            </strong>
          </div>

          <Boton
            como={Link}
            to={RUTAS.CHECKOUT}
            variante="primario"
            tamano="md"
            className="carrito-btn-primario carrito-barra-movil__btn"
          >
            Proceder al pago →
          </Boton>
        </div>
      </div>
    </div>
  );
};

export default CarritoPage;
