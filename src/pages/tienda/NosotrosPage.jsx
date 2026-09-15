/**
 * ============================================================================
 * 🚧 CASCARÓN · Nosotros
 * ============================================================================
 * Página informativa sobre la bodega. Es la más sencilla del proyecto, pero no
 * por eso menos importante: es la que da confianza al cliente que compra por
 * primera vez.
 *
 * Los datos de contacto y horario ya están centralizados en la constante
 * BODEGA (src/constantes.js). Úsenla en vez de escribirlos a mano, así si
 * cambia un teléfono se cambia en un solo lugar.
 * ==========================================================================*/

import CascaronModulo from "../../components/comunes/CascaronModulo";

export function NosotrosPage() {
  return (
    <div className="contenedor">
      <CascaronModulo
        nombre="Nosotros"
        descripcion="La historia de la Bodega El Trigal: quiénes somos, desde cuándo atendemos al barrio y por qué los vecinos nos eligen."
        archivo="src/pages/tienda/NosotrosPage.jsx"
        tareas={[
          "Sección de portada con una foto o ilustración de la bodega.",
          "Historia del negocio: cuándo abrió, quién la atiende, qué la hace del barrio.",
          "Valores o promesas: precios justos, productos frescos, atención cercana.",
          "Datos reales de contacto tomados de la constante BODEGA.",
          "Enlace a la página de Ubicación para cerrar el recorrido.",
          "Reemplazar los datos de ejemplo de BODEGA por los reales de la bodega.",
        ]}
        herramientas={[
          "BODEGA de src/constantes.js (nombre, dirección, horario, teléfono)",
          "<Card>, <Boton>, <Badge>",
          "Clases .contenedor, .seccion y .rejilla de styles/base.css",
        ]}
      />
    </div>
  );
}

export default NosotrosPage;
