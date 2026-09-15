/**
 * ============================================================================
 * App · Raíz de la aplicación
 * ----------------------------------------------------------------------------
 * Aquí se montan los proveedores de estado global. EL ORDEN IMPORTA: cada
 * provider solo puede usar a los que están por encima de él.
 *
 *   <AuthProvider>            ← sesión y roles
 *     <InventarioProvider>    ← catálogo y stock (fuente única de verdad)
 *       <AppRouter />         ← todas las rutas
 *
 * Como el router está DENTRO de los dos providers, tanto la tienda web como el
 * dashboard consumen exactamente los mismos datos. Esa es, estructuralmente,
 * la razón por la que se cumple la regla de oro del proyecto: no existen dos
 * copias del inventario que después haya que sincronizar.
 *
 * ── 📌 PARA LOS INTEGRANTES ────────────────────────────────────────────────
 * Si tu módulo necesita su propio contexto (el caso típico es el CARRITO),
 * móntalo aquí adentro, respetando el orden de dependencias:
 *
 *   <AuthProvider>
 *     <InventarioProvider>
 *       <CarritoProvider>        ← el carrito consulta stock y precios
 *         <AppRouter />
 *       </CarritoProvider>
 *     </InventarioProvider>
 *   </AuthProvider>
 *
 * Este archivo lo tocan varios módulos, así que es el candidato número uno a
 * dar conflicto en Git. Al hacer merge, revísenlo con calma.
 * ==========================================================================*/

import { AuthProvider } from "./context/AuthProvider";
import { InventarioProvider } from "./context/InventarioProvider";
import AppRouter from "./routes/AppRouter";

export function App() {
  return (
    <AuthProvider>
      <InventarioProvider>
        <AppRouter />
      </InventarioProvider>
    </AuthProvider>
  );
}

export default App;
