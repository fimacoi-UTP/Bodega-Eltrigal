/**
 * SinAccesoPage · Se muestra cuando el usuario SÍ inició sesión pero su rol no
 * alcanza para la sección que intenta abrir.
 *
 * No lo mandamos al login (sería confuso: ya está logueado). Le explicamos el
 * problema y le damos salidas.
 */
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Boton } from "../components/ui";
import { ETIQUETAS_ROL, ROLES_DASHBOARD } from "../constantes";
import { RUTAS } from "../routes/rutas";
import "./PaginaMensaje.css";

export function SinAccesoPage({ rolesRequeridos = [] }) {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  const alCambiarCuenta = async () => {
    await cerrarSesion();
    navegar(RUTAS.LOGIN);
  };

  const puedeVerPanel = usuario && ROLES_DASHBOARD.includes(usuario.rol);

  return (
    <div className="mensaje">
      <div className="mensaje__caja">
        <span className="mensaje__icono" aria-hidden="true">
          🔒
        </span>

        <h1 className="mensaje__titulo">No tienes acceso a esta sección</h1>

        <p className="mensaje__texto">
          {usuario ? (
            <>
              Tu cuenta es de tipo <strong>{ETIQUETAS_ROL[usuario.rol]}</strong>
              {rolesRequeridos.length > 0 && (
                <>
                  , y esta sección es solo para{" "}
                  <strong>
                    {rolesRequeridos
                      .map((rol) => ETIQUETAS_ROL[rol] ?? rol)
                      .join(" o ")}
                  </strong>
                </>
              )}
              .
            </>
          ) : (
            "Necesitas iniciar sesión para continuar."
          )}
        </p>

        <div className="mensaje__acciones">
          <Boton como={Link} to={RUTAS.INICIO}>
            Ir a la tienda
          </Boton>

          {puedeVerPanel && (
            <Boton como={Link} to={RUTAS.DASHBOARD} variante="contorno">
              Ir al panel
            </Boton>
          )}

          <Boton variante="fantasma" onClick={alCambiarCuenta}>
            Usar otra cuenta
          </Boton>
        </div>
      </div>
    </div>
  );
}

export default SinAccesoPage;
