import { Input } from "../../../../components/ui";
import { formatearSoles } from "../../../../utils/formato";

export function FormularioEfectivo({ datos, onChange, errores, monto = 0 }) {
  const montoExacto = Boolean(datos.montoExacto);
  const pagaConNum = Number(datos.pagaCon ?? 0);
  const vuelto = !montoExacto && pagaConNum > monto ? pagaConNum - monto : 0;

  return (
    <div className="checkout-pago-estrategia">
      <div className="checkout-pago-instrucciones">
        <p className="checkout-pago-instrucciones__texto">
          Pagas en efectivo al momento de la entrega o al retirar en tienda.
        </p>
        <p className="checkout-pago-instrucciones__nota">
          Total a pagar: <strong>{formatearSoles(monto)}</strong>. Avísanos con cuánto pagarás para llevarte el vuelto exacto.
        </p>
      </div>

      <div className="checkout-efectivo-opciones">
        <label className="checkout-checkbox-label">
          <input
            type="checkbox"
            checked={montoExacto}
            onChange={(e) => {
              const marcado = e.target.checked;
              onChange("montoExacto", marcado);
              if (marcado) {
                onChange("pagaCon", monto);
              }
            }}
          />
          <span>Pagaré con el monto exacto ({formatearSoles(monto)})</span>
        </label>
      </div>

      {!montoExacto && (
        <div className="checkout-formulario-rejilla">
          <Input
            etiqueta="¿Con cuánto dinero pagarás?"
            id="efectivo-pagacon"
            type="number"
            step="0.10"
            min={monto}
            prefijo="S/"
            placeholder={String(Math.ceil(monto / 10) * 10 || 50)}
            requerido={!montoExacto}
            value={datos.pagaCon ?? ""}
            onChange={(e) => onChange("pagaCon", e.target.value)}
            error={errores.pagaCon}
            ayuda={`Monto mínimo requerido: ${formatearSoles(monto)}`}
          />

          {pagaConNum >= monto && (
            <div className="checkout-efectivo-vuelto-caja">
              <span className="checkout-efectivo-vuelto-etiqueta">Tu vuelto será de:</span>
              <span className="checkout-efectivo-vuelto-monto">{formatearSoles(vuelto)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FormularioEfectivo;
