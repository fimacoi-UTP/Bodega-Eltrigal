/**
 * ============================================================================
 * RESUMEN · Panel de estadísticas del dashboard
 * ============================================================================
 * Ruta: /dashboard · Acceso: ADMIN y CAJERO
 *
 * Es la primera pantalla que ve el personal al entrar. Muestra indicadores
 * clave del día: ventas, stock bajo, pedidos pendientes y productos más vendidos.
 * ==========================================================================*/

import { useState, useEffect } from "react";
import { useInventario } from "../../hooks/useInventario";
import { ventaRepository, pedidoRepository, productoRepository } from "../../repositories";
import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO } from "../../constantes";
import { formatearSoles, formatearFecha } from "../../utils/formato";
import {
  Card,
  CardCabecera,
  CardCuerpo,
  Badge,
  Cargando,
  EstadoVacio,
} from "../../components/ui";
import "./ResumenPage.css";

const VARIANTES_ESTADO_PEDIDO = {
  [ESTADOS_PEDIDO.PENDIENTE]: "advertencia",
  [ESTADOS_PEDIDO.CONFIRMADO]: "info",
  [ESTADOS_PEDIDO.EN_CAMINO]: "marca",
  [ESTADOS_PEDIDO.ENTREGADO]: "exito",
  [ESTADOS_PEDIDO.CANCELADO]: "peligro",
};

