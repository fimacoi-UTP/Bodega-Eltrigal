import { Input } from "../../../../components/ui";
import { BODEGA } from "../../../../constantes";

export function FormularioYape({ datos, onChange, errores }) {
  return (
    <div className="checkout-pago-estrategia">
      <div className="checkout-pago-instrucciones">
        <p className="checkout-pago-instrucciones__texto">
          Transfiere el monto total a nuestro número oficial de Yape:
        </p>
        <div className="checkout-pago-instrucciones__caja">
          <span className="checkout-pago-instrucciones__numero">{BODEGA.telefono}</span>
          <span className="checkout-pago-instrucciones__titular">{BODEGA.nombre}</span>
        </div>
        <p className="checkout-pago-instrucciones__nota">
          Ingresa el número desde el que yapeaste y los 6 dígitos del código de aprobación que aparece en tu comprobante.
        </p>
      </div>

      <div className="checkout-formulario-rejilla">
        <Input
          etiqueta="Tu número de celular Yape"
          id="yape-telefono"
          type="tel"
          maxLength={9}
          placeholder="969 123 456"
          requerido
          value={datos.telefonoYape ?? ""}
          onChange={(e) => {
            const soloNum = e.target.value.replace(/\D/g, "").slice(0, 9);
            onChange("telefonoYape", soloNum);
          }}
          error={errores.telefonoYape}
          ayuda="Debe ser un número de 9 dígitos que empiece con 9"
        />

        <Input
          etiqueta="Código de aprobación / operación"
          id="yape-codigo"
          type="text"
          maxLength={6}
          placeholder="Ej: 482910"
          requerido
          value={datos.codigoAprobacion ?? ""}
          onChange={(e) => {
            const soloNum = e.target.value.replace(/\D/g, "").slice(0, 6);
            onChange("codigoAprobacion", soloNum);
          }}
          error={errores.codigoAprobacion}
          ayuda="Código de 6 dígitos visible en tu comprobante de Yape"
        />
      </div>
    </div>
  );
}

export default FormularioYape;
