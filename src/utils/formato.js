/**
 * ============================================================================
 * UTILIDADES DE FORMATO
 * ----------------------------------------------------------------------------
 * Funciones chiquitas que TODOS los módulos van a necesitar. Úsenlas en lugar
 * de escribir `"S/ " + precio.toFixed(2)` cada uno a su manera: así los precios
 * y fechas se ven igual en toda la plataforma.
 * ==========================================================================*/

import { MONEDA } from "../constantes";

/** Formateador de soles reutilizado (crear Intl.NumberFormat es costoso). */
const formateadorSoles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: MONEDA.codigo,
  minimumFractionDigits: 2,
});

/**
 * Espacio duro (non-breaking space, U+00A0) que Intl mete entre el símbolo y
 * el número.
 *
 * Lo construimos con fromCharCode en vez de escribirlo dentro de una expresión
 * regular a propósito: un espacio duro suelto en el código fuente es invisible
 * al leerlo, se confunde con un espacio normal y es una fuente clásica de bugs
 * difíciles de encontrar.
 */
const ESPACIO_DURO = new RegExp(String.fromCharCode(160), "g");

/**
 * Convierte un número a precio en soles.
 * @example formatearSoles(24.9) // "S/ 24.90"
 */
export function formatearSoles(monto) {
  const numero = Number(monto);
  if (!Number.isFinite(numero)) return `${MONEDA.simbolo} 0.00`;

  // Intl separa el símbolo con un espacio duro; lo cambiamos por uno normal
  // para que las búsquedas y comparaciones de texto no fallen sin razón.
  return formateadorSoles.format(numero).replace(ESPACIO_DURO, " ");
}

/**
 * Fecha legible en formato peruano.
 * @example formatearFecha('2026-09-15T10:30:00.000Z') // "15/09/2026"
 */
export function formatearFecha(fechaISO, { conHora = false } = {}) {
  if (!fechaISO) return "—";
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return "—";

  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/**
 * Fecha larga, para cabeceras y detalles.
 * @example formatearFechaLarga('2026-09-15') // "15 de septiembre de 2026"
 */
export function formatearFechaLarga(fechaISO) {
  if (!fechaISO) return "—";
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return "—";

  return fecha.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Quita tildes y pasa a minúsculas. Sirve para buscar productos sin que el
 * acento estorbe ("azucar" debe encontrar "Azúcar").
 */
export function normalizarTexto(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Iniciales de un nombre, para los avatares. @example "Rosa Chero" → "RC" */
export function obtenerIniciales(nombre) {
  const partes = String(nombre ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

/** Une clases condicionales sin ensuciar el JSX con ternarios. */
export function clases(...valores) {
  return valores.filter(Boolean).join(" ");
}
