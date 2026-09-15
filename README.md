# 🌾 Bodega El Trigal

Plataforma web para la **Bodega El Trigal**, una bodega de barrio de Piura, Perú.

Este repositorio (rama `main`) contiene la **infraestructura base** del proyecto: la capa de datos, la autenticación, el sistema de diseño, los layouts y el enrutado. **Las vistas de cada módulo están como cascarones**, listas para que cada integrante construya la suya en su propia rama.

---

## 📑 Índice

1. [Qué hay hecho y qué falta](#-qué-hay-hecho-y-qué-falta)
2. [Cómo correr el proyecto](#-cómo-correr-el-proyecto)
3. [Credenciales de prueba](#-credenciales-de-prueba)
4. [Estructura de carpetas](#-estructura-de-carpetas)
5. [La arquitectura en 2 minutos](#-la-arquitectura-en-2-minutos)
6. [Cómo consumir la capa Repository](#-cómo-consumir-la-capa-repository)
7. [Cómo usar los hooks](#-cómo-usar-los-hooks)
8. [Sistema de diseño](#-sistema-de-diseño)
9. [Patrones de diseño aplicados](#-patrones-de-diseño-aplicados)
10. [Para los integrantes: cómo trabajar tu módulo](#-para-los-integrantes-cómo-trabajar-tu-módulo)
11. [Migración futura a Spring Boot](#-migración-futura-a-spring-boot)

---

## ✅ Qué hay hecho y qué falta

### Ya está listo y funcionando (no hay que rehacerlo)

| Pieza | Estado |
|---|---|
| Capa Repository con persistencia en `localStorage` | ✅ Funcional |
| Datos semilla (20 productos, 4 usuarios) | ✅ Funcional |
| Autenticación simulada con 3 roles y redirección | ✅ Funcional |
| Control de acceso por rol (`<RutaProtegida>`) | ✅ Funcional |
| Contextos y hooks (`useAuth`, `useInventario`) | ✅ Funcional |
| Sistema de diseño con tokens CSS | ✅ Funcional |
| Componentes UI base (Boton, Card, Input, Modal…) | ✅ Funcional |
| Layout de tienda (navbar + footer, menú móvil) | ✅ Funcional |
| Layout de dashboard (sidebar, menú móvil) | ✅ Funcional |
| Todas las rutas y el 404 | ✅ Funcional |
| Página de login | ✅ Funcional |

### Cascarones por construir (uno por integrante)

| Módulo | Ruta | Archivo |
|---|---|---|
| Catálogo de productos | `/` | `src/pages/tienda/HomePage.jsx` |
| Detalle de producto | `/producto/:id` | `src/pages/tienda/ProductoDetallePage.jsx` |
| Carrito | `/carrito` | `src/pages/tienda/CarritoPage.jsx` |
| Checkout (pago y entrega) | `/checkout` | `src/pages/tienda/CheckoutPage.jsx` |
| Nosotros | `/nosotros` | `src/pages/tienda/NosotrosPage.jsx` |
| Ubicación | `/ubicacion` | `src/pages/tienda/UbicacionPage.jsx` |
| Resumen y estadísticas | `/dashboard` | `src/pages/dashboard/ResumenPage.jsx` |
| Inventario | `/dashboard/inventario` | `src/pages/dashboard/InventarioPage.jsx` |
| Gestión de productos | `/dashboard/productos` | `src/pages/dashboard/ProductosPage.jsx` |
| Promociones | `/dashboard/promociones` | `src/pages/dashboard/PromocionesPage.jsx` |
| Ventas en tienda | `/dashboard/ventas` | `src/pages/dashboard/VentasPage.jsx` |

> Cada cascarón, al abrirlo en el navegador, te muestra **qué construir** y **qué infraestructura ya tienes disponible**. Ábrelo antes de empezar.

---

## 🚀 Cómo correr el proyecto

Necesitas **Node.js 20 o superior**.

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Levantar el servidor de desarrollo
npm run dev
```

Abre **http://localhost:5173**.

Otros comandos:

```bash
npm run build     # compila para producción
npm run preview   # sirve la versión compilada
npm run lint      # revisa el código con ESLint
```

### Resetear los datos

Los datos viven en el `localStorage` de tu navegador, así que **persisten entre sesiones**. Si de tanto probar te queda data rara, abre la consola del navegador (F12) y escribe:

```js
elTrigal.reiniciarDatos()
```

Luego recarga con F5. Vuelve todo a los datos semilla originales.

---

## 🔑 Credenciales de prueba

Hay **un solo login** en `/login` para los tres roles. Según el rol, te redirige a un lugar distinto.

| Rol | Correo | Contraseña | Entra a | Puede |
|---|---|---|---|---|
| **Cliente** | `cliente@trigal.pe` | `cliente123` | `/` (tienda) | Comprar en la tienda web |
| **Administrador** | `admin@trigal.pe` | `admin123` | `/dashboard` | **Todo** el panel |
| **Cajero** | `cajero@trigal.pe` | `cajero123` | `/dashboard` | Resumen, ventas e inventario |

> Hay un segundo cliente de prueba: `jorge@trigal.pe` / `jorge123`.

En la pantalla de login puedes **tocar una cuenta de prueba** para que rellene el formulario sola.

### Permisos por sección del dashboard

| Sección | ADMIN | CAJERO |
|---|:---:|:---:|
| `/dashboard` (resumen) | ✅ | ✅ |
| `/dashboard/ventas` | ✅ | ✅ |
| `/dashboard/inventario` | ✅ | ✅ |
| `/dashboard/productos` | ✅ | ❌ |
| `/dashboard/promociones` | ✅ | ❌ |

**Pruébalo:** entra como cajero y escribe `/dashboard/productos` a mano en la barra de direcciones. Verás la pantalla de "Sin acceso", aunque el enlace ni siquiera aparezca en el menú.

---

## 📁 Estructura de carpetas

```
src/
├── data/                  📦 JSON semilla (datos iniciales)
│   ├── productos.json         20 productos de bodega peruana
│   └── usuarios.json          usuarios de ejemplo por rol
│
├── repositories/          🗄️ CAPA DE DATOS (patrón Repository/DAO)
│   ├── almacenamiento.js      ← ÚNICO archivo que toca localStorage
│   ├── claves.js              nombres de las claves de almacenamiento
│   ├── repositorioBase.js     fábrica del CRUD genérico
│   ├── productoRepository.js  catálogo y stock  ⭐ fuente única de verdad
│   ├── usuarioRepository.js   usuarios y sesión
│   ├── ventaRepository.js     ventas de mostrador
│   ├── pedidoRepository.js    pedidos de la web
│   ├── promocionRepository.js promociones
│   ├── semilla.js             carga inicial de datos
│   └── index.js               punto de entrada de la capa
│
├── context/               🧠 ESTADO GLOBAL (patrón Facade + Observer)
│   ├── AuthContext.js         definición del contexto de sesión
│   ├── AuthProvider.jsx       lógica de sesión y roles
│   ├── InventarioContext.js   definición del contexto de inventario
│   └── InventarioProvider.jsx lógica del catálogo y el stock
│
├── hooks/                 🪝 LA FORMA DE CONSUMIR EL ESTADO
│   ├── useAuth.js             sesión, roles, login/logout
│   └── useInventario.js       productos, categorías, stock
│
├── components/
│   ├── ui/                🎨 COMPONENTES BASE reutilizables
│   │   ├── Boton, Card, Input, Select, Badge,
│   │   ├── Alerta, Cargando, EstadoVacio, Modal
│   │   └── index.js           importa todo desde aquí
│   ├── layout/            🏗️ ESTRUCTURAS DE PÁGINA
│   │   ├── Navbar, Footer, LayoutTienda
│   │   ├── SidebarDashboard, LayoutDashboard
│   │   └── Logo
│   └── comunes/
│       └── CascaronModulo.jsx  el "Módulo en construcción"
│
├── pages/
│   ├── tienda/            🛒 páginas de la tienda web
│   ├── dashboard/         📊 páginas del panel de gestión
│   ├── NoEncontradaPage.jsx
│   └── SinAccesoPage.jsx
│
├── routes/                🗺️ ENRUTADO Y CONTROL DE ACCESO
│   ├── rutas.js               constantes de todas las URLs
│   ├── RutaProtegida.jsx      control de acceso (patrón Proxy)
│   └── AppRouter.jsx          el mapa completo de la app
│
├── styles/                💅 SISTEMA DE DISEÑO
│   ├── tokens.css             colores, tipografía, espaciados…
│   └── base.css               reset y utilidades
│
├── utils/
│   └── formato.js             formatearSoles, formatearFecha…
│
├── constantes.js          📌 ROLES, ESTADOS_PEDIDO, METODOS_PAGO, BODEGA
├── App.jsx                raíz: monta los providers
└── main.jsx               arranque: siembra los datos y renderiza
```

---

## 🏛️ La arquitectura en 2 minutos

```
    ┌─────────────────┐        ┌──────────────────┐
    │   TIENDA WEB    │        │    DASHBOARD     │
    │  (clientes)     │        │   (personal)     │
    └────────┬────────┘        └────────┬─────────┘
             │                          │
             └────────────┬─────────────┘
                          ▼
              ┌───────────────────────┐
              │   HOOKS (la fachada)  │   useInventario() · useAuth()
              └───────────┬───────────┘
                          ▼
              ┌───────────────────────┐
              │  CONTEXTS (providers) │   estado global + re-render
              └───────────┬───────────┘
                          ▼
              ┌───────────────────────┐
              │  REPOSITORIES (CRUD)  │   ⭐ una sola fuente de verdad
              └───────────┬───────────┘
                          ▼
              ┌───────────────────────┐
              │  localStorage (hoy)   │   → Spring Boot (mañana)
              └───────────────────────┘
```

### 🥇 La regla de oro

> **Si un producto se vende por la web, su stock baja en el dashboard. Y viceversa.**

No es magia: es que **las dos zonas leen del mismo repositorio**. No existen dos listas de productos que después haya que sincronizar. El método que lo hace posible es uno solo:

```js
await inventario.descontarStock(items)
```

Lo llaman **tanto el checkout de la tienda web como el registro de ventas del dashboard**. Es atómico: si un solo producto no tiene stock, lanza error y **no descuenta nada**.

### 🚫 La regla que no se rompe

**Ningún componente toca `localStorage` directamente.** Si ves `localStorage.getItem(...)` en un componente, está mal. Todo pasa por los repositorios o, mejor aún, por los hooks.

---

## 🗄️ Cómo consumir la capa Repository

Todos los métodos son **`async`** (devuelven una Promesa), aunque hoy leer del `localStorage` sea instantáneo. **Esto es a propósito**: el día que migremos a Spring Boot, el cuerpo del método cambia pero tu código **no**.

### Métodos que tienen todos los repositorios

```js
await repo.obtenerTodos()            // → array con todos los registros
await repo.obtenerPorId(id)          // → el registro, o null
await repo.obtenerDonde(condicion)   // → los que cumplan la condición
await repo.contar()                  // → cuántos hay
await repo.crear(datos)              // → el registro creado, ya con su id
await repo.actualizar(id, cambios)   // → el registro actualizado (parcial)
await repo.eliminar(id)              // → true
```

### Ejemplo corto y completo

```jsx
import { useEffect, useState } from 'react'
import { ventaRepository } from '../../repositories'
import { formatearSoles, formatearFecha } from '../../utils/formato'
import { Cargando, EstadoVacio } from '../../components/ui'

function VentasDelDia() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const datos = await ventaRepository.obtenerDeHoy()
      setVentas(datos)
      setCargando(false)
    }
    cargar()
  }, [])

  if (cargando) return <Cargando texto="Cargando ventas…" />
  if (ventas.length === 0) {
    return <EstadoVacio icono="🧾" titulo="Aún no hay ventas hoy" />
  }

  return (
    <ul>
      {ventas.map((venta) => (
        <li key={venta.id}>
          {formatearFecha(venta.fecha, { conHora: true })} — {formatearSoles(venta.total)}
        </li>
      ))}
    </ul>
  )
}
```

### Métodos propios de cada repositorio

**`productoRepository`** — catálogo y stock
```js
await productoRepository.obtenerActivos()
await productoRepository.obtenerPorCategoria('Bebidas')
await productoRepository.obtenerCategorias()
await productoRepository.buscar('arroz')
await productoRepository.obtenerBajoStock()
await productoRepository.ajustarStock(id, +10)       // ingreso de mercadería
await productoRepository.descontarStock(items)       // ⭐ venta (atómico)
await productoRepository.reponerStock(items)         // anulación
```

**`usuarioRepository`** — usuarios y sesión
```js
await usuarioRepository.autenticar(correo, clave)
await usuarioRepository.obtenerPorCorreo(correo)
await usuarioRepository.registrarCliente(datos)
await usuarioRepository.guardarSesion(usuario)
await usuarioRepository.obtenerSesion()
await usuarioRepository.cerrarSesion()
```

**`ventaRepository`** — ventas de mostrador
```js
await ventaRepository.obtenerDeHoy()
await ventaRepository.obtenerPorCajero(cajeroId)
await ventaRepository.obtenerPorRango(desde, hasta)
await ventaRepository.anular(id, motivo)
```

**`pedidoRepository`** — pedidos web
```js
await pedidoRepository.obtenerPorCliente(clienteId)
await pedidoRepository.obtenerPorEstado(ESTADOS_PEDIDO.PENDIENTE)
await pedidoRepository.obtenerActivos()
await pedidoRepository.cambiarEstado(id, nuevoEstado)
```

**`promocionRepository`** — promociones
```js
await promocionRepository.obtenerVigentes()
await promocionRepository.obtenerParaProducto(producto)
```

---

## 🪝 Cómo usar los hooks

Los hooks son la **fachada** sobre los repositorios. **Si el hook te da lo que necesitas, usa el hook, no el repositorio.**

### `useInventario()` — productos y stock

```jsx
import { useInventario } from '../../hooks/useInventario'

function MiCatalogo() {
  const {
    productos,           // todos (incluye desactivados) — para el dashboard
    productosActivos,    // solo los visibles — para la tienda web
    categorias,          // ['Abarrotes', 'Bebidas', ...] calculadas solas
    cargando,
    error,

    // Escritura
    crearProducto,       // async (datos)
    actualizarProducto,  // async (id, cambios)
    eliminarProducto,    // async (id)
    ajustarStock,        // async (id, delta)
    descontarStock,      // async (items)  ⭐ la regla de oro
    reponerStock,        // async (items)
    refrescar,           // async ()

    // Consultas (síncronas, sobre lo ya cargado)
    obtenerProducto,     // (id) → producto | null
    filtrarPorCategoria, // (categoria) → producto[]
    buscar,              // (texto) → producto[]
  } = useInventario()

  if (cargando) return <Cargando />

  return productosActivos.map((p) => <TarjetaProducto key={p.id} producto={p} />)
}
```

**Vender (checkout o caja):**

```jsx
const { descontarStock } = useInventario()

try {
  await descontarStock([
    { productoId: 'prod-001', cantidad: 2 },
    { productoId: 'prod-013', cantidad: 1 },
  ])
  await pedidoRepository.crear({ /* ... */ })
} catch (error) {
  // "Stock insuficiente de 'Inca Kola 1.5 L'. Disponible: 1, solicitado: 3."
  setMensajeError(error.message)
}
```

⚠️ **Descuenta el stock ANTES de registrar la venta o el pedido.** Si no hay stock, `descontarStock` lanza error y el registro no llega a crearse.

### `useAuth()` — sesión y roles

```jsx
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../constantes'

function MiComponente() {
  const {
    usuario,          // { id, nombre, correo, rol, ... } o null
    rol,              // 'CLIENTE' | 'ADMIN' | 'CAJERO' | null
    estaAutenticado,  // boolean
    esPersonal,       // boolean: ¿es ADMIN o CAJERO?
    cargando,         // true mientras se restaura la sesión
    error,

    iniciarSesion,    // async (correo, clave) → usuario
    cerrarSesion,     // async ()
    limpiarError,
    tieneRol,         // (...roles) → boolean
  } = useAuth()

  return (
    <>
      <p>Hola, {usuario?.nombre}</p>
      {tieneRol(ROLES.ADMIN) && <Boton variante="peligro">Eliminar</Boton>}
    </>
  )
}
```

### Proteger una ruta nueva

```jsx
import RutaProtegida from '../routes/RutaProtegida'
import { ROLES } from '../constantes'

// Solo hay que estar logueado
<RutaProtegida><MiPagina /></RutaProtegida>

// Solo un rol
<RutaProtegida rol={ROLES.ADMIN}><MiPagina /></RutaProtegida>

// Varios roles
<RutaProtegida rol={[ROLES.ADMIN, ROLES.CAJERO]}><MiPagina /></RutaProtegida>
```

---

## 🎨 Sistema de diseño

El proyecto es **mobile-first**: el CSS se escribe pensando en el celular y las `@media (min-width: ...)` solo **agregan** mejoras para pantallas grandes.

### Usa SIEMPRE los tokens

Todos los colores, espaciados, tipografías, radios y sombras están en `src/styles/tokens.css`.

```css
/* ✅ BIEN */
.mi-tarjeta {
  background-color: var(--color-superficie);
  padding: var(--esp-4);
  border-radius: var(--radio-lg);
  color: var(--color-texto);
}

/* ❌ MAL — rompe la coherencia visual del grupo */
.mi-tarjeta {
  background-color: #fff;
  padding: 16px;
  border-radius: 14px;
  color: #2b2621;
}
```

Tokens más usados:

| Token | Para qué |
|---|---|
| `--color-primario` | Botones y acciones principales (ladrillo) |
| `--color-acento` | Destacados y ofertas (trigo) |
| `--color-superficie` | Fondo de tarjetas |
| `--color-texto` / `--color-texto-suave` / `--color-texto-tenue` | Jerarquía de texto |
| `--color-borde` | Bordes |
| `--color-exito` / `--color-advertencia` / `--color-peligro` | Estados |
| `--esp-1` … `--esp-20` | Espaciados (escala de 4px) |
| `--radio-sm/md/lg/xl/pastilla` | Radios |
| `--sombra-xs/sm/md/lg/xl` | Sombras |

### Componentes UI listos para usar

```jsx
import {
  Boton, Card, CardCabecera, CardCuerpo, CardPie,
  Input, Select, Badge, Alerta, Cargando, EstadoVacio, Modal,
} from '../../components/ui'

<Boton variante="primario" tamano="lg" bloque cargando={enviando}>Pagar</Boton>
<Boton variante="contorno" como={Link} to="/carrito">Ver carrito</Boton>
<Badge variante="exito" punto>En stock</Badge>
<Input etiqueta="Precio" type="number" prefijo="S/" error={errores.precio} />
<Alerta variante="peligro">{mensaje}</Alerta>
<Modal abierto={abierto} alCerrar={cerrar} titulo="Nuevo producto">…</Modal>
```

Variantes de `Boton`: `primario` · `secundario` · `contorno` · `fantasma` · `peligro`
Variantes de `Badge` y `Alerta`: `neutro` · `marca` · `acento` · `exito` · `advertencia` · `peligro` · `info`

### Utilidades CSS globales

```jsx
<div className="contenedor">…</div>       {/* ancho máximo + márgenes */}
<section className="seccion">…</section>  {/* separación vertical estándar */}
<div className="rejilla">…</div>          {/* 1 col móvil → 2 → 3 automático */}

<div className="ui-tabla-scroll">        {/* tablas que no rompen el móvil */}
  <table className="ui-tabla">…</table>
</div>
```

### Convención para tus clases CSS

Para que no choquen las clases entre módulos, **prefija con el nombre de tu módulo**:

```css
/* módulo de carrito */
.carrito__item { … }
.carrito__total { … }
```

Crea tu `.css` al lado de tu componente e impórtalo desde él.

---

## 🧩 Patrones de diseño aplicados

### Ya implementados en la base

| Patrón | Dónde | Qué problema resuelve |
|---|---|---|
| **Repository / DAO** | `src/repositories/` | Aísla de dónde salen los datos. Migrar a Spring Boot no toca ni un componente. |
| **Facade** | `src/context/` + `src/hooks/` | Los componentes usan `useInventario()` sin saber que existen repositorios ni `localStorage`. |
| **Observer** | Context + `useState` | Cuando el stock cambia, todo lo que lo muestra se actualiza solo. **Es el re-render de React: no lo implementes a mano.** |
| **Proxy** | `RutaProtegida.jsx` | Controla el acceso antes de renderizar. La página protegida no sabe que está protegida. |

### Por implementar en los módulos (ya están los ganchos)

| Patrón | Módulo | Dónde está el gancho |
|---|---|---|
| **Strategy** | Checkout | `src/constantes.js` → `METODOS_PAGO` |
| **Decorator** | Promociones | `src/repositories/promocionRepository.js` |
| **State** | Pedidos | `src/constantes.js` → `ESTADOS_PEDIDO` y `pedidoRepository.js` |

Busca el comentario **`🪝 GANCHO`** en esos archivos: cada uno explica el problema y trae código de ejemplo.

---

## 👥 Para los integrantes: cómo trabajar tu módulo

### La idea

La base ya está lista. **Tu trabajo NO es armar la infraestructura otra vez**, es construir tu módulo **consumiendo** lo que ya existe. Si te encuentras escribiendo `localStorage`, creando otra lista de productos o inventando tus propios colores, **para**: seguro ya existe resuelto.

### Paso a paso

**1. Crea tu rama** (nunca trabajes en `main`)

```bash
git checkout main
git pull origin main
git checkout -b modulo/catalogo      # usa el nombre de tu módulo
```

Nombres sugeridos: `modulo/catalogo`, `modulo/carrito`, `modulo/checkout`, `modulo/inventario`, `modulo/productos`, `modulo/promociones`, `modulo/ventas`, `modulo/estadisticas`.

**2. Abre tu cascarón en el navegador**

Cada página te dice en pantalla qué construir y qué herramientas tienes. Léelo antes de escribir código.

**3. Lee los comentarios de tu archivo**

Arriba de cada cascarón hay un bloque con el arranque sugerido y, si tu módulo lleva un patrón, la explicación con ejemplo.

**4. Construye**

- Borra el `<CascaronModulo>` y escribe tu módulo.
- Usa los componentes de `components/ui/` antes de crear los tuyos.
- Usa los tokens CSS, nunca colores fijos.
- Usa `useInventario()` y `useAuth()`, nunca `localStorage`.
- Prueba **en el celular** (F12 → modo dispositivo). Es lo primero que se va a revisar.

**5. Sube tu rama**

```bash
git add .
git commit -m "feat(catalogo): grilla de productos con filtro por categoría"
git push origin modulo/catalogo
```

Luego abre un Pull Request hacia `main`.

### ⚠️ Archivos compartidos: cuidado con los conflictos

Estos los tocan varios módulos. Si necesitas modificarlos, **avisa al grupo**:

| Archivo | Cuándo lo tocarías |
|---|---|
| `src/App.jsx` | Si montas un provider nuevo (ej. `CarritoProvider`) |
| `src/routes/AppRouter.jsx` | Si agregas una ruta nueva |
| `src/routes/rutas.js` | Si agregas una ruta nueva |
| `src/components/ui/` | Si creas un componente base para todos |
| `src/constantes.js` | Si agregas constantes de dominio |

**Todo lo demás dentro de tu módulo es solo tuyo.** Si creas archivos auxiliares, ponlos en una subcarpeta propia:

```
src/pages/tienda/carrito/
├── ItemCarrito.jsx
├── ItemCarrito.css
└── ResumenCompra.jsx
```

### ✅ Checklist antes de tu Pull Request

- [ ] `npm run dev` corre sin errores en consola
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run build` compila
- [ ] Se ve bien en celular (375px de ancho)
- [ ] Usé los tokens CSS, no colores fijos
- [ ] Usé los componentes de `components/ui/`
- [ ] **No** escribí `localStorage` en ningún componente
- [ ] Manejo el estado de carga (`<Cargando />`) y el vacío (`<EstadoVacio />`)
- [ ] Si mi módulo vende, llamo a `descontarStock()` **antes** de registrar
- [ ] Mis textos y comentarios están en español

---

## 🔌 Migración futura a Spring Boot

La capa Repository está diseñada para que cambiar `localStorage` por un backend real **no obligue a tocar ni un componente**.

La clave es que **todos los métodos ya son `async`**. Un componente que hoy escribe:

```js
const productos = await productoRepository.obtenerTodos()
```

va a seguir escribiendo exactamente eso cuando por dentro sea:

```js
async obtenerTodos() {
  const respuesta = await fetch(`${API}/productos`)
  if (!respuesta.ok) throw new Error('Error al listar productos')
  return respuesta.json()
}
```

### Qué cambia y qué no

| Capa | ¿Cambia? |
|---|---|
| Componentes y páginas | ❌ No |
| Hooks (`useAuth`, `useInventario`) | ❌ No |
| Contextos | ❌ No |
| **Repositorios (por dentro)** | ✅ Sí — `localStorage` → `fetch` |
| `almacenamiento.js` | ✅ Se elimina |
| `semilla.js` | ✅ Pasa al backend (`data.sql`) |

### Y la seguridad de verdad

La autenticación actual es **simulada** y está marcada como tal en todo el código:

- ❌ Contraseñas en texto plano en `usuarios.json`
- ❌ Sesión en `localStorage`, editable desde las DevTools
- ❌ Control de roles en el cliente

Con el backend llega lo real:

- ✅ Contraseñas con **BCrypt**
- ✅ **JWT** firmado en `POST /api/auth/login`
- ✅ **Spring Security** con `@PreAuthorize("hasRole('ADMIN')")` validando **cada** petición en el servidor

`<RutaProtegida>` se queda, pero pasa a ser solo una comodidad visual. **La seguridad real siempre es la del servidor.**

---

## 🛠️ Stack

- **React 19** + **Vite 8**
- **React Router 7**
- **CSS plano** con variables (sin frameworks de estilos)
- **ESLint**

Sin librerías de UI ni de estado: todo con las herramientas del curso.

---

*Proyecto académico · Herramientas de Desarrollo · Ciclo 7*
