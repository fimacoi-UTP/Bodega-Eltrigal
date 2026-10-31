import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { aRuta, RUTAS } from "../../../routes/rutas";
import { ESTADOS_PEDIDO } from "../../../constantes";
import { formatearSoles, formatearFecha } from "../../../utils/formato";
import { urlImagen } from "../../../api/apiClient";
import { useInventario } from "../../../hooks/useInventario";
import { Card, CardCuerpo, Badge, Boton, Cargando, Alerta, EstadoVacio } from "../../../components/ui";
import "./MisPedidosPage.css";

const VARIANTES_ESTADO = {
  [ESTADOS_PEDIDO.PENDIENTE]: "advertencia",
  [ESTADOS_PEDIDO.CONFIRMADO]: "advertencia",
  [ESTADOS_PEDIDO.EN_CAMINO]: "advertencia",
  [ESTADOS_PEDIDO.ENTREGADO]: "exito",
  [ESTADOS_PEDIDO.CANCELADO]: "peligro",
};

const ETIQUETAS_ESTADO = {
  [ESTADOS_PEDIDO.PENDIENTE]: "Pendiente",
  [ESTADOS_PEDIDO.CONFIRMADO]: "Confirmado",
  [ESTADOS_PEDIDO.EN_CAMINO]: "En camino",
  [ESTADOS_PEDIDO.ENTREGADO]: "Entregado",
  [ESTADOS_PEDIDO.CANCELADO]: "Cancelado",
};

/**
 * MiniaturaPedido · Muestra la foto cuadrada del primer producto
 * o cae suavemente a un placeholder cálido tintado en trigo.
 */
