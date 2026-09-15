/**
 * NoEncontradaPage · Error 404. Cubre cualquier URL que no exista.
 */
import { Link } from "react-router-dom";
import { Boton } from "../components/ui";
import { RUTAS } from "../routes/rutas";
import "./PaginaMensaje.css";

export function NoEncontradaPage() {
  return (
    <div className="mensaje">
      <div className="mensaje__caja">
        <span className="mensaje__codigo" aria-hidden="true">
          404
        </span>

        <h1 className="mensaje__titulo">Esta página no existe</h1>

        <p className="mensaje__texto">
          Puede que el enlace esté mal escrito o que la página se haya movido.
          Revisa la dirección o vuelve al catálogo.
        </p>

        <div className="mensaje__acciones">
          <Boton como={Link} to={RUTAS.INICIO}>
            Volver al catálogo
          </Boton>
          <Boton como={Link} to={RUTAS.UBICACION} variante="contorno">
            Cómo llegar a la bodega
          </Boton>
        </div>
      </div>
    </div>
  );
}

export default NoEncontradaPage;
