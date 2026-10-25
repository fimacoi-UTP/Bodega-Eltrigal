import { useState } from "react";
import { Card, CardCabecera, CardCuerpo, CardPie, Boton, Badge, Alerta, Input } from "../../../../components/ui";
import { useAuth } from "../../../../hooks/useAuth";
import { formatearSoles, formatearFecha } from "../../../../utils/formato";
import { ESTADOS_PEDIDO, TIPOS_ENTREGA } from "../../../../constantes";
import { obtenerEstadoPedido } from "../estados";

/**
 * ============================================================================
 * SEGUIMIENTO DE PEDIDO (Solo Lectura) · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Muestra el estado del pedido registrado en la tienda web, la línea de
 * tiempo (stepper) y el detalle completo de la compra de forma informativa.
 * Si el cliente compró como invitado, le ofrece crear su cuenta con 1 clic.
 * ==========================================================================*/

function OfertaCrearCuenta({ pedido }) {
  const { registrarse } = useAuth();
  const [cuentaCreada, setCuentaCreada] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const partes = (pedido?.clienteNombre || "").trim().split(/\s+/);
  const [nombres, setNombres] = useState(() => partes[0] ?? "");
  const [apellidos, setApellidos] = useState(() => partes.slice(1).join(" ") ?? "");
  const [password, setPassword] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState(null);

  // Si el pedido ya tiene idUsuario y no se acaba de crear aquí, no mostrar nada
  if (pedido.idUsuario != null && !cuentaCreada) {
    return null;
  }

  if (cuentaCreada) {
    return (
      <Card className="checkout-seguimiento-card checkout-oferta-exito">
        <CardCuerpo>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--esp-3)" }}>
            <span style={{ fontSize: "var(--texto-2xl)" }} aria-hidden="true">🎉</span>
            <div>
              <strong style={{ fontSize: "var(--texto-base)", color: "var(--color-exito)" }}>
                ¡Cuenta creada!
              </strong>
              <p style={{ margin: "var(--esp-1) 0 0", fontSize: "var(--texto-sm)", color: "var(--color-texto-suave)" }}>
                Tu sesión ha sido iniciada. Ahora puedes hacer seguimiento a tus compras y acceder a promociones exclusivas.
              </p>
            </div>
          </div>
        </CardCuerpo>
      </Card>
    );
  }

  const handleCrearCuenta = async (e) => {
    e.preventDefault();
    setError(null);

    const nom = nombres.trim();
    const ape = apellidos.trim();

    if (!nom || !ape) {
      setError("Por favor completa tus nombres y apellidos.");
      return;
    }
    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCreando(true);
    try {
      await registrarse({
        nombres: nom,
        apellidos: ape,
        email: (pedido.clienteCorreo || "").trim().toLowerCase(),
        telefono: (pedido.clienteTelefono || "").trim() || null,
        password,
      });
      setCuentaCreada(true);
    } catch (err) {
      setError(err.message || "Error al crear la cuenta.");
    } finally {
      setCreando(false);
    }
  };

  const iconoOjoAbierto = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const iconoOjoCerrado = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <Card className="checkout-seguimiento-card">
      <CardCabecera
        titulo="Crea tu cuenta para seguir tus pedidos"
        subtitulo="Completa una contraseña para ingresar a tu cuenta y hacer seguimiento en vivo a tus entregas."
      />
      <CardCuerpo>
        {error && (
          <Alerta variante="peligro" style={{ marginBottom: "var(--esp-4)" }}>
            {error}
          </Alerta>
        )}
        <form
          onSubmit={handleCrearCuenta}
          autoComplete="off"
          style={{ display: "flex", flexDirection: "column", gap: "var(--esp-4)" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--esp-3)" }}>
            <Input
              etiqueta="Nombres"
              name="nombres"
              autoComplete="off"
              value={nombres}
              onChange={(e) => setNombres(e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü '’-]/g, ""))}
              requerido
            />
            <Input
              etiqueta="Apellidos"
              name="apellidos"
              autoComplete="off"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü '’-]/g, ""))}
              placeholder="Tus apellidos"
              requerido
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--esp-3)" }}>
            <Input
              etiqueta="Correo electrónico"
              value={pedido.clienteCorreo || ""}
              disabled
              ayuda="Usado para tu pedido"
            />
            <Input
              etiqueta="Teléfono"
              value={pedido.clienteTelefono || ""}
              disabled
              ayuda="Usado para la entrega"
            />
          </div>

          <Input
            etiqueta="Contraseña"
            type={mostrarPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            requerido
            sufijo={
              <button
                type="button"
                className="registro__toggle-clave"
                onClick={() => setMostrarPassword((p) => !p)}
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarPassword ? iconoOjoCerrado : iconoOjoAbierto}
              </button>
            }
          />

          <Boton type="submit" cargando={creando} bloque>
            Crear mi cuenta
          </Boton>
        </form>
      </CardCuerpo>
    </Card>
  );
}

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

export function SeguimientoPedido({
  pedido,
  onNuevaCompra,
  mostrarHero = true,
  mostrarOferta = true,
  mostrarNuevaCompra = true,
}) {
  if (!pedido) return null;

  const estadoActual = resolverEstado(pedido.estado);
  const esRecojo = pedido.tipoEntrega === TIPOS_ENTREGA.RECOJO_TIENDA;
  const pasos = esRecojo ? PASOS_RECOJO : PASOS_DELIVERY;
  const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;

  return (
    <div className="checkout-seguimiento">
      {/* Cabecera de éxito */}
      {mostrarHero && (
        <div className="checkout-seguimiento-hero">
          <div className="checkout-seguimiento-hero__icono" aria-hidden="true">🎉</div>
          <h2 className="checkout-seguimiento-hero__titulo">¡Gracias por tu compra!</h2>
          <p className="checkout-seguimiento-hero__subtitulo">
            Tu pedido ha sido registrado con éxito en <strong>Bodega El Trigal</strong>.
          </p>
        </div>
      )}

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
                    className={`checkout-stepper-paso ${activo
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

      {/* Oferta de creación de cuenta (solo si compró como invitado) */}
      {mostrarOferta && <OfertaCrearCuenta pedido={pedido} />}

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
              <span>Ref: {pedido.datosPago?.referencia || pedido.referenciaPago || "—"}</span>
              {pedido.datosPago?.detalle && <small>{pedido.datosPago.detalle}</small>}
            </div>

            <div className="checkout-detalle-bloque">
              <span className="checkout-detalle-etiqueta">Total pagado:</span>
              <strong className="checkout-detalle-total">
                {formatearSoles(pedido.total)}
              </strong>
              {pedido.canal && (
                <span>Canal: <Badge variante="info" tamano="sm">{pedido.canal}</Badge></span>
              )}
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
        {mostrarNuevaCompra && (
          <CardPie>
            <Boton
              variante="secundario"
              bloque
              onClick={onNuevaCompra}
            >
              Realizar otra compra
            </Boton>
          </CardPie>
        )}
      </Card>
    </div>
  );
}

export default SeguimientoPedido;
