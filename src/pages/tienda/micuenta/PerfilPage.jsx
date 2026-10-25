/**
 * ============================================================================
 * PerfilPage · Datos y Seguridad del Cliente
 * ----------------------------------------------------------------------------
 * Permite al usuario autenticado consultar y editar sus datos personales,
 * actualizar su foto de perfil y cambiar su contraseña de acceso.
 * ==========================================================================*/

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { usuariosApi } from "../../../api/usuariosApi";
import { imagenesApi } from "../../../api/imagenesApi";
import { urlImagen } from "../../../api/apiClient";
import {
  Alerta,
  Boton,
  Card,
  CardCabecera,
  CardCuerpo,
  Cargando,
  Input,
} from "../../../components/ui";
import { obtenerIniciales } from "../../../utils/formato";
import "./PerfilPage.css";

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

const iconoCamara = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export function PerfilPage() {
  const { actualizarSesion } = useAuth();
  const fileInputRef = useRef(null);

  // Estados de carga inicial
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [errorInicial, setErrorInicial] = useState(null);

  // Datos de perfil
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Estados de acción de perfil
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState(null);
  const [exitoPerfil, setExitoPerfil] = useState(null);

  // Estados de cambio de contraseña
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState(null);
  const [exitoPassword, setExitoPassword] = useState(null);
  const [erroresPassword, setErroresPassword] = useState({});

  // Cargar perfil al montar (una sola vez)
  useEffect(() => {
    let cancelado = false;

    async function cargarMe() {
      try {
        setCargandoInicial(true);
        setErrorInicial(null);
        const me = await usuariosApi.obtenerMe();
        if (cancelado) return;

        setNombres(me?.nombres || "");
        setApellidos(me?.apellidos || "");
        setTelefono(me?.telefono || "");
        setEmail(me?.email || me?.correo || "");
        setAvatarUrl(me?.avatarUrl || null);

        // Sincronizar en sesión de AuthProvider
        actualizarSesion(me);
      } catch (err) {
        if (!cancelado) {
          setErrorInicial(err.message || "No se pudo cargar la información de tu perfil.");
        }
      } finally {
        if (!cancelado) setCargandoInicial(false);
      }
    }

    cargarMe();

    return () => {
      cancelado = true;
    };
  }, [actualizarSesion]);

  // Manejo de nombres (solo letras y espacios)
  const handleNombresChange = (e) => {
    const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    setNombres(soloLetras);
    setErrorPerfil(null);
    setExitoPerfil(null);
  };

  // Manejo de apellidos (solo letras y espacios)
  const handleApellidosChange = (e) => {
    const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    setApellidos(soloLetras);
    setErrorPerfil(null);
    setExitoPerfil(null);
  };

  // Manejo de teléfono (solo dígitos, máximo 9)
  const handleTelefonoChange = (e) => {
    const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 9);
    setTelefono(soloDigitos);
    setErrorPerfil(null);
    setExitoPerfil(null);
  };

  // Subir imagen de avatar
  const handleArchivoSeleccionado = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setErrorPerfil("Por favor selecciona un archivo de imagen válido.");
      return;
    }

    setSubiendoAvatar(true);
    setErrorPerfil(null);
    setExitoPerfil(null);

    try {
      const urlRelativa = await imagenesApi.subir(archivo);
      setAvatarUrl(urlRelativa);
    } catch (err) {
      setErrorPerfil(err.message || "Error al subir la imagen de perfil.");
    } finally {
      setSubiendoAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Quitar foto de perfil
  const handleQuitarAvatar = () => {
    setAvatarUrl(null);
    setErrorPerfil(null);
    setExitoPerfil(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Guardar datos del perfil
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    if (!nombres.trim()) {
      setErrorPerfil("El campo nombres es obligatorio.");
      return;
    }

    if (telefono.trim() && telefono.trim().length !== 9) {
      setErrorPerfil("El teléfono debe tener 9 dígitos.");
      return;
    }

    setGuardandoPerfil(true);
    setErrorPerfil(null);
    setExitoPerfil(null);

    try {
      const respuesta = await usuariosApi.actualizarPerfil({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim() || null,
        avatarUrl: avatarUrl || null,
      });

      actualizarSesion(respuesta);
      setExitoPerfil("Tus datos personales se han actualizado correctamente.");
    } catch (err) {
      setErrorPerfil(err.message || "No se pudo actualizar tu perfil.");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // Guardar nueva contraseña
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPassword(null);
    setExitoPassword(null);

    const errores = {};
    if (!passwordActual) {
      errores.passwordActual = "Ingresa tu contraseña actual.";
    }
    if (!passwordNuevo || passwordNuevo.length < 6) {
      errores.passwordNuevo = "La nueva contraseña debe tener mínimo 6 caracteres.";
    }
    if (passwordNuevo !== confirmar) {
      errores.confirmar = "Las contraseñas no coinciden.";
    }

    if (Object.keys(errores).length > 0) {
      setErroresPassword(errores);
      return;
    }

    setErroresPassword({});
    setCambiandoPassword(true);

    try {
      await usuariosApi.cambiarPassword({
        passwordActual,
        passwordNuevo,
      });

      setExitoPassword("Contraseña actualizada exitosamente.");
      setPasswordActual("");
      setPasswordNuevo("");
      setConfirmar("");
    } catch (err) {
      setErrorPassword(
        err.message || "Error al cambiar la contraseña. Verifica que tu contraseña actual sea correcta.",
      );
    } finally {
      setCambiandoPassword(false);
    }
  };

  if (cargandoInicial) {
    return (
      <Card>
        <CardCuerpo>
          <Cargando texto="Cargando tus datos y seguridad…" />
        </CardCuerpo>
      </Card>
    );
  }

  const iniciales = obtenerIniciales(`${nombres} ${apellidos}`.trim() || "Usuario");

  return (
    <div className="perfil-page">
      {errorInicial && (
        <Alerta variante="advertencia" alCerrar={() => setErrorInicial(null)}>
          {errorInicial}
        </Alerta>
      )}

      {/* =====================================================================
          SECCIÓN 1: MIS DATOS
          ===================================================================== */}
      <Card>
        <CardCabecera
          titulo="Mis Datos"
          subtitulo="Actualiza tu información de contacto y tu foto de perfil."
        />
        <CardCuerpo>
          {errorPerfil && (
            <Alerta variante="peligro" alCerrar={() => setErrorPerfil(null)}>
              {errorPerfil}
            </Alerta>
          )}

          {exitoPerfil && (
            <Alerta variante="exito" alCerrar={() => setExitoPerfil(null)}>
              {exitoPerfil}
            </Alerta>
          )}

          <form
            className="perfil-formulario"
            onSubmit={handleGuardarPerfil}
            noValidate
            autoComplete="off"
          >
            {/* Inputs señuelo para absorber autofill agresivo */}
            <input
              type="text"
              name="chrome_prevent_autofill_text_perfil"
              tabIndex={-1}
              aria-hidden="true"
              style={{ display: "none" }}
              autoComplete="off"
            />
            <input
              type="password"
              name="chrome_prevent_autofill_password_perfil"
              tabIndex={-1}
              aria-hidden="true"
              style={{ display: "none" }}
              autoComplete="new-password"
            />
            {/* Control de Avatar Centrado a 120px */}
            <div className="perfil-avatar-seccion">
              <div className="perfil-avatar-circulo">
                {avatarUrl ? (
                  <img
                    src={urlImagen(avatarUrl)}
                    alt="Foto de perfil"
                    className="perfil-avatar-img"
                  />
                ) : (
                  <span className="perfil-avatar-iniciales" aria-hidden="true">
                    {iniciales}
                  </span>
                )}
              </div>

              <div className="perfil-avatar-acciones">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleArchivoSeleccionado}
                />
                <div className="perfil-avatar-botones">
                  <Boton
                    type="button"
                    variante="contorno"
                    tamano="sm"
                    cargando={subiendoAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    icono={iconoCamara}
                  >
                    {avatarUrl ? "Cambiar foto" : "Subir foto"}
                  </Boton>

                  {avatarUrl && (
                    <button
                      type="button"
                      className="perfil-avatar-btn-quitar"
                      disabled={subiendoAvatar}
                      onClick={handleQuitarAvatar}
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                <p className="perfil-avatar-ayuda">
                  Formatos permitidos: JPG, PNG o WEBP.
                </p>
              </div>
            </div>

            {/* Campos de texto */}
            <div className="perfil-form-grid">
              <Input
                etiqueta="Nombres"
                type="text"
                name="nombres"
                value={nombres}
                onChange={handleNombresChange}
                placeholder="Ej. Juan"
                requerido
              />

              <Input
                etiqueta="Apellidos"
                type="text"
                name="apellidos"
                value={apellidos}
                onChange={handleApellidosChange}
                placeholder="Ej. Pérez"
              />
            </div>

            <div className="perfil-form-grid">
              <Input
                etiqueta="Teléfono / Celular"
                type="tel"
                name="telefono"
                value={telefono}
                onChange={handleTelefonoChange}
                placeholder="9 dígitos (Ej. 920642639)"
                ayuda="Se usará para coordinar la entrega de tus pedidos."
              />

              <Input
                etiqueta="Correo electrónico"
                type="email"
                name="email"
                value={email}
                disabled
                ayuda="El correo está vinculado a tu cuenta y no puede modificarse."
              />
            </div>

            <div className="perfil-form-pie">
              <Boton type="submit" cargando={guardandoPerfil}>
                {guardandoPerfil ? "Guardando…" : "Guardar cambios"}
              </Boton>
            </div>
          </form>
        </CardCuerpo>
      </Card>

      {/* =====================================================================
          SECCIÓN 2: SEGURIDAD – CAMBIAR CONTRASEÑA
          ===================================================================== */}
      <Card>
        <CardCabecera
          titulo="Seguridad – Cambiar Contraseña"
          subtitulo="Protege tu cuenta actualizando tu contraseña periódicamente."
        />
        <CardCuerpo>
          {errorPassword && (
            <Alerta variante="peligro" alCerrar={() => setErrorPassword(null)}>
              {errorPassword}
            </Alerta>
          )}

          {exitoPassword && (
            <Alerta variante="exito" alCerrar={() => setExitoPassword(null)}>
              {exitoPassword}
            </Alerta>
          )}

          <form
            className="perfil-formulario"
            onSubmit={handleCambiarPassword}
            noValidate
            autoComplete="off"
          >
            {/* Inputs señuelo para absorber autofill agresivo */}
            <input
              type="text"
              name="chrome_prevent_autofill_text_pwd"
              tabIndex={-1}
              aria-hidden="true"
              style={{ display: "none" }}
              autoComplete="off"
            />
            <input
              type="password"
              name="chrome_prevent_autofill_password_pwd"
              tabIndex={-1}
              aria-hidden="true"
              style={{ display: "none" }}
              autoComplete="new-password"
            />

            <Input
              etiqueta="Contraseña actual"
              type={mostrarActual ? "text" : "password"}
              name="passwordActual"
              autoComplete="new-password"
              value={passwordActual}
              onChange={(e) => {
                setPasswordActual(e.target.value);
                setErroresPassword((prev) => ({ ...prev, passwordActual: null }));
              }}
              error={erroresPassword.passwordActual}
              placeholder="Ingresa tu contraseña actual"
              requerido
              sufijo={
                <button
                  type="button"
                  className="perfil-toggle-clave"
                  onClick={() => setMostrarActual((prev) => !prev)}
                  aria-label={mostrarActual ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                >
                  {mostrarActual ? iconoOjoCerrado : iconoOjoAbierto}
                </button>
              }
            />

            <div className="perfil-form-grid">
              <Input
                etiqueta="Nueva contraseña"
                type={mostrarNuevo ? "text" : "password"}
                name="passwordNuevo"
                autoComplete="new-password"
                value={passwordNuevo}
                onChange={(e) => {
                  setPasswordNuevo(e.target.value);
                  setErroresPassword((prev) => ({ ...prev, passwordNuevo: null }));
                }}
                error={erroresPassword.passwordNuevo}
                placeholder="Mínimo 6 caracteres"
                requerido
                sufijo={
                  <button
                    type="button"
                    className="perfil-toggle-clave"
                    onClick={() => setMostrarNuevo((prev) => !prev)}
                    aria-label={mostrarNuevo ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                  >
                    {mostrarNuevo ? iconoOjoCerrado : iconoOjoAbierto}
                  </button>
                }
              />

              <Input
                etiqueta="Confirmar nueva contraseña"
                type={mostrarConfirmar ? "text" : "password"}
                name="confirmar"
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => {
                  setConfirmar(e.target.value);
                  setErroresPassword((prev) => ({ ...prev, confirmar: null }));
                }}
                error={erroresPassword.confirmar}
                placeholder="Repite la nueva contraseña"
                requerido
                sufijo={
                  <button
                    type="button"
                    className="perfil-toggle-clave"
                    onClick={() => setMostrarConfirmar((prev) => !prev)}
                    aria-label={mostrarConfirmar ? "Ocultar confirmación" : "Mostrar confirmación"}
                  >
                    {mostrarConfirmar ? iconoOjoCerrado : iconoOjoAbierto}
                  </button>
                }
              />
            </div>

            <div className="perfil-form-pie">
              <Boton type="submit" cargando={cambiandoPassword} variante="primario">
                {cambiandoPassword ? "Actualizando…" : "Cambiar contraseña"}
              </Boton>
            </div>
          </form>
        </CardCuerpo>
      </Card>
    </div>
  );
}

export default PerfilPage;
