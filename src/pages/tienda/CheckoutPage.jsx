/**
 * ============================================================================
 * MÓDULO CHECKOUT · Finalizar Compra en Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Este módulo orquesta la compra de productos por la tienda web integrando:
 *
 * 1. 🎯 PATRÓN STRATEGY (Medios de Pago):
 *    Ubicado en `src/pages/tienda/checkout/pagos/`.
 *    Cada medio de pago (Yape, Plin, Tarjeta, Efectivo) es una estrategia
 *    independiente con interfaz común: `validar(datos, monto)`,
 *    `procesarPago(monto, datos)` y su formulario propio.
 *    CheckoutPage no hace switches ni if/else por método: delega en la
 *    estrategia activa `estrategia.procesarPago(total, datosPago)`.
 *
 * 2. 🎯 PATRÓN STATE (Estados del Pedido):
 *    Ubicado en `src/pages/tienda/checkout/estados/`.
 *    Cada estado (PENDIENTE, CONFIRMADO, EN_CAMINO, ENTREGADO, CANCELADO)
 *    encapsula qué transiciones están permitidas, si se puede cancelar
 *    y la reposición de stock al cancelar mediante la máquina de estados.
 *
 * 3. 🥇 LA REGLA DE ORO:
 *    Descuenta stock con `await descontarStock(items)` de `useInventario()`
 *    ANTES de crear el pedido con `await pedidoRepository.crear({...})`
 *    con el canal `'web'`.
 * ==========================================================================*/

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useInventario } from "../../hooks/useInventario";
import { useAuth } from "../../hooks/useAuth";
import { useCarrito } from "../../context/CarritoContext";
import { pedidoRepository } from "../../repositories";
import { RUTAS } from "../../routes/rutas";
import {
  METODOS_PAGO,
  TIPOS_ENTREGA,
  ESTADOS_PEDIDO,
} from "../../constantes";
import { formatearSoles } from "../../utils/formato";

// Componentes del Sistema de Diseño UI
import {
  Boton,
  Alerta,
  Cargando,
  EstadoVacio,
  Badge,
} from "../../components/ui";

// Componentes propios del Módulo Checkout
import ResumenItems from "./checkout/componentes/ResumenItems";
import FormularioCliente from "./checkout/componentes/FormularioCliente";
import FormularioEntrega from "./checkout/componentes/FormularioEntrega";
import FormularioPago from "./checkout/componentes/FormularioPago";
import SeguimientoPedido from "./checkout/componentes/SeguimientoPedido";

// Patrón Strategy: Obtener estrategia de pago
import { obtenerEstrategiaPago } from "./checkout/pagos";

import "./CheckoutPage.css";

const COSTO_DELIVERY_PIURA = 5.0;

/**
 * Subcomponente del formulario principal de checkout.
 * Recibe `usuario` como prop y se monta con `key={usuario?.id ?? 'anonimo'}`
 * para inicializar de forma natural los datos del cliente sin `useEffect` reactivo.
 */
