/**
 * ============================================================================
 * AppRouter · El mapa completo de la aplicación
 * ----------------------------------------------------------------------------
 * Aquí se ve de un vistazo toda la plataforma y quién puede entrar a cada
 * parte. Está organizado en tres bloques:
 *
 *   1. LOGIN        → sin layout (pantalla centrada propia)
 *   2. TIENDA WEB   → LayoutTienda (Navbar + Footer) · público
 *   3. DASHBOARD    → LayoutDashboard (sidebar) · protegido por rol
 *
 * ── CÓMO FUNCIONAN LAS RUTAS ANIDADAS ──────────────────────────────────────
 * Cuando un <Route> tiene `element` pero no `path`, lo que hace es ENVOLVER a
 * sus rutas hijas. El layout se dibuja una vez y la página hija aparece en su
 * <Outlet />. Por eso el Navbar no parpadea al cambiar de página.
 *
 * ── CÓMO SE APLICA EL CONTROL DE ACCESO (PROXY) ────────────────────────────
 * <RutaProtegida> envuelve al layout del dashboard, así que protege TODAS sus
 * rutas hijas de una sola vez. Y adentro, dos rutas se protegen otra vez con
 * un rol más estricto:
 *
 *   /dashboard              ADMIN + CAJERO
 *   /dashboard/ventas       ADMIN + CAJERO
 *   /dashboard/inventario   ADMIN + CAJERO
 *   /dashboard/productos    SOLO ADMIN   ← doble protección
 *   /dashboard/promociones  SOLO ADMIN   ← doble protección
 *
 * 🧪 PARA PROBARLO: entren como cajero@trigal.pe y escriban a mano
 *    /dashboard/productos en la barra de direcciones. Van a ver la pantalla de
 *    "Sin acceso" aunque el enlace no aparezca en el menú lateral.
 * ==========================================================================*/

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Layouts
import LayoutTienda from "../components/layout/LayoutTienda";
import LayoutDashboard from "../components/layout/LayoutDashboard";

// Control de acceso (Proxy)
import RutaProtegida from "./RutaProtegida";

// Páginas de la tienda web
import HomePage from "../pages/tienda/HomePage";
import ProductoDetallePage from "../pages/tienda/ProductoDetallePage";
import CarritoPage from "../pages/tienda/CarritoPage";
import CheckoutPage from "../pages/tienda/CheckoutPage";
import LoginPage from "../pages/tienda/LoginPage";
import NosotrosPage from "../pages/tienda/NosotrosPage";
import UbicacionPage from "../pages/tienda/UbicacionPage";

// Páginas del dashboard
import ResumenPage from "../pages/dashboard/ResumenPage";
import InventarioPage from "../pages/dashboard/InventarioPage";
import ProductosPage from "../pages/dashboard/ProductosPage";
import PromocionesPage from "../pages/dashboard/PromocionesPage";
import VentasPage from "../pages/dashboard/VentasPage";

// Páginas del sistema
import NoEncontradaPage from "../pages/NoEncontradaPage";
import SinAccesoPage from "../pages/SinAccesoPage";

import { RUTAS } from "./rutas";
import { ROLES, ROLES_DASHBOARD } from "../constantes";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================================================================
         * 1. LOGIN · pantalla propia, sin navbar ni sidebar
         * ============================================================== */}
        <Route path={RUTAS.LOGIN} element={<LoginPage />} />
        <Route path={RUTAS.SIN_ACCESO} element={<SinAccesoPage />} />

        {/* ================================================================
         * 2. TIENDA WEB · pública, con Navbar + Footer
         * ============================================================== */}
        <Route element={<LayoutTienda />}>
          <Route index element={<HomePage />} />
          <Route path={RUTAS.PRODUCTO_DETALLE} element={<ProductoDetallePage />} />
          <Route path={RUTAS.CARRITO} element={<CarritoPage />} />
          <Route path={RUTAS.NOSOTROS} element={<NosotrosPage />} />
          <Route path={RUTAS.UBICACION} element={<UbicacionPage />} />

          {/* El checkout exige estar logueado (cualquier rol), pero no un rol
              concreto: un ADMIN también puede comprar como cliente.
              TODO rama checkout: si el grupo decide permitir la compra como
              invitado, basta con sacar el <RutaProtegida> de esta línea. */}
          <Route
            path={RUTAS.CHECKOUT}
            element={
              <RutaProtegida>
                <CheckoutPage />
              </RutaProtegida>
            }
          />

          {/* 404 dentro de la tienda: conserva el navbar y el footer. */}
          <Route path="*" element={<NoEncontradaPage />} />
        </Route>

        {/* ================================================================
         * 3. DASHBOARD · protegido, con sidebar propio
         * ---------------------------------------------------------------
         * <RutaProtegida> va por FUERA del layout: si el usuario no tiene
         * permiso, ni siquiera se llega a dibujar el sidebar.
         * ============================================================== */}
        <Route
          path={RUTAS.DASHBOARD}
          element={
            <RutaProtegida rol={ROLES_DASHBOARD}>
              <LayoutDashboard />
            </RutaProtegida>
          }
        >
          {/* ADMIN y CAJERO */}
          <Route index element={<ResumenPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="ventas" element={<VentasPage />} />

          {/* Solo ADMIN · segunda capa de Proxy */}
          <Route
            path="productos"
            element={
              <RutaProtegida rol={ROLES.ADMIN}>
                <ProductosPage />
              </RutaProtegida>
            }
          />
          <Route
            path="promociones"
            element={
              <RutaProtegida rol={ROLES.ADMIN}>
                <PromocionesPage />
              </RutaProtegida>
            }
          />

          {/* Cualquier /dashboard/loquesea que no exista vuelve al resumen. */}
          <Route path="*" element={<Navigate to={RUTAS.DASHBOARD} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
