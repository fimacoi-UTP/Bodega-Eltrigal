/**
 * ============================================================================
 * usePedidosEnVivo · Monitoreo y alertas en vivo de pedidos web
 * ----------------------------------------------------------------------------
 * Detecta la llegada de nuevos pedidos web de forma reactiva y ligera para el
 * personal del dashboard (ADMIN / CAJERO).
 *
 * Estrategia de detección híbrida y confiable:
 *  1. CustomEvent ('trigal:pedido-nuevo'): Detección a 0ms en la misma pestaña.
 *  2. Evento 'storage' en window: Detección instantánea entre diferentes pestañas.
 *  3. Polling periódico ligero (cada 3.5s): Mecanismo de seguridad en caso de
 *     operaciones asíncronas no interceptadas.
 * ==========================================================================*/

import { useState, useEffect, useRef, useCallback } from "react";
import { pedidoRepository } from "../repositories";
import { CLAVES } from "../repositories/claves";
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
      const todos = await pedidoRepository.obtenerTodos();
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
          (a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime()
        );
        const masReciente = pedidosNuevos[0];

        setUltimoPedidoNuevo({
          id: masReciente.id,
          clienteNombre: masReciente.clienteNombre,
          total: masReciente.total,
          fecha: masReciente.fecha,
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
        const todos = await pedidoRepository.obtenerTodos();
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

    // 2. Escuchar evento de nuevo pedido en la misma ventana
    const handlePedidoNuevo = (e) => {
      const nuevo = e.detail;
      if (nuevo && !pedidosConocidosRef.current.has(nuevo.id)) {
        pedidosConocidosRef.current.add(nuevo.id);
        setUltimoPedidoNuevo({
          id: nuevo.id,
          clienteNombre: nuevo.clienteNombre,
          total: nuevo.total,
          fecha: nuevo.fecha,
          itemsCount: nuevo.items?.length || 1,
        });

        if (sonidoHabilitadoRef.current) {
          reproducirChimeNotificacion();
        }
      }
      verificarPedidos();
    };

    // 3. Escuchar evento de cambio de estado / actualización en la misma ventana
    const handlePedidoActualizado = () => {
      verificarPedidos();
    };

    // 4. Escuchar evento storage (entre pestañas)
    const handleStorage = (e) => {
      if (e.key === CLAVES.PEDIDOS || !e.key) {
        verificarPedidos();
      }
    };

    window.addEventListener("trigal:pedido-nuevo", handlePedidoNuevo);
    window.addEventListener("trigal:pedido-actualizado", handlePedidoActualizado);
    window.addEventListener("storage", handleStorage);

    // 5. Polling de respaldo cada 3.5 segundos
    const intervalo = setInterval(() => {
      verificarPedidos();
    }, 3500);

    return () => {
      cancelado = true;
      window.removeEventListener("trigal:pedido-nuevo", handlePedidoNuevo);
      window.removeEventListener("trigal:pedido-actualizado", handlePedidoActualizado);
      window.removeEventListener("storage", handleStorage);
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
