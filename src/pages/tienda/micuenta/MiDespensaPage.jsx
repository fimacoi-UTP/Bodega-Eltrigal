/**
 * ============================================================================
 * MiDespensaPage · Recompra inteligente de favoritos y compras frecuentes
 * ----------------------------------------------------------------------------
 * Estructurado en dos secciones complementarias:
 * 1) ❤️ Mis favoritos: productos marcados explícitamente por el casero.
 * 2) 🔁 Lo que más compras: productos agregados de su historial de pedidos.
 *
 * Cada tarjeta permite ajustar cantidad y agregar al carrito en un clic,
 * sincronizando el botón de favoritos en ambas secciones y en el catálogo.
 * ==========================================================================*/

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { aRuta, RUTAS } from "../../../routes/rutas";
import { formatearSoles } from "../../../utils/formato";
import { urlImagen } from "../../../api/apiClient";
import { pedidosApi } from "../../../api/pedidosApi";
import { useInventario } from "../../../hooks/useInventario";
import { useCarrito } from "../../../context/CarritoContext";
import { useFavoritos } from "../../../hooks/useFavoritos";
import { Badge, Boton, BotonFavorito, Cargando, Alerta, EstadoVacio, Toast } from "../../../components/ui";
import "./MiDespensaPage.css";

/**
 * Visual de la imagen del producto con fallback cálido si falla la carga.
 */
