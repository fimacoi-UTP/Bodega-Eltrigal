/**
 * ============================================================================
 * ModalProducto · Formulario para crear y editar un producto
 * ----------------------------------------------------------------------------
 * El mismo formulario sirve para las dos cosas:
 *   · `producto = null` → modo CREAR
 *   · `producto = {...}` → modo EDITAR (los campos vienen precargados)
 *
 * NO usa useEffect para precargar los datos. ProductosPage lo monta con
 * `key={producto?.id ?? 'nuevo'}`, así que al cambiar de producto React crea un
 * componente nuevo y los `useState` arrancan con los valores correctos. Es la
 * forma recomendada de "resetear" un formulario en React, y de paso evita el
 * efecto que dispararía la regla react-hooks/set-state-in-effect.
 *
 * Este componente solo se encarga del FORMULARIO y su validación. Quién guarda
 * y cómo se guarda es decisión de ProductosPage, que lo recibe en `alGuardar`.
 * ==========================================================================*/

import { useState } from "react";
import { Alerta, Boton, Input, Modal, Select } from "../../../components/ui";
import { UMBRAL_STOCK_BAJO } from "../../../constantes";
import { COLORES_SUGERIDOS, UNIDADES } from "./utilesInventario";

/** Valor especial del <select> para escribir una categoría que aún no existe. */
const CATEGORIA_NUEVA = "__NUEVA__";

