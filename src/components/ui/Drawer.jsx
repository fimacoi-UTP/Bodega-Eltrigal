/**
 * ============================================================================
 * Drawer · Panel lateral deslizante (Offcanvas)
 * ============================================================================
 * Panel que entra desde la derecha para formularios de edición o detalles sin
 * perder el contexto de la tabla principal.
 *
 * @example
 * <Drawer
 *   abierto={abierto}
 *   onClose={() => setAbierto(false)}
 *   titulo="Editar producto"
 *   subtitulo="Modifica los datos del catálogo y stock"
 *   pie={<Boton variante="primario">Guardar cambios</Boton>}
 * >
 *   <form>...</form>
 * </Drawer>
 */

import { useEffect, useRef } from "react";
import { clases } from "../../utils/formato";
import "./Drawer.css";

export function Drawer({
  abierto,
  onClose,
  alCerrar,
  titulo,
  subtitulo,
  children,
  pie,
  tamano = "md",
  className,
}) {
  const drawerRef = useRef(null);
  const cerrarFn = onClose || alCerrar;
  const cerrarRef = useRef(cerrarFn);

  useEffect(() => {
    cerrarRef.current = cerrarFn;
  }, [cerrarFn]);

  // Cierre con Escape y bloqueo de scroll
  useEffect(() => {
    if (!abierto) return;

    const manejarTecla = (e) => {
      if (e.key === "Escape") {
        cerrarRef.current?.();
      }
    };

    const desbordeOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", manejarTecla);

    drawerRef.current?.focus();

    return () => {
      document.body.style.overflow = desbordeOriginal;
      document.removeEventListener("keydown", manejarTecla);
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="ui-drawer__fondo"
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrarFn?.();
      }}
    >
      <div
        ref={drawerRef}
        className={clases("ui-drawer", `ui-drawer--${tamano}`, className)}
        role="dialog"
        aria-modal="true"
        aria-label={typeof titulo === "string" ? titulo : undefined}
        tabIndex={-1}
      >
        <header className="ui-drawer__cabecera">
          <div className="ui-drawer__cabecera-info">
            {titulo && <h2 className="ui-drawer__titulo">{titulo}</h2>}
            {subtitulo && <p className="ui-drawer__subtitulo">{subtitulo}</p>}
          </div>

          <button
            type="button"
            className="ui-drawer__cerrar"
            onClick={cerrarFn}
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </header>

        <div className="ui-drawer__cuerpo">{children}</div>

        {pie && <footer className="ui-drawer__pie">{pie}</footer>}
      </div>
    </div>
  );
}

export default Drawer;
