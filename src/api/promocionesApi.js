import { apiFetch } from "./apiClient";

export function mapPromocionDesdeApi(api) {
  if (!api) return null;
  return {
    id: String(api.id),
    nombre: api.nombre,
    descripcion: api.descripcion,
    tipo: api.tipo,
    valor: api.valor != null ? Number(api.valor) : null,
    aplicaTodos: Boolean(api.aplicaTodos),
    prioridad: api.prioridad != null ? Number(api.prioridad) : 0,
    esAcumulable: api.esAcumulable !== false,
    desde: api.fechaInicio, // renombra fechaInicio -> desde
    hasta: api.fechaFin, // renombra fechaFin -> hasta
    activa: api.activo !== false, // renombra activo -> activa
    productoIds: (api.productos || []).map((p) => String(p.id)),
    categoriaIds: (api.categorias || []).map((c) => Number(c.id)),
    productos: api.productos || [],
    categorias: api.categorias || [], // para mostrar
  };
}

export function mapPromocionHaciaApi(datos) {
  return {
    nombre: datos.nombre,
    descripcion: datos.descripcion ?? null,
    tipo: datos.tipo,
    valor: datos.valor != null ? Number(datos.valor) : null,
    aplicaTodos: Boolean(datos.aplicaTodos),
    prioridad: Number(datos.prioridad) || 0,
    esAcumulable: datos.esAcumulable !== false,
    fechaInicio: datos.desde || null, // YYYY-MM-DD, SIN toISOString
    fechaFin: datos.hasta || null, // YYYY-MM-DD, SIN toISOString
    activo: datos.activa !== false,
    productoIds: (datos.productoIds || []).map(Number),
    categoriaIds: (datos.categoriaIds || []).map(Number),
  };
}

export const promocionesApi = {
  async listar() {
    const data = await apiFetch("/api/promociones");
    return Array.isArray(data) ? data.map(mapPromocionDesdeApi) : [];
  },

  async obtenerVigentes() {
    const data = await apiFetch("/api/promociones/vigentes");
    return Array.isArray(data) ? data.map(mapPromocionDesdeApi) : [];
  },

  async crear(datos) {
    const body = mapPromocionHaciaApi(datos);
    const data = await apiFetch("/api/promociones", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return mapPromocionDesdeApi(data);
  },

  async actualizar(id, datos) {
    const body = mapPromocionHaciaApi(datos);
    const data = await apiFetch(`/api/promociones/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return mapPromocionDesdeApi(data);
  },

  async eliminar(id) {
    await apiFetch(`/api/promociones/${id}`, {
      method: "DELETE",
    });
    return true;
  },
};

export default promocionesApi;
