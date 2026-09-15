/**
 * ============================================================================
 * ALMACENAMIENTO · El ÚNICO archivo del proyecto que conoce `localStorage`
 * ----------------------------------------------------------------------------
 * ⚠️ REGLA DEL PROYECTO: ningún componente, página, hook o contexto puede
 * escribir `localStorage.getItem(...)`. Todo pasa por los repositorios, y los
 * repositorios pasan por aquí.
 *
 * ¿Por qué tanto escándalo por un solo archivo?
 * Porque cuando migremos al backend Spring Boot, `localStorage` desaparece.
 * Si 20 componentes lo llaman directo, hay que tocar 20 archivos. Si solo lo
 * llama este archivo, se cambia UNO.
 *
 * Además, aquí se centraliza el manejo de errores: localStorage falla de
 * verdad en situaciones reales (modo incógnito de Safari, cuota llena,
 * cookies bloqueadas). En vez de reventar la app, degradamos con elegancia.
 * ==========================================================================*/

/**
 * ¿El navegador nos deja usar localStorage?
 * No basta con preguntar si existe: en modo incógnito puede existir y lanzar
 * excepción al escribir. Por eso lo probamos de verdad, una sola vez.
 */
const almacenamientoDisponible = (() => {
  try {
    const prueba = "__trigal_prueba__";
    window.localStorage.setItem(prueba, "1");
    window.localStorage.removeItem(prueba);
    return true;
  } catch {
    console.warn(
      "[El Trigal] localStorage no está disponible. La app funcionará, " +
        "pero los datos NO se guardarán al recargar la página.",
    );
    return false;
  }
})();

/**
 * Plan B: si no hay localStorage, guardamos en memoria. La app sigue andando
 * durante la sesión; solo se pierde todo al recargar. Mejor que una pantalla
 * en blanco en la exposición del proyecto.
 */
const memoriaTemporal = new Map();

export const almacenamiento = {
  /** ¿Estamos persistiendo de verdad, o solo en memoria? */
  get esPersistente() {
    return almacenamientoDisponible;
  },

  /**
   * Lee y deserializa un valor.
   * @param {string} clave
   * @param {*} valorPorDefecto - qué devolver si no existe o está corrupto.
   */
  leer(clave, valorPorDefecto = null) {
    try {
      const crudo = almacenamientoDisponible
        ? window.localStorage.getItem(clave)
        : (memoriaTemporal.get(clave) ?? null);

      if (crudo === null || crudo === undefined) return valorPorDefecto;
      return JSON.parse(crudo);
    } catch (error) {
      // JSON corrupto (alguien editó el localStorage a mano, por ejemplo).
      // No tumbamos la app: devolvemos el valor por defecto y avisamos.
      console.error(`[El Trigal] No se pudo leer "${clave}":`, error);
      return valorPorDefecto;
    }
  },

  /**
   * Serializa y guarda un valor.
   * @returns {boolean} true si se guardó correctamente.
   */
  escribir(clave, valor) {
    try {
      const crudo = JSON.stringify(valor);
      if (almacenamientoDisponible) {
        window.localStorage.setItem(clave, crudo);
      } else {
        memoriaTemporal.set(clave, crudo);
      }
      return true;
    } catch (error) {
      // Caso típico: QuotaExceededError (se llenó el almacenamiento).
      console.error(`[El Trigal] No se pudo guardar "${clave}":`, error);
      return false;
    }
  },

  /** Borra una clave. */
  eliminar(clave) {
    try {
      if (almacenamientoDisponible) {
        window.localStorage.removeItem(clave);
      } else {
        memoriaTemporal.delete(clave);
      }
      return true;
    } catch (error) {
      console.error(`[El Trigal] No se pudo eliminar "${clave}":`, error);
      return false;
    }
  },

  /** ¿Existe esta clave? (se usa para saber si hay que sembrar). */
  existe(clave) {
    try {
      return almacenamientoDisponible
        ? window.localStorage.getItem(clave) !== null
        : memoriaTemporal.has(clave);
    } catch {
      return false;
    }
  },
};
