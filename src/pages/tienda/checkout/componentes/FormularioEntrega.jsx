import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardCabecera, CardCuerpo, Input, Badge, Cargando, Alerta } from "../../../../components/ui";
import { TIPOS_ENTREGA, BODEGA } from "../../../../constantes";
import { direccionesApi } from "../../../../api/direccionesApi";
import { RUTAS } from "../../../../routes/rutas";

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

export function FormularioEntrega({
  tipoEntrega,
  onCambiarTipo,
  datos,
  onChange,
  errores,
  estaAutenticado = false,
}) {
  const esDelivery = tipoEntrega === TIPOS_ENTREGA.DELIVERY;

  const [direcciones, setDirecciones] = useState([]);
  const [cargandoDirecciones, setCargandoDirecciones] = useState(() => Boolean(estaAutenticado && esDelivery));
  const [errorDirecciones, setErrorDirecciones] = useState(null);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState(null);
  const [modoManual, setModoManual] = useState(false);

  const yaPreseleccionoRef = useRef(false);

  // Cargar direcciones cuando sea cliente autenticado y esté en modo delivery
  useEffect(() => {
    if (!estaAutenticado || !esDelivery) return;

    let cancelado = false;

    direccionesApi
      .listar()
      .then((lista) => {
        if (cancelado) return;
        const dirs = Array.isArray(lista) ? lista : [];
        setDirecciones(dirs);

        if (dirs.length > 0 && !yaPreseleccionoRef.current) {
          const predet = dirs.find((d) => d.predeterminada) || dirs[0];
          setDireccionSeleccionadaId(predet.id);
          setModoManual(false);
          yaPreseleccionoRef.current = true;
          onChange(
            "direccion",
            `${predet.direccion}, ${predet.distrito || "Piura"} - ${predet.ciudad || "Piura"}`
          );
          onChange("referencia", predet.referencia || "");
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setErrorDirecciones(err?.message || "No se pudieron cargar tus direcciones guardadas");
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoDirecciones(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [estaAutenticado, esDelivery, onChange]);

  const handleSeleccionarDireccion = (dir) => {
    setModoManual(false);
    setDireccionSeleccionadaId(dir.id);
    onChange(
      "direccion",
      `${dir.direccion}, ${dir.distrito || "Piura"} - ${dir.ciudad || "Piura"}`
    );
    onChange("referencia", dir.referencia || "");
  };

  const handleActivarModoManual = () => {
    setModoManual(true);
    setDireccionSeleccionadaId(null);
    onChange("direccion", "");
    onChange("referencia", "");
  };

  return (
    <Card className="checkout-seccion-card">
      <CardCabecera
        titulo="2. Método de entrega"
        subtitulo="Elige cómo deseas recibir tu compra."
      />
      <CardCuerpo>
        <div className="checkout-entrega-selector" role="radiogroup" aria-label="Tipo de entrega">
          <button
            type="button"
            role="radio"
            aria-checked={!esDelivery}
            className={`checkout-entrega-opcion ${!esDelivery ? "checkout-entrega-opcion--activa" : ""}`}
            onClick={() => onCambiarTipo(TIPOS_ENTREGA.RECOJO_TIENDA)}
          >
            <div className="checkout-entrega-opcion__cabecera">
              <span className="checkout-entrega-opcion__icono">🏪</span>
              <span className="checkout-entrega-opcion__titulo">Recojo en tienda</span>
              <Badge variante="exito" tamano="sm">Gratis</Badge>
            </div>
            <p className="checkout-entrega-opcion__desc">
              Retira directamente en el mostrador de nuestra bodega.
            </p>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={esDelivery}
            className={`checkout-entrega-opcion ${esDelivery ? "checkout-entrega-opcion--activa" : ""}`}
            onClick={() => onCambiarTipo(TIPOS_ENTREGA.DELIVERY)}
          >
            <div className="checkout-entrega-opcion__cabecera">
              <span className="checkout-entrega-opcion__icono">🛵</span>
              <span className="checkout-entrega-opcion__titulo">Delivery a domicilio</span>
              <Badge variante="marca" tamano="sm">+ S/ 5.00</Badge>
            </div>
            <p className="checkout-entrega-opcion__desc">
              Envío directo en moto a cualquier zona de Piura y Castilla.
            </p>
          </button>
        </div>

        {!esDelivery ? (
          <div className="checkout-recojo-info">
            <div className="checkout-recojo-linea">
              <span className="checkout-recojo-icono" aria-hidden="true">📍</span>
              <div>
                <strong>Dirección de recojo:</strong>
                <p>{BODEGA.direccion}, {BODEGA.ciudad}</p>
              </div>
            </div>
            <div className="checkout-recojo-linea">
              <span className="checkout-recojo-icono" aria-hidden="true">🕒</span>
              <div>
                <strong>Horario de atención:</strong>
                <p>{BODEGA.horario}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="checkout-delivery-contenedor">
            {/* Si está autenticado y tiene direcciones o está cargando */}
            {estaAutenticado && (
              <>
                {cargandoDirecciones && (
                  <div style={{ padding: "var(--esp-3) 0" }}>
                    <Cargando texto="Cargando tus direcciones guardadas..." />
                  </div>
                )}

                {errorDirecciones && (
                  <Alerta variante="advertencia" style={{ marginBottom: "var(--esp-3)" }}>
                    {errorDirecciones}
                  </Alerta>
                )}

                {!cargandoDirecciones && direcciones.length > 0 && (
                  <div className="checkout-direcciones-bloque">
                    <div className="checkout-direcciones-cabecera">
                      <span className="checkout-direcciones-subtitulo">
                        Tus direcciones guardadas:
                      </span>
                      <Link
                        to={RUTAS.MI_CUENTA_DIRECCIONES}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="checkout-direcciones-admin-link"
                      >
                        ⚙️ Administrar direcciones
                      </Link>
                    </div>

                    <div
                      className="checkout-direcciones-grid"
                      role="radiogroup"
                      aria-label="Direcciones guardadas"
                    >
                      {direcciones.map((dir) => {
                        const seleccionada =
                          !modoManual && direccionSeleccionadaId === dir.id;

                        return (
                          <button
                            key={dir.id}
                            type="button"
                            role="radio"
                            aria-checked={seleccionada}
                            className={`checkout-direccion-card ${
                              seleccionada ? "checkout-direccion-card--activa" : ""
                            }`}
                            onClick={() => handleSeleccionarDireccion(dir)}
                          >
                            <div className="checkout-direccion-card__cabecera">
                              <span className="checkout-direccion-chip">
                                <span
                                  className="checkout-direccion-chip__icono"
                                  aria-hidden="true"
                                >
                                  {iconoPorEtiqueta(dir.etiqueta)}
                                </span>
                                {dir.etiqueta || "Dirección"}
                              </span>

                              {dir.predeterminada && (
                                <span className="checkout-direccion-badge-predeterminada">
                                  ⭐ Predeterminada
                                </span>
                              )}
                            </div>

                            <p className="checkout-direccion-card__texto">{dir.direccion}</p>
                            <span className="checkout-direccion-card__ubicacion">
                              {dir.distrito ? `${dir.distrito} · ` : ""}
                              {dir.ciudad || "Piura"}
                            </span>

                            {dir.referencia && (
                              <p className="checkout-direccion-card__ref">
                                <span>Ref:</span> {dir.referencia}
                              </p>
                            )}
                          </button>
                        );
                      })}

                      {/* Opción para escribir otra dirección */}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={modoManual}
                        className={`checkout-direccion-card checkout-direccion-card--otra ${
                          modoManual ? "checkout-direccion-card--activa" : ""
                        }`}
                        onClick={handleActivarModoManual}
                      >
                        <div className="checkout-direccion-card__otra-icono" aria-hidden="true">
                          ✏️
                        </div>
                        <strong className="checkout-direccion-card__otra-titulo">
                          Escribir otra dirección
                        </strong>
                        <span className="checkout-direccion-card__otra-desc">
                          Ingresar manualmente para este pedido
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Si no tiene direcciones guardadas */}
                {!cargandoDirecciones && direcciones.length === 0 && !errorDirecciones && (
                  <div className="checkout-direcciones-hint">
                    <span className="checkout-direcciones-hint__icono" aria-hidden="true">
                      💡
                    </span>
                    <p className="checkout-direcciones-hint__texto">
                      Aún no tienes direcciones guardadas. Ingresa tu dirección abajo o{" "}
                      <Link
                        to={RUTAS.MI_CUENTA_DIRECCIONES}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="checkout-direcciones-link"
                      >
                        guarda una en Mi Cuenta &gt; Direcciones
                      </Link>{" "}
                      para agilizar tus futuras compras.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Inputs manuales:
                Se muestran si:
                1) Es usuario invitado (!estaAutenticado)
                2) O está autenticado pero activó modoManual
                3) O está autenticado pero no tiene direcciones guardadas
            */}
            {(!estaAutenticado || modoManual || (!cargandoDirecciones && direcciones.length === 0)) && (
              <div className="checkout-delivery-campos">
                <Input
                  etiqueta="Dirección de entrega"
                  id="entrega-direccion"
                  type="text"
                  placeholder="Ej: Av. Grau 520, Urb. Santa Isabel, Piura"
                  requerido
                  value={datos.direccion ?? ""}
                  onChange={(e) => onChange("direccion", e.target.value)}
                  error={errores.direccion}
                  ayuda="Calle, número, departamento o manzana/lote"
                />

                <Input
                  etiqueta="Referencia de ubicación"
                  id="entrega-referencia"
                  type="text"
                  placeholder="Ej: Frente al parque, rejas negras, casa de 2 pisos"
                  value={datos.referencia ?? ""}
                  onChange={(e) => onChange("referencia", e.target.value)}
                  error={errores.referencia}
                  ayuda="Ayuda al repartidor a ubicarte más rápido"
                />
              </div>
            )}
          </div>
        )}
      </CardCuerpo>
    </Card>
  );
}

export default FormularioEntrega;
