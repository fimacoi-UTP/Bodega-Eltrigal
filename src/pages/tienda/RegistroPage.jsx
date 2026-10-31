/**
 * ============================================================================
 * RegistroPage · Registro de Clientes para la Tienda Web (Rediseño Premium)
 * ----------------------------------------------------------------------------
 * Permite a los clientes crear su cuenta para comprar en línea y hacer
 * seguimiento de sus pedidos. Al registrarse con éxito, el backend Spring Boot
 * (/api/auth/registro) devuelve el token JWT con auto-login y se redirige
 * directamente a la tienda web.
 * ==========================================================================*/

import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTema } from "../../hooks/useTema";
import { Alerta, Boton, Input, Modal } from "../../components/ui";
import Logo from "../../components/layout/Logo";
import { RUTAS } from "../../routes/rutas";
import { ROLES_DASHBOARD, BODEGA, UMBRAL_DELIVERY_GRATIS } from "../../constantes";
import { TERMINOS_CONDICIONES } from "../../constantes/terminos";
import "./LoginPage.css";

const REGEX_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü '’-]+$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BENEFICIOS_REGISTRO = [
  {
    icono: "🛵",
    titulo: `Envío gratis desde S/ ${UMBRAL_DELIVERY_GRATIS}`,
    detalle: "Recibe tus compras en la puerta de tu casa en Piura o recoge en tienda.",
  },
  {
    icono: "🏷️",
    titulo: "Ofertas exclusivas y Mi Despensa",
    detalle: "Guarda tus productos favoritos y repite tu pedido semanal en segundos.",
  },
  {
    icono: "💬",
    titulo: "Seguimiento y soporte por WhatsApp",
    detalle: "Conoce el estado de tu pedido paso a paso y comunícate directo con nosotros.",
  },
];

