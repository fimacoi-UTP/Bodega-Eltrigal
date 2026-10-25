import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { direccionesApi } from "../../../api/direccionesApi";
import {
  Boton,
  Input,
  Select,
  Modal,
  Toast,
  Cargando,
  Alerta,
  EstadoVacio,
} from "../../../components/ui";
import "./DireccionesPage.css";

const DISTRITOS_PIURA = [
  "Piura",
  "Castilla",
  "Veintiséis de Octubre",
  "Catacaos",
  "Cura Mori",
  "El Tallán",
  "La Arena",
  "La Unión",
  "Las Lomas",
  "Tambogrande",
];

const SUGERENCIAS_ETIQUETA = ["Casa", "Trabajo", "Departamento", "Familia"];

function iconoPorEtiqueta(etiqueta = "") {
  const normalizado = etiqueta.toLowerCase().trim();
  if (normalizado.includes("casa") || normalizado.includes("hogar")) return "🏠";
  if (
    normalizado.includes("trabajo") ||
    normalizado.includes("oficina") ||
    normalizado.includes("chamba")
  ) {
    return "🏢";
  }
  if (normalizado.includes("depa") || normalizado.includes("edificio")) return "🏢";
  if (
    normalizado.includes("familia") ||
    normalizado.includes("mama") ||
    normalizado.includes("papá") ||
    normalizado.includes("padres")
  ) {
    return "❤️";
  }
  return "📍";
}

const FORM_INICIAL = {
  etiqueta: "Casa",
  destinatario: "",
  telefono: "",
  direccion: "",
  referencia: "",
  distrito: "Piura",
  ciudad: "Piura",
  predeterminada: false,
};

/**
 * ============================================================================
 * DireccionesPage · Gestión de direcciones de entrega del cliente
 * ----------------------------------------------------------------------------
 * Permite listar, agregar, editar, eliminar y marcar direcciones predeterminadas
 * contra /api/usuarios/me/direcciones.
 * ==========================================================================*/
