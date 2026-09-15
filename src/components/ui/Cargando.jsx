/**
 * Cargando · Indicador de espera.
 *
 * Úsenlo mientras esperan datos del repositorio. Cuando llegue el backend real
 * las esperas serán notorias, así que vale la pena acostumbrarse desde ahora.
 *
 * @example if (cargando) return <Cargando texto="Cargando productos..." />
 * @example <Cargando tamano="sm" />
 */
import { clases } from "../../utils/formato";
import "./Cargando.css";

export function Cargando({
  /** sm | md | lg */
  tamano = "md",
  texto,
  /** Centra el indicador ocupando toda la altura disponible. */
  pantallaCompleta = false,
  className,
}) {
  return (
    <div
      className={clases(
        "ui-cargando",
        pantallaCompleta && "ui-cargando--pantalla",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className={clases("ui-cargando__giro", `ui-cargando__giro--${tamano}`)} />
      {texto ? (
        <span className="ui-cargando__texto">{texto}</span>
      ) : (
        <span className="visualmente-oculto">Cargando…</span>
      )}
    </div>
  );
}

export default Cargando;
