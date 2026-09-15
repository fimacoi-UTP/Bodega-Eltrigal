/**
 * ============================================================================
 * 🚧 CASCARÓN · Ubicación
 * ============================================================================
 * Dónde queda la bodega y cómo llegar. Clave para la opción de "recojo en
 * tienda" del checkout.
 *
 * Para el mapa, la forma más simple y sin dependencias es un <iframe> de
 * Google Maps. Las coordenadas están en BODEGA.coordenadas (src/constantes.js).
 * ==========================================================================*/

import CascaronModulo from "../../components/comunes/CascaronModulo";

export function UbicacionPage() {
  return (
    <div className="contenedor">
      <CascaronModulo
        nombre="Ubicación y contacto"
        descripcion="Dónde queda la bodega, cómo llegar, en qué horario atendemos y por qué canales se puede pedir."
        archivo="src/pages/tienda/UbicacionPage.jsx"
        tareas={[
          "Mapa incrustado con un <iframe> de Google Maps usando BODEGA.coordenadas.",
          "Tarjeta con la dirección exacta y una referencia del barrio.",
          "Horario de atención de lunes a domingo.",
          "Botones de contacto directo: llamar y escribir por WhatsApp.",
          "Zona de cobertura del delivery y su costo.",
          "Verificar que el mapa se vea bien en celular (ancho 100%, alto fijo).",
        ]}
        herramientas={[
          "BODEGA de src/constantes.js (dirección, coordenadas, horario, whatsapp)",
          "<Card>, <Boton>, <Badge>",
        ]}
      />
    </div>
  );
}

export default UbicacionPage;
