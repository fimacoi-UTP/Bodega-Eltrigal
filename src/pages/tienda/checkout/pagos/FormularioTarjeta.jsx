import { Input } from "../../../../components/ui";

function formatearNumeroTarjeta(valor) {
  const soloDigitos = valor.replace(/\D/g, "").slice(0, 16);
  const partes = [];
  for (let i = 0; i < soloDigitos.length; i += 4) {
    partes.push(soloDigitos.substring(i, i + 4));
  }
  return partes.join(" ");
}

function formatearExpiracion(valor) {
  const soloDigitos = valor.replace(/\D/g, "").slice(0, 4);
  if (soloDigitos.length >= 3) {
    return `${soloDigitos.slice(0, 2)}/${soloDigitos.slice(2, 4)}`;
  }
  return soloDigitos;
}

export function FormularioTarjeta({ datos, onChange, errores }) {
  return (
    <div className="checkout-pago-estrategia">
      <div className="checkout-pago-instrucciones">
        <p className="checkout-pago-instrucciones__texto">
          Aceptamos todas las tarjetas de crédito y débito (Visa, Mastercard, American Express).
        </p>
        <div className="checkout-pago-tarjetas-iconos" aria-label="Tarjetas aceptadas">
          <span className="checkout-tarjeta-chip">💳 Visa</span>
          <span className="checkout-tarjeta-chip">💳 Mastercard</span>
          <span className="checkout-tarjeta-chip">💳 Diners</span>
        </div>
      </div>

      <div className="checkout-formulario-rejilla">
        <Input
          etiqueta="Número de tarjeta"
          id="tarjeta-numero"
          type="text"
          placeholder="4557 0000 0000 0000"
          requerido
          maxLength={19}
          value={datos.numeroTarjeta ?? ""}
          onChange={(e) => {
            const formateado = formatearNumeroTarjeta(e.target.value);
            onChange("numeroTarjeta", formateado);
          }}
          error={errores.numeroTarjeta}
          ayuda="16 dígitos de tu tarjeta"
        />

        <Input
          etiqueta="Nombre del titular"
          id="tarjeta-titular"
          type="text"
          placeholder="Como figura en la tarjeta"
          requerido
          value={datos.nombreTitular ?? ""}
          onChange={(e) => onChange("nombreTitular", e.target.value.toUpperCase())}
          error={errores.nombreTitular}
        />

        <div className="checkout-formulario-fila-doble">
          <Input
            etiqueta="Vencimiento"
            id="tarjeta-expiracion"
            type="text"
            placeholder="MM/AA"
            maxLength={5}
            requerido
            value={datos.expiracion ?? ""}
            onChange={(e) => {
              const exp = formatearExpiracion(e.target.value);
              onChange("expiracion", exp);
            }}
            error={errores.expiracion}
            ayuda="Ej: 08/28"
          />

          <Input
            etiqueta="CVV"
            id="tarjeta-cvv"
            type="password"
            placeholder="123"
            maxLength={4}
            requerido
            value={datos.cvv ?? ""}
            onChange={(e) => {
              const soloDig = e.target.value.replace(/\D/g, "").slice(0, 4);
              onChange("cvv", soloDig);
            }}
            error={errores.cvv}
            ayuda="3 o 4 dígitos al reverso"
          />
        </div>
      </div>
    </div>
  );
}

export default FormularioTarjeta;
