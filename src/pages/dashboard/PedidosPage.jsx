/**
 * ============================================================================
 * GESTIÓN DE PEDIDOS WEB · Panel de Administración y Despacho
 * ============================================================================
 * Ruta: /dashboard/pedidos · Acceso: ADMIN y CAJERO
 *
 * 🎯 PATRÓN STATE:
 * Consume directamente la máquina de estados de `src/pages/tienda/checkout/estados`
 * (obtenerEstadoPedido, transicionarEstadoPedido).
 * Valida que solo se puedan realizar transiciones autorizadas según el tipo
 * de entrega y repone el inventario automáticamente si un pedido se cancela.
 * ==========================================================================*/

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { useInventario } from "../../hooks/useInventario";
import { useTema } from "../../hooks/useTema";
import { pedidosApi } from "../../api/pedidosApi";
import { CLAVES } from "../../repositories/claves";
import {
  ESTADOS_PEDIDO,
  ETIQUETAS_ESTADO_PEDIDO,
  TIPOS_ENTREGA,
  ETIQUETAS_TIPO_ENTREGA,
} from "../../constantes";
import { formatearSoles, formatearFecha } from "../../utils/formato";
import {
  Boton,
  Card,
  CardCabecera,
  CardCuerpo,
  Badge,
  Alerta,
  Modal,
  Cargando,
  EstadoVacio,
  Input,
  Select,
} from "../../components/ui";
import {
  obtenerEstadoPedido,
} from "../tienda/checkout/estados";
import "./PedidosPage.css";

const VARIANTES_ESTADO_PEDIDO = {
  [ESTADOS_PEDIDO.PENDIENTE]: "advertencia",
  [ESTADOS_PEDIDO.CONFIRMADO]: "info",
  [ESTADOS_PEDIDO.EN_CAMINO]: "marca",
  [ESTADOS_PEDIDO.ENTREGADO]: "exito",
  [ESTADOS_PEDIDO.CANCELADO]: "peligro",
};

function esFechaDeHoy(fechaStr) {
  if (!fechaStr) return false;
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return false;
    const hoy = new Date();
    return (
      d.getDate() === hoy.getDate() &&
      d.getMonth() === hoy.getMonth() &&
      d.getFullYear() === hoy.getFullYear()
    );
  } catch {
    return false;
  }
}

function TooltipEstadoPedido({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="pedidos-donut-tooltip">
      <span
        className="pedidos-donut-tooltip__punto"
        style={{ backgroundColor: data.color }}
      />
      <span className="pedidos-donut-tooltip__nombre">{data.nombre}:</span>
      <span className="pedidos-donut-tooltip__valor">{data.valor} {data.valor === 1 ? "pedido" : "pedidos"}</span>
    </div>
  );
}

