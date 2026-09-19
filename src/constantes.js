/**
 * ============================================================================
 * CONSTANTES DEL DOMINIO · Bodega El Trigal
 * ----------------------------------------------------------------------------
 * Vocabulario compartido por TODO el proyecto. Si un módulo necesita hablar de
 * roles, estados de pedido o métodos de pago, los importa de aquí.
 *
 * ¿Por qué no escribir los strings a mano en cada archivo?
 * Porque `"ADMIN"` mal escrito como `"Admin"` rompe el control de acceso y no
 * salta ningún error. Con constantes, el editor autocompleta y un typo revienta
 * de inmediato.
 * ==========================================================================*/

/* ---------------------------------------------------------------------------
 * ROLES DE USUARIO
 * ------------------------------------------------------------------------ */

/**
 * Los tres roles de la plataforma.
 * - CLIENTE: compra por la tienda web.
 * - CAJERO:  personal de la tienda física; registra ventas y ve inventario.
 * - ADMIN:   dueño/encargado; puede todo, incluido productos y promociones.
 */
export const ROLES = {
  CLIENTE: "CLIENTE",
  ADMIN: "ADMIN",
  CAJERO: "CAJERO",
};

/** Roles que tienen permitido entrar al dashboard (el personal de la tienda). */
export const ROLES_DASHBOARD = [ROLES.ADMIN, ROLES.CAJERO];

/** Etiquetas legibles para mostrar en pantalla. */
export const ETIQUETAS_ROL = {
  [ROLES.CLIENTE]: "Cliente",
  [ROLES.ADMIN]: "Administrador",
  [ROLES.CAJERO]: "Cajero",
};

/* ---------------------------------------------------------------------------
 * PEDIDOS (tienda web)
 * ------------------------------------------------------------------------ */

/**
 * Estados por los que pasa un pedido web.
 *
 * 🪝 GANCHO — PATRÓN STATE (rama: checkout / pedidos)
 * Hoy esto es solo una lista de strings. Quien implemente el seguimiento de
 * pedidos debe convertir cada estado en un objeto con su propio comportamiento
 * (qué transiciones permite, qué se puede hacer en él), de modo que el pedido
 * delegue en su estado actual en vez de tener un `switch` gigante.
 *
 *   PENDIENTE → CONFIRMADO → EN_CAMINO → ENTREGADO
 *                    ↘ CANCELADO
 *
 * NO lo implementen aquí: esto es la base. Va en el módulo correspondiente.
 */
export const ESTADOS_PEDIDO = {
  PENDIENTE: "PENDIENTE",
  CONFIRMADO: "CONFIRMADO",
  EN_CAMINO: "EN_CAMINO",
  ENTREGADO: "ENTREGADO",
  CANCELADO: "CANCELADO",
};

export const ETIQUETAS_ESTADO_PEDIDO = {
  [ESTADOS_PEDIDO.PENDIENTE]: "Pendiente",
  [ESTADOS_PEDIDO.CONFIRMADO]: "Confirmado",
  [ESTADOS_PEDIDO.EN_CAMINO]: "En camino",
  [ESTADOS_PEDIDO.ENTREGADO]: "Entregado",
  [ESTADOS_PEDIDO.CANCELADO]: "Cancelado",
};

/** Cómo recibe el cliente su pedido. */
export const TIPOS_ENTREGA = {
  RECOJO_TIENDA: "RECOJO_TIENDA",
  DELIVERY: "DELIVERY",
};

export const ETIQUETAS_TIPO_ENTREGA = {
  [TIPOS_ENTREGA.RECOJO_TIENDA]: "Recojo en tienda",
  [TIPOS_ENTREGA.DELIVERY]: "Delivery a domicilio",
};

/* ---------------------------------------------------------------------------
 * PAGOS
 * ------------------------------------------------------------------------ */

/**
 * Métodos de pago disponibles.
 *
 * 🪝 GANCHO — PATRÓN STRATEGY (rama: checkout)
 * Cada método de pago tiene una forma distinta de cobrar (Yape pide número,
 * tarjeta pide datos y valida, efectivo calcula vuelto). En vez de un
 * `if/else` por método dentro del checkout, quien tome ese módulo debe crear
 * una estrategia por método con una interfaz común, por ejemplo:
 *
 *   // src/pages/tienda/pagos/estrategiaYape.js
 *   export const estrategiaYape = {
 *     nombre: 'Yape',
 *     validar(datos) { ... },
 *     async procesar(monto, datos) { ... devuelve { exito, referencia } },
 *   }
 *
 * y el checkout solo hace: `await estrategias[metodoElegido].procesar(total, datos)`.
 * Agregar Plin después = crear un archivo, sin tocar el checkout.
 *
 * NO lo implementen aquí.
 */
