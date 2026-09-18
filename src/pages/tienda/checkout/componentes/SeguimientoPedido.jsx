import { useState } from "react";
import { Card, CardCabecera, CardCuerpo, CardPie, Boton, Badge, Alerta, Modal } from "../../../../components/ui";
import { formatearSoles, formatearFecha } from "../../../../utils/formato";
import { ESTADOS_PEDIDO, TIPOS_ENTREGA } from "../../../../constantes";
import { obtenerEstadoPedido, transicionarEstadoPedido } from "../estados";
import { useInventario } from "../../../../hooks/useInventario";

/**
 * ============================================================================
 * PATRÓN STATE · Seguimiento y Demostración en Vivo de Estados de Pedido
 * ----------------------------------------------------------------------------
 * Este componente ilustra el ciclo de vida del pedido gestionado mediante
 * el patrón State:
 * - Renderiza el paso actual basado en la instancia de EstadoPedidoBase.
 * - Solo habilita las acciones permitidas por el estado actual (obtenerSiguientes).
 * - Permite cancelar únicamente si `estadoActual.puedeCancelar(pedido)` es true.
 * - Al cancelar, la máquina de estados ejecuta `reponerStock(items)` devolviendo
 *   las unidades al catálogo de la bodega.
 * ==========================================================================*/

const PASOS_DELIVERY = [
  { clave: ESTADOS_PEDIDO.PENDIENTE, etiqueta: "Pendiente" },
  { clave: ESTADOS_PEDIDO.CONFIRMADO, etiqueta: "Confirmado" },
  { clave: ESTADOS_PEDIDO.EN_CAMINO, etiqueta: "En camino" },
  { clave: ESTADOS_PEDIDO.ENTREGADO, etiqueta: "Entregado" },
];

const PASOS_RECOJO = [
  { clave: ESTADOS_PEDIDO.PENDIENTE, etiqueta: "Pendiente" },
  { clave: ESTADOS_PEDIDO.CONFIRMADO, etiqueta: "Preparado" },
  { clave: ESTADOS_PEDIDO.ENTREGADO, etiqueta: "Entregado" },
];

