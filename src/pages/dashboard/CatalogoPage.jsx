/**
 * ============================================================================
 * CATÁLOGO MAESTRO · Gestión unificada de catálogo y existencias
 * ----------------------------------------------------------------------------
 * Ruta: /dashboard/catalogo · Acceso: ADMIN y CAJERO
 *
 * Fusión de InventarioPage y ProductosPage en una vista única y centralizada.
 * Permite gestionar en un solo lugar:
 *   · Datos y ficha del producto (nombre, categoría, marca, precio)
 *   · Control de existencias (stock actual, mínimo, alertas de bajo stock)
 *   · Visibilidad en la tienda web (activo / oculto)
 *   · Acciones contextuales con MenuKebab (⋮)
 *   · Edición ágil mediante panel lateral (Drawer)
 *
 * Consume useInventario() (patrón Facade) y mantiene la coherencia total
 * con el catálogo web y la caja de ventas.
 * ==========================================================================*/

import { useCallback, useMemo, useState } from "react";
import { useInventario } from "../../hooks/useInventario";
import {
  Alerta,
  Badge,
  Boton,
  Card,
  Cargando,
  EstadoVacio,
  Input,
  MenuKebab,
  Modal,
  Select,
} from "../../components/ui";
import { formatearSoles } from "../../utils/formato";
import DrawerProducto from "./gestion/DrawerProducto";
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