export const METODOS_PAGO = {
  EFECTIVO: "EFECTIVO",
  YAPE: "YAPE",
  PLIN: "PLIN",
  TARJETA: "TARJETA",
};

export const ETIQUETAS_METODO_PAGO = {
  [METODOS_PAGO.EFECTIVO]: "Efectivo",
  [METODOS_PAGO.YAPE]: "Yape",
  [METODOS_PAGO.PLIN]: "Plin",
  [METODOS_PAGO.TARJETA]: "Tarjeta",
};

/* ---------------------------------------------------------------------------
 * DATOS DE LA BODEGA
 * ------------------------------------------------------------------------ */

/**
 * Información de contacto que aparece en el footer, "Nosotros" y "Ubicación".
 * Cambiar aquí actualiza esos tres sitios de una sola vez.
 *
 * Los datos de contacto son los reales de la bodega.
 */
export const BODEGA = {
  nombre: "Bodega El Trigal",
  lema: "Tu bodega de confianza en Piura",

  // Fundación del negocio. La página Nosotros calcula los años de
  // trayectoria a partir de esta fecha, para que nunca quede desactualizada.
  fundacion: "1994-01-10",

  // Dirección real de la bodega.
  direccion: "Av. John F. Kennedy 343-297",
  ciudad: "Piura 20007, Perú",

  telefono: "+51 920 642 639",
  whatsapp: "51920642639",
  correo: "hola@eltrigal.pe",
  horario: "Lun a Sáb 7:00 a.m. – 10:00 p.m. · Dom 8:00 a.m. – 2:00 p.m.",

  // Coordenadas reales (se usan para el enlace "Cómo llegar" de /ubicacion).
  coordenadas: { lat: -5.192277, lng: -80.65098 },
};

/** Moneda con la que trabaja todo el sistema. */
export const MONEDA = { codigo: "PEN", simbolo: "S/" };

/* ---------------------------------------------------------------------------
 * INVENTARIO
 * ------------------------------------------------------------------------ */

/**
 * Umbral POR DEFECTO para considerar que a un producto se le está acabando el
 * stock. Se usa en el módulo de inventario del dashboard.
 *
 * Ojo con la precedencia: cada producto puede traer su propio `stockMinimo`
 * (el arroz se repone con 10, el balón de gas con 3), y ese valor MANDA sobre
 * esta constante. `UMBRAL_STOCK_BAJO` es solo la red de seguridad para los
 * productos que aún no tienen mínimo definido, por ejemplo los recién creados.
 *
 * La regla está implementada en una sola función, `umbralDe(producto)`, en
 * src/pages/dashboard/gestion/utilesInventario.js
 */
export const UMBRAL_STOCK_BAJO = 10;


/* ---------------------------------------------------------------------------
 * PROMOCIONES
 * ------------------------------------------------------------------------ */

/**
 * Tipos de promociones disponibles.
 *
 * 🪝 GANCHO — PATRÓN DECORATOR (rama: promociones)
 * Cada tipo de promoción es un decorador que envuelve el precio base y le
 * agrega su efecto. Quien implemente el módulo de promociones debe crear
 * una función decoradora por tipo en src/pages/dashboard/promociones/decoradores.js.
 */
export const TIPOS_PROMOCION = {
  PORCENTAJE: "PORCENTAJE",   // Descuento por porcentaje (ej: 15%)
  MONTO_FIJO: "MONTO_FIJO",   // Descuento por monto fijo (ej: S/ 5.00)
  DOS_X_UNO: "DOS_X_UNO",     // 2x1: el segundo producto es gratis
  COMBO: "COMBO",             // Combo: precio especial por varios productos
};

export const ETIQUETAS_TIPO_PROMOCION = {
  [TIPOS_PROMOCION.PORCENTAJE]: "Porcentaje",
  [TIPOS_PROMOCION.MONTO_FIJO]: "Monto fijo",
  [TIPOS_PROMOCION.DOS_X_UNO]: "2x1",
  [TIPOS_PROMOCION.COMBO]: "Combo",
};
