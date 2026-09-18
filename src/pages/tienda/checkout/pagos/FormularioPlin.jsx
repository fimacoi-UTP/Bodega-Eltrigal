import { Input, Select } from "../../../../components/ui";
import { BODEGA } from "../../../../constantes";

const BANCOS_PLIN = ["BBVA", "Interbank", "Scotiabank", "BanBif"];

export function FormularioPlin({ datos, onChange, errores }) {
  return (
    <div className="checkout-pago-estrategia">
      <div className="checkout-pago-instrucciones">
        <p className="checkout-pago-instrucciones__texto">
          Transfiere el monto total por Plin al número de la bodega:
        </p>
        <div className="checkout-pago-instrucciones__caja">
          <span className="checkout-pago-instrucciones__numero">{BODEGA.telefono}</span>
          <span className="checkout-pago-instrucciones__titular">{BODEGA.nombre}</span>
        </div>
        <p className="checkout-pago-instrucciones__nota">
          Indica el banco desde el que transferiste, tu número de celular y el código de operación.
        </p>
      </div>

      <div className="checkout-formulario-rejilla">
        <Select
          etiqueta="Banco emisor"
          id="plin-banco"
          requerido
          value={datos.bancoPlin ?? ""}
          onChange={(e) => onChange("bancoPlin", e.target.value)}
          error={errores.bancoPlin}
        >
          <option value="">Selecciona tu banco</option>
          {BANCOS_PLIN.map((banco) => (
            <option key={banco} value={banco}>
              {banco}
            </option>
          ))}
        </Select>

        <Input
          etiqueta="Tu número de celular Plin"
          id="plin-telefono"
          type="tel"
          maxLength={9}
          placeholder="969 123 456"
          requerido
          value={datos.telefonoPlin ?? ""}
          onChange={(e) => {
            const soloNum = e.target.value.replace(/\D/g, "").slice(0, 9);
            onChange("telefonoPlin", soloNum);
          }}
          error={errores.telefonoPlin}
          ayuda="9 dígitos empezando con 9"
        />

        <Input
          etiqueta="Número / código de operación"
          id="plin-codigo"
          type="text"
          maxLength={8}
          placeholder="Ej: 78945612"
          requerido
          value={datos.codigoOperacion ?? ""}
          onChange={(e) => {
            const soloNum = e.target.value.replace(/\D/g, "").slice(0, 8);
            onChange("codigoOperacion", soloNum);
          }}
          error={errores.codigoOperacion}
          ayuda="6 a 8 dígitos del comprobante Plin"
        />
      </div>
    </div>
  );
}

export default FormularioPlin;
