import { Card, CardCabecera, CardCuerpo, CardPie, Boton, Badge, Alerta } from "../../../../components/ui";
import { formatearSoles, formatearFecha } from "../../../../utils/formato";
import { ESTADOS_PEDIDO, TIPOS_ENTREGA } from "../../../../constantes";
import { obtenerEstadoPedido } from "../estados";

/**
 * ============================================================================
 * SEGUIMIENTO DE PEDIDO (Solo Lectura) · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Muestra el estado del pedido registrado en la tienda web, la línea de
 * tiempo (stepper) y el detalle completo de la compra de forma informativa.
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

/**
 * Resuelve de forma segura el objeto de estado, evitando excepciones
 * si el backend envía un estado no reconocido.
 */
function resolverEstado(nombreEstado) {
  try {
    return obtenerEstadoPedido(nombreEstado);
  } catch {
    return {
      nombre: nombreEstado,
      etiqueta: nombreEstado || "En proceso",
      descripcion: `Tu pedido se encuentra en estado: ${nombreEstado || "En proceso"}.`,
      icono: "📦",
      varianteBadge: "info",
      pasoIndice: 0,
      esFinal: false,
    };
  }
}

export function SeguimientoPedido({ pedido, onNuevaCompra }) {
  if (!pedido) return null;

  const estadoActual = resolverEstado(pedido.estado);
  const esRecojo = pedido.tipoEntrega === TIPOS_ENTREGA.RECOJO_TIENDA;
  const pasos = esRecojo ? PASOS_RECOJO : PASOS_DELIVERY;
  const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;

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

      {/* Tarjeta de estado y línea de tiempo */}
      <Card className="checkout-seguimiento-card">
        <CardCabecera
          titulo={`Pedido #${pedido.codigo || pedido.id}`}
          subtitulo={`Registrado el ${formatearFecha(pedido.fecha || pedido.fechaCreacion, { conHora: true })}`}
          accion={
            <Badge variante={estadoActual.varianteBadge || "info"} punto>
              {estadoActual.etiqueta}
            </Badge>
          }
        />
        <CardCuerpo>
          {/* Explicación del estado */}
          <div className="checkout-state-banner">
            <div className="checkout-state-banner__cabecera">
              <span className="checkout-state-banner__icono" aria-hidden="true">🎯</span>
              <strong className="checkout-state-banner__titulo">
                Estado del pedido:
              </strong>
            </div>
            <p className="checkout-state-banner__texto">
              Estado actual: <strong>{estadoActual.etiqueta}</strong>. Nuestro equipo se encuentra procesando tu compra.
            </p>
          </div>

          {/* Stepper / Línea de tiempo visual */}
          {!esCancelado ? (
            <div className="checkout-stepper" aria-label="Progreso del pedido">
              {pasos.map((paso, index) => {
                const pasoObj = resolverEstado(paso.clave);
                const activo = paso.clave === pedido.estado;
                const completado = !activo && (estadoActual.pasoIndice ?? 0) > (pasoObj.pasoIndice ?? index);

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
              <span className="checkout-detalle-etiqueta">Medio de pago:</span>
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
    </div>
  );
}

export default SeguimientoPedido;
