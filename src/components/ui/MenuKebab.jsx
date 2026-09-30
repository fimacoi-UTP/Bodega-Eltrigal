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

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { clases } from "../../utils/formato";
import "./MenuKebab.css";

export function MenuKebab({
  acciones = [],
  alineacion = "derecha",
  ariaLabel = "Más opciones",
  className,
}) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0, posicionVertical: "abajo" });
  const contenedorRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const cerrar = useCallback(() => {
    setAbierto(false);
  }, []);

  const actualizarPosicion = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuEl = menuRef.current;

    const menuWidth = menuEl ? menuEl.offsetWidth : 190;
    const menuHeight = menuEl ? menuEl.offsetHeight : 160;
    const margen = 8;
    const espacioAbajo = window.innerHeight - triggerRect.bottom;
    const espacioArriba = triggerRect.top;

    // Si no hay suficiente espacio abajo y hay más espacio arriba, abrir hacia arriba
    const abrirArriba = espacioAbajo < menuHeight + margen && espacioArriba >= espacioAbajo;

    const top = abrirArriba
      ? Math.max(margen, triggerRect.top - menuHeight - 4)
      : Math.min(window.innerHeight - menuHeight - margen, triggerRect.bottom + 4);

    const left =
      alineacion === "izquierda"
        ? Math.min(triggerRect.left, window.innerWidth - menuWidth - margen)
        : Math.max(margen, triggerRect.right - menuWidth);

    setPosicion({
      top: Math.round(top),
      left: Math.round(left),
      posicionVertical: abrirArriba ? "arriba" : "abajo",
    });
  }, [alineacion]);

  // Recalcular posición al abrirse y ante resize/scroll
  useLayoutEffect(() => {
    if (!abierto) return;
    actualizarPosicion();
  }, [abierto, actualizarPosicion]);

  useEffect(() => {
    if (!abierto) return;

    const manejarScrollResize = () => {
      actualizarPosicion();
    };

    window.addEventListener("scroll", manejarScrollResize, true);
    window.addEventListener("resize", manejarScrollResize);

    return () => {
      window.removeEventListener("scroll", manejarScrollResize, true);
      window.removeEventListener("resize", manejarScrollResize);
    };
  }, [abierto, actualizarPosicion]);

  // Cierre al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!abierto) return;

    const manejarClicFuera = (e) => {
      const enTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const enMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!enTrigger && !enMenu) {
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

      {abierto &&
        createPortal(
          <div
            ref={menuRef}
            className={clases(
              "ui-kebab__menu",
              posicion.posicionVertical === "arriba"
                ? "ui-kebab__menu--arriba"
                : "ui-kebab__menu--abajo"
            )}
            style={{
              top: `${posicion.top}px`,
              left: `${posicion.left}px`,
            }}
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
          </div>,
          document.body
        )}
    </div>
  );
}

export default MenuKebab;
