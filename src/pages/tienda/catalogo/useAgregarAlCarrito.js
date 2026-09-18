/**
 * ============================================================================
 * useAgregarAlCarrito · Coordinación con el módulo de Carrito
 * ----------------------------------------------------------------------------
 * 🤝 COORDINACIÓN CON EL INTEGRANTE DEL CARRITO:
 *
 * La firma acordada para el Carrito es:
 *   agregar(producto, cantidad = 1)
 *
 * Cuando el compañero de la rama `carrito` cree su `src/context/CarritoContext.jsx`
 * y `src/hooks/useCarrito.js`, este gancho se conectará directamente con él.
 *
 * Mientras tanto, esta función deja la llamada preparada:
 *   1. Emite el evento personalizado 'carrito:agregar' en el objeto window.
 *   2. Provee estado de confirmación visual momentánea ("¡Agregado!") para
 *      que el usuario sienta la respuesta inmediata al hacer clic.
 * ==========================================================================*/

import { useCallback, useState } from "react";

export function useAgregarAlCarrito() {
  const [ultimoAgregado, setUltimoAgregado] = useState(null);
  const [agregandoId, setAgregandoId] = useState(null);

  const agregarAlCarrito = useCallback(async (producto, cantidad = 1) => {
    if (!producto || producto.stock <= 0) return;

    setAgregandoId(producto.id);

    // Disparar evento para listeners del carrito u otros módulos
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("carrito:agregar", {
          detail: { producto, cantidad },
        }),
      );

      // Si el contexto global expone un método temporal en window
      if (typeof window.__elTrigalCarrito?.agregar === "function") {
        window.__elTrigalCarrito.agregar(producto, cantidad);
      }
    }

    setUltimoAgregado({
      producto,
      cantidad,
      fecha: Date.now(),
    });

    // Pequeño retardo para animación y reset de estado
    setTimeout(() => {
      setAgregandoId(null);
    }, 600);
  }, []);

  const limpiarAviso = useCallback(() => {
    setUltimoAgregado(null);
  }, []);

  return {
    agregarAlCarrito,
    agregandoId,
    ultimoAgregado,
    limpiarAviso,
  };
}

export default useAgregarAlCarrito;
