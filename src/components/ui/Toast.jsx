/**
 * ============================================================================
 * Toast · Notificación emergente flotante
 * ----------------------------------------------------------------------------
 * Componente UI para alertas emergentes no bloqueantes (ej. nuevo pedido web).
 * Soporta auto-cierre con temporizador, acción de clic, botón de cierre
 * y variantes de color del sistema de diseño.
 * ==========================================================================*/

import { useEffect } from "react";
import { clases } from "../../utils/formato";
import "./Toast.css";

export function Toast({
  visible = true,
  onCerrar,
  onClick,
  variante = "marca", // marca | exito | advertencia | peligro | info | neutro
  icono,
  titulo,
  children,
  accionTexto,
  autoCierreMs = 7000,
  className,
}) {
  useEffect(() => {
    if (!visible || !autoCierreMs || typeof onCerrar !== "function") return;

    const temporizador = setTimeout(() => {
      onCerrar();
    }, autoCierreMs);

    return () => clearTimeout(temporizador);
  }, [visible, autoCierreMs, onCerrar]);

  if (!visible) return null;

  const handleClickContenedor = (e) => {
    if (typeof onClick === "function") {
      onClick(e);
    }
  };

  const handleClickCerrar = (e) => {
    e.stopPropagation();
    if (typeof onCerrar === "function") {
      onCerrar();
    }
  };

  return (
    <aside
      className={clases(
        "ui-toast",
        `ui-toast--${variante}`,
        onClick && "ui-toast--interactivo",
        className
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      onClick={handleClickContenedor}
    >
      {icono && (
        <div className="ui-toast__icono" aria-hidden="true">
          {icono}
        </div>
      )}

      <div className="ui-toast__cuerpo">
        {titulo && <h4 className="ui-toast__titulo">{titulo}</h4>}
        <div className="ui-toast__contenido">{children}</div>
        {accionTexto && (
          <span className="ui-toast__accion">
            <span>{accionTexto}</span>
          </span>
        )}
      </div>

      {onCerrar && (
        <button
          type="button"
          className="ui-toast__cerrar"
          onClick={handleClickCerrar}
          aria-label="Cerrar notificación"
          title="Cerrar"
        >
          ✕
        </button>
      )}
    </aside>
  );
}

export default Toast;
