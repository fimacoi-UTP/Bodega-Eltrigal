/**
 * ============================================================================
 * FlotantesTienda · Elementos Flotantes Globales de la Tienda (FASE 7)
 * ----------------------------------------------------------------------------
 * Montado en LayoutTienda (presente en todas las páginas de la tienda web):
 *   1. BARRA DE PROGRESO DE SCROLL: barra fina superior con degradado
 *      terracota -> oro que refleja el avance de lectura/scroll de la página.
 *   2. BOTÓN "VOLVER ARRIBA": aparece al superar ~500px de scroll y regresa
 *      suavemente al inicio de la página, ubicado encima del botón de WhatsApp.
 *   3. WHATSAPP MINI-BOT:
 *      · Botón circular verde (~62px) con anillo de pulso y tooltip
 *        "¿Dudas? Escríbenos 💬".
 *      · Al pulsarlo despliega un Mini-Chat (~340px, fade + slide-up) con:
 *        - Cabecera verde: avatar 🌾, "El Trigal", "● En línea · responde rápido"
 *          y botón cerrar "×".
 *        - Burbuja de bienvenida: "¡Hola, casero! 👋 ¿En qué te ayudo hoy?".
 *        - 3 chips de respuesta rápida que abren wa.me/51920642639.
 *        - Caja de texto + botón enviar hacia wa.me/51920642639.
 *      · Cierra con "×", clic fuera o tecla Escape.
 * ==========================================================================*/

import { useEffect, useRef, useState } from "react";
import { BODEGA } from "../../constantes";
import { useCarrito } from "../../context/CarritoContext";
import { clases } from "../../utils/formato";
import "./FlotantesTienda.css";

const NUMERO_WHATSAPP = BODEGA.whatsapp || "51920642639";

const CHIPS_RESPUESTA_RAPIDA = [
  {
    id: "pedido",
    etiqueta: "🛒 Hacer un pedido",
    mensaje: "Hola Bodega El Trigal, quisiera hacer un pedido a domicilio en Piura 🛒",
  },
  {
    id: "precio",
    etiqueta: "🏷️ Consultar un precio",
    mensaje: "Hola Bodega El Trigal, quisiera consultar el precio y disponibilidad de un producto 🏷️",
  },
  {
    id: "horario",
    etiqueta: "🕑 Horario y delivery",
    mensaje: "Hola Bodega El Trigal, quisiera consultar su horario de atención y zonas de delivery en Piura 🕑",
  },
];

