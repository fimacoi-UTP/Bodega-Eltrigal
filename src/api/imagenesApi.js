import { apiFetch } from "./apiClient";

/**
 * ============================================================================
 * SERVICIO DE IMÁGENES API · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Subida de archivos al backend Spring Boot (POST /api/imagenes).
 * Devuelve la URL relativa guardada en el servidor (ej. /uploads/xxx.png).
 * ==========================================================================*/
export const imagenesApi = {
  async subir(archivo) {
    const form = new FormData();
    form.append("archivo", archivo);
    const data = await apiFetch("/api/imagenes", {
      method: "POST",
      body: form,
    });
    return data.url; // relativa
  },
};

export default imagenesApi;
