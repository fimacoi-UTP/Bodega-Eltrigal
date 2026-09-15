/**
 * Boton · Componente base de acción.
 *
 * @example <Boton onClick={guardar}>Guardar</Boton>
 * @example <Boton variante="contorno" tamano="sm">Cancelar</Boton>
 * @example <Boton como={Link} to="/carrito">Ver carrito</Boton>
 * @example <Boton cargando={enviando} bloque>Pagar</Boton>
 */
import { clases } from "../../utils/formato";
import "./Boton.css";

export function Boton({
  children,
  /** primario | secundario | contorno | fantasma | peligro */
  variante = "primario",
  /** sm | md | lg */
  tamano = "md",
  /** Ocupa todo el ancho disponible (útil en móvil). */
  bloque = false,
  /** Muestra un spinner y deshabilita el botón. */
  cargando = false,
  /** Ícono a la izquierda del texto (un SVG o emoji). */
  icono = null,
  /**
   * Permite renderizar otra etiqueta o componente manteniendo el estilo.
   * Muy útil con <Link> de react-router: <Boton como={Link} to="/login" />
   */
  como: Componente = "button",
  className,
  disabled,
  ...props
}) {
  const esBoton = Componente === "button";

  return (
    <Componente
      className={clases(
        "ui-boton",
        `ui-boton--${variante}`,
        `ui-boton--${tamano}`,
        bloque && "ui-boton--bloque",
        cargando && "ui-boton--cargando",
        className,
      )}
      // Solo los <button> de verdad aceptan `type` y `disabled`.
      {...(esBoton ? { type: props.type ?? "button", disabled: disabled || cargando } : {})}
      // Si es un enlace deshabilitado, lo sacamos del orden de tabulación.
      {...(!esBoton && (disabled || cargando) ? { "aria-disabled": true, tabIndex: -1 } : {})}
      {...props}
    >
      {cargando && <span className="ui-boton__spinner" aria-hidden="true" />}
      {!cargando && icono && <span className="ui-boton__icono">{icono}</span>}
      <span className="ui-boton__texto">{children}</span>
    </Componente>
  );
}

export default Boton;
