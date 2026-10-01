/**
 * ============================================================================
 * TarjetaProducto · Tarjeta de producto para el catálogo
 * ----------------------------------------------------------------------------
 * Muestra la información esencial de un producto: imagen o color representativo,
 * nombre, marca, precio en soles, estado de stock y botón para agregar al
 * carrito.
 *
 * Sigue el sistema de diseño de Bodega El Trigal y las convenciones UI.
 * ==========================================================================*/

import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Boton } from "../../../components/ui";
import { useCarrito } from "../../../context/CarritoContext";
import { aRuta } from "../../../routes/rutas";
import { formatearSoles } from "../../../utils/formato";
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
  Golosinas: "🍬",
  Panadería: "🥖",
};

export function TarjetaProducto({ producto, alAgregar, agregando = false }) {
  const [errorImagen, setErrorImagen] = useState(false);
  const [recienAgregado, setRecienAgregado] = useState(false);
  const { agregarAlCarrito: agregarPorDefecto, agregandoId } = useAgregarAlCarrito();
  const { items, cambiarCantidad, quitar } = useCarrito();

  if (!producto) return null;

  const sinStock = Number(producto.stock) <= 0;
  const stockMinimo = Number(producto.stockMinimo) || 5;
  const pocoStock = !sinStock && Number(producto.stock) <= stockMinimo;

  const estaCargando = agregando || agregandoId === producto.id;
  const iconoCategoria = ICONO_POR_CATEGORIA[producto.categoria] || "🌾";

  // Sincronización con el estado global del carrito
  const itemEnCarrito = items?.find((item) => String(item.id) === String(producto.id));
  const cantidadEnCarrito = itemEnCarrito ? Number(itemEnCarrito.cantidad) : 0;
  const stockMaximo = Number(producto.stock) || 0;
  const limiteAlcanzado = cantidadEnCarrito >= stockMaximo;

  const handleAgregar = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (sinStock || estaCargando) return;

    if (typeof alAgregar === "function") {
      await alAgregar(producto);
    } else {
      await agregarPorDefecto(producto, 1);
    }

    setRecienAgregado(true);
    setTimeout(() => {
      setRecienAgregado(false);
    }, 1200);
  };

  const handleAumentar = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (limiteAlcanzado) return;
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
    <article className="catalogo-tarjeta">
      {/* Visual: Imagen o Ilustración/Color */}
      <div
        className="catalogo-tarjeta__visual"
        style={{
          backgroundColor: producto.color || "var(--color-superficie-suave)",
        }}
      >
        <Link
          to={enlaceDetalle}
          className="catalogo-tarjeta__enlace-visual"
          tabIndex={-1}
          aria-hidden="true"
        >
          {producto.imagen && !errorImagen ? (
            <img
              src={producto.imagen}
              alt={producto.nombre}
              className="catalogo-tarjeta__imagen"
              loading="lazy"
              onError={() => setErrorImagen(true)}
            />
          ) : (
            <div className="catalogo-tarjeta__placeholder">
              <span className="catalogo-tarjeta__icono-categoria" role="img" aria-label={producto.categoria}>
                {iconoCategoria}
              </span>
              <span className="catalogo-tarjeta__categoria-texto">{producto.categoria}</span>
            </div>
          )}
        </Link>

        {/* Insignias flotantes: Stock & Promoción */}
        <div className="catalogo-tarjeta__insignias">
          {producto.tieneDescuento && (
            <Badge variante="info" tamano="sm">
              Oferta
            </Badge>
          )}
          {sinStock ? (
            <Badge variante="peligro" punto tamano="sm">
              Agotado
            </Badge>
          ) : pocoStock ? (
            <Badge variante="advertencia" punto tamano="sm">
              Últimas {producto.stock}
            </Badge>
          ) : (
            <Badge variante="exito" punto tamano="sm">
              En stock
            </Badge>
          )}
        </div>
      </div>

      {/* Datos del producto */}
      <div className="catalogo-tarjeta__cuerpo">
        {producto.marca && (
          <span className="catalogo-tarjeta__marca">{producto.marca}</span>
        )}

        <h3 className="catalogo-tarjeta__titulo">
          <Link to={enlaceDetalle} className="catalogo-tarjeta__nombre">
            {producto.nombre}
          </Link>
        </h3>

        <div className="catalogo-tarjeta__precio-fila">
          <div className="catalogo-tarjeta__precios-contenedor">
            <span className="catalogo-tarjeta__precio">
              {formatearSoles(producto.precio)}
            </span>
            {producto.tieneDescuento && (
              <del className="catalogo-tarjeta__precio-original">
                {formatearSoles(producto.precioOriginal)}
              </del>
            )}
          </div>
          {producto.unidad && (
            <span className="catalogo-tarjeta__unidad">
              por {producto.unidad}
            </span>
          )}
        </div>
      </div>

      {/* Acción principal: Botón Agregar o Stepper interactivo */}
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
              title={cantidadEnCarrito === 1 ? "Quitar del carrito" : "Disminuir cantidad"}
            >
              <span aria-hidden="true">−</span>
            </button>

            <div className="catalogo-tarjeta__stepper-info">
              <span className="catalogo-tarjeta__stepper-cantidad">
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
              title={limiteAlcanzado ? `Stock máximo disponible (${stockMaximo})` : "Aumentar cantidad"}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
        ) : (
          <Boton
            variante={recienAgregado ? "secundario" : "primario"}
            tamano="sm"
            bloque
            disabled={sinStock}
            cargando={estaCargando}
            onClick={handleAgregar}
            className={recienAgregado ? "catalogo-tarjeta__boton-agregado" : ""}
            aria-label={`Agregar ${producto.nombre} al carrito`}
          >
            {sinStock
              ? "Sin stock"
              : recienAgregado
                ? "✓ ¡Agregado!"
                : "🛒 Agregar al carrito"}
          </Boton>
        )}
      </div>
    </article>
  );
}

export default TarjetaProducto;