export function PedidosPage() {
  const { refrescar } = useInventario();
  const { esOscuro } = useTema();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroEntrega, setFiltroEntrega] = useState("TODOS");

  // Modal de Detalle / Gestión
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);

  const cargarPedidos = async () => {
    try {
      const todos = await pedidosApi.listar();
      if (!Array.isArray(todos)) return;

      todos.sort((a, b) => {
        const fa = new Date(b.fechaCreacion || b.fecha || 0).getTime();
        const fb = new Date(a.fechaCreacion || a.fecha || 0).getTime();
        return fa - fb;
      });
      setPedidos(todos);

      setPedidoSeleccionado((prev) => {
        if (!prev) return null;
        const actualizado = todos.find((p) => p.id === prev.id);
        return actualizado || prev;
      });
    } catch {
      setError("Error al cargar la lista de pedidos.");
    } finally {
      setCargando(false);
    }
  };

  // Carga inicial y escucha reactiva de nuevos pedidos y cambios de estado
  useEffect(() => {
    let cancelado = false;

    async function sincronizar() {
      try {
        const todos = await pedidosApi.listar();
        if (cancelado || !Array.isArray(todos)) return;

        todos.sort((a, b) => {
          const fa = new Date(b.fechaCreacion || b.fecha || 0).getTime();
          const fb = new Date(a.fechaCreacion || a.fecha || 0).getTime();
          return fa - fb;
        });
        setPedidos(todos);

        setPedidoSeleccionado((prev) => {
          if (!prev) return null;
          const actualizado = todos.find((p) => p.id === prev.id);
          return actualizado || prev;
        });
      } catch {
        if (!cancelado) setError("Error al cargar la lista de pedidos.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    sincronizar();

    const handleActualizacion = () => {
      sincronizar();
    };

    const handleStorage = (e) => {
      if (e.key === CLAVES.PEDIDOS || !e.key) {
        sincronizar();
      }
    };

    window.addEventListener("trigal:pedido-nuevo", handleActualizacion);
    window.addEventListener("trigal:pedido-actualizado", handleActualizacion);
    window.addEventListener("storage", handleStorage);

    // Polling de respaldo cada 3.5 segundos
    const intervalo = setInterval(() => {
      sincronizar();
    }, 3500);

    return () => {
      cancelado = true;
      window.removeEventListener("trigal:pedido-nuevo", handleActualizacion);
      window.removeEventListener("trigal:pedido-actualizado", handleActualizacion);
      window.removeEventListener("storage", handleStorage);
      clearInterval(intervalo);
    };
  }, []);

  const refrescarPedidos = async () => {
    setCargando(true);
    await cargarPedidos();
  };

  // Métricas rápidas
  const conteos = useMemo(() => {
    const res = {
      total: pedidos.length,
      [ESTADOS_PEDIDO.PENDIENTE]: 0,
      [ESTADOS_PEDIDO.CONFIRMADO]: 0,
      [ESTADOS_PEDIDO.EN_CAMINO]: 0,
      [ESTADOS_PEDIDO.ENTREGADO]: 0,
      [ESTADOS_PEDIDO.CANCELADO]: 0,
    };
    pedidos.forEach((p) => {
      if (res[p.estado] !== undefined) {
        res[p.estado] += 1;
      }
    });
    return res;
  }, [pedidos]);

  // Lista filtrada
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      // Filtro por estado
      if (filtroEstado !== "TODOS" && pedido.estado !== filtroEstado) {
        return false;
      }

      // Filtro por entrega
      if (filtroEntrega !== "TODOS" && pedido.tipoEntrega !== filtroEntrega) {
        return false;
      }

      // Búsqueda por texto (ID, nombre cliente, teléfono o correo)
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideId = pedido.id?.toLowerCase().includes(query);
        const coincideNombre = pedido.clienteNombre?.toLowerCase().includes(query);
        const coincideTelefono = pedido.clienteTelefono?.toLowerCase().includes(query);
        const coincideCorreo = pedido.clienteCorreo?.toLowerCase().includes(query);
        return coincideId || coincideNombre || coincideTelefono || coincideCorreo;
      }

      return true;
    });
  }, [pedidos, filtroEstado, filtroEntrega, busqueda]);

  // Manejador de transición
  const aplicarTransicion = async (pedido, nuevoEstado) => {
    const pedidoTarget = pedido || pedidoSeleccionado;
    if (!pedidoTarget) return;

    setActualizando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const pedidoActualizado = await pedidosApi.cambiarEstado(pedidoTarget.id, nuevoEstado);
      await cargarPedidos();
      await refrescar(); // para que el catálogo refleje el stock cuando se cancela

      if (pedidoActualizado) {
        setPedidoSeleccionado(pedidoActualizado);
      }
      setModalCancelarAbierto(false);

      const etiquetaNuevo = ETIQUETAS_ESTADO_PEDIDO[nuevoEstado] || nuevoEstado;
      const codigoVisible = pedidoTarget.codigo || `#${String(pedidoTarget.id).slice(-6)}`;
      setMensajeExito(`Pedido ${codigoVisible} actualizado a "${etiquetaNuevo}".`);
    } catch (err) {
      console.error("Error al actualizar estado del pedido:", err);
      setError(err.message || "Error al realizar la transición de estado.");
    } finally {
      setActualizando(false);
    }
  };

  const ejecutarTransicion = (nuevoEstado) => aplicarTransicion(pedidoSeleccionado, nuevoEstado);

  const abrirDetalle = (pedido) => {
    setPedidoSeleccionado(pedido);
    setError(null);
  };

  const cerrarDetalle = () => {
    setPedidoSeleccionado(null);
    setModalCancelarAbierto(false);
  };

  // Estado y transiciones del pedido seleccionado en el modal
  const estadoObjSeleccionado = useMemo(() => {
    if (!pedidoSeleccionado) return null;
    return obtenerEstadoPedido(pedidoSeleccionado.estado);
  }, [pedidoSeleccionado]);

  const siguientesPermitidos = useMemo(() => {
    if (!pedidoSeleccionado || !estadoObjSeleccionado) return [];
    return estadoObjSeleccionado.obtenerSiguientes(pedidoSeleccionado);
  }, [pedidoSeleccionado, estadoObjSeleccionado]);

  const puedeCancelarSeleccionado = siguientesPermitidos.includes(ESTADOS_PEDIDO.CANCELADO);

  // Pedidos que requieren atención prioritaria (excluye ENTREGADO y CANCELADO)
  const pedidosRequierenAccion = useMemo(() => {
    const estadosUrgentes = [
      ESTADOS_PEDIDO.PENDIENTE,
      ESTADOS_PEDIDO.CONFIRMADO,
      "EN_PREPARACION",
      ESTADOS_PEDIDO.EN_CAMINO,
    ];
    return (pedidos || []).filter((p) => estadosUrgentes.includes(p.estado));
  }, [pedidos]);

  // 1) Distribución de pedidos por estado para el mini-donut
  const distribucionEstados = useMemo(() => {
    const counts = {
      [ESTADOS_PEDIDO.PENDIENTE]: 0,
      [ESTADOS_PEDIDO.CONFIRMADO]: 0,
      EN_PREPARACION: 0,
      [ESTADOS_PEDIDO.EN_CAMINO]: 0,
      [ESTADOS_PEDIDO.ENTREGADO]: 0,
      [ESTADOS_PEDIDO.CANCELADO]: 0,
    };

    (pedidos || []).forEach((p) => {
      const e = p.estado === "EN_PREPARACION" ? "EN_PREPARACION" : p.estado;
      if (counts[e] !== undefined) {
        counts[e] += 1;
      }
    });

    return [
      { key: ESTADOS_PEDIDO.PENDIENTE, nombre: "Pendientes", valor: counts[ESTADOS_PEDIDO.PENDIENTE], color: "#D9A441" },
      { key: ESTADOS_PEDIDO.CONFIRMADO, nombre: "Confirmados", valor: counts[ESTADOS_PEDIDO.CONFIRMADO], color: "#0284C7" },
      { key: "EN_PREPARACION", nombre: "En prep.", valor: counts.EN_PREPARACION, color: "#C0532B" },
      { key: ESTADOS_PEDIDO.EN_CAMINO, nombre: "En camino", valor: counts[ESTADOS_PEDIDO.EN_CAMINO], color: "#8B5CF6" },
      { key: ESTADOS_PEDIDO.ENTREGADO, nombre: "Entregados", valor: counts[ESTADOS_PEDIDO.ENTREGADO], color: "#2E9E5B" },
      { key: ESTADOS_PEDIDO.CANCELADO, nombre: "Cancelados", valor: counts[ESTADOS_PEDIDO.CANCELADO], color: "#D6482F" },
    ];
  }, [pedidos]);

  const datosDonut = useMemo(() => {
    return distribucionEstados.filter((item) => item.valor > 0);
  }, [distribucionEstados]);

  // 2) Entregas de HOY (estados activos no entregados ni cancelados)
  const entregasDeHoy = useMemo(() => {
    const estadosActivos = [
      ESTADOS_PEDIDO.PENDIENTE,
      ESTADOS_PEDIDO.CONFIRMADO,
      "EN_PREPARACION",
      ESTADOS_PEDIDO.EN_CAMINO,
    ];
    return (pedidos || [])
      .filter((p) => esFechaDeHoy(p.fechaCreacion || p.fecha) && estadosActivos.includes(p.estado))
      .sort((a, b) => new Date(b.fechaCreacion || b.fecha || 0) - new Date(a.fechaCreacion || a.fecha || 0));
  }, [pedidos]);

  // 3) Resumen del día (método de pago + tipo de entrega más usados hoy)
  const analiticaHoy = useMemo(() => {
    const deHoy = (pedidos || []).filter((p) => esFechaDeHoy(p.fechaCreacion || p.fecha));
    const noCancelados = deHoy.filter((p) => p.estado !== ESTADOS_PEDIDO.CANCELADO);

    const conteoMetodos = {};
    const conteoEntrega = {};

    deHoy.forEach((p) => {
      const m = (p.metodoPago || "Sin método").toUpperCase();
      conteoMetodos[m] = (conteoMetodos[m] || 0) + 1;

      const t = p.tipoEntrega || TIPOS_ENTREGA.RECOJO_TIENDA;
      conteoEntrega[t] = (conteoEntrega[t] || 0) + 1;
    });

    let topMetodo = null;
    let maxMetodo = 0;
    for (const [m, count] of Object.entries(conteoMetodos)) {
      if (count > maxMetodo) {
        maxMetodo = count;
        topMetodo = m;
      }
    }

    let topEntrega = null;
    let maxEntrega = 0;
    for (const [t, count] of Object.entries(conteoEntrega)) {
      if (count > maxEntrega) {
        maxEntrega = count;
        topEntrega = t;
      }
    }

    const totalRecaudado = noCancelados.reduce((sum, p) => sum + (Number(p.total) || 0), 0);

    return {
      totalHoy: deHoy.length,
      totalRecaudado,
      topMetodo,
      vecesMetodo: maxMetodo,
      topEntrega,
      vecesEntrega: maxEntrega,
    };
  }, [pedidos]);

  return (
    <div className="pedidos-page">
      {/* Cabecera */}
      <div className="pedidos-page__header">
        <div>
          <h1 className="pedidos-page__titulo">Gestión de pedidos web</h1>
          <p className="pedidos-page__subtitulo">
            Supervisa el despacho de compras online y gestiona sus estados con el patrón State.
          </p>
        </div>
        <Boton variante="contorno" onClick={refrescarPedidos} cargando={cargando}>
          ↻ Actualizar lista
        </Boton>
      </div>

      {/* Alertas */}
      {error && (
        <Alerta variante="peligro" onClose={() => setError(null)}>
          {error}
        </Alerta>
      )}
      {mensajeExito && (
        <Alerta variante="exito" onClose={() => setMensajeExito(null)}>
          {mensajeExito}
        </Alerta>
      )}

      {/* Métricas / Filtros rápidos por estado */}
      <div className="pedidos-page__metricas">
        <Card
          className={`pedidos-page__metrica-card pedidos-page__metrica-card--todos ${filtroEstado === "TODOS" ? "pedidos-page__metrica-card--activa" : ""
            }`}
          onClick={() => setFiltroEstado("TODOS")}
        >
          <div className="pedidos-page__metrica-top">
            <span className="pedidos-page__metrica-etiqueta">Todos</span>
            <span className="pedidos-page__metrica-pill">Total</span>
          </div>
          <div className="pedidos-page__metrica-valor">{conteos.total}</div>
        </Card>

        <Card
          className={`pedidos-page__metrica-card pedidos-page__metrica-card--alerta ${filtroEstado === ESTADOS_PEDIDO.PENDIENTE ? "pedidos-page__metrica-card--activa" : ""
            }`}
          onClick={() => setFiltroEstado(ESTADOS_PEDIDO.PENDIENTE)}
        >
          <div className="pedidos-page__metrica-top">
            <span className="pedidos-page__metrica-etiqueta">Pendientes</span>
            {conteos[ESTADOS_PEDIDO.PENDIENTE] > 0 && (
              <span className="pedidos-page__metrica-pill pedidos-page__metrica-pill--alerta">Atención</span>
            )}
          </div>
          <div className="pedidos-page__metrica-valor pedidos-page__metrica-valor--alerta">
            {conteos[ESTADOS_PEDIDO.PENDIENTE]}
          </div>
        </Card>

        <Card
          className={`pedidos-page__metrica-card pedidos-page__metrica-card--info ${filtroEstado === ESTADOS_PEDIDO.CONFIRMADO ? "pedidos-page__metrica-card--activa" : ""
            }`}
          onClick={() => setFiltroEstado(ESTADOS_PEDIDO.CONFIRMADO)}
        >
          <div className="pedidos-page__metrica-top">
            <span className="pedidos-page__metrica-etiqueta">Confirmados</span>
          </div>
          <div className="pedidos-page__metrica-valor">{conteos[ESTADOS_PEDIDO.CONFIRMADO]}</div>
        </Card>

        <Card
          className={`pedidos-page__metrica-card pedidos-page__metrica-card--marca ${filtroEstado === ESTADOS_PEDIDO.EN_CAMINO ? "pedidos-page__metrica-card--activa" : ""
            }`}
          onClick={() => setFiltroEstado(ESTADOS_PEDIDO.EN_CAMINO)}
        >
          <div className="pedidos-page__metrica-top">
            <span className="pedidos-page__metrica-etiqueta">En camino</span>
          </div>
          <div className="pedidos-page__metrica-valor">{conteos[ESTADOS_PEDIDO.EN_CAMINO]}</div>
        </Card>

        <Card
          className={`pedidos-page__metrica-card pedidos-page__metrica-card--exito ${filtroEstado === ESTADOS_PEDIDO.ENTREGADO ? "pedidos-page__metrica-card--activa" : ""
            }`}
          onClick={() => setFiltroEstado(ESTADOS_PEDIDO.ENTREGADO)}
        >
          <div className="pedidos-page__metrica-top">
            <span className="pedidos-page__metrica-etiqueta">Entregados</span>
          </div>
          <div className="pedidos-page__metrica-valor pedidos-page__metrica-valor--exito">
            {conteos[ESTADOS_PEDIDO.ENTREGADO]}
          </div>
        </Card>
      </div>

      {/* Franja "Requieren acción" (pedidos urgentes activos) */}
      <section
        className="pedidos-requieren-accion"
        aria-label="Pedidos web que requieren atención prioritaria"
      >
        <div className="pedidos-requieren-accion__cabecera">
          <div className="pedidos-requieren-accion__titulo-grupo">
            <span className="pedidos-requieren-accion__icono" aria-hidden="true">
              ⚡
            </span>
            <h2 className="pedidos-requieren-accion__titulo">
              Requieren acción
            </h2>
            {pedidosRequierenAccion.length > 0 && (
              <span className="pedidos-requieren-accion__contador">
                {pedidosRequierenAccion.length}
              </span>
            )}
          </div>
          <span className="pedidos-requieren-accion__subtitulo">
            Pedidos que necesitan despacho o entrega prioritaria
          </span>
        </div>

        {pedidosRequierenAccion.length === 0 ? (
          <div className="pedidos-requieren-accion__vacio">
            <span className="pedidos-requieren-accion__vacio-icono" aria-hidden="true">✓</span>
            <span className="pedidos-requieren-accion__vacio-texto">
              No hay pedidos pendientes de atención ✓
            </span>
          </div>
        ) : (
          <div className="pedidos-requieren-accion__grid">
            {pedidosRequierenAccion.map((p) => {
              const codigo = p.codigo || `#${String(p.id).slice(-6)}`;
              const cliente = p.clienteNombre || p.clienteEmail || "Cliente web";
              return (
                <article key={p.id} className="pedidos-accion-card">
                  <div className="pedidos-accion-card__cabecera">
                    <span className="pedidos-accion-card__codigo">{codigo}</span>
                    <Badge
                      variante={VARIANTES_ESTADO_PEDIDO[p.estado] || "neutro"}
                      tamano="sm"
                      punto
                    >
                      {ETIQUETAS_ESTADO_PEDIDO[p.estado] || p.estado}
                    </Badge>
                  </div>

                  <div className="pedidos-accion-card__cliente" title={cliente}>
                    <span className="pedidos-accion-card__cliente-icono" aria-hidden="true">👤</span>
                    <span className="pedidos-accion-card__cliente-nombre">{cliente}</span>
                  </div>

                  <div className="pedidos-accion-card__pie">
                    <span className="pedidos-accion-card__monto">
                      {formatearSoles(p.total)}
                    </span>
                    <Boton
                      variante="primario"
                      tamano="sm"
                      onClick={() => abrirDetalle(p)}
                      className="pedidos-accion-card__btn"
                    >
                      Gestionar →
                    </Boton>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Tira de Analítica Compacta: Estados, Entregas de Hoy y Resumen */}
      <section
        className="pedidos-analitica-strip"
        aria-label="Analítica del día y distribución de pedidos"
      >
        {/* 1. Pedidos por estado (Mini-donut Recharts) */}
        <article className="pedidos-analitica-card">
          <div className="pedidos-analitica-card__cabecera">
            <div className="pedidos-analitica-card__titulo-grupo">
              <span className="pedidos-analitica-card__icono" aria-hidden="true">
                📊
              </span>
              <h2 className="pedidos-analitica-card__titulo">Pedidos por estado</h2>
            </div>
            <span className="pedidos-analitica-card__badge-total">
              {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>

          <div className="pedidos-analitica-card__cuerpo pedidos-analitica-card__cuerpo--donut">
            {datosDonut.length === 0 ? (
              <div className="pedidos-analitica-card__vacio">
                <span className="pedidos-analitica-card__vacio-icono">📦</span>
                <p className="pedidos-analitica-card__vacio-texto">
                  Sin pedidos registrados
                </p>
              </div>
            ) : (
              <div className="pedidos-donut-layout">
                <div className="pedidos-donut-grafico">
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={datosDonut}
                        dataKey="valor"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={52}
                        paddingAngle={3}
                      >
                        {datosDonut.map((item) => (
                          <Cell
                            key={item.key}
                            fill={item.color}
                            stroke={esOscuro ? "#2A231D" : "#FFFFFF"}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<TooltipEstadoPedido />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <ul className="pedidos-donut-leyenda" aria-label="Leyenda de estados">
                  {distribucionEstados.map((item) => (
                    <li
                      key={item.key}
                      className={`pedidos-donut-leyenda__item ${
                        item.valor === 0 ? "pedidos-donut-leyenda__item--cero" : ""
                      }`}
                    >
                      <span
                        className="pedidos-donut-leyenda__punto"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="pedidos-donut-leyenda__etiqueta">{item.nombre}</span>
                      <span className="pedidos-donut-leyenda__conteo">{item.valor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>

        {/* 2. Entregas de hoy */}
        <article className="pedidos-analitica-card">
          <div className="pedidos-analitica-card__cabecera">
            <div className="pedidos-analitica-card__titulo-grupo">
              <span className="pedidos-analitica-card__icono" aria-hidden="true">
                🚚
              </span>
              <h2 className="pedidos-analitica-card__titulo">Entregas de hoy</h2>
            </div>
            {entregasDeHoy.length > 0 && (
              <span className="pedidos-analitica-card__contador">
                {entregasDeHoy.length}
              </span>
            )}
          </div>

          <div className="pedidos-analitica-card__cuerpo">
            {entregasDeHoy.length === 0 ? (
              <div className="pedidos-analitica-card__vacio">
                <span className="pedidos-analitica-card__vacio-icono">✓</span>
                <p className="pedidos-analitica-card__vacio-texto">
                  No hay entregas pendientes para hoy
                </p>
              </div>
            ) : (
              <ul className="pedidos-entregas-lista" aria-label="Entregas activas para hoy">
                {entregasDeHoy.slice(0, 4).map((p) => {
                  const codigo = p.codigo || `#${String(p.id).slice(-6)}`;
                  const cliente = p.clienteNombre || p.clienteEmail || "Cliente web";
                  const esDelivery = p.tipoEntrega === TIPOS_ENTREGA.DELIVERY;

                  return (
                    <li
                      key={p.id}
                      className="pedidos-entregas-item"
                      onClick={() => abrirDetalle(p)}
                      role="button"
                      tabIndex={0}
                      title={`Gestionar ${codigo}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          abrirDetalle(p);
                        }
                      }}
                    >
                      <div className="pedidos-entregas-item__info">
                        <div className="pedidos-entregas-item__linea-sup">
                          <span className="pedidos-entregas-item__codigo">{codigo}</span>
                          <span
                            className={`pedidos-entregas-item__tipo ${
                              esDelivery
                                ? "pedidos-entregas-item__tipo--delivery"
                                : "pedidos-entregas-item__tipo--recojo"
                            }`}
                          >
                            {esDelivery ? "🛵 Delivery" : "🏪 Recojo"}
                          </span>
                        </div>
                        <span className="pedidos-entregas-item__cliente" title={cliente}>
                          👤 {cliente}
                        </span>
                      </div>
                      <span className="pedidos-entregas-item__total">
                        {formatearSoles(p.total)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </article>

        {/* 3. Resumen del día */}
        <article className="pedidos-analitica-card">
          <div className="pedidos-analitica-card__cabecera">
            <div className="pedidos-analitica-card__titulo-grupo">
              <span className="pedidos-analitica-card__icono" aria-hidden="true">
                ✨
              </span>
              <h2 className="pedidos-analitica-card__titulo">Resumen del día</h2>
            </div>
            <span className="pedidos-analitica-card__badge-fecha">
              Hoy
            </span>
          </div>

          <div className="pedidos-analitica-card__cuerpo">
            {analiticaHoy.totalHoy === 0 ? (
              <div className="pedidos-analitica-card__vacio">
                <span className="pedidos-analitica-card__vacio-icono">☀️</span>
                <p className="pedidos-analitica-card__vacio-texto">
                  Aún no hay pedidos web registrados hoy
                </p>
              </div>
            ) : (
              <div className="pedidos-resumen-bloque">
                {/* Pago preferido */}
                <div className="pedidos-resumen-fila">
                  <span className="pedidos-resumen-fila__etiqueta">
                    💳 Medio de pago líder
                  </span>
                  <div className="pedidos-resumen-fila__valor">
                    <span
                      className={`pedidos-resumen-pill pedidos-resumen-pill--${(
                        analiticaHoy.topMetodo || "efectivo"
                      ).toLowerCase()}`}
                    >
                      {analiticaHoy.topMetodo === "YAPE"
                        ? "🟣 Yape"
                        : analiticaHoy.topMetodo === "PLIN"
                        ? "🔵 Plin"
                        : analiticaHoy.topMetodo === "TARJETA"
                        ? "💳 Tarjeta"
                        : "💵 Efectivo"}
                      <strong className="pedidos-resumen-pill__conteo">
                        ({analiticaHoy.vecesMetodo})
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Tipo de entrega preferido */}
                <div className="pedidos-resumen-fila">
                  <span className="pedidos-resumen-fila__etiqueta">
                    📦 Entrega preferida
                  </span>
                  <div className="pedidos-resumen-fila__valor">
                    <span className="pedidos-resumen-pill pedidos-resumen-pill--entrega">
                      {analiticaHoy.topEntrega === TIPOS_ENTREGA.DELIVERY
                        ? "🛵 Delivery"
                        : "🏪 Recojo en tienda"}
                      <strong className="pedidos-resumen-pill__conteo">
                        ({analiticaHoy.vecesEntrega})
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Métricas del día */}
                <div className="pedidos-resumen-stats">
                  <div className="pedidos-resumen-stat">
                    <span className="pedidos-resumen-stat__label">Total hoy</span>
                    <span className="pedidos-resumen-stat__val serif">
                      {analiticaHoy.totalHoy} {analiticaHoy.totalHoy === 1 ? "pedido" : "pedidos"}
                    </span>
                  </div>
                  <div className="pedidos-resumen-stat">
                    <span className="pedidos-resumen-stat__label">Facturado hoy</span>
                    <span className="pedidos-resumen-stat__val serif pedidos-resumen-stat__val--monto">
                      {formatearSoles(analiticaHoy.totalRecaudado)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>

      {/* Barra de Filtros */}
      <Card>
        <CardCuerpo>
          <div className="pedidos-page__filtros">
            <Input
              etiqueta="Buscar pedido o cliente"
              placeholder="Buscar por ID, nombre, teléfono o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <Select
              etiqueta="Estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="TODOS">Todos los estados</option>
              {Object.entries(ETIQUETAS_ESTADO_PEDIDO).map(([clave, etiqueta]) => (
                <option key={clave} value={clave}>
                  {etiqueta}
                </option>
              ))}
            </Select>

            <Select
              etiqueta="Tipo de entrega"
              value={filtroEntrega}
              onChange={(e) => setFiltroEntrega(e.target.value)}
            >
              <option value="TODOS">Todas las entregas</option>
              {Object.entries(ETIQUETAS_TIPO_ENTREGA).map(([clave, etiqueta]) => (
                <option key={clave} value={clave}>
                  {etiqueta}
                </option>
              ))}
            </Select>
          </div>
        </CardCuerpo>
      </Card>

      {/* Listado de pedidos */}
      {cargando ? (
        <Cargando texto="Cargando pedidos web..." />
      ) : pedidosFiltrados.length === 0 ? (
        <EstadoVacio
          icono="🛍️"
          titulo="No se encontraron pedidos"
          descripcion="No hay pedidos web que coincidan con los filtros aplicados."
        />
      ) : (
        <div className="pedidos-page__grid">
          {pedidosFiltrados.map((pedido) => {
            const estadoObj = obtenerEstadoPedido(pedido.estado);
            const varianteBadge = VARIANTES_ESTADO_PEDIDO[pedido.estado] || estadoObj.varianteBadge || "neutro";
            const esRecojo = pedido.tipoEntrega === TIPOS_ENTREGA.RECOJO_TIENDA;

            return (
              <Card key={pedido.id} className="pedidos-card">
                <CardCabecera>
                  <div className="pedidos-card__cabecera-top">
                    <div>
                      <div className="pedidos-card__id">{pedido.codigo || `Pedido #${String(pedido.id).slice(-6)}`}</div>
                      <div className="pedidos-card__fecha">
                        {formatearFecha(pedido.fechaCreacion || pedido.fecha, { conHora: true })}
                      </div>
                    </div>
                    <Badge variante={varianteBadge} punto>
                      {ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || estadoObj.etiqueta}
                    </Badge>
                  </div>
                </CardCabecera>

                <CardCuerpo>
                  <div className="pedidos-card__cliente-info">
                    <span className="pedidos-card__cliente-nombre">{pedido.clienteNombre}</span>
                    <div className="pedidos-card__cliente-contacto">
                      <span>📞 {pedido.clienteTelefono || "Sin teléfono"}</span>
                      <span>✉️ {pedido.clienteCorreo || "Sin correo"}</span>
                    </div>
                  </div>

                  <div className="pedidos-card__detalles">
                    <div className="pedidos-card__fila">
                      <span className="pedidos-card__fila-etiqueta">Tipo de entrega:</span>
                      <Badge variante={esRecojo ? "neutro" : "info"} tamano="sm">
                        {ETIQUETAS_TIPO_ENTREGA[pedido.tipoEntrega] || pedido.tipoEntrega}
                      </Badge>
                    </div>

                    <div className="pedidos-card__fila">
                      <span className="pedidos-card__fila-etiqueta">Medio de pago:</span>
                      <strong>{pedido.metodoPago}</strong>
                    </div>

                    <div className="pedidos-card__fila">
                      <span className="pedidos-card__fila-etiqueta">Artículos:</span>
                      <span>
                        {pedido.items?.reduce((sum, it) => sum + (it.cantidad || 1), 0) || 0} unid.
                      </span>
                    </div>

                    <div className="pedidos-card__fila">
                      <span className="pedidos-card__fila-etiqueta">Total a cobrar:</span>
                      <span className="pedidos-card__total">{formatearSoles(pedido.total)}</span>
                    </div>
                  </div>

                  <div className="pedidos-card__acciones">
                    <Boton
                      variante="primario"
                      bloque
                      tamano="sm"
                      onClick={() => abrirDetalle(pedido)}
                    >
                      Gestionar pedido
                    </Boton>
                  </div>
                </CardCuerpo>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle y Gestión del Patrón State */}
      {pedidoSeleccionado && (
        <Modal
          abierto={pedidoSeleccionado !== null}
          alCerrar={cerrarDetalle}
          titulo={`Gestión de Pedido ${pedidoSeleccionado.codigo || `#${pedidoSeleccionado.id}`}`}
        >
          <div className="pedidos-modal">
            {/* Información del Cliente y Entrega */}
            <div className="pedidos-modal__seccion">
              <h4 className="pedidos-modal__seccion-titulo">Datos del Cliente y Entrega</h4>
              <div className="pedidos-modal__grid-info">
                <div>
                  <strong>Cliente:</strong> {pedidoSeleccionado.clienteNombre}
                </div>
                <div>
                  <strong>Teléfono:</strong> {pedidoSeleccionado.clienteTelefono}
                </div>
                <div>
                  <strong>Correo:</strong> {pedidoSeleccionado.clienteCorreo}
                </div>
                <div>
                  <strong>Tipo de entrega:</strong>{" "}
                  {ETIQUETAS_TIPO_ENTREGA[pedidoSeleccionado.tipoEntrega]}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong>Dirección:</strong> {pedidoSeleccionado.direccionEntrega}
                  {pedidoSeleccionado.referenciaEntrega && (
                    <div>
                      <small style={{ color: "var(--color-texto-suave)" }}>
                        Ref: {pedidoSeleccionado.referenciaEntrega}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Productos Comprados */}
            <div className="pedidos-modal__seccion">
              <h4 className="pedidos-modal__seccion-titulo">Productos del Pedido</h4>
              <table className="pedidos-modal__items-tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>P. Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidoSeleccionado.items?.map((item, idx) => (
                    <tr key={item.productoId || idx}>
                      <td>{item.nombre}</td>
                      <td>{item.cantidad}</td>
                      <td>{formatearSoles(item.precioUnitario)}</td>
                      <td>{formatearSoles(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pedidos-modal__items-totales">
                <div>
                  <span>Subtotal productos: </span>
                  <strong>{formatearSoles(pedidoSeleccionado.subtotal)}</strong>
                </div>
                <div>
                  <span>Costo de envío: </span>
                  <strong>{formatearSoles(pedidoSeleccionado.costoEnvio || 0)}</strong>
                </div>
                <div className="pedidos-modal__total-final">
                  <span>Total: </span>
                  <span>{formatearSoles(pedidoSeleccionado.total)}</span>
                </div>
              </div>
            </div>

            {/* Control del Patrón State */}
            <div className="pedidos-modal__seccion">
              <h4 className="pedidos-modal__seccion-titulo">
                Ciclo de Vida y Transiciones (Patrón State)
              </h4>

              <div className="pedidos-modal__state-caja">
                <div className="pedidos-modal__state-actual">
                  <div>
                    <span style={{ fontSize: "var(--tamano-sm)", color: "var(--color-texto-suave)" }}>
                      Estado actual:
                    </span>
                    <h3 style={{ margin: "2px 0 0 0", display: "flex", alignItems: "center", gap: "var(--esp-2)" }}>
                      <span>{estadoObjSeleccionado?.icono}</span>
                      <span>{estadoObjSeleccionado?.etiqueta}</span>
                    </h3>
                  </div>

                  <Badge
                    variante={
                      VARIANTES_ESTADO_PEDIDO[pedidoSeleccionado.estado] ||
                      estadoObjSeleccionado?.varianteBadge ||
                      "neutro"
                    }
                    tamano="md"
                    punto
                  >
                    {estadoObjSeleccionado?.etiqueta}
                  </Badge>
                </div>

                <p className="pedidos-modal__state-desc">
                  {estadoObjSeleccionado?.descripcion}
                </p>

                {/* Botones de acción del Patrón State */}
                <div className="pedidos-modal__state-botones">
                  {siguientesPermitidos
                    .filter((sig) => sig !== ESTADOS_PEDIDO.CANCELADO)
                    .map((sigEstado) => {
                      const objSig = obtenerEstadoPedido(sigEstado);
                      return (
                        <Boton
                          key={sigEstado}
                          variante="primario"
                          cargando={actualizando}
                          onClick={() => ejecutarTransicion(sigEstado)}
                        >
                          Avanzar a: {objSig.etiqueta}
                        </Boton>
                      );
                    })}

                  {puedeCancelarSeleccionado && (
                    <Boton
                      variante="peligro"
                      cargando={actualizando}
                      onClick={() => setModalCancelarAbierto(true)}
                    >
                      Cancelar pedido
                    </Boton>
                  )}

                  {estadoObjSeleccionado?.esFinal && (
                    <Badge variante="neutro" tamano="md">
                      Ciclo de pedido finalizado (Estado terminal)
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Historial de transiciones */}
            {pedidoSeleccionado.historialEstados?.length > 0 && (
              <div className="pedidos-modal__seccion">
                <h4 className="pedidos-modal__seccion-titulo">Historial de Estados</h4>
                <div className="pedidos-modal__historial">
                  {pedidoSeleccionado.historialEstados.map((h, i) => (
                    <div key={i} className="pedidos-modal__historial-item">
                      <strong>
                        {ETIQUETAS_ESTADO_PEDIDO[h.estadoNuevo || h.estado] || h.estadoNuevo || h.estado}
                      </strong>
                      <span className="pedidos-modal__historial-fecha">
                        {formatearFecha(h.fecha, { conHora: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Boton variante="contorno" bloque onClick={cerrarDetalle}>
              Cerrar
            </Boton>
          </div>
        </Modal>
      )}

      {/* Modal de Confirmación para Cancelar */}
      {modalCancelarAbierto && pedidoSeleccionado && (
        <Modal
          abierto={modalCancelarAbierto}
          alCerrar={() => setModalCancelarAbierto(false)}
          titulo="¿Cancelar este pedido web?"
          pie={
            <>
              <Boton
                variante="contorno"
                onClick={() => setModalCancelarAbierto(false)}
              >
                No, mantener pedido
              </Boton>
              <Boton
                variante="peligro"
                cargando={actualizando}
                onClick={() => ejecutarTransicion(ESTADOS_PEDIDO.CANCELADO)}
              >
                Sí, cancelar pedido
              </Boton>
            </>
          }
        >
          <p>
            ¿Estás seguro de que deseas cancelar el pedido{" "}
            <strong>#{pedidoSeleccionado.id}</strong>?
          </p>
          <p style={{ marginTop: "var(--esp-2)", color: "var(--color-texto-suave)" }}>
            El patrón State orquestará automáticamente la devolución del stock al inventario
            de la bodega para los artículos incluidos en este pedido.
          </p>
        </Modal>
      )}
    </div>
  );
}

export default PedidosPage;
