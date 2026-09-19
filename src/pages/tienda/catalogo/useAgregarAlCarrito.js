/**
 * ============================================================================
 * useAgregarAlCarrito · Puente entre el catálogo y el carrito
 * ----------------------------------------------------------------------------
 * 🤝 CONECTADO CON EL MÓDULO DE CARRITO
 *
 * Este gancho envuelve a `agregar()` del CarritoProvider real
 * (src/context/CarritoProvider.jsx) y le suma el estado visual que necesita el
 * catálogo: qué tarjeta está "cargando" y qué producto se agregó al final,
 * para el aviso de confirmación.
 *
 * Firma del carrito (definida en CarritoProvider):
 *   agregar(producto, cantidad = 1)
 * Guarda el objeto completo del producto más su `cantidad`, y lo identifica
 * por `producto.id`. Por eso aquí le pasamos el producto tal cual viene del
 * inventario, sin transformarlo.
 *
 * ⚠️ HISTORIA DE UN BUG (no repetir):
 * Antes, mientras el módulo de carrito aún no existía, esta función solo
 * emitía un CustomEvent 'carrito:agregar' en window y buscaba un
 * `window.__elTrigalCarrito`. Nadie escuchaba ese evento ni definía ese
 * objeto, así que el producto NUNCA llegaba al carrito: el usuario veía el
 * mensaje "¡Agregado!" (que era estado local de este archivo) pero el ícono
 * del navbar seguía en cero y /carrito salía vacía.
 *
 * La regla que evita esto: el estado compartido vive en el Context, no en
 * `window` ni en implementaciones paralelas.
 * ==========================================================================*/

import { useCallback, useState } from "react";
import { useCarrito } from "../../../context/CarritoContext";

export function useAgregarAlCarrito() {
  // ⬇️ La conexión de verdad: el mismo carrito que leen el Navbar y /carrito.
  const { agregar } = useCarrito();

  const [ultimoAgregado, setUltimoAgregado] = useState(null);
  const [agregandoId, setAgregandoId] = useState(null);

  const agregarAlCarrito = useCallback(
    async (producto, cantidad = 1) => {
      if (!producto || producto.stock <= 0) return;

      setAgregandoId(producto.id);

      // Esto es lo que realmente mete el producto al carrito.
      agregar(producto, cantidad);

      setUltimoAgregado({
        producto,
        cantidad,
        fecha: Date.now(),
      });

      // Pequeño retardo para la animación de la tarjeta.
      setTimeout(() => {
        setAgregandoId(null);
      }, 600);
    },
    [agregar],
  );

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
