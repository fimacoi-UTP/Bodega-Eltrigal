/**
 * ============================================================================
 * CarruselHero · Hero Carrusel Supermercado Premium (FASE 3)
 * ----------------------------------------------------------------------------
 * Características:
 *   · 3 slides con fondos degradados (terracota / verde / oro) que "respiran".
 *   · Emoji grande flotando con tarjetas decorativas de cristal.
 *   · Kicker (pill translúcido), título Fraunces grande, subtítulo y botón CTA.
 *   · Autoplay de 5 s, flechas + dots con progreso, pausa al hover/focus.
 *   · Entrada animada escalonada del texto al cambiar de slide.
 * ==========================================================================*/

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { aRuta } from "../../../routes/rutas";
import "./CarruselHero.css";

/** Cada cuánto avanza el carrusel (milisegundos). */
const INTERVALO_MS = 5000;

/**
 * Los 3 slides del Hero Supermercado Premium:
 * 1. Terracota -> Ofertas
 * 2. Verde     -> Delivery gratis
 * 3. Oro       -> Packs / Nuevos
 */
const SLIDES = [
  {
    id: "ofertas",
    tema: "terracota",
    kicker: "🔥 OFERTAS DE TEMPORADA · PIURA",
    titulo: "Despensa llena, ahorro real para tu hogar",
    subtitulo:
      "Encuentra descuentos especiales en arroz, aceites, lácteos y abarrotes seleccionados con la frescura de siempre.",
    cta: {
      texto: "Ver ofertas del día →",
      tipo: "ruta",
      destino: aRuta.inicioPorCategoria("Ofertas"),
    },
    ctaSecundario: {
      texto: "Explorar abarrotes",
      destino: aRuta.inicioPorCategoria("Abarrotes"),
    },
    emoji: "🛒",
    chipSuperior: "✨ Ahorro garantizado",
    chipInferior: "🌾 Calidad Piurana",
  },
  {
    id: "delivery",
    tema: "verde",
    kicker: "🛵 DELIVERY EXPRESS EN PIURA",
    titulo: "Del mostrador de El Trigal directo a tu puerta",
    subtitulo:
      "Delivery gratis en pedidos desde S/ 50. Pide desde casa y paga fácil con Yape, Plin, tarjeta o efectivo al recibir.",
    cta: {
      texto: "Empezar mi compra →",
      tipo: "ancla",
      destino: "#explorar-categorias",
    },
    ctaSecundario: {
      texto: "Ver bebidas y frescos",
      destino: aRuta.inicioPorCategoria("Bebidas"),
    },
    emoji: "🛵",
    chipSuperior: "🚚 Gratis desde S/ 50",
    chipInferior: "💳 Yape · Plin · Efectivo",
  },
  {
    id: "packs",
    tema: "oro",
    kicker: "🧺 PACKS AHORRADORES & NUEVOS",
    titulo: "Todo listo para tu desayuno, almuerzo o parrilla",
    subtitulo:
      "Combos pensados para resolver tu semana en un clic y los productos favoritos de más de 500 familias piuranas.",
    cta: {
      texto: "Descubrir packs del día →",
      tipo: "ancla",
      destino: "#packs-del-dia",
    },
    ctaSecundario: {
      texto: "Favoritos del barrio",
      destino: "#favoritos-vecinos",
    },
    emoji: "🧺",
    chipSuperior: "⭐ 4.9★ por nuestros caseros",
    chipInferior: "🕑 Abierto hasta las 10 p.m.",
  },
];

export function CarruselHero() {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  const total = SLIDES.length;

  const siguiente = useCallback(() => {
    setIndice((actual) => (actual + 1) % total);
  }, [total]);

  const anterior = useCallback(() => {
    setIndice((actual) => (actual - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (pausado) return undefined;
    const temporizador = setInterval(siguiente, INTERVALO_MS);
    return () => clearInterval(temporizador);
  }, [pausado, siguiente]);

  const alPresionarTecla = (evento) => {
    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      siguiente();
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      anterior();
    }
  };

  return (
    <section
      className="carrusel"
      aria-roledescription="carrusel"
      aria-label="Destacados de Bodega El Trigal"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
      onKeyDown={alPresionarTecla}
    >
      <div className="carrusel__marco">
        {SLIDES.map((slide, i) => {
          const activo = i === indice;

          return (
            <article
              key={slide.id}
              className={`carrusel__slide carrusel__slide--${slide.tema} ${
                activo ? "carrusel__slide--activo" : ""
              }`}
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${total}: ${slide.titulo}`}
              aria-hidden={!activo}
              inert={!activo || undefined}
            >
              {/* Fondo degradado que "respira" con orbes suaves */}
              <div className="carrusel__fondo-respirando" aria-hidden="true">
                <span className="carrusel__orbe carrusel__orbe--1" />
                <span className="carrusel__orbe carrusel__orbe--2" />
              </div>

              <div className="carrusel__interior">
                {/* Columna de texto con entrada escalonada */}
                <div className="carrusel__contenido">
                  <span className="carrusel__kicker">{slide.kicker}</span>

                  <h2 className="carrusel__titulo serif">{slide.titulo}</h2>

                  <p className="carrusel__subtitulo">{slide.subtitulo}</p>

                  <div className="carrusel__acciones">
                    {slide.cta.tipo === "ruta" ? (
                      <Link to={slide.cta.destino} className="carrusel__btn-primario">
                        {slide.cta.texto}
                      </Link>
                    ) : (
                      <a href={slide.cta.destino} className="carrusel__btn-primario">
                        {slide.cta.texto}
                      </a>
                    )}

                    {slide.ctaSecundario &&
                      (slide.ctaSecundario.destino.startsWith("#") ? (
                        <a
                          href={slide.ctaSecundario.destino}
                          className="carrusel__btn-secundario"
                        >
                          {slide.ctaSecundario.texto}
                        </a>
                      ) : (
                        <Link
                          to={slide.ctaSecundario.destino}
                          className="carrusel__btn-secundario"
                        >
                          {slide.ctaSecundario.texto}
                        </Link>
                      ))}
                  </div>
                </div>

                {/* Columna visual con emoji grande flotando */}
                <div className="carrusel__escena" aria-hidden="true">
                  <div className="carrusel__halo" />
                  <span className="carrusel__chip-flotante carrusel__chip-flotante--sup">
                    {slide.chipSuperior}
                  </span>
                  <div className="carrusel__emoji-burbuja">
                    <span className="carrusel__emoji">{slide.emoji}</span>
                  </div>
                  <span className="carrusel__chip-flotante carrusel__chip-flotante--inf">
                    {slide.chipInferior}
                  </span>
                </div>
              </div>
            </article>
          );
        })}

        {/* Flechas de navegación */}
        <button
          type="button"
          className="carrusel__flecha carrusel__flecha--anterior"
          onClick={anterior}
          aria-label="Diapositiva anterior"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <button
          type="button"
          className="carrusel__flecha carrusel__flecha--siguiente"
          onClick={siguiente}
          aria-label="Diapositiva siguiente"
        >
          <span aria-hidden="true">›</span>
        </button>

        {/* Dots indicadores con progreso */}
        <div className="carrusel__puntos" role="tablist" aria-label="Elegir diapositiva">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              className={`carrusel__punto ${i === indice ? "carrusel__punto--activo" : ""}`}
              aria-selected={i === indice}
              aria-label={`Ir a la diapositiva ${i + 1}: ${slide.titulo}`}
              onClick={() => setIndice(i)}
            >
              <span className="carrusel__punto-relleno" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CarruselHero;
