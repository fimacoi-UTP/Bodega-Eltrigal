/**
 * ============================================================================
 * EtiquetaProducto · Etiqueta de góndola / precio & Barcode Compacto
 * ============================================================================
 * Separación clara de roles (Premium 2.0):
 *
 * 1) <EtiquetaProducto producto={p} />
 *    Etiqueta COMPLETA imprimible para el modal:
 *    · Marco BODEGA EL TRIGAL + código corto P0001
 *    · Nombre del producto en mayúsculas (bold)
 *    · Precio grande en verde esmeralda cálido
 *    · Unidad de medida
 *    · Código de barras EAN-13 real con JsBarcode
 *    · Pie: GÓNDOLA / MOSTRADOR · PIURA, PERÚ (Piura, sede del negocio)
 *
 * 2) <BarcodeCompacto producto={p} />
 *    Barcode COMPACTO para la ficha del panel derecho:
 *    · Solo barras nítidas + número EAN-13 debajo (sin marcos duplicados)
 * ==========================================================================*/

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { formatearSoles } from "../../../utils/formato";
import { codigoCorto, codigoEan13 } from "./utilesInventario";
import "./EtiquetaProducto.css";

/**
 * Barcode compacto para la ficha del Panel Combo.
 * Renderiza exclusivamente las barras y el número EAN-13 inferior.
 */
export function BarcodeCompacto({ producto, className = "" }) {
  const barcodeRef = useRef(null);
  const ean = codigoEan13(producto);

  useEffect(() => {
    if (!barcodeRef.current || !ean) return;

    const opciones = {
      lineColor: "#18181b",
      width: 1.6,
      height: 46,
      displayValue: true,
      fontSize: 12,
      font: "monospace",
      fontOptions: "bold",
      textMargin: 3,
      margin: 4,
      background: "#ffffff",
    };

    try {
      JsBarcode(barcodeRef.current, ean, {
        format: "EAN13",
        ...opciones,
      });
    } catch {
      try {
        JsBarcode(barcodeRef.current, ean, {
          format: "CODE128",
          ...opciones,
        });
      } catch (err) {
        console.warn("No se pudo renderizar el código de barras compacto:", err);
      }
    }
  }, [ean]);

  return (
    <div className={`barcode-compacto ${className}`.trim()}>
      <svg ref={barcodeRef} className="barcode-compacto__svg" />
    </div>
  );
}

/**
 * Etiqueta de góndola completa para el modal de vista previa e impresión.
 */
export function EtiquetaProducto({ producto, className = "", variante = "gondola" }) {
  const barcodeRef = useRef(null);

  const ean = codigoEan13(producto);
  const idCorto = codigoCorto(producto?.id);
  const unidad = producto?.unidad || producto?.unidadMedida || "Unidad";
  const nombre = (producto?.nombre || "PRODUCTO").toUpperCase();
  const precio = formatearSoles(producto?.precio ?? 0);

  useEffect(() => {
    if (!barcodeRef.current || !ean) return;

    const opcionesBase = {
      lineColor: "#000000",
      width: 1.8,
      height: 52,
      displayValue: true,
      fontSize: 13,
      font: "monospace",
      fontOptions: "bold",
      textMargin: 3,
      margin: 4,
      background: "#ffffff",
    };

    try {
      JsBarcode(barcodeRef.current, ean, {
        format: "EAN13",
        ...opcionesBase,
      });
    } catch {
      try {
        JsBarcode(barcodeRef.current, ean, {
          format: "CODE128",
          ...opcionesBase,
        });
      } catch (err) {
        console.warn("No se pudo renderizar el código de barras:", err);
      }
    }
  }, [ean]);

  return (
    <div className={`etiqueta-gondola etiqueta-gondola--${variante} ${className}`.trim()}>
      {/* Cabecera de la etiqueta */}
      <div className="etiqueta-gondola__top">
        <span className="etiqueta-gondola__marca-tienda">BODEGA EL TRIGAL</span>
        <span className="etiqueta-gondola__codigo-corto">{idCorto}</span>
      </div>

      {/* Nombre en mayúsculas (bold) */}
      <h3 className="etiqueta-gondola__nombre" title={producto?.nombre}>
        {nombre}
      </h3>

      {/* Precio verde grande y unidad */}
      <div className="etiqueta-gondola__cuerpo-precio">
        <div className="etiqueta-gondola__precio-bloque">
          <span className="etiqueta-gondola__precio-monto">{precio}</span>
        </div>
        <div className="etiqueta-gondola__unidad-bloque">
          <span className="etiqueta-gondola__unidad-etiqueta">Unidad:</span>
          <span className="etiqueta-gondola__unidad-valor">{unidad}</span>
        </div>
      </div>

      {/* Código de barras real */}
      <div className="etiqueta-gondola__barcode-wrap">
        <svg ref={barcodeRef} className="etiqueta-gondola__barcode-svg" />
      </div>

      {/* Pie de góndola: sede oficial Piura */}
      <div className="etiqueta-gondola__pie">
        <span>GÓNDOLA / MOSTRADOR</span>
        <span>PIURA, PERÚ</span>
      </div>
    </div>
  );
}

export default EtiquetaProducto;