export function CatalogoPage() {
  const {
    productos,
    categorias,
    cargando,
    error,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    ajustarStock,
    refrescar,
  } = useInventario();

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estadoActivo, setEstadoActivo] = useState("");
  const [soloBajoStock, setSoloBajoStock] = useState(false);

  // ── Drawer de creación / edición ─────────────────────────────────────────
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  // ── Modal de ajuste rápido de stock ──────────────────────────────────────
  const [productoAjuste, setProductoAjuste] = useState(null);

  // ── Modal de confirmación de eliminación ─────────────────────────────────
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // ── Avisos de notificación (éxito/error) ──────────────────────────────────
  const [aviso, setAviso] = useState(null);

  // ── Métricas de cabecera ─────────────────────────────────────────────────
  const resumen = useMemo(() => resumirInventario(productos), [productos]);
  const porReponer = resumen.bajos + resumen.agotados;

  // ── Lista filtrada ───────────────────────────────────────────────────────
  const visibles = useMemo(
    () =>
      filtrarProductos(productos, {
        texto: busqueda,
        categoria,
        soloBajoStock,
        estadoActivo,
      }),
    [productos, busqueda, categoria, soloBajoStock, estadoActivo],
  );

  const hayFiltros = Boolean(busqueda || categoria || estadoActivo || soloBajoStock);

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoria("");
    setEstadoActivo("");
    setSoloBajoStock(false);
  };

  // ── Handlers estables con useCallback ────────────────────────────────────
  const abrirCrear = useCallback(() => {
    setProductoEditando(null);
    setDrawerAbierto(true);
  }, []);

  const abrirEditar = useCallback((producto) => {
    setProductoEditando(producto);
    setDrawerAbierto(true);
  }, []);

  const cerrarDrawer = useCallback(() => {
    setDrawerAbierto(false);
    setProductoEditando(null);
  }, []);

  const abrirAjusteStock = useCallback((producto) => {
    setProductoAjuste(producto);
  }, []);

  const cerrarAjuste = useCallback(() => {
    setProductoAjuste(null);
  }, []);

  const cerrarEliminar = useCallback(() => {
    setProductoAEliminar(null);
  }, []);

  // ── Guardar producto (Creación / Edición) ─────────────────────────────────
  const guardarProducto = useCallback(
    async (datos) => {
      if (productoEditando) {
        const { stock: stockDeseado, ...resto } = datos;

        await actualizarProducto(productoEditando.id, resto);

        const delta = stockDeseado - (Number(productoEditando.stock) || 0);
        if (delta !== 0) {
          await ajustarStock(productoEditando.id, delta);
        }

        setAviso({
          variante: "exito",
          texto: `Se guardaron los cambios de "${datos.nombre}".`,
        });
        return;
      }

      await crearProducto(datos);
      setAviso({
        variante: "exito",
        texto: `Se agregó "${datos.nombre}" al catálogo maestro.`,
      });
    },
    [productoEditando, actualizarProducto, ajustarStock, crearProducto],
  );

  // ── Confirmar ajuste de stock (Entrada / Merma) ───────────────────────────
  const confirmarAjusteStock = useCallback(
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

  // ── Alternar visibilidad en la tienda web ────────────────────────────────
  const alternarVisibilidad = useCallback(
    async (producto) => {
      const activar = producto.activo === false;
      try {
        await actualizarProducto(producto.id, { activo: activar });
        setAviso({
          variante: "exito",
          texto: `"${producto.nombre}" ${activar ? "vuelve a verse" : "ya no se ve"} en la tienda web.`,
        });
      } catch (fallo) {
        setAviso({ variante: "peligro", texto: fallo.message });
      }
    },
    [actualizarProducto],
  );

  // ── Eliminar producto ────────────────────────────────────────────────────
  const confirmarEliminacion = useCallback(async () => {
    if (!productoAEliminar) return;
    const prod = productoAEliminar;
    setEliminando(true);
    try {
      await eliminarProducto(prod.id);
      setProductoAEliminar(null);
      setAviso({
        variante: "exito",
        texto: `Se eliminó "${prod.nombre}" del catálogo.`,
      });
    } catch (fallo) {
      setProductoAEliminar(null);
      setAviso({ variante: "peligro", texto: fallo.message });
    } finally {
      setEliminando(false);
    }
  }, [productoAEliminar, eliminarProducto]);

  // ── Carga inicial ────────────────────────────────────────────────────────
  if (cargando) {
    return <Cargando pantallaCompleta texto="Cargando catálogo e inventario…" />;
  }

  return (
    <div className="gestion">
      {/* ─────────────────────────────────────────────── Cabecera ────── */}
      <header className="gestion__cabecera">
        <div className="gestion__cabecera-textos">
          <h2 className="gestion__titulo">Catálogo y existencias</h2>
          <p className="gestion__descripcion">
            {productos.length} {productos.length === 1 ? "producto registrado" : "productos registrados"}
            {porReponer > 0 && ` · ${porReponer} por reponer`}. Control unificado de precios,
            inventario y visibilidad en la tienda web.
          </p>
        </div>

        <div className="gestion__cabecera-accion" style={{ display: "flex", gap: "var(--esp-2)" }}>
          <Boton variante="contorno" onClick={refrescar}>
            Actualizar
          </Boton>
          <Boton onClick={abrirCrear}>Nuevo producto</Boton>
        </div>
      </header>

      {/* ───────────────────────────────────────────────── Avisos ────── */}
      {error && (
        <Alerta variante="peligro" titulo="No se pudo cargar el catálogo">
          {error}
        </Alerta>
      )}

      {aviso && (
        <Alerta variante={aviso.variante} alCerrar={() => setAviso(null)}>
          {aviso.texto}
        </Alerta>
      )}

      {/* ───────────────────────────────────────────── Sin productos ─── */}
      {productos.length === 0 ? (
        <Card>
          <EstadoVacio
            icono="📦"
            titulo="El catálogo está vacío"
            descripcion="Registra el primer producto de la bodega para gestionar su stock, precio y visibilidad online."
            accion={<Boton onClick={abrirCrear}>Crear el primer producto</Boton>}
          />
        </Card>
      ) : (
        <>
          {/* ──────────────────────────────────────────── Resumen ────── */}
          <section className="gestion__resumen" aria-label="Resumen de existencias">
            <Card padding="sm">
              <div className="gestion__dato">
                <span className="gestion__dato-etiqueta">Productos</span>
                <span className="gestion__dato-valor">{resumen.total}</span>
                <span className="gestion__dato-nota">
                  {resumen.unidades} {pluralizar(resumen.unidades, "unidad")} en almacén
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
                <span className="gestion__dato-nota">Sin existencias</span>
              </div>
            </Card>

            <Card padding="sm">
              <div className="gestion__dato">
                <span className="gestion__dato-etiqueta">Valor total</span>
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
                onChange={(e) => setBusqueda(e.target.value)}
              />

              <Select
                className="gestion__filtro-select"
                etiqueta="Categoría"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </Select>

              <Select
                className="gestion__filtro-select"
                etiqueta="Visibilidad"
                value={estadoActivo}
                onChange={(e) => setEstadoActivo(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="activos">Visibles en tienda web</option>
                <option value="inactivos">Ocultos en tienda web</option>
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
                descripcion="Prueba con otra búsqueda o limpia los filtros para ver todo el catálogo."
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

              <div className="ui-tabla-scroll">
                <table className="ui-tabla">
                  <caption className="visualmente-oculto">
                    Catálogo maestro de productos con stock, precios y visibilidad
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col" className="gestion__col-md">
                        Categoría
                      </th>
                      <th scope="col" className="col-numero">
                        Precio
                      </th>
                      <th scope="col" className="col-numero">
                        Stock
                      </th>
                      <th scope="col" className="gestion__col-lg col-numero">
                        Mínimo
                      </th>
                      <th scope="col">Stock</th>
                      <th scope="col">Tienda</th>
                      <th scope="col" style={{ width: "48px", textAlign: "center" }}>
                        <span className="visualmente-oculto">Acciones</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibles.map((producto) => {
                      const oculto = producto.activo === false;
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
                            (oculto ? "gestion__fila--inactivo" : "")
                          }
                        >
                          {/* Celda Producto */}
                          <td className="gestion__celda-nombre">
                            <div
                              className="gestion__producto"
                              style={{ cursor: "pointer" }}
                              onClick={() => abrirEditar(producto)}
                              title="Clic para editar producto"
                            >
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
                                <span className="gestion__producto-meta">
                                  {producto.categoria} · {formatearSoles(producto.precio)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Categoría */}
                          <td className="gestion__col-md">{producto.categoria}</td>

                          {/* Precio */}
                          <td className="col-numero">
                            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
                              <span style={{ fontWeight: "var(--peso-semi)" }}>
                                {formatearSoles(producto.precio)}
                              </span>
                              {producto.tieneDescuento && (
                                <del style={{ fontSize: "var(--texto-2xs)", color: "var(--color-texto-tenue)" }}>
                                  {formatearSoles(producto.precioOriginal)}
                                </del>
                              )}
                            </div>
                          </td>

                          {/* Stock */}
                          <td className="col-numero">
                            <span className="gestion__stock">{stock}</span>
                            <span className="gestion__stock-unidad">
                              {pluralizar(stock, producto.unidad ?? "unidad")}
                            </span>
                          </td>

                          {/* Stock mínimo */}
                          <td className="gestion__col-lg col-numero">
                            {umbralDe(producto)}
                          </td>

                          {/* Estado de Stock */}
                          <td>
                            <Badge variante={estado.variante} tamano="sm" punto>
                              {estado.etiqueta}
                            </Badge>
                          </td>

                          {/* Visibilidad Tienda */}
                          <td>
                            <Badge variante={oculto ? "neutro" : "exito"} tamano="sm" punto>
                              {oculto ? "Oculto" : "Visible"}
                            </Badge>
                          </td>

                          {/* Acciones con MenuKebab */}
                          <td>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                              <MenuKebab
                                ariaLabel={`Opciones para ${producto.nombre}`}
                                acciones={[
                                  {
                                    label: "Editar producto",
                                    icono: "✏️",
                                    onClick: () => abrirEditar(producto),
                                  },
                                  {
                                    label: "Ajustar existencias",
                                    icono: "📦",
                                    onClick: () => abrirAjusteStock(producto),
                                  },
                                  {
                                    label: oculto ? "Mostrar en tienda" : "Ocultar en tienda",
                                    icono: oculto ? "👁️" : "🙈",
                                    onClick: () => alternarVisibilidad(producto),
                                  },
                                  {
                                    separador: true,
                                  },
                                  {
                                    label: "Eliminar producto",
                                    icono: "🗑️",
                                    peligro: true,
                                    onClick: () => setProductoAEliminar(producto),
                                  },
                                ]}
                              />
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

      {/* ────────────────── Drawer de Creación / Edición de Producto ───── */}
      <DrawerProducto
        key={productoEditando?.id ?? (drawerAbierto ? "nuevo" : "cerrado")}
        abierto={drawerAbierto}
        producto={productoEditando}
        categorias={categorias}
        alCerrar={cerrarDrawer}
        alGuardar={guardarProducto}
      />

      {/* ────────────────── Modal de Ajuste de Stock ─────────────────── */}
      {productoAjuste && (
        <ModalAjusteStock
          key={productoAjuste.id}
          producto={productoAjuste}
          alCerrar={cerrarAjuste}
          alConfirmar={confirmarAjusteStock}
        />
      )}

      {/* ────────────────── Modal de Confirmación de Eliminación ─────── */}
      {productoAEliminar && (
        <Modal
          abierto
          alCerrar={cerrarEliminar}
          titulo="Eliminar producto"
          tamano="sm"
          pie={
            <div style={{ display: "flex", gap: "var(--esp-2)", width: "100%", justifyContent: "flex-end" }}>
              <Boton variante="contorno" onClick={cerrarEliminar} disabled={eliminando} type="button">
                Cancelar
              </Boton>
              <Boton variante="peligro" onClick={confirmarEliminacion} cargando={eliminando} type="button">
                Sí, eliminar
              </Boton>
            </div>
          }
        >
          <div className="gestion__formulario">
            <p>
              ¿Seguro que quieres eliminar <strong>{productoAEliminar.nombre}</strong> del catálogo maestro?
              Esta acción no se puede deshacer.
            </p>

            <Alerta variante="advertencia">
              Si solo deseas dejar de venderlo temporalmente en la web, utiliza la opción{" "}
              <strong>Ocultar en tienda</strong> del menú.
            </Alerta>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default CatalogoPage;
