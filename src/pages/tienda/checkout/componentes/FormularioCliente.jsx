import { Input, Card, CardCabecera, CardCuerpo, Badge } from "../../../../components/ui";

export function FormularioCliente({ datos, onChange, errores, usuario, estaAutenticado }) {
  return (
    <Card className="checkout-seccion-card">
      <CardCabecera
        titulo="1. Datos de contacto"
        subtitulo="Para coordinar la entrega y enviarte la confirmación del pedido."
        accion={
          estaAutenticado && (
            <Badge variante="marca" tamano="sm">
              Sesión activa
            </Badge>
          )
        }
      />
      <CardCuerpo>
        {estaAutenticado && (
          <div className="checkout-aviso-sesion">
            <span className="checkout-aviso-sesion__icono" aria-hidden="true">👤</span>
            <p className="checkout-aviso-sesion__texto">
              Comprando como <strong>{usuario?.nombre}</strong> ({usuario?.correo}). Hemos cargado tus datos automáticamente.
            </p>
          </div>
        )}

        <div className="checkout-formulario-rejilla">
          <Input
            etiqueta="Nombre completo"
            id="cliente-nombre"
            type="text"
            placeholder="Ej: María Sandoval"
            requerido
            value={datos.nombre ?? ""}
            onChange={(e) => onChange("nombre", e.target.value)}
            error={errores.nombre}
          />

          <Input
            etiqueta="Correo electrónico"
            id="cliente-correo"
            type="email"
            placeholder="cliente@ejemplo.pe"
            requerido
            value={datos.correo ?? ""}
            onChange={(e) => onChange("correo", e.target.value)}
            error={errores.correo}
            ayuda="Te enviaremos el comprobante a este correo"
          />

          <Input
            etiqueta="Teléfono / WhatsApp"
            id="cliente-telefono"
            type="tel"
            maxLength={9}
            placeholder="969 000 000"
            requerido
            value={datos.telefono ?? ""}
            onChange={(e) => {
              const soloNum = e.target.value.replace(/\D/g, "").slice(0, 9);
              onChange("telefono", soloNum);
            }}
            error={errores.telefono}
            ayuda="Para coordinar con el repartidor o avisarte de la entrega"
          />
        </div>
      </CardCuerpo>
    </Card>
  );
}

export default FormularioCliente;
