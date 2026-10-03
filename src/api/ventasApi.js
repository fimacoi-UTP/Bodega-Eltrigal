import { apiFetch } from "./apiClient";

export function mapVentaDesdeApi(api) {
    if (!api) return null;
    return {
        id: String(api.id),
        numeroTicket: api.numeroTicket,
        fecha: api.creadoEn,
        idUsuario: api.idUsuario,
        subtotal: api.subtotal,
        igv: api.igv,
        total: api.total,
        metodoPago: api.metodoPago,
        montoRecibido: api.montoRecibido,
        vuelto: api.vuelto,
        referenciaPago: api.referenciaPago,
        anulada: api.anulada,
        motivoAnulacion: api.motivoAnulacion,
        items: Array.isArray(api.items)
            ? api.items.map((d) => ({
                productoId: String(d.productoId),
                nombre: d.productoNombre,
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
                precioOriginal: d.precioOriginal,
                subtotal: d.subtotal,
            }))
            : [],
    };
}

export const ventasApi = {
    async crear({ idUsuario, metodoPago, montoRecibido, referenciaPago, items }) {
        const body = {
            idUsuario: Number(idUsuario),
            metodoPago: String(metodoPago).toUpperCase(),
            montoRecibido: montoRecibido != null ? Number(montoRecibido) : null,
            referenciaPago: referenciaPago ?? null,
            items: (items || []).map((i) => ({
                productoId: Number(i.productoId),
                cantidad: Number(i.cantidad),
            })),
        };
        const data = await apiFetch("/api/ventas", { method: "POST", body: JSON.stringify(body) });
        return mapVentaDesdeApi(data);
    },
    async obtenerDeHoy() {
        const data = await apiFetch("/api/ventas/hoy");
        return Array.isArray(data) ? data.map(mapVentaDesdeApi) : [];
    },
    async obtenerPorId(id) {
        return mapVentaDesdeApi(await apiFetch(`/api/ventas/${id}`));
    },
    async anular(id, motivo) {
        const data = await apiFetch(
            `/api/ventas/${id}/anular?motivo=${encodeURIComponent(motivo || "")}`,
            { method: "PUT" }
        );
        return mapVentaDesdeApi(data);
    },
};

export default ventasApi;