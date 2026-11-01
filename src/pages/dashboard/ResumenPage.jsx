/**
 * ============================================================================
 * RESUMEN · Panel Principal del Dashboard (Bodega El Trigal)
 * ============================================================================
 * Ruta: /dashboard · Acceso: ADMIN y CAJERO
 *
 * Pantalla principal con KPIs animados en tiempo real y gráficos interactivos
 * construidos con Recharts, consumiendo la API de Spring Boot /api/dashboard/*.
 * ==========================================================================*/

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { dashboardApi } from "../../api/dashboardApi";
import { useTema } from "../../hooks/useTema";
import { formatearSoles } from "../../utils/formato";
import { Boton, EstadoVacio, Alerta } from "../../components/ui";
import "./ResumenPage.css";

// Paleta de tokens armónicos de Bodega El Trigal
const PALETA_CATEGORIAS = [
  "#C0532B", // Terracota principal
  "#D9A441", // Oro / Trigo
  "#2E9E5B", // Verde fresco
  "#0284C7", // Azul mostrador
  "#8B5CF6", // Púrpura artesanal
  "#EC4899", // Rosa frambuesa
  "#A8998B", // Tinta suave
];

/**
 * Hook para animación fluida de conteo progresivo (Count-Up)
 */
function CountUpNumero({ valor, esMoneda = false, duracion = 850 }) {
  const [cuenta, setCuenta] = useState(0);

  useEffect(() => {
    const destino = Number(valor) || 0;
    if (destino === 0) {
      return;
    }

    const prefiereMenosMovimiento =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frameId;
    if (prefiereMenosMovimiento) {
      frameId = requestAnimationFrame(() => setCuenta(destino));
      return () => cancelAnimationFrame(frameId);
    }

    let inicioTimestamp = null;
    const animar = (timestamp) => {
      if (!inicioTimestamp) inicioTimestamp = timestamp;
      const progreso = Math.min((timestamp - inicioTimestamp) / duracion, 1);
      // Easing cúbico suave
      const easeOut = 1 - Math.pow(1 - progreso, 3);
      setCuenta(easeOut * destino);

      if (progreso < 1) {
        frameId = requestAnimationFrame(animar);
      } else {
        setCuenta(destino);
      }
    };

    frameId = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frameId);
  }, [valor, duracion]);

  if (esMoneda) {
    return <span>{formatearSoles(cuenta)}</span>;
  }

  return <span>{Math.round(cuenta).toLocaleString("es-PE")}</span>;
}

/** Formateador de fecha corta (p. ej. "2026-10-24" -> "24 Oct") */
function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return "";
  const partes = String(fechaStr).split("-");
  if (partes.length === 3) {
    const dia = partes[2];
    const meses = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Set", "Oct", "Nov", "Dic",
    ];
    const mesIndex = parseInt(partes[1], 10) - 1;
    return `${dia} ${meses[mesIndex] || partes[1]}`;
  }
  return fechaStr;
}

/* ────────────────────────────────── TOOLTIPS PERSONALIZADOS RECHARTS ── */

function TooltipVentasDia({ active, payload, label }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="resumen-chart-tooltip">
        <p className="resumen-chart-tooltip__titulo">
          {formatearFechaCorta(label) || label}
        </p>
        <div className="resumen-chart-tooltip__fila">
          <span
            className="resumen-chart-tooltip__punto"
            style={{ background: "var(--terracota)" }}
          />
          <span className="resumen-chart-tooltip__label">Ventas:</span>
          <strong className="resumen-chart-tooltip__valor">
            {formatearSoles(item.total)}
          </strong>
        </div>
        <div className="resumen-chart-tooltip__fila">
          <span
            className="resumen-chart-tooltip__punto"
            style={{ background: "var(--oro)" }}
          />
          <span className="resumen-chart-tooltip__label">Operaciones:</span>
          <span className="resumen-chart-tooltip__valor">
            {item.cantidad ?? 0}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

function TooltipCategoria({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="resumen-chart-tooltip">
        <p className="resumen-chart-tooltip__titulo">{item.name}</p>
        <div className="resumen-chart-tooltip__fila">
          <span
            className="resumen-chart-tooltip__punto"
            style={{ background: item.payload?.fill || "var(--terracota)" }}
          />
          <span className="resumen-chart-tooltip__label">Total recaudado:</span>
          <strong className="resumen-chart-tooltip__valor">
            {formatearSoles(item.value)}
          </strong>
        </div>
      </div>
    );
  }
  return null;
}

