/**
 * ============================================================================
 * LoginPage · Inicio de sesión ÚNICO para los tres roles (Rediseño Premium)
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
 * ⚠️ AUTENTICACIÓN SIMULADA / DEMO. Ver la advertencia completa en
 *    src/repositories/usuarioRepository.js
 * ==========================================================================*/

import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTema } from "../../hooks/useTema";
import { Alerta, Boton, Input } from "../../components/ui";
import Logo from "../../components/layout/Logo";
import { RUTAS } from "../../routes/rutas";
import { ROLES_DASHBOARD, BODEGA, UMBRAL_DELIVERY_GRATIS } from "../../constantes";
import "./LoginPage.css";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Credenciales de prueba, mostradas en pantalla para facilitar la corrección
 * del trabajo y las pruebas del grupo.
 * 🔴 BORRAR ESTE BLOQUE antes de cualquier despliegue real.
 */
const CUENTAS_DEMO = [
  {
    codigo: "CLIENTE",
    rol: "Cliente",
    icono: "🛒",
    correo: "cliente@trigal.pe",
    clave: "cliente123",
    tono: "verde",
  },
  {
    codigo: "ADMIN",
    rol: "Administrador",
    icono: "🛡️",
    correo: "admin@trigal.pe",
    clave: "admin123",
    tono: "terracota",
  },
  {
    codigo: "CAJERO",
    rol: "Cajero",
    icono: "🧾",
    correo: "cajero@trigal.pe",
    clave: "cajero123",
    tono: "oro",
  },
];

const BENEFICIOS_LOGIN = [
  {
    icono: "🛵",
    titulo: `Delivery rápido en Piura`,
    detalle: `Envío gratis por compras desde S/ ${UMBRAL_DELIVERY_GRATIS} o recojo sin colas en bodega.`,
  },
  {
    icono: "🔥",
    titulo: "Ofertas y precios de casero",
    detalle: "Promociones diarias en abarrotes, lácteos, bebidas y productos frescos.",
  },
  {
    icono: "💬",
    titulo: "Atención directa por WhatsApp",
    detalle: `Soporte inmediato al ${BODEGA.telefono} y seguimiento en tiempo real de tu pedido.`,
  },
];

