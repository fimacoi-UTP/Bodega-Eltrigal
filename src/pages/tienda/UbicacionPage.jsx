/**
 * ============================================================================
 * UbicacionPage · Dónde queda la bodega y cómo llegar
 * ----------------------------------------------------------------------------
 * Ruta: /ubicacion · Pública
 *
 * Clave para la opción de "recojo en tienda" del checkout: el cliente tiene que
 * poder ver la dirección, el horario y abrir la ruta en su celular de un toque.
 *
 * Todos los datos salen de la constante BODEGA (src/constantes.js), incluidas
 * las coordenadas que arman el enlace de "Cómo llegar".
 * ==========================================================================*/

import { Link } from "react-router-dom";
import { Badge, Boton, Card } from "../../components/ui";
import { BODEGA } from "../../constantes";
import { RUTAS } from "../../routes/rutas";
import "./UbicacionPage.css";

/**
 * Mapa embebido de Google Maps con la ubicación real de la bodega.
 * Se guarda aparte para que el JSX quede legible.
 */
const MAPA_EMBEBIDO =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3973.4452117569!2d-80.65352262360969!3d-5.192485252374989!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x904a1a8c6a420849%3A0xa6d5a296667e107c!2sAv%20John%20F.%20Kennedy%20321%2C%20Piura%2020007!5e0!3m2!1ses-419!2spe!4v1789789603228!5m2!1ses-419!2spe";

export const UbicacionPage = () => {
  const { lat, lng } = BODEGA.coordenadas;

  /* Enlace de navegación paso a paso. Se arma con las coordenadas reales de
     BODEGA, así que si la bodega se muda basta con cambiar la constante. */
  const enlaceComoLlegar = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  /** Enlace a WhatsApp con un mensaje ya escrito. */
  const enlaceWhatsapp = `https://wa.me/${BODEGA.whatsapp}?text=${encodeURIComponent(
    `Hola ${BODEGA.nombre}, quisiera hacer un pedido.`,
  )}`;

  /** Teléfono sin espacios, para el enlace tel: */
  const telefonoLlamada = BODEGA.telefono.replace(/\s/g, "");

  return (
    <div className="contenedor ubicacion">
      {/* ================================================== 1. HERO ===== */}
      <section className="ubicacion-hero" aria-label="Ubicación de la bodega">
        <span className="ubicacion-hero__ornamento" aria-hidden="true">
          📍
        </span>

        <div className="ubicacion-hero__contenido">
          <Badge variante="marca" tamano="sm" className="ubicacion-hero__insignia">
            📍 Estamos en {BODEGA.ciudad}
          </Badge>

          <h1 className="ubicacion-hero__titulo">
            Visítanos o pide{" "}
            <span className="ubicacion-hero__destaque">delivery a tu casa</span>
          </h1>

          <p className="ubicacion-hero__descripcion">
            Nos encuentras en {BODEGA.direccion}. Recoge tu pedido en tienda cuando te
            quede de paso, o escríbenos por WhatsApp y te lo llevamos.
          </p>
        </div>
      </section>

      {/* ======================================== 2. DATOS DE CONTACTO ==== */}
      <section className="ubicacion__datos" aria-label="Datos de contacto">
        {/* --- Dirección --- */}
        <Card padding="md">
          <div className="ubicacion__dato">
            <span className="ubicacion__dato-icono" aria-hidden="true">
              📍
            </span>
            <h2 className="ubicacion__dato-titulo">Dirección</h2>
            <p className="ubicacion__dato-principal">{BODEGA.direccion}</p>
            <p className="ubicacion__dato-secundario">{BODEGA.ciudad}</p>

            <div className="ubicacion__dato-pie">
              <Boton
                como="a"
                href={enlaceComoLlegar}
                target="_blank"
                rel="noopener noreferrer"
                variante="contorno"
                tamano="sm"
                bloque
              >
                Abrir en Google Maps
              </Boton>
            </div>
          </div>
        </Card>

        {/* --- Horario --- */}
        <Card padding="md">
          <div className="ubicacion__dato">
            <span className="ubicacion__dato-icono" aria-hidden="true">
              🕖
            </span>
            <h2 className="ubicacion__dato-titulo">Horario de atención</h2>
            <p className="ubicacion__dato-principal">Abierto los 7 días</p>
            <p className="ubicacion__dato-secundario">{BODEGA.horario}</p>

            <div className="ubicacion__dato-pie">
              <Badge variante="exito" tamano="sm" punto>
                Pedidos web hasta las 9:00 p.m.
              </Badge>
            </div>
          </div>
        </Card>

        {/* --- Teléfono y WhatsApp --- */}
        <Card padding="md">
          <div className="ubicacion__dato">
            <span className="ubicacion__dato-icono" aria-hidden="true">
              📱
            </span>
            <h2 className="ubicacion__dato-titulo">Teléfono y WhatsApp</h2>

            <a className="ubicacion__dato-enlace" href={`tel:${telefonoLlamada}`}>
              {BODEGA.telefono}
            </a>
            <a className="ubicacion__dato-enlace" href={`mailto:${BODEGA.correo}`}>
              {BODEGA.correo}
            </a>

            <div className="ubicacion__dato-pie">
              <Boton
                como="a"
                href={enlaceWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                variante="secundario"
                tamano="sm"
                bloque
              >
                Escribir por WhatsApp
              </Boton>
            </div>
          </div>
        </Card>
      </section>

      {/* =================================================== 3. MAPA ===== */}
      <section className="ubicacion__mapa-bloque" aria-labelledby="titulo-mapa">
        <header className="ubicacion__mapa-cabecera">
          <h2 className="ubicacion__mapa-titulo" id="titulo-mapa">
            Cómo llegar
          </h2>
          <p className="ubicacion__mapa-bajada">
            {BODEGA.direccion} · {BODEGA.ciudad}
          </p>
        </header>

        {/* El iframe ocupa el 100% del marco; la altura la define el CSS y
            crece de 320px en celular a 460px en escritorio. */}
        <div className="ubicacion__mapa-marco">
          <iframe
            title={`Mapa de ubicación de ${BODEGA.nombre}`}
            src={MAPA_EMBEBIDO}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        <div className="ubicacion__acciones">
          <Boton
            como="a"
            href={enlaceComoLlegar}
            target="_blank"
            rel="noopener noreferrer"
            variante="primario"
            tamano="lg"
          >
            🧭 Cómo llegar
          </Boton>

          <Boton
            como="a"
            href={enlaceWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            variante="secundario"
            tamano="lg"
          >
            💬 Escríbenos por WhatsApp
          </Boton>

          <Boton como={Link} to={RUTAS.INICIO} variante="contorno" tamano="lg">
            Ver el catálogo
          </Boton>
        </div>
      </section>

      {/* ============================================== 4. DELIVERY ====== */}
      <Card padding="lg">
        <div className="ubicacion__nota">
          <h2 className="ubicacion__nota-titulo">
            <span aria-hidden="true">🛵</span> Delivery en la zona
          </h2>
          <p className="ubicacion__nota-texto">
            Repartimos nosotros mismos por los alrededores de {BODEGA.direccion}. Haz tu
            pedido desde el catálogo y elige <strong>delivery</strong> para que te llegue
            a casa, o <strong>recojo en tienda</strong> si prefieres pasar por aquí.
            Cualquier duda sobre la cobertura, escríbenos por WhatsApp.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default UbicacionPage;
