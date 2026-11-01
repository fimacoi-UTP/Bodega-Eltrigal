/**
 * ============================================================================
 * CarritoDrawer · Drawer lateral de carrito estilo Supermercado Premium (FASE 6)
 * ----------------------------------------------------------------------------
 * Conectado directamente a CarritoProvider (items, cambiarCantidad, quitar,
 * total, drawerAbierto, cerrarDrawerCarrito).
 *
 * Estructura:
 *   1. Overlay oscuro + panel deslizante desde la derecha (~390px, max 92vw).
 *      Cierra con clic en overlay, botón "×" o tecla Escape.
 *   2. Cabecera: "🛒 Tu carrito" + contador de unidades + botón cerrar "×".
 *   3. Cuerpo scrollable:
 *      · Miniatura real (urlImagen) con fallback elegante por categoría.
 *      · Nombre + precio unitario ("S/ X c/u").
 *      · Stepper [ − N + ] sincronizado con CarritoProvider.
 *      · Subtotal del ítem (precio × cantidad).
 *      · Botón quitar (×).
 *      · Empty state cálido cuando no hay productos.
 *   4. Pie:
 *      · Barra de progreso hacia "DELIVERY GRATIS" (umbral S/ 50).
 *      · Total en Fraunces color terracota.
 *      · Botón "Finalizar compra →" hacia CheckoutPage.
 *      · Enlace "Ver carrito completo" hacia CarritoPage.
 * ==========================================================================*/

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import { RUTAS, aRuta } from "../../routes/rutas";
import { UMBRAL_DELIVERY_GRATIS } from "../../constantes";
import {
  clases,
  formatearSoles,
  obtenerIniciales,
} from "../../utils/formato";
import { urlImagen } from "../../api/apiClient";
import "./CarritoDrawer.css";

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

/** Fila individual de producto dentro del drawer del carrito. */
function ItemCarritoDrawer({
  item,
  alCambiarCantidad,
  alQuitar,
  alNavegarDetalle,
}) {
  const [errorImg, setErrorImg] = useState(false);

  const precioUnitario = Number(item.precio) || 0;
  const cantidad = Number(item.cantidad) || 1;
  const subtotal = precioUnitario * cantidad;

  const tieneStockNumerico =
    item.stock !== undefined &&
    item.stock !== null &&
    Number.isFinite(Number(item.stock));
  const maxStock =
    tieneStockNumerico && Number(item.stock) > 0 ? Number(item.stock) : 99;

  const mostrarFoto = Boolean(item.imagen) && !errorImg;
  const iconoCat = ICONO_POR_CATEGORIA[item.categoria] || "🌾";
  const iniciales = obtenerIniciales(item.nombre || "ET");

  return (
    <li className="carrito-drawer__item">
      {/* Miniatura real con fallback */}
      <Link
        to={aRuta.productoDetalle(item.id)}
        className="carrito-drawer__miniatura"
        onClick={alNavegarDetalle}
        aria-label={`Ver detalle de ${item.nombre}`}
      >
        {mostrarFoto ? (
          <img
            src={urlImagen(item.imagen)}
            alt={item.nombre}
            className="carrito-drawer__miniatura-img"
            loading="lazy"
            decoding="async"
            onError={() => setErrorImg(true)}
          />
        ) : (
          <span className="carrito-drawer__miniatura-fallback" aria-hidden="true">
            <span className="carrito-drawer__miniatura-icono">{iconoCat}</span>
            <span className="carrito-drawer__miniatura-ini serif">{iniciales}</span>
          </span>
        )}
      </Link>

      {/* Información y controles del ítem */}
      <div className="carrito-drawer__item-cuerpo">
        <div className="carrito-drawer__item-cabecera">
          <Link
            to={aRuta.productoDetalle(item.id)}
            className="carrito-drawer__item-nombre"
            onClick={alNavegarDetalle}
          >
            {item.nombre}
          </Link>

          <button
            type="button"
            className="carrito-drawer__item-quitar"
            onClick={() => alQuitar(item.id)}
            aria-label={`Quitar ${item.nombre} del carrito`}
            title="Quitar producto"
          >
            ×
          </button>
        </div>

        <span className="carrito-drawer__item-unitario numero">
          {formatearSoles(precioUnitario)} c/u
          {item.unidad ? ` · ${item.unidad}` : ""}
        </span>

        <div className="carrito-drawer__item-pie">
          {/* Stepper [ − N + ] */}
          <div
            className="carrito-drawer__stepper"
            role="group"
            aria-label={`Cantidad de ${item.nombre}`}
          >
            <button
              type="button"
              className="carrito-drawer__stepper-btn"
              onClick={() => alCambiarCantidad(item.id, cantidad - 1)}
              aria-label={`Disminuir cantidad de ${item.nombre}`}
            >
              −
            </button>
            <span
              className="carrito-drawer__stepper-valor numero"
              aria-live="polite"
            >
              {cantidad}
            </span>
            <button
              type="button"
              className="carrito-drawer__stepper-btn"
              onClick={() => alCambiarCantidad(item.id, cantidad + 1)}
              disabled={cantidad >= maxStock}
              aria-label={`Aumentar cantidad de ${item.nombre}`}
            >
              +
            </button>
          </div>

          {/* Subtotal del ítem (precio × cantidad) */}
          <span className="carrito-drawer__item-subtotal serif numero">
            {formatearSoles(subtotal)}
          </span>
        </div>
      </div>
    </li>
  );
}

