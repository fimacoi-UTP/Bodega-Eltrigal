/**
 * ============================================================================
 * useTema · Hook para Modo Día / Noche (El Trigal Design System)
 * ----------------------------------------------------------------------------
 * Gestiona el atributo `data-theme` en `<html>` (document.documentElement)
 * y persiste la preferencia en `localStorage` bajo la clave oficial
 * `trigal:tema` ("light" | "dark"), siempre protegido con try/catch.
 * ==========================================================================*/

import { useState, useEffect, useCallback } from "react";
import { CLAVES_OFICIALES } from "../utils/limpiezaStorage";

const CLAVE_TEMA = CLAVES_OFICIALES.TEMA || "trigal:tema";

function obtenerTemaInicial() {
  if (typeof window === "undefined") return "light";

  try {
    const guardado = window.localStorage.getItem(CLAVE_TEMA);
    if (guardado === "dark" || guardado === "light") {
      return guardado;
    }
  } catch {
    /* ignore storage error */
  }

  const atributoActual = document.documentElement.getAttribute("data-theme");
  if (atributoActual === "dark" || atributoActual === "light") {
    return atributoActual;
  }

  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    /* ignore matchMedia error */
  }

  return "light";
}

export function useTema() {
  const [tema, setTema] = useState(obtenerTemaInicial);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CLAVE_TEMA);
      if (guardado === "dark" || guardado === "light") {
        document.documentElement.setAttribute("data-theme", guardado);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const alternarTema = useCallback(() => {
    setTema((actual) => {
      const siguiente = actual === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", siguiente);
      try {
        window.localStorage.setItem(CLAVE_TEMA, siguiente);
      } catch {
        /* ignore storage error */
      }
      return siguiente;
    });
  }, []);

  return {
    tema,
    esOscuro: tema === "dark",
    alternarTema,
  };
}

export default useTema;

