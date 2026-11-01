/**
 * ============================================================================
 * PROMOCIONES · Gestión de descuentos con patrón Decorator
 * ============================================================================
 * Ruta: /dashboard/promociones · Acceso: SOLO ADMIN
 *
 * 🪝 PATRÓN DECORATOR: implementado en ./promociones/decoradores.js
 * Cada promoción envuelve el precio base y le agrega su efecto sin saber
 * qué otras promociones existen.
 * ==========================================================================*/

import { useState, useEffect, useCallback, useMemo } from "react";
import { useInventario } from "../../hooks/useInventario";
import { promocionRepository } from "../../repositories";
import { categoriasApi } from "../../api/categoriasApi";
import { TIPOS_PROMOCION, ETIQUETAS_TIPO_PROMOCION } from "../../constantes";
import { formatearSoles, formatearFecha } from "../../utils/formato";
import {
  Boton,
  Card,
  CardCabecera,
  CardCuerpo,
  Input,
  Select,
  Badge,
  Alerta,
  Modal,
  Drawer,
  Cargando,
  EstadoVacio,
} from "../../components/ui";
import { calcularPrecioFinal } from "./promociones/decoradores";
import "./PromocionesPage.css";

function obtenerFinDia(fecha) {
  if (!fecha) return Infinity;
  const fechaStr = typeof fecha === "string" ? fecha.split("T")[0] : fecha;
  const partes = String(fechaStr).split("-").map(Number);
  if (partes.length === 3 && !partes.some(isNaN)) {
    const [anio, mes, dia] = partes;
    return new Date(anio, mes - 1, dia, 23, 59, 59, 999).getTime();
  }
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function obtenerInicioDia(fecha) {
  if (!fecha) return -Infinity;
  const fechaStr = typeof fecha === "string" ? fecha.split("T")[0] : fecha;
  const partes = String(fechaStr).split("-").map(Number);
  if (partes.length === 3 && !partes.some(isNaN)) {
    const [anio, mes, dia] = partes;
    return new Date(anio, mes - 1, dia, 0, 0, 0, 0).getTime();
  }
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function obtenerEstadoPromocion(promo) {
  const ahora = Date.now();
  const inicio = obtenerInicioDia(promo.desde);
  const fin = obtenerFinDia(promo.hasta);

  if (!promo.activa) return { texto: "Inactiva", variante: "neutro" };
  if (ahora < inicio) return { texto: "Programada", variante: "info" };
  if (ahora > fin) return { texto: "Vencida", variante: "peligro" };
  return { texto: "Vigente", variante: "exito" };
}

function DrawerPromocion({
  abierto,
  promocion = null,
  productos = [],
  categorias = [],
  alCerrar,
  alGuardar,
}) {
  const editando = promocion !== null;
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [filtroProducto, setFiltroProducto] = useState("");

  const [formulario, setFormulario] = useState(() => ({
    nombre: promocion?.nombre ?? "",
    descripcion: promocion?.descripcion ?? "",
    tipo: promocion?.tipo ?? TIPOS_PROMOCION.PORCENTAJE,
    valor: promocion?.valor != null ? String(promocion.valor) : "",
    aplicaTodos: Boolean(promocion?.aplicaTodos),
    prioridad: promocion?.prioridad != null ? Number(promocion.prioridad) : 0,
    esAcumulable: promocion?.esAcumulable !== false,
    desde: promocion?.desde ? String(promocion.desde).split("T")[0] : "",
    hasta: promocion?.hasta ? String(promocion.hasta).split("T")[0] : "",
    activa: promocion?.activa !== false,
    productoIds: (promocion?.productoIds || []).map(Number),
    categoriaIds: (promocion?.categoriaIds || []).map(Number),
  }));

  const requiereValor =
    formulario.tipo === TIPOS_PROMOCION.PORCENTAJE ||
    formulario.tipo === TIPOS_PROMOCION.MONTO_FIJO;

  const productosFiltrados = useMemo(() => {
    if (!filtroProducto.trim()) return productos;
    const q = filtroProducto.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(q) ||
        p.codigo?.toLowerCase().includes(q)
    );
  }, [productos, filtroProducto]);

  if (!abierto) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(null);

    if (!formulario.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (requiereValor && (!formulario.valor || Number(formulario.valor) <= 0)) {
      setError("El valor debe ser mayor a 0");
      return;
    }
    if (
      !formulario.aplicaTodos &&
      formulario.productoIds.length === 0 &&
      formulario.categoriaIds.length === 0
    ) {
      setError("Debes seleccionar al menos un producto o categoría si no aplica a todos");
      return;
    }
    if (formulario.desde && formulario.hasta && formulario.hasta < formulario.desde) {
      setError("La fecha 'hasta' debe ser posterior o igual a la fecha 'desde'");
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion?.trim() || null,
        tipo: formulario.tipo,
        valor: requiereValor ? Number(formulario.valor) : null,
        aplicaTodos: Boolean(formulario.aplicaTodos),
        prioridad: Number(formulario.prioridad) || 0,
        esAcumulable: Boolean(formulario.esAcumulable),
        desde: formulario.desde || null,
        hasta: formulario.hasta || null,
        activa: Boolean(formulario.activa),
        productoIds: formulario.aplicaTodos ? [] : formulario.productoIds,
        categoriaIds: formulario.aplicaTodos ? [] : formulario.categoriaIds,
      };
      await alGuardar(datos);
      alCerrar();
    } catch (err) {
      setError(err.message || "Error al guardar la promoción");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Drawer
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={editando ? "Editar promoción" : "Nueva promoción"}
      subtitulo={
        editando
          ? `Modifica los parámetros y condiciones de "${promocion.nombre}"`
          : "Configura una regla de descuento automático para tienda y mostrador"
      }
      tamano="md"
      pie={
        <div className="drawer-promocion__pie">
          <Boton
            variante="contorno"
            onClick={alCerrar}
            type="button"
            disabled={guardando}
          >
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            type="submit"
            form="form-drawer-promocion"
            cargando={guardando}
          >
            {editando ? "Guardar cambios" : "Crear promoción"}
          </Boton>
        </div>
      }
    >
      {error && (
        <Alerta
          variante="peligro"
          onClose={() => setError(null)}
          style={{ marginBottom: "var(--esp-4)" }}
        >
          {error}
        </Alerta>
      )}

      <form
        id="form-drawer-promocion"
        onSubmit={handleSubmit}
        className="promociones-page__form"
        autoComplete="off"
      >
        <Input
          etiqueta="Nombre"
          value={formulario.nombre}
          onChange={(e) => setFormulario((prev) => ({ ...prev, nombre: e.target.value }))}
          placeholder="Ej: Descuento de verano"
          requerido
        />

        <Input
          etiqueta="Descripción (opcional)"
          value={formulario.descripcion}
          onChange={(e) => setFormulario((prev) => ({ ...prev, descripcion: e.target.value }))}
          placeholder="Ej: Aplica para compras en tienda o web"
        />

        <Select
          etiqueta="Tipo de descuento"
          value={formulario.tipo}
          onChange={(e) => setFormulario((prev) => ({ ...prev, tipo: e.target.value }))}
        >
          {Object.entries(ETIQUETAS_TIPO_PROMOCION).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </Select>

        {requiereValor && (
          <Input
            etiqueta={
              formulario.tipo === TIPOS_PROMOCION.PORCENTAJE
                ? "Porcentaje de descuento"
                : "Monto de descuento"
            }
            type="number"
            min="0"
            step="any"
            value={formulario.valor}
            onChange={(e) => setFormulario((prev) => ({ ...prev, valor: e.target.value }))}
            prefijo={formulario.tipo === TIPOS_PROMOCION.PORCENTAJE ? "%" : "S/"}
            requerido
          />
        )}

        <label className="promociones-page__checkbox-label">
          <input
            type="checkbox"
            checked={formulario.aplicaTodos}
            onChange={(e) =>
              setFormulario((prev) => ({ ...prev, aplicaTodos: e.target.checked }))
            }
          />
          <strong>Aplica a todos los productos</strong>
        </label>

        {!formulario.aplicaTodos && (
          <>
            <div className="promociones-page__seccion-multiselect">
              <div className="promociones-page__multiselect-header">
                <span>Categorías ({formulario.categoriaIds.length} seleccionadas)</span>
              </div>
              <div className="promociones-page__multiselect-caja">
                {categorias.length === 0 ? (
                  <span style={{ fontSize: "var(--texto-xs)", color: "var(--color-texto-tenue)" }}>
                    No hay categorías registradas
                  </span>
                ) : (
                  categorias.map((c) => {
                    const idNum = Number(c.id);
                    const seleccionado = formulario.categoriaIds.includes(idNum);
                    return (
                      <label key={idNum} className="promociones-page__multiselect-item">
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => {
                            setFormulario((prev) => ({
                              ...prev,
                              categoriaIds: seleccionado
                                ? prev.categoriaIds.filter((id) => id !== idNum)
                                : [...prev.categoriaIds, idNum],
                            }));
                          }}
                        />
                        <span>{c.nombre}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="promociones-page__seccion-multiselect">
              <div className="promociones-page__multiselect-header">
                <span>Productos ({formulario.productoIds.length} seleccionados)</span>
              </div>
              <input
                type="text"
                placeholder="Buscar producto por nombre o código..."
                value={filtroProducto}
                onChange={(e) => setFiltroProducto(e.target.value)}
                className="ui-campo__input"
                style={{ padding: "var(--esp-1) var(--esp-2)", fontSize: "var(--texto-xs)" }}
              />
              <div className="promociones-page__multiselect-caja">
                {productosFiltrados.length === 0 ? (
                  <span style={{ fontSize: "var(--texto-xs)", color: "var(--color-texto-tenue)" }}>
                    No se encontraron productos
                  </span>
                ) : (
                  productosFiltrados.map((p) => {
                    const idNum = Number(p.id);
                    const seleccionado = formulario.productoIds.includes(idNum);
                    return (
                      <label key={idNum} className="promociones-page__multiselect-item">
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => {
                            setFormulario((prev) => ({
                              ...prev,
                              productoIds: seleccionado
                                ? prev.productoIds.filter((id) => id !== idNum)
                                : [...prev.productoIds, idNum],
                            }));
                          }}
                        />
                        <span>
                          {p.nombre} {p.codigo ? `(${p.codigo})` : ""}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        <div className="promociones-page__fila-doble">
          <Input
            etiqueta="Prioridad"
            type="number"
            min="0"
            value={formulario.prioridad}
            onChange={(e) => setFormulario((prev) => ({ ...prev, prioridad: e.target.value }))}
            ayuda="Menor = mayor prioridad (0 por defecto)"
          />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "var(--esp-2)" }}>
            <label className="promociones-page__checkbox-label">
              <input
                type="checkbox"
                checked={formulario.esAcumulable}
                onChange={(e) =>
                  setFormulario((prev) => ({ ...prev, esAcumulable: e.target.checked }))
                }
              />
              <span>Es acumulable</span>
            </label>
            <label className="promociones-page__checkbox-label">
              <input
                type="checkbox"
                checked={formulario.activa}
                onChange={(e) =>
                  setFormulario((prev) => ({ ...prev, activa: e.target.checked }))
                }
              />
              <span>Activa</span>
            </label>
          </div>
        </div>

        <div className="promociones-page__fila-doble">
          <Input
            etiqueta="Fecha desde (opcional)"
            type="date"
            value={formulario.desde}
            onChange={(e) => setFormulario((prev) => ({ ...prev, desde: e.target.value }))}
          />
          <Input
            etiqueta="Fecha hasta (opcional)"
            type="date"
            value={formulario.hasta}
            onChange={(e) => setFormulario((prev) => ({ ...prev, hasta: e.target.value }))}
          />
        </div>
      </form>
    </Drawer>
  );
}

export function PromocionesPage() {
  const { productos, refrescar } = useInventario();

  const [promociones, setPromociones] = useState([]);
  const [categoriasConId, setCategoriasConId] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [productoPreview, setProductoPreview] = useState(null);

  const cargarPromociones = useCallback(async () => {
    try {
      const todas = await promocionRepository.obtenerTodos();
      setPromociones(todas);
    } catch {
      setError("Error al cargar promociones");
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarCategorias = useCallback(async () => {
    try {
      const cats = await categoriasApi.listar();
      setCategoriasConId(cats);
    } catch {
      // No bloquea la vista si falla listar categorias
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    async function inicializar() {
      try {
        const [todas, cats] = await Promise.all([
          promocionRepository.obtenerTodos(),
          categoriasApi.listar().catch(() => []),
        ]);
        if (cancelado) return;
        setPromociones(todas);
        setCategoriasConId(cats);
      } catch {
        if (!cancelado) setError("Error al cargar promociones");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    inicializar();
    return () => {
      cancelado = true;
    };
  }, []);

  const abrirDrawer = useCallback((promo = null) => {
    setEditando(promo);
    setDrawerAbierto(true);
  }, []);

  const cerrarDrawer = useCallback(() => {
    setDrawerAbierto(false);
    setEditando(null);
  }, []);

  const guardar = async (datos) => {
    try {
      if (editando) {
        await promocionRepository.actualizar(editando.id, datos);
      } else {
        await promocionRepository.crear(datos);
      }

      await cargarPromociones();
      await cargarCategorias();
      if (typeof refrescar === "function") {
        await refrescar();
      }
    } catch (err) {
      setError("Error al guardar la promoción: " + (err.message || ""));
      throw err;
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta promoción?")) return;
    try {
      await promocionRepository.eliminar(id);
      await cargarPromociones();
      if (typeof refrescar === "function") {
        await refrescar();
      }
    } catch {
      setError("Error al eliminar la promoción");
    }
  };

  const probarPromocion = async (promo) => {
    try {
      let producto = null;
      if (promo.aplicaTodos) {
        producto = productos[0];
      } else if (promo.productoIds && promo.productoIds.length > 0) {
        const pid = String(promo.productoIds[0]);
        producto = productos.find((p) => String(p.id) === pid);
      } else if (promo.categoriaIds && promo.categoriaIds.length > 0) {
        producto = productos.find((p) =>
          promo.categoriaIds.includes(Number(p.categoriaId))
        );
      }
      if (!producto) {
        producto = productos[0];
      }
      if (!producto) {
        setError("No hay productos disponibles para probar");
        return;
      }

      const promosDelProducto = await promocionRepository.obtenerParaProducto(producto);
      if (promosDelProducto.length === 0) {
        setError(`No hay promociones vigentes para este producto (${producto.nombre})`);
        return;
      }

      const resultado = calcularPrecioFinal(producto, promosDelProducto);
      setProductoPreview({
        producto,
        resultado,
        promosAplicadas: promosDelProducto,
      });
    } catch {
      setError("Error al calcular el precio");
    }
  };

  const metricasPromociones = useMemo(() => {
    let vigentes = 0;
    let programadas = 0;
    let vencidas = 0;
    let inactivas = 0;

    promociones.forEach((promo) => {
      const estado = obtenerEstadoPromocion(promo);
      if (estado.texto === "Vigente") vigentes++;
      else if (estado.texto === "Programada") programadas++;
      else if (estado.texto === "Vencida") vencidas++;
      else inactivas++;
    });

    return {
      total: promociones.length,
      vigentes,
      programadas,
      vencidasOInactivas: vencidas + inactivas,
    };
  }, [promociones]);

  return (
    <div className="promociones-page">
      <header className="promociones-page__header">
        <div className="promociones-page__cabecera-textos">
          <h1 className="promociones-page__titulo">Promociones y descuentos</h1>
          <p className="promociones-page__subtitulo">
            Gestiona reglas de descuento dinámicas aplicadas en el mostrador y la tienda web (patrón Decorator).
          </p>
        </div>
        <Boton variante="primario" onClick={() => abrirDrawer()}>
          + Nueva promoción
        </Boton>
      </header>

      {/* Franja de resumen de métricas reales */}
      <section className="promociones-page__metricas" aria-label="Métricas de promociones">
        <div className="promociones-page__metrica-card">
          <div className="promociones-page__metrica-top">
            <span className="promociones-page__metrica-label">Total promociones</span>
            <div className="promociones-page__metrica-icono" aria-hidden="true">🏷️</div>
          </div>
          <div className="promociones-page__metrica-valor serif">{metricasPromociones.total}</div>
          <span className="promociones-page__metrica-pie">Reglas registradas</span>
        </div>

        <div className="promociones-page__metrica-card promociones-page__metrica-card--vigentes">
          <div className="promociones-page__metrica-top">
            <span className="promociones-page__metrica-label">Vigentes / Activas</span>
            <div className="promociones-page__metrica-icono" aria-hidden="true">🟢</div>
          </div>
          <div className="promociones-page__metrica-valor serif promociones-page__metrica-valor--verde">
            {metricasPromociones.vigentes}
          </div>
          <span className="promociones-page__metrica-pie">Aplicando descuentos hoy</span>
        </div>

        <div className="promociones-page__metrica-card">
          <div className="promociones-page__metrica-top">
            <span className="promociones-page__metrica-label">Programadas</span>
            <div className="promociones-page__metrica-icono" aria-hidden="true">📅</div>
          </div>
          <div className="promociones-page__metrica-valor serif">{metricasPromociones.programadas}</div>
          <span className="promociones-page__metrica-pie">Inician próximamente</span>
        </div>

        <div className="promociones-page__metrica-card">
          <div className="promociones-page__metrica-top">
            <span className="promociones-page__metrica-label">Inactivas / Vencidas</span>
            <div className="promociones-page__metrica-icono" aria-hidden="true">⏸️</div>
          </div>
          <div className="promociones-page__metrica-valor serif">{metricasPromociones.vencidasOInactivas}</div>
          <span className="promociones-page__metrica-pie">Pausadas o caducadas</span>
        </div>
      </section>

      {error && (
        <Alerta variante="peligro" onClose={() => setError(null)}>
          {error}
        </Alerta>
      )}

      {cargando ? (
        <Cargando texto="Cargando promociones..." />
      ) : promociones.length === 0 ? (
        <EstadoVacio
          icono="🏷️"
          titulo="Sin promociones activas"
          descripcion="Crea tu primera promoción para ofrecer descuentos en productos o categorías"
        />
      ) : (
        <div className="promociones-page__lista">
          {promociones.map((promo) => {
            const estado = obtenerEstadoPromocion(promo);
            return (
              <Card key={promo.id} className="promociones-page__card">
                <CardCabecera>
                  <div className="promociones-page__card-header">
                    <h3 className="promociones-page__card-titulo">{promo.nombre}</h3>
                    <Badge variante={estado.variante} tamano="sm" punto>
                      {estado.texto}
                    </Badge>
                  </div>
                </CardCabecera>
                <CardCuerpo>
                  <div className="promociones-page__descuento-destacado">
                    <span className="promociones-page__descuento-valor">
                      {promo.tipo === TIPOS_PROMOCION.PORCENTAJE
                        ? `${promo.valor}% DCTO`
                        : promo.tipo === TIPOS_PROMOCION.MONTO_FIJO
                        ? `${formatearSoles(promo.valor)} DCTO`
                        : ETIQUETAS_TIPO_PROMOCION[promo.tipo] || promo.tipo}
                    </span>
                    <span className="promociones-page__descuento-tipo">
                      {ETIQUETAS_TIPO_PROMOCION[promo.tipo]}
                    </span>
                  </div>

                  <div className="promociones-page__detalles">
                    <div className="promociones-page__detalle">
                      <span className="promociones-page__detalle-etiqueta">Aplica a:</span>
                      <span className="promociones-page__detalle-valor">
                        {promo.aplicaTodos
                          ? "Todos los productos"
                          : [
                              promo.categorias?.length
                                ? `${promo.categorias.length} categoría(s)`
                                : null,
                              promo.productos?.length
                                ? `${promo.productos.length} producto(s)`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(", ") || "Sin alcance específico"}
                      </span>
                    </div>
                    <div className="promociones-page__detalle">
                      <span className="promociones-page__detalle-etiqueta">Prioridad / Regla:</span>
                      <span className="promociones-page__detalle-valor">
                        Prioridad {promo.prioridad ?? 0} ·{" "}
                        {promo.esAcumulable ? "Acumulable" : "No acumulable"}
                      </span>
                    </div>
                    {promo.desde && (
                      <div className="promociones-page__detalle">
                        <span className="promociones-page__detalle-etiqueta">Desde:</span>
                        <span className="promociones-page__detalle-valor">
                          {formatearFecha(promo.desde)}
                        </span>
                      </div>
                    )}
                    {promo.hasta && (
                      <div className="promociones-page__detalle">
                        <span className="promociones-page__detalle-etiqueta">Hasta:</span>
                        <span className="promociones-page__detalle-valor">
                          {formatearFecha(promo.hasta)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 🪝 PATRÓN DECORATOR: vista previa del cálculo */}
                  <div className="promociones-page__preview">
                    <Boton
                      variante="contorno"
                      tamano="sm"
                      onClick={() => probarPromocion(promo)}
                    >
                      Probar cálculo de precio
                    </Boton>
                  </div>

                  <div className="promociones-page__acciones">
                    <Boton variante="fantasma" tamano="sm" onClick={() => abrirDrawer(promo)}>
                      Editar
                    </Boton>
                    <Boton variante="peligro" tamano="sm" onClick={() => eliminar(promo.id)}>
                      Eliminar
                    </Boton>
                  </div>
                </CardCuerpo>
              </Card>
            );
          })}
        </div>
      )}

      {/* Panel Informativo: Cómo funcionan las promociones */}
      <section className="promociones-guia" aria-label="Cómo funcionan las promociones">
        <div className="promociones-guia__cabecera">
          <div className="promociones-guia__icono" aria-hidden="true">💡</div>
          <div className="promociones-guia__titulos">
            <h2 className="promociones-guia__titulo">¿Cómo funcionan las promociones en El Trigal?</h2>
            <p className="promociones-guia__subtitulo">
              El motor de precios calcula los descuentos dinámicos mediante un patrón Decorator modular y transparente.
            </p>
          </div>
        </div>

        <div className="promociones-guia__grid">
          <div className="promociones-guia__item">
            <div className="promociones-guia__item-header">
              <span className="promociones-guia__item-num">01</span>
              <h3 className="promociones-guia__item-titulo">Tipos de descuento</h3>
            </div>
            <p className="promociones-guia__item-texto">
              Aplica reducciones por <strong>Porcentaje (%)</strong> o un <strong>Monto Fijo (S/)</strong> directo sobre el precio unitario del producto.
            </p>
          </div>

          <div className="promociones-guia__item">
            <div className="promociones-guia__item-header">
              <span className="promociones-guia__item-num">02</span>
              <h3 className="promociones-guia__item-titulo">Prioridad de aplicación</h3>
            </div>
            <p className="promociones-guia__item-texto">
              Las promociones con <strong>mayor prioridad</strong> se ejecutan primero envolviendo el precio base sucesivamente.
            </p>
          </div>

          <div className="promociones-guia__item">
            <div className="promociones-guia__item-header">
              <span className="promociones-guia__item-num">03</span>
              <h3 className="promociones-guia__item-titulo">Acumulabilidad</h3>
            </div>
            <p className="promociones-guia__item-texto">
              Si una promoción es <em>no acumulable</em>, bloquea descuentos de menor prioridad para ese mismo producto o categoría.
            </p>
          </div>

          <div className="promociones-guia__item">
            <div className="promociones-guia__item-header">
              <span className="promociones-guia__item-num">04</span>
              <h3 className="promociones-guia__item-titulo">Alcance y vigencia</h3>
            </div>
            <p className="promociones-guia__item-texto">
              Configura descuentos a nivel global (todos), por categorías enteras o seleccionando productos específicos dentro de un rango de fechas.
            </p>
          </div>
        </div>
      </section>

      {/* Drawer lateral de creación/edición */}
      <DrawerPromocion
        key={editando?.id ?? (drawerAbierto ? "nuevo" : "cerrado")}
        abierto={drawerAbierto}
        promocion={editando}
        productos={productos}
        categorias={categoriasConId}
        alCerrar={cerrarDrawer}
        alGuardar={guardar}
      />

      {/* Modal de vista previa del cálculo */}
      {productoPreview && (
        <Modal
          abierto={productoPreview !== null}
          alCerrar={() => setProductoPreview(null)}
          titulo="Vista previa del precio"
        >
          <div className="promociones-page__preview-modal">
            <div className="promociones-page__preview-producto">
              <strong>{productoPreview.producto.nombre}</strong>
              <div>Precio original: {formatearSoles(productoPreview.producto.precio)}</div>
            </div>
            <hr />
            <div className="promociones-page__preview-detalle">
              {productoPreview.resultado.detalle.map((d, i) => (
                <div key={i} className="promociones-page__preview-linea">
                  {d}
                </div>
              ))}
            </div>
            <hr />
            <div className="promociones-page__preview-final">
              <strong>Precio final: {formatearSoles(productoPreview.resultado.monto)}</strong>
            </div>
            <Boton variante="primario" bloque onClick={() => setProductoPreview(null)}>
              Cerrar
            </Boton>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default PromocionesPage;

