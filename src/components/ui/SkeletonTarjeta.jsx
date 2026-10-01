/**
 * ============================================================================
 * SkeletonTarjeta · Tarjeta esqueleto con animación Shimmer
 * ----------------------------------------------------------------------------
 * Replica exactamente la estructura, márgenes y proporciones de TarjetaProducto
 * para mostrar durante la carga del catálogo sin saltos de layout (CLS = 0).
 * ==========================================================================*/

import "./SkeletonTarjeta.css";

export function SkeletonTarjeta({ className = "" }) {
  return (
    <article
      className={`skeleton-tarjeta ${className}`.trim()}
      aria-hidden="true"
    >
      {/* Visual / Imagen */}
      <div className="skeleton-tarjeta__visual skeleton-shimmer">
        <div className="skeleton-tarjeta__insignia" />
      </div>

      {/* Cuerpo */}
      <div className="skeleton-tarjeta__cuerpo">
        <div className="skeleton-tarjeta__marca skeleton-shimmer" />
        <div className="skeleton-tarjeta__titulo-linea1 skeleton-shimmer" />
        <div className="skeleton-tarjeta__titulo-linea2 skeleton-shimmer" />

        <div className="skeleton-tarjeta__precio-fila">
          <div className="skeleton-tarjeta__precio skeleton-shimmer" />
          <div className="skeleton-tarjeta__unidad skeleton-shimmer" />
        </div>
      </div>

      {/* Pie / Botón */}
      <div className="skeleton-tarjeta__pie">
        <div className="skeleton-tarjeta__boton skeleton-shimmer" />
      </div>
    </article>
  );
}

export default SkeletonTarjeta;