export function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);
  const [correoTocado, setCorreoTocado] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);
  const [cuentaRellenada, setCuentaRellenada] = useState(null);

  const timerFeedbackRef = useRef(null);
  const timerShakeRef = useRef(null);

  const { iniciarSesion, estaAutenticado, usuario, cargando } = useAuth();
  const { esOscuro, alternarTema } = useTema();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  useEffect(() => {
    return () => {
      if (timerFeedbackRef.current) clearTimeout(timerFeedbackRef.current);
      if (timerShakeRef.current) clearTimeout(timerShakeRef.current);
    };
  }, []);

  const activarShake = () => {
    setShakeCard(false);
    if (timerShakeRef.current) clearTimeout(timerShakeRef.current);
    // Forzar re-trigger del keyframe
    requestAnimationFrame(() => {
      setShakeCard(true);
      timerShakeRef.current = setTimeout(() => {
        setShakeCard(false);
      }, 500);
    });
  };

  /** Error inline del correo al perder foco o tras interacción */
  const correoInvalido =
    correoTocado && correo.trim().length > 0 && !REGEX_EMAIL.test(correo.trim());
  const errorCorreoInline = correoInvalido
    ? "Ingresa un correo electrónico válido (ej. casero@trigal.pe)"
    : null;

  /** Página desde la que <RutaProtegida> nos redirigió, si la hubo. */
  const destinoPrevio = ubicacion.state?.desde;

  /** Decide a dónde mandar al usuario según su rol. */
  const destinoSegunRol = (usuarioAutenticado) => {
    const esPersonal = ROLES_DASHBOARD.includes(usuarioAutenticado?.rol);
    if (destinoPrevio) {
      if (!esPersonal && String(destinoPrevio).startsWith(RUTAS.DASHBOARD)) {
        return RUTAS.INICIO;
      }
      return destinoPrevio;
    }
    return esPersonal ? RUTAS.DASHBOARD : RUTAS.INICIO;
  };

  // Si ya hay sesión abierta, no tiene sentido mostrar el login.
  if (!cargando && estaAutenticado) {
    return <Navigate to={destinoSegunRol(usuario)} replace />;
  }

  const alEnviar = async (evento) => {
    evento.preventDefault();
    setErrorLocal(null);
    setCorreoTocado(true);

    const correoLimpio = correo.trim();
    const claveLimpia = clave.trim();

    if (!correoLimpio || !claveLimpia) {
      setErrorLocal("Completa tu correo y tu contraseña.");
      activarShake();
      return;
    }

    if (!REGEX_EMAIL.test(correoLimpio)) {
      setErrorLocal("Ingresa un formato de correo electrónico válido.");
      activarShake();
      return;
    }

    setEnviando(true);
    try {
      const autenticado = await iniciarSesion(correoLimpio, claveLimpia);
      // `replace` para que el botón "atrás" no regrese al formulario de login.
      navegar(destinoSegunRol(autenticado), { replace: true });
    } catch (fallo) {
      setErrorLocal(fallo.message || "Error al iniciar sesión");
      activarShake();
    } finally {
      setEnviando(false);
    }
  };

  /** Rellena el formulario con una cuenta de prueba (comodidad para la demo). */
  const usarCuenta = (cuenta) => {
    setCorreo(cuenta.correo);
    setClave(cuenta.clave);
    setCorreoTocado(false);
    setErrorLocal(null);
    setCuentaRellenada(cuenta.rol);

    if (timerFeedbackRef.current) clearTimeout(timerFeedbackRef.current);
    timerFeedbackRef.current = setTimeout(() => {
      setCuentaRellenada(null);
    }, 2000);
  };

  const iconoOjoAbierto = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const iconoOjoCerrado = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <div className="auth-pagina">
      <div className={`auth-split ${shakeCard ? "auth-split--shake" : ""}`}>
        {/* ================================================================
         * PANEL IZQUIERDO · MARCA (degradado terracota + filigrana 🌾)
         * ============================================================== */}
        <aside className="auth-marca" aria-label="Bodega El Trigal">
          <span className="auth-marca__filigrana" aria-hidden="true">
            🌾
          </span>

          <div className="auth-marca__top">
            <Link to={RUTAS.INICIO} className="auth-marca__logo">
              <span className="auth-marca__isotipo" aria-hidden="true">
                🌾
              </span>
              <span className="auth-marca__logo-textos">
                <span className="auth-marca__logo-nombre serif">El Trigal</span>
                <span className="auth-marca__logo-lema">BODEGA · PIURA</span>
              </span>
            </Link>
            <span className="auth-marca__insignia">Desde 1994</span>
          </div>

          <div className="auth-marca__cuerpo">
            <span className="auth-marca__kicker">
              ✨ Tu despensa piurana en línea
            </span>
            <h2 className="auth-marca__titular serif">Bienvenido de vuelta</h2>
            <p className="auth-marca__bajada">
              Accede a tu cuenta para disfrutar precios de casero, repetir tus
              pedidos favoritos o gestionar la bodega en tiempo real.
            </p>

            <ul className="auth-marca__beneficios">
              {BENEFICIOS_LOGIN.map((item) => (
                <li key={item.titulo} className="auth-marca__beneficio">
                  <span className="auth-marca__beneficio-icono" aria-hidden="true">
                    {item.icono}
                  </span>
                  <div className="auth-marca__beneficio-texto">
                    <strong>{item.titulo}</strong>
                    <span>{item.detalle}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <footer className="auth-marca__pie">
            <span>📍 {BODEGA.direccion}, Piura</span>
            <span>🔒 Compra 100% protegida</span>
          </footer>
        </aside>

        {/* ================================================================
         * PANEL DERECHO · FORMULARIO PREMIUM
         * ============================================================== */}
        <main className="auth-panel">
          {/* Barra superior de acciones rápidas (Volver + Tema) */}
          <div className="auth-panel__barra">
            <Link to={RUTAS.INICIO} className="auth-volver-pill">
              <span aria-hidden="true">←</span>
              <span>Volver a la tienda</span>
            </Link>

            <button
              type="button"
              className="auth-tema-btn"
              onClick={alternarTema}
              aria-label={
                esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
              }
              title={esOscuro ? "Modo día" : "Modo noche"}
            >
              <span aria-hidden="true">{esOscuro ? "☀️" : "🌙"}</span>
            </button>
          </div>

          <div className="auth-card">
            <header className="auth-cabecera">
              <div className="auth-cabecera__logo-movil">
                <Logo />
              </div>
              <span className="auth-cabecera__chip">Acceso seguro</span>
              <h1 className="auth-cabecera__titulo serif">
                Bienvenido de vuelta
              </h1>
              <p className="auth-cabecera__subtitulo">
                Ingresa para comprar en línea o para gestionar la bodega.
              </p>
            </header>

            <form
              className="auth-formulario"
              onSubmit={alEnviar}
              noValidate
              autoComplete="off"
            >
              {/* Inputs señuelo para absorber el autofill agresivo de Chrome */}
              <input
                type="text"
                name="chrome_prevent_autofill_text_login"
                tabIndex={-1}
                aria-hidden="true"
                style={{ display: "none" }}
                autoComplete="off"
              />
              <input
                type="password"
                name="chrome_prevent_autofill_password_login"
                tabIndex={-1}
                aria-hidden="true"
                style={{ display: "none" }}
                autoComplete="new-password"
              />

              {errorLocal && (
                <div className="auth-toast-error">
                  <Alerta
                    variante="peligro"
                    alCerrar={() => setErrorLocal(null)}
                  >
                    {errorLocal}
                  </Alerta>
                </div>
              )}

              <Input
                etiqueta="Correo electrónico"
                type="email"
                name="correo"
                autoComplete="off"
                placeholder="tucorreo@trigal.pe"
                value={correo}
                autoFocus
                onBlur={() => setCorreoTocado(true)}
                error={errorCorreoInline}
                onChange={(evento) => {
                  setCorreo(evento.target.value);
                  if (errorLocal) setErrorLocal(null);
                }}
                requerido
              />

              <Input
                etiqueta="Contraseña"
                type={mostrarClave ? "text" : "password"}
                name="clave"
                autoComplete="new-password"
                placeholder="••••••••"
                value={clave}
                onChange={(evento) => {
                  setClave(evento.target.value);
                  if (errorLocal) setErrorLocal(null);
                }}
                sufijo={
                  <button
                    type="button"
                    className="registro__toggle-clave"
                    onClick={() => setMostrarClave((prev) => !prev)}
                    aria-label={
                      mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {mostrarClave ? iconoOjoCerrado : iconoOjoAbierto}
                  </button>
                }
                requerido
              />

              <Boton
                type="submit"
                tamano="lg"
                bloque
                cargando={enviando}
                disabled={enviando}
                className="auth-btn-submit"
              >
                {enviando ? (
                  "Ingresando..."
                ) : (
                  <>
                    <span>Ingresar a mi cuenta</span>
                    <span className="auth-btn-flecha" aria-hidden="true">
                      →
                    </span>
                  </>
                )}
              </Boton>
            </form>

            <p className="auth-cambio-vista">
              ¿No tienes una cuenta?{" "}
              <Link to={RUTAS.REGISTRO} className="auth-cambio-vista__enlace">
                Regístrate aquí
              </Link>
            </p>

            {/* ------------------------------------------------------------------
             * 🔴 BLOQUE DE DEMOSTRACIÓN — borrar en un despliegue real.
             * Existe para que el grupo y el docente prueben los tres roles sin
             * tener que buscar las claves en el README.
             * --------------------------------------------------------------- */}
            <section className="auth-demo" aria-label="Cuentas de demostración">
              <div className="auth-demo__cabecera">
                <span className="auth-demo__titulo">⚡ Cuentas de prueba</span>
                {cuentaRellenada ? (
                  <span
                    className="auth-demo-feedback"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="auth-demo-feedback__check" aria-hidden="true">
                      ✓
                    </span>
                    <span>
                      Credenciales de <strong>{cuentaRellenada}</strong> rellenadas
                    </span>
                  </span>
                ) : (
                  <span className="auth-demo__badge">1 clic autocompleta</span>
                )}
              </div>

              <div className="auth-demo__chips">
                {CUENTAS_DEMO.map((cuenta) => {
                  const activa = correo === cuenta.correo;
                  const flash = cuentaRellenada === cuenta.rol;
                  return (
                    <button
                      key={cuenta.correo}
                      type="button"
                      className={`auth-demo-chip auth-demo-chip--${cuenta.tono} ${
                        activa ? "auth-demo-chip--activa" : ""
                      } ${flash ? "auth-demo-chip--flash" : ""}`}
                      onClick={() => usarCuenta(cuenta)}
                    >
                      <div className="auth-demo-chip__top">
                        <span
                          className="auth-demo-chip__icono"
                          aria-hidden="true"
                        >
                          {cuenta.icono}
                        </span>
                        <span className="auth-demo-chip__rol">
                          {cuenta.codigo}
                        </span>
                      </div>
                      <span className="auth-demo-chip__correo">
                        {cuenta.correo}
                      </span>
                      <span className="auth-demo-chip__clave">
                        🔑 {cuenta.clave}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="auth-demo__nota">
                Toca cualquier rol (Cliente, Admin o Cajero) para rellenar tus
                credenciales al instante.
              </p>
            </section>

            <p className="auth-volver-pie">
              <Link to={RUTAS.INICIO}>← Volver a la tienda</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LoginPage;
