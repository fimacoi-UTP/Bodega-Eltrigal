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
  const [ventaExitosa, setVentaExitosa] = useState(null);
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

  const cerrarModal = () => {
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
                    >
                      <div className="ventas-page__venta-header">
                        <span className="ventas-page__venta-hora">
                          {formatearFecha(venta.fecha, { conHora: true })}
                        </span>
                        {venta.anulada ? (
                          <Badge variante="peligro">Anulada</Badge>
                        ) : (
                          <Badge variante="exito">{ETIQUETAS_METODO_PAGO[venta.metodoPago] || venta.metodoPago}</Badge>
                        )}
                      </div>
                      <div className="ventas-page__venta-total">{formatearSoles(venta.total)}</div>
                      <div className="ventas-page__venta-cajero">{venta.cajeroNombre}</div>
                      {!venta.anulada && (
                        <Boton
                          variante="contorno"
                          tamano="sm"
                          onClick={() => setVentaAAnular(venta)}
                        >
                          Anular venta
                        </Boton>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardCuerpo>
          </Card>
        </div>
      </div>

      {/* Modal de venta exitosa / Ticket de mostrador */}
      <Modal abierto={ventaExitosa !== null} alCerrar={cerrarModal} titulo="¡Venta registrada con éxito!">
        <div className="ventas-page__ticket">
          <div className="ventas-page__ticket-cabecera">
            <h3 className="ventas-page__ticket-titulo">BODEGA EL TRIGAL</h3>
            <p className="ventas-page__ticket-sub">Ticket de Venta Mostrador</p>
            <p className="ventas-page__ticket-meta">Ticket #{ventaExitosa?.id}</p>
            <p className="ventas-page__ticket-meta">
              Fecha: {ventaExitosa && formatearFecha(ventaExitosa.fecha, { conHora: true })}
            </p>
            <p className="ventas-page__ticket-meta">Cajero: {ventaExitosa?.cajeroNombre}</p>
          </div>

          <hr className="ventas-page__ticket-divisor" />

          <div className="ventas-page__ticket-items">
            {ventaExitosa?.items.map((item) => (
              <div key={item.productoId} className="ventas-page__ticket-item">
                <span className="ventas-page__ticket-item-nombre">
                  {item.cantidad}x {item.nombre}
                </span>
                <span className="ventas-page__ticket-item-precio">{formatearSoles(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <hr className="ventas-page__ticket-divisor" />

          <div className="ventas-page__ticket-total">
            <span>TOTAL</span>
            <strong>{formatearSoles(ventaExitosa?.total)}</strong>
          </div>

          <div className="ventas-page__ticket-pago-info">
            <div className="ventas-page__ticket-pago-fila">
              <span>Medio de pago:</span>
              <strong>{ETIQUETAS_METODO_PAGO[ventaExitosa?.metodoPago] || ventaExitosa?.metodoPago}</strong>
            </div>
            {ventaExitosa?.referenciaPago && (
              <div className="ventas-page__ticket-pago-fila">
                <span>Referencia:</span>
                <span>{ventaExitosa.referenciaPago}</span>
              </div>
            )}
            {ventaExitosa?.detallePago && (
              <div className="ventas-page__ticket-pago-fila">
                <span>Detalle:</span>
                <span>{ventaExitosa.detallePago}</span>
              </div>
            )}
            {ventaExitosa?.metodoPago === METODOS_PAGO.EFECTIVO && (
              <>
                <div className="ventas-page__ticket-pago-fila">
                  <span>Monto recibido:</span>
                  <span>{formatearSoles(ventaExitosa.montoRecibido)}</span>
                </div>
                <div className="ventas-page__ticket-pago-fila ventas-page__ticket-pago-fila--vuelto">
                  <span>Vuelto entregado:</span>
                  <strong>{formatearSoles(ventaExitosa.vuelto)}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        <Boton variante="primario" bloque onClick={cerrarModal}>
          + Nueva venta
        </Boton>
      </Modal>

      {/* Modal de confirmación de anulación */}
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
