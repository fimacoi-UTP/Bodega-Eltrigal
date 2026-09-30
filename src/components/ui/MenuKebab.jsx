/**
 * ============================================================================
 * MenuKebab · Menú de tres puntos (⋮) para acciones contextuales
 * ============================================================================
 * Despliega un menú flotante de acciones al hacer clic en el botón de tres puntos.
 *
 * @example
 * <MenuKebab
 *   acciones={[
 *     { label: "Editar", icono: "✏️", onClick: () => handleEditar(item) },
 *     { label: "Ocultar", icono: "👁️", onClick: () => handleOcultar(item) },
 *     { label: "Eliminar", icono: "🗑️", peligro: true, onClick: () => handleEliminar(item) },
 *   ]}
 * />
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { clases } from "../../utils/formato";
import "./MenuKebab.css";

export function MenuKebab({
  acciones = [],
  alineacion = "derecha",
  ariaLabel = "Más opciones",
  className,
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const triggerRef = useRef(null);

  const cerrar = useCallback(() => {
    setAbierto(false);
  }, []);

  // Cierre al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!abierto) return;

    const manejarClicFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        cerrar();
      }
    };

    const manejarTecla = (e) => {
      if (e.key === "Escape") {
        cerrar();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", manejarClicFuera);
    document.addEventListener("keydown", manejarTecla);

    return () => {
      document.removeEventListener("mousedown", manejarClicFuera);
      document.removeEventListener("keydown", manejarTecla);
    };
  }, [abierto, cerrar]);

  const toggle = (e) => {
    e.stopPropagation();
    setAbierto((prev) => !prev);
  };

  const ejecutarAccion = (e, accion) => {
    e.stopPropagation();
    if (accion.deshabilitado) return;
    cerrar();
    accion.onClick?.(e);
  };

  return (
    <div ref={contenedorRef} className={clases("ui-kebab", className)}>
      <button
        ref={triggerRef}
        type="button"
        className={clases("ui-kebab__trigger", abierto && "ui-kebab__trigger--activo")}
        onClick={toggle}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={abierto}
      >
        <span className="ui-kebab__puntos" aria-hidden="true">⋮</span>
      </button>

      {abierto && (
        <div
          className={clases(
            "ui-kebab__menu",
            alineacion === "izquierda" ? "ui-kebab__menu--izquierda" : "ui-kebab__menu--derecha"
          )}
          role="menu"
          aria-label={ariaLabel}
        >
          {acciones.map((accion, indice) => {
            if (accion.separador) {
              return <div key={`sep-${indice}`} className="ui-kebab__separador" role="separator" />;
            }

            return (
              <button
                key={accion.label || indice}
                type="button"
                className={clases(
                  "ui-kebab__item",
                  accion.peligro && "ui-kebab__item--peligro"
                )}
                onClick={(e) => ejecutarAccion(e, accion)}
                disabled={accion.deshabilitado}
                role="menuitem"
              >
                {accion.icono && (
                  <span className="ui-kebab__item-icono" aria-hidden="true">
                    {accion.icono}
                  </span>
                )}
                <span className="ui-kebab__item-texto">{accion.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MenuKebab;