function abrirWhatsAppConMensaje(texto) {
  const mensajeLimpio = (texto || "").trim() || "Hola Bodega El Trigal, tengo una consulta.";
  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensajeLimpio)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function FlotantesTienda({ conBarraMovil = false }) {
  const { drawerAbierto } = useCarrito();

  const [progresoScroll, setProgresoScroll] = useState(0);
  const [mostrarVolverArriba, setMostrarVolverArriba] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajeUsuario, setMensajeUsuario] = useState("");

  const contenedorBotRef = useRef(null);
  const inputChatRef = useRef(null);

  // 1. Escuchar el scroll de la ventana para la barra superior y el botón "Volver arriba"
  useEffect(() => {
    let rafId = null;

    const actualizarScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const alturaTotal =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      const porcentaje =
        alturaTotal > 0
          ? Math.min(100, Math.max(0, (scrollTop / alturaTotal) * 100))
          : 0;

      setProgresoScroll(porcentaje);
      setMostrarVolverArriba(scrollTop > 500);
      rafId = null;
    };

    const alHacerScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(actualizarScroll);
      }
    };

    actualizarScroll();
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    window.addEventListener("resize", alHacerScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", alHacerScroll);
      window.removeEventListener("resize", alHacerScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // 2. Cerrar el Mini-Chat con tecla Escape o clic fuera
  useEffect(() => {
    if (!chatAbierto) return undefined;

    const manejarTecla = (e) => {
      if (e.key === "Escape") {
        setChatAbierto(false);
      }
    };

    const manejarClickFuera = (e) => {
      if (
        contenedorBotRef.current &&
        !contenedorBotRef.current.contains(e.target)
      ) {
        setChatAbierto(false);
      }
    };

    document.addEventListener("keydown", manejarTecla);
    document.addEventListener("mousedown", manejarClickFuera);
    return () => {
      document.removeEventListener("keydown", manejarTecla);
      document.removeEventListener("mousedown", manejarClickFuera);
    };
  }, [chatAbierto]);

  // Enfocar el input al abrir el mini-chat en escritorio
  useEffect(() => {
    if (chatAbierto && inputChatRef.current) {
      const t = setTimeout(() => {
        if (window.innerWidth >= 768) {
          inputChatRef.current?.focus();
        }
      }, 160);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [chatAbierto]);

  const volverArriba = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const enviarMensajePersonalizado = (e) => {
    e.preventDefault();
    const limpio = mensajeUsuario.trim();
    if (!limpio) {
      abrirWhatsAppConMensaje("Hola Bodega El Trigal, tengo una consulta.");
    } else {
      abrirWhatsAppConMensaje(limpio);
    }
    setMensajeUsuario("");
    setChatAbierto(false);
  };

  const seleccionarChipRapido = (mensaje) => {
    abrirWhatsAppConMensaje(mensaje);
    setChatAbierto(false);
  };

  return (
    <>
      {/* ====================================================================
       * 3) BARRA DE PROGRESO DE SCROLL (fija arriba, degradado terracota->oro)
       * ================================================================== */}
      <div className="scroll-progreso" aria-hidden="true">
        <div
          className="scroll-progreso__barra"
          style={{ width: `${progresoScroll}%` }}
        />
      </div>

      {/* ====================================================================
       * CONTENEDOR DE FLOTANTES (abajo a la derecha, sin chocar con carrito)
       * ================================================================== */}
      <div
        ref={contenedorBotRef}
        className={clases(
          "flotantes-tienda",
          conBarraMovil && "flotantes-tienda--con-barra-movil",
          drawerAbierto && "flotantes-tienda--oculto",
        )}
      >
        {/* ------------------------------------------------------------------
         * PANEL MINI-CHAT DE WHATSAPP (~340px, fade + slide-up)
         * ---------------------------------------------------------------- */}
        <div
          id="whatsapp-minichat-panel"
          className={clases(
            "wa-minichat",
            chatAbierto && "wa-minichat--abierto",
          )}
          role="dialog"
          aria-label="Chat de atención por WhatsApp de Bodega El Trigal"
          aria-hidden={!chatAbierto}
          inert={!chatAbierto || undefined}
        >
          {/* Cabecera verde */}
          <header className="wa-minichat__cabecera">
            <div className="wa-minichat__identidad">
              <span className="wa-minichat__avatar" aria-hidden="true">
                🌾
              </span>
              <div className="wa-minichat__textos">
                <strong className="wa-minichat__nombre serif">El Trigal</strong>
                <span className="wa-minichat__estado">
                  <span className="wa-minichat__punto-online" aria-hidden="true" />
                  En línea · responde rápido
                </span>
              </div>
            </div>

            <button
              type="button"
              className="wa-minichat__cerrar"
              onClick={() => setChatAbierto(false)}
              aria-label="Cerrar chat de WhatsApp"
            >
              ×
            </button>
          </header>

          {/* Cuerpo del chat: burbuja de bienvenida + 3 chips rápidos */}
          <div className="wa-minichat__cuerpo">
            <div className="wa-minichat__burbuja">
              <span className="wa-minichat__burbuja-autor">Bodega El Trigal</span>
              <p className="wa-minichat__burbuja-texto">
                ¡Hola, casero! 👋 ¿En qué te ayudo hoy?
              </p>
              <span className="wa-minichat__burbuja-hora">Ahora</span>
            </div>

            <div className="wa-minichat__chips" aria-label="Respuestas rápidas">
              {CHIPS_RESPUESTA_RAPIDA.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className="wa-minichat__chip"
                  onClick={() => seleccionarChipRapido(chip.mensaje)}
                >
                  {chip.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {/* Pie del chat: input de texto + botón enviar */}
          <form
            className="wa-minichat__formulario"
            onSubmit={enviarMensajePersonalizado}
          >
            <input
              ref={inputChatRef}
              type="text"
              className="wa-minichat__input"
              placeholder="Escribe tu mensaje aquí..."
              value={mensajeUsuario}
              onChange={(e) => setMensajeUsuario(e.target.value)}
              aria-label="Escribe tu consulta para WhatsApp"
            />
            <button
              type="submit"
              className="wa-minichat__enviar"
              aria-label="Enviar mensaje por WhatsApp"
              title="Enviar por WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 3 3 10.5l7.2 3.1L14.5 21 21 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>

        {/* ------------------------------------------------------------------
         * PILA DE BOTONES FLOTANTES: Volver arriba (encima) + WhatsApp (abajo)
         * ---------------------------------------------------------------- */}
        <div className="flotantes-tienda__acciones">
          {/* 2) BOTÓN "VOLVER ARRIBA" (~500px scroll) */}
          <button
            type="button"
            className={clases(
              "btn-volver-arriba",
              mostrarVolverArriba && "btn-volver-arriba--visible",
            )}
            onClick={volverArriba}
            aria-label="Volver arriba"
            title="Volver arriba"
          >
            <span aria-hidden="true">↑</span>
          </button>

          {/* 1) BOTÓN FLOTANTE CIRCULAR WHATSAPP (~62px + pulso + tooltip) */}
          <div className="wa-boton-wrapper">
            {!chatAbierto && (
              <span className="wa-boton__tooltip" role="tooltip">
                ¿Dudas? Escríbenos 💬
              </span>
            )}

            <button
              type="button"
              className={clases(
                "wa-boton",
                chatAbierto && "wa-boton--activo",
              )}
              onClick={() => setChatAbierto((prev) => !prev)}
              aria-expanded={chatAbierto}
              aria-controls="whatsapp-minichat-panel"
              aria-label={
                chatAbierto
                  ? "Cerrar chat de WhatsApp"
                  : "¿Dudas? Escríbenos por WhatsApp"
              }
            >
              <span className="wa-boton__pulso" aria-hidden="true" />
              {chatAbierto ? (
                <span className="wa-boton__icono-cerrar" aria-hidden="true">
                  ✕
                </span>
              ) : (
                <svg
                  className="wa-boton__svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.66-.61-2.92-1.26-4.82-4.21-4.97-4.4-.14-.19-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.01-2.42.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2.01.89 2.16.07.15.12.32.02.51-.1.19-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.49.22.56.34.07.12.07.7-.17 1.38Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default FlotantesTienda;

