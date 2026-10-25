/**
 * ============================================================================
 * ModalEtiquetaGondola · Vista previa e impresión de etiqueta de góndola
 * ============================================================================
 * Abre al presionar el botón ▌▌▌ de la tabla o desde el Panel Combo.
 *
 * Método de impresión (Mismo patrón nativo probado del ticket POS):
 *   - Dispara window.print() directamente sobre el DOM renderizado.
 *   - El código de barras es un <svg> nativo generado por JsBarcode (EAN-13),
 *     garantizando máxima nitidez vectorial en la impresión sin necesidad de canvas.
 *   - @media print en ModalEtiquetaGondola.css oculta el resto de la interfaz
 *     y hace visible exclusivamente la etiqueta (.etiqueta-imprimible) en 1 sola hoja.
 * ==========================================================================*/

import { Boton, Modal } from "../../../components/ui";
import { EtiquetaProducto } from "./EtiquetaProducto";
import "./ModalEtiquetaGondola.css";

export function ModalEtiquetaGondola({ abierto, alCerrar, producto }) {
  const handleImprimir = () => {
    window.print();
  };

  if (!producto || !abierto) return null;

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Etiqueta de góndola / precio"
      tamano="sm"
      className="modal-etiqueta"
      pie={
        <div className="modal-etiqueta__acciones no-print">
          <Boton variante="contorno" onClick={alCerrar}>
            Cerrar
          </Boton>
          <Boton variante="primario" onClick={handleImprimir}>
            <span aria-hidden="true" style={{ marginRight: 6 }}>🖨️</span>
            Imprimir etiqueta
          </Boton>
        </div>
      }
    >
      <div className="modal-etiqueta__cuerpo">
        <p className="modal-etiqueta__instruccion no-print">
          Vista previa de la etiqueta para góndola o mostrador. Al presionar imprimir,
          se enviará exclusivamente este ticket a la impresora.
        </p>

        {/* Contenedor de etiqueta para pantalla e impresión */}
        <div className="etiqueta-imprimible modal-etiqueta__previa">
          <EtiquetaProducto producto={producto} variante="gondola" />
        </div>
      </div>
    </Modal>
  );
}

export default ModalEtiquetaGondola;
