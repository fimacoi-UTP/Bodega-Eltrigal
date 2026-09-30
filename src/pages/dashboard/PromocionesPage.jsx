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

import { useState, useEffect, useCallback } from "react";
import { useInventario } from "../../hooks/useInventario";
import { promocionRepository } from "../../repositories";
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

function ModalPromocion({
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

  const [formulario, setFormulario] = useState(() => ({
    nombre: promocion?.nombre ?? "",
    tipo: promocion?.tipo ?? TIPOS_PROMOCION.PORCENTAJE,
    valor: promocion?.valor != null ? String(promocion.valor) : "",
    aplicaA: promocion?.aplicaA ?? "TODO",
    objetivo: promocion?.objetivo ?? "",
    desde: promocion?.desde?.split("T")[0] ?? "",
    hasta: promocion?.hasta?.split("T")[0] ?? "",
    activa: promocion?.activa !== false,
  }));

  if (!abierto) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(null);

    // Validaciones
    if (!formulario.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!formulario.valor || Number(formulario.valor) <= 0) {
      setError("El valor debe ser mayor a 0");
      return;
    }
    if (formulario.aplicaA !== "TODO" && !formulario.objetivo) {
      setError("Debes seleccionar un producto o categoría");
      return;
    }
    if (formulario.desde && formulario.hasta && new Date(formulario.hasta) <= new Date(formulario.desde)) {
      setError("La fecha 'hasta' debe ser posterior a la fecha 'desde'");
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        ...formulario,
        valor: Number(formulario.valor),
        desde: formulario.desde ? new Date(formulario.desde).toISOString() : null,
        hasta: formulario.hasta ? new Date(formulario.hasta).toISOString() : null,
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
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={editando ? "Editar promoción" : "Nueva promoción"}
    >
      {error && (
        <Alerta variante="peligro" onClose={() => setError(null)} style={{ marginBottom: "var(--esp-4)" }}>
          {error}
        </Alerta>
      )}

      <form onSubmit={handleSubmit} className="promociones-page__form">
        <Input
          etiqueta="Nombre"
          value={formulario.nombre}
          onChange={(e) => setFormulario((prev) => ({ ...prev, nombre: e.target.value }))}
          placeholder="Ej: Descuento de verano"
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

        <Input
          etiqueta={formulario.tipo === TIPOS_PROMOCION.PORCENTAJE ? "Porcentaje" : "Monto"}
          type="number"
          value={formulario.valor}
          onChange={(e) => setFormulario((prev) => ({ ...prev, valor: e.target.value }))}
          prefijo={formulario.tipo === TIPOS_PROMOCION.PORCENTAJE ? "%" : "S/"}
        />

        <Select
          etiqueta="Aplica a"
          value={formulario.aplicaA}
          onChange={(e) =>
            setFormulario((prev) => ({ ...prev, aplicaA: e.target.value, objetivo: "" }))
          }
        >
          <option value="TODO">Todos los productos</option>
          <option value="PRODUCTO">Producto específico</option>
          <option value="CATEGORIA">Categoría</option>
        </Select>

        {formulario.aplicaA === "PRODUCTO" && (
          <Select
            etiqueta="Producto"
            value={formulario.objetivo}
            onChange={(e) => setFormulario((prev) => ({ ...prev, objetivo: e.target.value }))}
          >
            <option value="">Selecciona un producto</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        )}

        {formulario.aplicaA === "CATEGORIA" && (
          <Select
            etiqueta="Categoría"
            value={formulario.objetivo}
            onChange={(e) => setFormulario((prev) => ({ ...prev, objetivo: e.target.value }))}
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}

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

        <div className="promociones-page__form-botones">
          <Boton variante="contorno" onClick={alCerrar} type="button">
            Cancelar
          </Boton>
          <Boton variante="primario" type="submit" cargando={guardando}>
            {editando ? "Actualizar" : "Crear"}
          </Boton>
        </div>
      </form>
    </Modal>
  );
}

export function PromocionesPage() {
  const { productos, categorias, refrescar } = useInventario();

  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
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

  useEffect(() => {
    let cancelado = false;
    async function inicializar() {
      try {
        const todas = await promocionRepository.obtenerTodos();
        if (cancelado) return;
        setPromociones(todas);
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

  const abrirModal = useCallback((promo = null) => {
    setEditando(promo);
    setModalAbierto(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
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
      const producto = productos.find((p) => p.id === promo.objetivo) || productos[0];
      if (!producto) {
        setError("No hay productos disponibles para probar");
        return;
      }

      const promosDelProducto = await promocionRepository.obtenerParaProducto(producto);
      if (promosDelProducto.length === 0) {
        setError("No hay promociones vigentes para este producto");
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

  return (
    <div className="promociones-page">
      <header className="promociones-page__header">
        <div className="promociones-page__cabecera-textos">
          <h1 className="promociones-page__titulo">Promociones y descuentos</h1>
          <p className="promociones-page__subtitulo">
            Gestiona reglas de descuento dinámicas aplicadas en el mostrador y la tienda web (patrón Decorator).
          </p>
        </div>
        <Boton variante="primario" onClick={() => abrirModal()}>
          + Nueva promoción
        </Boton>
      </header>

      {error && (
        <Alerta variante="peligro" onClose={() => setError(null)}>
          {error}
        </Alerta>
      )}

      {cargando ? (
        <Cargando texto="Cargando promociones..." />
      ) : promociones.length === 0 ? (
        <EstadoVacio icono="🏷️" titulo="Sin promociones activas" descripcion="Crea tu primera promoción para ofrecer descuentos en productos o categorías" />
      ) : (
        <div className="promociones-page__lista">
          {promociones.map((promo) => {
            const estado = obtenerEstadoPromocion(promo);
            return (
              <Card key={promo.id} className="promociones-page__card">
                <CardCabecera>
                  <div className="promociones-page__card-header">
                    <h3 className="promociones-page__card-titulo">{promo.nombre}</h3>
                    <Badge variante={estado.variante} tamano="sm" punto>{estado.texto}</Badge>
                  </div>
                </CardCabecera>
                <CardCuerpo>
                  <div className="promociones-page__descuento-destacado">
                    <span className="promociones-page__descuento-valor">
                      {promo.tipo === TIPOS_PROMOCION.PORCENTAJE
                        ? `${promo.valor}% DCTO`
                        : `${formatearSoles(promo.valor)} DCTO`}
                    </span>
                    <span className="promociones-page__descuento-tipo">
                      {ETIQUETAS_TIPO_PROMOCION[promo.tipo]}
                    </span>
                  </div>

                  <div className="promociones-page__detalles">
                    <div className="promociones-page__detalle">
                      <span className="promociones-page__detalle-etiqueta">Aplica a:</span>
                      <span className="promociones-page__detalle-valor">
                        {promo.aplicaA === "TODO"
                          ? "Todos los productos"
                          : promo.aplicaA === "PRODUCTO"
                          ? `Producto: ${promo.objetivo}`
                          : `Categoría: ${promo.objetivo}`}
                      </span>
                    </div>
                    {promo.desde && (
                      <div className="promociones-page__detalle">
                        <span className="promociones-page__detalle-etiqueta">Desde:</span>
                        <span className="promociones-page__detalle-valor">{formatearFecha(promo.desde)}</span>
                      </div>
                    )}
                    {promo.hasta && (
                      <div className="promociones-page__detalle">
                        <span className="promociones-page__detalle-etiqueta">Hasta:</span>
                        <span className="promociones-page__detalle-valor">{formatearFecha(promo.hasta)}</span>
                      </div>
                    )}
                  </div>

                  {/* 🪝 PATRÓN DECORATOR: vista previa del cálculo */}
                  {promo.aplicaA === "PRODUCTO" && promo.objetivo && (
                    <div className="promociones-page__preview">
                      <Boton
                        variante="contorno"
                        tamano="sm"
                        onClick={() => probarPromocion(promo)}
                      >
                        Probar cálculo de precio
                      </Boton>
                    </div>
                  )}

                  <div className="promociones-page__acciones">
                    <Boton variante="fantasma" tamano="sm" onClick={() => abrirModal(promo)}>
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

      {/* Modal de creación/edición */}
      <ModalPromocion
        key={editando?.id ?? (modalAbierto ? "nuevo" : "cerrado")}
        abierto={modalAbierto}
        promocion={editando}
        productos={productos}
        categorias={categorias}
        alCerrar={cerrarModal}
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
