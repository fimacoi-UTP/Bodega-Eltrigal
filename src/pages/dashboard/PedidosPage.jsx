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
import { useInventario } from "../../hooks/useInventario";
import { pedidoRepository } from "../../repositories";
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
  transicionarEstadoPedido,
} from "../tienda/checkout/estados";
import "./PedidosPage.css";

const VARIANTES_ESTADO_PEDIDO = {
  [ESTADOS_PEDIDO.PENDIENTE]: "advertencia",
  [ESTADOS_PEDIDO.CONFIRMADO]: "info",
  [ESTADOS_PEDIDO.EN_CAMINO]: "marca",
  [ESTADOS_PEDIDO.ENTREGADO]: "exito",
  [ESTADOS_PEDIDO.CANCELADO]: "peligro",
};

export function PedidosPage() {
  const { reponerStock } = useInventario();

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

  // Carga inicial y escucha reactiva de nuevos pedidos y cambios de estado
  useEffect(() => {
    let cancelado = false;

    async function cargarPedidos() {
      try {
        const todos = await pedidoRepository.obtenerTodos();
        if (cancelado || !Array.isArray(todos)) return;

        // Ordenar por fecha descendente (más recientes primero)
        todos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        setPedidos(todos);

        // Si hay un modal abierto con un pedido, actualizarlo también
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

    cargarPedidos();

    const handleActualizacion = () => {
      cargarPedidos();
    };

    const handleStorage = (e) => {
      if (e.key === CLAVES.PEDIDOS || !e.key) {
        cargarPedidos();
      }
    };

    window.addEventListener("trigal:pedido-nuevo", handleActualizacion);
    window.addEventListener("trigal:pedido-actualizado", handleActualizacion);
    window.addEventListener("storage", handleStorage);

    // Polling de respaldo cada 3.5 segundos
    const intervalo = setInterval(() => {
      cargarPedidos();
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
    try {
      const todos = await pedidoRepository.obtenerTodos();
      todos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setPedidos(todos);
    } catch {
      setError("Error al recargar pedidos.");
    }
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

  // Manejador de transición con el Patrón State
  const ejecutarTransicion = async (nuevoEstado) => {
    if (!pedidoSeleccionado) return;
    setActualizando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const pedidoActualizado = await transicionarEstadoPedido(
        pedidoSeleccionado,
        nuevoEstado,
        { reponerStock }
      );

      // Actualizar en el estado local de pedidos
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoActualizado.id ? pedidoActualizado : p))
      );
      setPedidoSeleccionado(pedidoActualizado);
      setModalCancelarAbierto(false);

      const etiquetaNuevo = ETIQUETAS_ESTADO_PEDIDO[nuevoEstado] || nuevoEstado;
      setMensajeExito(`Pedido #${pedidoActualizado.id.slice(-6)} actualizado a "${etiquetaNuevo}".`);
    } catch (err) {
      setError(err.message || "Error al realizar la transición de estado.");
    } finally {
      setActualizando(false);
    }
  };

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
          className={`pedidos-page__metrica-card pedidos-page__metrica-card--todos ${
            filtroEstado === "TODOS" ? "pedidos-page__metrica-card--activa" : ""
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
          className={`pedidos-page__metrica-card pedidos-page__metrica-card--alerta ${
            filtroEstado === ESTADOS_PEDIDO.PENDIENTE ? "pedidos-page__metrica-card--activa" : ""
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
          className={`pedidos-page__metrica-card pedidos-page__metrica-card--info ${
            filtroEstado === ESTADOS_PEDIDO.CONFIRMADO ? "pedidos-page__metrica-card--activa" : ""
          }`}
          onClick={() => setFiltroEstado(ESTADOS_PEDIDO.CONFIRMADO)}
        >
          <div className="pedidos-page__metrica-top">
            <span className="pedidos-page__metrica-etiqueta">Confirmados</span>
          </div>
          <div className="pedidos-page__metrica-valor">{conteos[ESTADOS_PEDIDO.CONFIRMADO]}</div>
        </Card>

        <Card
          className={`pedidos-page__metrica-card pedidos-page__metrica-card--marca ${
            filtroEstado === ESTADOS_PEDIDO.EN_CAMINO ? "pedidos-page__metrica-card--activa" : ""
          }`}
          onClick={() => setFiltroEstado(ESTADOS_PEDIDO.EN_CAMINO)}
        >
          <div className="pedidos-page__metrica-top">
            <span className="pedidos-page__metrica-etiqueta">En camino</span>
          </div>
          <div className="pedidos-page__metrica-valor">{conteos[ESTADOS_PEDIDO.EN_CAMINO]}</div>
        </Card>

        <Card
          className={`pedidos-page__metrica-card pedidos-page__metrica-card--exito ${
            filtroEstado === ESTADOS_PEDIDO.ENTREGADO ? "pedidos-page__metrica-card--activa" : ""
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
                      <div className="pedidos-card__id">Pedido #{pedido.id.slice(-6)}</div>
                      <div className="pedidos-card__fecha">
                        {formatearFecha(pedido.fecha, { conHora: true })}
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
          titulo={`Gestión de Pedido #${pedidoSeleccionado.id}`}
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
                        {ETIQUETAS_ESTADO_PEDIDO[h.estado] || h.estado}
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