export function ModalProducto({
  /** Producto a editar, o null para crear uno nuevo. */
  producto = null,
  /** Categorías que ya existen, para el desplegable. */
  categorias = [],
  alCerrar,
  /** async (datos) → guarda. Si lanza, el error se muestra aquí. */
  alGuardar,
}) {
  const editando = producto !== null;

  /* Estado del formulario. Los números se guardan como TEXTO mientras se
     escriben (un <input type="number"> vacío da "", no 0) y se convierten
     recién al validar. */
  const [form, setForm] = useState(() => ({
    nombre: producto?.nombre ?? "",
    categoria: producto?.categoria ?? "",
    marca: producto?.marca ?? "",
    descripcion: producto?.descripcion ?? "",
    precio: producto?.precio != null ? String(producto.precio) : "",
    stock: producto?.stock != null ? String(producto.stock) : "0",
    stockMinimo:
      producto?.stockMinimo != null ? String(producto.stockMinimo) : String(UMBRAL_STOCK_BAJO),
    unidad: producto?.unidad ?? "unidad",
    color: producto?.color || COLORES_SUGERIDOS[0],
    activo: producto?.activo !== false,
  }));

  /* Si el producto tiene una categoría que ya no está en la lista, igual hay
     que poder mostrarla: se agrega al desplegable. */
  const categoriasDisponibles =
    producto?.categoria && !categorias.includes(producto.categoria)
      ? [...categorias, producto.categoria].sort((a, b) => a.localeCompare(b, "es"))
      : categorias;

  const [categoriaNueva, setCategoriaNueva] = useState("");
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [guardando, setGuardando] = useState(false);

  /** Quita el error de un campo (al corregirlo, el mensaje debe desaparecer). */
  const limpiarError = (campo) => {
    setErrores((anteriores) => {
      if (!anteriores[campo]) return anteriores; // sin cambios: evita un render de más
      const resto = { ...anteriores };
      delete resto[campo];
      return resto;
    });
  };

  /** Actualiza un campo del formulario y borra su error, si lo tenía. */
  const cambiar = (campo, valor) => {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
    limpiarError(campo);
  };

  /** La categoría final: la del desplegable, o la escrita a mano. */
  const categoriaFinal = () =>
    (form.categoria === CATEGORIA_NUEVA ? categoriaNueva : form.categoria).trim();

  /** Valida todo el formulario y devuelve un objeto de errores. */
  const validar = () => {
    const nuevos = {};

    if (!form.nombre.trim()) {
      nuevos.nombre = "El nombre es obligatorio.";
    } else if (form.nombre.trim().length < 3) {
      nuevos.nombre = "Escribe al menos 3 caracteres.";
    }

    if (!categoriaFinal()) {
      nuevos.categoria = "Elige una categoría o escribe una nueva.";
    }

    const precio = Number(form.precio);
    if (!String(form.precio).trim()) {
      nuevos.precio = "El precio es obligatorio.";
    } else if (!Number.isFinite(precio) || precio <= 0) {
      nuevos.precio = "Debe ser un número mayor a 0.";
    }

    const stock = Number(form.stock);
    if (!String(form.stock).trim()) {
      nuevos.stock = "Indica el stock.";
    } else if (!Number.isInteger(stock) || stock < 0) {
      nuevos.stock = "Debe ser un número entero de 0 a más.";
    }

    const minimo = Number(form.stockMinimo);
    if (!String(form.stockMinimo).trim()) {
      nuevos.stockMinimo = "Indica el mínimo.";
    } else if (!Number.isInteger(minimo) || minimo < 0) {
      nuevos.stockMinimo = "Debe ser un número entero de 0 a más.";
    }

    return nuevos;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setErrorEnvio(null);

    const nuevos = validar();
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      return;
    }

    setGuardando(true);
    try {
      await alGuardar({
        nombre: form.nombre.trim(),
        categoria: categoriaFinal(),
        marca: form.marca.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        stock: Number(form.stock),
        stockMinimo: Number(form.stockMinimo),
        unidad: form.unidad,
        color: form.color,
        activo: form.activo,
      });
      // Si todo salió bien, ProductosPage cierra el modal.
    } catch (fallo) {
      setErrorEnvio(fallo.message);
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      alCerrar={alCerrar}
      titulo={editando ? "Editar producto" : "Nuevo producto"}
      tamano="lg"
      pie={
        <>
          <Boton variante="contorno" onClick={alCerrar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-producto" cargando={guardando}>
            {editando ? "Guardar cambios" : "Crear producto"}
          </Boton>
        </>
      }
    >
      <form id="form-producto" className="gestion__formulario" onSubmit={enviar} noValidate>
        {errorEnvio && <Alerta variante="peligro">{errorEnvio}</Alerta>}

        {/* ─────────────────────────────────── Identificación ────── */}
        <Input
          etiqueta="Nombre del producto"
          placeholder="Ej. Arroz Costeño Extra 5 kg"
          value={form.nombre}
          onChange={(evento) => cambiar("nombre", evento.target.value)}
          error={errores.nombre}
          requerido
          autoFocus
          maxLength={80}
        />

        <div className="gestion__fila-campos gestion__fila-campos--2">
          <Select
            etiqueta="Categoría"
            value={form.categoria}
            onChange={(evento) => cambiar("categoria", evento.target.value)}
            error={form.categoria === CATEGORIA_NUEVA ? undefined : errores.categoria}
            requerido
          >
            <option value="">Selecciona una categoría</option>
            {categoriasDisponibles.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
            <option value={CATEGORIA_NUEVA}>➕ Crear categoría nueva…</option>
          </Select>

          {form.categoria === CATEGORIA_NUEVA ? (
            <Input
              etiqueta="Nombre de la categoría"
              placeholder="Ej. Panadería"
              value={categoriaNueva}
              onChange={(evento) => {
                setCategoriaNueva(evento.target.value);
                limpiarError("categoria");
              }}
              error={errores.categoria}
              requerido
              maxLength={40}
            />
          ) : (
            <Input
              etiqueta="Marca (opcional)"
              placeholder="Ej. Costeño"
              value={form.marca}
              onChange={(evento) => cambiar("marca", evento.target.value)}
              maxLength={40}
            />
          )}
        </div>

        {/* Si el hueco de la marca lo ocupó la categoría nueva, la mostramos aparte. */}
        {form.categoria === CATEGORIA_NUEVA && (
          <Input
            etiqueta="Marca (opcional)"
            placeholder="Ej. Costeño"
            value={form.marca}
            onChange={(evento) => cambiar("marca", evento.target.value)}
            maxLength={40}
          />
        )}

        <div className="gestion__campo">
          <label className="gestion__campo-etiqueta" htmlFor="campo-descripcion">
            Descripción (opcional)
          </label>
          <textarea
            id="campo-descripcion"
            className="gestion__textarea"
            placeholder="Una línea que ayude al cliente a reconocer el producto."
            value={form.descripcion}
            onChange={(evento) => cambiar("descripcion", evento.target.value)}
            maxLength={160}
          />
        </div>

        {/* ──────────────────────────────── Precio y existencias ────── */}
        <p className="gestion__leyenda">Precio y existencias</p>

        <div className="gestion__fila-campos gestion__fila-campos--2">
          <Input
            etiqueta="Precio"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.10"
            prefijo="S/"
            placeholder="0.00"
            value={form.precio}
            onChange={(evento) => cambiar("precio", evento.target.value)}
            error={errores.precio}
            requerido
          />

          <Select
            etiqueta="Unidad de venta"
            value={form.unidad}
            onChange={(evento) => cambiar("unidad", evento.target.value)}
          >
            {UNIDADES.map((unidad) => (
              <option key={unidad} value={unidad}>
                {unidad}
              </option>
            ))}
          </Select>
        </div>

        <div className="gestion__fila-campos gestion__fila-campos--2">
          <Input
            etiqueta={editando ? "Stock actual" : "Stock inicial"}
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={form.stock}
            onChange={(evento) => cambiar("stock", evento.target.value)}
            error={errores.stock}
            ayuda={
              editando
                ? "Se registrará como movimiento de inventario, no como sobrescritura."
                : "Cuántas unidades hay al registrar el producto."
            }
            requerido
          />

          <Input
            etiqueta="Stock mínimo"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={form.stockMinimo}
            onChange={(evento) => cambiar("stockMinimo", evento.target.value)}
            error={errores.stockMinimo}
            ayuda="Por debajo de este número se avisa que hay que reponer."
            requerido
          />
        </div>

        {/* ────────────────────────────────── Presentación ────────── */}
        <p className="gestion__leyenda">Presentación en la tienda</p>

        <div className="gestion__campo">
          <span className="gestion__campo-etiqueta">Color de la tarjeta</span>
          <div className="gestion__colores">
            {COLORES_SUGERIDOS.map((color) => (
              <button
                key={color}
                type="button"
                className={
                  "gestion__color" +
                  (form.color === color ? " gestion__color--elegido" : "")
                }
                style={{ backgroundColor: color }}
                onClick={() => cambiar("color", color)}
                aria-label={`Usar el color ${color}`}
                aria-pressed={form.color === color}
              />
            ))}
          </div>
        </div>

        <label className="gestion__check">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(evento) => cambiar("activo", evento.target.checked)}
          />
          <span className="gestion__check-texto">
            Visible en la tienda web
            <span className="gestion__check-nota">
              Si lo desactivas, el producto sigue en el inventario pero los clientes
              dejan de verlo en el catálogo.
            </span>
          </span>
        </label>
      </form>
    </Modal>
  );
}

export default ModalProducto;
