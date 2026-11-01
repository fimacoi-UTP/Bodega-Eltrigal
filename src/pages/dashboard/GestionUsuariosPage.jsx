/**
 * ============================================================================
 * GESTIÓN DE USUARIOS · Panel de Administración (F8.2) · Pulido Premium
 * ============================================================================
 * Ruta: /dashboard/usuarios · Acceso: SOLO ADMIN
 *
 * Módulo administrativo para listar, registrar, editar datos de perfil,
 * activar/desactivar cuentas y restablecer contraseñas de usuarios.
 * Consume /api/admin/usuarios con token JWT.
 * ==========================================================================*/

import { useState, useEffect, useMemo, useCallback } from "react";
import { adminUsuariosApi } from "../../api/adminUsuariosApi";
import { urlImagen } from "../../api/apiClient";
import { ROLES, ETIQUETAS_ROL } from "../../constantes";
import { obtenerIniciales, normalizarTexto, clases } from "../../utils/formato";
import {
  Boton,
  Card,
  Input,
  Select,
  Modal,
  Toast,
  EstadoVacio,
  Alerta,
} from "../../components/ui";
import "./GestionUsuariosPage.css";

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

/**
 * Componente visual de Avatar con anillo y micro-sombra según rol.
 * Si no hay imagen, muestra iniciales sobre un gradiente suave según rol
 * (ADMIN terracota, CAJERO ámbar, CLIENTE azul).
 */
