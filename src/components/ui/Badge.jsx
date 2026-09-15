/**
 * Badge · Etiqueta pequeña de estado o categoría.
 *
 * @example <Badge variante="exito">En stock</Badge>
 * @example <Badge variante="peligro">Agotado</Badge>
 * @example <Badge variante="marca" punto>Nuevo</Badge>
 */
import { clases } from "../../utils/formato";
import "./Badge.css";

export function Badge({
  children,
  /** neutro | marca | acento | exito | advertencia | peligro | info */
  variante = "neutro",
  /** sm | md */
  tamano = "md",
  /** Muestra un puntito de color a la izquierda. */
  punto = false,
  className,
  ...props
}) {
  return (
    <span
      className={clases("ui-badge", `ui-badge--${variante}`, `ui-badge--${tamano}`, className)}
      {...props}
    >
      {punto && <span className="ui-badge__punto" aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;
