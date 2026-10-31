/**
 * ============================================================================
 * Footer · Pie completo de la tienda web (FASE 8)
 * ----------------------------------------------------------------------------
 * Estructura:
 *   1. Banda superior extra (4 bloques responsive):
 *      · Descarga la app: badges decorativos "Google Play" y "App Store".
 *      · Ayuda Call Center: número grande (073) 61 3888 + horario.
 *      · Síguenos: íconos redondos de Facebook, YouTube, X e Instagram con
 *        su color de marca al hover.
 *      · Libro de Reclamaciones: bloque destacado 📖 (requisito legal peruano).
 *   2. Cuerpo principal (se mantiene intacto): Marca, Tienda, Contacto y Horario.
 *   3. Base legal y créditos.
 * ==========================================================================*/

import { Link } from "react-router-dom";
import { BODEGA } from "../../constantes";
import { RUTAS } from "../../routes/rutas";
import "./Footer.css";

export function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="pie">
      {/* ====================================================================
       * BANDA EXTRA SUPERIOR (FASE 8: App · Call Center · Redes · Reclamaciones)
       * ================================================================== */}
      <div className="pie__banda-extra">
        <div className="contenedor pie__banda-grid">
          {/* 1. Descarga la app (badges decorativos Google Play y App Store) */}
          <div className="pie__extra-bloque">
            <p className="pie__titulo">Descarga la app</p>
            <p className="pie__extra-subtexto">
              Tus compras piuranas aún más rápido desde tu celular.
            </p>
            <div className="pie__stores" aria-label="Tiendas de aplicaciones (próximamente)">
              <span className="pie__store-badge" role="img" aria-label="Disponible en Google Play">
                <svg
                  className="pie__store-icono"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M3.61 1.814 13.793 12 3.61 22.186a1.1 1.1 0 0 1-.61-.986V2.8c0-.42.238-.798.61-.986Zm11.253 11.253 2.797 2.797-11.27 6.506 8.473-9.303ZM18.81 9.81l2.126 1.227c.752.434.752 1.492 0 1.926L18.81 14.19l-2.936-2.19 2.936-2.19ZM6.39 1.63l11.27 6.506-2.797 2.797L6.39 1.63Z" />
                </svg>
                <span className="pie__store-textos">
                  <small>DISPONIBLE EN</small>
                  <strong>Google Play</strong>
                </span>
              </span>

              <span className="pie__store-badge" role="img" aria-label="Consíguelo en el App Store">
                <svg
                  className="pie__store-icono"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83ZM15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3Z" />
                </svg>
                <span className="pie__store-textos">
                  <small>Consíguelo en el</small>
                  <strong>App Store</strong>
                </span>
              </span>
            </div>
          </div>

          {/* 2. Ayuda Call Center */}
          <div className="pie__extra-bloque">
            <p className="pie__titulo">Ayuda Call Center</p>
            <a href="tel:073613888" className="pie__callcenter-numero serif numero">
              📞 (073) 61 3888
            </a>
            <p className="pie__extra-subtexto">{BODEGA.horario}</p>
            <span className="pie__callcenter-chip">
              ● Atención directa en Piura
            </span>
          </div>

          {/* 3. Síguenos (Facebook, YouTube, X e Instagram con color de marca al hover) */}
          <div className="pie__extra-bloque">
            <p className="pie__titulo">Síguenos</p>
            <p className="pie__extra-subtexto">
              Entérate primero de nuestras ofertas diarias y recetas.
            </p>
            <div className="pie__redes" aria-label="Redes sociales de Bodega El Trigal">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="pie__red-btn pie__red-btn--facebook"
                aria-label="Síguenos en Facebook"
                title="Facebook"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 22v-8.2h2.8l.42-3.2H13.5V8.55c0-.93.26-1.56 1.6-1.56h1.7V4.14c-.3-.04-1.3-.14-2.47-.14-2.45 0-4.13 1.5-4.13 4.24v2.36H7.4v3.2h2.8V22h3.3Z" />
                </svg>
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="pie__red-btn pie__red-btn--youtube"
                aria-label="Síguenos en YouTube"
                title="YouTube"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81ZM10 15V9l5.2 3-5.2 3Z" />
                </svg>
              </a>

              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="pie__red-btn pie__red-btn--x"
                aria-label="Síguenos en X"
                title="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="pie__red-btn pie__red-btn--instagram"
                aria-label="Síguenos en Instagram"
                title="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.72 3.72 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* 4. Libro de Reclamaciones (requisito legal peruano) */}
          <div className="pie__extra-bloque">
            <p className="pie__titulo">Atención al consumidor</p>
            <Link
              to={RUTAS.LIBRO_RECLAMACIONES}
              className="pie__libro-reclamaciones"
              aria-label="Abrir Libro de Reclamaciones Virtual de Bodega El Trigal"
            >
              <span className="pie__libro-icono" aria-hidden="true">
                📖
              </span>
              <span className="pie__libro-textos">
                <strong className="serif">Libro de Reclamaciones</strong>
                <small>RUC {BODEGA.ruc} · INDECOPI Perú</small>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ====================================================================
       * CUERPO PRINCIPAL EXISTENTE (Marca · Tienda · Contacto · Horario)
       * ================================================================== */}
      <div className="contenedor pie__contenido">
        {/* --- Marca --- */}
        <div className="pie__columna pie__columna--marca">
          <p className="pie__nombre serif">🌾 {BODEGA.nombre}</p>
          <p className="pie__lema">{BODEGA.lema}</p>
          <p className="pie__texto">
            Abarrotes, bebidas y productos de primera necesidad. Atendemos a nuestro
            barrio desde hace más de 15 años.
          </p>
        </div>

        {/* --- Navegación --- */}
        <nav className="pie__columna" aria-label="Enlaces del pie">
          <p className="pie__titulo">Tienda</p>
          <Link to={RUTAS.INICIO} className="pie__enlace">
            Catálogo
          </Link>
          <Link to={RUTAS.CARRITO} className="pie__enlace">
            Mi carrito
          </Link>
          <Link to={RUTAS.NOSOTROS} className="pie__enlace">
            Nosotros
          </Link>
          <Link to={RUTAS.UBICACION} className="pie__enlace">
            Cómo llegar
          </Link>
        </nav>

        {/* --- Contacto --- */}
        <div className="pie__columna">
          <p className="pie__titulo">Contacto</p>
          <p className="pie__texto">{BODEGA.direccion}</p>
          <p className="pie__texto">{BODEGA.ciudad}</p>
          <a href={`tel:${BODEGA.telefono.replace(/\s/g, "")}`} className="pie__enlace">
            {BODEGA.telefono}
          </a>
          <a href={`mailto:${BODEGA.correo}`} className="pie__enlace">
            {BODEGA.correo}
          </a>
        </div>

        {/* --- Horario --- */}
        <div className="pie__columna">
          <p className="pie__titulo">Horario</p>
          <p className="pie__texto">{BODEGA.horario}</p>
          <a
            className="pie__whatsapp"
            href={`https://wa.me/${BODEGA.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>

      {/* ====================================================================
       * BASE LEGAL Y CRÉDITOS
       * ================================================================== */}
      <div className="pie__base">
        <div className="contenedor pie__base-contenido">
          <p>
            © {anio} {BODEGA.nombre} ({BODEGA.razonSocial}). Todos los derechos reservados.
          </p>
          <p className="pie__creditos">
            Proyecto académico · Herramientas de Desarrollo
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
