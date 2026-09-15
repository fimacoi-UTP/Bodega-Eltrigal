/**
 * Card · Contenedor con superficie, borde y sombra.
 * La caja visual estándar del proyecto: tarjetas de producto, paneles del
 * dashboard, formularios.
 *
 * @example
 * <Card>
 *   <CardCabecera titulo="Ventas de hoy" accion={<Boton tamano="sm">Ver</Boton>} />
 *   <CardCuerpo>...</CardCuerpo>
 *   <CardPie>...</CardPie>
 * </Card>
 *
 * @example Tarjeta simple y clicable
 * <Card comoEnlace padding="sm">...</Card>
 */
import { clases } from "../../utils/formato";
import "./Card.css";

export function Card({
  children,
  /** none | sm | md | lg — el relleno interno. */
  padding = "md",
  /** Eleva la tarjeta al pasar el mouse (para tarjetas clicables). */
  interactiva = false,
  className,
  como: Componente = "div",
  ...props
}) {
  return (
    <Componente
      className={clases(
        "ui-card",
        `ui-card--pad-${padding}`,
        interactiva && "ui-card--interactiva",
        className,
      )}
      {...props}
    >
      {children}
    </Componente>
  );
}

/** Cabecera con título, subtítulo opcional y una acción a la derecha. */
export function CardCabecera({ titulo, subtitulo, accion, children, className }) {
  return (
    <div className={clases("ui-card__cabecera", className)}>
      <div className="ui-card__titulos">
        {titulo && <h3 className="ui-card__titulo">{titulo}</h3>}
        {subtitulo && <p className="ui-card__subtitulo">{subtitulo}</p>}
        {children}
      </div>
      {accion && <div className="ui-card__accion">{accion}</div>}
    </div>
  );
}

export function CardCuerpo({ children, className }) {
  return <div className={clases("ui-card__cuerpo", className)}>{children}</div>;
}

export function CardPie({ children, className }) {
  return <div className={clases("ui-card__pie", className)}>{children}</div>;
}

export default Card;