export function SeguimientoPedido({ pedido, onActualizarPedido, onNuevaCompra }) {
  const { reponerStock } = useInventario();
  const [actualizando, setActualizando] = useState(false);
  const [errorTransicion, setErrorTransicion] = useState(null);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);

  if (!pedido) return null;

  const estadoActual = obtenerEstadoPedido(pedido.estado);
  const esRecojo = pedido.tipoEntrega === TIPOS_ENTREGA.RECOJO_TIENDA;
  const pasos = esRecojo ? PASOS_RECOJO : PASOS_DELIVERY;
  const siguientesPermitidos = estadoActual.obtenerSiguientes(pedido);
  const puedeCancelar = estadoActual.puedeCancelar(pedido);
  const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;

  const manejarCambioEstado = async (nuevoEstado) => {
    setActualizando(true);
    setErrorTransicion(null);

    try {
      // Delegamos en la máquina de estados que orquesta el patrón State
      const pedidoModificado = await transicionarEstadoPedido(pedido, nuevoEstado, {
        reponerStock,
      });
      onActualizarPedido(pedidoModificado);
    } catch (err) {
      setErrorTransicion(err.message);
    } finally {
      setActualizando(false);
      setModalCancelarAbierto(false);
    }
  };

  return (
    <div className="checkout-seguimiento">
      {/* Cabecera de éxito */}
      <div className="checkout-seguimiento-hero">
        <div className="checkout-seguimiento-hero__icono" aria-hidden="true">🎉</div>
        <h2 className="checkout-seguimiento-hero__titulo">¡Gracias por tu compra!</h2>
        <p className="checkout-seguimiento-hero__subtitulo">
          Tu pedido ha sido registrado con éxito en <strong>Bodega El Trigal</strong>.
        </p>
      </div>

      {errorTransicion && (
        <Alerta variante="peligro" className="checkout-seguimiento-alerta">
          {errorTransicion}
        </Alerta>
      )}

      {/* Tarjeta de estado y línea de tiempo (Patrón State) */}
      <Card className="checkout-seguimiento-card">
        <CardCabecera
          titulo={`Pedido #${pedido.id}`}
          subtitulo={`Registrado el ${formatearFecha(pedido.fecha, { conHora: true })}`}
          accion={
            <Badge variante={estadoActual.varianteBadge} punto>
              {estadoActual.etiqueta}
            </Badge>
          }
        />
        <CardCuerpo>
          {/* Explicación del Patrón State */}
          <div className="checkout-state-banner">
            <div className="checkout-state-banner__cabecera">
              <span className="checkout-state-banner__icono" aria-hidden="true">🎯</span>
              <strong className="checkout-state-banner__titulo">
                Patrón State en funcionamiento:
              </strong>
            </div>
            <p className="checkout-state-banner__texto">
              El estado actual (<strong>{estadoActual.etiqueta}</strong>) rige qué transiciones son válidas y qué operaciones se permiten.
            </p>
          </div>

          {/* Stepper / Línea de tiempo visual */}
          {!esCancelado ? (
            <div className="checkout-stepper" aria-label="Progreso del pedido">
              {pasos.map((paso, index) => {
                const pasoObj = obtenerEstadoPedido(paso.clave);
                const activo = paso.clave === pedido.estado;
                const completado = !activo && estadoActual.pasoIndice > pasoObj.pasoIndice;

                return (
                  <div
                    key={paso.clave}
                    className={`checkout-stepper-paso ${
                      activo
                        ? "checkout-stepper-paso--activo"
                        : completado
                        ? "checkout-stepper-paso--completado"
                        : ""
                    }`}
                  >
                    <div className="checkout-stepper-nodo">
                      <span className="checkout-stepper-numero">
                        {completado ? "✓" : index + 1}
                      </span>
                    </div>
                    <span className="checkout-stepper-etiqueta">{paso.etiqueta}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="checkout-cancelado-aviso">
              <Alerta variante="peligro" titulo="Pedido Cancelado">
                {estadoActual.descripcion}
              </Alerta>
            </div>
          )}

          <div className="checkout-estado-descripcion-caja">
            <span className="checkout-estado-icono" aria-hidden="true">{estadoActual.icono}</span>
            <div className="checkout-estado-texto-caja">
              <strong>Estado actual: {estadoActual.etiqueta}</strong>
              <p>{estadoActual.descripcion}</p>
            </div>
          </div>

          {/* Controles interactivos del Patrón State */}
          <div className="checkout-state-acciones">
            <p className="checkout-state-acciones__titulo">
              Simular ciclo de vida del pedido (Transiciones del Patrón State):
            </p>
            <div className="checkout-state-botones">
              {siguientesPermitidos
                .filter((est) => est !== ESTADOS_PEDIDO.CANCELADO)
                .map((sigEstado) => {
                  const objSig = obtenerEstadoPedido(sigEstado);
                  return (
                    <Boton
                      key={sigEstado}
                      variante="primario"
                      tamano="sm"
                      cargando={actualizando}
                      onClick={() => manejarCambioEstado(sigEstado)}
                    >
                      Avanzar a: {objSig.etiqueta}
                    </Boton>
                  );
                })}

              {puedeCancelar && (
                <Boton
                  variante="peligro"
                  tamano="sm"
                  cargando={actualizando}
                  onClick={() => setModalCancelarAbierto(true)}
                >
                  Cancelar pedido
                </Boton>
              )}

              {estadoActual.esFinal && (
                <Badge variante="neutro" tamano="md">
                  Ciclo de pedido finalizado
                </Badge>
              )}
            </div>
          </div>
        </CardCuerpo>
      </Card>

      {/* Detalles completos de la compra */}
      <Card className="checkout-seguimiento-card">
        <CardCabecera titulo="Detalle de la compra" />
        <CardCuerpo>
          <div className="checkout-detalle-grid">
            <div className="checkout-detalle-bloque">
              <span className="checkout-detalle-etiqueta">Cliente:</span>
              <strong>{pedido.clienteNombre}</strong>
              <span>{pedido.clienteTelefono}</span>
              <span>{pedido.clienteCorreo}</span>
            </div>

            <div className="checkout-detalle-bloque">
              <span className="checkout-detalle-etiqueta">Tipo de entrega:</span>
              <strong>
                {esRecojo ? "Recojo en tienda" : "Delivery a domicilio"}
              </strong>
              <span>{pedido.direccionEntrega}</span>
              {pedido.referenciaEntrega && (
                <small className="checkout-detalle-ref">Ref: {pedido.referenciaEntrega}</small>
              )}
            </div>

            <div className="checkout-detalle-bloque">
              <span className="checkout-detalle-etiqueta">Medio de pago (Strategy):</span>
              <strong>{pedido.metodoPago}</strong>
              <span>Ref: {pedido.datosPago?.referencia || "—"}</span>
              <small>{pedido.datosPago?.detalle || ""}</small>
            </div>

            <div className="checkout-detalle-bloque">
              <span className="checkout-detalle-etiqueta">Total pagado:</span>
              <strong className="checkout-detalle-total">
                {formatearSoles(pedido.total)}
              </strong>
              <span>Canal: <Badge variante="info" tamano="sm">{pedido.canal}</Badge></span>
            </div>
          </div>

          <div className="checkout-detalle-items">
            <h4 className="checkout-detalle-items__titulo">Productos comprados:</h4>
            <ul className="checkout-detalle-items__lista">
              {pedido.items?.map((it, idx) => (
                <li key={it.productoId || idx} className="checkout-detalle-item">
                  <span>{it.cantidad}x {it.nombre}</span>
                  <strong>{formatearSoles(it.subtotal)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </CardCuerpo>
        <CardPie>
          <Boton
            variante="secundario"
            bloque
            onClick={onNuevaCompra}
          >
            Realizar otra compra
          </Boton>
        </CardPie>
      </Card>

      {/* Modal para confirmar cancelación */}
      <Modal
        abierto={modalCancelarAbierto}
        alCerrar={() => setModalCancelarAbierto(false)}
        titulo="¿Cancelar este pedido?"
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
              onClick={() => manejarCambioEstado(ESTADOS_PEDIDO.CANCELADO)}
            >
              Sí, cancelar pedido
            </Boton>
          </>
        }
      >
        <p>
          ¿Estás seguro de que deseas cancelar el pedido <strong>#{pedido.id}</strong>?
        </p>
        <p style={{ marginTop: "var(--esp-2)", color: "var(--color-texto-suave)" }}>
          Al cancelar, el patrón State invocará la reposición automática de stock para que los productos vuelvan a estar disponibles en la bodega.
        </p>
      </Modal>
    </div>
  );
}

export default SeguimientoPedido;
