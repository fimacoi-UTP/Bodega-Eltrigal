import { Card, CardCabecera, CardCuerpo, Input, Badge } from "../../../../components/ui";
import { TIPOS_ENTREGA, BODEGA } from "../../../../constantes";

export function FormularioEntrega({ tipoEntrega, onCambiarTipo, datos, onChange, errores }) {
  const esDelivery = tipoEntrega === TIPOS_ENTREGA.DELIVERY;

  return (
    <Card className="checkout-seccion-card">
      <CardCabecera
        titulo="2. Método de entrega"
        subtitulo="Elige cómo deseas recibir tu compra."
      />
      <CardCuerpo>
        <div className="checkout-entrega-selector" role="radiogroup" aria-label="Tipo de entrega">
          <button
            type="button"
            role="radio"
            aria-checked={!esDelivery}
            className={`checkout-entrega-opcion ${!esDelivery ? "checkout-entrega-opcion--activa" : ""}`}
            onClick={() => onCambiarTipo(TIPOS_ENTREGA.RECOJO_TIENDA)}
          >
            <div className="checkout-entrega-opcion__cabecera">
              <span className="checkout-entrega-opcion__icono">🏪</span>
              <span className="checkout-entrega-opcion__titulo">Recojo en tienda</span>
              <Badge variante="exito" tamano="sm">Gratis</Badge>
            </div>
            <p className="checkout-entrega-opcion__desc">
              Retira directamente en el mostrador de nuestra bodega.
            </p>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={esDelivery}
            className={`checkout-entrega-opcion ${esDelivery ? "checkout-entrega-opcion--activa" : ""}`}
            onClick={() => onCambiarTipo(TIPOS_ENTREGA.DELIVERY)}
          >
            <div className="checkout-entrega-opcion__cabecera">
              <span className="checkout-entrega-opcion__icono">🛵</span>
              <span className="checkout-entrega-opcion__titulo">Delivery a domicilio</span>
              <Badge variante="marca" tamano="sm">+ S/ 5.00</Badge>
            </div>
            <p className="checkout-entrega-opcion__desc">
              Envío directo en moto a cualquier zona de Piura y Castilla.
            </p>
          </button>
        </div>

        {!esDelivery ? (
          <div className="checkout-recojo-info">
            <div className="checkout-recojo-linea">
              <span className="checkout-recojo-icono" aria-hidden="true">📍</span>
              <div>
                <strong>Dirección de recojo:</strong>
                <p>{BODEGA.direccion}, {BODEGA.ciudad}</p>
              </div>
            </div>
            <div className="checkout-recojo-linea">
              <span className="checkout-recojo-icono" aria-hidden="true">🕒</span>
              <div>
                <strong>Horario de atención:</strong>
                <p>{BODEGA.horario}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="checkout-delivery-campos">
            <Input
              etiqueta="Dirección de entrega"
              id="entrega-direccion"
              type="text"
              placeholder="Ej: Av. Grau 520, Urb. Santa Isabel, Piura"
              requerido
              value={datos.direccion ?? ""}
              onChange={(e) => onChange("direccion", e.target.value)}
              error={errores.direccion}
              ayuda="Calle, número, departamento o manzana/lote"
            />

            <Input
              etiqueta="Referencia de ubicación"
              id="entrega-referencia"
              type="text"
              placeholder="Ej: Frente al parque, rejas negras, casa de 2 pisos"
              value={datos.referencia ?? ""}
              onChange={(e) => onChange("referencia", e.target.value)}
              error={errores.referencia}
              ayuda="Ayuda al repartidor a ubicarte más rápido"
            />
          </div>
        )}
      </CardCuerpo>
    </Card>
  );
}

export default FormularioEntrega;
