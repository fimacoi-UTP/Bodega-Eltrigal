/**
 * ============================================================================
 * PanelComboInventario · Panel lateral de Inteligencia & Detalle de Catálogo
 * ============================================================================
 * Muestra dos modos con transición suave:
 * 1) Estado por defecto ("Inteligencia de inventario"):
 *    - Tarjeta "Por reponer": lista interactiva de productos con stock <= mínimo.
 *    - Tarjeta "Valor por categoría": mini donut SVG + leyenda compacta.
 *    - Tarjeta "Resumen": total productos, unidades en almacén y valor total.
 * 2) Estado seleccionado ("Detalle del producto"):
 *    - Ficha fotográfica, marcas, códigos (P0000 + EAN-13).
 *    - Precio grande, barra de nivel de stock con colores semánticos.
 *    - Badges de estado en tienda y stock.
 *    - Placeholder para código de barras (preparado para Prompt B).
 *    - Botón de acción principal por ROL (Admin: Editar / Cajero: Ajustar).
 * ==========================================================================*/

import { useMemo } from "react";
import { Badge, Boton, Card } from "../../../components/ui";
import { formatearSoles, clases } from "../../../utils/formato";
import { urlImagen } from "../../../api/apiClient";
import {
  umbralDe,
  estadoStock,
  pluralizar,
} from "./utilesInventario";
import { BarcodeCompacto } from "./EtiquetaProducto";
import "./PanelComboInventario.css";

const COLORES_DONUT = [
  "#8b4513", // terracota El Trigal
  "#d97706", // ámbar
  "#2563eb", // azul
  "#059669", // esmeralda
  "#7c3aed", // violeta
  "#db2777", // rosa
  "#ea580c", // naranja
  "#64748b", // pizarra
];

const ICONO_POR_CATEGORIA = {
  Abarrotes: "🍚",
  Lácteos: "🥛",
  Bebidas: "🥤",
  Snacks: "🍿",
  Limpieza: "🧼",
  Cuidado: "🧴",
  Panadería: "🥖",
  Frutas: "🍎",
  Verduras: "🥦",
  Carnes: "🥩",
  Embutidos: "🌭",
};

