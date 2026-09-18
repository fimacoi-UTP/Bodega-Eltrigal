import { useState, useMemo } from 'react';
import { CarritoContext } from './CarritoContext';

/**
 * Proveedor del estado del carrito. Sigue el estándar de la arquitectura
 * utilizada por AuthProvider e InventarioProvider en el proyecto.
 */
export const CarritoProvider = ({ children }) => {
  // Estado local para los productos añadidos al carrito
  const [items, setItems] = useState([]);

  /**
   * Agrega un producto al carrito o incrementa su cantidad si ya existe.
   * @param {Object} producto - Objeto con la información del producto.
   * @param {number} cantidad - Cantidad a agregar (por defecto 1).
   */
  const agregar = (producto, cantidad = 1) => {
    setItems((prevItems) => {
      const existe = prevItems.find((item) => item.id === producto.id);
      if (existe) {
        return prevItems.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [...prevItems, { ...producto, cantidad }];
    });
  };

  /**
   * Elimina un ítem específico del carrito mediante su id.
   * @param {string|number} id - Identificador único del producto.
   */
  const quitar = (id) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  /**
   * Modifica la cantidad de un ítem. Si la nueva cantidad es <= 0, elimina el producto.
   * @param {string|number} id - Identificador único del producto.
   * @param {number} nuevaCantidad - Nueva cantidad para el producto.
   */
  const cambiarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      quitar(id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  /**
   * Remueve todos los elementos del carrito de compras.
   */
  const vaciar = () => {
    setItems([]);
  };

  /**
   * Recalcula el total gastado memorizando el valor para optimizar renderizados.
   */
  const total = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.precio || 0) * item.cantidad, 0);
  }, [items]);

  // Contexto expuesto a la aplicación
  const value = {
    items,
    agregar,
    quitar,
    cambiarCantidad,
    vaciar,
    total
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
};
