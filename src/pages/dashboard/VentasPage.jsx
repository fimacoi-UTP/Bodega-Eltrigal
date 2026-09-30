/**
 * ============================================================================
 * VENTAS EN TIENDA · Punto de venta del mostrador (POS)
 * ============================================================================
 * Ruta: /dashboard/ventas · Acceso: ADMIN y CAJERO
 *
 * 🎯 PATRÓN STRATEGY:
 * Reutiliza las estrategias de pago de src/pages/tienda/checkout/pagos
 * (Efectivo, Tarjeta, Yape, Plin) para validar y procesar cada medio de cobro
 * en una venta presencial de mostrador sin duplicar lógica.
 * ==========================================================================*/

import { useState, useEffect, useMemo, useCallback } from "react";
import { useInventario } from "../../hooks/useInventario";
import { useAuth } from "../../hooks/useAuth";
import { ventaRepository } from "../../repositories";
import { METODOS_PAGO, ETIQUETAS_METODO_PAGO } from "../../constantes";
import { formatearSoles, formatearFecha } from "../../utils/formato";
import {
  obtenerEstrategiaPago,
  listarEstrategiasPago,
} from "../tienda/checkout/pagos";
import {
  Boton,
  Card,
  CardCabecera,
  CardCuerpo,
  Input,
  Badge,
  Alerta,
  Modal,
  Cargando,
  EstadoVacio,
} from "../../components/ui";
import "./VentasPage.css";

/**
 * ============================================================================
 * Componente reutilizable del Ticket de Venta de mostrador
 * ----------------------------------------------------------------------------
 * Usado tanto para confirmar una venta nueva como para consultar el detalle
 * completo de cualquier venta registrada en el historial del día.
 * ==========================================================================*/
