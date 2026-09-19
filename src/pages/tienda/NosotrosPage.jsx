/**
 * ============================================================================
 * NosotrosPage · La historia de la Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Ruta: /nosotros · Pública
 *
 * Página informativa: quiénes somos, desde cuándo y por qué el barrio nos
 * elige. Es la que da confianza al cliente que compra por primera vez, así que
 * sigue el mismo lenguaje visual del catálogo (hero con degradado cálido,
 * insignia de marca, tarjetas del sistema de diseño).
 *
 * Todos los datos salen de la constante BODEGA (src/constantes.js): si cambia
 * un dato de la bodega, se cambia allí y esta página se actualiza sola.
 * ==========================================================================*/

import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Boton, Card } from "../../components/ui";
import { BODEGA } from "../../constantes";
import { RUTAS } from "../../routes/rutas";
import "./NosotrosPage.css";

/** Los cuatro pilares que definen a la bodega. */
const VALORES = [
  {
    icono: "🤝",
    titulo: "Confianza de 30 años",
    texto:
      "Tres décadas atendiendo a las mismas familias. Aquí al cliente se le conoce por su nombre, no por un número de pedido.",
  },
  {
    icono: "🛵",
    titulo: "Delivery propio",
    texto:
      "Repartimos nosotros mismos por la zona. Nada de intermediarios: tu pedido llega rápido y en buen estado.",
  },
  {
    icono: "💳",
    titulo: "Todos los medios de pago",
    texto:
      "Efectivo, Yape, Plin o tarjeta. Paga como te quede más cómodo, en la tienda o desde tu celular.",
  },
  {
    icono: "⭐",
    titulo: "Productos frescos",
    texto:
      "Rotación diaria y marcas de confianza. Revisamos vencimientos uno por uno antes de ponerlos en el estante.",
  },
];

