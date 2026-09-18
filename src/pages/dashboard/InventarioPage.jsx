/**
 * ============================================================================
 * InventarioPage · Control de existencias
 * ----------------------------------------------------------------------------
 * Ruta: /dashboard/inventario · Acceso: ADMIN y CAJERO
 *
 * Esta página responde a una sola pregunta: ¿cuánto hay de cada producto y qué
 * se está por acabar? Desde aquí se registran los movimientos de mercadería
 * (lo que entra del distribuidor y lo que se pierde por merma).
 *
 * DIFERENCIA CON /dashboard/productos:
 *   · INVENTARIO (aquí) → CUÁNTO hay.  Usa ajustarStock(id, delta).
 *   · PRODUCTOS         → QUÉ se vende. Usa crear/actualizar/eliminarProducto.
 *
 * Todo sale de useInventario(). Esta página no sabe que existe localStorage ni
 * los repositorios: esa es la gracia del patrón Facade.
 *
 * 🥇 Y como el stock que se ve aquí es el MISMO que consume la tienda web, un
 * ingreso registrado en esta pantalla aparece al instante en el catálogo.
 * ==========================================================================*/

import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useInventario } from "../../hooks/useInventario";
import {
  Alerta,
  Badge,
  Boton,
  Card,
  Cargando,
  EstadoVacio,
  Input,
  Select,
} from "../../components/ui";
import { formatearSoles } from "../../utils/formato";
import { RUTAS } from "../../routes/rutas";
import ModalAjusteStock from "./gestion/ModalAjusteStock";
import {
  ESTADO_STOCK,
  estadoStock,
  filtrarProductos,
  pluralizar,
  resumirInventario,
  umbralDe,
} from "./gestion/utilesInventario";
import "./gestion/gestion.css";