export function RegistroPage() {
  const [formulario, setFormulario] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    password: "",
    confirmarPassword: "",
  });

  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [modalTerminosAbierto, setModalTerminosAbierto] = useState(false);

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);

  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [exitoMensaje, setExitoMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);

  const timerShakeRef = useRef(null);
  const timerNavRef = useRef(null);

  const { registrarse, estaAutenticado, usuario, cargando } = useAuth();
  const { esOscuro, alternarTema } = useTema();
  const navegar = useNavigate();

  useEffect(() => {
    return () => {
      if (timerShakeRef.current) clearTimeout(timerShakeRef.current);
      if (timerNavRef.current) clearTimeout(timerNavRef.current);
    };
  }, []);

  const activarShake = () => {
    setShakeCard(false);
    if (timerShakeRef.current) clearTimeout(timerShakeRef.current);
    requestAnimationFrame(() => {
      setShakeCard(true);
      timerShakeRef.current = setTimeout(() => {
        setShakeCard(false);
      }, 500);
    });
  };

  const destinoSegunRol = (usuarioAutenticado) => {
    return ROLES_DASHBOARD.includes(usuarioAutenticado?.rol)
      ? RUTAS.DASHBOARD
      : RUTAS.INICIO;
  };

  if (!cargando && estaAutenticado) {
    return <Navigate to={destinoSegunRol(usuario)} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Nombres y Apellidos: impide ingreso de números y símbolos al escribir
    if (name === "nombres" || name === "apellidos") {
      const soloLetras = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü '’-]/g, "");
      setFormulario((prev) => ({ ...prev, [name]: soloLetras }));
      if (errores[name]) {
        setErrores((prev) => ({ ...prev, [name]: null }));
      }
      return;
    }

    // Teléfono: filtra inmediatamente a solo dígitos y máximo 9 caracteres
    if (name === "telefono") {
      const soloDigitos = value.replace(/\D/g, "").slice(0, 9);
      setFormulario((prev) => ({ ...prev, telefono: soloDigitos }));
      if (errores.telefono) {
        setErrores((prev) => ({ ...prev, telefono: null }));
      }
      return;
    }

    setFormulario((prev) => ({ ...prev, [name]: value }));

    // Limpia error inline al escribir en ese campo
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (name) => {
    const valor = (formulario[name] || "").trim();

    if (name === "nombres") {
      if (!valor) {
        setErrores((prev) => ({ ...prev, nombres: "Ingresa tus nombres." }));
      } else if (!REGEX_LETRAS.test(valor)) {
        setErrores((prev) => ({ ...prev, nombres: "Solo se permiten letras, tildes y guiones." }));
      }
    } else if (name === "apellidos") {
      if (!valor) {
        setErrores((prev) => ({ ...prev, apellidos: "Ingresa tus apellidos." }));
      } else if (!REGEX_LETRAS.test(valor)) {
        setErrores((prev) => ({ ...prev, apellidos: "Solo se permiten letras, tildes y guiones." }));
      }
    } else if (name === "email") {
      if (!valor) {
        setErrores((prev) => ({ ...prev, email: "Ingresa tu correo electrónico." }));
      } else if (!REGEX_EMAIL.test(valor)) {
        setErrores((prev) => ({ ...prev, email: "Ingresa un correo electrónico válido." }));
      }
    } else if (name === "telefono") {
      if (valor.length > 0 && valor.length !== 9) {
        setErrores((prev) => ({ ...prev, telefono: "El celular debe tener exactamente 9 dígitos." }));
      }
    } else if (name === "password") {
      if (!formulario.password) {
        setErrores((prev) => ({ ...prev, password: "Ingresa una contraseña." }));
      } else if (formulario.password.length < 6) {
        setErrores((prev) => ({ ...prev, password: "La contraseña debe tener al menos 6 caracteres." }));
      }
    } else if (name === "confirmarPassword") {
      if (!formulario.confirmarPassword) {
        setErrores((prev) => ({ ...prev, confirmarPassword: "Confirma tu contraseña." }));
      } else if (formulario.password !== formulario.confirmarPassword) {
        setErrores((prev) => ({ ...prev, confirmarPassword: "Las contraseñas no coinciden." }));
      }
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    // 1. Nombres
    const nombres = formulario.nombres.trim();
    if (!nombres) {
      nuevosErrores.nombres = "Ingresa tus nombres.";
    } else if (!REGEX_LETRAS.test(nombres)) {
      nuevosErrores.nombres = "Solo se permiten letras, tildes y guiones.";
    }

    // 2. Apellidos
    const apellidos = formulario.apellidos.trim();
    if (!apellidos) {
      nuevosErrores.apellidos = "Ingresa tus apellidos.";
    } else if (!REGEX_LETRAS.test(apellidos)) {
      nuevosErrores.apellidos = "Solo se permiten letras, tildes y guiones.";
    }

    // 3. Email
    const email = formulario.email.trim();
    if (!email) {
      nuevosErrores.email = "Ingresa tu correo electrónico.";
    } else if (!REGEX_EMAIL.test(email)) {
      nuevosErrores.email = "Ingresa un correo electrónico válido.";
    }

    // 4. Teléfono (opcional, pero si tiene algo debe tener exactamente 9 dígitos)
    const telefono = formulario.telefono.trim();
    if (telefono.length > 0 && telefono.length !== 9) {
      nuevosErrores.telefono = "El celular debe tener exactamente 9 dígitos.";
    }

    // 5. Contraseña
    if (!formulario.password) {
      nuevosErrores.password = "Ingresa una contraseña.";
    } else if (formulario.password.length < 6) {
      nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    // 6. Confirmar Contraseña
    if (!formulario.confirmarPassword) {
      nuevosErrores.confirmarPassword = "Confirma tu contraseña.";
    } else if (formulario.password !== formulario.confirmarPassword) {
      nuevosErrores.confirmarPassword = "Las contraseñas no coinciden.";
    }

    // 7. Términos y condiciones
    if (!terminosAceptados) {
      nuevosErrores.terminos = "Debes aceptar los términos y condiciones.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const alEnviar = async (evento) => {
    evento.preventDefault();
    setErrorGeneral(null);
    setExitoMensaje(null);

    if (!validarFormulario()) {
      setErrorGeneral("Revisa los campos señalados a continuación.");
      activarShake();
      return;
    }

    setEnviando(true);
    try {
      const autenticado = await registrarse({
        nombres: formulario.nombres.trim(),
        apellidos: formulario.apellidos.trim(),
        email: formulario.email.trim(),
        telefono: formulario.telefono.trim() || null,
        password: formulario.password,
      });
      setExitoMensaje("¡Cuenta creada con éxito! Ingresando a la tienda...");
      if (timerNavRef.current) clearTimeout(timerNavRef.current);
      timerNavRef.current = setTimeout(() => {
        navegar(destinoSegunRol(autenticado), { replace: true });
      }, 650);
    } catch (fallo) {
      setErrorGeneral(fallo.message || "Error al crear la cuenta");
      activarShake();
    } finally {
      setEnviando(false);
    }
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
      <div className={`auth-split auth-split--registro ${shakeCard ? "auth-split--shake" : ""}`}>
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
            <span className="auth-marca__insignia">Cuenta gratis</span>
          </div>

          <div className="auth-marca__cuerpo">
            <span className="auth-marca__kicker">
              🌾 Hazte casero digital en 1 minuto
            </span>
            <h2 className="auth-marca__titular serif">Únete a El Trigal</h2>
            <p className="auth-marca__bajada">
              Crea tu cuenta hoy y haz tus compras del hogar sin colas, con
              productos frescos seleccionados y pago rápido con Yape, Plin o
              efectivo.
            </p>

            <ul className="auth-marca__beneficios">
              {BENEFICIOS_REGISTRO.map((item) => (
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
            <span>💳 Yape · Plin · Efectivo</span>
          </footer>
        </aside>

        {/* ================================================================
         * PANEL DERECHO · FORMULARIO DE REGISTRO PREMIUM
         * ============================================================== */}
        <main className="auth-panel">
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

          <div className="auth-card auth-card--registro">
            <header className="auth-cabecera">
              <div className="auth-cabecera__logo-movil">
                <Logo />
              </div>
              <span className="auth-cabecera__chip">Nuevo cliente</span>
              <h1 className="auth-cabecera__titulo serif">Crea tu cuenta</h1>
              <p className="auth-cabecera__subtitulo">
                Regístrate en Bodega El Trigal para comprar en línea y recibir
                promociones.
              </p>
            </header>

            <form
              className="auth-formulario"
              onSubmit={alEnviar}
              noValidate
              autoComplete="off"
            >
              {/* Inputs señuelo para neutralizar el autofill agresivo de Chrome */}
              <input
                type="text"
                name="chrome_prevent_autofill_text_reg"
                tabIndex={-1}
                aria-hidden="true"
                style={{ display: "none" }}
                autoComplete="off"
              />
              <input
                type="password"
                name="chrome_prevent_autofill_password_reg"
                tabIndex={-1}
                aria-hidden="true"
                style={{ display: "none" }}
                autoComplete="new-password"
              />

              {exitoMensaje && (
                <div className="auth-toast-exito">
                  <Alerta variante="exito">
                    {exitoMensaje}
                  </Alerta>
                </div>
              )}

              {errorGeneral && (
                <div className="auth-toast-error">
                  <Alerta
                    variante="peligro"
                    alCerrar={() => setErrorGeneral(null)}
                  >
                    {errorGeneral}
                  </Alerta>
                </div>
              )}

              <div className="auth-grid-doble">
                <Input
                  etiqueta="Nombres"
                  name="nombres"
                  autoComplete="off"
                  placeholder="Ej: Juan"
                  autoFocus
                  value={formulario.nombres}
                  onChange={handleChange}
                  onBlur={() => handleBlur("nombres")}
                  error={errores.nombres}
                  requerido
                />
                <Input
                  etiqueta="Apellidos"
                  name="apellidos"
                  autoComplete="off"
                  placeholder="Ej: Pérez"
                  value={formulario.apellidos}
                  onChange={handleChange}
                  onBlur={() => handleBlur("apellidos")}
                  error={errores.apellidos}
                  requerido
                />
              </div>

              <div className="auth-grid-doble">
                <Input
                  etiqueta="Correo electrónico"
                  type="email"
                  name="email"
                  autoComplete="off"
                  placeholder="juanperez@ejemplo.com"
                  value={formulario.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  error={errores.email}
                  requerido
                />

                <Input
                  etiqueta="Celular / WhatsApp (opcional)"
                  type="tel"
                  name="telefono"
                  placeholder="987654321"
                  value={formulario.telefono}
                  onChange={handleChange}
                  onBlur={() => handleBlur("telefono")}
                  error={errores.telefono}
                  ayuda="9 dígitos (Perú)"
                />
              </div>

              <div className="auth-grid-doble">
                <Input
                  etiqueta="Contraseña"
                  type={mostrarPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={formulario.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur("password")}
                  error={errores.password}
                  sufijo={
                    <button
                      type="button"
                      className="registro__toggle-clave"
                      onClick={() => setMostrarPassword((prev) => !prev)}
                      aria-label={
                        mostrarPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {mostrarPassword ? iconoOjoCerrado : iconoOjoAbierto}
                    </button>
                  }
                  requerido
                />

                <Input
                  etiqueta="Confirmar contraseña"
                  type={mostrarConfirmarPassword ? "text" : "password"}
                  name="confirmarPassword"
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  value={formulario.confirmarPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur("confirmarPassword")}
                  error={errores.confirmarPassword}
                  sufijo={
                    <button
                      type="button"
                      className="registro__toggle-clave"
                      onClick={() =>
                        setMostrarConfirmarPassword((prev) => !prev)
                      }
                      aria-label={
                        mostrarConfirmarPassword
                          ? "Ocultar confirmación"
                          : "Mostrar confirmación"
                      }
                    >
                      {mostrarConfirmarPassword
                        ? iconoOjoCerrado
                        : iconoOjoAbierto}
                    </button>
                  }
                  requerido
                />
              </div>

              <div className="registro__bloque-terminos">
                <label className="registro__terminos">
                  <input
                    type="checkbox"
                    checked={terminosAceptados}
                    onChange={(e) => {
                      setTerminosAceptados(e.target.checked);
                      if (errores.terminos) {
                        setErrores((prev) => ({ ...prev, terminos: null }));
                      }
                    }}
                  />
                  <span>
                    Acepto los{" "}
                    <button
                      type="button"
                      className="registro__link-terminos"
                      onClick={(e) => {
                        e.preventDefault();
                        setModalTerminosAbierto(true);
                      }}
                    >
                      términos y condiciones
                    </button>{" "}
                    y el tratamiento de mis datos personales.
                  </span>
                </label>
                {errores.terminos && (
                  <p className="ui-campo__error registro__error-terminos" role="alert">
                    {errores.terminos}
                  </p>
                )}
              </div>

              <Boton
                type="submit"
                tamano="lg"
                bloque
                cargando={enviando}
                disabled={!terminosAceptados || enviando}
                className="auth-btn-submit"
              >
                {enviando ? (
                  "Creando cuenta..."
                ) : (
                  <>
                    <span>Crear mi cuenta</span>
                    <span className="auth-btn-flecha" aria-hidden="true">
                      →
                    </span>
                  </>
                )}
              </Boton>
            </form>

            <p className="auth-cambio-vista">
              ¿Ya tienes una cuenta?{" "}
              <Link to={RUTAS.LOGIN} className="auth-cambio-vista__enlace">
                Inicia sesión aquí
              </Link>
            </p>

            <p className="auth-volver-pie">
              <Link to={RUTAS.INICIO}>← Volver a la tienda</Link>
            </p>
          </div>
        </main>
      </div>

      {/* Modal de Términos y Condiciones */}
      <Modal
        abierto={modalTerminosAbierto}
        alCerrar={() => setModalTerminosAbierto(false)}
        titulo={TERMINOS_CONDICIONES.titulo}
        tamano="lg"
        pie={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--esp-2)" }}>
            <Boton
              variante="primario"
              onClick={() => {
                setTerminosAceptados(true);
                setModalTerminosAbierto(false);
                if (errores.terminos) {
                  setErrores((prev) => ({ ...prev, terminos: null }));
                }
              }}
            >
              Aceptar términos
            </Boton>
          </div>
        }
      >
        <div className="registro__terminos-cuerpo">
          <p className="registro__terminos-fecha">{TERMINOS_CONDICIONES.actualizacion}</p>
          {TERMINOS_CONDICIONES.secciones.map((sec) => (
            <div key={sec.numero} className="registro__terminos-item">
              <h3 className="registro__terminos-subtitulo">
                {sec.numero}. {sec.titulo}
              </h3>
              <p className="registro__terminos-parrafo">{sec.contenido}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default RegistroPage;
