/**
 * ============================================================================
 * UTILIDADES DEL MÓDULO DE INVENTARIO Y PRODUCTOS
 * ----------------------------------------------------------------------------
 * Lógica compartida por InventarioPage y ProductosPage. Son funciones puras:
 * no tocan el almacenamiento ni el estado de React, solo reciben datos y
 * devuelven datos. Eso las hace fáciles de razonar y de reutilizar.
 * ==========================================================================*/

import { UMBRAL_STOCK_BAJO } from "../../../constantes";
import { normalizarTexto } from "../../../utils/formato";

/** Claves de estado de stock. */
export const ESTADO_STOCK = {
  AGOTADO: "AGOTADO",
  BAJO: "BAJO",
  DISPONIBLE: "DISPONIBLE",
};

/**
 * Devuelve a partir de qué cantidad consideramos que a este producto se le
 * está acabando el stock.
 *
 * Precedencia:
 *   1. El `stockMinimo` propio del producto, si tiene uno válido.
 *      (No es lo mismo reponer arroz que balones de gas.)
 *   2. Si no lo tiene, la constante global UMBRAL_STOCK_BAJO.
 *
 * Toda la app pregunta por aquí, así que si mañana cambia el criterio se
 * cambia en un solo sitio.
 */
export function umbralDe(producto) {
  const minimo = Number(producto?.stockMinimo);
  return Number.isFinite(minimo) && minimo > 0 ? minimo : UMBRAL_STOCK_BAJO;
}

/**
 * Clasifica el stock de un producto para poder pintarlo.
 *
 * @returns {{ clave: string, etiqueta: string, variante: string }}
 *          `variante` está pensada para pasarla directo a <Badge variante={...}>
 */
export function estadoStock(producto) {
  const stock = Number(producto?.stock) || 0;

  if (stock <= 0) {
    return { clave: ESTADO_STOCK.AGOTADO, etiqueta: "Agotado", variante: "peligro" };
  }

  if (stock <= umbralDe(producto)) {
    return { clave: ESTADO_STOCK.BAJO, etiqueta: "Stock bajo", variante: "advertencia" };
  }

  return { clave: ESTADO_STOCK.DISPONIBLE, etiqueta: "Disponible", variante: "exito" };
}

/** ¿Este producto necesita reposición (bajo o agotado)? */
export function necesitaReposicion(producto) {
  return estadoStock(producto).clave !== ESTADO_STOCK.DISPONIBLE;
}

/**
 * Filtra la lista de productos del dashboard.
 *
 * ⚠️ OJO: aquí NO usamos `buscar()` ni `filtrarPorCategoria()` de
 * useInventario(), aunque existan. Esos dos trabajan sobre `productosActivos`,
 * es decir, esconden los productos desactivados — perfecto para la tienda web,
 * pero inservible para el dashboard, donde justamente hay que poder ver un
 * producto desactivado para volver a activarlo.
 *
 * Por eso filtramos sobre `productos` (la lista completa) reutilizando
 * `normalizarTexto` para que la búsqueda ignore tildes y mayúsculas.
 *
 * @param {object[]} productos
 * @param {object} filtros
 * @param {string} [filtros.texto]        busca en nombre, marca y categoría
 * @param {string} [filtros.categoria]    "" = todas
 * @param {boolean} [filtros.soloBajoStock]
 * @param {string} [filtros.estadoActivo] "" | "activos" | "inactivos"
 */
export function filtrarProductos(productos, filtros = {}) {
  const { texto = "", categoria = "", soloBajoStock = false, estadoActivo = "" } = filtros;
  const consulta = normalizarTexto(texto).trim();

  return productos.filter((producto) => {
    if (categoria && producto.categoria !== categoria) return false;
    if (soloBajoStock && !necesitaReposicion(producto)) return false;

    if (estadoActivo === "activos" && producto.activo === false) return false;
    if (estadoActivo === "inactivos" && producto.activo !== false) return false;

    if (consulta) {
      const coincide = [producto.nombre, producto.marca, producto.categoria]
        .map(normalizarTexto)
        .some((campo) => campo.includes(consulta));
      if (!coincide) return false;
    }

    return true;
  });
}

/**
 * Números de cabecera del inventario.
 * Se calcula en una sola pasada sobre la lista.
 */
export function resumirInventario(productos) {
  let bajos = 0;
  let agotados = 0;
  let unidades = 0;
  let valor = 0;

  for (const producto of productos) {
    const stock = Number(producto.stock) || 0;
    const precio = Number(producto.precio) || 0;

    unidades += stock;
    valor += stock * precio;

    const { clave } = estadoStock(producto);
    if (clave === ESTADO_STOCK.AGOTADO) agotados += 1;
    else if (clave === ESTADO_STOCK.BAJO) bajos += 1;
  }

  return { total: productos.length, bajos, agotados, unidades, valor };
}

/**
 * Pluraliza la unidad de un producto para que los textos se lean bien.
 *   pluralizar(1, 'bolsa')  → 'bolsa'
 *   pluralizar(4, 'bolsa')  → 'bolsas'
 *   pluralizar(4, 'unidad') → 'unidades'
 *   pluralizar(2, 'balón')  → 'balones'   (se le quita la tilde, como en español)
 */
export function pluralizar(cantidad, palabra) {
  if (!palabra) return "";
  if (Number(cantidad) === 1) return palabra;

  // Abreviaturas de medida: no se pluralizan (4 kg, no "4 kges").
  if (/^(kg|g|mg|ml|l|lt)$/i.test(palabra)) return palabra;

  // "balón" → "balones", "porción" → "porciones"
  const base = palabra.replace(/ó(n)$/i, "o$1");

  return /[aeiou]$/i.test(base) ? `${base}s` : `${base}es`;
}

/** Unidades de medida sugeridas al crear un producto. */
export const UNIDADES = [
  "unidad",
  "bolsa",
  "botella",
  "lata",
  "paquete",
  "caja",
  "frasco",
  "barra",
  "balón",
  "porción",
  "kg",
  "litro",
];

/** Colores sugeridos para la tarjeta del producto (tomados de la paleta). */
export const COLORES_SUGERIDOS = [
  "#E9A08A",
  "#F0B429",
  "#F5C94F",
  "#45B579",
  "#A8E5C2",
  "#2563EB",
  "#B0441F",
  "#8F3719",
  "#D5CCC0",
  "#F4F0EA",
];
