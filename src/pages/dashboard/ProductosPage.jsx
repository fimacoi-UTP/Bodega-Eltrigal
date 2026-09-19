/**
 * ============================================================================
 * ProductosPage · Gestión del catálogo (CRUD)
 * ----------------------------------------------------------------------------
 * Ruta: /dashboard/productos · Acceso: SOLO ADMIN
 *
 * Aquí se decide QUÉ vende la bodega: alta, edición, activación y baja de
 * productos. Lo que se cree en esta pantalla aparece solo en la tienda web,
 * porque las dos zonas leen del mismo repositorio.
 *
 * El control de acceso NO está en este archivo: lo pone <RutaProtegida
 * rol={ROLES.ADMIN}> en src/routes/AppRouter.jsx (patrón Proxy). Esta página
 * no sabe ni tiene por qué saber quién puede verla.
 *
 * ── SOBRE EL CAMPO "STOCK" AL EDITAR ──────────────────────────────────────
 * El formulario deja editar el stock, pero al guardar NO lo sobrescribe: se
 * calcula la diferencia contra el valor guardado y se aplica con
 * `ajustarStock(id, delta)`, que es el mismo camino que usa el inventario.
 *
 * ¿Por qué el rodeo? Porque el stock es la fuente de verdad compartida con la
 * tienda web. Si el encargado abre este formulario cuando hay 40 unidades y
 * mientras tanto un cliente compra 3, guardar "40" borraría esa venta. Guardar
 * "sumó 0" respeta lo que pasó por detrás.
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
  Modal,
  Select,
} from "../../components/ui";
import { formatearSoles } from "../../utils/formato";
import ModalProducto from "./gestion/ModalProducto";
import { estadoStock, filtrarProductos } from "./gestion/utilesInventario";
import "./gestion/gestion.css";

export function ProductosPage() {
  const {
    productos,
    categorias,
    cargando,
    error,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    ajustarStock,
  } = useInventario();

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estadoActivo, setEstadoActivo] = useState("");

  // ── Formulario ───────────────────────────────────────────────────────────
  // `formularioAbierto` y `productoEditando` van juntos: si hay producto es
  // edición, si es null es creación.
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  // ── Confirmación de borrado ──────────────────────────────────────────────
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // ── Aviso de resultado ───────────────────────────────────────────────────
  const [aviso, setAviso] = useState(null); // { variante, texto }

  /* Filtramos sobre `productos` (la lista completa) y no con buscar() del hook,
     porque este panel necesita ver también los productos desactivados. */
  const visibles = useMemo(
    () => filtrarProductos(productos, { texto: busqueda, categoria, estadoActivo }),
    [productos, busqueda, categoria, estadoActivo],
  );

  const inactivos = useMemo(
    () => productos.filter((producto) => producto.activo === false).length,
    [productos],
  );

  const hayFiltros = Boolean(busqueda || categoria || estadoActivo);

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoria("");
    setEstadoActivo("");
  };

  /* ⚠️ Estos dos cierres van con useCallback a propósito: <Modal> los tiene en
     las dependencias de su efecto, y ese efecto hace focus(). Con una función
     nueva en cada render, el foco saltaría del input al contenedor en cada
     tecla y el formulario sería imposible de llenar. */
  const cerrarFormulario = useCallback(() => {
    setFormularioAbierto(false);
    setProductoEditando(null);
  }, []);

  const cerrarEliminar = useCallback(() => setProductoAEliminar(null), []);

  const abrirCrear = () => {
    setProductoEditando(null);
    setFormularioAbierto(true);
  };

  const abrirEditar = (producto) => {
    setProductoEditando(producto);
    setFormularioAbierto(true);
  };

  /**
   * Guarda el producto (crear o editar).
   * Se la pasamos al modal; si algo falla, el error sube hasta él y se muestra
   * sin cerrar el formulario ni perder lo que el usuario escribió.
   */
  const guardar = useCallback(
    async (datos) => {
      if (productoEditando) {
        // El stock NO se sobrescribe: se convierte en un movimiento (ver la
        // explicación de la cabecera de este archivo).
        const { stock: stockDeseado, ...resto } = datos;

        await actualizarProducto(productoEditando.id, resto);

        const delta = stockDeseado - (Number(productoEditando.stock) || 0);
        if (delta !== 0) {
          await ajustarStock(productoEditando.id, delta);
        }

        cerrarFormulario();
        setAviso({ variante: "exito", texto: `Se guardaron los cambios de "${datos.nombre}".` });
        return;
      }

      await crearProducto(datos);
      cerrarFormulario();
      setAviso({ variante: "exito", texto: `Se agregó "${datos.nombre}" al catálogo.` });
    },
    [productoEditando, actualizarProducto, ajustarStock, crearProducto, cerrarFormulario],
  );

  /** Muestra u oculta el producto en la tienda web, sin borrarlo. */
  const alternarVisibilidad = async (producto) => {
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
  };

  /** Elimina definitivamente, ya confirmado por el usuario. */
  const confirmarEliminacion = async () => {
    const producto = productoAEliminar;
    setEliminando(true);
    try {
      await eliminarProducto(producto.id);
      setProductoAEliminar(null);
      setAviso({ variante: "exito", texto: `Se eliminó "${producto.nombre}" del catálogo.` });
    } catch (fallo) {
      setProductoAEliminar(null);
      setAviso({ variante: "peligro", texto: fallo.message });
    } finally {
      setEliminando(false);
    }
  };

  /* ── Estado: cargando ───────────────────────────────────────────────────── */
  if (cargando) {
    return <Cargando pantallaCompleta texto="Cargando productos…" />;
  }

  return (
    <div className="gestion">
      {/* ─────────────────────────────────────────────── Cabecera ────── */}
      <header className="gestion__cabecera">
        <div className="gestion__cabecera-textos">
          <h2 className="gestion__titulo">Catálogo de la bodega</h2>
          <p className="gestion__descripcion">
            {productos.length} {productos.length === 1 ? "producto" : "productos"} registrados
            {inactivos > 0 && `, ${inactivos} sin mostrar en la tienda`}. Lo que crees aquí
            aparece solo en la tienda web.
          </p>
        </div>

        <div className="gestion__cabecera-accion">
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

      {productos.length === 0 ? (
        <Card>
          <EstadoVacio
            icono="🏷️"
            titulo="El catálogo está vacío"
            descripcion="Registra el primer producto de la bodega para que aparezca en la tienda web y en el inventario."
            accion={<Boton onClick={abrirCrear}>Crear el primer producto</Boton>}
          />
        </Card>
      ) : (
        <>
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

              <Select
                className="gestion__filtro-select"
                etiqueta="Visibilidad"
                value={estadoActivo}
                onChange={(evento) => setEstadoActivo(evento.target.value)}
              >
                <option value="">Todos</option>
                <option value="activos">Visibles en la tienda</option>
                <option value="inactivos">Ocultos</option>
              </Select>
            </div>
          </Card>

          {/* ───────────────────────────────────────────── Tabla ─────── */}
          {visibles.length === 0 ? (
            <Card>
              <EstadoVacio
                icono="🔍"
                titulo="Ningún producto coincide"
                descripcion="Prueba con otra búsqueda o quita los filtros para ver todo el catálogo."
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
                    Productos del catálogo con sus acciones de gestión
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col" className="gestion__col-md">
                        Categoría
                      </th>
                      <th scope="col" className="gestion__col-lg">
                        Marca
                      </th>
                      <th scope="col" className="col-numero">
                        Precio
                      </th>
                      <th scope="col" className="gestion__col-sm col-numero">
                        Stock
                      </th>
                      <th scope="col">Estado</th>
                      <th scope="col">
                        <span className="visualmente-oculto">Acciones</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibles.map((producto) => {
                      const oculto = producto.activo === false;
                      const stock = estadoStock(producto);

                      return (
                        <tr
                          key={producto.id}
                          className={oculto ? "gestion__fila--inactivo" : undefined}
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
                                <span className="gestion__producto-meta">
                                  {producto.categoria} · {formatearSoles(producto.precio)}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="gestion__col-md">{producto.categoria}</td>

                          <td className="gestion__col-lg">{producto.marca || "—"}</td>

                          <td className="col-numero">{formatearSoles(producto.precio)}</td>

                          <td className="gestion__col-sm col-numero">
                            <Badge variante={stock.variante} tamano="sm">
                              {producto.stock}
                            </Badge>
                          </td>

                          <td>
                            <Badge variante={oculto ? "neutro" : "exito"} tamano="sm" punto>
                              {oculto ? "Oculto" : "Visible"}
                            </Badge>
                          </td>

                          <td>
                            <div className="gestion__acciones">
                              <Boton
                                tamano="sm"
                                variante="contorno"
                                onClick={() => abrirEditar(producto)}
                              >
                                Editar
                              </Boton>

                              <Boton
                                tamano="sm"
                                variante="fantasma"
                                onClick={() => alternarVisibilidad(producto)}
                              >
                                {oculto ? "Mostrar" : "Ocultar"}
                              </Boton>

                              <Boton
                                tamano="sm"
                                variante="fantasma"
                                onClick={() => setProductoAEliminar(producto)}
                              >
                                Eliminar
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

      {/* ──────────────────────────────── Formulario crear / editar ──── */}
      {/* `key` hace que React recree el modal al cambiar de producto, así los
          campos nacen precargados sin necesidad de un useEffect. */}
      {formularioAbierto && (
        <ModalProducto
          key={productoEditando?.id ?? "nuevo"}
          producto={productoEditando}
          categorias={categorias}
          alCerrar={cerrarFormulario}
          alGuardar={guardar}
        />
      )}

      {/* ──────────────────────────── Confirmación de eliminación ────── */}
      {/* Nunca se borra de un solo clic: en un negocio real eso cuesta caro. */}
      {productoAEliminar && (
        <Modal
          abierto
          alCerrar={cerrarEliminar}
          titulo="Eliminar producto"
          tamano="sm"
          pie={
            <>
              <Boton variante="contorno" onClick={cerrarEliminar} disabled={eliminando}>
                Cancelar
              </Boton>
              <Boton variante="peligro" onClick={confirmarEliminacion} cargando={eliminando}>
                Sí, eliminar
              </Boton>
            </>
          }
        >
          <div className="gestion__formulario">
            <p>
              ¿Seguro que quieres eliminar <strong>{productoAEliminar.nombre}</strong> del
              catálogo? Esta acción no se puede deshacer.
            </p>

            <Alerta variante="advertencia">
              Si solo quieres dejar de venderlo por un tiempo, usa <strong>Ocultar</strong>:
              el producto desaparece de la tienda web pero conserva su stock y su historial.
            </Alerta>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ProductosPage;