export function ResumenPage() {
  const { productos } = useInventario();

  const [cargando, setCargando] = useState(true);
  const [ventasHoy, setVentasHoy] = useState([]);
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  // Pedidos web del día, sin contar los cancelados. Es un estado aparte de
  // `pedidosActivos` porque "activos" excluye ENTREGADO (y no queremos que un
  // pedido ya entregado HOY deje de contar como una venta web de hoy).
  const [pedidosWebHoy, setPedidosWebHoy] = useState([]);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [ventas, pedidosActivos, bajoStock, todosLosPedidos] = await Promise.all([
          ventaRepository.obtenerDeHoy(),
          pedidoRepository.obtenerActivos(),
          productoRepository.obtenerBajoStock(),
          // pedidoRepository no tiene un obtenerDeHoy() propio (solo ventaRepository
          // lo tiene). Traemos todos los pedidos y filtramos el día aquí mismo, con
          // el mismo criterio de rango horario que usa ventaRepository.obtenerDeHoy().
          pedidoRepository.obtenerTodos(),
        ]);

        setVentasHoy(ventas);
        setPedidosPendientes(pedidosActivos.filter(p => p.estado === "PENDIENTE"));
        setProductosBajoStock(bajoStock);

        // Ventas web de HOY: fecha de hoy y que no esté cancelado. A propósito NO
        // reutilizamos `pedidosActivos` (obtenerActivos() excluye ENTREGADO además
        // de CANCELADO), porque un pedido ya entregado hoy sigue siendo una venta
        // de hoy para efectos de este indicador.
        const inicioDelDia = new Date();
        inicioDelDia.setHours(0, 0, 0, 0);
        const finDelDia = new Date();
        finDelDia.setHours(23, 59, 59, 999);

        const pedidosDeHoy = todosLosPedidos.filter((p) => {
          const momento = new Date(p.fecha).getTime();
          return momento >= inicioDelDia.getTime() && momento <= finDelDia.getTime();
        });
        setPedidosWebHoy(pedidosDeHoy.filter((p) => p.estado !== ESTADOS_PEDIDO.CANCELADO));

        // Calcular productos más vendidos (ventas + pedidos)
        const ventasItems = ventas.flatMap(v => v.items);
        const pedidosItems = pedidosActivos.flatMap(p => p.items || []);
        const todosLosItems = [...ventasItems, ...pedidosItems];

        const ventasPorProducto = todosLosItems.reduce((acc, item) => {
          acc[item.productoId] = (acc[item.productoId] || 0) + item.cantidad;
          return acc;
        }, {});

        const ranking = Object.entries(ventasPorProducto)
          .map(([productoId, cantidad]) => ({
            productoId,
            cantidad,
            producto: productos.find(p => p.id === productoId),
          }))
          .filter(item => item.producto)
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5);

        setProductosMasVendidos(ranking);
      } catch (err) {
        console.error("Error al cargar datos del resumen:", err);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [productos]);

  // --- Canal TIENDA (mostrador) ---
  const ventasTiendaValidas = ventasHoy.filter((v) => !v.anulada);
  const cantidadVentasTienda = ventasTiendaValidas.length;
  const totalVentasTienda = ventasTiendaValidas.reduce((sum, v) => sum + v.total, 0);

  // --- Canal WEB (pedidos del catálogo online) ---
  const cantidadVentasWeb = pedidosWebHoy.length;
  const totalVentasWeb = pedidosWebHoy.reduce((sum, p) => sum + (p.total || 0), 0);

  // --- Combinado: lo que de verdad entró a la bodega hoy, sin importar el canal ---
  const totalVendidoHoy = totalVentasTienda + totalVentasWeb;

  if (cargando) {
    return <Cargando texto="Cargando estadísticas..." />;
  }

  return (
    <div className="resumen-page">
      <h1 className="resumen-page__titulo">Resumen del día</h1>

      {/* Indicadores clave */}
      <div className="resumen-page__indicadores">
        {/* Desglose por canal: la bodega necesita saber cuánto vino del mostrador
            y cuánto de la tienda web, no solo el total mezclado. */}
        <Card className="resumen-page__indicador">
          <CardCuerpo>
            <div className="resumen-page__indicador-valor">{cantidadVentasTienda}</div>
            <div className="resumen-page__indicador-monto">{formatearSoles(totalVentasTienda)}</div>
            <div className="resumen-page__indicador-etiqueta">Ventas en tienda</div>
          </CardCuerpo>
        </Card>

        <Card className="resumen-page__indicador">
          <CardCuerpo>
            <div className="resumen-page__indicador-valor">{cantidadVentasWeb}</div>
            <div className="resumen-page__indicador-monto">{formatearSoles(totalVentasWeb)}</div>
            <div className="resumen-page__indicador-etiqueta">Ventas web</div>
          </CardCuerpo>
        </Card>

        <Card className="resumen-page__indicador">
          <CardCuerpo>
            <div className="resumen-page__indicador-valor">{formatearSoles(totalVendidoHoy)}</div>
            <div className="resumen-page__indicador-etiqueta">Total vendido</div>
          </CardCuerpo>
        </Card>

        <Card className="resumen-page__indicador">
          <CardCuerpo>
            <div className="resumen-page__indicador-valor">{pedidosPendientes.length}</div>
            <div className="resumen-page__indicador-etiqueta">Pedidos pendientes</div>
          </CardCuerpo>
        </Card>

        <Card className="resumen-page__indicador">
          <CardCuerpo>
            <div className="resumen-page__indicador-valor">{productosBajoStock.length}</div>
            <div className="resumen-page__indicador-etiqueta">Productos bajo stock</div>
          </CardCuerpo>
        </Card>
      </div>

      <div className="resumen-page__grid">
        {/* Alertas de stock bajo */}
        <Card>
          <CardCabecera>
            <h2>Alertas de reposición</h2>
          </CardCabecera>
          <CardCuerpo>
            {productosBajoStock.length === 0 ? (
              <EstadoVacio icono="✅" titulo="Todo en orden" descripcion="No hay productos con stock bajo" />
            ) : (
              <div className="resumen-page__lista">
                {productosBajoStock.map((producto) => (
                  <div key={producto.id} className="resumen-page__item">
                    <div className="resumen-page__item-info">
                      <span className="resumen-page__item-nombre">{producto.nombre}</span>
                      <span className="resumen-page__item-sub">{producto.categoria}</span>
                    </div>
                    <Badge variante="peligro">
                      Stock: {producto.stock} (mín: {producto.stockMinimo})
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardCuerpo>
        </Card>

        {/* Productos más vendidos */}
        <Card>
          <CardCabecera>
            <h2>Productos más vendidos</h2>
          </CardCabecera>
          <CardCuerpo>
            {productosMasVendidos.length === 0 ? (
              <EstadoVacio icono="📊" titulo="Sin datos" descripcion="Aún no hay ventas registradas" />
            ) : (
              <div className="resumen-page__lista">
                {productosMasVendidos.map((item, index) => (
                  <div key={item.productoId} className="resumen-page__item">
                    <div className="resumen-page__item-rank">#{index + 1}</div>
                    <div className="resumen-page__item-info">
                      <span className="resumen-page__item-nombre">{item.producto.nombre}</span>
                      <span className="resumen-page__item-sub">{item.producto.categoria}</span>
                    </div>
                    <Badge variante="marca">{item.cantidad} vendidos</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardCuerpo>
        </Card>

        {/* Últimos pedidos web */}
        <Card>
          <CardCabecera>
            <h2>Últimos pedidos web</h2>
          </CardCabecera>
          <CardCuerpo>
            {pedidosPendientes.length === 0 ? (
              <EstadoVacio icono="📦" titulo="Sin pedidos pendientes" />
            ) : (
              <div className="resumen-page__lista">
                {pedidosPendientes.slice(0, 5).map((pedido) => (
                  <div key={pedido.id} className="resumen-page__item">
                    <div className="resumen-page__item-info">
                      <span className="resumen-page__item-nombre">Pedido #{pedido.id.slice(-6)}</span>
                      <span className="resumen-page__item-sub">{formatearFecha(pedido.fecha, { conHora: true })}</span>
                    </div>
                    <Badge variante={VARIANTES_ESTADO_PEDIDO[pedido.estado] || "neutro"}>
                      {ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardCuerpo>
        </Card>
      </div>
    </div>
  );
}

export default ResumenPage;
