/**
 * Input · Campo de texto con etiqueta, ayuda y error.
 *
 * Usa `useId()` para enlazar <label> con <input> automáticamente: eso hace que
 * al tocar la etiqueta en el celular se enfoque el campo, y que los lectores
 * de pantalla lo anuncien bien.
 *
 * @example <Input etiqueta="Correo" type="email" value={v} onChange={e => set(e.target.value)} />
 * @example <Input etiqueta="Precio" type="number" prefijo="S/" error="Debe ser mayor a 0" />
 */
import { useId } from "react";
import { clases } from "../../utils/formato";
import "./Input.css";

export function Input({
  etiqueta,
  /** Mensaje de error. Si viene, el campo se pinta de rojo. */
  error,
  /** Texto de ayuda debajo del campo (se oculta si hay error). */
  ayuda,
  /** Texto fijo al inicio del campo, ej. "S/". */
  prefijo,
  requerido = false,
  className,
  id,
  ...props
}) {
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;
  const idDescripcion = `${idCampo}-desc`;

  return (
    <div className={clases("ui-campo", className)}>
      {etiqueta && (
        <label className="ui-campo__etiqueta" htmlFor={idCampo}>
          {etiqueta}
          {requerido && (
            <span className="ui-campo__requerido" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div
        className={clases(
          "ui-campo__caja",
          error && "ui-campo__caja--error",
          prefijo && "ui-campo__caja--con-prefijo",
        )}
      >
        {prefijo && <span className="ui-campo__prefijo">{prefijo}</span>}
        <input
          id={idCampo}
          className="ui-campo__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={error || ayuda ? idDescripcion : undefined}
          required={requerido}
          {...props}
        />
      </div>

      {error && (
        // role="alert" hace que el lector de pantalla anuncie el error apenas aparece.
        <p className="ui-campo__error" id={idDescripcion} role="alert">
          {error}
        </p>
      )}
      {!error && ayuda && (
        <p className="ui-campo__ayuda" id={idDescripcion}>
          {ayuda}
        </p>
      )}
    </div>
  );
}

/**
 * Select · Lista desplegable con el mismo estilo que Input.
 * @example
 * <Select etiqueta="Categoría" value={cat} onChange={...}>
 *   <option value="">Todas</option>
 *   {categorias.map(c => <option key={c} value={c}>{c}</option>)}
 * </Select>
 */
export function Select({ etiqueta, error, ayuda, requerido, className, id, children, ...props }) {
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;
  const idDescripcion = `${idCampo}-desc`;

  return (
    <div className={clases("ui-campo", className)}>
      {etiqueta && (
        <label className="ui-campo__etiqueta" htmlFor={idCampo}>
          {etiqueta}
          {requerido && (
            <span className="ui-campo__requerido" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className={clases("ui-campo__caja", error && "ui-campo__caja--error")}>
        <select
          id={idCampo}
          className="ui-campo__input ui-campo__select"
          aria-invalid={error ? true : undefined}
          aria-describedby={error || ayuda ? idDescripcion : undefined}
          required={requerido}
          {...props}
        >
          {children}
        </select>
      </div>

      {error && (
        <p className="ui-campo__error" id={idDescripcion} role="alert">
          {error}
        </p>
      )}
      {!error && ayuda && (
        <p className="ui-campo__ayuda" id={idDescripcion}>
          {ayuda}
        </p>
      )}
    </div>
  );
}

export default Input;
