/**
 * ============================================================================
 * FavoritosProvider · Estado global de productos favoritos
 * ----------------------------------------------------------------------------
 * Mantiene en memoria el conjunto (Set) de IDs de productos marcados como
 * favoritos por el cliente autenticado.
 *
 * Implementa mutaciones optimistas para alternar el corazón al instante,
 * sincronizando en segundo plano con el backend y revirtiendo en caso de fallo.
 * ==========================================================================*/

import { useState, useEffect, useCallback, useMemo } from "react";
import { FavoritosContext } from "./FavoritosContext";
import { favoritosApi } from "../api/favoritosApi";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../constantes";
import { Toast } from "../components/ui";

export function FavoritosProvider({ children }) {
  const { usuario, estaAutenticado, tieneRol } = useAuth();
  const esCliente = estaAutenticado && (tieneRol(ROLES.CLIENTE) || usuario?.rol === "CLIENTE");

  const [favoritosSet, setFavoritosSet] = useState(() => new Set());
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState({ visible: false, mensaje: "", variante: "info" });

  const mostrarAviso = useCallback((mensaje, variante = "info") => {
    setAviso({ visible: true, mensaje, variante });
  }, []);

  const ocultarAviso = useCallback(() => {
    setAviso((prev) => ({ ...prev, visible: false }));
  }, []);

  // Carga inicial y sincronización al cambiar de usuario
  useEffect(() => {
    let cancelado = false;

    if (!esCliente) {
      return;
    }

    async function cargarFavoritos() {
      setCargando(true);
      try {
        const data = await favoritosApi.listar();
        if (cancelado) return;

        const ids = new Set();
        if (Array.isArray(data)) {
          for (const item of data) {
            const rawId =
              item?.productoId ??
              item?.idProducto ??
              item?.id ??
              (typeof item === "object" ? item?.producto?.id : item);

            if (rawId != null) {
              ids.add(String(rawId));
            }
          }
        }
        setFavoritosSet(ids);
      } catch (err) {
        if (!cancelado) {
          console.error("[El Trigal] Error al cargar favoritos:", err);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarFavoritos();

    return () => {
      cancelado = true;
      setFavoritosSet(new Set());
    };
  }, [esCliente, usuario?.id]);

  // Si no es cliente, el set expuesto se considera vacío
  const idsActivos = useMemo(() => {
    return esCliente ? favoritosSet : new Set();
  }, [esCliente, favoritosSet]);

  /**
   * Consulta si un producto específico está en la lista de favoritos.
   */
  const esFavorito = useCallback(
    (productoId) => {
      if (!productoId) return false;
      return idsActivos.has(String(productoId));
    },
    [idsActivos],
  );

  /**
   * Alterna el estado de favorito de forma optimista con reversión en caso de error.
   */
  const alternarFavorito = useCallback(
    async (productoId) => {
      if (!productoId) return false;
      const idStr = String(productoId);
      const eraFavorito = idsActivos.has(idStr);

      // 1) Actualización optimista inmediata
      setFavoritosSet((prev) => {
        const siguiente = new Set(prev);
        if (eraFavorito) {
          siguiente.delete(idStr);
        } else {
          siguiente.add(idStr);
        }
        return siguiente;
      });

      // 2) Sincronización en segundo plano con el backend
      try {
        if (eraFavorito) {
          await favoritosApi.quitar(idStr);
        } else {
          await favoritosApi.agregar(idStr);
        }
        return !eraFavorito;
      } catch (err) {
        console.error("[El Trigal] Error al sincronizar favorito:", err);

        // 3) Reversión por fallo
        setFavoritosSet((prev) => {
          const revertido = new Set(prev);
          if (eraFavorito) {
            revertido.add(idStr);
          } else {
            revertido.delete(idStr);
          }
          return revertido;
        });

        mostrarAviso("No se pudo actualizar tu lista de favoritos. Inténtalo de nuevo.", "peligro");
        throw err;
      }
    },
    [idsActivos, mostrarAviso],
  );

  const valor = useMemo(
    () => ({
      favoritosSet: idsActivos,
      esFavorito,
      alternarFavorito,
      cargando,
      mostrarAviso,
    }),
    [idsActivos, esFavorito, alternarFavorito, cargando, mostrarAviso],
  );

  return (
    <FavoritosContext.Provider value={valor}>
      {children}
      <Toast
        visible={aviso.visible}
        onCerrar={ocultarAviso}
        variante={aviso.variante}
        duracion={3000}
      >
        {aviso.mensaje}
      </Toast>
    </FavoritosContext.Provider>
  );
}

export default FavoritosProvider;
