/**
 * ============================================================================
 * DrawerProducto · Formulario lateral para crear y editar productos
 * ----------------------------------------------------------------------------
 * Permite gestionar en un solo panel lateral todos los atributos del producto:
 *   · Datos generales (nombre, categoría, marca, descripción)
 *   · Comercial (precio, unidad, color representativo)
 *   · Inventario (stock actual, stock mínimo para alertas)
 *   · Visibilidad en la tienda web (activo / inactivo)
 *
 * Se monta con `key={producto?.id ?? 'nuevo'}` para aislar el estado de los
 * inputs y evitar cualquier re-render o pérdida de foco.
 * ==========================================================================*/

import { useState } from "react";
import { Alerta, Boton, Drawer, Input, Select } from "../../../components/ui";
import { UMBRAL_STOCK_BAJO } from "../../../constantes";
import { COLORES_SUGERIDOS, UNIDADES } from "./utilesInventario";

const CATEGORIA_NUEVA = "__NUEVA__";

export function DrawerProducto({
  abierto,
  producto = null,
  categorias = [],
  alCerrar,
  alGuardar,
}) {
  const editando = producto !== null;

  const [form, setForm] = useState(() => ({
    nombre: producto?.nombre ?? "",
    categoria: producto?.categoria ?? "",
    categoriaNueva: "",
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

  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [guardando, setGuardando] = useState(false);

  if (!abierto) return null;

  const categoriasDisponibles =
    producto?.categoria && !categorias.includes(producto.categoria)
      ? [...categorias, producto.categoria].sort((a, b) => a.localeCompare(b, "es"))
      : categorias;

  const esCategoriaNueva = form.categoria === CATEGORIA_NUEVA;

  const setCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!form.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    }

    if (!form.categoria) {
      nuevosErrores.categoria = "Elige una categoría.";
    } else if (esCategoriaNueva && !form.categoriaNueva.trim()) {
      nuevosErrores.categoriaNueva = "Escribe el nombre de la categoría nueva.";
    }

    const precioNum = Number(form.precio);
    if (!form.precio.trim()) {
      nuevosErrores.precio = "El precio es obligatorio.";
    } else if (!Number.isFinite(precioNum) || precioNum <= 0) {
      nuevosErrores.precio = "El precio debe ser un número mayor a 0.";
    }

    const stockNum = Number(form.stock);
    if (!form.stock.trim()) {
      nuevosErrores.stock = "Indica el stock inicial.";
    } else if (!Number.isInteger(stockNum) || stockNum < 0) {
      nuevosErrores.stock = "El stock debe ser un número entero (0 o más).";
    }

    const minimoNum = Number(form.stockMinimo);
    if (form.stockMinimo.trim() && (!Number.isInteger(minimoNum) || minimoNum < 0)) {
      nuevosErrores.stockMinimo = "El stock mínimo debe ser 0 o mayor.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const enviar = async (evento) => {
    evento?.preventDefault();
    setErrorEnvio(null);

    if (!validar()) return;

    setGuardando(true);
    try {
      const categoriaFinal = esCategoriaNueva
        ? form.categoriaNueva.trim()
        : form.categoria;

      const datos = {
        nombre: form.nombre.trim(),
        categoria: categoriaFinal,
        marca: form.marca.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
        precio: Number(Number(form.precio).toFixed(2)),
        stock: Number(form.stock),
        stockMinimo: Number(form.stockMinimo) || UMBRAL_STOCK_BAJO,
        unidad: form.unidad,
        color: form.color,
        activo: form.activo,
      };

      await alGuardar(datos);
      alCerrar();
    } catch (fallo) {
      setErrorEnvio(fallo.message || "Error al procesar el producto.");
      setGuardando(false);
    }
  };

  return (
    <Drawer
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={editando ? "Editar producto" : "Nuevo producto"}
      subtitulo={
        editando
          ? `Modificando datos y existencias de "${producto.nombre}"`
          : "Completa la ficha para registrar el producto en catálogo e inventario"
      }
      tamano="md"
      pie={
        <div style={{ display: "flex", gap: "var(--esp-2)", width: "100%", justifyContent: "flex-end" }}>
          <Boton variante="contorno" onClick={alCerrar} disabled={guardando} type="button">
            Cancelar
          </Boton>
          <Boton type="submit" form="form-drawer-producto" cargando={guardando}>
            {editando ? "Guardar cambios" : "Crear producto"}
          </Boton>
        </div>
      }
    >
      <form id="form-drawer-producto" className="gestion__formulario" onSubmit={enviar}>
        {errorEnvio && <Alerta variante="peligro">{errorEnvio}</Alerta>}

        {/* ── 1. Información general ─────────────────────────────────── */}
        <p className="gestion__leyenda">Información general</p>

        <Input
          etiqueta="Nombre del producto"
          value={form.nombre}
          onChange={(e) => setCampo("nombre", e.target.value)}
          placeholder="Ej. Arroz Extra Costeño 1 kg"
          error={errores.nombre}
          requerido
        />

        <div className="gestion__fila-campos gestion__fila-campos--2">
          <Select
            etiqueta="Categoría"
            value={form.categoria}
            onChange={(e) => setCampo("categoria", e.target.value)}
            error={errores.categoria}
            requerido
          >
            <option value="">Selecciona una categoría…</option>
            {categoriasDisponibles.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value={CATEGORIA_NUEVA}>+ Escribir una categoría nueva…</option>
          </Select>

          <Input
            etiqueta="Marca (opcional)"
            value={form.marca}
            onChange={(e) => setCampo("marca", e.target.value)}
            placeholder="Ej. Costeño, Gloria, Primor"
          />
        </div>

        {esCategoriaNueva && (
          <Input
            etiqueta="Nombre de la nueva categoría"
            value={form.categoriaNueva}
            onChange={(e) => setCampo("categoriaNueva", e.target.value)}
            placeholder="Ej. Congelados, Mascotas…"
            error={errores.categoriaNueva}
            requerido
            autoFocus
          />
        )}

        <div className="gestion__campo">
          <label className="gestion__campo-etiqueta" htmlFor="drawer-prod-desc">
            Descripción (opcional)
          </label>
          <textarea
            id="drawer-prod-desc"
            className="gestion__textarea"
            rows={2}
            value={form.descripcion}
            onChange={(e) => setCampo("descripcion", e.target.value)}
            placeholder="Detalles que ayuden al cliente en la tienda web…"
          />
        </div>

        {/* ── 2. Precio y Comercial ──────────────────────────────────── */}
        <p className="gestion__leyenda">Precio y presentación</p>

        <div className="gestion__fila-campos gestion__fila-campos--2">
          <Input
            etiqueta="Precio de venta"
            type="number"
            step="0.01"
            min="0.01"
            prefijo="S/"
            value={form.precio}
            onChange={(e) => setCampo("precio", e.target.value)}
            placeholder="0.00"
            error={errores.precio}
            requerido
          />

          <Select
            etiqueta="Unidad de medida"
            value={form.unidad}
            onChange={(e) => setCampo("unidad", e.target.value)}
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                por {u}
              </option>
            ))}
          </Select>
        </div>

        <div className="gestion__campo">
          <span className="gestion__campo-etiqueta">Color identificador</span>
          <div className="gestion__colores" role="radiogroup" aria-label="Color del producto">
            {COLORES_SUGERIDOS.map((colorHex) => (
              <button
                key={colorHex}
                type="button"
                className={
                  "gestion__color" +
                  (form.color === colorHex ? " gestion__color--elegido" : "")
                }
                style={{ backgroundColor: colorHex }}
                aria-label={`Color ${colorHex}`}
                aria-checked={form.color === colorHex}
                role="radio"
                onClick={() => setCampo("color", colorHex)}
              />
            ))}
          </div>
        </div>

        {/* ── 3. Inventario y Existencias ────────────────────────────── */}
        <p className="gestion__leyenda">Existencias e inventario</p>

        <div className="gestion__fila-campos gestion__fila-campos--2">
          <Input
            etiqueta={editando ? "Stock actual" : "Stock inicial"}
            type="number"
            step="1"
            min="0"
            value={form.stock}
            onChange={(e) => setCampo("stock", e.target.value)}
            error={errores.stock}
            ayuda={editando ? "Se calculará el ajuste sobre el stock real." : "Unidades al dar de alta."}
            requerido
          />

          <Input
            etiqueta="Stock mínimo de alerta"
            type="number"
            step="1"
            min="0"
            value={form.stockMinimo}
            onChange={(e) => setCampo("stockMinimo", e.target.value)}
            error={errores.stockMinimo}
            ayuda="Umbral para avisar reposición."
          />
        </div>

        {/* ── 4. Visibilidad ─────────────────────────────────────────── */}
        <p className="gestion__leyenda">Canales de venta</p>

        <label className="gestion__check">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setCampo("activo", e.target.checked)}
          />
          <div>
            <span className="gestion__check-texto">Visible en la tienda web</span>
            <span className="gestion__check-nota">
              Si lo desactivas, se oculta del catálogo online para clientes pero se conserva en caja y almacén.
            </span>
          </div>
        </label>
      </form>
    </Drawer>
  );
}

export default DrawerProducto;
