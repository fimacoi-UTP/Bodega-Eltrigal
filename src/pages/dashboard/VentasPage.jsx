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

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useInventario } from "../../hooks/useInventario";
import { useAuth } from "../../hooks/useAuth";
import { ventaRepository } from "../../repositories";
import { BODEGA, METODOS_PAGO, ETIQUETAS_METODO_PAGO } from "../../constantes";
import { formatearSoles, formatearFecha } from "../../utils/formato";
import {
  obtenerEstrategiaPago,
  listarEstrategiasPago,
} from "../tienda/checkout/pagos";
import {
  Boton,
  Badge,
  Alerta,
  Modal,
  Drawer,
  Cargando,
  EstadoVacio,
} from "../../components/ui";
import "./VentasPage.css";

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

/**
 * ============================================================================
 * Componente Tarjeta de Producto para el Catálogo del POS (con Imagen y Stock)
 * ==========================================================================*/
function TarjetaProductoPos({ producto, onAgregar }) {
  const [errorImagen, setErrorImagen] = useState(false);

  const stock = Number(producto.stock || 0);
  const stockMinimo = Number(producto.stockMinimo || 5);
  const unidad = (producto.unidad || "UND").toUpperCase();
  
  let stockClase = "pos-card__badge-stock--ok";
  let stockTexto = `${stock} disp.`;
  if (stock <= 0) {
    stockClase = "pos-card__badge-stock--agotado";
    stockTexto = "Agotado";
  } else if (stock <= stockMinimo) {
    stockClase = "pos-card__badge-stock--alerta";
    stockTexto = `${stock} bajo`;
  }

  const iconoCategoria = ICONO_POR_CATEGORIA[producto.categoria] || "🌾";

  return (
    <article
      className={`pos-card ${stock <= 0 ? "pos-card--agotado" : ""}`}
      onClick={() => stock > 0 && onAgregar(producto)}
      role="button"
      tabIndex={stock > 0 ? 0 : -1}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && stock > 0) {
          e.preventDefault();
          onAgregar(producto);
        }
      }}
    >
      {/* 1. Visual: Imagen del producto o Placeholder con color e icono */}
      <div
        className="pos-card__visual"
        style={{
          backgroundColor: producto.color || "var(--color-superficie-suave)",
        }}
      >
        {/* Badges superiores flotantes */}
        <div className="pos-card__badges">
          <span className="pos-card__badge-unidad">{unidad}</span>
          <span className={`pos-card__badge-stock ${stockClase}`}>
            {stockTexto}
          </span>
        </div>

        {producto.imagen && !errorImagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="pos-card__imagen"
            loading="lazy"
            onError={() => setErrorImagen(true)}
          />
        ) : (
          <div className="pos-card__placeholder">
            <span className="pos-card__placeholder-icono" role="img" aria-label={producto.categoria}>
              {iconoCategoria}
            </span>
          </div>
        )}
      </div>

      {/* 2. Metadata y Nombre */}
      <div className="pos-card__cuerpo">
        <span className="pos-card__meta">
          {producto.marca ? `${producto.marca} · ` : ""}{producto.categoria}
        </span>
        <h3 className="pos-card__nombre" title={producto.nombre}>
          {producto.nombre}
        </h3>
      </div>

      {/* 3. Precios y Botón Circular de Agregar */}
      <div className="pos-card__pie">
        <div className="pos-card__precios">
          <span className="pos-card__precio">
            {formatearSoles(producto.precio)}
          </span>
          {producto.tieneDescuento && (
            <div className="pos-card__promo-info">
              <del className="pos-card__precio-original">
                {formatearSoles(producto.precioOriginal)}
              </del>
              <span className="pos-card__promo-tag">Promo</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="pos-card__btn-agregar"
          disabled={stock <= 0}
          onClick={(e) => {
            e.stopPropagation();
            onAgregar(producto);
          }}
          title={stock > 0 ? "Agregar a la venta" : "Producto agotado"}
          aria-label={`Agregar ${producto.nombre} a la venta`}
        >
          +
        </button>
      </div>
    </article>
  );
}

