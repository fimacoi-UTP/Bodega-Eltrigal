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

import { useState, useEffect } from "react";
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

export function PromocionesPage() {
  const { productos, categorias } = useInventario();

  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [productoPreview, setProductoPreview] = useState(null);

  // Formulario
  const [formulario, setFormulario] = useState({
    nombre: "",
    tipo: TIPOS_PROMOCION.PORCENTAJE,
    valor: "",
    aplicaA: "TODO",
    objetivo: "",
    desde: "",
    hasta: "",
    activa: true,
  });

  useEffect(() => {
    cargarPromociones();
  }, []);

  const cargarPromociones = async () => {
    try {
      const todas = await promocionRepository.obtenerTodos();
      setPromociones(todas);
    } catch (err) {
      setError("Error al cargar promociones");
    } finally {
      setCargando(false);
    }
  };

  const abrirModal = (promo = null) => {
    if (promo) {
      setEditando(promo);
      setFormulario({
        nombre: promo.nombre,
        tipo: promo.tipo,
        valor: promo.valor,
        aplicaA: promo.aplicaA,
        objetivo: promo.objetivo || "",
        desde: promo.desde?.split("T")[0] || "",
        hasta: promo.hasta?.split("T")[0] || "",
        activa: promo.activa,
      });
    } else {
      setEditando(null);
      setFormulario({
        nombre: "",
        tipo: TIPOS_PROMOCION.PORCENTAJE,
        valor: "",
        aplicaA: "TODO",
        objetivo: "",
        desde: "",
        hasta: "",
        activa: true,
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setError(null);
  };

  const guardar = async () => {
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

    try {
      const datos = {
        ...formulario,
        valor: Number(formulario.valor),
        desde: formulario.desde ? new Date(formulario.desde).toISOString() : null,
        hasta: formulario.hasta ? new Date(formulario.hasta).toISOString() : null,
      };

      if (editando) {
        await promocionRepository.actualizar(editando.id, datos);
      } else {
        await promocionRepository.crear(datos);
      }

      await cargarPromociones();
      cerrarModal();
    } catch (err) {
      setError("Error al guardar la promoción");
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta promoción?")) return;
    try {
      await promocionRepository.eliminar(id);
      await cargarPromociones();
    } catch (err) {
      setError("Error al eliminar la promoción");
    }
  };

  const obtenerEstadoPromocion = (promo) => {
    const ahora = Date.now();
    const inicio = promo.desde ? new Date(promo.desde).getTime() : -Infinity;
    const fin = promo.hasta ? new Date(promo.hasta).getTime() : Infinity;

    if (!promo.activa) return { texto: "Inactiva", variante: "neutro" };
    if (ahora < inicio) return { texto: "Programada", variante: "info" };
    if (ahora > fin) return { texto: "Vencida", variante: "peligro" };
    return { texto: "Vigente", variante: "exito" };
  };

  const probarPromocion = async (promo) => {
    try {
      const promosVigentes = await promocionRepository.obtenerVigentes();
      const promosDelProducto = promosVigentes.filter(p => 
        p.aplicaA === "TODO" || 
        (p.aplicaA === "PRODUCTO" && p.objetivo === promo.objetivo) ||
        (p.aplicaA === "CATEGORIA" && p.objetivo === promo.objetivo)
      );

      if (promosDelProducto.length === 0) {
        setError("No hay promociones vigentes para este producto");
        return;
      }

      const producto = productos.find(p => p.id === promo.objetivo) || productos[0];
      if (!producto) {
        setError("No hay productos disponibles para probar");
        return;
      }

      const resultado = calcularPrecioFinal(producto, promosDelProducto);
      setProductoPreview({
        producto,
        resultado,
        promosAplicadas: promosDelProducto,
      });
    } catch (err) {
      setError("Error al calcular el precio");
    }
  };

  return (
    <div className="promociones-page">
      <div className="promociones-page__header">
        <h1 className="promociones-page__titulo">Promociones y descuentos</h1>
        <Boton variante="primario" onClick={() => abrirModal()}>
          Nueva promoción
        </Boton>
      </div>

      {error && (
        <Alerta variante="peligro" onClose={() => setError(null)}>
          {error}
        </Alerta>
      )}

      {cargando ? (
        <Cargando texto="Cargando promociones..." />
      ) : promociones.length === 0 ? (
        <EstadoVacio icono="🏷️" titulo="Sin promociones" descripcion="Crea tu primera promoción para ofrecer descuentos" />
      ) : (
        <div className="promociones-page__lista">
          {promociones.map((promo) => {
            const estado = obtenerEstadoPromocion(promo);
            return (
              <Card key={promo.id} className="promociones-page__card">
                <CardCabecera>
                  <div className="promociones-page__card-header">
                    <h3>{promo.nombre}</h3>
                    <Badge variante={estado.variante}>{estado.texto}</Badge>
                  </div>
                </CardCabecera>
                <CardCuerpo>
                  <div className="promociones-page__detalles">
                    <div className="promociones-page__detalle">
                      <span className="promociones-page__detalle-etiqueta">Tipo:</span>
                      <span>{ETIQUETAS_TIPO_PROMOCION[promo.tipo]}</span>
                    </div>
                    <div className="promociones-page__detalle">
                      <span className="promociones-page__detalle-etiqueta">Valor:</span>
                      <span>
                        {promo.tipo === TIPOS_PROMOCION.PORCENTAJE
                          ? `${promo.valor}%`
                          : formatearSoles(promo.valor)}
                      </span>
                    </div>
                    <div className="promociones-page__detalle">
                      <span className="promociones-page__detalle-etiqueta">Aplica a:</span>
                      <span>
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
                        <span>{formatearFecha(promo.desde)}</span>
                      </div>
                    )}
                    {promo.hasta && (
                      <div className="promociones-page__detalle">
                        <span className="promociones-page__detalle-etiqueta">Hasta:</span>
                        <span>{formatearFecha(promo.hasta)}</span>
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
                    <Boton variante="fantasma" onClick={() => abrirModal(promo)}>
                      Editar
                    </Boton>
                    <Boton variante="peligro" onClick={() => eliminar(promo.id)}>
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
      <Modal abierto={modalAbierto} alCerrar={cerrarModal} titulo={editando ? "Editar promoción" : "Nueva promoción"}>
        <div className="promociones-page__form">
          <Input
            etiqueta="Nombre"
            value={formulario.nombre}
            onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
            placeholder="Ej: Descuento de verano"
          />

          <Select
            etiqueta="Tipo de descuento"
            value={formulario.tipo}
            onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
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
            onChange={(e) => setFormulario({ ...formulario, valor: e.target.value })}
            prefijo={formulario.tipo === TIPOS_PROMOCION.PORCENTAJE ? "%" : "S/"}
          />

          <Select
            etiqueta="Aplica a"
            value={formulario.aplicaA}
            onChange={(e) => setFormulario({ ...formulario, aplicaA: e.target.value, objetivo: "" })}
          >
            <option value="TODO">Todos los productos</option>
            <option value="PRODUCTO">Producto específico</option>
            <option value="CATEGORIA">Categoría</option>
          </Select>

          {formulario.aplicaA === "PRODUCTO" && (
            <Select
              etiqueta="Producto"
              value={formulario.objetivo}
              onChange={(e) => setFormulario({ ...formulario, objetivo: e.target.value })}
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
              onChange={(e) => setFormulario({ ...formulario, objetivo: e.target.value })}
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
            onChange={(e) => setFormulario({ ...formulario, desde: e.target.value })}
          />

          <Input
            etiqueta="Fecha hasta (opcional)"
            type="date"
            value={formulario.hasta}
            onChange={(e) => setFormulario({ ...formulario, hasta: e.target.value })}
          />

          <div className="promociones-page__form-botones">
            <Boton variante="contorno" onClick={cerrarModal}>
              Cancelar
            </Boton>
            <Boton variante="primario" onClick={guardar}>
              {editando ? "Actualizar" : "Crear"}
            </Boton>
          </div>
        </div>
      </Modal>

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
