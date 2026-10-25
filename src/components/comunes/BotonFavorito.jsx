/**
 * ============================================================================
 * BotonFavorito · Corazón interactivo para marcar productos favoritos
 * ----------------------------------------------------------------------------
 * - Contorno gris/translúcido si no es favorito.
 * - Relleno rojo vivo (#e11d48) si es favorito.
 * - Detiene la propagación del evento para no disparar la navegación al detalle.
 * - Si no está autenticado o no es cliente, muestra aviso suave toast.
 * ==========================================================================*/

import { useState } from "react";
import { useFavoritos } from "../../hooks/useFavoritos";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constantes";
import "./BotonFavorito.css";

export function BotonFavorito({
  productoId,
  tamano = "md",
  className = "",
  ariaLabel,
}) {
  const { esFavorito, alternarFavorito, mostrarAviso } = useFavoritos();
  const { usuario, estaAutenticado, tieneRol } = useAuth();
  const [animando, setAnimando] = useState(false);

  const esCliente = estaAutenticado && (tieneRol(ROLES.CLIENTE) || usuario?.rol === "CLIENTE");
  const activo = esFavorito(productoId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!esCliente) {
      mostrarAviso("Inicia sesión para guardar favoritos", "info");
      return;
    }

    setAnimando(true);
    setTimeout(() => setAnimando(false), 450);

    alternarFavorito(productoId).catch(() => {
      // Reversión y feedback gestionados automáticamente en FavoritosProvider
    });
  };

  const etiqueta = ariaLabel || (activo ? "Quitar de favoritos" : "Agregar a favoritos");

  return (
    <button
      type="button"
      className={`boton-favorito boton-favorito--${tamano} ${
        activo ? "boton-favorito--activo" : ""
      } ${animando ? "boton-favorito--animando" : ""} ${className}`}
      onClick={handleClick}
      aria-label={etiqueta}
      title={etiqueta}
    >
      <svg
        viewBox="0 0 24 24"
        className="boton-favorito__icono"
        fill={activo ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={activo ? "1.5" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

export default BotonFavorito;
