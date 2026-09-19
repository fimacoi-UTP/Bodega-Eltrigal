import { createContext, useContext } from 'react';

/**
 * Contexto global para compartir la información y acciones del carrito de compras.
 */
export const CarritoContext = createContext();

/**
 * Hook personalizado para acceder fácilmente al contexto del carrito.
 * Lanza un error explícito si se intenta usar fuera del CarritoProvider.
 */
export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
  }
  return context;
};
 