function TicketVenta({ venta }) {
  if (!venta) return null;

  return (
    <div className="ventas-page__ticket">
      {venta.anulada && (
        <div className="ventas-page__ticket-alerta-anulada">
          <Badge variante="peligro" tamano="md">⚠️ VENTA ANULADA</Badge>
          {venta.motivoAnulacion && (
            <p className="ventas-page__ticket-motivo-anulacion">
              Motivo: {venta.motivoAnulacion}
            </p>
          )}
        </div>
      )}

      <div className="ventas-page__ticket-cabecera">
        <h3 className="ventas-page__ticket-titulo">BODEGA EL TRIGAL</h3>
        <p className="ventas-page__ticket-sub">Ticket de Venta Mostrador</p>
        <p className="ventas-page__ticket-meta">Ticket #{venta.id}</p>
        <p className="ventas-page__ticket-meta">
          Fecha: {formatearFecha(venta.fecha, { conHora: true })}
        </p>
        <p className="ventas-page__ticket-meta">Cajero: {venta.cajeroNombre}</p>
      </div>

      <hr className="ventas-page__ticket-divisor" />

      {/* Lista de productos vendidos con promociones detalladas */}
      <div className="ventas-page__ticket-items">
        {venta.items?.map((item, index) => {
          const precioUnit = Number(item.precioUnitario ?? item.precio ?? 0);
          const precioOrig = Number(item.precioOriginal ?? precioUnit);
          const tieneDesc = Boolean(item.tieneDescuento || precioOrig > precioUnit);
          const subtotal = Number(item.subtotal ?? precioUnit * item.cantidad);

          return (
            <div key={item.productoId || index} className="ventas-page__ticket-item">
              <div className="ventas-page__ticket-item-detalles">
                <div className="ventas-page__ticket-item-linea">
                  <span className="ventas-page__ticket-item-cantidad">{item.cantidad}x</span>
                  <span className="ventas-page__ticket-item-nombre">{item.nombre}</span>
                  {tieneDesc && (
                    <Badge variante="info" tamano="sm">Promo</Badge>
                  )}
                </div>
                <div className="ventas-page__ticket-item-unitario">
                  <span>{formatearSoles(precioUnit)} c/u</span>
                  {tieneDesc && (
                    <del className="ventas-page__ticket-item-tachado">
                      {formatearSoles(precioOrig)}
                    </del>
                  )}
                </div>
              </div>
              <span className="ventas-page__ticket-item-precio">
                {formatearSoles(subtotal)}
              </span>
            </div>
          );
        })}
      </div>

      <hr className="ventas-page__ticket-divisor" />

      <div className="ventas-page__ticket-total">
        <span>TOTAL</span>
        <strong>{formatearSoles(venta.total)}</strong>
      </div>

      {/* Información detallada del medio de pago */}
      <div className="ventas-page__ticket-pago-info">
        <div className="ventas-page__ticket-pago-fila">
          <span>Medio de pago:</span>
          <strong>{ETIQUETAS_METODO_PAGO[venta.metodoPago] || venta.metodoPago}</strong>
        </div>

        {venta.datosPago?.tipoTarjeta && (
          <div className="ventas-page__ticket-pago-fila">
            <span>Tipo de tarjeta:</span>
            <span>{venta.datosPago.tipoTarjeta}</span>
          </div>
        )}

        {venta.datosPago?.bancoPlin && (
          <div className="ventas-page__ticket-pago-fila">
            <span>Banco Plin:</span>
            <span>{venta.datosPago.bancoPlin}</span>
          </div>
        )}

        {(venta.datosPago?.telefonoYape || venta.datosPago?.telefonoPlin) && (
          <div className="ventas-page__ticket-pago-fila">
            <span>Celular de origen:</span>
            <span>{venta.datosPago?.telefonoYape || venta.datosPago?.telefonoPlin}</span>
          </div>
        )}

        {(venta.datosPago?.codigoAprobacion || venta.datosPago?.codigoOperacion) && (
          <div className="ventas-page__ticket-pago-fila">
            <span>Código de operación:</span>
            <span>{venta.datosPago?.codigoAprobacion || venta.datosPago?.codigoOperacion}</span>
          </div>
        )}

        {venta.referenciaPago && (
          <div className="ventas-page__ticket-pago-fila">
            <span>Referencia:</span>
            <span>{venta.referenciaPago}</span>
          </div>
        )}

        {venta.detallePago && (
          <div className="ventas-page__ticket-pago-fila">
            <span>Detalle:</span>
            <span>{venta.detallePago}</span>
          </div>
        )}

        {venta.metodoPago === METODOS_PAGO.EFECTIVO && (
          <>
            <div className="ventas-page__ticket-pago-fila">
              <span>Monto recibido:</span>
              <span>{formatearSoles(venta.montoRecibido ?? venta.total)}</span>
            </div>
            <div className="ventas-page__ticket-pago-fila ventas-page__ticket-pago-fila--vuelto">
              <span>Vuelto entregado:</span>
              <strong>{formatearSoles(venta.vuelto ?? 0)}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function VentasPage() {
  const { buscar, descontarStock, reponerStock, obtenerProducto } = useInventario();
  const { usuario } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const resultados = busqueda.trim() ? buscar(busqueda) : [];
  const [carrito, setCarrito] = useState([]);
  
  // 🎯 PATRÓN STRATEGY: Estado del medio de pago activo y sus datos
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO.EFECTIVO);
  const [datosPago, setDatosPago] = useState({});
  const [erroresPago, setErroresPago] = useState({});

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  
  // Modales de visualización de ticket
  const [ventaExitosa, setVentaExitosa] = useState(null);
  const [ventaDetalle, setVentaDetalle] = useState(null);

  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [cargandoVentas, setCargandoVentas] = useState(true);
  const [ventaAAnular, setVentaAAnular] = useState(null);

  // Lista de estrategias registradas en el patrón Strategy
  const estrategias = useMemo(() => listarEstrategiasPago(), []);
  const estrategiaActual = useMemo(() => obtenerEstrategiaPago(metodoPago), [metodoPago]);

  // Cargar ventas del día
  useEffect(() => {
    async function cargarVentas() {
      try {
        const ventas = await ventaRepository.obtenerDeHoy();
        setVentasDelDia(ventas);
      } catch (err) {
        console.error("Error al cargar ventas:", err);
      } finally {
        setCargandoVentas(false);
      }
    }
    cargarVentas();
  }, []);

  const handleSeleccionarMetodoPago = useCallback((nuevoMetodo) => {
    setMetodoPago(nuevoMetodo);
    setDatosPago(nuevoMetodo === METODOS_PAGO.TARJETA ? { tipoTarjeta: "DEBITO" } : {});
    setErroresPago({});
    setError(null);
  }, []);

  const handleCambioDatoPago = useCallback((campo, valor) => {
    setDatosPago((prev) => ({ ...prev, [campo]: valor }));
    setErroresPago((prev) => ({ ...prev, [campo]: undefined }));
  }, []);

  const agregarAlCarrito = (producto) => {
    const existente = carrito.find((item) => item.productoId === producto.id);
    if (existente) {
      if (existente.cantidad < producto.stock) {
        setCarrito(
          carrito.map((item) =>
            item.productoId === producto.id
              ? {
                  ...item,
                  cantidad: item.cantidad + 1,
                  subtotal: item.precioUnitario * (item.cantidad + 1),
                }
              : item
          )
        );
      } else {
        setError("No hay suficiente stock disponible para este producto.");
      }
    } else {
      setCarrito([
        ...carrito,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precioUnitario: producto.precio,
          precioOriginal: producto.precioOriginal ?? producto.precio,
          tieneDescuento: Boolean(producto.tieneDescuento),
          promocionesAplicadas: producto.promocionesAplicadas || [],
          subtotal: producto.precio,
        },
      ]);
    }
    setBusqueda("");
  };

  const cambiarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter((item) => item.productoId !== productoId));
      return;
    }

    const producto = obtenerProducto(productoId);
    if (producto && nuevaCantidad > producto.stock) {
      setError("No hay suficiente stock disponible");
      return;
    }

    setCarrito(
      carrito.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: item.precioUnitario * nuevaCantidad,
            }
          : item
      )
    );
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito(carrito.filter((item) => item.productoId !== productoId));
  };

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  // 🎯 Confirmación de venta con validación y procesamiento de estrategia
  const confirmarVenta = async () => {
    if (carrito.length === 0) {
      setError("El carrito de venta está vacío. Agrega productos para cobrar.");
      return;
    }

    // 1. Validar el medio de pago usando la estrategia activa
    const validacion = estrategiaActual.validar(datosPago, total);
    if (!validacion.valido) {
      setErroresPago(validacion.errores);
      setError("Completa o corrige los datos del medio de pago antes de continuar.");
      return;
    }

    setProcesando(true);
    setError(null);

    try {
      // 2. REGLA DE ORO: Descontar stock PRIMERO
      const itemsParaStock = carrito.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
      }));
      await descontarStock(itemsParaStock);

      // 3. Procesar el pago con la estrategia (Strategy Pattern)
      const resultadoPago = await estrategiaActual.procesarPago(total, datosPago);

      // 4. Calcular montos de cobro y vuelto
      const montoRecibido = metodoPago === METODOS_PAGO.EFECTIVO
        ? (datosPago.montoExacto ? total : Number(datosPago.pagaCon) || total)
        : total;
      const vuelto = metodoPago === METODOS_PAGO.EFECTIVO
        ? (resultadoPago.vuelto ?? 0)
        : 0;

      // 5. Registrar la venta en ventaRepository
      const nuevaVenta = {
        fecha: new Date().toISOString(),
        cajeroId: usuario?.id || "cajero",
        cajeroNombre: usuario?.nombre || "Cajero",
        items: carrito.map((item) => ({
          productoId: item.productoId,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          precioOriginal: item.precioOriginal,
          tieneDescuento: item.tieneDescuento,
          promocionesAplicadas: item.promocionesAplicadas || [],
          subtotal: item.subtotal,
        })),
        total,
        metodoPago,
        datosPago: {
          ...datosPago,
          ...resultadoPago,
        },
        montoRecibido,
        vuelto,
        referenciaPago: resultadoPago.referencia,
        detallePago: resultadoPago.detalle,
        anulada: false,
      };

      const ventaRegistrada = await ventaRepository.crear(nuevaVenta);

      // 6. Actualizar estados locales y mostrar ticket
      setVentaExitosa(ventaRegistrada);
      setCarrito([]);
      setDatosPago(metodoPago === METODOS_PAGO.TARJETA ? { tipoTarjeta: "DEBITO" } : {});
      setErroresPago({});

      // Recargar ventas del día
      const ventasActualizadas = await ventaRepository.obtenerDeHoy();
      setVentasDelDia(ventasActualizadas);
    } catch (err) {
      setError(err.message || "Error al registrar la venta");
    } finally {
      setProcesando(false);
    }
  };

  const anularVenta = async () => {
    if (!ventaAAnular) return;

    try {
      // Devolver el stock
      const itemsParaReponer = ventaAAnular.items.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
      }));
      await reponerStock(itemsParaReponer);

      // Anular la venta
      await ventaRepository.anular(ventaAAnular.id, "Anulada por el cajero");

      // Recargar ventas
      const ventasActualizadas = await ventaRepository.obtenerDeHoy();
      setVentasDelDia(ventasActualizadas);

      setVentaAAnular(null);
    } catch (err) {
      setError("Error al anular la venta: " + err.message);
    }
  };

  const cerrarModalVentaExitosa = () => {
    setVentaExitosa(null);
  };

  const FormularioEstrategia = estrategiaActual.Formulario;

  return (
    <div className="ventas-page">
      <header className="ventas-page__cabecera">
        <h1 className="ventas-page__titulo">Ventas en tienda</h1>
        <p className="ventas-page__subtitulo">
          Punto de venta del mostrador: cobro en efectivo, tarjeta (débito/crédito), Yape o Plin.
        </p>
      </header>

      {error && (
        <Alerta variante="peligro" onClose={() => setError(null)}>
          {error}
        </Alerta>
      )}

      <div className="ventas-page__grid">
        {/* Panel de búsqueda y carrito */}
        <div className="ventas-page__principal">
          <Card>
            <CardCabecera>
              <h2>Buscar productos</h2>
            </CardCabecera>
            <CardCuerpo>
              <Input
                placeholder="Escribe el nombre o categoría del producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                autoFocus
              />
              {resultados.length > 0 && (
                <div className="ventas-page__resultados">
                  {resultados.map((producto) => (
                    <div
                      key={producto.id}
                      className="ventas-page__resultado"
                      onClick={() => agregarAlCarrito(producto)}
                    >
                      <div className="ventas-page__resultado-info">
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--esp-2)" }}>
                          <span className="ventas-page__resultado-nombre">{producto.nombre}</span>
                          {producto.tieneDescuento && (
                            <Badge variante="info" tamano="sm">Promo</Badge>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "var(--esp-2)", alignItems: "center" }}>
                          <span className="ventas-page__resultado-precio">{formatearSoles(producto.precio)}</span>
                          {producto.tieneDescuento && (
                            <del style={{ color: "var(--color-texto-tenue)", fontSize: "var(--texto-xs)" }}>
                              {formatearSoles(producto.precioOriginal)}
                            </del>
                          )}
                        </div>
                      </div>
                      <Badge variante={producto.stock > 0 ? "exito" : "peligro"}>
                        Stock: {producto.stock}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardCuerpo>
          </Card>

          <Card>
            <CardCabecera>
              <h2>Carrito de venta</h2>
            </CardCabecera>
            <CardCuerpo>
              {carrito.length === 0 ? (
                <EstadoVacio icono="🛒" titulo="Carrito vacío" descripcion="Agrega productos para comenzar la venta" />
              ) : (
                <>
                  <div className="ventas-page__carrito">
                    {carrito.map((item) => (
                      <div key={item.productoId} className="ventas-page__item">
                        <div className="ventas-page__item-info">
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--esp-2)" }}>
                            <span className="ventas-page__item-nombre">{item.nombre}</span>
                            {item.tieneDescuento && (
                              <Badge variante="info" tamano="sm">Promo</Badge>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "var(--esp-2)", alignItems: "center" }}>
                            <span className="ventas-page__item-precio">{formatearSoles(item.precioUnitario)}</span>
                            {item.tieneDescuento && (
                              <del style={{ color: "var(--color-texto-tenue)", fontSize: "var(--texto-xs)" }}>
                                {formatearSoles(item.precioOriginal)}
                              </del>
                            )}
                          </div>
                        </div>
                        <div className="ventas-page__item-controles">
                          <Boton
                            variante="fantasma"
                            tamano="sm"
                            onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}
                          >
                            -
                          </Boton>
                          <span className="ventas-page__item-cantidad">{item.cantidad}</span>
                          <Boton
                            variante="fantasma"
                            tamano="sm"
                            onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}
                          >
                            +
                          </Boton>
                        </div>
                        <div className="ventas-page__item-subtotal">{formatearSoles(item.subtotal)}</div>
                        <Boton
                          variante="fantasma"
                          tamano="sm"
                          onClick={() => eliminarDelCarrito(item.productoId)}
                        >
                          ✕
                        </Boton>
                      </div>
                    ))}
                  </div>

                  <div className="ventas-page__total">
                    <span>Total a cobrar</span>
                    <strong>{formatearSoles(total)}</strong>
                  </div>

                  {/* 🎯 PATRÓN STRATEGY: Selector y formulario del medio de pago */}
                  <div className="ventas-page__pago">
                    <label className="ventas-page__pago-etiqueta">Medio de pago</label>
                    <div className="ventas-page__pagos-selector" role="radiogroup" aria-label="Medios de pago disponibles">
                      {estrategias.map((est) => {
                        const activa = est.id === metodoPago;
                        return (
                          <button
                            key={est.id}
                            type="button"
                            role="radio"
                            aria-checked={activa}
                            className={`ventas-page__pago-boton ${activa ? "ventas-page__pago-boton--activo" : ""}`}
                            onClick={() => handleSeleccionarMetodoPago(est.id)}
                          >
                            <span className="ventas-page__pago-icono">{est.icono}</span>
                            <span className="ventas-page__pago-nombre">{est.nombre}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Formulario de la estrategia concreta */}
                    <div className="ventas-page__pago-formulario">
                      {FormularioEstrategia && (
                        <FormularioEstrategia
                          datos={datosPago}
                          onChange={handleCambioDatoPago}
                          errores={erroresPago}
                          monto={total}
                        />
                      )}
                    </div>
                  </div>

                  <Boton
                    variante="primario"
                    bloque
                    onClick={confirmarVenta}
                    cargando={procesando}
                    disabled={carrito.length === 0}
                  >
                    Confirmar y registrar venta ({formatearSoles(total)})
                  </Boton>
                </>
              )}
            </CardCuerpo>
          </Card>
        </div>

        {/* Historial de ventas del día */}
        <div className="ventas-page__historial">
          <Card>
            <CardCabecera>
              <h2>Ventas de hoy</h2>
            </CardCabecera>
            <CardCuerpo>
              {cargandoVentas ? (
                <Cargando texto="Cargando ventas..." />
              ) : ventasDelDia.length === 0 ? (
                <EstadoVacio icono="🧾" titulo="Sin ventas hoy" />
              ) : (
                <div className="ventas-page__lista">
                  {ventasDelDia.map((venta) => (
                    <div
                      key={venta.id}
                      className={`ventas-page__venta ${venta.anulada ? "ventas-page__venta--anulada" : ""}`}
                      onClick={() => setVentaDetalle(venta)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setVentaDetalle(venta);
                        }
                      }}
                      title="Clic para ver detalle de la venta"
                    >
                      <div className="ventas-page__venta-header">
                        <span className="ventas-page__venta-hora">
                          {formatearFecha(venta.fecha, { conHora: true })}
                        </span>
                        {venta.anulada ? (
                          <Badge variante="peligro">Anulada</Badge>
                        ) : (
                          <Badge variante="exito">
                            {ETIQUETAS_METODO_PAGO[venta.metodoPago] || venta.metodoPago}
                          </Badge>
                        )}
                      </div>

                      <div className="ventas-page__venta-total">{formatearSoles(venta.total)}</div>

                      <div className="ventas-page__venta-meta">
                        <span className="ventas-page__venta-items-count">
                          {venta.items?.length || 0} {venta.items?.length === 1 ? "producto" : "productos"}
                        </span>
                        <span>·</span>
                        <span className="ventas-page__venta-cajero">{venta.cajeroNombre}</span>
                      </div>

                      <div
                        className="ventas-page__venta-acciones"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Boton
                          variante="fantasma"
                          tamano="sm"
                          onClick={() => setVentaDetalle(venta)}
                        >
                          Ver detalle
                        </Boton>
                        {!venta.anulada && (
                          <Boton
                            variante="contorno"
                            tamano="sm"
                            onClick={() => setVentaAAnular(venta)}
                          >
                            Anular
                          </Boton>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardCuerpo>
          </Card>
        </div>
      </div>

      {/* Modal 1: Venta recién registrada con éxito */}
      <Modal
        abierto={ventaExitosa !== null}
        alCerrar={cerrarModalVentaExitosa}
        titulo="¡Venta registrada con éxito!"
      >
        <TicketVenta venta={ventaExitosa} />
        <Boton variante="primario" bloque onClick={cerrarModalVentaExitosa}>
          + Nueva venta
        </Boton>
      </Modal>

      {/* Modal 2: Consulta de detalle de venta histórica */}
      <Modal
        abierto={ventaDetalle !== null}
        alCerrar={() => setVentaDetalle(null)}
        titulo={`Detalle de venta #${ventaDetalle?.id?.slice(-6) || ""}`}
        tamano="md"
        pie={
          <div style={{ display: "flex", gap: "var(--esp-2)", width: "100%", justifyContent: "flex-end" }}>
            {!ventaDetalle?.anulada && (
              <Boton
                variante="peligro"
                tamano="sm"
                onClick={() => {
                  const v = ventaDetalle;
                  setVentaDetalle(null);
                  setVentaAAnular(v);
                }}
              >
                Anular venta
              </Boton>
            )}
            <Boton variante="contorno" tamano="sm" onClick={() => setVentaDetalle(null)}>
              Cerrar
            </Boton>
          </div>
        }
      >
        <TicketVenta venta={ventaDetalle} />
      </Modal>

      {/* Modal 3: Confirmación de anulación de venta */}
      <Modal
        abierto={ventaAAnular !== null}
        alCerrar={() => setVentaAAnular(null)}
        titulo="¿Anular venta?"
      >
        <p>¿Estás seguro de anular la venta #{ventaAAnular?.id}?</p>
        <p>El stock será devuelto automáticamente al inventario.</p>
        <div className="ventas-page__modal-botones">
          <Boton variante="contorno" onClick={() => setVentaAAnular(null)}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={anularVenta}>
            Confirmar anulación
          </Boton>
        </div>
      </Modal>
    </div>
  );
}

export default VentasPage;
