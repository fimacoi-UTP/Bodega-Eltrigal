/**
 * EstadoVacio · Qué mostrar cuando una lista no tiene nada.
 *
 * Un "no hay resultados" bien hecho es parte de una interfaz profesional:
 * explica por qué está vacío y ofrece la acción para llenarlo.
 *
 * @example
 * <EstadoVacio
 *   icono="🛒"
 *   titulo="Tu carrito está vacío"
 *   descripcion="Agrega productos desde el catálogo para continuar."
 *   accion={<Boton como={Link} to="/">Ver catálogo</Boton>}
 * />
 */
import { clases } from "../../utils/formato";
import "./EstadoVacio.css";

export function EstadoVacio({ icono, titulo, descripcion, accion, className }) {
  return (
    <div className={clases("ui-vacio", className)}>
      {icono && (
        <div className="ui-vacio__icono" aria-hidden="true">
          {icono}
        </div>
      )}
      {titulo && <h3 className="ui-vacio__titulo">{titulo}</h3>}
      {descripcion && <p className="ui-vacio__descripcion">{descripcion}</p>}
      {accion && <div className="ui-vacio__accion">{accion}</div>}
    </div>
  );
}

export default EstadoVacio;
