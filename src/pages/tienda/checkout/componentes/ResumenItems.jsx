import { Card, CardCabecera, CardCuerpo, Badge } from "../../../../components/ui";
import { formatearSoles } from "../../../../utils/formato";
import { TIPOS_ENTREGA } from "../../../../constantes";

export function ResumenItems({ items, tipoEntrega, costoEnvio, total, subtotal }) {
  const esDelivery = tipoEntrega === TIPOS_ENTREGA.DELIVERY;

  return (
    <Card className="checkout-resumen-card">
      <CardCabecera
        titulo="Resumen del pedido"
        subtitulo={`${items.length} ${items.length === 1 ? "producto" : "productos"}`}
      />
      <CardCuerpo>
        <ul className="checkout-items-lista" aria-label="Productos en el pedido">
          {items.map((item) => {
            const id = item.productoId ?? item.id;
            const precio = Number(item.precio ?? item.precioUnitario ?? 0);
            const cant = Number(item.cantidad ?? 1);
            const sub = Number(item.subtotal ?? precio * cant);

            return (
              <li key={id} className="checkout-item-fila">
                <div
                  className="checkout-item-avatar"
                  style={{ backgroundColor: item.color || "var(--ladrillo-100)" }}
                  aria-hidden="true"
                >
                  {item.imagen ? (
                    <img src={item.imagen} alt="" className="checkout-item-img" />
                  ) : (
                    <span>🛒</span>
                  )}
                </div>

                <div className="checkout-item-info">
                  <span className="checkout-item-nombre">{item.nombre}</span>
                  <div className="checkout-item-detalles">
                    <span className="checkout-item-cantidad">Cant: {cant}</span>
                    <span className="checkout-item-unitario">x {formatearSoles(precio)}</span>
                  </div>
                </div>

                <div className="checkout-item-precio">
                  <strong>{formatearSoles(sub)}</strong>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="checkout-desglose">
          <div className="checkout-desglose-linea">
            <span>Subtotal de productos</span>
            <span>{formatearSoles(subtotal)}</span>
          </div>

          <div className="checkout-desglose-linea">
            <span>
              Entrega ({esDelivery ? "Delivery Piura" : "Recojo en tienda"})
            </span>
            <span>
              {costoEnvio === 0 ? (
                <Badge variante="exito" tamano="sm">Gratis</Badge>
              ) : (
                formatearSoles(costoEnvio)
              )}
            </span>
          </div>

          <div className="checkout-desglose-total">
            <span>Total a pagar</span>
            <span className="checkout-total-monto">{formatearSoles(total)}</span>
          </div>
        </div>
      </CardCuerpo>
    </Card>
  );
}

export default ResumenItems;