function FormularioCheckoutPrincipal({
  usuario,
  estaAutenticado,
  items,
  subtotalCarrito,
  vaciarCarrito,
  onPedidoCreado,
  descontarStock,
  onCargarProductosEjemplo,
}) {
  // Datos del Cliente (prellenados desde sesión si existe)
  const [datosCliente, setDatosCliente] = useState({
    nombre: usuario?.nombre || "",
    correo: usuario?.correo || "",
    telefono: usuario?.telefono || "",
  });

  // Datos de Entrega
  const [tipoEntrega, setTipoEntrega] = useState(TIPOS_ENTREGA.RECOJO_TIENDA);
  const [datosEntrega, setDatosEntrega] = useState({
    direccion: usuario?.direccion || "",
    referencia: "",
  });

  // Datos de Pago (Patrón Strategy)
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO.YAPE);
  const [datosPago, setDatosPago] = useState({});

  // Estados de proceso y errores
  const [procesando, setProcesando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState(null);
  const [erroresCliente, setErroresCliente] = useState({});
  const [erroresEntrega, setErroresEntrega] = useState({});
  const [erroresPago, setErroresPago] = useState({});

  /* Cálculos de montos.
     El subtotal de los productos ya lo calcula el carrito (useCarrito().total),
     así que el checkout no lleva una segunda cuenta que se pueda desincronizar.
     Aquí solo se le suma el costo de envío. */
  const subtotal = subtotalCarrito;

  const costoEnvio = tipoEntrega === TIPOS_ENTREGA.DELIVERY ? COSTO_DELIVERY_PIURA : 0;
  const total = subtotal + costoEnvio;

  const handleCambioCliente = useCallback((campo, valor) => {
    setDatosCliente((prev) => ({ ...prev, [campo]: valor }));
    setErroresCliente((prev) => ({ ...prev, [campo]: undefined }));
  }, []);

  const handleCambioEntrega = useCallback((campo, valor) => {
    setDatosEntrega((prev) => ({ ...prev, [campo]: valor }));
    setErroresEntrega((prev) => ({ ...prev, [campo]: undefined }));
  }, []);

  const handleCambioDatoPago = useCallback((campo, valor) => {
    setDatosPago((prev) => ({ ...prev, [campo]: valor }));
    setErroresPago((prev) => ({ ...prev, [campo]: undefined }));
  }, []);

  const handleSeleccionarMetodoPago = useCallback((nuevoMetodo) => {
    setMetodoPago(nuevoMetodo);
    setDatosPago({});
    setErroresPago({});
  }, []);

  // Validación
  const validarFormulario = () => {
    const errCliente = {};
    const errEntrega = {};

    if (!datosCliente.nombre.trim()) {
      errCliente.nombre = "Ingresa tu nombre completo.";
    }
    if (!datosCliente.correo.trim()) {
      errCliente.correo = "Ingresa tu correo electrónico.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosCliente.correo)) {
      errCliente.correo = "Ingresa un correo electrónico válido.";
    }
    if (!datosCliente.telefono.trim()) {
      errCliente.telefono = "Ingresa tu número de teléfono.";
    } else if (!/^9\d{8}$/.test(datosCliente.telefono.replace(/\s/g, ""))) {
      errCliente.telefono = "El teléfono debe tener 9 dígitos y empezar con 9.";
    }

    if (tipoEntrega === TIPOS_ENTREGA.DELIVERY) {
      if (!datosEntrega.direccion.trim()) {
        errEntrega.direccion = "Ingresa la dirección exacta de entrega en Piura.";
      } else if (datosEntrega.direccion.trim().length < 6) {
        errEntrega.direccion = "La dirección de entrega es demasiado corta.";
      }
    }

    // Validación mediante Patrón STRATEGY
    const estrategia = obtenerEstrategiaPago(metodoPago);
    const resPago = estrategia.validar(datosPago, total);

    setErroresCliente(errCliente);
    setErroresEntrega(errEntrega);
    setErroresPago(resPago.errores);

    return (
      Object.keys(errCliente).length === 0 &&
      Object.keys(errEntrega).length === 0 &&
      resPago.valido
    );
  };

  const handleConfirmarCompra = async (e) => {
    e?.preventDefault();
    setErrorGlobal(null);

    if (items.length === 0) {
      setErrorGlobal("No hay productos en el pedido para finalizar la compra.");
      return;
    }

    if (!validarFormulario()) {
      setErrorGlobal("Por favor revisa los campos señalados antes de continuar.");
      return;
    }

    setProcesando(true);

    try {
      /* ======================================================================
       * 🎯 PATRÓN STRATEGY: Procesar cobro con la estrategia activa
       * ==================================================================== */
      const estrategia = obtenerEstrategiaPago(metodoPago);
      const resultadoPago = await estrategia.procesarPago(total, datosPago);

      /* ======================================================================
       * 🥇 LA REGLA DE ORO DEL PROYECTO
       * Descontar stock ANTES de registrar el pedido.
       * ==================================================================== */
      const itemsParaStock = items.map((it) => ({
        productoId: it.productoId ?? it.id,
        cantidad: Number(it.cantidad ?? 1),
      }));

      // Paso 1: Descontar stock atómicamente
      await descontarStock(itemsParaStock);

      // Paso 2: Crear el pedido en el repositorio con canal 'web'
      const datosNuevoPedido = {
        clienteId: usuario?.id ?? "cliente-invitado",
        clienteNombre: datosCliente.nombre.trim(),
        clienteCorreo: datosCliente.correo.trim(),
        clienteTelefono: datosCliente.telefono.trim(),
        canal: "web",
        items: items.map((it) => {
          const pId = it.productoId ?? it.id;
          const precioU = Number(it.precio ?? it.precioUnitario ?? 0);
          const c = Number(it.cantidad ?? 1);
          return {
            productoId: pId,
            nombre: it.nombre,
            cantidad: c,
            precioUnitario: precioU,
            subtotal: precioU * c,
          };
        }),
        subtotal,
        costoEnvio,
        total,
        tipoEntrega,
        direccionEntrega:
          tipoEntrega === TIPOS_ENTREGA.DELIVERY
            ? datosEntrega.direccion.trim()
            : "Recojo en tienda - Bodega El Trigal",
        referenciaEntrega: datosEntrega.referencia?.trim() || "",
        metodoPago,
        datosPago: resultadoPago,
        estado: ESTADOS_PEDIDO.PENDIENTE,
      };

      const pedidoCreado = await pedidoRepository.crear(datosNuevoPedido);

      // Paso 3: vaciar el carrito real. El contador del navbar y la página
      // /carrito se actualizan solos (Context + re-render).
      vaciarCarrito();
      onPedidoCreado(pedidoCreado);
    } catch (err) {
      console.error("[Checkout] Error en confirmación:", err);
      setErrorGlobal(err.message || "Ocurrió un error inesperado al procesar la compra.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      {/* Banner de ayuda para pruebas */}
      <div className="checkout-prueba-banner">
        <p className="checkout-prueba-banner__texto">
          🧪 <strong>Modo demostración:</strong> Prueba las 4 estrategias de pago y las opciones de entrega.
        </p>
        <Boton variante="fantasma" tamano="sm" onClick={onCargarProductosEjemplo}>
          Recargar productos de prueba
        </Boton>
      </div>

      {errorGlobal && (
        <Alerta
          variante="peligro"
          alCerrar={() => setErrorGlobal(null)}
          style={{ marginBottom: "var(--esp-6)" }}
        >
          {errorGlobal}
        </Alerta>
      )}

      <div className="checkout-layout">
        {/* Formularios */}
        <div className="checkout-columna-formulario">
          <FormularioCliente
            datos={datosCliente}
            onChange={handleCambioCliente}
            errores={erroresCliente}
            usuario={usuario}
            estaAutenticado={estaAutenticado}
          />

          <FormularioEntrega
            tipoEntrega={tipoEntrega}
            onCambiarTipo={setTipoEntrega}
            datos={datosEntrega}
            onChange={handleCambioEntrega}
            errores={erroresEntrega}
          />

          <FormularioPago
            metodoSeleccionado={metodoPago}
            onSeleccionarMetodo={handleSeleccionarMetodoPago}
            datosPago={datosPago}
            onCambiarDatoPago={handleCambioDatoPago}
            erroresPago={erroresPago}
            montoTotal={total}
          />
        </div>

        {/* Resumen lateral */}
        <aside className="checkout-columna-resumen">
          <ResumenItems
            items={items}
            tipoEntrega={tipoEntrega}
            costoEnvio={costoEnvio}
            subtotal={subtotal}
            total={total}
          />

          <Boton
            variante="primario"
            tamano="lg"
            bloque
            cargando={procesando}
            onClick={handleConfirmarCompra}
          >
            Confirmar y pagar {formatearSoles(total)}
          </Boton>

          <div className="checkout-confianza-caja">
            <div className="checkout-confianza-item">
              <span>🔒</span>
              <span>Compra segura respaldada por Bodega El Trigal</span>
            </div>
            <div className="checkout-confianza-item">
              <span>⚡</span>
              <span>Atención y despacho inmediato en Piura</span>
            </div>
            <div className="checkout-confianza-item">
              <span>🌾</span>
              <span>Productos frescos y de calidad garantizada</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export function CheckoutPage() {
  const { productosActivos, cargando: cargandoInventario, descontarStock } = useInventario();
  const { usuario, estaAutenticado, cargando: cargandoAuth } = useAuth();

  /* 🛒 FUENTE ÚNICA DEL PEDIDO
     Antes el checkout guardaba sus propios `items` en un useState local que
     solo se llenaba desde `location.state`, algo que el carrito nunca enviaba:
     por eso siempre mostraba «Tu pedido está vacío» aunque el navbar contara
     productos. Ahora lee el MISMO carrito que el navbar y /carrito. */
  const { items, agregar, vaciar, total: totalCarrito } = useCarrito();

  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  /* Los productos de demostración también entran al carrito REAL, para que no
     vuelva a existir una lista paralela dentro del checkout. */
  const cargarProductosEjemplo = useCallback(() => {
    const candidatos = productosActivos.filter((p) => Number(p.stock) > 0).slice(0, 2);
    candidatos.forEach((producto) => agregar(producto, 1));
  }, [productosActivos, agregar]);

  // Carga inicial
  if (cargandoInventario || cargandoAuth) {
    return (
      <div className="contenedor checkout-pagina">
        <Cargando pantallaCompleta texto="Cargando datos del checkout…" />
      </div>
    );
  }

  // Vista de confirmación y seguimiento (Patrón STATE)
  if (pedidoConfirmado) {
    return (
      <div className="contenedor checkout-pagina">
        <SeguimientoPedido
          pedido={pedidoConfirmado}
          onActualizarPedido={setPedidoConfirmado}
          onNuevaCompra={() => {
            setPedidoConfirmado(null);
            cargarProductosEjemplo();
          }}
        />
      </div>
    );
  }

  // Estado vacío: sin productos
  if (items.length === 0) {
    return (
      <div className="contenedor checkout-pagina">
        <EstadoVacio
          icono="🛒"
          titulo="Tu pedido está vacío"
          descripcion="No tienes productos agregados para realizar el checkout. Elige productos de nuestra bodega para continuar."
          accion={
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--esp-3)", alignItems: "center" }}>
              <Boton como={Link} to={RUTAS.INICIO} variante="primario">
                Ver catálogo de la bodega
              </Boton>
              {productosActivos.length > 0 && (
                <Boton variante="contorno" onClick={cargarProductosEjemplo}>
                  Probar checkout con productos de ejemplo
                </Boton>
              )}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="contenedor checkout-pagina">
      <header className="checkout-cabecera">
        <Link to={RUTAS.CARRITO} className="checkout-cabecera__volver">
          ← Volver al carrito
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--esp-2)", flexWrap: "wrap" }}>
          <h1 className="checkout-cabecera__titulo">Finalizar compra</h1>
          <Badge variante="marca" tamano="sm">Tienda Web</Badge>
        </div>
        <p className="checkout-cabecera__subtitulo">
          Completa tus datos de entrega y realiza el pago seguro para procesar tu pedido.
        </p>
      </header>

      <FormularioCheckoutPrincipal
        key={usuario?.id ?? "invitado"}
        usuario={usuario}
        estaAutenticado={estaAutenticado}
        items={items}
        subtotalCarrito={totalCarrito}
        vaciarCarrito={vaciar}
        onPedidoCreado={setPedidoConfirmado}
        descontarStock={descontarStock}
        onCargarProductosEjemplo={cargarProductosEjemplo}
      />
    </div>
  );
}

export default CheckoutPage;
