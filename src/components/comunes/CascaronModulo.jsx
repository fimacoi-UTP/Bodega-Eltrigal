/**
 * ============================================================================
 * CascaronModulo · El "Módulo en construcción"
 * ----------------------------------------------------------------------------
 * 👋 SI LLEGASTE AQUÍ PORQUE TE TOCÓ UN MÓDULO: este componente es el que estás
 * viendo en pantalla. Tu trabajo es BORRARLO de tu página y poner tu módulo de
 * verdad en su lugar.
 *
 * Este cascarón no es un simple "Próximamente": también te muestra qué
 * infraestructura ya está lista para que la consumas y qué tienes que
 * construir. Es tu hoja de ruta.
 *
 * El panel "Infraestructura conectada" lee datos REALES del contexto. Si ves
 * el número de productos ahí, significa que la cadena
 * localStorage → repositorio → contexto → hook → tu página ya funciona.
 * ==========================================================================*/

import { Link } from "react-router-dom";
import { Badge, Card } from "../ui";
import { useInventario } from "../../hooks/useInventario";
import "./CascaronModulo.css";

export function CascaronModulo({
  /** Nombre del módulo, ej. "Catálogo de productos". */
  nombre,
  /** Para qué sirve el módulo, en una frase. */
  descripcion,
  /** Archivo que el integrante debe editar. */
  archivo,
  /** Qué hay que construir. @type {string[]} */
  tareas = [],
  /** Qué infraestructura puede usar. @type {string[]} */
  herramientas = [],
  /** Patrón de diseño que le toca implementar, si aplica. */
  patron,
  /** Contenido extra opcional. */
  children,
}) {
  // Prueba viva de que la infraestructura responde.
  const { productos, categorias, cargando } = useInventario();

  return (
    <div className="cascaron">
      {/* ------------------------------------------------ Encabezado ---- */}
      <header className="cascaron__encabezado">
        <Badge variante="advertencia" punto>
          Cascarón · pendiente de desarrollo
        </Badge>

        <h1 className="cascaron__titulo">Módulo en construcción — {nombre}</h1>

        {descripcion && <p className="cascaron__descripcion">{descripcion}</p>}
      </header>

      {/* --------------------------------------- Estado de los datos ---- */}
      <Card className="cascaron__estado" padding="sm">
        <div className="cascaron__estado-fila">
          <span className="cascaron__estado-punto" aria-hidden="true" />
          <div>
            <p className="cascaron__estado-titulo">Infraestructura conectada</p>
            <p className="cascaron__estado-texto">
              {cargando
                ? "Leyendo el repositorio…"
                : `${productos.length} productos y ${categorias.length} categorías disponibles ` +
                  `desde useInventario(). La capa de datos ya responde.`}
            </p>
          </div>
        </div>
      </Card>

      {/* --------------------------------------------- Instrucciones ---- */}
      <div className="cascaron__columnas">
        {tareas.length > 0 && (
          <Card>
            <h2 className="cascaron__subtitulo">Qué construir aquí</h2>
            <ul className="cascaron__lista">
              {tareas.map((tarea) => (
                <li key={tarea} className="cascaron__tarea">
                  <span className="cascaron__casilla" aria-hidden="true" />
                  <span>{tarea}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {herramientas.length > 0 && (
          <Card>
            <h2 className="cascaron__subtitulo">Ya lo tienes listo</h2>
            <ul className="cascaron__lista">
              {herramientas.map((herramienta) => (
                <li key={herramienta} className="cascaron__herramienta">
                  <code>{herramienta}</code>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {patron && (
        <Card className="cascaron__patron">
          <h2 className="cascaron__subtitulo">Patrón de diseño de este módulo</h2>
          <p className="cascaron__patron-texto">{patron}</p>
          <p className="cascaron__nota">
            Busca el comentario <code>🪝 GANCHO</code> en los archivos de la capa de
            datos: ahí está explicado con código de ejemplo.
          </p>
        </Card>
      )}

      {children}

      {/* ------------------------------------------------- Pie de guía --- */}
      <footer className="cascaron__pie">
        {archivo && (
          <p>
            Edita este archivo: <code>{archivo}</code>
          </p>
        )}
        <p>
          Antes de empezar, lee la sección{" "}
          <strong>“Para los integrantes: cómo trabajar tu módulo”</strong> del{" "}
          <code>README.md</code>. Trabaja siempre en tu propia rama, nunca en{" "}
          <code>main</code>.
        </p>
        <p className="cascaron__nota">
          ¿Perdido? Vuelve al <Link to="/">inicio</Link>.
        </p>
      </footer>
    </div>
  );
}

export default CascaronModulo;
