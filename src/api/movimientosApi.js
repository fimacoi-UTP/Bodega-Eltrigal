import { apiFetch } from "./apiClient";
import { obtenerUsuarioSesion } from "./authApi";

export const movimientosApi = {
  async registrar({ productoId, delta, motivo = "" }) {
    const usuario = obtenerUsuarioSesion();
    const idUsuario = Number(usuario?.id);
    const esIngreso = delta > 0;
    const body = {
      productoId: Number(productoId),
      tipo: esIngreso ? "AJUSTE_POS" : "MERMA", // backend: AJUSTE_POS suma, MERMA resta
      cantidad: Math.abs(delta),
      motivo: motivo || "",
      idUsuario,
    };
    return apiFetch("/api/movimientos", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

export default movimientosApi;
