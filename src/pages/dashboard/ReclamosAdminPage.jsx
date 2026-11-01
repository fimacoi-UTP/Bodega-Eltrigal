/**
 * ============================================================================
 * GESTIÓN DEL LIBRO DE RECLAMACIONES · Dashboard Admin
 * ----------------------------------------------------------------------------
 * Ruta: /dashboard/reclamos · Acceso: SOLO ADMIN
 *
 * Módulo administrativo para listar, auditar y resolver las hojas de
 * reclamación virtual asentadas por los consumidores conforme a INDECOPI.
 * Consume EXCLUSIVAMENTE /api/reclamos del backend con token JWT de admin.
 * Sin persistencia de contingencia ni registros semilla.
 * ==========================================================================*/

import { useState, useEffect, useCallback, useMemo } from "react";
import { reclamosApi } from "../../api/reclamosApi";
import { formatearFecha, formatearSoles, clases } from "../../utils/formato";
import {
  Boton,
  Card,
  Select,
  Modal,
  Toast,
  EstadoVacio,
  Alerta,
} from "../../components/ui";
import "./ReclamosAdminPage.css";

const FILTROS_ESTADO = [
  { clave: "TODOS", etiqueta: "Todos" },
  { clave: "PENDIENTE", etiqueta: "Pendientes" },
  { clave: "EN_PROCESO", etiqueta: "En proceso" },
  { clave: "RESUELTO", etiqueta: "Resueltos" },
];

const OPCIONES_ESTADO_FORM = [
  { valor: "PENDIENTE", etiqueta: "Pendiente (Por atender)" },
  { valor: "EN_PROCESO", etiqueta: "En proceso (En investigación)" },
  { valor: "RESUELTO", etiqueta: "Resuelto (Respuesta emitida)" },
];

/**
 * Comprueba si la fecha límite de respuesta ya venció respecto a la fecha actual
 * y el estado no es RESUELTO.
 */
function esReclamoVencido(fechaLimite, estado) {
  if (!fechaLimite || estado === "RESUELTO") return false;
  const limite = new Date(fechaLimite).getTime();
  const ahora = Date.now();
  return ahora > limite;
}

/**
 * Badge de Estado de Reclamo con tokens y colores definidos:
 * - PENDIENTE: --oro / --oro-50
 * - EN_PROCESO: --terracota / --terracota-50
 * - RESUELTO: --verde / --verde-50
 */
function BadgeEstadoReclamo({ estado, vencido }) {
  const est = String(estado || "").toUpperCase();

  if (vencido && est === "PENDIENTE") {
    return (
      <span className="reclamo-badge reclamo-badge--vencido" title="Plazo legal INDECOPI vencido">
        <span className="reclamo-badge__punto" aria-hidden="true" />
        Vencido
      </span>
    );
  }

  if (est === "RESUELTO") {
    return (
      <span className="reclamo-badge reclamo-badge--resuelto">
        <span className="reclamo-badge__punto" aria-hidden="true" />
        Resuelto
      </span>
    );
  }

  if (est === "EN_PROCESO") {
    return (
      <span className="reclamo-badge reclamo-badge--proceso">
        <span className="reclamo-badge__punto" aria-hidden="true" />
        En proceso
      </span>
    );
  }

  return (
    <span className="reclamo-badge reclamo-badge--pendiente">
      <span className="reclamo-badge__punto" aria-hidden="true" />
      Pendiente
    </span>
  );
}

/**
 * Badge para Motivo (RECLAMO / QUEJA)
 */
function BadgeMotivo({ motivo }) {
  const mot = String(motivo || "").toUpperCase();
  const esReclamo = mot === "RECLAMO";

  return (
    <span
      className={clases(
        "reclamo-motivo-pill",
        esReclamo ? "reclamo-motivo-pill--reclamo" : "reclamo-motivo-pill--queja"
      )}
    >
      <span aria-hidden="true">{esReclamo ? "📦" : "💬"}</span>
      {esReclamo ? "Reclamo" : "Queja"}
    </span>
  );
}

