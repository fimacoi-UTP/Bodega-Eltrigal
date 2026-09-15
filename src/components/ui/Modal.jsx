/**
 * Modal · Ventana emergente.
 *
 * Los módulos del dashboard la van a necesitar para los formularios de crear y
 * editar (productos, promociones). Está aquí para que no la reinvente cada
 * integrante a su manera.
 *
 * Incluye lo básico de accesibilidad: cierra con Escape, cierra al hacer clic
 * en el fondo, bloquea el scroll de atrás y enfoca la ventana al abrirse.
 * En móvil aparece pegada abajo (estilo hoja), que es lo cómodo con el pulgar.
 *
 * @example
 * const [abierto, setAbierto] = useState(false)
 * <Modal abierto={abierto} alCerrar={() => setAbierto(false)} titulo="Nuevo producto">
 *   <form>...</form>
 * </Modal>
 */
import { useEffect, useRef } from "react";
import { clases } from "../../utils/formato";
import "./Modal.css";

export function Modal({
  abierto,
  alCerrar,
  titulo,
  children,
  /** Contenido del pie, normalmente los botones de acción. */
  pie,
  /** sm | md | lg */
  tamano = "md",
  className,
}) {
  const ventanaRef = useRef(null);

  // Cerrar con Escape + bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!abierto) return;

    const alPresionarTecla = (evento) => {
      if (evento.key === "Escape") alCerrar?.();
    };

    const desbordeOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", alPresionarTecla);

    // Llevamos el foco a la ventana para que el teclado y los lectores de
    // pantalla entren al modal y no se queden atrás.
    ventanaRef.current?.focus();

    return () => {
      document.body.style.overflow = desbordeOriginal;
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="ui-modal__fondo"
      // Cierra solo si el clic fue en el fondo, no dentro de la ventana.
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) alCerrar?.();
      }}
    >
      <div
        ref={ventanaRef}
        className={clases("ui-modal", `ui-modal--${tamano}`, className)}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
      >
        <header className="ui-modal__cabecera">
          <h2 className="ui-modal__titulo">{titulo}</h2>
          <button
            type="button"
            className="ui-modal__cerrar"
            onClick={alCerrar}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="ui-modal__cuerpo">{children}</div>

        {pie && <footer className="ui-modal__pie">{pie}</footer>}
      </div>
    </div>
  );
}

export default Modal;
