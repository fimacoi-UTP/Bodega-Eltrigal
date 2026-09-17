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

  if (!producto) return null;

  const sinStock = Number(producto.stock) <= 0;
  const stockMinimo = Number(producto.stockMinimo) || 5;
  const pocoStock = !sinStock && Number(producto.stock) <= stockMinimo;

  const estaCargando = agregando || agregandoId === producto.id;

  const iconoCategoria = ICONO_POR_CATEGORIA[producto.categoria] || "🌾";

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

        {/* Insignias flotantes: Stock & Categoría */}
        <div className="catalogo-tarjeta__insignias">
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
          <span className="catalogo-tarjeta__precio">
            {formatearSoles(producto.precio)}
          </span>
          {producto.unidad && (
            <span className="catalogo-tarjeta__unidad">
              por {producto.unidad}
            </span>
          )}
        </div>
      </div>

      {/* Acción principal: Agregar al carrito */}
      <div className="catalogo-tarjeta__pie">
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
      </div>
    </article>
  );
}

export default TarjetaProducto;
