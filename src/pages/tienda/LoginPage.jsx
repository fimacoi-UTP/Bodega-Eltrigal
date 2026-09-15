/**
 * ============================================================================
 * LoginPage · Inicio de sesión ÚNICO para los tres roles
 * ----------------------------------------------------------------------------
 * ⚠️ ESTA PÁGINA NO ES UN CASCARÓN: está terminada, porque forma parte de la
 * infraestructura de autenticación que el resto de módulos necesita.
 *
 * Hay UN SOLO formulario de login. Lo que cambia es a dónde va el usuario
 * después, según su rol:
 *
 *      CLIENTE          →  /            (tienda web)
 *      ADMIN / CAJERO   →  /dashboard   (panel de gestión)
 *
 * Y si el usuario llegó aquí porque <RutaProtegida> lo mandó desde una página
 * privada, lo devolvemos a esa página en lugar de a la de por defecto.
 *
 * ⚠️ AUTENTICACIÓN SIMULADA. Ver la advertencia completa en
 *    src/repositories/usuarioRepository.js
 * ==========================================================================*/

import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Alerta, Boton, Input } from "../../components/ui";
import Logo from "../../components/layout/Logo";
import { RUTAS } from "../../routes/rutas";
import { ROLES_DASHBOARD } from "../../constantes";
import "./LoginPage.css";

/**
 * Credenciales de prueba, mostradas en pantalla para facilitar la corrección
 * del trabajo y las pruebas del grupo.
 * 🔴 BORRAR ESTE BLOQUE antes de cualquier despliegue real.
 */
const CUENTAS_DEMO = [
  { rol: "Cliente", correo: "cliente@trigal.pe", clave: "cliente123" },
  { rol: "Administrador", correo: "admin@trigal.pe", clave: "admin123" },
  { rol: "Cajero", correo: "cajero@trigal.pe", clave: "cajero123" },
];

export function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);

  const { iniciarSesion, estaAutenticado, usuario, cargando } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  /** Página desde la que <RutaProtegida> nos redirigió, si la hubo. */
  const destinoPrevio = ubicacion.state?.desde;

  /** Decide a dónde mandar al usuario según su rol. */
  const destinoSegunRol = (usuarioAutenticado) => {
    if (destinoPrevio) return destinoPrevio;
    return ROLES_DASHBOARD.includes(usuarioAutenticado.rol)
      ? RUTAS.DASHBOARD
      : RUTAS.INICIO;
  };

  // Si ya hay sesión abierta, no tiene sentido mostrar el login.
  if (!cargando && estaAutenticado) {
    return <Navigate to={destinoSegunRol(usuario)} replace />;
  }

  const alEnviar = async (evento) => {
    evento.preventDefault();
    setErrorLocal(null);

    if (!correo.trim() || !clave.trim()) {
      setErrorLocal("Completa tu correo y tu contraseña.");
      return;
    }

    setEnviando(true);
    try {
      const autenticado = await iniciarSesion(correo, clave);
      // `replace` para que el botón "atrás" no regrese al formulario de login.
      navegar(destinoSegunRol(autenticado), { replace: true });
    } catch (fallo) {
      setErrorLocal(fallo.message);
    } finally {
      setEnviando(false);
    }
  };

  /** Rellena el formulario con una cuenta de prueba (comodidad para la demo). */
  const usarCuenta = (cuenta) => {
    setCorreo(cuenta.correo);
    setClave(cuenta.clave);
    setErrorLocal(null);
  };

  return (
    <div className="login">
      <div className="login__caja">
        <header className="login__cabecera">
          <Logo />
          <h1 className="login__titulo">Bienvenido de vuelta</h1>
          <p className="login__subtitulo">
            Ingresa para comprar en línea o para gestionar la bodega.
          </p>
        </header>

        <form className="login__formulario" onSubmit={alEnviar} noValidate>
          {errorLocal && <Alerta variante="peligro">{errorLocal}</Alerta>}

          <Input
            etiqueta="Correo electrónico"
            type="email"
            name="correo"
            autoComplete="email"
            placeholder="tucorreo@trigal.pe"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            requerido
          />

          <Input
            etiqueta="Contraseña"
            type="password"
            name="clave"
            autoComplete="current-password"
            placeholder="••••••••"
            value={clave}
            onChange={(evento) => setClave(evento.target.value)}
            requerido
          />

          <Boton type="submit" tamano="lg" bloque cargando={enviando}>
            {enviando ? "Verificando…" : "Ingresar"}
          </Boton>
        </form>

        {/* ------------------------------------------------------------------
         * 🔴 BLOQUE DE DEMOSTRACIÓN — borrar en un despliegue real.
         * Existe para que el grupo y el docente prueben los tres roles sin
         * tener que buscar las claves en el README.
         * --------------------------------------------------------------- */}
        <section className="login__demo">
          <p className="login__demo-titulo">Cuentas de prueba</p>
          <div className="login__demo-lista">
            {CUENTAS_DEMO.map((cuenta) => (
              <button
                key={cuenta.correo}
                type="button"
                className="login__demo-cuenta"
                onClick={() => usarCuenta(cuenta)}
              >
                <span className="login__demo-rol">{cuenta.rol}</span>
                <span className="login__demo-correo">{cuenta.correo}</span>
                <span className="login__demo-clave">{cuenta.clave}</span>
              </button>
            ))}
          </div>
          <p className="login__demo-nota">
            Toca una cuenta para completar el formulario automáticamente.
          </p>
        </section>

        <p className="login__volver">
          <Link to={RUTAS.INICIO}>← Volver a la tienda</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