function AvatarUsuario({ avatarUrl, nombre, rol = "CLIENTE" }) {
  const [errorCarga, setErrorCarga] = useState(false);
  const src = normalizarAvatarUrl(avatarUrl);
  const iniciales = obtenerIniciales(nombre);
  const rolClase = `usuario-avatar--${String(rol || "CLIENTE").toLowerCase()}`;

  if (src && !errorCarga) {
    return (
      <div className={clases("usuario-avatar", rolClase)}>
        <img
          src={src}
          alt={nombre}
          className="usuario-avatar__img"
          onError={() => setErrorCarga(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={clases("usuario-avatar", "usuario-avatar--iniciales", rolClase)}
      aria-hidden="true"
    >
      {iniciales}
    </div>
  );
}

/**
 * Badges unificados: ROL como pastilla pill con punto de color,
 * misma altura (24px) y tipografía uniforme:
 * - ADMIN: terracota
 * - CAJERO: ámbar
 * - CLIENTE: azul
 */
function BadgeRol({ rol }) {
  let claseRol = "usuario-badge-pill--cliente";
  let etiqueta = ETIQUETAS_ROL[ROLES.CLIENTE] || "Cliente";

  if (rol === ROLES.ADMIN) {
    claseRol = "usuario-badge-pill--admin";
    etiqueta = ETIQUETAS_ROL[ROLES.ADMIN] || "Administrador";
  } else if (rol === ROLES.CAJERO) {
    claseRol = "usuario-badge-pill--cajero";
    etiqueta = ETIQUETAS_ROL[ROLES.CAJERO] || "Cajero";
  }

  return (
    <span className={clases("usuario-badge-pill", claseRol)}>
      <span className="usuario-badge-pill__punto" aria-hidden="true" />
      {etiqueta}
    </span>
  );
}

/**
 * Badges unificados: ESTADO como pastilla pill con punto de color:
 * - Activo: verde
 * - Inactivo: gris apagado real (#475569 con dot #94a3b8)
 */
function BadgeEstado({ activo }) {
  return activo ? (
    <span className="usuario-badge-pill usuario-badge-pill--activo">
      <span className="usuario-badge-pill__punto" aria-hidden="true" />
      Activo
    </span>
  ) : (
    <span className="usuario-badge-pill usuario-badge-pill--inactivo">
      <span className="usuario-badge-pill__punto" aria-hidden="true" />
      Inactivo
    </span>
  );
}

/**
 * Skeleton Loader para la tabla con efecto shimmer mientras carga.
 */
function SkeletonUsuariosTabla({ filas = 6 }) {
  return (
    <div className="ui-tabla-scroll">
      <table className="ui-tabla">
        <caption className="visualmente-oculto">
          Cargando usuarios del sistema
        </caption>
        <thead>
          <tr>
            <th scope="col" style={{ width: "48px" }}>Avatar</th>
            <th scope="col">Nombre completo</th>
            <th scope="col">Email</th>
            <th scope="col">Rol</th>
            <th scope="col">Estado</th>
            <th scope="col" style={{ textAlign: "right", minWidth: "140px" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: filas }).map((_, i) => (
            <tr key={i} className="usuario-skeleton-fila">
              <td>
                <div className="usuario-skeleton-avatar" />
              </td>
              <td>
                <div className="usuario-skeleton-linea usuario-skeleton-linea--larga" />
                <div
                  className="usuario-skeleton-linea usuario-skeleton-linea--corta"
                  style={{ marginTop: "6px" }}
                />
              </td>
              <td>
                <div className="usuario-skeleton-linea usuario-skeleton-linea--media" />
              </td>
              <td>
                <div className="usuario-skeleton-badge" />
              </td>
              <td>
                <div className="usuario-skeleton-badge" />
              </td>
              <td>
                <div className="usuario-skeleton-acciones">
                  <div className="usuario-skeleton-btn" />
                  <div className="usuario-skeleton-btn" />
                  <div className="usuario-skeleton-btn" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Extrae el mensaje de error adecuado respetando las especificaciones:
 * - 409 -> "El email ya está registrado"
 * - 400 u otros -> mensaje provisto por el backend
 */
function extraerMensajeError(err, fallback = "Ocurrió un error inesperado.") {
  if (err?.status === 409) {
    return "El email ya está registrado";
  }
  if (err?.message) {
    return err.message;
  }
  return fallback;
}

export function GestionUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  // Notificaciones Toast
  const [toast, setToast] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioResetPassword, setUsuarioResetPassword] = useState(null);
  const [usuarioADesactivar, setUsuarioADesactivar] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  // Estados de carga de mutaciones
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState(null);

  // Formulario Crear
  const [formCrear, setFormCrear] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    password: "",
    rol: ROLES.CLIENTE,
    telefono: "",
  });

  // Formulario Editar
  const [formEditar, setFormEditar] = useState({
    nombres: "",
    apellidos: "",
    rol: ROLES.CLIENTE,
    telefono: "",
  });

  // Formulario Reset Password
  const [formPassword, setFormPassword] = useState({
    passwordNuevo: "",
    confirmarPassword: "",
  });

  // ── Cargar usuarios desde la API ──────────────────────────────────────────
  const cargarUsuarios = useCallback(async () => {
    try {
      const data = await adminUsuariosApi.listar();
      setUsuarios(Array.isArray(data) ? data : []);
      setErrorCarga(null);
    } catch (err) {
      setErrorCarga(
        err.message || "No se pudo cargar la lista de usuarios. Verifica la conexión con el servidor.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  const handleRefrescar = () => {
    setCargando(true);
    cargarUsuarios();
  };

  useEffect(() => {
    let cancelado = false;

    async function sincronizar() {
      try {
        const data = await adminUsuariosApi.listar();
        if (cancelado) return;
        setUsuarios(Array.isArray(data) ? data : []);
        setErrorCarga(null);
      } catch (err) {
        if (!cancelado) {
          setErrorCarga(
            err.message || "No se pudo cargar la lista de usuarios. Verifica la conexión con el servidor.",
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    sincronizar();

    return () => {
      cancelado = true;
    };
  }, []);

  // ── Métricas rápidas ──────────────────────────────────────────────────────
  const metricas = useMemo(() => {
    const total = usuarios.length;
    const admins = usuarios.filter((u) => u.rol === ROLES.ADMIN).length;
    const cajeros = usuarios.filter((u) => u.rol === ROLES.CAJERO).length;
    const clientes = usuarios.filter((u) => u.rol === ROLES.CLIENTE).length;
    const activos = usuarios.filter((u) => u.activo !== false).length;
    return { total, admins, cajeros, clientes, activos };
  }, [usuarios]);

  // ── Filtrado de usuarios ──────────────────────────────────────────────────
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      // Filtro de rol
      if (filtroRol !== "TODOS" && u.rol !== filtroRol) {
        return false;
      }
      // Filtro de estado
      if (filtroEstado === "ACTIVOS" && u.activo === false) {
        return false;
      }
      if (filtroEstado === "INACTIVOS" && u.activo !== false) {
        return false;
      }
      // Filtro de texto
      if (busqueda.trim()) {
        const query = normalizarTexto(busqueda);
        const nombreCompleto = normalizarTexto(
          `${u.nombres || ""} ${u.apellidos || ""} ${u.nombre || ""}`,
        );
        const email = normalizarTexto(u.email || "");
        const telefono = normalizarTexto(u.telefono || "");
        if (
          !nombreCompleto.includes(query) &&
          !email.includes(query) &&
          !telefono.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [usuarios, filtroRol, filtroEstado, busqueda]);

  // ── Abrir modal de Creación ───────────────────────────────────────────────
  const abrirModalCrear = () => {
    setErrorModal(null);
    setFormCrear({
      nombres: "",
      apellidos: "",
      email: "",
      password: "",
      rol: ROLES.CLIENTE,
      telefono: "",
    });
    setModalCrearAbierto(true);
  };

  // ── Enviar Formulario de Creación ─────────────────────────────────────────
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setErrorModal(null);

    const nombres = formCrear.nombres.trim();
    const apellidos = formCrear.apellidos.trim();
    const email = formCrear.email.trim();
    const password = formCrear.password.trim();
    const rol = formCrear.rol;
    const telefono = formCrear.telefono.trim();

    if (!nombres) {
      setErrorModal("El nombre es obligatorio.");
      return;
    }
    if (!apellidos) {
      setErrorModal("Los apellidos son obligatorios.");
      return;
    }
    if (!email) {
      setErrorModal("El email es obligatorio.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorModal("Ingresa un correo electrónico válido.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorModal("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!rol) {
      setErrorModal("Debes seleccionar un rol válido.");
      return;
    }

    try {
      setGuardando(true);
      await adminUsuariosApi.crear({
        nombres,
        apellidos,
        email,
        password,
        rol,
        telefono,
      });

      setToast({
        variante: "exito",
        titulo: "Usuario creado",
        mensaje: `Se registró a ${nombres} ${apellidos} correctamente.`,
      });
      setModalCrearAbierto(false);
      await cargarUsuarios();
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo crear el usuario.");
      setErrorModal(mensaje);
      setToast({
        variante: "peligro",
        titulo: "Error al crear usuario",
        mensaje,
      });
    } finally {
      setGuardando(false);
    }
  };

  // ── Abrir modal de Edición ────────────────────────────────────────────────
  const abrirModalEditar = (usuario) => {
    setErrorModal(null);
    setUsuarioEditando(usuario);
    setFormEditar({
      nombres: usuario.nombres || usuario.nombre || "",
      apellidos: usuario.apellidos || "",
      rol: usuario.rol || ROLES.CLIENTE,
      telefono: usuario.telefono || "",
    });
  };

  // ── Enviar Formulario de Edición ──────────────────────────────────────────
  const handleEditarUsuario = async (e) => {
    e.preventDefault();
    if (!usuarioEditando) return;
    setErrorModal(null);

    const nombres = formEditar.nombres.trim();
    const apellidos = formEditar.apellidos.trim();
    const rol = formEditar.rol;
    const telefono = formEditar.telefono.trim();

    if (!nombres) {
      setErrorModal("El nombre es obligatorio.");
      return;
    }
    if (!apellidos) {
      setErrorModal("Los apellidos son obligatorios.");
      return;
    }
    if (!rol) {
      setErrorModal("Debes seleccionar un rol válido.");
      return;
    }

    try {
      setGuardando(true);
      await adminUsuariosApi.actualizar(usuarioEditando.id, {
        nombres,
        apellidos,
        telefono,
        rol,
      });

      setToast({
        variante: "exito",
        titulo: "Usuario actualizado",
        mensaje: `Se actualizaron los datos de ${nombres} ${apellidos}.`,
      });
      setUsuarioEditando(null);
      await cargarUsuarios();
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo actualizar el usuario.");
      setErrorModal(mensaje);
      setToast({
        variante: "peligro",
        titulo: "Error al actualizar",
        mensaje,
      });
    } finally {
      setGuardando(false);
    }
  };

  // ── Abrir modal de Reset Password ─────────────────────────────────────────
  const abrirModalResetPassword = (usuario) => {
    setErrorModal(null);
    setUsuarioResetPassword(usuario);
    setFormPassword({
      passwordNuevo: "",
      confirmarPassword: "",
    });
  };

  // ── Enviar Reset Password ─────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!usuarioResetPassword) return;
    setErrorModal(null);

    const passwordNuevo = formPassword.passwordNuevo.trim();
    const confirmarPassword = formPassword.confirmarPassword.trim();

    if (!passwordNuevo || passwordNuevo.length < 6) {
      setErrorModal("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (passwordNuevo !== confirmarPassword) {
      setErrorModal("Las contraseñas no coinciden.");
      return;
    }

    try {
      setGuardando(true);
      await adminUsuariosApi.resetPassword(usuarioResetPassword.id, passwordNuevo);

      setToast({
        variante: "exito",
        titulo: "Contraseña actualizada",
        mensaje: `Se restableció la contraseña de ${usuarioResetPassword.email}.`,
      });
      setUsuarioResetPassword(null);
    } catch (err) {
      const mensaje = extraerMensajeError(
        err,
        "No se pudo restablecer la contraseña.",
      );
      setErrorModal(mensaje);
      setToast({
        variante: "peligro",
        titulo: "Error al restablecer contraseña",
        mensaje,
      });
    } finally {
      setGuardando(false);
    }
  };

  // ── Activar o Desactivar Usuario ──────────────────────────────────────────
  const toggleEstadoUsuario = async (usuario) => {
    const estaActivo = usuario.activo !== false;

    // Si está activo, solicitar confirmación elegante para desactivar
    if (estaActivo) {
      setUsuarioADesactivar(usuario);
      return;
    }

    // Si está inactivo, activar directamente
    try {
      await adminUsuariosApi.cambiarEstado(usuario.id, true);
      setToast({
        variante: "exito",
        titulo: "Usuario reactivado",
        mensaje: `La cuenta de ${usuario.email} ha sido activada.`,
      });
      await cargarUsuarios();
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo activar al usuario.");
      setToast({
        variante: "peligro",
        titulo: "Error al activar",
        mensaje,
      });
    }
  };

  // ── Confirmar Desactivación ───────────────────────────────────────────────
  const confirmarDesactivacion = async () => {
    if (!usuarioADesactivar) return;

    try {
      setGuardando(true);
      await adminUsuariosApi.cambiarEstado(usuarioADesactivar.id, false);
      setToast({
        variante: "info",
        titulo: "Usuario desactivado",
        mensaje: `La cuenta de ${usuarioADesactivar.email} ha sido desactivada.`,
      });
      setUsuarioADesactivar(null);
      await cargarUsuarios();
    } catch (err) {
      const mensaje = extraerMensajeError(
        err,
        "No se pudo desactivar al usuario.",
      );
      setToast({
        variante: "peligro",
        titulo: "Acción no permitida",
        mensaje,
      });
    } finally {
      setGuardando(false);
    }
  };

  // ── Confirmar Eliminación Definitiva ──────────────────────────────────────
  const confirmarEliminacion = async () => {
    if (!usuarioAEliminar) return;

    try {
      setGuardando(true);
      await adminUsuariosApi.eliminar(usuarioAEliminar.id);

      setToast({
        variante: "exito",
        titulo: "Usuario eliminado",
        mensaje: `Se eliminó al usuario ${usuarioAEliminar.email} definitivamente.`,
      });
      setUsuarioAEliminar(null);
      await cargarUsuarios();
    } catch (err) {
      // 409 -> usuario tiene ventas/pedidos/historial, sugerir desactivar
      if (err?.status === 409) {
        setToast({
          variante: "advertencia",
          titulo: "No se puede eliminar",
          mensaje:
            err.message ||
            "El usuario tiene registros asociados en el sistema (ventas o pedidos). Te sugerimos desactivarlo en su lugar.",
        });
      } else if (err?.status === 400) {
        setToast({
          variante: "peligro",
          titulo: "Acción no permitida",
          mensaje: err.message || "No puedes eliminar tu propia cuenta.",
        });
      } else {
        const mensaje = extraerMensajeError(
          err,
          "No se pudo eliminar al usuario.",
        );
        setToast({
          variante: "peligro",
          titulo: "Error al eliminar usuario",
          mensaje,
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="usuarios-gestion">
      {/* ──────────────────────────────────────────────── Cabecera ─────── */}
      <div className="usuarios-gestion__cabecera">
        <div className="usuarios-gestion__cabecera-textos">
          <div className="usuarios-gestion__marca-acento" aria-hidden="true">
            <span className="usuarios-gestion__marca-acento-linea" />
            <span className="usuarios-gestion__marca-acento-trigo">🌾</span>
          </div>
          <h1 className="usuarios-gestion__titulo">Gestión de usuarios</h1>
          <p className="usuarios-gestion__descripcion">
            Supervisa cuentas de clientes y personal, administra roles, accesos y contraseñas.
          </p>
        </div>

        <div className="usuarios-gestion__cabecera-acciones">
          <Boton
            variante="contorno"
            onClick={handleRefrescar}
            cargando={cargando}
            icono="↻"
          >
            Actualizar
          </Boton>
          <Boton
            variante="primario"
            onClick={abrirModalCrear}
            icono="+"
          >
            Nuevo usuario
          </Boton>
        </div>
      </div>

      {/* ────────────────────────────────────── Alerta de error global ─── */}
      {errorCarga && (
        <Alerta variante="peligro" onClose={() => setErrorCarga(null)}>
          {errorCarga}
        </Alerta>
      )}

      {/* ───────────────────────────── 1) STAT TILES PREMIUM ──────────── */}
      <section className="usuarios-gestion__metricas" aria-label="Estadísticas de usuarios">
        {/* Total usuarios */}
        <div className="usuarios-gestion__metrica-card usuarios-gestion__metrica-card--total">
          <div className="usuarios-gestion__metrica-contenido">
            <div className="usuarios-gestion__metrica-top">
              <span className="usuarios-gestion__metrica-etiqueta">Total usuarios</span>
              <div
                className="usuarios-gestion__metrica-chip usuarios-gestion__metrica-chip--total"
                aria-hidden="true"
              >
                👥
              </div>
            </div>
            <div className="usuarios-gestion__metrica-valor usuarios-gestion__metrica-valor--total serif">
              {metricas.total}
            </div>
            <div className="usuarios-gestion__metrica-pill-wrapper">
              <span className="usuarios-gestion__metrica-pill usuarios-gestion__metrica-pill--total">
                {metricas.activos} activos en el sistema
              </span>
            </div>
          </div>
        </div>

        {/* Administradores */}
        <div className="usuarios-gestion__metrica-card usuarios-gestion__metrica-card--admin">
          <div className="usuarios-gestion__metrica-contenido">
            <div className="usuarios-gestion__metrica-top">
              <span className="usuarios-gestion__metrica-etiqueta">Administradores</span>
              <div
                className="usuarios-gestion__metrica-chip usuarios-gestion__metrica-chip--admin"
                aria-hidden="true"
              >
                🛡️
              </div>
            </div>
            <div className="usuarios-gestion__metrica-valor usuarios-gestion__metrica-valor--admin serif">
              {metricas.admins}
            </div>
            <div className="usuarios-gestion__metrica-pill-wrapper">
              <span className="usuarios-gestion__metrica-pill usuarios-gestion__metrica-pill--admin">
                Acceso total al sistema
              </span>
            </div>
          </div>
        </div>

        {/* Cajeros */}
        <div className="usuarios-gestion__metrica-card usuarios-gestion__metrica-card--cajeros">
          <div className="usuarios-gestion__metrica-contenido">
            <div className="usuarios-gestion__metrica-top">
              <span className="usuarios-gestion__metrica-etiqueta">Cajeros</span>
              <div
                className="usuarios-gestion__metrica-chip usuarios-gestion__metrica-chip--cajeros"
                aria-hidden="true"
              >
                🧾
              </div>
            </div>
            <div className="usuarios-gestion__metrica-valor usuarios-gestion__metrica-valor--cajeros serif">
              {metricas.cajeros}
            </div>
            <div className="usuarios-gestion__metrica-pill-wrapper">
              <span className="usuarios-gestion__metrica-pill usuarios-gestion__metrica-pill--cajeros">
                Ventas e inventario
              </span>
            </div>
          </div>
        </div>

        {/* Clientes */}
        <div className="usuarios-gestion__metrica-card usuarios-gestion__metrica-card--clientes">
          <div className="usuarios-gestion__metrica-contenido">
            <div className="usuarios-gestion__metrica-top">
              <span className="usuarios-gestion__metrica-etiqueta">Clientes</span>
              <div
                className="usuarios-gestion__metrica-chip usuarios-gestion__metrica-chip--clientes"
                aria-hidden="true"
              >
                🛍️
              </div>
            </div>
            <div className="usuarios-gestion__metrica-valor usuarios-gestion__metrica-valor--clientes serif">
              {metricas.clientes}
            </div>
            <div className="usuarios-gestion__metrica-pill-wrapper">
              <span className="usuarios-gestion__metrica-pill usuarios-gestion__metrica-pill--clientes">
                Usuarios de la tienda web
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── Filtros ────── */}
      <Card padding="none" className="usuarios-gestion__tabla-card">
        <div className="usuarios-gestion__filtros">
          <Input
            className="usuarios-gestion__filtro-busqueda"
            etiqueta="Buscar usuario"
            type="search"
            placeholder="Buscar por nombre, correo o teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <Select
            className="usuarios-gestion__filtro-select"
            etiqueta="Filtrar por rol"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="TODOS">Todos los roles</option>
            <option value={ROLES.ADMIN}>Administradores (ADMIN)</option>
            <option value={ROLES.CAJERO}>Cajeros (CAJERO)</option>
            <option value={ROLES.CLIENTE}>Clientes (CLIENTE)</option>
          </Select>

          <Select
            className="usuarios-gestion__filtro-select"
            etiqueta="Estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVOS">Solo Activos</option>
            <option value="INACTIVOS">Solo Inactivos</option>
          </Select>
        </div>

        <div className="usuarios-gestion__barra-resultados">
          <span>
            Mostrando <strong>{usuariosFiltrados.length}</strong> de{" "}
            <strong>{usuarios.length}</strong> usuarios
          </span>
          {(busqueda || filtroRol !== "TODOS" || filtroEstado !== "TODOS") && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => {
                setBusqueda("");
                setFiltroRol("TODOS");
                setFiltroEstado("TODOS");
              }}
            >
              Limpiar filtros
            </Boton>
          )}
        </div>

        {/* ─────────────────────────── 4) ESTADOS: CARGA / VACÍO / TABLA ─ */}
        {cargando ? (
          <SkeletonUsuariosTabla filas={6} />
        ) : usuariosFiltrados.length === 0 ? (
          <div style={{ padding: "var(--esp-8, 2rem) var(--esp-4, 1rem)" }}>
            <EstadoVacio
              icono="👥"
              titulo="No se encontraron usuarios"
              descripcion={
                busqueda || filtroRol !== "TODOS" || filtroEstado !== "TODOS"
                  ? "Ningún usuario coincide con los criterios de búsqueda o filtros seleccionados."
                  : "Aún no hay usuarios registrados en el sistema."
              }
              accion={
                (busqueda || filtroRol !== "TODOS" || filtroEstado !== "TODOS") && (
                  <Boton
                    variante="contorno"
                    onClick={() => {
                      setBusqueda("");
                      setFiltroRol("TODOS");
                      setFiltroEstado("TODOS");
                    }}
                  >
                    Restablecer filtros
                  </Boton>
                )
              }
            />
          </div>
        ) : (
          <div className="ui-tabla-scroll">
            <table className="ui-tabla">
              <caption className="visualmente-oculto">
                Lista de usuarios registrados en el sistema
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={{ width: "48px" }}>Avatar</th>
                  <th scope="col">Nombre completo</th>
                  <th scope="col">Email</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado</th>
                  <th scope="col" style={{ textAlign: "right", minWidth: "180px" }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const nombreCompleto =
                    [u.nombres, u.apellidos].filter(Boolean).join(" ") ||
                    u.nombre ||
                    "Usuario sin nombre";
                  const estaActivo = u.activo !== false;

                  return (
                    <tr
                      key={u.id}
                      className={clases(
                        !estaActivo && "usuarios-tabla__fila--inactiva",
                      )}
                    >
                      {/* Avatar */}
                      <td>
                        <AvatarUsuario
                          avatarUrl={u.avatarUrl}
                          nombre={nombreCompleto}
                          rol={u.rol}
                        />
                      </td>

                      {/* Nombre */}
                      <td>
                        <div className="usuario-info-nombre">
                          <span className="usuario-nombre-principal">{nombreCompleto}</span>
                          {u.telefono && (
                            <span className="usuario-telefono-secundario">
                              📞 {u.telefono}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <span className="usuario-email-celda">{u.email}</span>
                      </td>

                      {/* Rol */}
                      <td>
                        <BadgeRol rol={u.rol} />
                      </td>

                      {/* Estado */}
                      <td>
                        <BadgeEstado activo={estaActivo} />
                      </td>

                      {/* Acciones: Botones-ícono compactos */}
                      <td>
                        <div className="usuarios-acciones" role="group" aria-label="Acciones de usuario">
                          <button
                            type="button"
                            className="usuario-btn-accion usuario-btn-accion--editar"
                            onClick={() => abrirModalEditar(u)}
                            title="Editar datos de usuario"
                            aria-label={`Editar datos de ${nombreCompleto}`}
                          >
                            <span aria-hidden="true">✏️</span>
                          </button>

                          <button
                            type="button"
                            className={clases(
                              "usuario-btn-accion",
                              estaActivo
                                ? "usuario-btn-accion--desactivar"
                                : "usuario-btn-accion--activar",
                            )}
                            onClick={() => toggleEstadoUsuario(u)}
                            title={estaActivo ? "Desactivar acceso" : "Activar acceso"}
                            aria-label={
                              estaActivo
                                ? `Desactivar cuenta de ${nombreCompleto}`
                                : `Activar cuenta de ${nombreCompleto}`
                            }
                          >
                            <span aria-hidden="true">⏻</span>
                          </button>

                          <button
                            type="button"
                            className="usuario-btn-accion usuario-btn-accion--password"
                            onClick={() => abrirModalResetPassword(u)}
                            title="Resetear contraseña"
                            aria-label={`Resetear contraseña de ${nombreCompleto}`}
                          >
                            <span aria-hidden="true">🔑</span>
                          </button>

                          <button
                            type="button"
                            className="usuario-btn-accion usuario-btn-accion--eliminar"
                            onClick={() => setUsuarioAEliminar(u)}
                            title="Eliminar usuario"
                            aria-label={`Eliminar definitivamente a ${nombreCompleto}`}
                          >
                            <span aria-hidden="true">🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ──────────────────────────────────────────────────────────────────
       * 3) MODAL 1: CREAR USUARIO
       * ──────────────────────────────────────────────────────────────── */}
      <Modal
        abierto={modalCrearAbierto}
        alCerrar={() => !guardando && setModalCrearAbierto(false)}
        titulo="Registrar nuevo usuario"
        tamano="md"
        pie={
          <>
            <Boton
              variante="contorno"
              onClick={() => setModalCrearAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              onClick={handleCrearUsuario}
              cargando={guardando}
            >
              Guardar usuario
            </Boton>
          </>
        }
      >
        <div className="usuario-modal-encabezado">
          <p className="usuario-modal-subtitulo">
            Completa los datos para dar de alta una nueva cuenta con rol asignado en la plataforma.
          </p>
        </div>

        <form
          onSubmit={handleCrearUsuario}
          className="usuario-modal-form"
          autoComplete="off"
        >
          {/* Inputs señuelo para neutralizar el autofill agresivo de Chrome */}
          <input
            type="text"
            name="chrome_prevent_autofill_text"
            tabIndex={-1}
            aria-hidden="true"
            style={{ display: "none" }}
            autoComplete="off"
          />
          <input
            type="password"
            name="chrome_prevent_autofill_password"
            tabIndex={-1}
            aria-hidden="true"
            style={{ display: "none" }}
            autoComplete="new-password"
          />

          {errorModal && (
            <div className="usuario-modal-alerta">
              <Alerta variante="peligro" onClose={() => setErrorModal(null)}>
                {errorModal}
              </Alerta>
            </div>
          )}

          <div className="usuario-modal-grid-2">
            <Input
              etiqueta="Nombres"
              name="usuario_nombres_nuevo"
              autoComplete="off"
              requerido
              placeholder="Ej. Juan Carlos"
              value={formCrear.nombres}
              onChange={(e) =>
                setFormCrear((prev) => ({ ...prev, nombres: e.target.value }))
              }
            />

            <Input
              etiqueta="Apellidos"
              name="usuario_apellidos_nuevo"
              autoComplete="off"
              requerido
              placeholder="Ej. Pérez García"
              value={formCrear.apellidos}
              onChange={(e) =>
                setFormCrear((prev) => ({ ...prev, apellidos: e.target.value }))
              }
            />
          </div>

          <div className="usuario-modal-grid-2">
            <Input
              etiqueta="Correo electrónico"
              name="usuario_email_nuevo"
              autoComplete="off"
              type="email"
              requerido
              placeholder="usuario@dominio.com"
              value={formCrear.email}
              onChange={(e) =>
                setFormCrear((prev) => ({ ...prev, email: e.target.value }))
              }
            />

            <Input
              etiqueta="Teléfono"
              name="usuario_telefono_nuevo"
              autoComplete="off"
              type="tel"
              placeholder="Ej. 920 123 456"
              value={formCrear.telefono}
              onChange={(e) =>
                setFormCrear((prev) => ({ ...prev, telefono: e.target.value }))
              }
            />
          </div>

          <div className="usuario-modal-grid-2">
            <Input
              etiqueta="Contraseña inicial"
              name="usuario_password_nuevo"
              autoComplete="new-password"
              type="password"
              requerido
              ayuda="Mínimo 6 caracteres"
              placeholder="••••••••"
              value={formCrear.password}
              onChange={(e) =>
                setFormCrear((prev) => ({ ...prev, password: e.target.value }))
              }
            />

            <Select
              etiqueta="Rol en el sistema"
              name="usuario_rol_nuevo"
              requerido
              value={formCrear.rol}
              onChange={(e) =>
                setFormCrear((prev) => ({ ...prev, rol: e.target.value }))
              }
            >
              <option value={ROLES.CLIENTE}>Cliente (Tienda web)</option>
              <option value={ROLES.CAJERO}>Cajero (Punto de venta)</option>
              <option value={ROLES.ADMIN}>Administrador (Control total)</option>
            </Select>
          </div>
        </form>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────────
       * 3) MODAL 2: EDITAR USUARIO
       * ──────────────────────────────────────────────────────────────── */}
      <Modal
        abierto={Boolean(usuarioEditando)}
        alCerrar={() => !guardando && setUsuarioEditando(null)}
        titulo="Editar usuario"
        tamano="md"
        pie={
          <>
            <Boton
              variante="contorno"
              onClick={() => setUsuarioEditando(null)}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              onClick={handleEditarUsuario}
              cargando={guardando}
            >
              Guardar cambios
            </Boton>
          </>
        }
      >
        <div className="usuario-modal-encabezado">
          <p className="usuario-modal-subtitulo">
            Modifica la información de contacto y el nivel de acceso asignado al usuario.
          </p>
        </div>

        <form
          onSubmit={handleEditarUsuario}
          className="usuario-modal-form"
          autoComplete="off"
        >
          {/* Inputs señuelo para neutralizar el autofill agresivo de Chrome */}
          <input
            type="text"
            name="chrome_prevent_autofill_text_edit"
            tabIndex={-1}
            aria-hidden="true"
            style={{ display: "none" }}
            autoComplete="off"
          />
          <input
            type="password"
            name="chrome_prevent_autofill_password_edit"
            tabIndex={-1}
            aria-hidden="true"
            style={{ display: "none" }}
            autoComplete="new-password"
          />

          {errorModal && (
            <div className="usuario-modal-alerta">
              <Alerta variante="peligro" onClose={() => setErrorModal(null)}>
                {errorModal}
              </Alerta>
            </div>
          )}

          <div className="usuario-desactivar-usuario-card">
            <AvatarUsuario
              avatarUrl={usuarioEditando?.avatarUrl}
              nombre={formEditar.nombres}
              rol={usuarioEditando?.rol}
            />
            <div className="usuario-desactivar-info">
              <strong>{usuarioEditando?.email}</strong>
              <span style={{ fontSize: "var(--texto-xs)", color: "var(--color-texto-tenue)" }}>
                ID: #{usuarioEditando?.id} · El correo y la contraseña se gestionan con acciones independientes.
              </span>
            </div>
          </div>

          <div className="usuario-modal-grid-2">
            <Input
              etiqueta="Nombres"
              name="usuario_nombres_editar"
              autoComplete="off"
              requerido
              value={formEditar.nombres}
              onChange={(e) =>
                setFormEditar((prev) => ({ ...prev, nombres: e.target.value }))
              }
            />

            <Input
              etiqueta="Apellidos"
              name="usuario_apellidos_editar"
              autoComplete="off"
              requerido
              value={formEditar.apellidos}
              onChange={(e) =>
                setFormEditar((prev) => ({ ...prev, apellidos: e.target.value }))
              }
            />
          </div>

          <div className="usuario-modal-grid-2">
            <Input
              etiqueta="Teléfono"
              name="usuario_telefono_editar"
              autoComplete="off"
              type="tel"
              value={formEditar.telefono}
              onChange={(e) =>
                setFormEditar((prev) => ({ ...prev, telefono: e.target.value }))
              }
            />

            <Select
              etiqueta="Rol"
              name="usuario_rol_editar"
              requerido
              value={formEditar.rol}
              onChange={(e) =>
                setFormEditar((prev) => ({ ...prev, rol: e.target.value }))
              }
            >
              <option value={ROLES.CLIENTE}>Cliente</option>
              <option value={ROLES.CAJERO}>Cajero</option>
              <option value={ROLES.ADMIN}>Administrador</option>
            </Select>
          </div>
        </form>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────────
       * 3) MODAL 3: RESETEAR CONTRASEÑA
       * ──────────────────────────────────────────────────────────────── */}
      <Modal
        abierto={Boolean(usuarioResetPassword)}
        alCerrar={() => !guardando && setUsuarioResetPassword(null)}
        titulo="Resetear contraseña"
        tamano="sm"
        pie={
          <>
            <Boton
              variante="contorno"
              onClick={() => setUsuarioResetPassword(null)}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              onClick={handleResetPassword}
              cargando={guardando}
            >
              Actualizar contraseña
            </Boton>
          </>
        }
      >
        <div className="usuario-modal-encabezado">
          <p className="usuario-modal-subtitulo">
            Establece una nueva contraseña de acceso segura para <strong>{usuarioResetPassword?.email}</strong>.
          </p>
        </div>

        <form
          onSubmit={handleResetPassword}
          className="usuario-modal-form"
          autoComplete="off"
        >
          {/* Inputs señuelo para neutralizar el autofill agresivo de Chrome */}
          <input
            type="text"
            name="chrome_prevent_autofill_text_reset"
            tabIndex={-1}
            aria-hidden="true"
            style={{ display: "none" }}
            autoComplete="off"
          />
          <input
            type="password"
            name="chrome_prevent_autofill_password_reset"
            tabIndex={-1}
            aria-hidden="true"
            style={{ display: "none" }}
            autoComplete="new-password"
          />

          {errorModal && (
            <div className="usuario-modal-alerta">
              <Alerta variante="peligro" onClose={() => setErrorModal(null)}>
                {errorModal}
              </Alerta>
            </div>
          )}

          <Input
            etiqueta="Nueva contraseña"
            name="usuario_password_nueva"
            autoComplete="new-password"
            type="password"
            requerido
            placeholder="Mínimo 6 caracteres"
            value={formPassword.passwordNuevo}
            onChange={(e) =>
              setFormPassword((prev) => ({
                ...prev,
                passwordNuevo: e.target.value,
              }))
            }
          />

          <Input
            etiqueta="Confirmar contraseña"
            name="usuario_password_confirmar"
            autoComplete="new-password"
            type="password"
            requerido
            placeholder="Repite la nueva contraseña"
            value={formPassword.confirmarPassword}
            onChange={(e) =>
              setFormPassword((prev) => ({
                ...prev,
                confirmarPassword: e.target.value,
              }))
            }
          />
        </form>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────────
       * 3) MODAL 4: CONFIRMACIÓN ELEGANTE DE DESACTIVACIÓN
       * ──────────────────────────────────────────────────────────────── */}
      <Modal
        abierto={Boolean(usuarioADesactivar)}
        alCerrar={() => !guardando && setUsuarioADesactivar(null)}
        titulo="¿Desactivar acceso de usuario?"
        tamano="sm"
        pie={
          <>
            <Boton
              variante="contorno"
              onClick={() => setUsuarioADesactivar(null)}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              onClick={confirmarDesactivacion}
              cargando={guardando}
              icono="⏻"
            >
              Desactivar usuario
            </Boton>
          </>
        }
      >
        <div className="usuario-modal-encabezado">
          <p className="usuario-modal-subtitulo">
            Esta acción impedirá inmediatamente que el usuario inicie sesión en la plataforma.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--esp-3, 0.75rem)" }}>
          <div className="usuario-desactivar-alerta">
            <span className="usuario-desactivar-alerta-icono" aria-hidden="true">⚠️</span>
            <div>
              <strong>Suspensión de cuenta:</strong> El usuario perderá el acceso
              a todas las funciones del sistema hasta que un administrador reactive su estado.
            </div>
          </div>

          {usuarioADesactivar && (
            <div className="usuario-desactivar-usuario-card">
              <AvatarUsuario
                avatarUrl={usuarioADesactivar.avatarUrl}
                nombre={
                  [usuarioADesactivar.nombres, usuarioADesactivar.apellidos]
                    .filter(Boolean)
                    .join(" ") || usuarioADesactivar.email
                }
                rol={usuarioADesactivar.rol}
              />
              <div className="usuario-desactivar-info">
                <strong>
                  {[usuarioADesactivar.nombres, usuarioADesactivar.apellidos]
                    .filter(Boolean)
                    .join(" ") || "Usuario"}
                </strong>
                <span style={{ fontSize: "var(--texto-xs)", color: "var(--color-texto-tenue)" }}>
                  {usuarioADesactivar.email} · Rol: {ETIQUETAS_ROL[usuarioADesactivar.rol] || usuarioADesactivar.rol}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────────
       * MODAL 5: CONFIRMACIÓN DESTRUCTIVA DE ELIMINACIÓN
       * ──────────────────────────────────────────────────────────────── */}
      <Modal
        abierto={Boolean(usuarioAEliminar)}
        alCerrar={() => !guardando && setUsuarioAEliminar(null)}
        titulo="Eliminar usuario"
        tamano="sm"
        pie={
          <>
            <Boton
              variante="contorno"
              onClick={() => setUsuarioAEliminar(null)}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              onClick={confirmarEliminacion}
              cargando={guardando}
              icono="🗑️"
            >
              Eliminar definitivamente
            </Boton>
          </>
        }
      >
        <div className="usuario-modal-encabezado">
          <p className="usuario-modal-subtitulo">
            Esta acción es permanente e irreversible. Se removerán los accesos y datos del usuario.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--esp-3, 0.75rem)" }}>
          <div className="usuario-desactivar-alerta">
            <span className="usuario-desactivar-alerta-icono" aria-hidden="true">⚠️</span>
            <div>
              <strong>Advertencia permanente:</strong> Esta acción borrará al usuario por completo.
              Si el usuario posee registros históricos de ventas o compras, el sistema impedirá
              la eliminación para preservar la integridad de datos.
            </div>
          </div>

          {usuarioAEliminar && (
            <div className="usuario-desactivar-usuario-card">
              <AvatarUsuario
                avatarUrl={usuarioAEliminar.avatarUrl}
                nombre={
                  [usuarioAEliminar.nombres, usuarioAEliminar.apellidos]
                    .filter(Boolean)
                    .join(" ") || usuarioAEliminar.email
                }
                rol={usuarioAEliminar.rol}
              />
              <div className="usuario-desactivar-info">
                <strong>
                  {[usuarioAEliminar.nombres, usuarioAEliminar.apellidos]
                    .filter(Boolean)
                    .join(" ") || "Usuario"}
                </strong>
                <span style={{ fontSize: "var(--texto-xs)", color: "var(--color-texto-tenue)" }}>
                  {usuarioAEliminar.email} · Rol: {ETIQUETAS_ROL[usuarioAEliminar.rol] || usuarioAEliminar.rol}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────────
       * TOAST DE FEEDBACK
       * ──────────────────────────────────────────────────────────────── */}
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
    </div>
  );
}

export default GestionUsuariosPage;
