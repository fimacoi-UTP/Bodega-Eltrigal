/**
 * Logo · Marca de la bodega (isotipo espiga 🌾 en cuadro redondeado con
 * degradado terracota + "El Trigal / BODEGA · PIURA").
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
        <span className="logo__espiga">🌾</span>
      </span>

      {!soloIcono && (
        <span className="logo__texto">
          <span className="logo__nombre serif">El Trigal</span>
          <span className="logo__lema">BODEGA · PIURA</span>
        </span>
      )}
    </Link>
  );
}

export default Logo;
