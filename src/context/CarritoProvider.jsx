import { useState, useMemo, useEffect, useCallback } from "react";
import { CarritoContext } from "./CarritoContext";
import { useAuth } from "../hooks/useAuth";
import {
  leerCarritoStorage,
  guardarCarritoStorage,
  limpiarCarritoStorage,
  obtenerDuenoCarritoStorage,
  guardarDuenoCarritoStorage,
  EVENTO_LIMPIAR_CARRITO,
} from "./carritoStorage";

/**
 * ============================================================================
 * CarritoProvider / CartProvider · Estado global y persistencia del Carrito
 * ============================================================================
 * Maneja los productos del carrito con persistencia segura en localStorage.
 *
 * Reglas de sesión:
 *   · Al CERRAR SESIÓN: vacía el estado y limpia las claves de localStorage.
 *   · Al INICIAR SESIÓN con una cuenta DISTINTA al dueño previo del carrito:
 *     vacía el carrito para no mezclar productos entre usuarios.
 *   · En uso como INVITADO: preserva el carrito normalmente en recargas.
 *   · Todos los accesos a localStorage están protegidos con try/catch.
 * ==========================================================================*/
export const CarritoProvider = ({ children }) => {
  const { usuario } = useAuth();
  const idUsuarioActual = usuario ? String(usuario.id ?? usuario.email ?? "") : null;

  // Estado local para los productos añadidos al carrito (restaurado de localStorage)
  const [items, setItems] = useState(() => leerCarritoStorage());

  // Estado del Drawer lateral del carrito (FASE 6)
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  const abrirDrawerCarrito = useCallback(() => {
    setDrawerAbierto(true);
  }, []);

  const cerrarDrawerCarrito = useCallback(() => {
    setDrawerAbierto(false);
  }, []);

  /**
   * Remueve todos los elementos del carrito de compras (en memoria y storage).
   */
  const vaciar = useCallback(() => {
    setItems([]);
    limpiarCarritoStorage();
  }, []);

  // 1. Escuchar eventos de limpieza (evento de app o evento storage entre pestañas)
  useEffect(() => {
    const handleLimpiarEvento = () => {
      setItems([]);
    };

    const handleStorage = (e) => {
      if (
        (e.key === "trigal:carrito" || e.key === "carrito" || e.key === "cart") &&
        !e.newValue
      ) {
        setItems([]);
      }
    };

    window.addEventListener(EVENTO_LIMPIAR_CARRITO, handleLimpiarEvento);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(EVENTO_LIMPIAR_CARRITO, handleLimpiarEvento);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // 2. Sincronizar dueño del carrito en storage cuando un usuario se autentica
  useEffect(() => {
    if (idUsuarioActual) {
      const duenoStorage = obtenerDuenoCarritoStorage();
      if (!duenoStorage || duenoStorage === "invitado") {
        guardarDuenoCarritoStorage(idUsuarioActual);
      }
    }
  }, [idUsuarioActual]);

  // 3. Persistir en localStorage cada vez que los items cambien
  useEffect(() => {
    if (items.length > 0) {
      guardarCarritoStorage(items, idUsuarioActual || "invitado");
    } else {
      try {
        localStorage.removeItem("trigal:carrito");
        localStorage.removeItem("carrito");
        localStorage.removeItem("cart");
      } catch (err) {
        console.warn("[El Trigal] Error al limpiar items de carrito en storage:", err);
      }
    }
  }, [items, idUsuarioActual]);

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
    total,
    drawerAbierto,
    abrirDrawerCarrito,
    cerrarDrawerCarrito,
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
};

export const CartProvider = CarritoProvider;
export default CarritoProvider;
