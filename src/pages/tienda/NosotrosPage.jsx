import React from 'react';
import { Card } from '../../components/ui';

/**
 * Vista de la página de historia de la bodega (/nosotros).
 */
export const NosotrosPage = () => {
  return (
    <div style={{ padding: 'var(--esp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--esp-4)' }}>
      <Card>
        <h1 style={{ color: 'var(--color-primario)', marginBottom: 'var(--esp-3)' }}>Sobre Nosotros</h1>
        <p style={{ color: 'var(--color-texto)', lineHeight: '1.6', marginBottom: 'var(--esp-2)' }}>
          La <strong>Bodega El Trigal</strong> fue fundada el 10 de enero de 1994. Nacimos como un emprendimiento familiar con la visión de abastecer y brindar la mejor atención a nuestros vecinos de Piura.
        </p>
        <p style={{ color: 'var(--color-texto)', lineHeight: '1.6' }}>
          Con más de 30 años de trayectoria ininterrumpida en nuestra urbanización, nos hemos consolidado gracias a la confianza de la comunidad, garantizando productos frescos, de alta calidad y un trato cálido y cercano.
        </p>
      </Card>
    </div>
  );
};

export default NosotrosPage;
