/**
 * ============================================================================
 * CLAVES DE ALMACENAMIENTO
 * ----------------------------------------------------------------------------
 * Nombres de las "cajas" donde se guarda cada colección en localStorage.
 * Todas llevan el prefijo `trigal:` para no chocar con otras apps que el
 * navegador tenga abiertas en localhost.
 * ==========================================================================*/

const PREFIJO = "trigal";

export const CLAVES = {
  PRODUCTOS: `${PREFIJO}:productos`,
  USUARIOS: `${PREFIJO}:usuarios`,
  VENTAS: `${PREFIJO}:ventas`,
  PEDIDOS: `${PREFIJO}:pedidos`,
  PROMOCIONES: `${PREFIJO}:promociones`,
  SESION: `${PREFIJO}:sesion`,
  VERSION_DATOS: `${PREFIJO}:version`,
};

/**
 * Versión del esquema de datos sembrados.
 *
 * Si cambian la forma de los JSON semilla (por ejemplo, le agregan un campo
 * nuevo a los productos), SUBAN este número. Al arrancar, el sistema detecta
 * que la versión guardada es vieja y vuelve a sembrar, así a nadie del grupo
 * le queda data desactualizada en su navegador.
 */
export const VERSION_DATOS = 1;

/** Lista de todas las claves, para poder limpiar todo de un golpe. */
export const TODAS_LAS_CLAVES = Object.values(CLAVES);