function MiniaturaDespensa({ imagen, nombre }) {
  const [errorCarga, setErrorCarga] = useState(false);

  if (imagen && !errorCarga) {
    return (
      <img
        src={urlImagen(imagen)}
        alt={nombre || "Producto"}
        className="despensa-tarjeta__img"
        onError={() => setErrorCarga(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div className="despensa-tarjeta__fallback" aria-hidden="true">
      <span className="despensa-tarjeta__fallback-icono">🌾</span>
    </div>
  );
}

/**
 * Tarjeta individual para cada producto en la despensa (favorito o recurrente).
 */
function TarjetaDespensaItem({ item, onAgregar }) {
  const [cantidad, setCantidad] = useState(1);
  const [recienAgregado, setRecienAgregado] = useState(false);

  const {
    producto,
    disponible,
    stock,
    nombre,
    precio,
    imagen,
    vecesComprado,
    cantidadTotal,
  } = item;

  const stockMaximo = stock != null && stock > 0 ? Math.max(1, stock) : 99;

  const handleDisminuir = () => {
    setCantidad((prev) => Math.max(1, prev - 1));
  };

  const handleAumentar = () => {
    setCantidad((prev) => Math.min(stockMaximo, prev + 1));
  };

  const handleAgregar = () => {
    if (!disponible || !producto) return;
    onAgregar(producto, cantidad);
    setRecienAgregado(true);
    setTimeout(() => {
      setRecienAgregado(false);
    }, 1200);
  };

  const tieneFrecuencia = typeof vecesComprado === "number" && vecesComprado > 0;
  const textoVeces = vecesComprado === 1 ? "1 vez" : `${vecesComprado} veces`;
  const textoTotal = cantidadTotal === 1 ? "1 unid. en total" : `${cantidadTotal} en total`;

  return (
    <article
      className={`despensa-tarjeta ${!disponible ? "despensa-tarjeta--no-disponible" : ""}`}
    >
      {/* Contenedor Visual */}
      <div className="despensa-tarjeta__visual">
        <MiniaturaDespensa imagen={imagen} nombre={nombre} />

        {/* Badges de estado en esquina superior izquierda */}
        <div className="despensa-tarjeta__badge-pos">
          {!disponible && (
            <Badge variante="neutro" tamano="sm">
              Agotado
            </Badge>
          )}
        </div>

        {/* Botón interactivo de favoritos arriba a la derecha */}
        <div className="despensa-tarjeta__favorito-pos">
          <BotonFavorito productoId={item.productoId} tamano="sm" />
        </div>
      </div>

      {/* Cuerpo informativo */}
      <div className="despensa-tarjeta__cuerpo">
        {/* Stat de frecuencia o etiqueta de favorito */}
        {tieneFrecuencia ? (
          <span className="despensa-tarjeta__stat">
            <span aria-hidden="true">🔄</span> Comprado {textoVeces} · {textoTotal}
          </span>
        ) : (
          <span className="despensa-tarjeta__stat despensa-tarjeta__stat--favorito">
            <span aria-hidden="true">❤️</span> Favorito guardado
          </span>
        )}

        {/* Nombre del producto */}
        <h3 className="despensa-tarjeta__nombre">
          {item.productoId ? (
            <Link
              to={aRuta.productoDetalle(item.productoId)}
              className="despensa-tarjeta__enlace"
            >
              {nombre}
            </Link>
          ) : (
            nombre
          )}
        </h3>

        {/* Precio */}
        <div className="despensa-tarjeta__precio-fila">
          <span className="despensa-tarjeta__precio">
            {precio != null ? formatearSoles(precio) : "—"}
          </span>
        </div>
      </div>

      {/* Pie con stepper y botón de agregar o aviso de no disponibilidad */}
      <div className="despensa-tarjeta__pie">
        {disponible ? (
          <>
            <div className="despensa-tarjeta__stepper-fila">
              <span className="despensa-tarjeta__stepper-label">Cantidad:</span>
              <div className="despensa-stepper" role="group" aria-label="Selector de cantidad">
                <button
                  type="button"
                  className="despensa-stepper__btn"
                  onClick={handleDisminuir}
                  disabled={cantidad <= 1}
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="despensa-stepper__valor">{cantidad}</span>
                <button
                  type="button"
                  className="despensa-stepper__btn"
                  onClick={handleAumentar}
                  disabled={cantidad >= stockMaximo}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>

            <Boton
              variante="primario"
              tamano="sm"
              bloque
              onClick={handleAgregar}
              className="despensa-tarjeta__btn-agregar"
              icono={recienAgregado ? "✓" : "🛒"}
            >
              {recienAgregado ? "Agregado a tu carrito" : "Agregar al carrito"}
            </Boton>
          </>
        ) : (
          <div className="despensa-tarjeta__no-disponible-aviso">
            No disponible por ahora
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * ============================================================================
 * Componente Principal: MiDespensaPage
 * ==========================================================================*/
export function MiDespensaPage() {
  const contextoOutlet = useOutletContext();
  const [pedidosFallback, setPedidosFallback] = useState(null);
  const [cargandoFallback, setCargandoFallback] = useState(false);
  const [errorFallback, setErrorFallback] = useState(null);

  const { obtenerProducto, cargando: cargandoInventario } = useInventario();
  const { agregar } = useCarrito();
  const { favoritosSet, cargando: cargandoFavoritos } = useFavoritos();

  // Toast feedback
  const [toast, setToast] = useState({ visible: false, mensaje: "" });

  const mostrarToast = useCallback((mensaje = "Agregado a tu carrito") => {
    setToast({ visible: true, mensaje });
  }, []);

  const ocultarToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // Si los pedidos no vienen provistos por el Layout, cargamos directamente
  useEffect(() => {
    let cancelado = false;
    if (!contextoOutlet?.pedidos && pedidosFallback === null) {
      pedidosApi
        .obtenerMios()
        .then((data) => {
          if (!cancelado) {
            setPedidosFallback(data || []);
            setErrorFallback(null);
          }
        })
        .catch((err) => {
          if (!cancelado) {
            console.error("[El Trigal] Error al cargar pedidos para despensa:", err);
            setErrorFallback("No se pudo cargar el historial de compras.");
          }
        })
        .finally(() => {
          if (!cancelado) {
            setCargandoFallback(false);
          }
        });
    }

    return () => {
      cancelado = true;
    };
  }, [contextoOutlet?.pedidos, pedidosFallback]);

  const pedidos = useMemo(() => {
    return contextoOutlet?.pedidos ?? pedidosFallback ?? [];
  }, [contextoOutlet?.pedidos, pedidosFallback]);

  const cargando =
    (contextoOutlet?.cargandoPedidos ?? cargandoFallback) ||
    cargandoInventario ||
    cargandoFavoritos;
  const error = contextoOutlet?.errorPedidos ?? errorFallback;

  // Lógica de agregación para SECCIÓN 2: "Lo que más compras"
  const { itemsCompras, mapaFrecuencias } = useMemo(() => {
    const mapa = new Map();
    if (!Array.isArray(pedidos) || pedidos.length === 0) {
      return { itemsCompras: [], mapaFrecuencias: mapa };
    }

    // 1) Filtrar pedidos válidos (excluyendo cancelados)
    const pedidosValidos = pedidos.filter(
      (p) => String(p.estado || "").toUpperCase() !== "CANCELADO"
    );

    // 2) Agrupar por productoId
    for (const pedido of pedidosValidos) {
      const vistosEnEstePedido = new Set();
      const items = Array.isArray(pedido.items) ? pedido.items : [];

      for (const item of items) {
        const id = String(item.productoId || "");
        if (!id || id === "undefined" || id === "null") continue;

        if (!mapa.has(id)) {
          mapa.set(id, {
            productoId: id,
            nombreSnapshot: item.nombre,
            imagenSnapshot: item.imagen,
            precioSnapshot: item.precioUnitario,
            vecesComprado: 0,
            cantidadTotal: 0,
          });
        }

        const registro = mapa.get(id);
        registro.cantidadTotal += Number(item.cantidad) || 1;

        if (!vistosEnEstePedido.has(id)) {
          vistosEnEstePedido.add(id);
          registro.vecesComprado += 1;
        }
      }
    }

    // 3) Ordenar por vecesComprado desc, luego cantidadTotal desc
    const listaOrdenada = Array.from(mapa.values()).sort((a, b) => {
      if (b.vecesComprado !== a.vecesComprado) {
        return b.vecesComprado - a.vecesComprado;
      }
      return b.cantidadTotal - a.cantidadTotal;
    });

    // 4) Enlazar con datos ACTUALES del inventario
    const procesados = listaOrdenada.map((item) => {
      const prodActual = obtenerProducto ? obtenerProducto(item.productoId) : null;
      const existe = !!prodActual;
      const activo = existe && prodActual.activo !== false;
      const tieneStockNum =
        existe &&
        prodActual.stock !== undefined &&
        prodActual.stock !== null &&
        Number.isFinite(Number(prodActual.stock));
      const stock = tieneStockNum ? Number(prodActual.stock) : null;
      const disponible =
        existe &&
        activo &&
        (typeof prodActual.disponible === "boolean"
          ? prodActual.disponible
          : tieneStockNum
            ? stock > 0
            : true);

      return {
        ...item,
        producto: prodActual,
        disponible,
        stock,
        nombre: prodActual?.nombre || item.nombreSnapshot || "Producto",
        precio: prodActual?.precio != null ? prodActual.precio : item.precioSnapshot,
        imagen: prodActual?.imagen || item.imagenSnapshot,
      };
    });

    return { itemsCompras: procesados, mapaFrecuencias: mapa };
  }, [pedidos, obtenerProducto]);

  // Lógica para SECCIÓN 1: "Mis favoritos"
  const itemsFavoritos = useMemo(() => {
    if (!favoritosSet || favoritosSet.size === 0) return [];

    const lista = [];
    for (const prodId of favoritosSet) {
      const idStr = String(prodId);
      const prodActual = obtenerProducto ? obtenerProducto(idStr) : null;
      const existe = !!prodActual;
      const activo = existe && prodActual.activo !== false;
      const tieneStockNum =
        existe &&
        prodActual.stock !== undefined &&
        prodActual.stock !== null &&
        Number.isFinite(Number(prodActual.stock));
      const stock = tieneStockNum ? Number(prodActual.stock) : null;
      const disponible =
        existe &&
        activo &&
        (typeof prodActual.disponible === "boolean"
          ? prodActual.disponible
          : tieneStockNum
            ? stock > 0
            : true);

      // Si también tiene historial de compras, adjuntamos la métrica
      const historial = mapaFrecuencias.get(idStr);

      lista.push({
        productoId: idStr,
        producto: prodActual,
        disponible,
        stock,
        nombre: prodActual?.nombre || historial?.nombreSnapshot || "Producto",
        precio: prodActual?.precio != null ? prodActual.precio : historial?.precioSnapshot,
        imagen: prodActual?.imagen || historial?.imagenSnapshot,
        vecesComprado: historial?.vecesComprado,
        cantidadTotal: historial?.cantidadTotal,
      });
    }

    return lista;
  }, [favoritosSet, obtenerProducto, mapaFrecuencias]);

  const handleAgregarAlCarrito = useCallback(
    (producto, cantidad) => {
      if (!producto) return;
      agregar(producto, cantidad);
      mostrarToast("Agregado a tu carrito");
    },
    [agregar, mostrarToast]
  );

  const ambasVacias = itemsFavoritos.length === 0 && itemsCompras.length === 0;

  if (cargando && (!pedidos || pedidos.length === 0) && itemsFavoritos.length === 0) {
    return <Cargando texto="Cargando tu despensa personalizada..." />;
  }

  if (error && (!pedidos || pedidos.length === 0) && itemsFavoritos.length === 0) {
    return (
      <Alerta variante="peligro" titulo="Error al consultar despensa">
        {error}
      </Alerta>
    );
  }

  return (
    <div className="mi-despensa-seccion">
      {/* Cabecera Principal */}
      <div className="mi-despensa-cabecera">
        <h2 className="mi-despensa-titulo">Mi despensa</h2>
        <p className="mi-despensa-subtitulo">
          Lo que más compras, listo para volver a pedir.
        </p>
      </div>

      {/* Si ambas secciones están vacías, mostramos el empty state global */}
      {ambasVacias ? (
        <EstadoVacio
          icono="🧺"
          titulo="Tu despensa está vacía"
          descripcion="Haz tu primer pedido y aquí aparecerán tus productos de siempre para recomprar al toque."
          accion={
            <Boton como={Link} to={RUTAS.INICIO} variante="primario">
              Ir al catálogo
            </Boton>
          }
        />
      ) : (
        <div className="mi-despensa-secciones">
          {/* ===============================================================
           * SECCIÓN 1 — "❤️ Mis favoritos"
           * ============================================================= */}
          <section className="mi-despensa-bloque" aria-labelledby="seccion-favoritos-titulo">
            <div className="mi-despensa-bloque__cabecera">
              <div className="mi-despensa-bloque__titulo-grupo">
                <span className="mi-despensa-bloque__icono" aria-hidden="true">❤️</span>
                <h3 id="seccion-favoritos-titulo" className="mi-despensa-bloque__titulo">
                  Mis favoritos
                </h3>
                {itemsFavoritos.length > 0 && (
                  <span className="mi-despensa-bloque__conteo">
                    {itemsFavoritos.length}
                  </span>
                )}
              </div>
              <p className="mi-despensa-bloque__descripcion">
                Tus productos preferidos guardados para tenerlos siempre a mano.
              </p>
            </div>

            {itemsFavoritos.length === 0 ? (
              <div className="mi-despensa-aviso-vacio">
                <span className="mi-despensa-aviso-vacio__icono" aria-hidden="true">🤍</span>
                <p className="mi-despensa-aviso-vacio__texto">
                  Aún no tienes favoritos — toca el ❤️ en el catálogo para guardarlos aquí.
                </p>
                <Link to={RUTAS.INICIO} className="mi-despensa-aviso-vacio__enlace">
                  Explorar catálogo →
                </Link>
              </div>
            ) : (
              <div className="mi-despensa-grid">
                {itemsFavoritos.map((item) => (
                  <TarjetaDespensaItem
                    key={`fav-${item.productoId}`}
                    item={item}
                    onAgregar={handleAgregarAlCarrito}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ===============================================================
           * SECCIÓN 2 — "🔁 Lo que más compras"
           * ============================================================= */}
          <section className="mi-despensa-bloque" aria-labelledby="seccion-recurrentes-titulo">
            <div className="mi-despensa-bloque__cabecera">
              <div className="mi-despensa-bloque__titulo-grupo">
                <span className="mi-despensa-bloque__icono" aria-hidden="true">🔁</span>
                <h3 id="seccion-recurrentes-titulo" className="mi-despensa-bloque__titulo">
                  Lo que más compras
                </h3>
                {itemsCompras.length > 0 && (
                  <span className="mi-despensa-bloque__conteo">
                    {itemsCompras.length}
                  </span>
                )}
              </div>
              <p className="mi-despensa-bloque__descripcion">
                Calculado según tus pedidos anteriores para recomprar en un clic.
              </p>
            </div>

            {itemsCompras.length === 0 ? (
              <div className="mi-despensa-aviso-vacio">
                <span className="mi-despensa-aviso-vacio__icono" aria-hidden="true">🛒</span>
                <p className="mi-despensa-aviso-vacio__texto">
                  Aún no registras pedidos anteriores para calcular tus compras frecuentes.
                </p>
                <Link to={RUTAS.INICIO} className="mi-despensa-aviso-vacio__enlace">
                  Hacer mi primer pedido →
                </Link>
              </div>
            ) : (
              <div className="mi-despensa-grid">
                {itemsCompras.map((item) => (
                  <TarjetaDespensaItem
                    key={`rec-${item.productoId}`}
                    item={item}
                    onAgregar={handleAgregarAlCarrito}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Feedback Toast */}
      <Toast
        visible={toast.visible}
        onCerrar={ocultarToast}
        variante="exito"
        duracion={2500}
      >
        {toast.mensaje}
      </Toast>
    </div>
  );
}

export default MiDespensaPage;
