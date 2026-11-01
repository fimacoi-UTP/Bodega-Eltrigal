/**
 * ============================================================================
 * AvisosTienda · Banner de Cookies y Popup de Notificaciones (FASE 8)
 * ----------------------------------------------------------------------------
 * Montado en LayoutTienda:
 *   1. BANNER DE COOKIES (aparece al cargar si no existe `trigal:cookies-aceptadas`):
 *      · Texto: "🍪 Usamos cookies. En El Trigal cuidamos tu experiencia sin
 *        descuidar la protección de tus datos. ¿Aceptas el uso de cookies?"
 *      · Botones: "Sí, acepto" y "Configurar" (despliega preferencias).
 *      · Persiste en localStorage (`trigal:cookies-aceptadas`) con try/catch.
 *   2. POPUP "ACTIVAR NOTIFICACIONES" (aparece a los ~5s tras las cookies si
 *      no existe `trigal:notif-vista`):
 *      · Ubicado abajo-izquierda (lejos del botón de WhatsApp).
 *      · Ícono 🔔 + "Activa las notificaciones · Recibe ofertas y novedades
 *        directamente en tu dispositivo" + botones "Activar" y "Ahora no".
 *      · "Activar" muestra el toast "¡Notificaciones activadas! 🔔".
 *      · Ambos botones cierran y persisten `trigal:notif-vista` en localStorage.
 * ==========================================================================*/

import { useEffect, useState } from "react";
import { CLAVES_OFICIALES } from "../../utils/limpiezaStorage";
import { useCarrito } from "../../context/CarritoContext";
import { Toast } from "../ui";
import { clases } from "../../utils/formato";
import "./AvisosTienda.css";

function leerFlagStorage(clave) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    return Boolean(window.localStorage.getItem(clave));
  } catch {
    return false;
  }
}

function guardarFlagStorage(clave, valor) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(clave, valor);
    }
  } catch {
    /* modo incógnito o storage restringido */
  }
}

