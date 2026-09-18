import { useState, useMemo } from 'react';
import { CarritoContext } from './CarritoContext';

export const CarritoProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  // Agregar producto o incrementar cantidad si ya existe
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

  // Quitar un item por su ID
  const quitar = (id) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // Cambiar cantidad directamente de un producto
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

  // Vaciar completamente el carrito
  const vaciar = () => {
    setItems([]);
  };

  // Cálculo del total acumulado
  const total = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.precio || 0) * item.cantidad, 0);
  }, [items]);

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