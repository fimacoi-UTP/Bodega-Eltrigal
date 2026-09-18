/**
 * ============================================================================
 * ProductoDetallePage · Ficha detallada de producto
 * ----------------------------------------------------------------------------
 * Ruta: /producto/:id
 *
 * Características:
 *   · Lee el parámetro `id` de la URL con useParams().
 *   · Consulta el producto síncronamente con obtenerProducto(id) de useInventario().
 *   · Maneja estados de carga (<Cargando />) y error 404 (<EstadoVacio />).
 *   · Selector de cantidad interactivo con topes (1 hasta el stock disponible).
 *   · Botón "Agregar al carrito" integrado con la firma acordada del carrito.
 *   · Sección de productos relacionados de la misma categoría.
 * ==========================================================================*/

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useInventario } from "../../hooks/useInventario";
import { formatearSoles } from "../../utils/formato";
import { RUTAS } from "../../routes/rutas";
import {
  Alerta,
  Badge,
  Boton,
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
  Golosinas: "🍬",
  Panadería: "🥖",
};

export function ProductoDetallePage() {
  const { id } = useParams();
  const { obtenerProducto, filtrarPorCategoria, cargando } = useInventario();
  const [cantidad, setCantidad] = useState(1);
  const [errorImagen, setErrorImagen] = useState(false);
  const [agregadoExitoso, setAgregadoExitoso] = useState(false);

  const { agregarAlCarrito, agregandoId } = useAgregarAlCarrito();

  const producto = obtenerProducto(id);

  // Productos relacionados de la misma categoría (excluyendo el actual)
  const productosRelacionados = useMemo(() => {
    if (!producto?.categoria) return [];
    return filtrarPorCategoria(producto.categoria)
      .filter((p) => p.id !== producto.id)
      .slice(0, 3);
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

  const stockDisponible = Number(producto.stock) || 0;
  const sinStock = stockDisponible <= 0;
  const stockMinimo = Number(producto.stockMinimo) || 5;
  const pocoStock = !sinStock && stockDisponible <= stockMinimo;

  const iconoCategoria = ICONO_POR_CATEGORIA[producto.categoria] || "🌾";
  const estaAgregando = agregandoId === producto.id;

  const incrementarCantidad = () => {
    if (cantidad < stockDisponible) {
      setCantidad((prev) => prev + 1);
    }
  };

  const decrementarCantidad = () => {
    if (cantidad > 1) {
      setCantidad((prev) => prev - 1);
    }
  };

  const handleAgregarAlCarrito = async () => {
    if (sinStock || estaAgregando) return;

    await agregarAlCarrito(producto, cantidad);
    setAgregadoExitoso(true);

    setTimeout(() => {
      setAgregadoExitoso(false);
    }, 3000);
  };

  return (
    <div className="contenedor detalle-producto">
      {/* Navegación de retorno */}
      <nav className="detalle-producto__navegacion" aria-label="Ruta de regreso">
        <Boton
          como={Link}
          to={RUTAS.INICIO}
          variante="fantasma"
          tamano="sm"
          aria-label="Regresar a la página principal del catálogo"
        >
          ← Volver al catálogo
        </Boton>
      </nav>

      {/* Alerta de confirmación al agregar */}
      {agregadoExitoso && (
        <Alerta variante="exito" alCerrar={() => setAgregadoExitoso(false)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "var(--esp-2)" }}>
            <span>
              ✓ ¡Agregaste <strong>{cantidad} {cantidad === 1 ? (producto.unidad || "unidad") : `${producto.unidad || "unidad"}s`}</strong> de <em>{producto.nombre}</em> al carrito!
            </span>
            <Boton como={Link} to={RUTAS.CARRITO} variante="contorno" tamano="sm">
              Ir al carrito
            </Boton>
          </div>
        </Alerta>
      )}

      {/* Estructura Principal: Visual + Datos */}
      <section className="detalle-producto__principal" aria-label={`Detalles de ${producto.nombre}`}>
        {/* Columna Izquierda: Imagen / Ilustración */}
        <div
          className="detalle-producto__visual-caja"
          style={{
            backgroundColor: producto.color || "var(--color-superficie-suave)",
          }}
        >
          {producto.imagen && !errorImagen ? (
            <img
              src={producto.imagen}
              alt={producto.nombre}
              className="detalle-producto__imagen"
              onError={() => setErrorImagen(true)}
            />
          ) : (
            <div className="detalle-producto__placeholder">
              <span className="detalle-producto__placeholder-icono" role="img" aria-label={producto.categoria}>
                {iconoCategoria}
              </span>
              <Badge variante="neutro" tamano="md">
                {producto.categoria}
              </Badge>
            </div>
          )}

          {/* Estado de stock en la esquina */}
          <div className="detalle-producto__insignia-flotante">
            {sinStock ? (
              <Badge variante="peligro" punto>
                Agotado
              </Badge>
            ) : pocoStock ? (
              <Badge variante="advertencia" punto>
                Últimas {stockDisponible} unidades
              </Badge>
            ) : (
              <Badge variante="exito" punto>
                En stock
              </Badge>
            )}
          </div>
        </div>

        {/* Columna Derecha: Información y compra */}
        <div className="detalle-producto__info">
          <div className="detalle-producto__cabecera-meta">
            {producto.marca && (
              <span className="detalle-producto__marca">{producto.marca}</span>
            )}
            <Badge variante="marca" tamano="sm">
              {producto.categoria}
            </Badge>
          </div>

          <h1 className="detalle-producto__titulo">{producto.nombre}</h1>

          {/* Precio y unidad */}
          <div className="detalle-producto__precio-bloque">
            <span className="detalle-producto__precio">
              {formatearSoles(producto.precio)}
            </span>
            {producto.unidad && (
              <span className="detalle-producto__unidad">
                por {producto.unidad}
              </span>
            )}
          </div>

          {/* Descripción */}
          {producto.descripcion && (
            <div className="detalle-producto__descripcion-bloque">
              <span className="detalle-producto__descripcion-titulo">Descripción</span>
              <p className="detalle-producto__descripcion">{producto.descripcion}</p>
            </div>
          )}

          {/* Disponibilidad de inventario */}
          <div className="detalle-producto__stock-bloque">
            <p className="detalle-producto__stock-texto">
              {sinStock ? (
                <strong style={{ color: "var(--color-peligro)" }}>Sin unidades disponibles por el momento</strong>
              ) : (
                <span>
                  Disponibilidad: <strong>{stockDisponible} {producto.unidad || "unidades"} en almacén</strong>
                </span>
              )}
            </p>
          </div>

          {/* Selector de cantidad y botón Agregar */}
          <div className="detalle-producto__compra">
            <div className="detalle-producto__compra-fila">
              {!sinStock && (
                <div className="detalle-producto__selector-cantidad" aria-label="Selector de cantidad">
                  <button
                    type="button"
                    className="detalle-producto__cantidad-btn"
                    onClick={decrementarCantidad}
                    disabled={cantidad <= 1 || sinStock}
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span className="detalle-producto__cantidad-valor" aria-live="polite">
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    className="detalle-producto__cantidad-btn"
                    onClick={incrementarCantidad}
                    disabled={cantidad >= stockDisponible || sinStock}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
              )}

              <div className="detalle-producto__acciones">
                <Boton
                  variante={agregadoExitoso ? "secundario" : "primario"}
                  tamano="lg"
                  bloque
                  disabled={sinStock}
                  cargando={estaAgregando}
                  onClick={handleAgregarAlCarrito}
                >
                  {sinStock
                    ? "Producto agotado"
                    : agregadoExitoso
                      ? "✓ ¡Agregado al carrito!"
                      : `🛒 Agregar al carrito (${cantidad})`}
                </Boton>
              </div>
            </div>

            {/* Garantías de compra */}
            <div className="detalle-producto__beneficios">
              <div className="detalle-producto__beneficio-item">
                <span>🚚</span>
                <span>Delivery rápido en Piura</span>
              </div>
              <div className="detalle-producto__beneficio-item">
                <span>💳</span>
                <span>Yape, Plin o Efectivo</span>
              </div>
              <div className="detalle-producto__beneficio-item">
                <span>🌾</span>
                <span>Garantía El Trigal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCTOS RELACIONADOS */}
      {productosRelacionados.length > 0 && (
        <section className="detalle-producto__relacionados" aria-label="Productos de la misma categoría">
          <div className="detalle-producto__relacionados-cabecera">
            <h2 className="detalle-producto__relacionados-titulo">
              Más productos en {producto.categoria}
            </h2>
            <Link
              to={`/?categoria=${encodeURIComponent(producto.categoria)}`}
              style={{ fontSize: "var(--texto-sm)", fontWeight: "var(--peso-semi)" }}
            >
              Ver todos →
            </Link>
          </div>

          <div className="rejilla">
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
