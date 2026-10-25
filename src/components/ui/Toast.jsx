/**
 * ============================================================================
 * Toast · Notificación emergente flotante rediseñada (Premium & Notorio)
 * ----------------------------------------------------------------------------
 * Componente UI compartido para alertas emergentes no bloqueantes (favoritos,
 * carrito, direcciones, pedidos en vivo, errores).
 *
 * Características:
 *   · Variantes de color: success (verde), error (rojo), warning y info (terracota/ámbar).
 *   · Fondo tintado suave, barra lateral izquierda sólida y chip de ícono circular.
 *   · Animación slide-in con leve overshoot y salida fade-out.
 *   · Barra de progreso fina que indica visualmente el tiempo de auto-cierre.
 *   · Apilamiento automático en el contenedor fijo superior derecho.
 * ==========================================================================*/

import { useState, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { clases } from "../../utils/formato";
import "./Toast.css";

/**
 * Obtiene o crea el contenedor de apilamiento en el DOM.
 */
function obtenerContenedorToast() {
  if (typeof document === "undefined") return null;
  let stack = document.getElementById("ui-toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "ui-toast-stack";
    stack.className = "ui-toast-stack";
    document.body.appendChild(stack);
  }
  return stack;
}

/**
 * Normaliza variantes tanto en español como en inglés.
 */
function normalizarVariante(variante) {
  const v = String(variante || "info").toLowerCase();
  if (v === "exito" || v === "success") return "success";
  if (v === "peligro" || v === "error") return "error";
  if (v === "advertencia" || v === "warning") return "warning";
  if (v === "marca" || v === "info" || v === "neutro") return "info";
  return "info";
}

/**
 * Ícono predeterminado según la variante si no se proporciona uno explícito.
 */
function IconoPredeterminado({ variante }) {
  switch (variante) {
    case "success":
      return (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="17"
          height="17"
          aria-hidden="true"
        >
          <polyline points="4 10.5 8 14.5 16 5.5" />
        </svg>
      );
    case "error":
      return (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="15"
          height="15"
          aria-hidden="true"
        >
          <line x1="5" y1="5" x2="15" y2="15" />
          <line x1="15" y1="5" x2="5" y2="15" />
        </svg>
      );
    case "warning":
      return (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <line x1="10" y1="4.5" x2="10" y2="11" />
          <circle cx="10" cy="15" r="1.2" fill="currentColor" />
        </svg>
      );
    case "info":
    default:
      return (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <circle cx="10" cy="5.2" r="1.2" fill="currentColor" />
          <line x1="10" y1="8.8" x2="10" y2="14.8" />
        </svg>
      );
  }
}

export function Toast({
  visible = true,
  onCerrar,
  onClick,
  variante = "info",
  icono,
  titulo,
  children,
  accionTexto,
  autoCierreMs = 4500,
  duracion,
  className,
}) {
  const tiempoAutoCierre = duracion ?? autoCierreMs;
  const varianteNormalizada = normalizarVariante(variante);
  const tituloId = useId();

  const [saliendo, setSaliendo] = useState(false);

  // Manejo de salida suave antes de ejecutar onCerrar
  const handleCerrar = useCallback(() => {
    setSaliendo(true);
    const timeout = setTimeout(() => {
      setSaliendo(false);
      if (typeof onCerrar === "function") {
        onCerrar();
      }
    }, 220);

    return () => clearTimeout(timeout);
  }, [onCerrar]);

  // Temporizador de auto-cierre con animación de salida previa
  useEffect(() => {
    if (!visible || saliendo || !tiempoAutoCierre || typeof onCerrar !== "function") return;

    const temporizador = setTimeout(() => {
      handleCerrar();
    }, tiempoAutoCierre);

    return () => clearTimeout(temporizador);
  }, [visible, saliendo, tiempoAutoCierre, handleCerrar, onCerrar]);

  if (!visible && !saliendo) return null;

  const handleClickContenedor = (e) => {
    if (typeof onClick === "function") {
      onClick(e);
    }
  };

  const handleClickBotonCerrar = (e) => {
    e.stopPropagation();
    handleCerrar();
  };

  const portalElemento = obtenerContenedorToast();

  const elementoToast = (
    <aside
      className={clases(
        "ui-toast",
        `ui-toast--${varianteNormalizada}`,
        onClick && "ui-toast--interactivo",
        saliendo && "ui-toast--saliendo",
        className,
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      aria-labelledby={titulo ? tituloId : undefined}
      onClick={handleClickContenedor}
    >
      {/* Chip circular con ícono */}
      <div className="ui-toast__chip-icono" aria-hidden="true">
        {icono ? icono : <IconoPredeterminado variante={varianteNormalizada} />}
      </div>

      {/* Contenido textual */}
      <div className="ui-toast__cuerpo">
        {titulo && (
          <h4 id={tituloId} className="ui-toast__titulo">
            {titulo}
          </h4>
        )}
        <div className="ui-toast__contenido">{children}</div>
        {accionTexto && (
          <span className="ui-toast__accion">
            <span>{accionTexto}</span>
          </span>
        )}
      </div>

      {/* Botón de cierre */}
      {onCerrar && (
        <button
          type="button"
          className="ui-toast__cerrar"
          onClick={handleClickBotonCerrar}
          aria-label="Cerrar notificación"
          title="Cerrar"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Barra de progreso inferior temporizada */}
      {tiempoAutoCierre > 0 && typeof onCerrar === "function" && (
        <div
          className="ui-toast__progreso"
          style={{ animationDuration: `${tiempoAutoCierre}ms` }}
          aria-hidden="true"
        />
      )}
    </aside>
  );

  return portalElemento ? createPortal(elementoToast, portalElemento) : elementoToast;
}

export default Toast;
