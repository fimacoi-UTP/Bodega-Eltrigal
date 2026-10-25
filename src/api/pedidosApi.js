import { apiFetch } from "./apiClient";
import { TIPOS_ENTREGA } from "../constantes";

function tipoEntregaABackend(tipo) {
    return String(tipo).toUpperCase().includes("DELIVERY") ? "DELIVERY" : "RECOJO_TIENDA";
}
function tipoEntregaDesdeBackend(tipo) {
    return String(tipo).toUpperCase() === "DELIVERY" ? TIPOS_ENTREGA.DELIVERY : TIPOS_ENTREGA.RECOJO_TIENDA;
}

export function mapPedidoDesdeApi(api) {
    if (!api) return null;
    return {
        id: String(api.id),
        codigo: api.numeroPedido,
        idUsuario: api.idUsuario,
        clienteNombre: api.clienteNombre,
        clienteTelefono: api.clienteTelefono,
        clienteCorreo: api.clienteCorreo,
        estado: api.estado,
        tipoEntrega: tipoEntregaDesdeBackend(api.tipoEntrega),
        direccionEntrega: api.direccionEntrega,
        subtotal: api.subtotal,
        costoEnvio: api.costoEnvio,
        total: api.total,
        metodoPago: api.metodoPago,
        referenciaPago: api.referenciaPago,
        fechaCreacion: api.creadoEn,
        fechaActualizacion: api.actualizadoEn,
        imagenPrimerProducto: api.primerProductoImagen || api.imagen || api.items?.[0]?.productoImagen || api.items?.[0]?.imagen || null,
        items: Array.isArray(api.items)
            ? api.items.map((d) => ({
                productoId: String(d.productoId),
                nombre: d.productoNombre,
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
                precioOriginal: d.precioOriginal,
                subtotal: d.subtotal,
                imagen: d.productoImagen || d.imagen || d.urlImagen || null,
            }))
            : [],
        historialEstados: Array.isArray(api.historial)
            ? api.historial.map((h) => ({ estadoNuevo: h.estado, fecha: h.creadoEn }))
            : [],
    };
}

export const pedidosApi = {
    async crear({
        idUsuario,
        clienteNombre,
        clienteTelefono,
        clienteCorreo,
        tipoEntrega,
        direccionEntrega,
        metodoPago,
        referenciaPago,
        costoEnvio,
        items,
    }) {
        const body = {
            idUsuario: idUsuario != null ? Number(idUsuario) : null,
            clienteNombre: clienteNombre ?? null,
            clienteTelefono: clienteTelefono ?? null,
            clienteCorreo: clienteCorreo ?? null,
            tipoEntrega: tipoEntregaABackend(tipoEntrega),
            direccionEntrega: direccionEntrega ?? "",
            metodoPago: String(metodoPago).toUpperCase(),
            referenciaPago: referenciaPago ?? null,
            costoEnvio: Number(costoEnvio) || 0,
            items: (items || []).map((i) => ({ productoId: Number(i.productoId), cantidad: Number(i.cantidad) })),
        };
        return mapPedidoDesdeApi(await apiFetch("/api/pedidos", { method: "POST", body: JSON.stringify(body) }));
    },
    async listar() {
        const data = await apiFetch("/api/pedidos");
        return Array.isArray(data) ? data.map(mapPedidoDesdeApi) : [];
    },
    async obtenerPorId(id) {
        return mapPedidoDesdeApi(await apiFetch(`/api/pedidos/${id}`));
    },
    async cambiarEstado(id, nuevoEstado) {
        const data = await apiFetch(`/api/pedidos/${id}/estado?nuevoEstado=${encodeURIComponent(nuevoEstado)}`, { method: "PUT" });
        return mapPedidoDesdeApi(data);
    },
    async obtenerPorCodigo(numeroPedido) {
        const data = await apiFetch(`/api/pedidos/seguimiento/${encodeURIComponent(numeroPedido)}`);
        return mapPedidoDesdeApi(data);
    },
    async obtenerMios() {
        const data = await apiFetch("/api/pedidos/mios");
        return Array.isArray(data) ? data.map(mapPedidoDesdeApi) : [];
    },
};

export default pedidosApi;