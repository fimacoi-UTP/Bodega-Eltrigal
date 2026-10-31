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
 * En la tienda pública el backend devuelve `disponible` (booleano) sin exponer
 * el `stock` numérico exacto; por ello aquí evaluamos `producto.disponible`
 * cuando no existe `stock` numérico.
 * ==========================================================================*/

import { useCallback, useState } from "react";
import { useCarrito } from "../../../context/CarritoContext";

export function useAgregarAlCarrito() {
  const { agregar } = useCarrito();

  const [ultimoAgregado, setUltimoAgregado] = useState(null);
  const [agregandoId, setAgregandoId] = useState(null);

  const agregarAlCarrito = useCallback(
    async (producto, cantidad = 1) => {
      if (!producto) return;

      const tieneStockNumerico =
        producto.stock !== undefined &&
        producto.stock !== null &&
        Number.isFinite(Number(producto.stock));

      const estaDisponible =
        typeof producto.disponible === "boolean"
          ? producto.disponible
          : tieneStockNumerico
            ? Number(producto.stock) > 0
            : true;

      if (!estaDisponible) return;

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
