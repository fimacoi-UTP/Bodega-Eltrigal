import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { promocionesApi } from "../../../api/promocionesApi";
import { RUTAS } from "../../../routes/rutas";
import { formatearSoles, formatearFecha } from "../../../utils/formato";
import { Boton, Cargando, Alerta, EstadoVacio } from "../../../components/ui";
import "./MisPromocionesPage.css";

/**
 * Isotipo oficial de la espiga de trigo de El Trigal.
 */
function IsotipoEspiga({ className = "cupon-stub__logo" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 21V8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12 10c-2.6 0-4.1-1.5-4.1-3.8C10.5 6.2 12 7.7 12 10Z" fill="currentColor" />
      <path d="M12 10c2.6 0 4.1-1.5 4.1-3.8C13.5 6.2 12 7.7 12 10Z" fill="currentColor" />
      <path d="M12 15c-2.6 0-4.1-1.5-4.1-3.8C10.5 11.2 12 12.7 12 15Z" fill="currentColor" opacity="0.85" />
      <path d="M12 15c2.6 0 4.1-1.5 4.1-3.8C13.5 11.2 12 12.7 12 15Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

/**
 * Resuelve el valor destacado y subtexto del talón (stub) según el tipo de promoción.
 */
function resolverDetalleValor(promo) {
  const tipo = String(promo.tipo || "").toUpperCase();

  switch (tipo) {
    case "PORCENTAJE":
      return {
        kicker: "AHORRA",
        valor: `${promo.valor}%`,
        subtexto: "de descuento",
      };
    case "MONTO_FIJO":
      return {
        kicker: "AHORRA",
        valor: formatearSoles(promo.valor),
        subtexto: "de descuento",
      };
    case "DOS_X_UNO":
      return {
        kicker: "PROMO",
        valor: "2x1",
        subtexto: "llévate 2, paga 1",
      };
    case "COMBO":
      return {
        kicker: "PROMO",
        valor: "Combo",
        subtexto: "precio especial",
      };
    default:
      return {
        kicker: "OFERTA",
        valor: promo.valor != null ? `${promo.valor}` : "Promo",
        subtexto: "en tu bodega",
      };
  }
}

/**
 * Formatea fechas YYYY-MM-DD sin desajustes por zona horaria.
 */
function formatearFechaLegible(fechaStr) {
  if (!fechaStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    const [y, m, d] = fechaStr.split("-");
    return `${d}/${m}/${y}`;
  }
  return formatearFecha(fechaStr);
}

/**
 * Determina si la fecha de inicio es estrictamente futura.
 */
function esFechaFutura(fechaStr) {
  if (!fechaStr) return false;
  const hoyStr = new Date().toISOString().slice(0, 10);
  const compStr = fechaStr.slice(0, 10);
  return compStr > hoyStr;
}

/**
 * Formatea el rango de vigencia de la promoción.
 */
function formatearVigencia(desde, hasta) {
  if (!hasta) return "Promoción por tiempo limitado";
  const hastaStr = formatearFechaLegible(hasta);

  if (desde && esFechaFutura(desde)) {
    const desdeStr = formatearFechaLegible(desde);
    return `Del ${desdeStr} al ${hastaStr}`;
  }

  return `Válido hasta el ${hastaStr}`;
}

/**
 * Describe a qué productos o categorías aplica la promoción.
 */
function formatearAlcance(promo) {
  if (promo.aplicaTodos) {
    return "Válido en toda la tienda";
  }

  const items = [];
  if (Array.isArray(promo.productos)) {
    promo.productos.forEach((p) => {
      const nombre = typeof p === "string" ? p : p?.nombre;
      if (nombre) items.push(nombre);
    });
  }
  if (Array.isArray(promo.categorias)) {
    promo.categorias.forEach((c) => {
      const nombre = typeof c === "string" ? c : c?.nombre;
      if (nombre) items.push(`Categoría ${nombre}`);
    });
  }

  if (items.length === 0) {
    return "Válido en productos seleccionados";
  }

  if (items.length <= 3) {
    return `Aplica en: ${items.join(", ")}`;
  }

  const primeros = items.slice(0, 3).join(", ");
  const restantes = items.length - 3;
  return `Aplica en: ${primeros} y ${restantes} más`;
}

/**
 * ============================================================================
 * MisPromocionesPage · Cupones físicos premium para el cliente
 * ----------------------------------------------------------------------------
 * Consume promocionesApi.obtenerVigentes() y renderiza tarjetas de cupón
 * con perforación, muescas recortadas (notches) y cálculo automático.
 * ==========================================================================*/
export function MisPromocionesPage() {
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    promocionesApi
      .obtenerVigentes()
      .then((data) => {
        if (!cancelado) {
          setPromociones(Array.isArray(data) ? data : []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err?.message || "Error al cargar las promociones vigentes");
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

  if (cargando) {
    return <Cargando texto="Cargando promociones vigentes..." />;
  }

  if (error) {
    return (
      <Alerta variante="peligro" titulo="Error al cargar promociones">
        {error}
      </Alerta>
    );
  }

  return (
    <div className="mis-promociones-seccion">
      {/* Cabecera */}
      <header className="mis-promociones-cabecera">
        <h2 className="mis-promociones-titulo">Mis promociones</h2>
        <p className="mis-promociones-subtitulo">
          Ofertas vigentes en tu bodega — se aplican solas al comprar.
        </p>
      </header>

      {/* Listado o estado vacío */}
      {promociones.length === 0 ? (
        <EstadoVacio
          icono="🏷️"
          titulo="No hay promociones vigentes"
          descripcion="No hay promociones vigentes ahora mismo — vuelve pronto, siempre hay algo fresco en El Trigal."
          accion={
            <Boton como={Link} to={RUTAS.INICIO} variante="primario">
              Ir al catálogo
            </Boton>
          }
        />
      ) : (
        <div className="mis-promociones-well">
          <div className="mis-promociones-grid">
          {promociones.map((promo) => {
            const { kicker, valor, subtexto } = resolverDetalleValor(promo);
            const alcanceTexto = formatearAlcance(promo);
            const vigenciaTexto = formatearVigencia(promo.desde, promo.hasta);

            return (
              <article key={promo.id} className="cupon-card">
                {/* Stub: Talón destacado con degradado terracota -> ámbar */}
                <div className="cupon-stub">
                  {/* Marca de agua de textura detrás del valor */}
                  <IsotipoEspiga className="cupon-stub__marca-agua" />

                  {/* Espina dedicada en el filo exterior */}
                  <div className="cupon-stub__espina" aria-hidden="true">
                    <span className="cupon-stub__espina-texto">CUPÓN · EL TRIGAL</span>
                  </div>

                  {/* Contenido centrado: logo + kicker + valor + subtexto */}
                  <div className="cupon-stub__contenido">
                    <IsotipoEspiga className="cupon-stub__logo" />
                    <span className="cupon-stub__kicker">{kicker}</span>
                    <span className="cupon-stub__valor">{valor}</span>
                    <span className="cupon-stub__subtexto">{subtexto}</span>
                  </div>
                </div>

                {/* Perforación centrada en la muesca troquelada */}
                <div className="cupon-perforacion" aria-hidden="true" />

                {/* Cuerpo del cupón con marco interior sutil */}
                <div className="cupon-cuerpo">
                  <div className="cupon-cuerpo-marco">
                    <div>
                      <div className="cupon-cuerpo__cabecera">
                        <h3 className="cupon-nombre">{promo.nombre}</h3>
                        {promo.esAcumulable && (
                          <span className="cupon-badge-acumulable">
                            <span aria-hidden="true">✨</span> Acumulable
                          </span>
                        )}
                      </div>

                      {promo.descripcion && (
                        <p className="cupon-descripcion">{promo.descripcion}</p>
                      )}

                      <div className="cupon-detalles">
                        <div className="cupon-detalle-fila">
                          <span className="cupon-detalle-icono" aria-hidden="true">
                            🎯
                          </span>
                          <span className="cupon-detalle-texto">{alcanceTexto}</span>
                        </div>

                        <div className="cupon-detalle-fila">
                          <span className="cupon-detalle-icono" aria-hidden="true">
                            📅
                          </span>
                          <span className="cupon-detalle-texto">{vigenciaTexto}</span>
                        </div>
                      </div>
                    </div>

                    <div className="cupon-pie">
                      <span className="cupon-aplicacion-hint">
                        <span aria-hidden="true">⚡</span> Se aplica sola al comprar
                      </span>

                      <Boton
                        como={Link}
                        to={RUTAS.INICIO}
                        variante="secundario"
                        tamano="sm"
                        className="cupon-cta"
                      >
                        Ver productos
                      </Boton>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    )}
    </div>
  );
}

export default MisPromocionesPage;
