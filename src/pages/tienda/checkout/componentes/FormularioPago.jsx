import { Card, CardCabecera, CardCuerpo, Badge } from "../../../../components/ui";
import { listarEstrategiasPago, obtenerEstrategiaPago } from "../pagos";

/**
 * ============================================================================
 * PATRÓN STRATEGY EN LA VISTA DE CHECKOUT
 * ----------------------------------------------------------------------------
 * Este componente no tiene lógica condicional para cada medio de pago.
 * Simplemente:
 * 1. Obtiene la lista de estrategias registradas con `listarEstrategiasPago()`.
 * 2. Muestra los botones/tarjetas de selección.
 * 3. Recupera la estrategia activa y renderiza su componente `Formulario`
 *    delegando en ella los datos y los errores.
 * ==========================================================================*/

export function FormularioPago({
  metodoSeleccionado,
  onSeleccionarMetodo,
  datosPago,
  onCambiarDatoPago,
  erroresPago,
  montoTotal,
}) {
  const estrategias = listarEstrategiasPago();
  const estrategiaActual = obtenerEstrategiaPago(metodoSeleccionado);
  const ComponenteFormulario = estrategiaActual.Formulario;

  return (
    <Card className="checkout-seccion-card">
      <CardCabecera
        titulo="3. Medio de pago"
        subtitulo="Selecciona cómo deseas pagar tu pedido."
        accion={
          <Badge variante="acento" tamano="sm">
            Patrón Strategy
          </Badge>
        }
      />
      <CardCuerpo>
        {/* Selector de estrategias */}
        <div className="checkout-pagos-grid" role="radiogroup" aria-label="Medios de pago">
          {estrategias.map((est) => {
            const estaActivo = est.id === metodoSeleccionado;
            return (
              <button
                key={est.id}
                type="button"
                role="radio"
                aria-checked={estaActivo}
                className={`checkout-pago-tarjeta ${estaActivo ? "checkout-pago-tarjeta--activa" : ""}`}
                onClick={() => onSeleccionarMetodo(est.id)}
              >
                <span className="checkout-pago-tarjeta__icono" aria-hidden="true">{est.icono}</span>
                <span className="checkout-pago-tarjeta__nombre">{est.nombre}</span>
              </button>
            );
          })}
        </div>

        {/* Formulario encapsulado de la estrategia seleccionada */}
        <div className="checkout-pago-detalle">
          <div className="checkout-estrategia-banner">
            <span className="checkout-estrategia-banner__tag">Estrategia activa:</span>
            <strong className="checkout-estrategia-banner__nombre">{estrategiaActual.nombre}</strong>
            <span className="checkout-estrategia-banner__desc"> — {estrategiaActual.descripcion}</span>
          </div>

          <ComponenteFormulario
            datos={datosPago}
            onChange={onCambiarDatoPago}
            errores={erroresPago}
            monto={montoTotal}
          />
        </div>
      </CardCuerpo>
    </Card>
  );
}

export default FormularioPago;