function TooltipTopProducto({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="resumen-chart-tooltip">
        <p className="resumen-chart-tooltip__titulo">{item.producto}</p>
        <div className="resumen-chart-tooltip__fila">
          <span
            className="resumen-chart-tooltip__punto"
            style={{ background: "var(--terracota)" }}
          />
          <span className="resumen-chart-tooltip__label">Ingresos:</span>
          <strong className="resumen-chart-tooltip__valor">
            {formatearSoles(item.total)}
          </strong>
        </div>
        <div className="resumen-chart-tooltip__fila">
          <span
            className="resumen-chart-tooltip__punto"
            style={{ background: "var(--verde)" }}
          />
          <span className="resumen-chart-tooltip__label">Unidades vendidas:</span>
          <span className="resumen-chart-tooltip__valor">
            {item.cantidad ?? 0}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

function TooltipMetodoPago({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="resumen-chart-tooltip">
        <p className="resumen-chart-tooltip__titulo">{item.metodo}</p>
        <div className="resumen-chart-tooltip__fila">
          <span
            className="resumen-chart-tooltip__punto"
            style={{ background: "var(--verde)" }}
          />
          <span className="resumen-chart-tooltip__label">Monto cobrado:</span>
          <strong className="resumen-chart-tooltip__valor">
            {formatearSoles(item.total)}
          </strong>
        </div>
        <div className="resumen-chart-tooltip__fila">
          <span
            className="resumen-chart-tooltip__punto"
            style={{ background: "var(--oro)" }}
          />
          <span className="resumen-chart-tooltip__label">Transacciones:</span>
          <span className="resumen-chart-tooltip__valor">
            {item.cantidad ?? 0}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

/* ────────────────────────────────── SKELETON LOADERS ────────────────── */
function SkeletonResumen() {
  return (
    <div
      className="resumen-skeleton"
      aria-busy="true"
      aria-label="Cargando métricas y gráficos del panel"
    >
      <div className="resumen-skeleton__kpis">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="resumen-skeleton__kpi-card">
            <div className="resumen-skeleton__linea resumen-skeleton__linea--corta" />
            <div className="resumen-skeleton__numero" />
            <div className="resumen-skeleton__linea resumen-skeleton__linea--media" />
          </div>
        ))}
      </div>
      <div className="resumen-skeleton__grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="resumen-skeleton__chart-card">
            <div className="resumen-skeleton__linea resumen-skeleton__linea--media" />
            <div className="resumen-skeleton__chart-box" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────── COMPONENTE PRINCIPAL ────────────── */
export function ResumenPage() {
  const { tema } = useTema();
  const esOscuro = tema === "dark";

  // Colores dinámicos para Recharts según tema activo
  const colorGrilla = esOscuro ? "#3A2F26" : "#ECE3D8";
  const colorTextoEje = esOscuro ? "#C3B3A3" : "#7A6A5D";

  // Estados principales de datos reales
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [diasVentas, setDiasVentas] = useState(7); // 7 o 30 días

  const [kpis, setKpis] = useState(null);
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [ventasPorCategoria, setVentasPorCategoria] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [ventasPorMetodo, setVentasPorMetodo] = useState([]);

  // Carga inicial y por cambio de rango de días desde /api/dashboard/*
  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const [
          kpisRes,
          ventasDiaRes,
          ventasCatRes,
          topProdRes,
          ventasMetodoRes,
        ] = await Promise.all([
          dashboardApi.obtenerKpis(),
          dashboardApi.obtenerVentasPorDia(diasVentas),
          dashboardApi.obtenerVentasPorCategoria(),
          dashboardApi.obtenerTopProductos(5),
          dashboardApi.obtenerVentasPorMetodoPago(),
        ]);

        if (cancelado) return;
        setKpis(kpisRes);
        setVentasPorDia(ventasDiaRes || []);
        setVentasPorCategoria(ventasCatRes || []);
        setTopProductos(topProdRes || []);
        setVentasPorMetodo(ventasMetodoRes || []);
        setError(null);
      } catch (err) {
        if (!cancelado) {
          console.error("[Dashboard] Error al consultar /api/dashboard/*:", err);
          setError(
            err?.message ||
            "No se pudieron cargar las métricas en tiempo real. Verifica la conexión con el servidor."
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
          setActualizando(false);
        }
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [diasVentas]);

  // Cambiar rango de días en el gráfico de ventas
  const handleCambiarDias = async (nuevosDias) => {
    if (nuevosDias === diasVentas) return;
    setDiasVentas(nuevosDias);
  };

  const handleRefrescar = async () => {
    setActualizando(true);
    try {
      const [
        kpisRes,
        ventasDiaRes,
        ventasCatRes,
        topProdRes,
        ventasMetodoRes,
      ] = await Promise.all([
        dashboardApi.obtenerKpis(),
        dashboardApi.obtenerVentasPorDia(diasVentas),
        dashboardApi.obtenerVentasPorCategoria(),
        dashboardApi.obtenerTopProductos(5),
        dashboardApi.obtenerVentasPorMetodoPago(),
      ]);

      setKpis(kpisRes);
      setVentasPorDia(ventasDiaRes || []);
      setVentasPorCategoria(ventasCatRes || []);
      setTopProductos(topProdRes || []);
      setVentasPorMetodo(ventasMetodoRes || []);
      setError(null);
    } catch (err) {
      console.error("[Dashboard] Error al actualizar:", err);
      setError(
        err?.message ||
        "No se pudieron actualizar las métricas. Verifica la conexión con el servidor."
      );
    } finally {
      setActualizando(false);
    }
  };

  // Preparar series de datos con etiquetas cortas para visualización
  const datosVentasPorDia = useMemo(() => {
    return ventasPorDia.map((d) => ({
      ...d,
      fechaCorta: formatearFechaCorta(d.fecha),
      totalNumero: Number(d.total || 0),
    }));
  }, [ventasPorDia]);

  const datosTopProductos = useMemo(() => {
    return topProductos.map((p) => ({
      ...p,
      productoCorto:
        p.producto && p.producto.length > 18
          ? `${p.producto.slice(0, 16)}…`
          : p.producto || "Producto",
      totalNumero: Number(p.total || 0),
    }));
  }, [topProductos]);

  const totalCategoriasSuma = useMemo(() => {
    return ventasPorCategoria.reduce(
      (sum, c) => sum + Number(c.total || 0),
      0
    );
  }, [ventasPorCategoria]);

  return (
    <div className="resumen-page">
      {/* ────────────────────────────────────────────────── Cabecera ──── */}
      <header className="resumen-page__cabecera">
        <div className="resumen-page__cabecera-textos">
          <div className="resumen-page__marca-acento">
            <span className="resumen-page__marca-linea" />
            <span className="resumen-page__marca-trigo" aria-hidden="true">🌾</span>
          </div>
          <h1 className="resumen-page__titulo">Panel de Control</h1>
          <p className="resumen-page__subtitulo">
            Métricas clave, comportamiento de ventas e inventario en tiempo real.
          </p>
        </div>

        <div className="resumen-page__cabecera-acciones">
          <Boton
            variante="contorno"
            tamano="sm"
            onClick={handleRefrescar}
            cargando={actualizando}
            icono="↻"
          >
            Actualizar
          </Boton>
        </div>
      </header>

      {/* Alerta de error si falla la comunicación */}
      {error && (
        <Alerta variante="peligro" onClose={() => setError(null)}>
          <div className="resumen-alerta-contenido">
            <span>{error}</span>
            <Boton
              variante="primario"
              tamano="sm"
              onClick={handleRefrescar}
              cargando={actualizando}
            >
              Reintentar
            </Boton>
          </div>
        </Alerta>
      )}

      {cargando ? (
        <SkeletonResumen />
      ) : (
        <>
          {/* ────────────────────────── 1. FILA DE TARJETAS KPIS ──────── */}
          <section
            className="resumen-kpis"
            aria-label="Indicadores clave de rendimiento"
          >
            {/* Ventas de hoy */}
            <article className="resumen-kpi-card resumen-kpi-card--verde">
              <div className="resumen-kpi-card__top">
                <span className="resumen-kpi-card__label">Ventas de hoy</span>
                <div
                  className="resumen-kpi-card__chip resumen-kpi-card__chip--verde"
                  aria-hidden="true"
                >
                  💰
                </div>
              </div>
              <div className="resumen-kpi-card__valor serif resumen-kpi-card__valor--verde">
                <CountUpNumero valor={kpis?.ventasHoy} esMoneda />
              </div>
              <div className="resumen-kpi-card__pie">
                <span className="resumen-kpi-card__pill resumen-kpi-card__pill--verde">
                  <CountUpNumero valor={kpis?.cantidadVentasHoy} />{" "}operaciones hoy
                </span>
              </div>
            </article>

            {/* Ventas del mes */}
            <article className="resumen-kpi-card resumen-kpi-card--terracota">
              <div className="resumen-kpi-card__top">
                <span className="resumen-kpi-card__label">Ventas del mes</span>
                <div
                  className="resumen-kpi-card__chip resumen-kpi-card__chip--terracota"
                  aria-hidden="true"
                >
                  📈
                </div>
              </div>
              <div className="resumen-kpi-card__valor serif resumen-kpi-card__valor--terracota">
                <CountUpNumero valor={kpis?.ventasMes} esMoneda />
              </div>
              <div className="resumen-kpi-card__pie">
                <span className="resumen-kpi-card__pill">
                  <CountUpNumero valor={kpis?.cantidadVentasMes} />{" "}operaciones este mes
                </span>
              </div>
            </article>

            {/* Ticket promedio */}
            <article className="resumen-kpi-card resumen-kpi-card--oro">
              <div className="resumen-kpi-card__top">
                <span className="resumen-kpi-card__label">Ticket promedio</span>
                <div
                  className="resumen-kpi-card__chip resumen-kpi-card__chip--oro"
                  aria-hidden="true"
                >
                  🧾
                </div>
              </div>
              <div className="resumen-kpi-card__valor serif resumen-kpi-card__valor--oro">
                <CountUpNumero valor={kpis?.ticketPromedio} esMoneda />
              </div>
              <div className="resumen-kpi-card__pie">
                <span className="resumen-kpi-card__pill">
                  Gasto medio por cliente
                </span>
              </div>
            </article>

            {/* Pedidos activos */}
            <article className="resumen-kpi-card resumen-kpi-card--pedidos">
              <div className="resumen-kpi-card__top">
                <span className="resumen-kpi-card__label">Pedidos pendientes</span>
                <div
                  className="resumen-kpi-card__chip resumen-kpi-card__chip--oro"
                  aria-hidden="true"
                >
                  📦
                </div>
              </div>
              <div className="resumen-kpi-card__valor serif resumen-kpi-card__valor--oro">
                <CountUpNumero valor={kpis?.pedidosPendientes} />
              </div>
              <div className="resumen-kpi-card__pie">
                <span className="resumen-kpi-card__pill">
                  {kpis?.pedidosEnCamino || 0} en camino · {kpis?.pedidosEntregados || 0} entregados
                </span>
              </div>
            </article>

            {/* Stock crítico */}
            <article
              className={`resumen-kpi-card ${(kpis?.productosStockBajo || 0) > 0
                  ? "resumen-kpi-card--rojo"
                  : "resumen-kpi-card--verde"
                }`}
            >
              <div className="resumen-kpi-card__top">
                <span className="resumen-kpi-card__label">Stock crítico</span>
                <div
                  className={`resumen-kpi-card__chip ${(kpis?.productosStockBajo || 0) > 0
                      ? "resumen-kpi-card__chip--rojo"
                      : "resumen-kpi-card__chip--verde"
                    }`}
                  aria-hidden="true"
                >
                  {(kpis?.productosStockBajo || 0) > 0 ? "⚠️" : "✅"}
                </div>
              </div>
              <div
                className={`resumen-kpi-card__valor serif ${(kpis?.productosStockBajo || 0) > 0
                    ? "resumen-kpi-card__valor--rojo"
                    : "resumen-kpi-card__valor--verde"
                  }`}
              >
                <CountUpNumero valor={kpis?.productosStockBajo} />
              </div>
              <div className="resumen-kpi-card__pie">
                <span
                  className={`resumen-kpi-card__pill ${(kpis?.productosStockBajo || 0) > 0
                      ? "resumen-kpi-card__pill--rojo"
                      : "resumen-kpi-card__pill--verde"
                    }`}
                >
                  {(kpis?.productosStockBajo || 0) > 0
                    ? "Productos bajo stock mínimo"
                    : "Inventario en nivel óptimo"}
                </span>
              </div>
            </article>
          </section>

          {/* ────────────────────────── 2. GRID DE GRÁFICOS RECHARTS ──── */}
          <section
            className="resumen-graficos-grid"
            aria-label="Gráficos analíticos de ventas"
          >
            {/* Gráfico 1: Ventas por día (Área con degradado + Toggle 7/30) */}
            <div className="resumen-chart-card resumen-chart-card--destacado">
              <div className="resumen-chart-card__cabecera">
                <div>
                  <h2 className="resumen-chart-card__titulo">Ventas por día</h2>
                  <p className="resumen-chart-card__subtitulo">
                    Evolución diaria de facturación en tienda y pedidos web
                  </p>
                </div>

                <div
                  className="resumen-chart-toggle"
                  role="group"
                  aria-label="Período de ventas"
                >
                  <button
                    type="button"
                    className={`resumen-chart-toggle__btn ${diasVentas === 7 ? "resumen-chart-toggle__btn--activo" : ""
                      }`}
                    onClick={() => handleCambiarDias(7)}
                  >
                    7 días
                  </button>
                  <button
                    type="button"
                    className={`resumen-chart-toggle__btn ${diasVentas === 30 ? "resumen-chart-toggle__btn--activo" : ""
                      }`}
                    onClick={() => handleCambiarDias(30)}
                  >
                    30 días
                  </button>
                </div>
              </div>

              <div className="resumen-chart-card__cuerpo">
                {datosVentasPorDia.length === 0 ? (
                  <EstadoVacio
                    icono="📊"
                    titulo="Sin datos en este rango"
                    descripcion="No se registran ventas cobradas en el período seleccionado."
                  />
                ) : (
                  <div className="resumen-chart-card__contenedor">
                    <ResponsiveContainer width="100%" height={290}>
                      <AreaChart
                        data={datosVentasPorDia}
                        margin={{ top: 12, right: 16, left: 4, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorVentasDia"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#C0532B"
                              stopOpacity={0.38}
                            />
                            <stop
                              offset="95%"
                              stopColor="#C0532B"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={colorGrilla}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="fechaCorta"
                          stroke={colorTextoEje}
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: colorGrilla }}
                        />
                        <YAxis
                          stroke={colorTextoEje}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `S/ ${val}`}
                        />
                        <Tooltip content={<TooltipVentasDia />} />
                        <Area
                          type="monotone"
                          dataKey="total"
                          name="Ventas"
                          stroke="#C0532B"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorVentasDia)"
                          dot={{
                            r: 3,
                            fill: "#C0532B",
                            strokeWidth: 1,
                            stroke: "#C0532B",
                          }}
                          activeDot={{
                            r: 6,
                            fill: "#C0532B",
                            stroke: esOscuro ? "#2A231D" : "#FFFFFF",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico 2: Ventas por categoría (Donut Chart) */}
            <div className="resumen-chart-card">
              <div className="resumen-chart-card__cabecera">
                <div>
                  <h2 className="resumen-chart-card__titulo">Ventas por categoría</h2>
                  <p className="resumen-chart-card__subtitulo">
                    Distribución de ingresos según rubro de producto
                  </p>
                </div>
                {totalCategoriasSuma > 0 && (
                  <span className="resumen-chart-card__badge-total">
                    {formatearSoles(totalCategoriasSuma)}
                  </span>
                )}
              </div>

              <div className="resumen-chart-card__cuerpo">
                {ventasPorCategoria.length === 0 ? (
                  <EstadoVacio
                    icono="🏷️"
                    titulo="Sin categorías con venta"
                    descripcion="Las ventas por categoría aparecerán al facturar productos."
                  />
                ) : (
                  <div className="resumen-chart-card__contenedor">
                    <ResponsiveContainer width="100%" height={290}>
                      <PieChart margin={{ top: 0, right: 0, bottom: 8, left: 0 }}>
                        <Pie
                          data={ventasPorCategoria}
                          dataKey="total"
                          nameKey="categoria"
                          cx="50%"
                          cy="46%"
                          innerRadius={55}
                          outerRadius={86}
                          paddingAngle={3}
                        >
                          {ventasPorCategoria.map((entry, index) => (
                            <Cell
                              key={`cat-${index}`}
                              fill={
                                PALETA_CATEGORIAS[
                                index % PALETA_CATEGORIAS.length
                                ]
                              }
                              stroke={esOscuro ? "#2A231D" : "#FFFFFF"}
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<TooltipCategoria />} />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span
                              style={{
                                color: colorTextoEje,
                                fontSize: "0.75rem",
                                fontWeight: 500,
                              }}
                            >
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico 3: Top 5 productos más vendidos (Barras Horizontales) */}
            <div className="resumen-chart-card">
              <div className="resumen-chart-card__cabecera">
                <div>
                  <h2 className="resumen-chart-card__titulo">Top 5 productos</h2>
                  <p className="resumen-chart-card__subtitulo">
                    Artículos más vendidos por volumen de facturación
                  </p>
                </div>
              </div>

              <div className="resumen-chart-card__cuerpo">
                {datosTopProductos.length === 0 ? (
                  <EstadoVacio
                    icono="📦"
                    titulo="Sin productos en ranking"
                    descripcion="Aún no se registran artículos con salidas en caja."
                  />
                ) : (
                  <div className="resumen-chart-card__contenedor">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        layout="vertical"
                        data={datosTopProductos}
                        margin={{ top: 8, right: 16, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={colorGrilla}
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          stroke={colorTextoEje}
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: colorGrilla }}
                          tickFormatter={(val) => `S/ ${val}`}
                        />
                        <YAxis
                          type="category"
                          dataKey="productoCorto"
                          stroke={colorTextoEje}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          width={110}
                        />
                        <Tooltip content={<TooltipTopProducto />} />
                        <Bar
                          dataKey="total"
                          name="Recaudación"
                          fill="#C0532B"
                          radius={[0, 6, 6, 0]}
                          maxBarSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico 4: Ventas por método de pago */}
            <div className="resumen-chart-card">
              <div className="resumen-chart-card__cabecera">
                <div>
                  <h2 className="resumen-chart-card__titulo">Métodos de pago</h2>
                  <p className="resumen-chart-card__subtitulo">
                    Participación de cobro en mostrador y pasarela online
                  </p>
                </div>
              </div>

              <div className="resumen-chart-card__cuerpo">
                {ventasPorMetodo.length === 0 ? (
                  <EstadoVacio
                    icono="💳"
                    titulo="Sin cobros registrados"
                    descripcion="El desglose de formas de pago aparecerá aquí."
                  />
                ) : (
                  <div className="resumen-chart-card__contenedor">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={ventasPorMetodo}
                        margin={{ top: 12, right: 16, left: 4, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={colorGrilla}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="metodo"
                          stroke={colorTextoEje}
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: colorGrilla }}
                        />
                        <YAxis
                          stroke={colorTextoEje}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `S/ ${val}`}
                        />
                        <Tooltip content={<TooltipMetodoPago />} />
                        <Bar
                          dataKey="total"
                          name="Monto cobrado"
                          fill="#2E9E5B"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={38}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ────────────────────────── 3. RESUMEN DE SALUD OPERATIVA ──── */}
          {kpis?.pedidosPorEstado && (
            <section
              className="resumen-operaciones"
              aria-label="Desglose operativo de pedidos"
            >
              <div className="resumen-operaciones__cabecera">
                <span className="resumen-operaciones__icono" aria-hidden="true">
                  🚚
                </span>
                <div>
                  <h3 className="resumen-operaciones__titulo">
                    Estado operativo de despachos
                  </h3>
                  <p className="resumen-operaciones__subtitulo">
                    Control de pedidos para entrega a domicilio y recojo en tienda
                  </p>
                </div>
              </div>

              <div className="resumen-operaciones__grid">
                <div className="resumen-operacion-pill resumen-operacion-pill--pendiente">
                  <span className="resumen-operacion-pill__etiqueta">Pendientes</span>
                  <strong className="resumen-operacion-pill__valor">
                    {kpis.pedidosPorEstado.pendientes || 0}
                  </strong>
                </div>
                <div className="resumen-operacion-pill resumen-operacion-pill--confirmado">
                  <span className="resumen-operacion-pill__etiqueta">Confirmados</span>
                  <strong className="resumen-operacion-pill__valor">
                    {kpis.pedidosPorEstado.confirmados || 0}
                  </strong>
                </div>
                <div className="resumen-operacion-pill resumen-operacion-pill--preparacion">
                  <span className="resumen-operacion-pill__etiqueta">En preparación</span>
                  <strong className="resumen-operacion-pill__valor">
                    {kpis.pedidosPorEstado.enPreparacion || 0}
                  </strong>
                </div>
                <div className="resumen-operacion-pill resumen-operacion-pill--camino">
                  <span className="resumen-operacion-pill__etiqueta">En camino</span>
                  <strong className="resumen-operacion-pill__valor">
                    {kpis.pedidosPorEstado.enCamino || 0}
                  </strong>
                </div>
                <div className="resumen-operacion-pill resumen-operacion-pill--entregado">
                  <span className="resumen-operacion-pill__etiqueta">Entregados</span>
                  <strong className="resumen-operacion-pill__valor">
                    {kpis.pedidosPorEstado.entregados || 0}
                  </strong>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default ResumenPage;