export function InventarioPage() {
  // ── Datos: todo viene de la fachada, nunca del repositorio directo ────────
  const { productos, categorias, cargando, error, ajustarStock, refrescar } =
    useInventario();

  // ── Filtros de la vista ───────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [soloBajoStock, setSoloBajoStock] = useState(false);

  // ── Producto al que se le está ajustando el stock (null = modal cerrado) ──
  const [productoAjuste, setProductoAjuste] = useState(null);

  // ── Aviso de resultado tras un ajuste ─────────────────────────────────────
  const [aviso, setAviso] = useState(null); // { variante, texto }

  /* Resumen de cabecera. Se recalcula solo cuando cambian los productos, no en
     cada tecleo del buscador. */
  const resumen = useMemo(() => resumirInventario(productos), [productos]);

  /* Lista ya filtrada. Ojo: filtramos sobre `productos` (la lista completa) y
     no con buscar()/filtrarPorCategoria() del hook, porque esos dos esconden
     los productos desactivados y aquí hay que poder verlos. */
  const visibles = useMemo(
    () => filtrarProductos(productos, { texto: busqueda, categoria, soloBajoStock }),
    [productos, busqueda, categoria, soloBajoStock],
  );

  const porReponer = resumen.bajos + resumen.agotados;
  const hayFiltros = Boolean(busqueda || categoria || soloBajoStock);

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoria("");
    setSoloBajoStock(false);
  };

  /* ⚠️ `cerrarAjuste` va con useCallback a propósito.
     <Modal> tiene `alCerrar` en las dependencias de su efecto, y ese efecto
     hace focus() sobre la ventana. Si le pasáramos una función nueva en cada
     render, el foco saltaría del input al contenedor en CADA tecla y el
     formulario sería imposible de llenar. */
  const cerrarAjuste = useCallback(() => setProductoAjuste(null), []);

  /**
   * Aplica el movimiento de stock.
   * Se lo pasamos al modal, que lo llama al confirmar. Si `ajustarStock` lanza
   * (por ejemplo, porque el stock quedaría negativo), el error sube al modal y
   * se muestra ahí, sin cerrar el formulario ni perder lo escrito.
   */
  const confirmarAjuste = useCallback(
    async (delta, motivo) => {
      const producto = productoAjuste;

      await ajustarStock(producto.id, delta);

      const entra = delta > 0;
      const unidades = Math.abs(delta);

      setProductoAjuste(null);
      setAviso({
        variante: "exito",
        texto:
          `${entra ? "Ingresaron" : "Salieron"} ${unidades} ` +
          `${pluralizar(unidades, producto.unidad ?? "unidad")} de "${producto.nombre}"` +
          `${motivo ? ` · ${motivo}` : ""}.`,
      });
    },
    [productoAjuste, ajustarStock],
  );

  /* ── Estado: cargando ───────────────────────────────────────────────────── */
  if (cargando) {
    return <Cargando pantallaCompleta texto="Cargando inventario…" />;
  }

  return (
    <div className="gestion">
      {/* ─────────────────────────────────────────────── Cabecera ────── */}
      <header className="gestion__cabecera">
        <div className="gestion__cabecera-textos">
          <h2 className="gestion__titulo">Control de existencias</h2>
          <p className="gestion__descripcion">
            Revisa cuánto hay de cada producto y registra las entradas y salidas
            de mercadería.
          </p>
        </div>

        <div className="gestion__cabecera-accion">
          <Boton variante="contorno" onClick={refrescar}>
            Actualizar
          </Boton>
        </div>
      </header>

      {/* ───────────────────────────────────────────────── Avisos ────── */}
      {error && (
        <Alerta variante="peligro" titulo="No se pudo cargar el inventario">
          {error}
        </Alerta>
      )}

      {aviso && (
        <Alerta variante={aviso.variante} alCerrar={() => setAviso(null)}>
          {aviso.texto}
        </Alerta>
      )}

      {/* Sin productos en todo el sistema: no tiene sentido mostrar filtros. */}
      {productos.length === 0 ? (
        <Card>
          <EstadoVacio
            icono="📦"
            titulo="Todavía no hay productos"
            descripcion="El inventario se llena solo cuando existen productos registrados. Crea el primero desde la gestión de productos."
            accion={
              <Boton como={Link} to={RUTAS.DASHBOARD_PRODUCTOS}>
                Ir a productos
              </Boton>
            }
          />
        </Card>
      ) : (
        <>
          {/* ──────────────────────────────────────────── Resumen ────── */}
          <section className="gestion__resumen" aria-label="Resumen del inventario">
            <Card padding="sm">
              <div className="gestion__dato">
                <span className="gestion__dato-etiqueta">Productos</span>
                <span className="gestion__dato-valor">{resumen.total}</span>
                <span className="gestion__dato-nota">
                  {resumen.unidades} {pluralizar(resumen.unidades, "unidad")} en total
                </span>
              </div>
            </Card>

            <Card padding="sm">
              <div className="gestion__dato">
                <span className="gestion__dato-etiqueta">Por reponer</span>
                <span
                  className={
                    "gestion__dato-valor" +
                    (resumen.bajos > 0 ? " gestion__dato-valor--alerta" : "")
                  }
                >
                  {resumen.bajos}
                </span>
                <span className="gestion__dato-nota">Llegaron a su mínimo</span>
              </div>
            </Card>

            <Card padding="sm">
              <div className="gestion__dato">
                <span className="gestion__dato-etiqueta">Agotados</span>
                <span
                  className={
                    "gestion__dato-valor" +
                    (resumen.agotados > 0 ? " gestion__dato-valor--peligro" : "")
                  }
                >
                  {resumen.agotados}
                </span>
                <span className="gestion__dato-nota">Sin unidades</span>
              </div>
            </Card>

            <Card padding="sm">
              <div className="gestion__dato">
                <span className="gestion__dato-etiqueta">Valor</span>
                <span className="gestion__dato-valor">{formatearSoles(resumen.valor)}</span>
                <span className="gestion__dato-nota">Precio × stock</span>
              </div>
            </Card>
          </section>

          {/* ──────────────────────────────────────────── Filtros ────── */}
          <Card>
            <div className="gestion__filtros">
              <Input
                className="gestion__filtro-busqueda"
                etiqueta="Buscar"
                type="search"
                placeholder="Nombre, marca o categoría…"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
              />

              <Select
                className="gestion__filtro-select"
                etiqueta="Categoría"
                value={categoria}
                onChange={(evento) => setCategoria(evento.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </Select>

              <div className="gestion__filtro-alternar">
                <Boton
                  variante={soloBajoStock ? "primario" : "contorno"}
                  aria-pressed={soloBajoStock}
                  onClick={() => setSoloBajoStock((activo) => !activo)}
                >
                  Solo por reponer{porReponer > 0 ? ` (${porReponer})` : ""}
                </Boton>
              </div>
            </div>
          </Card>

          {/* ───────────────────────────────────────────── Tabla ─────── */}
          {visibles.length === 0 ? (
            <Card>
              <EstadoVacio
                icono="🔍"
                titulo="Ningún producto coincide"
                descripcion="Prueba con otra búsqueda o quita los filtros para ver todo el inventario."
                accion={
                  <Boton variante="contorno" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Boton>
                }
              />
            </Card>
          ) : (
            <Card padding="none">
              <p className="gestion__resultados gestion__resultados--barra">
                Mostrando <strong>{visibles.length}</strong> de{" "}
                <strong>{productos.length}</strong> productos
              </p>

              {/* .ui-tabla-scroll evita que la tabla rompa el layout en celular */}
              <div className="ui-tabla-scroll">
                <table className="ui-tabla">
                  <caption className="visualmente-oculto">
                    Inventario de productos con su stock actual
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col" className="gestion__col-md">
                        Categoría
                      </th>
                      <th scope="col" className="gestion__col-sm col-numero">
                        Precio
                      </th>
                      <th scope="col" className="col-numero">
                        Stock
                      </th>
                      <th scope="col" className="gestion__col-lg col-numero">
                        Mínimo
                      </th>
                      <th scope="col">Estado</th>
                      <th scope="col">
                        <span className="visualmente-oculto">Acciones</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibles.map((producto) => {
                      const estado = estadoStock(producto);
                      const stock = Number(producto.stock) || 0;

                      return (
                        <tr
                          key={producto.id}
                          className={
                            (estado.clave === ESTADO_STOCK.AGOTADO
                              ? "gestion__fila--agotado "
                              : estado.clave === ESTADO_STOCK.BAJO
                                ? "gestion__fila--alerta "
                                : "") +
                            (producto.activo === false ? "gestion__fila--inactivo" : "")
                          }
                        >
                          <td className="gestion__celda-nombre">
                            <div className="gestion__producto">
                              <span
                                className="gestion__swatch"
                                style={{
                                  backgroundColor: producto.color || "var(--neutro-300)",
                                }}
                                aria-hidden="true"
                              />
                              <div className="gestion__producto-datos">
                                <span className="gestion__producto-nombre">
                                  {producto.nombre}
                                </span>
                                {/* En móvil se repiten aquí los datos de las
                                    columnas que quedan ocultas. */}
                                <span className="gestion__producto-meta">
                                  {producto.categoria} · {formatearSoles(producto.precio)}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="gestion__col-md">{producto.categoria}</td>

                          <td className="gestion__col-sm col-numero">
                            {formatearSoles(producto.precio)}
                          </td>

                          <td className="col-numero">
                            <span className="gestion__stock">{stock}</span>
                            <span className="gestion__stock-unidad">
                              {pluralizar(stock, producto.unidad ?? "unidad")}
                            </span>
                          </td>

                          <td className="gestion__col-lg col-numero">
                            {umbralDe(producto)}
                          </td>

                          <td>
                            <Badge variante={estado.variante} tamano="sm" punto>
                              {estado.etiqueta}
                            </Badge>
                          </td>

                          <td>
                            <div className="gestion__acciones">
                              <Boton
                                tamano="sm"
                                variante={
                                  estado.clave === ESTADO_STOCK.DISPONIBLE
                                    ? "contorno"
                                    : "primario"
                                }
                                onClick={() => setProductoAjuste(producto)}
                              >
                                Ajustar
                              </Boton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {hayFiltros && visibles.length > 0 && (
            <div>
              <Boton variante="fantasma" tamano="sm" onClick={limpiarFiltros}>
                Limpiar filtros
              </Boton>
            </div>
          )}
        </>
      )}

      {/* ─────────────────────────────────────── Modal de ajuste ─────── */}
      {/* `key` fuerza a React a recrear el modal al cambiar de producto, así el
          formulario nace limpio sin necesidad de un useEffect que lo resetee. */}
      {productoAjuste && (
        <ModalAjusteStock
          key={productoAjuste.id}
          producto={productoAjuste}
          alCerrar={cerrarAjuste}
          alConfirmar={confirmarAjuste}
        />
      )}
    </div>
  );
}

export default InventarioPage;