export const NosotrosPage = () => {
  /* La foto de la fachada es opcional: si el archivo todavía no está en
     public/imagenes/, el hero se muestra igual con su ornamento y nadie ve
     un ícono de imagen rota. */
  const [hayFoto, setHayFoto] = useState(true);

  /* Los años de trayectoria se calculan desde BODEGA.fundacion en vez de
     escribirlos a mano, así el dato nunca queda desactualizado. */
  const anioFundacion = new Date(BODEGA.fundacion).getFullYear();
  const aniosTrayectoria = new Date().getFullYear() - anioFundacion;

  /** Hitos de la historia, contados como línea de tiempo. */
  const HITOS = [
    {
      anio: anioFundacion,
      titulo: "Abrimos las puertas",
      texto:
        "El 10 de enero de 1994 la familia levanta la persiana por primera vez, con un mostrador, dos estantes y las ganas de abastecer al barrio.",
    },
    {
      anio: "2000s",
      titulo: "El barrio nos adopta",
      texto:
        "La bodega se vuelve punto de encuentro de la cuadra. Ampliamos el surtido con abarrotes, lácteos, limpieza y bebidas.",
    },
    {
      anio: "2010s",
      titulo: "Delivery propio",
      texto:
        "Empezamos a llevar los pedidos a domicilio en la zona, sin intermediarios y con el mismo trato de siempre.",
    },
    {
      anio: "Hoy",
      titulo: "También en línea",
      texto:
        "Seguimos siendo la misma bodega de la esquina, ahora con catálogo web para pedir desde el celular y recoger o recibir en casa.",
    },
  ];

  /** Cifras destacadas, todas derivadas de datos reales de la bodega. */
  const ESTADISTICAS = [
    { valor: `${aniosTrayectoria}`, etiqueta: "Años en el barrio" },
    { valor: `${anioFundacion}`, etiqueta: "Desde nuestra fundación" },
    { valor: "100%", etiqueta: "Negocio familiar" },
    { valor: "7", etiqueta: "Días de atención a la semana" },
  ];

  return (
    <div className="contenedor nosotros">
      {/* ================================================== 1. HERO ===== */}
      <section
        className={`nosotros-hero ${hayFoto ? "nosotros-hero--con-foto" : ""}`}
        aria-label="Sobre la Bodega El Trigal"
      >
        <span className="nosotros-hero__ornamento" aria-hidden="true">
          🌾
        </span>

        <div className="nosotros-hero__contenido">
          <Badge variante="marca" tamano="sm" className="nosotros-hero__insignia">
            🌾 Desde {anioFundacion} en Piura
          </Badge>

          <h1 className="nosotros-hero__titulo">
            {BODEGA.nombre}, la bodega de{" "}
            <span className="nosotros-hero__destaque">toda la vida</span>
          </h1>

          <p className="nosotros-hero__lema">
            {BODEGA.lema}. Somos un negocio familiar que lleva {aniosTrayectoria} años
            abasteciendo a los vecinos de {BODEGA.ciudad.split(" ")[0]}, con el mismo
            trato cercano del primer día.
          </p>
        </div>

        {/* Fachada real de la bodega. Si el archivo no existe, onError la
            retira y el hero queda como antes. */}
        {hayFoto && (
          <figure className="nosotros-hero__foto">
            <img
              src="/imagenes/nosotros.jpg"
              alt={`Fachada de ${BODEGA.nombre} en ${BODEGA.ciudad}`}
              loading="eager"
              decoding="async"
              onError={() => setHayFoto(false)}
            />
            <figcaption className="nosotros-hero__pie">
              Nuestra tienda en {BODEGA.direccion}
            </figcaption>
          </figure>
        )}
      </section>

      {/* ========================================== 2. ESTADÍSTICAS ===== */}
      <section className="nosotros__estadisticas" aria-label="La bodega en cifras">
        {ESTADISTICAS.map((dato) => (
          <Card key={dato.etiqueta} padding="md">
            <div className="nosotros__estadistica">
              <span className="nosotros__estadistica-valor">{dato.valor}</span>
              <span className="nosotros__estadistica-etiqueta">{dato.etiqueta}</span>
            </div>
          </Card>
        ))}
      </section>

      {/* =============================================== 3. HISTORIA ===== */}
      <section aria-labelledby="titulo-historia">
        <header className="nosotros__seccion-cabecera">
          <h2 className="nosotros__seccion-titulo" id="titulo-historia">
            Nuestra historia
          </h2>
          <p className="nosotros__seccion-bajada">
            De un mostrador y dos estantes a la bodega de confianza del barrio.
          </p>
        </header>

        <div className="nosotros__historia">
          <div className="nosotros__relato">
            <p className="nosotros__parrafo nosotros__parrafo--apertura">
              La <strong>{BODEGA.nombre}</strong> abrió sus puertas el{" "}
              <strong>10 de enero de {anioFundacion}</strong> como un emprendimiento
              familiar. La idea era simple y sigue siendo la misma: que el vecino
              encuentre lo que necesita a la vuelta de la esquina, a buen precio y sin
              tener que cruzar media ciudad.
            </p>

            <p className="nosotros__parrafo">
              Con <strong>más de {aniosTrayectoria} años de trayectoria ininterrumpida</strong>{" "}
              en la misma urbanización, nos consolidamos gracias a la confianza de la
              comunidad. Aquí no hay rotación de personal: atiende la familia, y eso se
              nota en cómo tratamos a cada cliente.
            </p>

            <p className="nosotros__parrafo">
              Hoy damos un paso más con esta tienda en línea, pero la promesa no cambia:{" "}
              <strong>productos frescos, precios justos y atención cercana</strong>. Pide
              por la web y recoge en tienda, o deja que te lo llevemos a casa.
            </p>
          </div>

          <Card padding="lg">
            <ol className="nosotros__linea">
              {HITOS.map((hito) => (
                <li key={hito.titulo} className="nosotros__hito">
                  <span className="nosotros__hito-punto" aria-hidden="true" />
                  <span className="nosotros__hito-anio">{hito.anio}</span>
                  <h3 className="nosotros__hito-titulo">{hito.titulo}</h3>
                  <p className="nosotros__hito-texto">{hito.texto}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      {/* ================================================ 4. VALORES ===== */}
      <section aria-labelledby="titulo-valores">
        <header className="nosotros__seccion-cabecera">
          <h2 className="nosotros__seccion-titulo" id="titulo-valores">
            Por qué nos eligen
          </h2>
          <p className="nosotros__seccion-bajada">
            Cuatro razones por las que el barrio sigue comprando aquí después de{" "}
            {aniosTrayectoria} años.
          </p>
        </header>

        <div className="nosotros__valores">
          {VALORES.map((valor) => (
            <Card key={valor.titulo} padding="md">
              <div className="nosotros__valor">
                <span className="nosotros__valor-icono" aria-hidden="true">
                  {valor.icono}
                </span>
                <h3 className="nosotros__valor-titulo">{valor.titulo}</h3>
                <p className="nosotros__valor-texto">{valor.texto}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ================================================= 5. CIERRE ===== */}
      <section className="nosotros__cierre" aria-label="Visítanos">
        <h2 className="nosotros__cierre-titulo">Te esperamos en el barrio</h2>
        <p className="nosotros__cierre-texto">
          Estamos en {BODEGA.direccion}, {BODEGA.ciudad}. Atendemos {BODEGA.horario}.
        </p>

        <div className="nosotros__cierre-acciones">
          <Boton como={Link} to={RUTAS.INICIO} variante="primario" tamano="lg">
            Ver el catálogo
          </Boton>
          <Boton como={Link} to={RUTAS.UBICACION} variante="contorno" tamano="lg">
            Cómo llegar
          </Boton>
        </div>
      </section>
    </div>
  );
};

export default NosotrosPage;