export function DireccionesPage() {
  const { usuario } = useAuth();

  const [direcciones, setDirecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [direccionEditando, setDireccionEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Modal Confirmación Eliminar
  const [direccionAEliminar, setDireccionAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Estado de acción rápida (marcar predeterminada)
  const [marcandoId, setMarcandoId] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState({ visible: false, texto: "", variante: "exito" });

  const mostrarToast = (texto, variante = "exito") => {
    setToast({ visible: true, texto, variante });
  };

  const ocultarToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // Carga de direcciones
  const cargarDirecciones = useCallback(async () => {
    try {
      const data = await direccionesApi.listar();
      setDirecciones(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err?.message || "Error al cargar tus direcciones");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let cancelado = false;

    direccionesApi
      .listar()
      .then((data) => {
        if (!cancelado) {
          setDirecciones(Array.isArray(data) ? data : []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err?.message || "Error al cargar tus direcciones");
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Abrir modal para crear
  const abrirModalCrear = () => {
    const nombreUsuario = usuario?.nombres
      ? `${usuario.nombres} ${usuario.apellidos ?? ""}`.trim()
      : (usuario?.nombre || "");

    setDireccionEditando(null);
    setForm({
      etiqueta: "Casa",
      destinatario: nombreUsuario,
      telefono: usuario?.telefono || "",
      direccion: "",
      referencia: "",
      distrito: "Piura",
      ciudad: "Piura",
      predeterminada: direcciones.length === 0,
    });
    setErrores({});
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (dir) => {
    setDireccionEditando(dir);
    setForm({
      etiqueta: dir.etiqueta || "Casa",
      destinatario: dir.destinatario || "",
      telefono: dir.telefono || "",
      direccion: dir.direccion || "",
      referencia: dir.referencia || "",
      distrito: dir.distrito || "Piura",
      ciudad: dir.ciudad || "Piura",
      predeterminada: Boolean(dir.predeterminada),
    });
    setErrores({});
    setModalAbierto(true);
  };

  const handleCampoChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: null }));
    }
  };

  const validarFormulario = () => {
    const errs = {};
    if (!form.etiqueta.trim()) {
      errs.etiqueta = "La etiqueta es obligatoria (ej. Casa, Trabajo)";
    }
    if (!form.direccion.trim()) {
      errs.direccion = "La dirección de entrega es obligatoria";
    }
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  // Guardar dirección (crear o actualizar)
  const handleGuardar = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validarFormulario()) return;

    setGuardando(true);
    try {
      if (direccionEditando) {
        await direccionesApi.actualizar(direccionEditando.id, form);
        mostrarToast("Dirección actualizada correctamente", "exito");
      } else {
        await direccionesApi.crear(form);
        mostrarToast("Dirección agregada correctamente", "exito");
      }
      setModalAbierto(false);
      await cargarDirecciones();
    } catch (err) {
      mostrarToast(err?.message || "No se pudo guardar la dirección", "peligro");
    } finally {
      setGuardando(false);
    }
  };

  // Marcar como predeterminada
  const handleMarcarPredeterminada = async (id) => {
    setMarcandoId(id);
    try {
      await direccionesApi.marcarPredeterminada(id);
      mostrarToast("Dirección predeterminada actualizada", "exito");
      await cargarDirecciones();
    } catch (err) {
      mostrarToast(err?.message || "No se pudo marcar como predeterminada", "peligro");
    } finally {
      setMarcandoId(null);
    }
  };

  // Confirmar eliminación
  const confirmarEliminar = async () => {
    if (!direccionAEliminar) return;

    setEliminando(true);
    try {
      await direccionesApi.eliminar(direccionAEliminar.id);
      mostrarToast("Dirección eliminada", "exito");
      setDireccionAEliminar(null);
      await cargarDirecciones();
    } catch (err) {
      mostrarToast(err?.message || "No se pudo eliminar la dirección", "peligro");
    } finally {
      setEliminando(false);
    }
  };

  if (cargando) {
    return <Cargando texto="Cargando tus direcciones..." />;
  }

  return (
    <div className="direcciones-seccion">
      {/* Toast Feedback */}
      <Toast
        visible={toast.visible}
        onCerrar={ocultarToast}
        variante={toast.variante}
        autoCierreMs={4500}
      >
        {toast.texto}
      </Toast>

      {/* Cabecera */}
      <div className="direcciones-cabecera">
        <div>
          <h2 className="direcciones-titulo">Mis Direcciones</h2>
          <p className="direcciones-subtitulo">
            Administra tus lugares de entrega frecuentes para agilizar tus pedidos.
          </p>
        </div>

        <Boton
          variante="primario"
          onClick={abrirModalCrear}
          icono={<span aria-hidden="true">➕</span>}
        >
          Agregar dirección
        </Boton>
      </div>

      {error && (
        <Alerta variante="peligro" titulo="Error al cargar direcciones">
          {error}
        </Alerta>
      )}

      {/* Estado vacío o listado */}
      {direcciones.length === 0 ? (
        <EstadoVacio
          icono="📍"
          titulo="Aún no tienes direcciones guardadas"
          descripcion="Agrega una dirección para agilizar tus pedidos y recibir tus compras directamente en tu puerta."
          accion={
            <Boton variante="primario" onClick={abrirModalCrear}>
              Agregar tu primera dirección
            </Boton>
          }
        />
      ) : (
        <div className="direcciones-grid">
          {direcciones.map((dir) => {
            const esPredeterminada = Boolean(dir.predeterminada);
            const estaMarcando = marcandoId === dir.id;

            return (
              <article
                key={dir.id}
                className={`direccion-tarjeta ${
                  esPredeterminada ? "direccion-tarjeta--predeterminada" : ""
                }`}
              >
                <div>
                  <div className="direccion-tarjeta__top">
                    <span className="direccion-chip-etiqueta">
                      <span className="direccion-chip-etiqueta__icono" aria-hidden="true">
                        {iconoPorEtiqueta(dir.etiqueta)}
                      </span>
                      {dir.etiqueta || "Dirección"}
                    </span>

                    {esPredeterminada && (
                      <span className="direccion-badge-predeterminada">
                        <span aria-hidden="true">⭐</span> Predeterminada
                      </span>
                    )}
                  </div>

                  <div className="direccion-tarjeta__cuerpo" style={{ marginTop: "var(--esp-3)" }}>
                    <p className="direccion-texto">{dir.direccion}</p>

                    {dir.referencia && (
                      <p className="direccion-referencia">
                        <span className="direccion-referencia__label">Ref: </span>
                        {dir.referencia}
                      </p>
                    )}

                    <span className="direccion-ubicacion">
                      <span aria-hidden="true">📍</span>
                      {dir.distrito ? `${dir.distrito} · ` : ""}
                      {dir.ciudad || "Piura"}
                    </span>
                  </div>

                  {(dir.destinatario || dir.telefono) && (
                    <div className="direccion-contacto">
                      {dir.destinatario && (
                        <span className="direccion-contacto__item" title="Destinatario">
                          <span aria-hidden="true">👤</span> {dir.destinatario}
                        </span>
                      )}
                      {dir.telefono && (
                        <span
                          className="direccion-contacto__item direccion-contacto__telefono"
                          title="Teléfono de contacto"
                        >
                          <span aria-hidden="true">📞</span> {dir.telefono}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="direccion-tarjeta__acciones">
                  {!esPredeterminada && (
                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      className="direccion-boton-predeterminada"
                      onClick={() => handleMarcarPredeterminada(dir.id)}
                      cargando={estaMarcando}
                      disabled={estaMarcando}
                    >
                      Marcar predeterminada
                    </Boton>
                  )}

                  <Boton
                    variante="contorno"
                    tamano="sm"
                    onClick={() => abrirModalEditar(dir)}
                  >
                    Editar
                  </Boton>

                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    className="direccion-boton-eliminar"
                    onClick={() => setDireccionAEliminar(dir)}
                  >
                    Eliminar
                  </Boton>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => !guardando && setModalAbierto(false)}
        titulo={direccionEditando ? "Editar dirección" : "Agregar nueva dirección"}
        tamano="md"
        pie={
          <>
            <Boton
              variante="contorno"
              onClick={() => setModalAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              onClick={handleGuardar}
              cargando={guardando}
            >
              {direccionEditando ? "Guardar cambios" : "Guardar dirección"}
            </Boton>
          </>
        }
      >
        <form
          className="direccion-form"
          onSubmit={handleGuardar}
          noValidate
          autoComplete="off"
        >
          {/* Etiqueta con sugerencias rápidas */}
          <div>
            <Input
              etiqueta="Etiqueta *"
              placeholder="Ej. Casa, Trabajo, Depa"
              value={form.etiqueta}
              onChange={(e) => handleCampoChange("etiqueta", e.target.value)}
              error={errores.etiqueta}
              requerido
            />
            <div className="direccion-form__sugerencias">
              <span className="direccion-form__sugerencias-label">Sugerencias:</span>
              {SUGERENCIAS_ETIQUETA.map((sug) => (
                <button
                  type="button"
                  key={sug}
                  className={`direccion-chip-sugerencia ${
                    form.etiqueta.trim().toLowerCase() === sug.toLowerCase()
                      ? "direccion-chip-sugerencia--activo"
                      : ""
                  }`}
                  onClick={() => handleCampoChange("etiqueta", sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Destinatario y teléfono */}
          <div className="direccion-form__grid-2">
            <Input
              etiqueta="Destinatario"
              placeholder="Nombre de quien recibe"
              value={form.destinatario}
              onChange={(e) => handleCampoChange("destinatario", e.target.value)}
            />
            <Input
              etiqueta="Teléfono de contacto"
              placeholder="Ej. 987654321"
              type="tel"
              value={form.telefono}
              onChange={(e) => handleCampoChange("telefono", e.target.value)}
            />
          </div>

          {/* Dirección obligatoria */}
          <Input
            etiqueta="Dirección *"
            placeholder="Av., Jr., Calle, Urbanización, Mz. Lote..."
            value={form.direccion}
            onChange={(e) => handleCampoChange("direccion", e.target.value)}
            error={errores.direccion}
            requerido
          />

          {/* Referencia */}
          <Input
            etiqueta="Referencia de entrega"
            placeholder="Ej. Frente al parque, casa blanca de rejas negras..."
            value={form.referencia}
            onChange={(e) => handleCampoChange("referencia", e.target.value)}
            ayuda="Ayuda al repartidor a ubicar tu domicilio más rápido."
          />

          {/* Distrito y Ciudad */}
          <div className="direccion-form__grid-2">
            <Select
              etiqueta="Distrito"
              value={form.distrito}
              onChange={(e) => handleCampoChange("distrito", e.target.value)}
            >
              {DISTRITOS_PIURA.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>

            <Input
              etiqueta="Ciudad"
              value={form.ciudad}
              onChange={(e) => handleCampoChange("ciudad", e.target.value)}
              disabled
              ayuda="Zona metropolitana de Piura"
            />
          </div>

          {/* Checkbox predeterminada */}
          <label className="direccion-checkbox-campo">
            <input
              type="checkbox"
              checked={form.predeterminada}
              onChange={(e) => handleCampoChange("predeterminada", e.target.checked)}
            />
            <div className="direccion-checkbox-info">
              <span className="direccion-checkbox-titulo">
                Establecer como dirección predeterminada
              </span>
              <p className="direccion-checkbox-desc">
                Esta dirección se seleccionará automáticamente en tus próximos pedidos.
              </p>
            </div>
          </label>
        </form>
      </Modal>

      {/* Modal Confirmación de Eliminación */}
      <Modal
        abierto={Boolean(direccionAEliminar)}
        alCerrar={() => !eliminando && setDireccionAEliminar(null)}
        titulo="¿Eliminar dirección?"
        tamano="sm"
        pie={
          <>
            <Boton
              variante="contorno"
              onClick={() => setDireccionAEliminar(null)}
              disabled={eliminando}
            >
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              onClick={confirmarEliminar}
              cargando={eliminando}
            >
              Eliminar
            </Boton>
          </>
        }
      >
        <div className="direccion-modal-eliminar-cuerpo">
          <p className="direccion-modal-eliminar-texto">
            ¿Estás seguro de que deseas eliminar esta dirección de entrega? Esta acción no se
            puede deshacer.
          </p>
          {direccionAEliminar && (
            <div className="direccion-modal-eliminar-resumen">
              <strong>{direccionAEliminar.etiqueta}</strong>
              <div>{direccionAEliminar.direccion}</div>
              {direccionAEliminar.distrito && (
                <div style={{ color: "var(--color-texto-suave)", marginTop: "2px" }}>
                  {direccionAEliminar.distrito} · {direccionAEliminar.ciudad || "Piura"}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default DireccionesPage;