/**
 * ============================================================================
 * Componente reutilizable del Ticket de Venta de mostrador (Optimizado POS Térmico)
 * ----------------------------------------------------------------------------
 * Usado tanto para confirmar una venta nueva como para consultar el detalle
 * completo de cualquier venta registrada en el historial del día.
 * Soporta impresión térmica con preajustes de 80mm y 58mm.
 * ==========================================================================*/
function TicketVenta({ venta }) {
  const [anchoPapel, setAnchoPapel] = useState("80mm");

  if (!venta) return null;

  const total = Number(venta.total || 0);
  const opGravada = total / 1.18;
  const igv = total - opGravada;

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className={`ventas-page__ticket ventas-page__ticket--papel-${anchoPapel}`}>
      {/* Ajuste dinámico de @page según el ancho de papel seleccionado (80mm / 58mm) y alto automático */}
      <style>{`
        @media print {
          @page {
            size: ${anchoPapel === "58mm" ? "58mm auto" : "80mm auto"};
            margin: 0;
          }
        }
      `}</style>

      {/* Barra de herramientas para pantalla (Oculta al imprimir) */}
      <div className="ventas-page__ticket-toolbar no-print">
        <div className="ventas-page__ticket-papel-selector">
          <span className="ventas-page__ticket-papel-label">Formato papel:</span>
          <button
            type="button"
            className={`ventas-page__ticket-papel-btn ${anchoPapel === "80mm" ? "ventas-page__ticket-papel-btn--activo" : ""}`}
            onClick={() => setAnchoPapel("80mm")}
            title="Formato de ticket térmico estándar de 80mm"
          >
            80mm
          </button>
          <button
            type="button"
            className={`ventas-page__ticket-papel-btn ${anchoPapel === "58mm" ? "ventas-page__ticket-papel-btn--activo" : ""}`}
            onClick={() => setAnchoPapel("58mm")}
            title="Formato de ticket térmico compacto de 58mm"
          >
            58mm
          </button>
        </div>

        <Boton
          variante="secundario"
          tamano="sm"
          onClick={handleImprimir}
          className="ventas-page__ticket-btn-imprimir"
        >
          🖨️ Imprimir ticket
        </Boton>
      </div>

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

      {/* Cabecera del comprobante */}
      <div className="ventas-page__ticket-cabecera">
        <h3 className="ventas-page__ticket-titulo">{BODEGA.nombre.toUpperCase()}</h3>
        {BODEGA.razonSocial && (
          <p className="ventas-page__ticket-razon">{BODEGA.razonSocial}</p>
        )}
        {BODEGA.ruc && (
          <p className="ventas-page__ticket-ruc">RUC: {BODEGA.ruc}</p>
        )}
        <p className="ventas-page__ticket-sub">{BODEGA.lema}</p>
        <p className="ventas-page__ticket-contacto">{BODEGA.direccion} · {BODEGA.ciudad}</p>
        <p className="ventas-page__ticket-contacto">Tel: {BODEGA.telefono}</p>

        <hr className="ventas-page__ticket-divisor" />

        <div className="ventas-page__ticket-metas">
          <p className="ventas-page__ticket-meta">Ticket: <strong>#{venta.id}</strong></p>
          <p className="ventas-page__ticket-meta">
            Fecha: {formatearFecha(venta.fecha, { conHora: true })}
          </p>
          <p className="ventas-page__ticket-meta">Cajero: {venta.cajeroNombre}</p>
        </div>
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

      {/* Desglose de impuestos */}
      <div className="ventas-page__ticket-impuestos">
        <div className="ventas-page__ticket-impuesto-fila">
          <span>Op. Gravada:</span>
          <span>{formatearSoles(opGravada)}</span>
        </div>
        <div className="ventas-page__ticket-impuesto-fila">
          <span>IGV (18%):</span>
          <span>{formatearSoles(igv)}</span>
        </div>
      </div>

      <div className="ventas-page__ticket-total">
        <span>IMPORTE TOTAL</span>
        <strong>{formatearSoles(total)}</strong>
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

      {/* Pie térmico */}
      <div className="ventas-page__ticket-pie-termico">
        <hr className="ventas-page__ticket-divisor" />
        <p className="ventas-page__ticket-agradecimiento">¡GRACIAS POR SU COMPRA!</p>
        <p className="ventas-page__ticket-aviso">Conserve este comprobante de venta</p>
        <p className="ventas-page__ticket-web">www.eltrigal.pe</p>
      </div>
    </div>
  );
}

