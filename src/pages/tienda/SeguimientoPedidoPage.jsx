import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { pedidosApi } from "../../api/pedidosApi";
import { SeguimientoPedido } from "./checkout/componentes/SeguimientoPedido";
import { Cargando, Alerta } from "../../components/ui";
import { RUTAS } from "../../routes/rutas";
import { ESTADOS_PEDIDO } from "../../constantes";

/**
 * ============================================================================
 * SEGUIMIENTO DE PEDIDO POR URL · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Página pública para rastrear el pedido mediante /seguimiento/:codigo.
 * Consulta la API y hace polling cada 8 segundos mientras el estado no sea
 * final (ENTREGADO o CANCELADO).
 * ==========================================================================*/

export function SeguimientoPedidoPage() {
  const { codigo } = useParams();
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const intervaloRef = useRef(null);

  useEffect(() => {
    let cancelado = false;

    const detenerPolling = () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
    };

    const traerPedido = async (esPrimerCarga = false) => {
      try {
        const data = await pedidosApi.obtenerPorCodigo(codigo);
        if (cancelado) return;
        setPedido(data);
        setError(null);

        if (
          data?.estado === ESTADOS_PEDIDO.ENTREGADO ||
          data?.estado === ESTADOS_PEDIDO.CANCELADO
        ) {
          detenerPolling();
        }
      } catch (err) {
        if (cancelado) return;
        const es404 =
          err.status === 404 ||
          err.message?.includes("404") ||
          err.message?.toLowerCase().includes("no encontrado");
        const mensaje = es404
          ? "No encontramos ese pedido"
          : (err.message || "Error al cargar el seguimiento del pedido");
        setError(mensaje);
        detenerPolling();
      } finally {
        if (esPrimerCarga && !cancelado) {
          setCargando(false);
        }
      }
    };

    traerPedido(true);

    intervaloRef.current = setInterval(() => {
      traerPedido(false);
    }, 8000);

    return () => {
      cancelado = true;
      detenerPolling();
    };
  }, [codigo]);

  return (
    <div className="contenedor contenedor--angosto seccion">
      <div style={{ marginBottom: "var(--esp-4)" }}>
        <Link
          to={RUTAS.INICIO}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--esp-1)",
            color: "var(--color-primario, var(--color-marca, #c2410c))",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          ← Volver a la tienda
        </Link>
      </div>

      <header style={{ marginBottom: "var(--esp-6)" }}>
        <h1
          style={{
            fontSize: "var(--texto-2xl)",
            fontWeight: 700,
            color: "var(--color-texto)",
            margin: 0,
          }}
        >
          Seguimiento de tu pedido
        </h1>
        {codigo && (
          <p
            style={{
              margin: "var(--esp-1) 0 0",
              color: "var(--color-texto-suave)",
              fontSize: "var(--texto-sm)",
            }}
          >
            Código de seguimiento: <strong>{codigo}</strong>
          </p>
        )}
      </header>

      {cargando ? (
        <Cargando texto="Buscando pedido..." />
      ) : error ? (
        <Alerta variante="peligro" titulo="Pedido no encontrado">
          {error}
        </Alerta>
      ) : (
        <SeguimientoPedido
          pedido={pedido}
          mostrarHero={false}
          mostrarOferta={false}
          mostrarNuevaCompra={false}
        />
      )}
    </div>
  );
}

export default SeguimientoPedidoPage;
