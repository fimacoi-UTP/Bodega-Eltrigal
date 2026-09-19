import React from 'react';
import { Card } from '../../components/ui';

/**
 * Vista de la ubicación de la tienda (/ubicacion) con mapa embebido.
 */
export const UbicacionPage = () => {
  return (
    <div style={{ padding: 'var(--esp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--esp-4)' }}>
      <Card>
        <h1 style={{ color: 'var(--color-primario)', marginBottom: 'var(--esp-2)' }}>Nuestra Ubicación</h1>
        <p style={{ color: 'var(--color-texto)', marginBottom: 'var(--esp-3)' }}>
          <strong>Dirección:</strong> Av. El Trigal 123, Urbana Piura, Perú
        </p>
        
        {/* Contenedor responsivo para el iframe de Google Maps */}
        <div style={{ width: '100%', height: '300px', borderRadius: 'var(--radio-md)', overflow: 'hidden' }}>
          <iframe
            title="Mapa Bodega El Trigal"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3973.535803273822!2d-80.6328!3d-5.1944!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwMTEnNDAuMCJTIDgwwrAzNyc1OC4xIlc!5e0!3m2!1ses!2spe!4v1620000000000!5m2!1ses!2spe"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Card>
    </div>
  );
};

export default UbicacionPage;
