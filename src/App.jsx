/**
 * ============================================================================
 * App · Raíz de la aplicación
 * ----------------------------------------------------------------------------
 * Aquí se montan los proveedores de estado global. EL ORDEN IMPORTA: cada
 * provider solo puede usar a los que están por encima de él.
 *
 *   <AuthProvider>            ← sesión y roles
 *     <InventarioProvider>    ← catálogo y stock (fuente única de verdad)
 *       <CarritoProvider>     ← carrito de compras
 *         <AppRouter />       ← todas las rutas
 *
 * Como el router está DENTRO de los providers, tanto la tienda web como el
 * dashboard consumen exactamente los mismos datos.
 * ==========================================================================*/

import { AuthProvider } from "./context/AuthProvider";
import { InventarioProvider } from "./context/InventarioProvider";
import { CarritoProvider } from "./context/CarritoProvider";
import AppRouter from "./routes/AppRouter";

export function App() {
  return (
    <AuthProvider>
      <InventarioProvider>
        <CarritoProvider>
          <AppRouter />
        </CarritoProvider>
      </InventarioProvider>
    </AuthProvider>
  );
}

export default App;