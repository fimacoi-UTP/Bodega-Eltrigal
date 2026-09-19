/**
 * ============================================================================
 * CarruselHero · Carrusel destacado de la portada
 * ----------------------------------------------------------------------------
 * Slider automático, sin librerías externas: solo useState + useEffect.
 *
 * Cómo funciona el temporizador:
 *   · Un setInterval avanza al siguiente slide cada 5 s.
 *   · El efecto depende de `pausado`, así que al pasar el mouse (o al enfocar
 *     con el teclado) el intervalo se limpia solo y vuelve a crearse al salir.
 *   · El cleanup del useEffect SIEMPRE hace clearInterval: sin eso quedarían
 *     temporizadores huérfanos cada vez que el componente se desmonta, y en
 *     modo estricto de React (que monta dos veces en desarrollo) se verían
 *     saltos dobles.
 *
 * La transición es un cross-fade: todos los slides están apilados en la misma
 * celda de un grid y solo cambia la opacidad. Se anima `opacity` y `transform`,
 * que el navegador resuelve en la GPU, así que no traba el scroll.
 * ==========================================================================*/

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Boton } from "../../../components/ui";
import { RUTAS } from "../../../routes/rutas";
import "./CarruselHero.css";

/** Cada cuánto avanza el carrusel (milisegundos). */
const INTERVALO_MS = 5000;

/** Ancla de la rejilla de productos, para los botones que bajan al catálogo. */
const ANCLA_CATALOGO = "#catalogo-productos";

/**
 * Contenido de los slides.
 * `cta.tipo` decide cómo se navega:
 *   "ancla" → baja a una sección de esta misma página
 *   "ruta"  → navega con <Link> de react-router
 */
const SLIDES = [
  {
    id: "slide1",
    imagen: "/carrusel/slide1.jpg",
    titulo: "Tu bodega de barrio, ahora online",
    subtitulo: "Compra desde casa lo de siempre, con la atención de siempre.",
    cta: { texto: "Ver catálogo", tipo: "ancla", destino: ANCLA_CATALOGO },
  },
  {
    id: "slide2",
    imagen: "/carrusel/slide2.jpg",
    titulo: "Delivery en Piura",
    subtitulo: "Pedidos hasta las 9:00 p.m. y te lo llevamos a la puerta.",
    cta: { texto: "Ver ofertas", tipo: "ancla", destino: ANCLA_CATALOGO },
  },
  {
    id: "slide3",
    imagen: "/carrusel/slide3.jpg",
    titulo: "Todos los medios de pago",
    subtitulo: "Yape, Plin, tarjeta y efectivo. Paga como te quede cómodo.",
    cta: { texto: "Empezar mi pedido", tipo: "ancla", destino: ANCLA_CATALOGO },
  },
  {
    id: "slide4",
    imagen: "/carrusel/slide4.jpg",
    titulo: "30 años de confianza",
    subtitulo: "Productos frescos de calidad, elegidos uno por uno.",
    cta: { texto: "Conoce nuestra historia", tipo: "ruta", destino: RUTAS.NOSOTROS },
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

  /* ------------------------------------------------------------------------
   * Rotación automática.
   * El setState va DENTRO del callback del intervalo (asíncrono), no en el
   * cuerpo del efecto, así que no encadena renders al montar.
   * --------------------------------------------------------------------- */
  useEffect(() => {
    if (pausado) return undefined;

    const temporizador = setInterval(siguiente, INTERVALO_MS);

    // Cleanup obligatorio: limpia el intervalo al pausar o al desmontar.
    return () => clearInterval(temporizador);
  }, [pausado, siguiente]);

  /** Flechas del teclado para moverse por el carrusel. */
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
      // Pausa con el mouse encima…
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      // …y también al navegar con teclado, para que no cambie bajo los dedos.
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
              className={`carrusel__slide ${activo ? "carrusel__slide--activo" : ""}`}
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${total}: ${slide.titulo}`}
              // Las diapositivas ocultas no deben ser navegables con tabulador.
              aria-hidden={!activo}
              inert={!activo || undefined}
            >
              <img
                className="carrusel__imagen"
                src={slide.imagen}
                alt=""
                aria-hidden="true"
                /* La primera imagen es lo primero que ve el cliente: se pide con
                   prioridad. Las demás esperan a que haga falta. */
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
                decoding="async"
              />

              {/* Velo oscuro para que el texto se lea sobre cualquier foto. */}
              <div className="carrusel__velo" aria-hidden="true" />

              <div className="carrusel__contenido">
                <h2 className="carrusel__titulo">{slide.titulo}</h2>
                <p className="carrusel__subtitulo">{slide.subtitulo}</p>

                <div className="carrusel__accion">
                  {slide.cta.tipo === "ruta" ? (
                    <Boton como={Link} to={slide.cta.destino} variante="primario" tamano="lg">
                      {slide.cta.texto}
                    </Boton>
                  ) : (
                    <Boton como="a" href={slide.cta.destino} variante="primario" tamano="lg">
                      {slide.cta.texto}
                    </Boton>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {/* ------------------------------------------------- Flechas ----- */}
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

        {/* ---------------------------------------------- Indicadores ---- */}
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
              {/* Barra de progreso del slide activo */}
              <span className="carrusel__punto-relleno" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CarruselHero;
