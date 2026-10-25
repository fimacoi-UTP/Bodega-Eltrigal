import { useContext } from "react";
import { FavoritosContext } from "../context/FavoritosContext";

export function useFavoritos() {
  const contexto = useContext(FavoritosContext);

  if (contexto === null) {
    throw new Error(
      "useFavoritos() debe usarse dentro de <FavoritosProvider>. " +
        "Revisa que src/App.jsx envuelva la aplicación con el provider.",
    );
  }

  return contexto;
}

export default useFavoritos;
