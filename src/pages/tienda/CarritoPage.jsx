import React from 'react';
import { useCarrito } from '../../context/CarritoContext';
import { Card, Boton, EstadoVacio, Input } from '../../components/ui';

/**
 * Vista de la página del Carrito (/carrito).
 * Muestra el desglose de productos, modificación de cantidad y cálculo total.
 */
export const CarritoPage = () => {
  const { items, quitar, cambiarCantidad, vaciar, total } = useCarrito();

  // Estado vacío cuando no hay ítems en el carrito
  if (items.length === 0) {
    return (
      <div style={{ padding: 'var(--esp-4)' }}>
        <EstadoVacio 
          mensaje="Tu carrito está vacío" 
          descripcion="Explora la tienda y añade productos a tu carrito de compras." 
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--esp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--esp-4)' }}>
      <h1 style={{ color: 'var(--color-texto)', fontSize: 'var(--esp-5)' }}>Carrito de Compras</h1>
      
      {/* Listado de ítems agregados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--esp-3)' }}>
        {items.map((item) => (
          <Card key={item.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--esp-2)' }}>
              <h3 style={{ margin: 0, color: 'var(--color-texto)' }}>{item.nombre}</h3>
              {/* Botón para remover ítem */}
              <Boton variant="danger" size="small" onClick={() => quitar(item.id)}>
                Eliminar
              </Boton>
            </div>
            
            <p style={{ margin: 'var(--esp-1) 0', color: 'var(--color-texto-secundario)' }}>
              Precio unitario: S/ {Number(item.precio).toFixed(2)}
            </p>

            {/* Selector de cantidad y subtotal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-2)', marginTop: 'var(--esp-2)' }}>
              <label htmlFor={`cant-${item.id}`} style={{ color: 'var(--color-texto)' }}>
                Cantidad:
              </label>
              <Input
                id={`cant-${item.id}`}
                type="number"
                min="1"
                value={item.cantidad}
                onChange={(e) => cambiarCantidad(item.id, parseInt(e.target.value, 10) || 1)}
                style={{ width: '70px' }}
              />
              <span style={{ fontWeight: 'bold', marginLeft: 'auto', color: 'var(--color-texto)' }}>
                Subtotal: S/ {(item.precio * item.cantidad).toFixed(2)}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Resumen del pedido y acciones globales */}
      <Card style={{ backgroundColor: 'var(--color-fondo-alt)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--esp-3)' }}>
          <span style={{ fontSize: 'var(--esp-4)', fontWeight: 'bold', color: 'var(--color-texto)' }}>Total:</span>
          <span style={{ fontSize: 'var(--esp-4)', fontWeight: 'bold', color: 'var(--color-primario)' }}>
            S/ {total.toFixed(2)}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--esp-2)', flexDirection: 'column' }}>
          <Boton variant="outline" onClick={vaciar}>
            Vaciar Carrito
          </Boton>
          <Boton variant="primary">
            Proceder al Pago
          </Boton>
        </div>
      </Card>
    </div>
  );
};

export default CarritoPage;