export function ReclamosAdminPage() {
  const [reclamos, setReclamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");

  // Modal Detalle y Gestión
  const [reclamoSeleccionado, setReclamoSeleccionado] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardandoGestion, setGuardandoGestion] = useState(false);
  const [errorGestion, setErrorGestion] = useState(null);

  // Formulario dentro del modal
  const [formGestion, setFormGestion] = useState({
    estado: "PENDIENTE",
    accionesTomadas: "",
  });

  // Notificaciones Toast
  const [toast, setToast] = useState(null);

  // Carga asíncrona de reclamos desde la API
  const handleRefrescar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const data = await reclamosApi.listarReclamos(filtroEstado);
      setReclamos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorCarga(
        err.message || "No se pudieron cargar los reclamos. Verifica tu conexión con el servidor."
      );
      setReclamos([]);
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    let cancelado = false;

    async function sincronizar() {
      try {
        const data = await reclamosApi.listarReclamos(filtroEstado);
        if (cancelado) return;
        setReclamos(Array.isArray(data) ? data : []);
        setErrorCarga(null);
      } catch (err) {
        if (!cancelado) {
          setErrorCarga(
            err.message || "No se pudieron cargar los reclamos. Verifica tu conexión con el servidor."
          );
          setReclamos([]);
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
  }, [filtroEstado]);

  // Manejo de cambio de filtro
  const handleCambiarFiltro = (nuevoEstado) => {
    setFiltroEstado(nuevoEstado);
  };

  // Filtrado local adicional por término de búsqueda (correlativo, nombres, DNI, correo)
  const reclamosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return reclamos;
    const termino = busqueda.toLowerCase().trim();
    return reclamos.filter((r) => {
      const correlativo = String(r.numeroCorrelativo || "").toLowerCase();
      const nombreCompleto = `${r.nombres || ""} ${r.apellidoPaterno || ""} ${r.apellidoMaterno || ""}`.toLowerCase();
      const doc = String(r.numeroDocumento || "").toLowerCase();
      const email = String(r.correo || "").toLowerCase();
      return (
        correlativo.includes(termino) ||
        nombreCompleto.includes(termino) ||
        doc.includes(termino) ||
        email.includes(termino)
      );
    });
  }, [reclamos, busqueda]);

  // Conteo de estados
  const contadores = useMemo(() => {
    return reclamos.reduce(
      (acc, r) => {
        const est = String(r.estado || "").toUpperCase();
        if (est === "PENDIENTE") acc.pendientes++;
        if (est === "EN_PROCESO") acc.enProceso++;
        if (est === "RESUELTO") acc.resueltos++;
        if (esReclamoVencido(r.fechaLimiteRespuesta, r.estado)) acc.vencidos++;
        return acc;
      },
      { pendientes: 0, enProceso: 0, resueltos: 0, vencidos: 0 }
    );
  }, [reclamos]);

  // Abrir detalle
  const handleAbrirDetalle = async (item) => {
    setErrorGestion(null);
    setCargandoDetalle(true);
    try {
      const detalleCompleto = await reclamosApi.obtenerReclamo(item.id || item.numeroCorrelativo);
      setReclamoSeleccionado(detalleCompleto);
      setFormGestion({
        estado: detalleCompleto.estado || "PENDIENTE",
        accionesTomadas: detalleCompleto.accionesTomadas || "",
      });
    } catch (err) {
      setToast({
        tipo: "peligro",
        mensaje: err.message || "No se pudo cargar el detalle del reclamo desde el servidor.",
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Cerrar detalle
  const handleCerrarDetalle = () => {
    if (guardandoGestion) return;
    setReclamoSeleccionado(null);
    setErrorGestion(null);
  };

  // Guardar gestión administrativa
  const handleGuardarGestion = async (e) => {
    e.preventDefault();
    if (!reclamoSeleccionado) return;

    setGuardandoGestion(true);
    setErrorGestion(null);

    try {
      const actualizado = await reclamosApi.actualizarEstadoReclamo(
        reclamoSeleccionado.id || reclamoSeleccionado.numeroCorrelativo,
        {
          estado: formGestion.estado,
          accionesTomadas: formGestion.accionesTomadas.trim(),
        }
      );

      // Actualizar en el estado local de la lista
      setReclamos((prev) =>
        prev.map((r) =>
          (r.id === actualizado.id || r.numeroCorrelativo === actualizado.numeroCorrelativo)
            ? { ...r, ...actualizado }
            : r
        )
      );

      setToast({
        tipo: "exito",
        mensaje: `Hoja ${actualizado.numeroCorrelativo} actualizada a estado ${actualizado.estado}.`,
      });

      setReclamoSeleccionado(actualizado);
      setTimeout(() => {
        handleCerrarDetalle();
      }, 350);
    } catch (err) {
      setErrorGestion(err.message || "No se pudo actualizar el estado del reclamo. Intenta nuevamente.");
      setToast({
        tipo: "peligro",
        mensaje: "Error al actualizar el reclamo en el servidor.",
      });
    } finally {
      setGuardandoGestion(false);
    }
  };

  return (
    <div className="reclamos-admin-page">
      {/* Toast notificaciones */}
      {toast && (
        <Toast
          variante={toast.tipo}
          mensaje={toast.mensaje}
          alCerrar={() => setToast(null)}
        />
      )}

      {/* Cabecera de la sección */}
      <header className="reclamos-admin-cabecera">
        <div className="reclamos-admin-cabecera__textos">
          <div className="reclamos-admin-cabecera__kicker-wrap">
            <span className="reclamos-admin-cabecera__kicker">INDECOPI · LEY N° 29571</span>
            {contadores.vencidos > 0 && (
              <span className="reclamo-alerta-vencidos-chip">
                ⚠️ {contadores.vencidos} {contadores.vencidos === 1 ? "reclamo vencido" : "reclamos vencidos"}
              </span>
            )}
          </div>
          <h1 className="reclamos-admin-cabecera__titulo serif">Libro de Reclamaciones</h1>
          <p className="reclamos-admin-cabecera__subtitulo">
            Auditoría, seguimiento formal y resolución de hojas de reclamación asentadas por los consumidores.
          </p>
        </div>

        <Boton
          variante="contorno"
          tamano="sm"
          onClick={handleRefrescar}
          cargando={cargando}
          disabled={cargando}
        >
          ↻ Actualizar lista
        </Boton>
      </header>

      {/* Barra de filtros por estado y buscador */}
      <Card className="reclamos-admin-filtros-card">
        <div className="reclamos-admin-filtros-wrap">
          <div className="reclamos-admin-tabs" role="tablist" aria-label="Filtro de reclamos por estado">
            {FILTROS_ESTADO.map((tab) => {
              const activo = filtroEstado === tab.clave;
              return (
                <button
                  key={tab.clave}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  className={clases("reclamo-tab-btn", activo && "reclamo-tab-btn--activo")}
                  onClick={() => handleCambiarFiltro(tab.clave)}
                >
                  <span>{tab.etiqueta}</span>
                </button>
              );
            })}
          </div>

          <div className="reclamos-admin-busqueda-wrap">
            <input
              type="search"
              className="reclamos-admin-input-busqueda"
              placeholder="Buscar por correlativo, nombre o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar reclamos"
            />
            {busqueda && (
              <button
                type="button"
                className="reclamos-admin-btn-limpiar"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="reclamos-admin-contador-fila">
          <span className="reclamos-admin-contador-texto">
            Mostrando <strong>{reclamosFiltrados.length}</strong>{" "}
            {reclamosFiltrados.length === 1 ? "reclamación" : "reclamaciones"}
            {filtroEstado !== "TODOS" && ` con estado "${filtroEstado}"`}
            {busqueda && ` para "${busqueda}"`}.
          </span>
        </div>
      </Card>

      {/* ======================================================================
       * CONTENIDO PRINCIPAL: CARGANDO / ERROR / VACÍO / TABLA
       * ==================================================================== */}
      {cargando ? (
        <Card className="reclamos-admin-cargando-card">
          <div className="reclamos-admin-spinner" aria-hidden="true" />
          <p className="reclamos-admin-cargando-texto">Cargando registros del Libro de Reclamaciones...</p>
        </Card>
      ) : errorCarga ? (
        <Card className="reclamos-admin-error-card">
          <div className="reclamos-admin-error-icono" aria-hidden="true">
            ⚠️
          </div>
          <h2 className="reclamos-admin-error-titulo serif">No se pudieron cargar los reclamos</h2>
          <p className="reclamos-admin-error-mensaje">{errorCarga}</p>
          <Boton
            variante="primario"
            tamano="sm"
            onClick={handleRefrescar}
            className="reclamos-admin-btn-reintentar"
          >
            Reintentar carga
          </Boton>
        </Card>
      ) : reclamosFiltrados.length === 0 ? (
        <Card className="reclamos-admin-vacio-card">
          <EstadoVacio
            icono="⚖️"
            titulo={
              busqueda || filtroEstado !== "TODOS"
                ? "No se encontraron reclamaciones"
                : "Aún no hay reclamos registrados"
            }
            descripcion={
              busqueda
                ? `No hay reclamos que coincidan con "${busqueda}". Intenta con otro término o limpia el buscador.`
                : filtroEstado !== "TODOS"
                ? `No existen hojas de reclamación registradas con estado "${filtroEstado}".`
                : "El Libro de Reclamaciones no registra hojas de reclamación emitidas hasta el momento."
            }
            accion={
              busqueda || filtroEstado !== "TODOS" ? (
                <Boton
                  variante="suave"
                  tamano="sm"
                  onClick={() => {
                    setBusqueda("");
                    setFiltroEstado("TODOS");
                  }}
                >
                  Ver todos los reclamos
                </Boton>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="reclamos-admin-tabla-card ui-tabla-scroll">
          <table className="ui-tabla reclamos-tabla">
            <caption className="visualmente-oculto">
              Registros del Libro de Reclamaciones de Bodega El Trigal
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ width: "160px" }}>Correlativo</th>
                <th scope="col">Consumidor</th>
                <th scope="col" style={{ width: "115px" }}>Motivo</th>
                <th scope="col" style={{ width: "125px" }}>Canal</th>
                <th scope="col" style={{ width: "130px" }}>Presentado</th>
                <th scope="col" style={{ width: "140px" }}>Plazo Límite</th>
                <th scope="col" style={{ width: "120px" }}>Estado</th>
                <th scope="col" style={{ width: "95px", textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {reclamosFiltrados.map((item) => {
                const vencido = esReclamoVencido(item.fechaLimiteRespuesta, item.estado);
                const nombreConsumidor = `${item.nombres || ""} ${item.apellidoPaterno || ""} ${
                  item.apellidoMaterno || ""
                }`.trim();
                const canalEtiqueta =
                  item.canalCompra === "TIENDA_WEB" ? "Tienda Web" : "Local Piura";

                return (
                  <tr
                    key={item.id || item.numeroCorrelativo}
                    className={clases("reclamos-fila", vencido && "reclamos-fila--vencido")}
                  >
                    {/* Correlativo */}
                    <td>
                      <button
                        type="button"
                        className="reclamo-link-correlativo serif"
                        onClick={() => handleAbrirDetalle(item)}
                        title="Ver detalle completo"
                      >
                        {item.numeroCorrelativo}
                      </button>
                    </td>

                    {/* Consumidor */}
                    <td>
                      <div className="reclamo-celda-consumidor">
                        <strong className="reclamo-consumidor-nombre">
                          {nombreConsumidor || "Sin nombre registrado"}
                        </strong>
                        <span className="reclamo-consumidor-doc">
                          {item.tipoDocumento || "Doc"}: {item.numeroDocumento || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Motivo */}
                    <td>
                      <BadgeMotivo motivo={item.motivo} />
                    </td>

                    {/* Canal */}
                    <td>
                      <span className="reclamo-canal-chip">
                        {item.canalCompra === "TIENDA_WEB" ? "🌐 " : "🏪 "}
                        {canalEtiqueta}
                      </span>
                    </td>

                    {/* Fecha de Creación */}
                    <td>
                      <span className="reclamo-fecha-texto">
                        {formatearFecha(item.fechaCreacion)}
                      </span>
                    </td>

                    {/* Fecha Límite */}
                    <td>
                      <div className="reclamo-celda-plazo">
                        <span
                          className={clases(
                            "reclamo-fecha-limite",
                            vencido && "reclamo-fecha-limite--vencida"
                          )}
                        >
                          {formatearFecha(item.fechaLimiteRespuesta)}
                        </span>
                        {vencido && (
                          <span className="reclamo-tag-vencido">¡Vencido!</span>
                        )}
                      </div>
                    </td>

                    {/* Estado */}
                    <td>
                      <BadgeEstadoReclamo estado={item.estado} vencido={vencido} />
                    </td>

                    {/* Botón de acción */}
                    <td style={{ textAlign: "right" }}>
                      <Boton
                        variante="suave"
                        tamano="sm"
                        onClick={() => handleAbrirDetalle(item)}
                        aria-label={`Auditar reclamo ${item.numeroCorrelativo}`}
                      >
                        Auditar
                      </Boton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================================
       * MODAL DETALLE Y GESTIÓN ADMINISTRATIVA
       * ==================================================================== */}
      <Modal
        abierto={Boolean(reclamoSeleccionado)}
        alCerrar={handleCerrarDetalle}
        titulo={
          reclamoSeleccionado
            ? `Hoja de Reclamación · ${reclamoSeleccionado.numeroCorrelativo}`
            : "Detalle de la Reclamación"
        }
        tamano="lg"
        className="reclamo-modal"
      >
        {cargandoDetalle ? (
          <div className="reclamos-admin-cargando-card">
            <div className="reclamos-admin-spinner" aria-hidden="true" />
            <p className="reclamos-admin-cargando-texto">Cargando expediente digital...</p>
          </div>
        ) : reclamoSeleccionado ? (
          <div className="reclamo-detalle-contenedor">
            {/* Header del expediente */}
            <div className="reclamo-expediente-header">
              <div className="reclamo-expediente-correlativo-box">
                <span className="reclamo-expediente-kicker">CÓDIGO CORRELATIVO</span>
                <strong className="reclamo-expediente-correlativo serif">
                  {reclamoSeleccionado.numeroCorrelativo}
                </strong>
              </div>

              <div className="reclamo-expediente-badges">
                <BadgeMotivo motivo={reclamoSeleccionado.motivo} />
                <BadgeEstadoReclamo
                  estado={reclamoSeleccionado.estado}
                  vencido={esReclamoVencido(
                    reclamoSeleccionado.fechaLimiteRespuesta,
                    reclamoSeleccionado.estado
                  )}
                />
              </div>
            </div>

            {/* Fechas clave */}
            <div className="reclamo-expediente-fechas-grid">
              <div className="reclamo-fecha-bloque">
                <span className="reclamo-fecha-bloque__label">Fecha de Presentación:</span>
                <strong className="reclamo-fecha-bloque__valor">
                  {formatearFecha(reclamoSeleccionado.fechaCreacion, { conHora: true })}
                </strong>
              </div>

              <div
                className={clases(
                  "reclamo-fecha-bloque",
                  esReclamoVencido(
                    reclamoSeleccionado.fechaLimiteRespuesta,
                    reclamoSeleccionado.estado
                  ) && "reclamo-fecha-bloque--alerta"
                )}
              >
                <span className="reclamo-fecha-bloque__label">
                  Fecha Límite Legal (15 días hábiles):
                </span>
                <strong className="reclamo-fecha-bloque__valor">
                  {formatearFecha(reclamoSeleccionado.fechaLimiteRespuesta)}
                </strong>
                {esReclamoVencido(
                  reclamoSeleccionado.fechaLimiteRespuesta,
                  reclamoSeleccionado.estado
                ) && (
                  <span className="reclamo-aviso-vencido-texto">
                    ⚠️ Plazo de respuesta legal superado
                  </span>
                )}
              </div>
            </div>

            {/* ==============================================================
             * BLOQUE 1: IDENTIFICACIÓN DEL CONSUMIDOR
             * ============================================================ */}
            <section className="reclamo-seccion-bloque" aria-labelledby="bloque-consumidor">
              <h2 id="bloque-consumidor" className="reclamo-seccion-titulo serif">
                <span aria-hidden="true">👤</span> 1. Identificación del Consumidor
              </h2>

              <div className="reclamo-campos-grid">
                <div className="reclamo-campo-item">
                  <span className="reclamo-campo-label">Nombre Completo:</span>
                  <strong className="reclamo-campo-valor">
                    {reclamoSeleccionado.nombres} {reclamoSeleccionado.apellidoPaterno}{" "}
                    {reclamoSeleccionado.apellidoMaterno || ""}
                  </strong>
                </div>

                <div className="reclamo-campo-item">
                  <span className="reclamo-campo-label">Documento:</span>
                  <span className="reclamo-campo-valor">
                    {reclamoSeleccionado.tipoDocumento}: {reclamoSeleccionado.numeroDocumento}
                  </span>
                </div>

                <div className="reclamo-campo-item">
                  <span className="reclamo-campo-label">Correo Electrónico:</span>
                  <a
                    href={`mailto:${reclamoSeleccionado.correo}`}
                    className="reclamo-campo-link"
                  >
                    {reclamoSeleccionado.correo}
                  </a>
                </div>

                <div className="reclamo-campo-item">
                  <span className="reclamo-campo-label">Teléfono:</span>
                  <span className="reclamo-campo-valor">
                    {reclamoSeleccionado.telefono ? (
                      <a href={`tel:${reclamoSeleccionado.telefono}`} className="reclamo-campo-link">
                        {reclamoSeleccionado.telefono}
                      </a>
                    ) : (
                      "No registrado"
                    )}
                  </span>
                </div>

                <div className="reclamo-campo-item">
                  <span className="reclamo-campo-label">Canal de respuesta preferido:</span>
                  <span className="reclamo-campo-valor">
                    {reclamoSeleccionado.tipoRespuesta === "CORREO"
                      ? "📧 Correo electrónico"
                      : "📬 Dirección física (notificación escrita)"}
                  </span>
                </div>

                <div className="reclamo-campo-item">
                  <span className="reclamo-campo-label">¿Menor de edad?:</span>
                  <span className="reclamo-campo-valor">
                    {reclamoSeleccionado.menorDeEdad ? "Sí (Representado)" : "No (Mayor de edad)"}
                  </span>
                </div>

                <div className="reclamo-campo-item reclamo-campo-item--completo">
                  <span className="reclamo-campo-label">Dirección / Ubicación:</span>
                  <span className="reclamo-campo-valor">
                    {[
                      reclamoSeleccionado.direccion,
                      reclamoSeleccionado.urbanizacion,
                      reclamoSeleccionado.distrito,
                      reclamoSeleccionado.provincia,
                      reclamoSeleccionado.departamento,
                    ]
                      .filter(Boolean)
                      .join(", ") || "No especificada"}
                  </span>
                </div>
              </div>
            </section>

            {/* ==============================================================
             * BLOQUE 2: DETALLE DE LA RECLAMACIÓN Y PEDIDO
             * ============================================================ */}
            <section className="reclamo-seccion-bloque" aria-labelledby="bloque-detalle">
              <h2 id="bloque-detalle" className="reclamo-seccion-titulo serif">
                <span aria-hidden="true">📝</span> 2. Detalle de la Reclamación y Pedido
              </h2>

              <div className="reclamo-campos-grid">
                <div className="reclamo-campo-item">
                  <span className="reclamo-campo-label">Canal de compra:</span>
                  <span className="reclamo-campo-valor">
                    {reclamoSeleccionado.canalCompra === "TIENDA_WEB"
                      ? "Tienda Web"
                      : "Local Físico Piura"}
                  </span>
                </div>

                <div className="reclamo-campo-item">
                  <span className="reclamo-campo-label">Número de Pedido / Boleta:</span>
                  <span className="reclamo-campo-valor">
                    {reclamoSeleccionado.numeroPedido ? (
                      <code>{reclamoSeleccionado.numeroPedido}</code>
                    ) : (
                      "Sin número asociado"
                    )}
                  </span>
                </div>

                <div className="reclamo-campo-item">
                  <span className="reclamo-campo-label">Bien contratado:</span>
                  <span className="reclamo-campo-valor">
                    {reclamoSeleccionado.relacionadoA === "PRODUCTO"
                      ? "📦 Producto (abarrotes/alimentos)"
                      : "🛎️ Servicio (atención/delivery)"}
                  </span>
                </div>

                <div className="reclamo-campo-item">
                  <span className="reclamo-campo-label">Monto reclamado:</span>
                  <strong className="reclamo-campo-valor reclamo-campo-valor--monto">
                    {reclamoSeleccionado.montoReclamado != null
                      ? formatearSoles(reclamoSeleccionado.montoReclamado)
                      : "No especificado"}
                  </strong>
                </div>

                <div className="reclamo-campo-item reclamo-campo-item--completo">
                  <span className="reclamo-campo-label">Descripción del bien / servicio:</span>
                  <span className="reclamo-campo-valor">
                    {reclamoSeleccionado.descripcionBien || "No especificado"}
                  </span>
                </div>
              </div>

              {/* Hechos reclamados */}
              <div className="reclamo-caja-texto-amplio">
                <span className="reclamo-caja-label">Detalle de los hechos expuestos:</span>
                <p className="reclamo-caja-parrafo">{reclamoSeleccionado.detalle}</p>
              </div>

              {/* Pedido del consumidor */}
              <div className="reclamo-caja-texto-amplio reclamo-caja-texto-amplio--requerimiento">
                <span className="reclamo-caja-label">
                  Requerimiento o solución solicitada por el consumidor:
                </span>
                <p className="reclamo-caja-parrafo">{reclamoSeleccionado.requerimiento}</p>
              </div>
            </section>

            {/* ==============================================================
             * FORMULARIO DE GESTIÓN ADMINISTRATIVA
             * ============================================================ */}
            <section className="reclamo-gestion-seccion" aria-labelledby="bloque-gestion">
              <header className="reclamo-gestion-cabecera">
                <span className="reclamo-gestion-icono" aria-hidden="true">
                  ⚙️
                </span>
                <div>
                  <h3 id="bloque-gestion" className="reclamo-gestion-titulo serif">
                    Gestión y Resolución Administrativa
                  </h3>
                  <p className="reclamo-gestion-subtitulo">
                    Actualiza el estado formal del expediente y registra las acciones o respuesta de la empresa.
                  </p>
                </div>
              </header>

              {errorGestion && (
                <div className="reclamos-admin-alerta">
                  <Alerta variante="peligro" alCerrar={() => setErrorGestion(null)}>
                    {errorGestion}
                  </Alerta>
                </div>
              )}

              <form onSubmit={handleGuardarGestion} className="reclamo-gestion-form">
                <Select
                  etiqueta="Estado del reclamo"
                  name="estado"
                  value={formGestion.estado}
                  onChange={(e) =>
                    setFormGestion((prev) => ({ ...prev, estado: e.target.value }))
                  }
                  requerido
                >
                  {OPCIONES_ESTADO_FORM.map((opt) => (
                    <option key={opt.valor} value={opt.valor}>
                      {opt.etiqueta}
                    </option>
                  ))}
                </Select>

                <div className="ui-campo">
                  <label htmlFor="accionesTomadas" className="ui-campo__etiqueta">
                    Acciones tomadas por la empresa
                  </label>
                  <div className="ui-campo__caja reclamo-caja-textarea">
                    <textarea
                      id="accionesTomadas"
                      name="accionesTomadas"
                      rows={4}
                      className="ui-campo__input reclamo-textarea"
                      placeholder="Describe la solución brindada, coordinaciones con el consumidor, nota de crédito, respuesta emitida por correo, etc..."
                      value={formGestion.accionesTomadas}
                      onChange={(e) =>
                        setFormGestion((prev) => ({
                          ...prev,
                          accionesTomadas: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <span className="reclamo-ayuda-texto">
                    Este texto queda asentado en el historial de auditoría de INDECOPI para la hoja de reclamación.
                  </span>
                </div>

                <div className="reclamo-gestion-acciones">
                  <Boton
                    type="button"
                    variante="contorno"
                    onClick={handleCerrarDetalle}
                    disabled={guardandoGestion}
                  >
                    Cerrar
                  </Boton>
                  <Boton
                    type="submit"
                    variante="primario"
                    cargando={guardandoGestion}
                    disabled={guardandoGestion}
                  >
                    Guardar cambios
                  </Boton>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default ReclamosAdminPage;
