/**
 * ============================================================================
 * REPOSITORIO BASE · Patrón Repository / DAO
 * ----------------------------------------------------------------------------
 * Fábrica que genera el CRUD estándar para cualquier colección. Los cinco
 * repositorios del proyecto (productos, usuarios, ventas, pedidos, promociones)
 * nacen de aquí y solo agregan lo que es propio de su dominio.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ 🔌 CÓMO MIGRAR A SPRING BOOT SIN TOCAR NI UN COMPONENTE                  │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │ Fíjense que TODOS los métodos son `async` y devuelven una Promesa,       │
 * │ aunque hoy leer de localStorage sea instantáneo. Eso NO es un descuido:  │
 * │ es la decisión de diseño más importante de esta capa.                    │
 * │                                                                          │
 * │ Un componente que hoy escribe:                                           │
 * │     const productos = await productoRepository.obtenerTodos()            │
 * │                                                                          │
 * │ va a seguir escribiendo exactamente eso el día que por dentro sea:       │
 * │     const respuesta = await fetch('/api/productos')                      │
 * │     return respuesta.json()                                              │
 * │                                                                          │
 * │ Si hubiéramos hecho los métodos síncronos (`return datos`), al migrar    │
 * │ habría que reescribir CADA componente para meterle await/useEffect.      │
 * │ Pagando hoy el costo del `async`, la migración se reduce a reemplazar    │
 * │ el cuerpo de estos archivos. El contrato (la firma) no cambia.           │
 * │                                                                          │
 * │ Ejemplo de la versión futura de este mismo archivo:                      │
 * │                                                                          │
 * │   const API = import.meta.env.VITE_API_URL  // http://localhost:8080/api │
 * │                                                                          │
 * │   export function crearRepositorioBase({ recurso }) {                    │
 * │     return {                                                             │
 * │       async obtenerTodos() {                                             │
 * │         const r = await fetch(`${API}/${recurso}`)                       │
 * │         if (!r.ok) throw new Error('Error al listar')                    │
 * │         return r.json()                                                  │
 * │       },                                                                 │
 * │       async crear(datos) {                                               │
 * │         const r = await fetch(`${API}/${recurso}`, {                     │
 * │           method: 'POST',                                                │
 * │           headers: { 'Content-Type': 'application/json' },               │
 * │           body: JSON.stringify(datos),                                   │
 * │         })                                                               │
 * │         return r.json()                                                  │
 * │       },                                                                 │
 * │       // ...actualizar (PUT), eliminar (DELETE), obtenerPorId (GET /:id) │
 * │     }                                                                    │
 * │   }                                                                      │
 * └──────────────────────────────────────────────────────────────────────────┘
 * ==========================================================================*/

import { almacenamiento } from "./almacenamiento";

/**
 * Latencia simulada en milisegundos.
 *
 * Déjenla en 0 para el desarrollo normal. Súbanla a 400 un rato si quieren
 * comprobar que sus pantallas muestran bien los estados de "Cargando..."
 * antes de que llegue el backend real (donde la demora SÍ va a existir).
 */
const LATENCIA_MS = 0;

const demorar = () =>
  LATENCIA_MS > 0
    ? new Promise((resolver) => setTimeout(resolver, LATENCIA_MS))
    : Promise.resolve();

/**
 * Genera un id único legible. Ej: "prod-lx8f2a-417"
 * Cuando exista el backend, el id lo generará la base de datos y este método
 * simplemente dejará de usarse.
 */
