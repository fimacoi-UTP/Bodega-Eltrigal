/**
 * ============================================================================
 * VENTAS EN TIENDA · Punto de venta del mostrador
 * ============================================================================
 * Ruta: /dashboard/ventas · Acceso: ADMIN y CAJERO
 * ==========================================================================*/

import { useState, useEffect } from "react";
import { useInventario } from "../../hooks/useInventario";
import { useAuth } from "../../hooks/useAuth";
import { ventaRepository } from "../../repositories";
import { METODOS_PAGO, ETIQUETAS_METODO_PAGO } from "../../constantes";
import { formatearSoles, formatearFecha } from "../../utils/formato";
import {
  Boton,
  Card,
  CardCabecera,
  CardCuerpo,
  Input,
  Select,
  Badge,
  Alerta,
  Modal,
  Cargando,
  EstadoVacio,
} from "../../components/ui";
import "./VentasPage.css";

export function VentasPage() {
  const { productosActivos, buscar, descontarStock, reponerStock, obtenerProducto } = useInventario();
  const { usuario } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO.EFECTIVO);
  const [montoRecibido, setMontoRecibido] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [ventaExitosa, setVentaExitosa] = useState(null);
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [cargandoVentas, setCargandoVentas] = useState(true);
  const [ventaAAnular, setVentaAAnular] = useState(null);

  // Buscar productos
  useEffect(() => {
    if (busqueda.trim()) {
      setResultados(buscar(busqueda));
    } else {
      setResultados([]);
    }
  }, [busqueda, buscar]);

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

  const agregarAlCarrito = (producto) => {
    const existente = carrito.find((item) => item.productoId === producto.id);
    if (existente) {
      if (existente.cantidad < producto.stock) {
        setCarrito(
          carrito.map((item) =>
            item.productoId === producto.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          )
        );
      } else {
        setError("No hay suficiente stock disponible");
      }
    } else {
      setCarrito([
        ...carrito,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precioUnitario: producto.precio,
          subtotal: producto.precio,
        },
      ]);
    }
    setBusqueda("");
    setResultados([]);
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
  const vuelto = metodoPago === METODOS_PAGO.EFECTIVO ? Number(montoRecibido) - total : 0;

  const confirmarVenta = async () => {
    if (carrito.length === 0) {
      setError("El carrito está vacío");
      return;
    }

    if (metodoPago === METODOS_PAGO.EFECTIVO && (!montoRecibido || Number(montoRecibido) < total)) {
      setError("El monto recibido debe ser mayor o igual al total");
      return;
    }

    setProcesando(true);
    setError(null);

    try {
      // 🥇 PRIMERO: descontar stock (regla de oro)
      const itemsParaStock = carrito.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
      }));
      await descontarStock(itemsParaStock);

      // DESPUÉS: registrar la venta
      const venta = await ventaRepository.crear({
        fecha: new Date().toISOString(),
        cajeroId: usuario.id,
        cajeroNombre: usuario.nombre,
        items: carrito,
        total,
        metodoPago,
        montoRecibido: metodoPago === METODOS_PAGO.EFECTIVO ? Number(montoRecibido) : total,
        vuelto: metodoPago === METODOS_PAGO.EFECTIVO ? vuelto : 0,
        anulada: false,
      });

      setVentaExitosa(venta);
      setCarrito([]);
      setMontoRecibido("");
      setMetodoPago(METODOS_PAGO.EFECTIVO);

      // Recargar ventas del día
      const ventasActualizadas = await ventaRepository.obtenerDeHoy();
      setVentasDelDia(ventasActualizadas);
    } catch (err) {
      setError(err.message);
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

  return (
    <div className="ventas-page">
      <h1 className="ventas-page__titulo">Ventas en tienda</h1>

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
                placeholder="Escribe para buscar productos..."
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
                        <span className="ventas-page__resultado-nombre">{producto.nombre}</span>
                        <span className="ventas-page__resultado-precio">{formatearSoles(producto.precio)}</span>
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
                          <span className="ventas-page__item-nombre">{item.nombre}</span>
                          <span className="ventas-page__item-precio">{formatearSoles(item.precioUnitario)}</span>
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
                    <strong>Total: {formatearSoles(total)}</strong>
                  </div>

                  <div className="ventas-page__pago">
                    <Select
                      etiqueta="Método de pago"
                      valor={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                    >
                      {Object.entries(ETIQUETAS_METODO_PAGO).map(([valor, etiqueta]) => (
                        <option key={valor} value={valor}>
                          {etiqueta}
                        </option>
                      ))}
                    </Select>

                    {metodoPago === METODOS_PAGO.EFECTIVO && (
                      <Input
                        etiqueta="Monto recibido"
                        type="number"
                        value={montoRecibido}
                        onChange={(e) => setMontoRecibido(e.target.value)}
                        prefijo="S/"
                      />
                    )}

                    {metodoPago === METODOS_PAGO.EFECTIVO && montoRecibido && (
                      <div className="ventas-page__vuelto">
                        <span>Vuelto: </span>
                        <strong>{formatearSoles(vuelto)}</strong>
                      </div>
                    )}
                  </div>

                  <Boton
                    variante="primario"
                    bloque
                    onClick={confirmarVenta}
                    cargando={procesando}
                    disabled={carrito.length === 0}
                  >
                    Confirmar venta
                  </Boton>
                </>
              )}
            </CardCuerpo>
          </Card>
        </div>

        {/* Historial de ventas */}
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
                          <Badge variante="exito">{ETIQUETAS_METODO_PAGO[venta.metodoPago]}</Badge>
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
                          Anular
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

      {/* Modal de venta exitosa */}
      <Modal abierto={ventaExitosa !== null} alCerrar={cerrarModal} titulo="¡Venta registrada!">
        <div className="ventas-page__ticket">
          <h3>Ticket de venta #{ventaExitosa?.id}</h3>
          <p>Fecha: {ventaExitosa && formatearFecha(ventaExitosa.fecha, { conHora: true })}</p>
          <p>Cajero: {ventaExitosa?.cajeroNombre}</p>
          <hr />
          {ventaExitosa?.items.map((item) => (
            <div key={item.productoId} className="ventas-page__ticket-item">
              <span>{item.cantidad}x {item.nombre}</span>
              <span>{formatearSoles(item.subtotal)}</span>
            </div>
          ))}
          <hr />
          <div className="ventas-page__ticket-total">
            <strong>Total: {formatearSoles(ventaExitosa?.total)}</strong>
          </div>
          {ventaExitosa?.metodoPago === METODOS_PAGO.EFECTIVO && (
            <p>Pagado: {formatearSoles(ventaExitosa.montoRecibido)} | Vuelto: {formatearSoles(ventaExitosa.vuelto)}</p>
          )}
        </div>
        <Boton variante="primario" bloque onClick={cerrarModal}>
          Nueva venta
        </Boton>
      </Modal>

      {/* Modal de confirmación de anulación */}
      <Modal
        abierto={ventaAAnular !== null}
        alCerrar={() => setVentaAAnular(null)}
        titulo="¿Anular venta?"
      >
        <p>¿Estás seguro de anular la venta #{ventaAAnular?.id}?</p>
        <p>El stock será devuelto automáticamente.</p>
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
