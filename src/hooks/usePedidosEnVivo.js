/**
 * ============================================================================
 * usePedidosEnVivo · Monitoreo y alertas en vivo de pedidos web
 * ----------------------------------------------------------------------------
 * Detecta la llegada de nuevos pedidos web de forma reactiva y ligera para el
 * personal del dashboard (ADMIN / CAJERO) mediante polling periódico (cada 3.5s)
 * contra la API del backend Spring Boot (/api/pedidos).
 * ==========================================================================*/

import { useState, useEffect, useRef, useCallback } from "react";
import { pedidosApi } from "../api/pedidosApi";
import { ESTADOS_PEDIDO } from "../constantes";
import { reproducirChimeNotificacion } from "../utils/sonido";

const CLAVE_SONIDO_PREF = "trigal:sonido_pedidos";

export function usePedidosEnVivo() {
  const [pedidosPendientesCount, setPedidosPendientesCount] = useState(0);
  const [ultimoPedidoNuevo, setUltimoPedidoNuevo] = useState(null);
  const [sonidoHabilitado, setSonidoHabilitado] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_SONIDO_PREF);
      return guardado !== null ? JSON.parse(guardado) : true;
    } catch {
      return true;
    }
  });

  const pedidosConocidosRef = useRef(new Set());
  const inicializadoRef = useRef(false);
  const sonidoHabilitadoRef = useRef(sonidoHabilitado);

  useEffect(() => {
    sonidoHabilitadoRef.current = sonidoHabilitado;
  }, [sonidoHabilitado]);

  const toggleSonido = useCallback(() => {
    setSonidoHabilitado((prev) => {
      const nuevo = !prev;
      try {
        localStorage.setItem(CLAVE_SONIDO_PREF, JSON.stringify(nuevo));
      } catch {
        // noop
      }
      return nuevo;
    });
  }, []);

  const cerrarToast = useCallback(() => {
    setUltimoPedidoNuevo(null);
  }, []);

  const verificarPedidos = useCallback(async () => {
    try {
      const todos = await pedidosApi.listar();
      if (!Array.isArray(todos)) return;

      const pendientes = todos.filter(
        (p) => p.estado === ESTADOS_PEDIDO.PENDIENTE
      ).length;
      setPedidosPendientesCount(pendientes);

      // Si es la carga inicial, solo registramos los pedidos existentes sin alertar
      if (!inicializadoRef.current) {
        todos.forEach((p) => pedidosConocidosRef.current.add(p.id));
        inicializadoRef.current = true;
        return;
      }

      // Buscar si hay pedidos nuevos no vistos previamente
      const pedidosNuevos = todos.filter(
        (p) => !pedidosConocidosRef.current.has(p.id)
      );

      if (pedidosNuevos.length > 0) {
        // Registrar los nuevos IDs
        pedidosNuevos.forEach((p) => pedidosConocidosRef.current.add(p.id));

        // Ordenar por fecha descendente y tomar el más reciente
        pedidosNuevos.sort(
          (a, b) =>
            new Date(b.fechaCreacion ?? b.fecha ?? 0).getTime() -
            new Date(a.fechaCreacion ?? a.fecha ?? 0).getTime()
        );
        const masReciente = pedidosNuevos[0];

        setUltimoPedidoNuevo({
          id: masReciente.id,
          clienteNombre: masReciente.clienteNombre,
          total: masReciente.total,
          fecha: masReciente.fechaCreacion ?? masReciente.fecha,
          itemsCount: masReciente.items?.length || 1,
        });

        if (sonidoHabilitadoRef.current) {
          reproducirChimeNotificacion();
        }
      }
    } catch (err) {
      console.warn("[usePedidosEnVivo] Error al verificar pedidos:", err);
    }
  }, []);

  useEffect(() => {
    let cancelado = false;

    // 1. Carga inicial asíncrona
    async function inicializar() {
      try {
        const todos = await pedidosApi.listar();
        if (cancelado || !Array.isArray(todos)) return;

        const pendientes = todos.filter(
          (p) => p.estado === ESTADOS_PEDIDO.PENDIENTE
        ).length;
        setPedidosPendientesCount(pendientes);

        todos.forEach((p) => pedidosConocidosRef.current.add(p.id));
        inicializadoRef.current = true;
      } catch (err) {
        console.warn("[usePedidosEnVivo] Error en carga inicial:", err);
      }
    }

    inicializar();

    // 2. Polling periódico cada 3.5 segundos contra el backend
    const intervalo = setInterval(() => {
      verificarPedidos();
    }, 3500);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [verificarPedidos]);

  return {
    pedidosPendientesCount,
    ultimoPedidoNuevo,
    cerrarToast,
    sonidoHabilitado,
    toggleSonido,
    refrescar: verificarPedidos,
  };
}

export default usePedidosEnVivo;