function generarId(prefijo) {
  const tiempo = Date.now().toString(36);
  const azar = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefijo}-${tiempo}-${azar}`;
}

/**
 * Copia profunda. Evita que quien recibe los datos modifique sin querer lo que
 * está guardado (en un backend real esto pasa solo, porque los datos viajan
 * serializados por la red; aquí lo imitamos para que el comportamiento sea el
 * mismo y no aparezcan bugs raros al migrar).
 */
function clonar(valor) {
  return structuredClone
    ? structuredClone(valor)
    : JSON.parse(JSON.stringify(valor));
}

/**
 * Crea un repositorio CRUD sobre una colección guardada en localStorage.
 *
 * @param {object} config
 * @param {string} config.clave      - clave de almacenamiento (ver claves.js)
 * @param {string} config.prefijoId  - prefijo para los ids nuevos, ej. "prod"
 * @param {string} config.nombre     - nombre legible, para mensajes de error
 */
export function crearRepositorioBase({ clave, prefijoId, nombre }) {
  /** Lee la colección completa desde el almacenamiento (uso interno). */
  const leerColeccion = () => {
    const datos = almacenamiento.leer(clave, []);
    // Blindaje: si alguien dejó basura en esa clave, devolvemos lista vacía
    // en lugar de romper toda la aplicación.
    return Array.isArray(datos) ? datos : [];
  };

  /** Guarda la colección completa (uso interno). */
  const guardarColeccion = (coleccion) => {
    const exito = almacenamiento.escribir(clave, coleccion);
    if (!exito) {
      throw new Error(
        `No se pudo guardar ${nombre}. Es posible que el almacenamiento del navegador esté lleno.`,
      );
    }
  };

  return {
    /* ---------------------------------------------------------------- LEER */

    /**
     * Devuelve todos los registros.
     * @returns {Promise<object[]>}
     */
    async obtenerTodos() {
      await demorar();
      return clonar(leerColeccion());
    },

    /**
     * Busca un registro por su id.
     * @returns {Promise<object|null>} null si no existe.
     */
    async obtenerPorId(id) {
      await demorar();
      const encontrado = leerColeccion().find((item) => item.id === id);
      return encontrado ? clonar(encontrado) : null;
    },

    /**
     * Devuelve los registros que cumplan una condición.
     * @param {(item: object) => boolean} condicion
     */
    async obtenerDonde(condicion) {
      await demorar();
      return clonar(leerColeccion().filter(condicion));
    },

    /** Cuenta cuántos registros hay. @returns {Promise<number>} */
    async contar() {
      await demorar();
      return leerColeccion().length;
    },

    /* -------------------------------------------------------------- ESCRIBIR */

    /**
     * Crea un registro nuevo. El id y la fecha de creación se generan solos.
     * @param {object} datos
     * @returns {Promise<object>} el registro creado, ya con su id.
     */
    async crear(datos) {
      await demorar();
      const coleccion = leerColeccion();

      const nuevo = {
        ...clonar(datos),
        // Si quien llama ya trajo un id (por ejemplo al importar data), se
        // respeta; si no, se genera uno.
        id: datos?.id ?? generarId(prefijoId),
        creadoEn: datos?.creadoEn ?? new Date().toISOString(),
      };

      if (coleccion.some((item) => item.id === nuevo.id)) {
        throw new Error(`Ya existe un registro en ${nombre} con id "${nuevo.id}".`);
      }

      coleccion.push(nuevo);
      guardarColeccion(coleccion);
      return clonar(nuevo);
    },

    /**
     * Actualiza un registro existente. Es una actualización PARCIAL: solo se
     * pisan los campos que vengan en `cambios`, el resto se mantiene.
     *
     * @param {string} id
     * @param {object} cambios
     * @returns {Promise<object>} el registro ya actualizado.
     */
    async actualizar(id, cambios) {
      await demorar();
      const coleccion = leerColeccion();
      const indice = coleccion.findIndex((item) => item.id === id);

      if (indice === -1) {
        throw new Error(`No se encontró el registro "${id}" en ${nombre}.`);
      }

      const actualizado = {
        ...coleccion[indice],
        ...clonar(cambios),
        id: coleccion[indice].id, // el id nunca se cambia
        actualizadoEn: new Date().toISOString(),
      };

      coleccion[indice] = actualizado;
      guardarColeccion(coleccion);
      return clonar(actualizado);
    },

    /**
     * Elimina un registro.
     * @returns {Promise<boolean>} true si se eliminó.
     */
    async eliminar(id) {
      await demorar();
      const coleccion = leerColeccion();
      const restantes = coleccion.filter((item) => item.id !== id);

      if (restantes.length === coleccion.length) {
        throw new Error(`No se encontró el registro "${id}" en ${nombre}.`);
      }

      guardarColeccion(restantes);
      return true;
    },

    /**
     * Reemplaza TODA la colección de un golpe.
     * Úsenlo solo para sembrar datos o para operaciones masivas (por ejemplo,
     * descontar el stock de varios productos en una sola escritura).
     */
    async reemplazarTodos(coleccion) {
      await demorar();
      if (!Array.isArray(coleccion)) {
        throw new Error(`reemplazarTodos(${nombre}) espera un arreglo.`);
      }
      guardarColeccion(clonar(coleccion));
      return clonar(coleccion);
    },

    /* ------------------------------------------------------------- INTERNOS */
    /* Estos dos son síncronos a propósito: los usan los propios repositorios
       para componer operaciones de dominio (ver productoRepository). No los
       llamen desde componentes. */
    _leerColeccion: leerColeccion,
    _guardarColeccion: guardarColeccion,
    _generarId: () => generarId(prefijoId),
  };
}
