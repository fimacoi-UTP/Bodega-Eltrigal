/**
 * ============================================================================
 * RegistroPage · Registro de Clientes para la Tienda Web
 * ----------------------------------------------------------------------------
 * Permite a los clientes crear su cuenta para comprar en línea y hacer
 * seguimiento de sus pedidos. Al registrarse con éxito, el backend Spring Boot
 * (/api/auth/registro) devuelve el token JWT con auto-login y se redirige
 * directamente a la tienda web.
 * ==========================================================================*/

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Alerta, Boton, Input, Modal } from "../../components/ui";
import Logo from "../../components/layout/Logo";
import { RUTAS } from "../../routes/rutas";
import { ROLES_DASHBOARD } from "../../constantes";
import { TERMINOS_CONDICIONES } from "../../constantes/terminos";
import "./LoginPage.css";

const REGEX_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü '’-]+$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [enviando, setEnviando] = useState(false);

  const { registrarse, estaAutenticado, usuario, cargando } = useAuth();
  const navegar = useNavigate();

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

    if (!validarFormulario()) {
      setErrorGeneral("Revisa los campos señalados a continuación.");
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
      navegar(destinoSegunRol(autenticado), { replace: true });
    } catch (fallo) {
      setErrorGeneral(fallo.message || "Error al crear la cuenta");
    } finally {
      setEnviando(false);
    }
  };

  const iconoOjoAbierto = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const iconoOjoCerrado = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <div className="login">
      <div className="login__caja" style={{ maxWidth: "480px" }}>
        <header className="login__cabecera">
          <Logo />
          <h1 className="login__titulo">Crea tu cuenta</h1>
          <p className="login__subtitulo">
            Regístrate en Bodega El Trigal para comprar en línea y recibir promociones.
          </p>
        </header>

        <form
          className="login__formulario"
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

          {errorGeneral && <Alerta variante="peligro">{errorGeneral}</Alerta>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--esp-3)" }}>
            <Input
              etiqueta="Nombres"
              name="nombres"
              autoComplete="off"
              placeholder="Ej: Juan"
              value={formulario.nombres}
              onChange={handleChange}
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
              error={errores.apellidos}
              requerido
            />
          </div>

          <Input
            etiqueta="Correo electrónico"
            type="email"
            name="email"
            autoComplete="off"
            placeholder="juanperez@ejemplo.com"
            value={formulario.email}
            onChange={handleChange}
            error={errores.email}
            requerido
          />

          <Input
            etiqueta="Teléfono / WhatsApp (opcional)"
            type="tel"
            name="telefono"
            placeholder="987654321"
            value={formulario.telefono}
            onChange={handleChange}
            error={errores.telefono}
            ayuda="9 dígitos (celular Perú)"
          />

          <Input
            etiqueta="Contraseña"
            type={mostrarPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={formulario.password}
            onChange={handleChange}
            error={errores.password}
            sufijo={
              <button
                type="button"
                className="registro__toggle-clave"
                onClick={() => setMostrarPassword((prev) => !prev)}
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
            error={errores.confirmarPassword}
            sufijo={
              <button
                type="button"
                className="registro__toggle-clave"
                onClick={() => setMostrarConfirmarPassword((prev) => !prev)}
                aria-label={mostrarConfirmarPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
              >
                {mostrarConfirmarPassword ? iconoOjoCerrado : iconoOjoAbierto}
              </button>
            }
            requerido
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--esp-1)" }}>
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
                </button>
              </span>
            </label>
            {errores.terminos && (
              <p className="ui-campo__error" role="alert" style={{ margin: 0, paddingLeft: "24px" }}>
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
          >
            {enviando ? "Creando cuenta…" : "Registrarme"}
          </Boton>
        </form>

        <p style={{ textAlign: "center", fontSize: "var(--texto-sm)", color: "var(--color-texto-suave)" }}>
          ¿Ya tienes una cuenta?{" "}
          <Link to={RUTAS.LOGIN} style={{ fontWeight: "var(--peso-semi)", color: "var(--color-primario)" }}>
            Inicia sesión aquí
          </Link>
        </p>

        <p className="login__volver">
          <Link to={RUTAS.INICIO}>← Volver a la tienda</Link>
        </p>
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
