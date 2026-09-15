/**
 * Alerta · Mensaje destacado de información, éxito o error.
 *
 * @example <Alerta variante="peligro">{error}</Alerta>
 * @example <Alerta variante="exito" titulo="¡Listo!">Tu pedido fue registrado.</Alerta>
 */
import { clases } from "../../utils/formato";
import "./Alerta.css";

const ICONOS = {
  info: "i",
  exito: "✓",
  advertencia: "!",
  peligro: "!",
};

export function Alerta({
  children,
  /** info | exito | advertencia | peligro */
  variante = "info",
  titulo,
  /** Si se pasa, aparece una X para cerrar la alerta. */
  alCerrar,
  className,
  ...props
}) {
  return (
    <div
      className={clases("ui-alerta", `ui-alerta--${variante}`, className)}
      // Los errores se anuncian de inmediato; el resto, cuando haya una pausa.
      role={variante === "peligro" ? "alert" : "status"}
      {...props}
    >
      <span className="ui-alerta__icono" aria-hidden="true">
        {ICONOS[variante]}
      </span>

      <div className="ui-alerta__contenido">
        {titulo && <p className="ui-alerta__titulo">{titulo}</p>}
        <div className="ui-alerta__texto">{children}</div>
      </div>

      {alCerrar && (
        <button
          type="button"
          className="ui-alerta__cerrar"
          onClick={alCerrar}
          aria-label="Cerrar aviso"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Alerta;