export function AvisosTienda({ conBarraMovil = false }) {
  const { drawerAbierto } = useCarrito();

  // 1. Estado del Banner de Cookies
  const [cookiesAceptadas, setCookiesAceptadas] = useState(() =>
    leerFlagStorage(CLAVES_OFICIALES.COOKIES_ACEPTADAS),
  );
  const [configurandoCookies, setConfigurandoCookies] = useState(false);
  const [cookiePreferencias, setCookiePreferencias] = useState(true);

  // 2. Estado del Popup de Notificaciones
  const [notifYaVista, setNotifYaVista] = useState(() =>
    leerFlagStorage(CLAVES_OFICIALES.NOTIF_VISTA),
  );
  const [mostrarPopupNotif, setMostrarPopupNotif] = useState(false);
  const [mostrarToastNotif, setMostrarToastNotif] = useState(false);

  // Programar la aparición del popup de notificaciones ~5s después de aceptar cookies
  useEffect(() => {
    if (!cookiesAceptadas || notifYaVista) return undefined;

    const timer = setTimeout(() => {
      setMostrarPopupNotif(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [cookiesAceptadas, notifYaVista]);

  const aceptarCookies = (modo = "todas") => {
    guardarFlagStorage(CLAVES_OFICIALES.COOKIES_ACEPTADAS, modo);
    setCookiesAceptadas(true);
    setConfigurandoCookies(false);
  };

  const activarNotificaciones = () => {
    guardarFlagStorage(CLAVES_OFICIALES.NOTIF_VISTA, "activadas");
    setNotifYaVista(true);
    setMostrarPopupNotif(false);
    setMostrarToastNotif(true);
  };

  const descartarNotificaciones = () => {
    guardarFlagStorage(CLAVES_OFICIALES.NOTIF_VISTA, "descartadas");
    setNotifYaVista(true);
    setMostrarPopupNotif(false);
  };

  return (
    <>
      {/* ====================================================================
       * 1) BANNER DE COOKIES (aparece al cargar si no se ha aceptado)
       * ================================================================== */}
      {!cookiesAceptadas && (
        <aside
          className={clases(
            "banner-cookies",
            conBarraMovil && "banner-cookies--con-barra-movil",
            drawerAbierto && "banner-cookies--oculto",
          )}
          role="region"
          aria-label="Aviso de privacidad y uso de cookies"
        >
          <div className="banner-cookies__interior">
            <div className="banner-cookies__principal">
              <div className="banner-cookies__mensaje">
                <span className="banner-cookies__icono" aria-hidden="true">
                  🍪
                </span>
                <p className="banner-cookies__texto">
                  <strong>Usamos cookies.</strong> En El Trigal cuidamos tu
                  experiencia sin descuidar la protección de tus datos. ¿Aceptas
                  el uso de cookies?
                </p>
              </div>

              <div className="banner-cookies__acciones">
                <button
                  type="button"
                  className="banner-cookies__btn banner-cookies__btn--secundario"
                  onClick={() => setConfigurandoCookies((prev) => !prev)}
                  aria-expanded={configurandoCookies}
                >
                  {configurandoCookies ? "Ocultar opciones" : "Configurar"}
                </button>
                <button
                  type="button"
                  className="banner-cookies__btn banner-cookies__btn--primario"
                  onClick={() => aceptarCookies("todas")}
                >
                  Sí, acepto
                </button>
              </div>
            </div>

            {/* Panel desplegable de configuración de cookies */}
            {configurandoCookies && (
              <div className="banner-cookies__config">
                <label className="banner-cookies__opcion">
                  <input type="checkbox" checked disabled />
                  <span>
                    <strong>Esenciales (obligatorias):</strong> sesión, carrito
                    de compras y seguridad.
                  </span>
                </label>

                <label className="banner-cookies__opcion">
                  <input
                    type="checkbox"
                    checked={cookiePreferencias}
                    onChange={(e) => setCookiePreferencias(e.target.checked)}
                  />
                  <span>
                    <strong>Preferencias y experiencia:</strong> recordar tema
                    claro/oscuro y favoritos locales.
                  </span>
                </label>

                <div className="banner-cookies__config-pie">
                  <button
                    type="button"
                    className="banner-cookies__btn banner-cookies__btn--primario"
                    onClick={() =>
                      aceptarCookies(
                        cookiePreferencias ? "todas" : "esenciales",
                      )
                    }
                  >
                    Guardar preferencias
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ====================================================================
       * 2) POPUP "ACTIVAR NOTIFICACIONES" (~5s tras cookies, abajo-izquierda)
       * ================================================================== */}
      {mostrarPopupNotif && !notifYaVista && (
        <aside
          className={clases(
            "popup-notif",
            conBarraMovil && "popup-notif--con-barra-movil",
            drawerAbierto && "popup-notif--oculto",
          )}
          role="dialog"
          aria-label="Activar notificaciones de ofertas"
        >
          <button
            type="button"
            className="popup-notif__cerrar"
            onClick={descartarNotificaciones}
            aria-label="Cerrar aviso de notificaciones"
          >
            ×
          </button>

          <div className="popup-notif__cuerpo">
            <span className="popup-notif__icono" aria-hidden="true">
              🔔
            </span>
            <div className="popup-notif__textos">
              <strong className="popup-notif__titulo serif">
                Activa las notificaciones
              </strong>
              <p className="popup-notif__descripcion">
                Recibe ofertas y novedades directamente en tu dispositivo.
              </p>
            </div>
          </div>

          <div className="popup-notif__acciones">
            <button
              type="button"
              className="popup-notif__btn popup-notif__btn--secundario"
              onClick={descartarNotificaciones}
            >
              Ahora no
            </button>
            <button
              type="button"
              className="popup-notif__btn popup-notif__btn--primario"
              onClick={activarNotificaciones}
            >
              Activar
            </button>
          </div>
        </aside>
      )}

      {/* Toast de confirmación al activar notificaciones */}
      {mostrarToastNotif && (
        <Toast
          mensaje="¡Notificaciones activadas! 🔔"
          variante="exito"
          duracion={3500}
          alCerrar={() => setMostrarToastNotif(false)}
        />
      )}
    </>
  );
}

export default AvisosTienda;

