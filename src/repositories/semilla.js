/**
 * ============================================================================
 * SEMILLA DE DATOS (seed)
 * ----------------------------------------------------------------------------
 * Al arrancar la aplicación revisamos si el navegador ya tiene datos:
 *
 *   · Si NO hay nada  → copiamos los JSON de src/data/ a localStorage.
 *   · Si YA hay datos → no tocamos nada, para no borrar lo que el usuario
 *                       creó en sesiones anteriores.
 *
 * Ese es el equilibrio que buscamos: los datos PERSISTEN entre sesiones, pero
 * se pueden RESETEAR en cualquier momento borrando el localStorage.
 *
 * 🔌 Con Spring Boot esto desaparece del frontend: la data semilla pasará a ser
 *    un data.sql / import.sql o un CommandLineRunner en el backend.
 * ==========================================================================*/

import productosSemilla from "../data/productos.json";
import usuariosSemilla from "../data/usuarios.json";
import { almacenamiento } from "./almacenamiento";
import { CLAVES, VERSION_DATOS, TODAS_LAS_CLAVES } from "./claves";

/** Siembra una clave solo si está vacía. */
function sembrarSiFalta(clave, datos) {
  if (almacenamiento.existe(clave)) return false;
  almacenamiento.escribir(clave, datos);
  return true;
}

/**
 * Prepara los datos de la aplicación. Se llama UNA vez, en src/main.jsx,
 * antes de renderizar React.
 *
 * @param {object} [opciones]
 * @param {boolean} [opciones.forzar] - true reescribe todo con la semilla,
 *                                      descartando los cambios locales.
 */
export function inicializarDatos({ forzar = false } = {}) {
  const versionGuardada = almacenamiento.leer(CLAVES.VERSION_DATOS, null);

  // Si subimos VERSION_DATOS en claves.js (porque cambió la forma de los JSON),
  // resembramos solo para que a nadie del grupo le quede data vieja e incompatible.
  const versionDesactualizada = versionGuardada !== VERSION_DATOS;

  if (forzar || versionDesactualizada) {
    almacenamiento.escribir(CLAVES.PRODUCTOS, productosSemilla);
    almacenamiento.escribir(CLAVES.USUARIOS, usuariosSemilla);
    // Las colecciones transaccionales se preservan si ya existen, a menos que sea forzado.
    if (forzar || !almacenamiento.existe(CLAVES.VENTAS)) almacenamiento.escribir(CLAVES.VENTAS, []);
    if (forzar || !almacenamiento.existe(CLAVES.PEDIDOS)) almacenamiento.escribir(CLAVES.PEDIDOS, []);
    if (forzar || !almacenamiento.existe(CLAVES.PROMOCIONES)) almacenamiento.escribir(CLAVES.PROMOCIONES, []);
    almacenamiento.escribir(CLAVES.VERSION_DATOS, VERSION_DATOS);

    if (import.meta.env.DEV) {
      console.info(
        `[El Trigal] Datos sembrados (${forzar ? "forzado" : `versión ${VERSION_DATOS}`}): ` +
          `${productosSemilla.length} productos, ${usuariosSemilla.length} usuarios.`,
      );
    }
    return;
  }

  // Arranque normal: solo completamos lo que falte (por ejemplo, si alguien
  // borró a mano una sola clave desde las DevTools).
  sembrarSiFalta(CLAVES.PRODUCTOS, productosSemilla);
  sembrarSiFalta(CLAVES.USUARIOS, usuariosSemilla);
  sembrarSiFalta(CLAVES.VENTAS, []);
  sembrarSiFalta(CLAVES.PEDIDOS, []);
  sembrarSiFalta(CLAVES.PROMOCIONES, []);
}

/**
 * Borra TODO y vuelve a dejar los datos como recién clonado el repo.
 * Útil cuando quedan datos raros de tanto probar.
 *
 * Desde la consola del navegador:  window.elTrigal.reiniciarDatos()
 */
export function reiniciarDatos() {
  TODAS_LAS_CLAVES.forEach((clave) => almacenamiento.eliminar(clave));
  inicializarDatos({ forzar: true });
  console.info("[El Trigal] Datos reiniciados. Recarga la página (F5).");
}
