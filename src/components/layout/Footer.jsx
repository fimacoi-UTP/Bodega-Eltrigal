/**
 * Footer · Pie de la tienda web.
 * Los datos salen de BODEGA (src/constantes.js): se cambian en un solo lugar.
 */
import { Link } from "react-router-dom";
import { BODEGA } from "../../constantes";
import { RUTAS } from "../../routes/rutas";
import "./Footer.css";

export function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="pie">
      <div className="contenedor pie__contenido">
        {/* --- Marca --- */}
        <div className="pie__columna pie__columna--marca">
          <p className="pie__nombre">{BODEGA.nombre}</p>
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

      <div className="pie__base">
        <div className="contenedor pie__base-contenido">
          <p>
            © {anio} {BODEGA.nombre}. Todos los derechos reservados.
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
