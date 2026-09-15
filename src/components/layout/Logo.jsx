/**
 * Logo · Marca de la bodega (espiga de trigo + nombre).
 * SVG en línea para que se pinte con los tokens de color y no dependa de
 * ningún archivo de imagen.
 */
import { Link } from "react-router-dom";
import { clases } from "../../utils/formato";
import { RUTAS } from "../../routes/rutas";
import "./Logo.css";

export function Logo({
  /** sm | md */
  tamano = "md",
  /** Oculta el texto y deja solo la espiga (para el sidebar plegado). */
  soloIcono = false,
  /** A dónde lleva el logo al hacer clic. */
  destino = RUTAS.INICIO,
  className,
  /** El resto (onClick, etc.) se reenvía al <Link>. */
  ...props
}) {
  return (
    <Link
      to={destino}
      className={clases("logo", `logo--${tamano}`, className)}
      aria-label="Bodega El Trigal · Inicio"
      {...props}
    >
      <span className="logo__marca" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" className="logo__svg">
          {/* Tallo */}
          <path
            d="M12 21V8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Granos de la espiga, en pares */}
          <path d="M12 10c-2.6 0-4.1-1.5-4.1-3.8C10.5 6.2 12 7.7 12 10Z" fill="currentColor" />
          <path d="M12 10c2.6 0 4.1-1.5 4.1-3.8C13.5 6.2 12 7.7 12 10Z" fill="currentColor" />
          <path d="M12 15c-2.6 0-4.1-1.5-4.1-3.8C10.5 11.2 12 12.7 12 15Z" fill="currentColor" opacity="0.75" />
          <path d="M12 15c2.6 0 4.1-1.5 4.1-3.8C13.5 11.2 12 12.7 12 15Z" fill="currentColor" opacity="0.75" />
        </svg>
      </span>

      {!soloIcono && (
        <span className="logo__texto">
          <span className="logo__nombre">El Trigal</span>
          <span className="logo__lema">Bodega · Piura</span>
        </span>
      )}
    </Link>
  );
}

export default Logo;