export function PanelComboInventario({
  productoSeleccionado = null,
  alDeseleccionar,
  alSeleccionarProducto,
  productos = [],
  onEditar,
  onAjustarStock,
  onImprimirEtiqueta,
  esAdmin = false,
}) {
  // ── Cálculo de productos por reponer ─────────────────────────────────────
  const productosPorReponer = useMemo(() => {
    return productos.filter((p) => Number(p.stock) <= umbralDe(p));
  }, [productos]);

  // ── Cálculo de valor por categoría para el gráfico donut ──────────────────
  const distribucionCategorias = useMemo(() => {
    const mapa = {};
    let total = 0;

    for (const p of productos) {
      const cat = p.categoria || "Otras";
      const val = (Number(p.precio) || 0) * (Number(p.stock) || 0);
      mapa[cat] = (mapa[cat] || 0) + val;
      total += val;
    }

    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    const ordenados = Object.entries(mapa).sort((a, b) => b[1] - a[1]);

    const items = ordenados.map(([nombre, valor], idx) => {
      const porcentaje = total > 0 ? (valor / total) * 100 : 0;
      const strokeLength = (porcentaje / 100) * circumference;
      const dashoffset = -ordenados
        .slice(0, idx)
        .reduce((sum, [, val]) => sum + (total > 0 ? (val / total) * circumference : 0), 0);

      return {
        nombre,
        valor,
        porcentaje,
        strokeLength,
        dashoffset,
        color: COLORES_DONUT[idx % COLORES_DONUT.length],
      };
    });

    return { total, items, circumference, radius };
  }, [productos]);

  // ── Top 5 productos por valor en almacén (insight no repetido) ───────────
  const topProductosValor = useMemo(() => {
    return [...productos]
      .map((p) => {
        const stock = Number(p.stock) || 0;
        const precio = Number(p.precio) || 0;
        return {
          ...p,
          stock,
          precio,
          valorTotal: stock * precio,
        };
      })
      .filter((p) => p.valorTotal > 0)
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5);
  }, [productos]);

  // ──────────────────────────────────────────────────────────────────────────
  // VISTA B: DETALLE DEL PRODUCTO SELECCIONADO
  // ──────────────────────────────────────────────────────────────────────────
  if (productoSeleccionado) {
    const p = productoSeleccionado;
    const stock = Number(p.stock) || 0;
    const minimo = umbralDe(p);
    const estado = estadoStock(p);
    const oculto = p.activo === false;

    // Código formateado P0001
    const codigoP = `P${String(p.id).padStart(4, "0")}`;
    const codigoEan = p.codigoBarras || p.codigo || "7751234567890";

    // Progreso de stock visual (base 100% en 2 veces el mínimo)
    const baseCalculo = minimo > 0 ? minimo * 2 : 10;
    const porcentajeProgreso = Math.min(100, Math.max(6, Math.round((stock / baseCalculo) * 100)));

    let colorProgreso = "#16a34a"; // verde óptimo
    if (stock <= 0) colorProgreso = "#dc2626"; // rojo agotado
    else if (stock <= minimo) colorProgreso = "#d97706"; // ámbar bajo

    return (
      <aside className="panel-combo panel-combo--detalle" aria-label="Detalle de producto">
        {/* Cabecera del panel detalle */}
        <div className="panel-combo__cabecera-detalle">
          <div className="panel-combo__titulo-tag">
            <span className="panel-combo__punto-vivo" aria-hidden="true" />
            <span className="panel-combo__titulo-seccion">Ficha de producto</span>
          </div>

          <button
            type="button"
            className="panel-combo__btn-cerrar"
            onClick={alDeseleccionar}
            title="Volver a inteligencia de inventario"
            aria-label="Cerrar detalle y volver al panel de inteligencia"
          >
            ✕
          </button>
        </div>

        {/* Card Principal: Datos, foto y precios */}
        <Card className="panel-combo__card-detalle" padding="md">
          <div className="panel-combo__perfil-bloque">
            {/* Contenedor fotográfico protagonista centrado */}
            <div className="panel-combo__foto-contenedor" title={p.nombre}>
              {p.imagen && (
                <img
                  src={urlImagen(p.imagen)}
                  alt={p.nombre}
                  className="panel-combo__foto-img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = "flex";
                    }
                  }}
                />
              )}
              <div
                className="panel-combo__foto-fallback"
                style={{ display: p.imagen ? "none" : "flex" }}
              >
                <span className="panel-combo__foto-fallback-icono" aria-hidden="true">
                  {ICONO_POR_CATEGORIA[p.categoria] || "🌾"}
                </span>
                <span className="panel-combo__foto-fallback-texto">
                  {p.categoria || "Sin imagen"}
                </span>
              </div>
            </div>

            <div className="panel-combo__info-principal">
              <span className="panel-combo__pill-categoria">{p.categoria || "General"}</span>
              <h3 className="panel-combo__nombre-producto">{p.nombre}</h3>
              <p className="panel-combo__marca-producto">
                {p.marca ? `Marca: ${p.marca}` : "Sin marca especificada"}
              </p>
            </div>
          </div>

          {/* Identificadores y Códigos */}
          <div className="panel-combo__codigos-fila">
            <div className="panel-combo__codigo-chip" title="Código interno">
              <span className="panel-combo__codigo-etiqueta">ID</span>
              <span className="panel-combo__codigo-valor">{codigoP}</span>
            </div>

            <div className="panel-combo__codigo-chip" title="Código EAN-13">
              <span className="panel-combo__codigo-etiqueta">EAN</span>
              <span className="panel-combo__codigo-valor panel-combo__codigo-valor--mono">
                {codigoEan}
              </span>
            </div>
          </div>

          {/* Badges de Estado */}
          <div className="panel-combo__estados-fila">
            <Badge variante={oculto ? "neutro" : "exito"} tamano="sm" punto>
              {oculto ? "Oculto en web" : "Visible en web"}
            </Badge>

            <Badge variante={estado.variante} tamano="sm" punto>
              {estado.etiqueta}
            </Badge>
          </div>

          {/* Precio en grande */}
          <div className="panel-combo__precio-caja">
            <span className="panel-combo__precio-etiqueta">Precio al público</span>
            <div className="panel-combo__precio-valores">
              <span className="panel-combo__precio-grande">
                {formatearSoles(p.precio)}
              </span>
              {p.tieneDescuento && (
                <del className="panel-combo__precio-tachado">
                  {formatearSoles(p.precioOriginal)}
                </del>
              )}
            </div>
            {p.costo != null && (
              <div style={{ marginTop: "6px", fontSize: "0.8125rem", color: "var(--color-texto-suave)" }}>
                Costo unitario:{" "}
                <strong style={{ color: "var(--color-texto-base)", fontWeight: "600" }}>
                  {formatearSoles(p.costo)}
                </strong>
              </div>
            )}
          </div>

          {/* Barra de progreso Stock vs Mínimo */}
          <div className="panel-combo__stock-caja">
            <div className="panel-combo__stock-texto-top">
              <span className="panel-combo__stock-etiqueta">Nivel de existencias</span>
              <span className="panel-combo__stock-cifra">
                <strong>{stock}</strong> / {minimo} mín.
              </span>
            </div>

            <div className="panel-combo__barra-fondo" role="progressbar" aria-valuenow={stock} aria-valuemin={0} aria-valuemax={baseCalculo}>
              <div
                className="panel-combo__barra-relleno"
                style={{
                  width: `${porcentajeProgreso}%`,
                  backgroundColor: colorProgreso,
                }}
              />
            </div>

            <span className="panel-combo__stock-pie">
              {stock <= 0
                ? "Sin existencias en almacén"
                : stock <= minimo
                  ? `Alerta: llegó al mínimo de reposición (${minimo} ${pluralizar(minimo, p.unidad ?? "unidad")})`
                  : `Nivel saludable (${pluralizar(stock, p.unidad ?? "unidad")})`}
            </span>
          </div>

          {/* Barcode compacto + botón para abrir el modal de etiqueta completa */}
          <div className="panel-combo__barcode-bloque">
            <div className="panel-combo__barcode-tarjeta">
              <BarcodeCompacto producto={p} />
            </div>

            <button
              type="button"
              className="panel-combo__btn-imprimir"
              onClick={() => onImprimirEtiqueta?.(p)}
              title="Ver e imprimir etiqueta de góndola completa"
            >
              <span aria-hidden="true">🖨️</span>
              <span>Imprimir etiqueta</span>
            </button>
          </div>

          {/* Botones de acción contextual según Rol */}
          <div className="panel-combo__acciones-detalle">
            {esAdmin ? (
              <Boton
                variante="primario"
                onClick={() => onEditar(p)}
                icono="✏️"
                className="panel-combo__btn-principal"
              >
                Editar producto
              </Boton>
            ) : (
              <Boton
                variante="primario"
                onClick={() => onAjustarStock(p)}
                icono="📦"
                className="panel-combo__btn-principal"
              >
                Ajustar existencias
              </Boton>
            )}

            <Boton
              variante="contorno"
              onClick={alDeseleccionar}
              className="panel-combo__btn-secundario"
            >
              Cerrar ficha
            </Boton>
          </div>
        </Card>
      </aside>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VISTA A: ESTADO POR DEFECTO · "INTELIGENCIA DE INVENTARIO"
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <aside className="panel-combo panel-combo--inteligencia" aria-label="Inteligencia de inventario">
      <div className="panel-combo__cabecera-seccion">
        <span className="panel-combo__icono-seccion" aria-hidden="true">📊</span>
        <h3 className="panel-combo__titulo-seccion">Inteligencia de inventario</h3>
      </div>

      {/* 1. Tarjeta: Por reponer */}
      <Card className="panel-combo__card" padding="md">
        <div className="panel-combo__card-cabecera">
          <div className="panel-combo__card-titulo-wrap">
            <span className="panel-combo__card-icono" aria-hidden="true">⚠️</span>
            <h4 className="panel-combo__card-titulo">Por reponer</h4>
          </div>
          <span
            className={clases(
              "panel-combo__contador-badge",
              productosPorReponer.length > 0
                ? "panel-combo__contador-badge--alerta"
                : "panel-combo__contador-badge--ok",
            )}
          >
            {productosPorReponer.length}
          </span>
        </div>

        {productosPorReponer.length === 0 ? (
          <div className="panel-combo__estado-ok">
            <span className="panel-combo__ok-icono" aria-hidden="true">🎉</span>
            <span className="panel-combo__ok-titulo">Todo en orden</span>
            <p className="panel-combo__ok-subtitulo">
              Todos los productos tienen existencias por encima de su umbral mínimo.
            </p>
          </div>
        ) : (
          <div className="panel-combo__lista-reponer" role="list">
            {productosPorReponer.map((item) => {
              const stockItem = Number(item.stock) || 0;
              const umbralItem = umbralDe(item);
              const agotado = stockItem <= 0;

              return (
                <button
                  type="button"
                  key={item.id}
                  className="panel-combo__item-reponer"
                  onClick={() => alSeleccionarProducto(item)}
                  title={`Seleccionar ${item.nombre} para ver su ficha`}
                >
                  <div className="panel-combo__item-swatch">
                    {item.imagen ? (
                      <img src={urlImagen(item.imagen)} alt="" className="panel-combo__item-img" />
                    ) : (
                      <span
                        className="panel-combo__item-color"
                        style={{ backgroundColor: item.color || "#8b4513" }}
                      />
                    )}
                  </div>

                  <div className="panel-combo__item-textos">
                    <span className="panel-combo__item-nombre">{item.nombre}</span>
                    <span className="panel-combo__item-meta">
                      Stock: <strong>{stockItem}</strong> / Mín: {umbralItem}
                    </span>
                  </div>

                  <Badge variante={agotado ? "peligro" : "advertencia"} tamano="sm">
                    {agotado ? "Agotado" : "Bajo"}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* 2. Tarjeta: Valor por categoría (Donut SVG) */}
      <Card className="panel-combo__card" padding="md">
        <div className="panel-combo__card-cabecera">
          <div className="panel-combo__card-titulo-wrap">
            <span className="panel-combo__card-icono" aria-hidden="true">🍩</span>
            <h4 className="panel-combo__card-titulo">Valor por categoría</h4>
          </div>
        </div>

        {distribucionCategorias.items.length === 0 ? (
          <p className="panel-combo__sin-datos">No hay productos registrados para calcular.</p>
        ) : (
          <div className="panel-combo__donut-contenedor">
            <div className="panel-combo__donut-grafico-wrap">
              <svg className="panel-combo__donut-svg" viewBox="0 0 130 130" width="130" height="130">
                <g transform="rotate(-90 65 65)">
                  {/* Círculo base de fondo */}
                  <circle
                    cx="65"
                    cy="65"
                    r={distribucionCategorias.radius}
                    fill="none"
                    stroke="#f3ede5"
                    strokeWidth="14"
                  />

                  {/* Segmentos por categoría */}
                  {distribucionCategorias.items.map((cat) => (
                    <circle
                      key={cat.nombre}
                      cx="65"
                      cy="65"
                      r={distribucionCategorias.radius}
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="14"
                      strokeDasharray={`${cat.strokeLength} ${distribucionCategorias.circumference - cat.strokeLength}`}
                      strokeDashoffset={cat.dashoffset}
                      className="panel-combo__donut-segmento"
                    />
                  ))}
                </g>
              </svg>

              <div className="panel-combo__donut-centro" aria-hidden="true">
                <span className="panel-combo__donut-centro-etiqueta">Valor total</span>
                <span className="panel-combo__donut-centro-cifra">
                  {formatearSoles(distribucionCategorias.total)}
                </span>
              </div>
            </div>

            {/* Leyenda compacta */}
            <div className="panel-combo__donut-leyenda">
              {distribucionCategorias.items.slice(0, 5).map((cat) => (
                <div key={cat.nombre} className="panel-combo__leyenda-fila">
                  <span
                    className="panel-combo__leyenda-punto"
                    style={{ backgroundColor: cat.color }}
                    aria-hidden="true"
                  />
                  <span className="panel-combo__leyenda-nombre" title={cat.nombre}>
                    {cat.nombre}
                  </span>
                  <span className="panel-combo__leyenda-pct">
                    {Math.round(cat.porcentaje)}%
                  </span>
                  <span className="panel-combo__leyenda-monto">
                    {formatearSoles(cat.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 3. Tarjeta: Top productos por valor en almacén (No repetido) */}
      <Card className="panel-combo__card" padding="md">
        <div className="panel-combo__card-cabecera">
          <div className="panel-combo__card-titulo-wrap">
            <span className="panel-combo__card-icono" aria-hidden="true">💎</span>
            <h4 className="panel-combo__card-titulo">Mayor valor en almacén</h4>
          </div>
          <span className="panel-combo__contador-badge panel-combo__contador-badge--top">
            Top 5
          </span>
        </div>

        {topProductosValor.length === 0 ? (
          <p className="panel-combo__sin-datos">No hay existencias valorizadas actualmente.</p>
        ) : (
          <div className="panel-combo__lista-top" role="list">
            {topProductosValor.map((item, idx) => (
              <button
                type="button"
                key={item.id}
                className="panel-combo__item-top"
                onClick={() => alSeleccionarProducto(item)}
                title={`Seleccionar ${item.nombre} para ver su ficha`}
              >
                <span
                  className={clases(
                    "panel-combo__ranking-chip",
                    idx === 0 && "panel-combo__ranking-chip--oro",
                  )}
                >
                  #{idx + 1}
                </span>

                <div className="panel-combo__item-swatch">
                  {item.imagen ? (
                    <img src={urlImagen(item.imagen)} alt="" className="panel-combo__item-img" />
                  ) : (
                    <span
                      className="panel-combo__item-color"
                      style={{ backgroundColor: item.color || "#8b4513" }}
                    />
                  )}
                </div>

                <div className="panel-combo__item-textos">
                  <span className="panel-combo__item-nombre">{item.nombre}</span>
                  <span className="panel-combo__item-meta">
                    {item.stock} {pluralizar(item.stock, item.unidad ?? "unidad")} × {formatearSoles(item.precio)}
                  </span>
                </div>

                <span className="panel-combo__item-monto-top">
                  {formatearSoles(item.valorTotal)}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </aside>
  );
}

export default PanelComboInventario;