export function CarritoDrawer() {
  const {
    items,
    total,
    cambiarCantidad,
    quitar,
    drawerAbierto,
    cerrarDrawerCarrito,
  } = useCarrito();

  const navegar = useNavigate();
  const panelRef = useRef(null);

  const cantidadTotal = useMemo(
    () => items.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0),
    [items],
  );

  // Cálculo del progreso hacia delivery gratis (umbral S/ 50)
  const montoFaltanteDelivery = Math.max(0, UMBRAL_DELIVERY_GRATIS - total);
  const tieneDeliveryGratis = total >= UMBRAL_DELIVERY_GRATIS && total > 0;
  const porcentajeDelivery = Math.min(
    100,
    Math.round((total / UMBRAL_DELIVERY_GRATIS) * 100),
  );

  // Cerrar con tecla Escape y bloquear el scroll del body mientras está abierto
  useEffect(() => {
    if (!drawerAbierto) return undefined;

    const manejarKeyDown = (e) => {
      if (e.key === "Escape") {
        cerrarDrawerCarrito();
      }
    };

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", manejarKeyDown);

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", manejarKeyDown);
    };
  }, [drawerAbierto, cerrarDrawerCarrito]);

  const irAlCheckout = () => {
    if (items.length === 0) return;
    cerrarDrawerCarrito();
    navegar(RUTAS.CHECKOUT);
  };

  const irAExplorar = () => {
    cerrarDrawerCarrito();
    navegar(aRuta.inicioCatalogoCompleto());
  };

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className={clases(
          "carrito-drawer__overlay",
          drawerAbierto && "carrito-drawer__overlay--abierto",
        )}
        onClick={cerrarDrawerCarrito}
        aria-hidden="true"
      />

      {/* Panel lateral deslizante desde la derecha */}
      <aside
        id="carrito-drawer-lateral"
        ref={panelRef}
        className={clases(
          "carrito-drawer",
          drawerAbierto && "carrito-drawer--abierto",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Tu carrito de compras"
        aria-hidden={!drawerAbierto}
        inert={!drawerAbierto || undefined}
      >
        {/* 2) CABECERA DEL DRAWER */}
        <header className="carrito-drawer__cabecera">
          <div className="carrito-drawer__titulo-grupo">
            <h2 className="carrito-drawer__titulo serif">
              <span aria-hidden="true">🛒</span>
              <span>Tu carrito</span>
            </h2>
            {cantidadTotal > 0 && (
              <span className="carrito-drawer__badge numero">
                {cantidadTotal} {cantidadTotal === 1 ? "unidad" : "unidades"}
              </span>
            )}
          </div>

          <button
            type="button"
            className="carrito-drawer__cerrar"
            onClick={cerrarDrawerCarrito}
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </header>

        {/* Barra de progreso "DELIVERY GRATIS" hacia S/ 50 */}
        <div
          className={clases(
            "carrito-drawer__delivery",
            tieneDeliveryGratis && "carrito-drawer__delivery--logrado",
          )}
        >
          <p className="carrito-drawer__delivery-texto">
            {tieneDeliveryGratis ? (
              <strong>🎉 ¡Tienes delivery gratis!</strong>
            ) : (
              <>
                Te faltan{" "}
                <strong className="numero">
                  {formatearSoles(montoFaltanteDelivery)}
                </strong>{" "}
                para el delivery gratis 🛵
              </>
            )}
          </p>
          <div
            className="carrito-drawer__delivery-barra"
            role="progressbar"
            aria-valuenow={porcentajeDelivery}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso para delivery gratis"
          >
            <div
              className="carrito-drawer__delivery-relleno"
              style={{ width: `${porcentajeDelivery}%` }}
            />
          </div>
        </div>

        {/* 3) CUERPO SCROLLABLE */}
        <div className="carrito-drawer__cuerpo">
          {items.length === 0 ? (
            <div className="carrito-drawer__vacio">
              <div className="carrito-drawer__vacio-icono" aria-hidden="true">
                🧺
              </div>
              <h3 className="carrito-drawer__vacio-titulo serif">
                Tu carrito está vacío · Agrega productos
              </h3>
              <p className="carrito-drawer__vacio-subtitulo">
                Explora nuestros abarrotes, lácteos, bebidas y ofertas del día
                para llenar tu canasta.
              </p>
              <button
                type="button"
                className="carrito-drawer__vacio-btn"
                onClick={irAExplorar}
              >
                Explorar catálogo →
              </button>
            </div>
          ) : (
            <ul className="carrito-drawer__lista">
              {items.map((item) => (
                <ItemCarritoDrawer
                  key={item.id}
                  item={item}
                  alCambiarCantidad={cambiarCantidad}
                  alQuitar={quitar}
                  alNavegarDetalle={cerrarDrawerCarrito}
                />
              ))}
            </ul>
          )}
        </div>

        {/* 4) PIE DEL DRAWER */}
        {items.length > 0 && (
          <footer className="carrito-drawer__pie">
            <div className="carrito-drawer__resumen-fila">
              <div className="carrito-drawer__resumen-textos">
                <span className="carrito-drawer__resumen-etiqueta">
                  Total a pagar
                </span>
                <span className="carrito-drawer__resumen-nota">
                  {tieneDeliveryGratis
                    ? "Incluye delivery gratis en Piura"
                    : "Impuestos incluidos"}
                </span>
              </div>
              <span className="carrito-drawer__total serif numero">
                {formatearSoles(total)}
              </span>
            </div>

            <button
              type="button"
              className="carrito-drawer__btn-checkout"
              onClick={irAlCheckout}
            >
              <span>Finalizar compra</span>
              <span aria-hidden="true">→</span>
            </button>

            <Link
              to={RUTAS.CARRITO}
              className="carrito-drawer__link-completo"
              onClick={cerrarDrawerCarrito}
            >
              Ver carrito completo
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}

export default CarritoDrawer;

