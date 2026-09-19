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

export function ResumenPage() {
  const { productos } = useInventario();

  const [cargando, setCargando] = useState(true);
  const [ventasHoy, setVentasHoy] = useState([]);
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [ventas, pedidos, bajoStock] = await Promise.all([
          ventaRepository.obtenerDeHoy(),
          pedidoRepository.obtenerActivos(),
          productoRepository.obtenerBajoStock(),
        ]);

        setVentasHoy(ventas);
        setPedidosPendientes(pedidos.filter(p => p.estado === "PENDIENTE"));
        setProductosBajoStock(bajoStock);

        // Calcular productos más vendidos (ventas + pedidos)
        const ventasItems = ventas.flatMap(v => v.items);
        const pedidosItems = pedidos.flatMap(p => p.items || []);
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

  // Total de ventas en mostrador (tienda física)
  const totalVentasMostrador = ventasHoy
    .filter((v) => !v.anulada)
    .reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  // Total de pedidos realizados en la tienda web
  const totalPedidosWeb = pedidosPendientes
    .reduce((sum, p) => sum + (Number(p.total) || 0), 0);

  // Suma combinada de ambos canales
  const totalVentasHoy = totalVentasMostrador + totalPedidosWeb;

  const cantidadVentasHoy =
    ventasHoy.filter((v) => !v.anulada).length + pedidosPendientes.length;

  if (cargando) {
    return <Cargando texto="Cargando estadísticas..." />;
  }

  return (
    <div className="resumen-page">
      <h1 className="resumen-page__titulo">Resumen del día</h1>

      {/* Indicadores clave */}
      <div className="resumen-page__indicadores">
        <Card className="resumen-page__indicador">
          <CardCuerpo>
            <div className="resumen-page__indicador-valor">{cantidadVentasHoy}</div>
            <div className="resumen-page__indicador-etiqueta">Ventas hoy</div>
          </CardCuerpo>
        </Card>

        <Card className="resumen-page__indicador">
          <CardCuerpo>
            <div className="resumen-page__indicador-valor">{formatearSoles(totalVentasHoy)}</div>
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
                    <Badge variante="advertencia">Pendiente</Badge>
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
