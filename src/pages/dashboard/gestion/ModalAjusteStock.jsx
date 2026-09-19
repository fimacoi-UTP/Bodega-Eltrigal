/**
 * ============================================================================
 * ModalAjusteStock · Registrar una entrada o una salida de mercadería
 * ----------------------------------------------------------------------------
 * Este modal NO escribe el stock final: registra un MOVIMIENTO (+ o −) y deja
 * que `ajustarStock(id, delta)` calcule el resultado sobre el valor que hay
 * guardado en ese momento.
 *
 * ¿Por qué importa la diferencia? Porque el stock es la fuente de verdad que
 * comparten la tienda web y la caja. Si mientras el encargado tiene este modal
 * abierto un cliente compra 3 unidades por la web, guardar "el stock es 40"
 * borraría esa venta. Guardar "entraron 12" respeta lo que haya pasado.
 *
 * Se monta con `key={producto.id}` desde InventarioPage, así que cada vez que
 * se abre para otro producto React lo vuelve a crear con el formulario limpio.
 * Por eso no hace falta ningún useEffect que resetee el estado.
 * ==========================================================================*/

import { useState } from "react";
import { Alerta, Badge, Boton, Input, Modal } from "../../../components/ui";
import { estadoStock, pluralizar, umbralDe } from "./utilesInventario";

/** Los dos tipos de movimiento que se registran desde inventario. */
const MOVIMIENTOS = {
  INGRESO: {
    clave: "INGRESO",
    etiqueta: "Ingreso",
    nota: "Llegó mercadería",
    signo: 1,
  },
  MERMA: {
    clave: "MERMA",
    etiqueta: "Salida / merma",
    nota: "Roto, vencido o perdido",
    signo: -1,
  },
};

export function ModalAjusteStock({ producto, alCerrar, alConfirmar }) {
  const [movimiento, setMovimiento] = useState(MOVIMIENTOS.INGRESO.clave);
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [errorCampo, setErrorCampo] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const signo = MOVIMIENTOS[movimiento].signo;
  const stockActual = Number(producto.stock) || 0;

  // Cantidad tecleada, ya convertida a número (NaN si aún está vacío).
  const unidades = Number(cantidad);
  const cantidadValida = Number.isInteger(unidades) && unidades > 0;

  // Cuánto quedaría si se confirma. Solo se muestra si la cantidad tiene sentido.
  const stockResultante = cantidadValida ? stockActual + signo * unidades : null;

  const estado = estadoStock(producto);

  /** Valida y devuelve el mensaje de error, o null si todo está bien. */
  const validar = () => {
    if (!cantidad.trim()) return "Escribe cuántas unidades.";
    if (!Number.isFinite(unidades)) return "Escribe un número válido.";
    if (!Number.isInteger(unidades)) return "Las unidades deben ser un número entero.";
    if (unidades <= 0) return "La cantidad debe ser mayor a 0.";

    // No se puede sacar más de lo que hay: el stock nunca queda en negativo.
    if (signo < 0 && unidades > stockActual) {
      return `Solo hay ${stockActual} unidades en stock.`;
    }
    return null;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setErrorEnvio(null);

    const problema = validar();
    if (problema) {
      setErrorCampo(problema);
      return;
    }
    setErrorCampo(null);

    setGuardando(true);
    try {
      // El delta lleva el signo: positivo entra, negativo sale.
      await alConfirmar(signo * unidades, motivo.trim());
      // Si salió bien, InventarioPage cierra el modal y muestra el aviso.
    } catch (fallo) {
      setErrorEnvio(fallo.message);
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      alCerrar={alCerrar}
      titulo="Ajustar stock"
      tamano="sm"
      pie={
        <>
          <Boton variante="contorno" onClick={alCerrar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-ajuste-stock" cargando={guardando}>
            Registrar movimiento
          </Boton>
        </>
      }
    >
      <form id="form-ajuste-stock" className="gestion__formulario" onSubmit={enviar}>
        {errorEnvio && <Alerta variante="peligro">{errorEnvio}</Alerta>}

        {/* ---------------------------------------------- Producto ------ */}
        <div className="gestion__ajuste-producto">
          <span
            className="gestion__swatch"
            style={{ backgroundColor: producto.color || "var(--neutro-300)" }}
            aria-hidden="true"
          />
          <div className="gestion__producto-datos">
            <span className="gestion__producto-nombre">{producto.nombre}</span>
            <span className="gestion__producto-meta">
              Stock actual: {stockActual} {pluralizar(stockActual, producto.unidad ?? "unidad")}
              {" · "}mínimo {umbralDe(producto)}
            </span>
          </div>
          <Badge variante={estado.variante} tamano="sm">
            {estado.etiqueta}
          </Badge>
        </div>

        {/* ------------------------------------- Tipo de movimiento ----- */}
        <div className="gestion__campo">
          <span className="gestion__campo-etiqueta">Tipo de movimiento</span>
          <div className="gestion__segmentos" role="group" aria-label="Tipo de movimiento">
            {Object.values(MOVIMIENTOS).map((opcion) => (
              <button
                key={opcion.clave}
                type="button"
                className={
                  "gestion__segmento" +
                  (movimiento === opcion.clave ? " gestion__segmento--activo" : "")
                }
                aria-pressed={movimiento === opcion.clave}
                onClick={() => {
                  setMovimiento(opcion.clave);
                  setErrorCampo(null);
                }}
              >
                {opcion.etiqueta}
                <span className="gestion__segmento-nota">{opcion.nota}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------ Cantidad ---- */}
        <Input
          etiqueta="Cantidad"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          placeholder="Ej. 12"
          value={cantidad}
          onChange={(evento) => {
            setCantidad(evento.target.value);
            setErrorCampo(null);
          }}
          error={errorCampo}
          requerido
          autoFocus
        />

        {/* ------------------------------------------------ Vista previa */}
        {stockResultante !== null && (
          <div className="gestion__previa">
            <div className="gestion__previa-bloque">
              <span className="gestion__previa-etiqueta">Ahora</span>
              <span className="gestion__previa-valor">{stockActual}</span>
            </div>
            <span className="gestion__previa-flecha" aria-hidden="true">
              →
            </span>
            <div className="gestion__previa-bloque">
              <span className="gestion__previa-etiqueta">Quedará</span>
              <span
                className={
                  "gestion__previa-valor " +
                  (signo > 0 ? "gestion__previa-valor--sube" : "gestion__previa-valor--baja")
                }
              >
                {stockResultante}
              </span>
            </div>
          </div>
        )}

        {/* --------------------------------------------------- Motivo --- */}
        <Input
          etiqueta="Motivo (opcional)"
          type="text"
          placeholder={
            signo > 0 ? "Ej. compra al distribuidor" : "Ej. producto vencido"
          }
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          ayuda="Queda como referencia para el equipo."
          maxLength={80}
        />
      </form>
    </Modal>
  );
}

export default ModalAjusteStock;
