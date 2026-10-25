/**
 * ============================================================================
 * ModalMiPerfil · Gestión de perfil para Staff (Admin y Cajero) · F8.3
 * ----------------------------------------------------------------------------
 * Permite al personal administrativo y de caja gestionar su propia cuenta:
 * 1) Avatar: preview con anillo, cambio de foto vía imagenesApi.subir y PUT /me/avatar,
 *    remoción y fallback a iniciales con gradiente según rol.
 * 2) Datos personales: nombres, apellidos, teléfono editables (email solo lectura).
 * 3) Contraseña: actual + nueva + confirmación con validación.
 * Cada sección actualiza la sesión inmediatamente (actualizarSesion).
 * ==========================================================================*/

import { useState, useEffect, useRef } from "react";
import { Drawer, Input, Boton, Alerta, Toast } from "../ui";
import { usuariosApi } from "../../api/usuariosApi";
import { imagenesApi } from "../../api/imagenesApi";
import { urlImagen } from "../../api/apiClient";
import { useAuth } from "../../hooks/useAuth";
import { obtenerIniciales, clases } from "../../utils/formato";
import { ROLES, ETIQUETAS_ROL } from "../../constantes";
import "./ModalMiPerfil.css";

/**
 * Normaliza la URL del avatar:
 * Si es null, undefined, o el string "null" / "undefined", devuelve null.
 */
function normalizarAvatarUrl(url) {
  if (!url || typeof url !== "string") return null;
  const limpia = url.trim();
  if (limpia === "" || limpia === "null" || limpia === "undefined") {
    return null;
  }
  return urlImagen(limpia);
}

