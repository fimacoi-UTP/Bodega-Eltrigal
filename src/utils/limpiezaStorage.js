/**
 * ============================================================================
 * LIMPIEZA DE ALMACENAMIENTO (Storage Sanitizer) · Bodega El Trigal
 * ============================================================================
 * Audita y purga claves de localStorage obsoletas o muertas acumuladas durante
 * el desarrollo, preservando rigurosamente las claves oficiales y los datos de
 * terceros.
 * ==========================================================================*/

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 1. CLAVES OFICIALES / VIGENTES DE LA APLICACIÓN
 * ────────────────────────────────────────────────────────────────────────────
 * Todas las claves oficiales utilizan el prefijo de namespace "trigal:".
 */
export const CLAVES_OFICIALES = {
  // Autenticación y sesión
  TOKEN: "trigal:token",                     // JWT Bearer token devuelto por Spring Boot
  USUARIO: "trigal:usuario",                 // Perfil del usuario activo en sesión

  // Carrito de compras
  CARRITO: "trigal:carrito",                 // Array de productos en el carrito
  CARRITO_DUENO: "trigal:carrito_dueno",     // ID del usuario o "invitado" dueño del carrito

  // Preferencias de usuario
  SONIDO_PEDIDOS: "trigal:sonido_pedidos",   // Booleano de alertas sonoras en Dashboard
  TEMA: "trigal:tema",                       // Preferencia de modo claro/oscuro ("light" | "dark")
  COOKIES_ACEPTADAS: "trigal:cookies-aceptadas", // Consentimiento de cookies en la tienda web
  NOTIF_VISTA: "trigal:notif-vista",         // Estado de visualización del popup de notificaciones

  // Colecciones y control de esquema (Repositorios / Semilla)
  VERSION_DATOS: "trigal:version",           // Control de versión de migración de datos
  PRODUCTOS: "trigal:productos",             // Catálogo local
  USUARIOS: "trigal:usuarios",               // Usuarios locales
  VENTAS: "trigal:ventas",                   // Historial de ventas POS
  PEDIDOS: "trigal:pedidos",                 // Pedidos locales
  PROMOCIONES: "trigal:promociones",         // Promociones locales
  SESION: "trigal:sesion",                   // Sesión en capa repositorio
};

/** Set para comprobación O(1) de claves oficiales */
export const SET_CLAVES_OFICIALES = new Set(Object.values(CLAVES_OFICIALES));

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 2. CLAVES OBSOLETAS CONOCIDAS (Deprecadas durante el desarrollo)
 * ────────────────────────────────────────────────────────────────────────────
 */
export const CLAVES_OBSOLETAS_CONOCIDAS = [
  // Carrito antiguo (sin namespace o en inglés)
  "carrito",
  "cart",
  "trigal:carrito_usuario",
  "carrito_dueno",
  "cart_user",
  "carrito_items",
  "temp_cart",

  // Tokens y sesiones obsoletos o sin prefijo
  "token",
  "auth_token",
  "jwt",
  "access_token",
  "usuario",
  "user",
  "user_session",
  "auth_user",
  "sesion",

  // Preferencias y flags viejos
  "sonido_pedidos",
  "sonidoHabilitado",
  "sound_notifications",
  "pedidos_notificados",
  "pedidos_vistos",
  "__trigal_prueba__",
  "checkout_temp",
];

/** Prefijos propios de la aplicación permitidos para auditoría */
const PREFIJOS_PROPIOS = ["trigal:", "eltrigal:"];

/**
 * Ejecuta la auditoría y purga de claves obsoletas en localStorage.
 * Diseñado para ejecutarse de forma segura y transparente al arranque.
 *
 * Características:
 *  - 100% blindado con try/catch (soporta modo incógnito y storage restringido).
 *  - Migra de forma transparente cualquier carrito previo no-namespaced a la clave oficial.
 *  - Purga claves obsoletas conocidas.
 *  - Elimina claves huérfanas con prefijo propio que ya no estén en CLAVES_OFICIALES.
 *  - NUNCA modifica ni elimina claves de terceros (librerías, Vite, plugins, etc.).
 *
 * @returns {{ eliminadas: string[], conservadas: string[] }} Resumen de la limpieza
 */
export function ejecutarLimpiezaStorage() {
  const eliminadas = [];
  const conservadas = [];

  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { eliminadas, conservadas };
    }

    const storage = window.localStorage;

    // 1. Migración transparente de carrito legado si la clave oficial aún está vacía
    try {
      const carritoOficial = storage.getItem(CLAVES_OFICIALES.CARRITO);
      if (!carritoOficial) {
        for (const claveVieja of ["carrito", "cart"]) {
          const datosViejos = storage.getItem(claveVieja);
          if (datosViejos) {
            try {
              const parsed = JSON.parse(datosViejos);
              if (Array.isArray(parsed) && parsed.length > 0) {
                storage.setItem(CLAVES_OFICIALES.CARRITO, datosViejos);
                break;
              }
            } catch {
              /* ignore parse error */
            }
          }
        }
      }
    } catch {
      /* ignore migration errors */
    }

    // 2. Eliminar lista de claves obsoletas conocidas
    for (const clave of CLAVES_OBSOLETAS_CONOCIDAS) {
      try {
        if (storage.getItem(clave) !== null) {
          storage.removeItem(clave);
          eliminadas.push(clave);
        }
      } catch {
        /* ignore individual removal errors */
      }
    }

    // 3. Auditar todas las claves existentes en localStorage
    const totalClaves = storage.length;
    const clavesAEvaluar = [];

    for (let i = 0; i < totalClaves; i++) {
      try {
        const k = storage.key(i);
        if (k) clavesAEvaluar.push(k);
      } catch {
        /* ignore */
      }
    }

    for (const k of clavesAEvaluar) {
      const esPrefijoPropio = PREFIJOS_PROPIOS.some((p) => k.startsWith(p));

      if (esPrefijoPropio) {
        if (!SET_CLAVES_OFICIALES.has(k)) {
          // Es una clave nuestra pero obsoleta/huérfana
          try {
            storage.removeItem(k);
            eliminadas.push(k);
          } catch {
            /* ignore */
          }
        } else {
          conservadas.push(k);
        }
      }
    }

    if (import.meta.env?.DEV && eliminadas.length > 0) {
      console.info(
        `[El Trigal] Limpieza de localStorage completada: ${eliminadas.length} clave(s) obsoleta(s) eliminada(s).`,
        eliminadas,
      );
    }
  } catch (error) {
    console.warn("[El Trigal] No se pudo ejecutar la limpieza de localStorage:", error);
  }

  return { eliminadas, conservadas };
}

export default ejecutarLimpiezaStorage;
