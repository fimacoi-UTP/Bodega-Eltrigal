import { useState } from "react";
import { Card, CardCabecera, CardCuerpo, Badge } from "../../../../components/ui";
import { formatearSoles, obtenerIniciales } from "../../../../utils/formato";
import { urlImagen } from "../../../../api/apiClient";
import { TIPOS_ENTREGA } from "../../../../constantes";

const ICONO_POR_CATEGORIA = {
  Abarrotes: "🍚",
  Bebidas: "🥤",
  Lácteos: "🥛",
  Snacks: "🍪",
  Limpieza: "🧼",
  "Cuidado Personal": "🧴",
  Mascotas: "🐾",
  Gas: "⛽",
  Golosinas: "🍬",
  Panadería: "🥖",
};

function FilaResumenItem({ item }) {
  const [errorImg, setErrorImg] = useState(false);

  const precio = Number(item.precio ?? item.precioUnitario ?? 0);
  const cant = Number(item.cantidad ?? 1);
  const sub = Number(item.subtotal ?? precio * cant);
  const mostrarImagen = Boolean(item.imagen) && !errorImg;
  const iconoCat = ICONO_POR_CATEGORIA[item.categoria] || "🌾";
  const iniciales = obtenerIniciales(item.nombre || "ET");

  return (
    <li className="checkout-item-fila">
      <div className="checkout-item-avatar" aria-hidden="true">
        {mostrarImagen ? (
          <img
            src={urlImagen(item.imagen)}
            alt=""
            className="checkout-item-img"
            loading="lazy"
            decoding="async"
            onError={() => setErrorImg(true)}
          />
        ) : (
          <span className="checkout-item-fallback">
            <span className="checkout-item-fallback__icono">{iconoCat}</span>
            <span className="checkout-item-fallback__ini serif">{iniciales}</span>
          </span>
        )}
        <span className="checkout-item-badge-cant numero">{cant}</span>
      </div>

      <div className="checkout-item-info">
        <span className="checkout-item-nombre">{item.nombre}</span>
        <div className="checkout-item-detalles numero">
          <span className="checkout-item-cantidad">Cant: {cant}</span>
          <span aria-hidden="true">·</span>
          <span className="checkout-item-unitario">{formatearSoles(precio)} c/u</span>
        </div>
      </div>

      <div className="checkout-item-precio numero">
        <strong>{formatearSoles(sub)}</strong>
      </div>
    </li>
  );
}

export function ResumenItems({ items, tipoEntrega, costoEnvio, total, subtotal }) {
  const esDelivery = tipoEntrega === TIPOS_ENTREGA.DELIVERY;
  const totalUnidades = items.reduce(
    (acc, it) => acc + (Number(it.cantidad) || 1),
    0,
  );

  return (
    <Card className="checkout-resumen-card">
      <CardCabecera
        titulo="Resumen del pedido"
        subtitulo={`${items.length} ${items.length === 1 ? "producto" : "productos"} · ${totalUnidades} ${totalUnidades === 1 ? "unidad" : "unidades"}`}
      />
      <CardCuerpo>
        <ul className="checkout-items-lista" aria-label="Productos en el pedido">
          {items.map((item) => {
            const id = item.productoId ?? item.id;
            return <FilaResumenItem key={id} item={item} />;
          })}
        </ul>

        <div className="checkout-desglose">
          <div className="checkout-desglose-linea">
            <span>Subtotal de productos</span>
            <span className="numero">{formatearSoles(subtotal)}</span>
          </div>

          <div className="checkout-desglose-linea">
            <span>
              Entrega ({esDelivery ? "Delivery Piura" : "Recojo en tienda"})
            </span>
            <span className="numero">
              {costoEnvio === 0 ? (
                <Badge variante="exito" tamano="sm">Gratis</Badge>
              ) : (
                `+ ${formatearSoles(costoEnvio)}`
              )}
            </span>
          </div>

          <div className="checkout-desglose-total">
            <div className="checkout-desglose-total__textos">
              <span>Total a pagar</span>
              <small>Incluye IGV</small>
            </div>
            <span className="checkout-total-monto serif numero">
              {formatearSoles(total)}
            </span>
          </div>
        </div>
      </CardCuerpo>
    </Card>
  );
}

export default ResumenItems;