export function ModalMiPerfil({ abierto, alCerrar }) {
  const { usuario, actualizarSesion } = useAuth();

  // Estados de datos inicializados directamente desde la sesión activa
  const [avatarUrl, setAvatarUrl] = useState(() =>
    normalizarAvatarUrl(usuario?.avatarUrl),
  );
  const [avatarFallido, setAvatarFallido] = useState(null);
  const [nombres, setNombres] = useState(
    () => usuario?.nombres || usuario?.nombre || "",
  );
  const [apellidos, setApellidos] = useState(() => usuario?.apellidos || "");
  const [telefono, setTelefono] = useState(() => usuario?.telefono || "");
  const [email, setEmail] = useState(
    () => usuario?.email || usuario?.correo || "",
  );
  const [rol, setRol] = useState(() => usuario?.rol || ROLES.CLIENTE);

  // Estados de contraseña
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  // Estados de carga y feedback
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);

  // Sincronizar datos frescos desde el backend al montar el componente
  useEffect(() => {
    let cancelado = false;

    async function sincronizarPerfil() {
      try {
        const me = await usuariosApi.obtenerMe();
        if (cancelado || !me) return;
        setNombres(me.nombres || "");
        setApellidos(me.apellidos || "");
        setTelefono(me.telefono || "");
        setEmail(me.email || "");
        setRol(me.rol || ROLES.CLIENTE);
        setAvatarUrl(normalizarAvatarUrl(me.avatarUrl));
        actualizarSesion(me);
      } catch {
        /* Se mantiene el fallback de la sesión local */
      }
    }

    sincronizarPerfil();

    return () => {
      cancelado = true;
    };
  }, [actualizarSesion]);

  // ── Sección A: Gestión de Avatar ──────────────────────────────────────────
  const handleTriggerInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubirFoto = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setAlerta({
        tipo: "peligro",
        mensaje: "Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP).",
      });
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setAlerta({
        tipo: "peligro",
        mensaje: "La imagen no debe superar los 5MB de tamaño.",
      });
      return;
    }

    try {
      setSubiendoAvatar(true);
      setAlerta(null);
      setAvatarFallido(null);

      // 1. Subir al backend
      const urlRelativa = await imagenesApi.subir(archivo);

      // 2. Asociar al usuario vía PUT /api/usuarios/me/avatar
      const usuarioActualizado = await usuariosApi.actualizarAvatar(urlRelativa);

      const nuevaUrlNormalizada = normalizarAvatarUrl(urlRelativa);
      setAvatarUrl(nuevaUrlNormalizada);
      actualizarSesion({
        ...usuarioActualizado,
        avatarUrl: urlRelativa,
      });

      setToast({
        variante: "exito",
        titulo: "Foto actualizada",
        mensaje: "Tu foto de perfil ha sido actualizada exitosamente.",
      });
    } catch (err) {
      setAlerta({
        tipo: "peligro",
        mensaje: err.message || "No se pudo subir la foto de perfil.",
      });
    } finally {
      setSubiendoAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleQuitarFoto = async () => {
    try {
      setSubiendoAvatar(true);
      setAlerta(null);

      const usuarioActualizado = await usuariosApi.actualizarAvatar(null);
      setAvatarUrl(null);
      setAvatarFallido(null);

      actualizarSesion({
        ...usuarioActualizado,
        avatarUrl: null,
      });

      setToast({
        variante: "exito",
        titulo: "Foto removida",
        mensaje: "Se ha removido tu foto de perfil.",
      });
    } catch (err) {
      setAlerta({
        tipo: "peligro",
        mensaje: err.message || "No se pudo remover la foto de perfil.",
      });
    } finally {
      setSubiendoAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ── Sección B: Guardar Datos Personales ───────────────────────────────────
  const handleGuardarDatos = async (e) => {
    e.preventDefault();

    if (!nombres.trim()) {
      setAlerta({
        tipo: "peligro",
        mensaje: "El campo de nombres es obligatorio.",
      });
      return;
    }

    if (!apellidos.trim()) {
      setAlerta({
        tipo: "peligro",
        mensaje: "El campo de apellidos es obligatorio.",
      });
      return;
    }

    if (telefono.trim() && telefono.trim().length !== 9) {
      setAlerta({
        tipo: "peligro",
        mensaje: "El teléfono debe contener exactamente 9 dígitos.",
      });
      return;
    }

    try {
      setGuardandoDatos(true);
      setAlerta(null);

      const res = await usuariosApi.actualizarPerfil({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim() || null,
        avatarUrl: avatarUrl || null,
      });

      actualizarSesion(res);

      setToast({
        variante: "exito",
        titulo: "Perfil actualizado",
        mensaje: "Tus datos personales se han guardado correctamente.",
      });
    } catch (err) {
      setAlerta({
        tipo: "peligro",
        mensaje: err.message || "No se pudo actualizar tu información personal.",
      });
    } finally {
      setGuardandoDatos(false);
    }
  };

  // ── Sección C: Cambiar Contraseña ─────────────────────────────────────────
  const handleCambiarPassword = async (e) => {
    e.preventDefault();

    if (!passwordActual) {
      setAlerta({
        tipo: "peligro",
        mensaje: "Ingresa tu contraseña actual para continuar.",
      });
      return;
    }

    if (!passwordNuevo || passwordNuevo.length < 6) {
      setAlerta({
        tipo: "peligro",
        mensaje: "La nueva contraseña debe tener un mínimo de 6 caracteres.",
      });
      return;
    }

    if (passwordNuevo !== confirmarPassword) {
      setAlerta({
        tipo: "peligro",
        mensaje: "La nueva contraseña y su confirmación no coinciden.",
      });
      return;
    }

    try {
      setGuardandoPassword(true);
      setAlerta(null);

      await usuariosApi.cambiarPassword({
        passwordActual,
        passwordNuevo,
      });

      setPasswordActual("");
      setPasswordNuevo("");
      setConfirmarPassword("");

      setToast({
        variante: "exito",
        titulo: "Contraseña actualizada",
        mensaje: "Tu contraseña de acceso ha sido cambiada exitosamente.",
      });
    } catch (err) {
      setAlerta({
        tipo: "peligro",
        mensaje:
          err.message ||
          "Error al cambiar la contraseña. Verifica que tu clave actual sea correcta.",
      });
    } finally {
      setGuardandoPassword(false);
    }
  };

  const nombreCompleto = `${nombres} ${apellidos}`.trim() || usuario?.nombre || "Usuario";
  const iniciales = obtenerIniciales(nombreCompleto);
  const rolClase = `modal-perfil__avatar--${String(rol || "CLIENTE").toLowerCase()}`;

  return (
    <>
      <Drawer
        abierto={abierto}
        onClose={alCerrar}
        titulo="Mi perfil"
        subtitulo="Foto, datos personales y clave"
        tamano="md"
        className="modal-perfil-drawer"
        pie={
          <div className="modal-perfil__pie-drawer">
            <Boton
              variante="contorno"
              onClick={alCerrar}
              disabled={subiendoAvatar || guardandoDatos || guardandoPassword}
            >
              Cerrar
            </Boton>
          </div>
        }
      >
        <div className="modal-perfil">
          {/* Firma de marca terracota→oro trigo */}
          <div className="modal-perfil__marca-acento" aria-hidden="true">
            <span className="modal-perfil__marca-linea" />
            <span className="modal-perfil__marca-trigo">🌾</span>
          </div>

          <p className="modal-perfil__subtitulo">
            Gestiona tu cuenta institucional, fotografía de perfil y credenciales de acceso seguro.
          </p>

          {/* Alerta general del modal */}
          {alerta && (
            <div className="modal-perfil__alerta">
              <Alerta variante={alerta.tipo} onClose={() => setAlerta(null)}>
                {alerta.mensaje}
              </Alerta>
            </div>
          )}

          {/* ────────────────── SECCIÓN A: FOTOGRAFÍA DE PERFIL ───────────────── */}
          <section className="modal-perfil__seccion" aria-labelledby="seccion-avatar-titulo">
            <div className="modal-perfil__seccion-cabecera">
              <div className="modal-perfil__seccion-titulo-wrap">
                <span className="modal-perfil__seccion-icono" aria-hidden="true">📷</span>
                <h3 id="seccion-avatar-titulo" className="modal-perfil__seccion-titulo">
                  Foto de perfil
                </h3>
              </div>
              <span
                className={clases(
                  "modal-perfil__rol-pill",
                  `modal-perfil__rol-pill--${String(rol || "").toLowerCase()}`,
                )}
              >
                <span className="modal-perfil__rol-punto" aria-hidden="true" />
                {ETIQUETAS_ROL[rol] || rol}
              </span>
            </div>

            <div className="modal-perfil__avatar-bloque-vertical">
              <div className={clases("modal-perfil__avatar-preview", rolClase)}>
                {avatarUrl && avatarFallido !== avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={nombreCompleto}
                    className="modal-perfil__avatar-img"
                    onError={() => setAvatarFallido(avatarUrl)}
                  />
                ) : (
                  <span className="modal-perfil__avatar-iniciales" aria-hidden="true">
                    {iniciales}
                  </span>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleSubirFoto}
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: "none" }}
                aria-label="Seleccionar archivo de imagen para foto de perfil"
              />

              <div className="modal-perfil__avatar-botones">
                <Boton
                  type="button"
                  variante="primario"
                  tamano="sm"
                  onClick={handleTriggerInput}
                  cargando={subiendoAvatar}
                  icono="📁"
                >
                  Cambiar foto
                </Boton>

                {avatarUrl && (
                  <Boton
                    type="button"
                    variante="contorno"
                    tamano="sm"
                    onClick={handleQuitarFoto}
                    disabled={subiendoAvatar}
                    icono="🗑️"
                  >
                    Quitar
                  </Boton>
                )}
              </div>

              <p className="modal-perfil__avatar-ayuda">
                Formatos admitidos: PNG, JPG o WEBP. Tamaño máximo recomendado: 5MB.
              </p>
            </div>
          </section>

          {/* ─────────────── SECCIÓN B: INFORMACIÓN PERSONAL ─────────────────── */}
          <section className="modal-perfil__seccion" aria-labelledby="seccion-datos-titulo">
            <div className="modal-perfil__seccion-cabecera">
              <div className="modal-perfil__seccion-titulo-wrap">
                <span className="modal-perfil__seccion-icono" aria-hidden="true">👤</span>
                <h3 id="seccion-datos-titulo" className="modal-perfil__seccion-titulo">
                  Mis datos personales
                </h3>
              </div>
            </div>

            <form
              onSubmit={handleGuardarDatos}
              className="modal-perfil__form"
              autoComplete="off"
            >
              {/* Inputs señuelo anti-autofill */}
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

              <div className="modal-perfil__campo-readonly">
                <label className="ui-campo__etiqueta" htmlFor="perfil-email-input">
                  Correo institucional (solo lectura)
                </label>
                <div className="modal-perfil__input-bloqueado" id="perfil-email-input">
                  <span className="modal-perfil__input-bloqueado-icono" aria-hidden="true">✉️</span>
                  <span>{email || "Sin correo"}</span>
                  <span className="modal-perfil__input-bloqueado-badge">Inmutable</span>
                </div>
                <span className="ui-campo__ayuda">
                  El correo institucional está vinculado a la autenticación del sistema y no puede modificarse directamente.
                </span>
              </div>

              <div className="modal-perfil__grid-2">
                <Input
                  etiqueta="Nombres"
                  name="perfil_nombres"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  requerido
                  placeholder="Ej. Fidel"
                  autoComplete="off"
                />

                <Input
                  etiqueta="Apellidos"
                  name="perfil_apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  requerido
                  placeholder="Ej. Maco"
                  autoComplete="off"
                />
              </div>

              <Input
                etiqueta="Teléfono de contacto"
                name="perfil_telefono"
                type="tel"
                value={telefono}
                onChange={(e) => {
                  const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setTelefono(soloDigitos);
                }}
                placeholder="Ej. 987654321"
                autoComplete="off"
                ayuda="Opcional. Se utiliza para notificaciones del sistema y pedidos."
              />

              <div className="modal-perfil__acciones-seccion">
                <Boton
                  type="submit"
                  variante="primario"
                  cargando={guardandoDatos}
                  icono="💾"
                >
                  Guardar datos personales
                </Boton>
              </div>
            </form>
          </section>

          {/* ─────────────── SECCIÓN C: SEGURIDAD Y CONTRASEÑA ──────────────── */}
          <section className="modal-perfil__seccion" aria-labelledby="seccion-seguridad-titulo">
            <div className="modal-perfil__seccion-cabecera">
              <div className="modal-perfil__seccion-titulo-wrap">
                <span className="modal-perfil__seccion-icono" aria-hidden="true">🔒</span>
                <h3 id="seccion-seguridad-titulo" className="modal-perfil__seccion-titulo">
                  Seguridad y contraseña
                </h3>
              </div>
            </div>

            <form
              onSubmit={handleCambiarPassword}
              className="modal-perfil__form"
              autoComplete="off"
            >
              {/* Inputs señuelo ocultos anti-autofill de Chrome */}
              <input
                type="text"
                name="chrome_prevent_pwd_text"
                tabIndex={-1}
                aria-hidden="true"
                style={{ display: "none" }}
                autoComplete="off"
              />
              <input
                type="password"
                name="chrome_prevent_pwd_pwd"
                tabIndex={-1}
                aria-hidden="true"
                style={{ display: "none" }}
                autoComplete="new-password"
              />

              {/* Una sola columna: las tres claves apiladas a todo el ancho */}
              <Input
                etiqueta="Contraseña actual"
                name="perfil_password_actual"
                type="password"
                requerido
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                autoComplete="new-password"
              />

              <Input
                etiqueta="Nueva contraseña"
                name="perfil_password_nuevo"
                type="password"
                requerido
                value={passwordNuevo}
                onChange={(e) => setPasswordNuevo(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />

              <Input
                etiqueta="Confirmar nueva contraseña"
                name="perfil_password_confirmar"
                type="password"
                requerido
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                autoComplete="new-password"
              />

              <div className="modal-perfil__acciones-seccion">
                <Boton
                  type="submit"
                  variante="contorno"
                  cargando={guardandoPassword}
                  icono="🔑"
                >
                  Actualizar contraseña
                </Boton>
              </div>
            </form>
          </section>
        </div>
      </Drawer>

      {/* Notificación Toast reactiva */}
      {toast && (
        <Toast
          visible={Boolean(toast)}
          onCerrar={() => setToast(null)}
          variante={toast.variante}
          titulo={toast.titulo}
        >
          {toast.mensaje}
        </Toast>
      )}
    </>
  );
}

export const DrawerMiPerfil = ModalMiPerfil;
export default ModalMiPerfil;