export function VentasPage() {
  const { productosActivos, categorias, descontarStock, reponerStock, obtenerProducto } = useInventario();
  const { usuario } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");
  const [carrito, setCarrito] = useState([]);
  const inputBusquedaRef = useRef(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  
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

  // Contadores por categoría para los chips de la barra
  const conteoPorCategoria = useMemo(() => {
    const conteo = { Todos: productosActivos.length };
    for (const cat of categorias) {
      conteo[cat] = 0;
    }
    for (const prod of productosActivos) {
      if (prod.categoria) {
        conteo[prod.categoria] = (conteo[prod.categoria] || 0) + 1;
      }
    }
    return conteo;
  }, [productosActivos, categorias]);

  // Lista de productos filtrados por categoría y búsqueda de texto/código
  const productosFiltrados = useMemo(() => {
    let lista = productosActivos;
    if (categoriaSeleccionada && categoriaSeleccionada !== "Todos") {
      lista = lista.filter((p) => p.categoria === categoriaSeleccionada);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      lista = lista.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(q) ||
          p.marca?.toLowerCase().includes(q) ||
          p.categoria?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q)
      );
    }
    return lista;
  }, [productosActivos, categoriaSeleccionada, busqueda]);

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
    if (producto.stock <= 0) {
      setError(`"${producto.nombre}" está agotado.`);
      return;
    }

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
        setError(`No hay más stock disponible para "${producto.nombre}" (Máx: ${producto.stock}).`);
      }
    } else {
      setCarrito([
        ...carrito,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          unidad: producto.unidad || "UND",
          cantidad: 1,
          precioUnitario: producto.precio,
          precioOriginal: producto.precioOriginal ?? producto.precio,
          tieneDescuento: Boolean(producto.tieneDescuento),
          promocionesAplicadas: producto.promocionesAplicadas || [],
          subtotal: producto.precio,
          stockMaximo: producto.stock,
        },
      ]);
    }
  };

  const cambiarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter((item) => item.productoId !== productoId));
      return;
    }

    const producto = obtenerProducto(productoId);
    if (producto && nuevaCantidad > producto.stock) {
      setError(`Stock máximo alcanzado para "${producto.nombre}" (${producto.stock} disponibles).`);
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
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  // Total vendido hoy
  const totalVendidoHoy = useMemo(() => {
    return ventasDelDia
      .filter((v) => !v.anulada)
      .reduce((sum, v) => sum + (Number(v.total) || 0), 0);
  }, [ventasDelDia]);

  // Al presionar Enter en el input de búsqueda, si hay 1 solo resultado, agregarlo
  const handleKeyDownBusqueda = (e) => {
    if (e.key === "Enter" && productosFiltrados.length === 1) {
      e.preventDefault();
      agregarAlCarrito(productosFiltrados[0]);
      setBusqueda("");
    }
  };

  const enfocarBuscador = () => {
    if (inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
      inputBusquedaRef.current.select();
    }
  };

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
    <div className="pos-terminal">
      {/* 1. Header de Terminal POS Estilo FinTech */}
      <header className="pos-header">
        <div className="pos-header__izq">
          <div className="pos-header__status-badge">
            <span className="pos-header__status-dot" />
            <span className="pos-header__status-texto">PUNTO DE VENTA</span>
          </div>
          <div className="pos-header__titulos">
            <h1 className="pos-header__titulo">Terminal de caja</h1>
            <p className="pos-header__sub">
              Cajero activo: <strong>{usuario?.nombre || "Cajero en turno"}</strong> · {formatearFecha(new Date().toISOString(), { conHora: false })}
            </p>
          </div>
        </div>

        <div className="pos-header__der">
          <div className="pos-header__stats-pill">
            <span className="pos-header__stats-label">Ventas hoy:</span>
            <span className="pos-header__stats-valor">{ventasDelDia.filter((v) => !v.anulada).length} ({formatearSoles(totalVendidoHoy)})</span>
          </div>
          <button
            type="button"
            className={`pos-header__btn-historial ${mostrarHistorial ? "pos-header__btn-historial--activo" : ""}`}
            onClick={() => setMostrarHistorial(true)}
          >
            🧾 Historial del turno ({ventasDelDia.filter((v) => !v.anulada).length})
          </button>
        </div>
      </header>

      {error && (
        <Alerta variante="peligro" onClose={() => setError(null)}>
          {error}
        </Alerta>
      )}

      {/* 2. Layout Principal Split: Catálogo (~2/3) + Carrito Fijo (~1/3) */}
      <div className="pos-layout">
        {/* PANEL IZQUIERDO: Catálogo de productos */}
        <section className="pos-catalogo">
          {/* Barra de Búsqueda y Escáner */}
          <div className="pos-busqueda-card">
            <div className="pos-busqueda-input-wrapper">
              <span className="pos-busqueda-icono">🔍</span>
              <input
                ref={inputBusquedaRef}
                id="pos-input-busqueda"
                type="text"
                className="pos-busqueda-input"
                placeholder="Buscar producto por nombre, marca o código... (Enter para agregar)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={handleKeyDownBusqueda}
                autoFocus
              />
              {busqueda && (
                <button
                  type="button"
                  className="pos-busqueda-btn-limpiar"
                  onClick={() => setBusqueda("")}
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              className="pos-busqueda-btn-escanear"
              onClick={enfocarBuscador}
              title="Enfocar buscador para lector de código de barras"
            >
              📷 Escanear
            </button>
          </div>

          {/* Barra de Categorías (Chips con contador) */}
          <nav className="pos-categorias-nav" aria-label="Categorías de productos">
            <button
              type="button"
              className={`pos-categoria-chip ${categoriaSeleccionada === "Todos" ? "pos-categoria-chip--activo" : ""}`}
              onClick={() => setCategoriaSeleccionada("Todos")}
            >
              <span>Todos</span>
              <span className="pos-categoria-chip__contador">{conteoPorCategoria.Todos || 0}</span>
            </button>

            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`pos-categoria-chip ${categoriaSeleccionada === cat ? "pos-categoria-chip--activo" : ""}`}
                onClick={() => setCategoriaSeleccionada(cat)}
              >
                <span>{cat}</span>
                <span className="pos-categoria-chip__contador">{conteoPorCategoria[cat] || 0}</span>
              </button>
            ))}
          </nav>

          {/* Grid de Productos con Imágenes */}
          <div className="pos-grid">
            {productosFiltrados.length === 0 ? (
              <div className="pos-grid__vacio">
                <EstadoVacio
                  icono="📦"
                  titulo="Sin productos encontrados"
                  descripcion="No hay coincidencias con los filtros aplicados. Intenta con otra búsqueda o categoría."
                />
              </div>
            ) : (
              productosFiltrados.map((producto) => (
                <TarjetaProductoPos
                  key={producto.id}
                  producto={producto}
                  onAgregar={agregarAlCarrito}
                />
              ))
            )}
          </div>
        </section>

        {/* PANEL DERECHO: Carrito "Venta en curso" Fijo */}
        <aside className="pos-panel-carrito">
          <div className="pos-carrito-card">
            {/* Cabecera del Carrito */}
            <div className="pos-carrito-card__cabecera">
              <div className="pos-carrito-card__titulo-bloque">
                <span className="pos-carrito-card__icono">🛒</span>
                <h2 className="pos-carrito-card__titulo">Venta en curso</h2>
                <span className="pos-carrito-card__contador">
                  {totalItems} {totalItems === 1 ? "ítem" : "ítems"}
                </span>
              </div>
              {carrito.length > 0 && (
                <button
                  type="button"
                  className="pos-carrito-card__btn-vaciar"
                  onClick={() => setCarrito([])}
                  title="Vaciar carrito actual"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Lista de Ítems o Estado Vacío */}
            <div className="pos-carrito-card__cuerpo">
              {carrito.length === 0 ? (
                <div className="pos-carrito__vacio">
                  <span className="pos-carrito__vacio-icono">🛒</span>
                  <p className="pos-carrito__vacio-titulo">Venta vacía</p>
                  <p className="pos-carrito__vacio-desc">
                    Toca un producto del catálogo o búscalo con el lector para comenzar la venta.
                  </p>
                </div>
              ) : (
                <div className="pos-carrito__items-lista">
                  {carrito.map((item) => (
                    <div key={item.productoId} className="pos-item-fila">
                      <div className="pos-item-fila__info">
                        <div className="pos-item-fila__nombre-linea">
                          <span className="pos-item-fila__nombre" title={item.nombre}>{item.nombre}</span>
                          {item.tieneDescuento && (
                            <span className="pos-item-fila__promo-badge">Promo</span>
                          )}
                        </div>
                        <div className="pos-item-fila__unitario">
                          <span>{formatearSoles(item.precioUnitario)} c/u</span>
                          {item.tieneDescuento && (
                            <del className="pos-item-fila__tachado">{formatearSoles(item.precioOriginal)}</del>
                          )}
                        </div>
                      </div>

                      {/* Stepper +/- */}
                      <div className="pos-item-fila__stepper">
                        <button
                          type="button"
                          className="pos-item-fila__btn-paso"
                          onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}
                          title="Disminuir cantidad"
                        >
                          −
                        </button>
                        <span className="pos-item-fila__cantidad">{item.cantidad}</span>
                        <button
                          type="button"
                          className="pos-item-fila__btn-paso"
                          disabled={item.cantidad >= item.stockMaximo}
                          onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}
                          title="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal y Quitar */}
                      <span className="pos-item-fila__subtotal">
                        {formatearSoles(item.subtotal)}
                      </span>

                      <button
                        type="button"
                        className="pos-item-fila__btn-quitar"
                        onClick={() => eliminarDelCarrito(item.productoId)}
                        title="Quitar producto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selector de Medios de Pago (Strategy Pattern) */}
            {carrito.length > 0 && (
              <div className="pos-carrito__seccion-pago">
                <label className="pos-carrito__pago-label">Medio de pago</label>
                <div className="pos-carrito__pagos-grid" role="radiogroup" aria-label="Medios de pago disponibles">
                  {estrategias.map((est) => {
                    const activa = est.id === metodoPago;
                    return (
                      <button
                        key={est.id}
                        type="button"
                        role="radio"
                        aria-checked={activa}
                        className={`pos-pago-tab ${activa ? "pos-pago-tab--activo" : ""}`}
                        onClick={() => handleSeleccionarMetodoPago(est.id)}
                      >
                        <span className="pos-pago-tab__icono">{est.icono}</span>
                        <span className="pos-pago-tab__nombre">{est.nombre}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Formulario concreto de la estrategia */}
                <div className="pos-carrito__pago-formulario">
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
            )}

            {/* Footer con Totales y Botón de Cobro */}
            <div className="pos-carrito-card__pie">
              <div className="pos-carrito__resumen-fila">
                <span className="pos-carrito__resumen-etiqueta">Subtotal</span>
                <span className="pos-carrito__monto-mono">{formatearSoles(total)}</span>
              </div>

              <div className="pos-carrito__total-fila">
                <span className="pos-carrito__total-etiqueta">TOTAL</span>
                <span className="pos-carrito__total-monto">{formatearSoles(total)}</span>
              </div>

              <Boton
                variante="primario"
                bloque
                tamano="lg"
                onClick={confirmarVenta}
                cargando={procesando}
                disabled={carrito.length === 0}
                className="pos-carrito__btn-cobrar"
              >
                Cobrar venta → {formatearSoles(total)}
              </Boton>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. Panel Lateral Deslizante (Drawer): Historial de Ventas del Turno */}
      <Drawer
        abierto={mostrarHistorial}
        alCerrar={() => setMostrarHistorial(false)}
        titulo="Historial de ventas del turno"
        subtitulo={`Ventas hoy: ${ventasDelDia.filter((v) => !v.anulada).length} · Total: ${formatearSoles(totalVendidoHoy)}`}
        tamano="md"
      >
        {cargandoVentas ? (
          <Cargando texto="Cargando ventas del turno..." />
        ) : ventasDelDia.length === 0 ? (
          <EstadoVacio
            icono="🧾"
            titulo="Sin ventas hoy"
            descripcion="Las ventas cobradas en este turno se listarán aquí en tiempo real."
          />
        ) : (
          <div className="pos-historial__lista">
            {ventasDelDia.map((venta) => (
              <div
                key={venta.id}
                className={`pos-historial__item ${venta.anulada ? "pos-historial__item--anulada" : ""}`}
                onClick={() => setVentaDetalle(venta)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setVentaDetalle(venta);
                  }
                }}
                title="Clic para ver comprobante térmico"
              >
                <div className="pos-historial__item-header">
                  <span className="pos-historial__item-hora">
                    {formatearFecha(venta.fecha, { conHora: true })}
                  </span>
                  {venta.anulada ? (
                    <Badge variante="peligro" tamano="sm">Anulada</Badge>
                  ) : (
                    <Badge variante="exito" tamano="sm">
                      {ETIQUETAS_METODO_PAGO[venta.metodoPago] || venta.metodoPago}
                    </Badge>
                  )}
                </div>

                <div className="pos-historial__item-total">{formatearSoles(venta.total)}</div>

                <div className="pos-historial__item-meta">
                  <span>{venta.items?.length || 0} {venta.items?.length === 1 ? "producto" : "productos"}</span>
                  <span>·</span>
                  <span>{venta.cajeroNombre}</span>
                </div>

                <div
                  className="pos-historial__item-acciones"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => setVentaDetalle(venta)}
                  >
                    Ver ticket
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
      </Drawer>

      {/* Modal 1: Venta recién registrada con éxito */}
      <Modal
        abierto={ventaExitosa !== null}
        alCerrar={cerrarModalVentaExitosa}
        titulo="¡Venta registrada con éxito!"
      >
        <TicketVenta venta={ventaExitosa} />
        <div style={{ display: "flex", gap: "var(--esp-2)", marginTop: "var(--esp-3)" }} className="no-print">
          <Boton
            variante="secundario"
            tamano="md"
            onClick={() => window.print()}
            style={{ flex: 1 }}
          >
            🖨️ Imprimir ticket
          </Boton>
          <Boton
            variante="primario"
            tamano="md"
            onClick={cerrarModalVentaExitosa}
            style={{ flex: 1.5 }}
          >
            + Nueva venta
          </Boton>
        </div>
      </Modal>

      {/* Modal 2: Consulta de detalle de venta histórica */}
      <Modal
        abierto={ventaDetalle !== null}
        alCerrar={() => setVentaDetalle(null)}
        titulo={`Detalle de venta #${ventaDetalle?.id?.slice(-6) || ""}`}
        tamano="md"
        pie={
          <div style={{ display: "flex", gap: "var(--esp-2)", width: "100%", justifyContent: "space-between", alignItems: "center" }} className="no-print">
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() => window.print()}
            >
              🖨️ Imprimir ticket
            </Boton>

            <div style={{ display: "flex", gap: "var(--esp-2)" }}>
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