function MiniaturaPedido({ imagen, alt }) {
  const [errorCarga, setErrorCarga] = useState(false);

  if (imagen && !errorCarga) {
    return (
      <div className="mis-pedidos-miniatura-caja">
        <img
          src={urlImagen(imagen)}
          alt={alt || "Producto del pedido"}
          className="mis-pedidos-miniatura-img"
          onError={() => setErrorCarga(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="mis-pedidos-miniatura-caja mis-pedidos-miniatura-placeholder" aria-hidden="true">
      <span className="mis-pedidos-miniatura-icono">🛍️</span>
    </div>
  );
}

/**
 * ============================================================================
 * MisPedidosPage · Historial de pedidos del cliente autenticado
 * ----------------------------------------------------------------------------
 * Consume los pedidos provistos por LayoutMiCuenta (useOutletContext) y
 * presenta la tira de resumen y tarjetas con miniatura, estado y seguimiento.
 * ==========================================================================*/
export function MisPedidosPage() {
  const contexto = useOutletContext() || {};
  const {
    pedidos = [],
    cargandoPedidos = false,
    errorPedidos = null,
  } = contexto;

  const { obtenerProducto } = useInventario();

  // Resumen de pedidos del cliente para los 3 tiles
  const resumen = useMemo(() => {
    const total = pedidos.length;
    const enCamino = pedidos.filter((p) =>
      [ESTADOS_PEDIDO.PENDIENTE, ESTADOS_PEDIDO.CONFIRMADO, ESTADOS_PEDIDO.EN_CAMINO].includes(p.estado),
    ).length;
    const entregados = pedidos.filter((p) => p.estado === ESTADOS_PEDIDO.ENTREGADO).length;

    return { total, enCamino, entregados };
  }, [pedidos]);

  if (cargandoPedidos) {
    return <Cargando texto="Cargando tus pedidos..." />;
  }

  if (errorPedidos) {
    return (
      <Alerta variante="peligro" titulo="Error al cargar pedidos">
        {errorPedidos}
      </Alerta>
    );
  }

  return (
    <div className="mis-pedidos-seccion">
      {/* Tira de resumen de pedidos (3 tiles estilo casero premium) */}
      <div className="mis-pedidos-resumen">
        <div className="mis-pedidos-tile">
          <div className="mis-pedidos-tile__top">
            <span className="mis-pedidos-tile__numero serif">{resumen.total}</span>
            <span
              className="mis-pedidos-tile__icono mis-pedidos-tile__icono--terracota"
              aria-hidden="true"
            >
              📦
            </span>
          </div>
          <div className="mis-pedidos-tile__etiqueta-fila">
            <span className="mis-pedidos-tile__etiqueta">Pedidos</span>
          </div>
        </div>

        <div className="mis-pedidos-tile">
          <div className="mis-pedidos-tile__top">
            <span className="mis-pedidos-tile__numero serif">{resumen.enCamino}</span>
            <span
              className="mis-pedidos-tile__icono mis-pedidos-tile__icono--oro"
              aria-hidden="true"
            >
              🚚
            </span>
          </div>
          <div className="mis-pedidos-tile__etiqueta-fila">
            <span className="mis-pedidos-tile__etiqueta">En camino</span>
          </div>
        </div>

        <div className="mis-pedidos-tile">
          <div className="mis-pedidos-tile__top">
            <span className="mis-pedidos-tile__numero serif">{resumen.entregados}</span>
            <span
              className="mis-pedidos-tile__icono mis-pedidos-tile__icono--verde"
              aria-hidden="true"
            >
              ✅
            </span>
          </div>
          <div className="mis-pedidos-tile__etiqueta-fila">
            <span className="mis-pedidos-tile__etiqueta">Entregados</span>
          </div>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <Card className="mis-pedidos-vacio-card">
          <CardCuerpo>
            <EstadoVacio
              icono="📦"
              titulo="Aún no tienes pedidos"
              descripcion="Cuando realices compras en nuestra tienda, podrás verlas aquí y hacerles seguimiento en tiempo real."
              accion={
                <Boton como={Link} to={RUTAS.INICIO} variante="primario">
                  Ir al catálogo
                </Boton>
              }
            />
          </CardCuerpo>
        </Card>
      ) : (
        <>
          <div className="mis-pedidos-cabecera">
            <h2 className="mis-pedidos-titulo serif">Mis Pedidos</h2>
            <span className="mis-pedidos-total-contador">
              {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>

          <div className="mis-pedidos-lista">
            {pedidos.map((pedido) => {
              const fechaFormateada = formatearFecha(pedido.fechaCreacion || pedido.fecha, {
                conHora: true,
              });
              const estadoEtiqueta = ETIQUETAS_ESTADO[pedido.estado] || pedido.estado;
              const estadoVariante = VARIANTES_ESTADO[pedido.estado] || "advertencia";

              const primerItem = pedido.items?.[0];
              const productoCatalogo = primerItem?.productoId ? obtenerProducto(primerItem.productoId) : null;
              const imagenProducto =
                pedido.imagenPrimerProducto ||
                primerItem?.imagen ||
                productoCatalogo?.imagen ||
                null;
              const nombreProducto = primerItem?.nombre || productoCatalogo?.nombre || "Producto del pedido";

              return (
                <Card key={pedido.id || pedido.codigo} className="mis-pedidos-card">
                  <CardCuerpo>
                    <div className="mis-pedidos-fila">
                      <div className="mis-pedidos-bloque-izq">
                        <MiniaturaPedido imagen={imagenProducto} alt={nombreProducto} />

                        <div className="mis-pedidos-info-principal">
                          <div className="mis-pedidos-codigo-linea">
                            <strong className="mis-pedidos-codigo serif">
                              Pedido #{pedido.codigo || pedido.id}
                            </strong>
                            <Badge variante={estadoVariante} punto tamano="sm">
                              {estadoEtiqueta}
                            </Badge>
                          </div>
                          <p className="mis-pedidos-fecha">{fechaFormateada}</p>
                          <span className="mis-pedidos-entrega">
                            {pedido.tipoEntrega === "RECOJO_TIENDA" ? "Recojo en tienda" : "Delivery a domicilio"}
                            {pedido.items?.length > 0 &&
                              ` · ${pedido.items.length} ${pedido.items.length === 1 ? "producto" : "productos"}`}
                          </span>
                        </div>
                      </div>

                      <div className="mis-pedidos-acciones">
                        <div className="mis-pedidos-monto-bloque">
                          <span className="mis-pedidos-monto-label">Total</span>
                          <strong className="mis-pedidos-monto serif">
                            {formatearSoles(pedido.total)}
                          </strong>
                        </div>

                        <Boton
                          como={Link}
                          to={aRuta.seguimiento(pedido.codigo || pedido.id)}
                          variante="secundario"
                          tamano="sm"
                        >
                          Ver seguimiento
                        </Boton>
                      </div>
                    </div>
                  </CardCuerpo>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default MisPedidosPage;
