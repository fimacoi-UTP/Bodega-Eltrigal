/**
 * ============================================================================
 * REPOSITORIO DE USUARIOS + SESIÓN
 * ----------------------------------------------------------------------------
 * ⚠️⚠️ ADVERTENCIA IMPORTANTE — AUTENTICACIÓN SIMULADA ⚠️⚠️
 *
 * Todo lo que hay aquí es una SIMULACIÓN pensada para que el frontend se pueda
 * desarrollar y demostrar sin backend. NO es seguridad real. En concreto:
 *
 *  ❌ Las contraseñas están en texto plano dentro de usuarios.json.
 *  ❌ La comparación es `usuario.clave === clave`, sin hashing.
 *  ❌ La sesión es un objeto en localStorage; cualquiera lo edita desde la
 *     consola del navegador y se convierte en ADMIN en 5 segundos.
 *  ❌ El control de roles vive en el cliente, que es justamente donde un
 *     atacante tiene todo el control.
 *
 * ✅ CUANDO LLEGUE EL BACKEND (Spring Boot), esto se reemplaza por:
 *  · Contraseñas hasheadas con BCrypt en la base de datos.
 *  · POST /api/auth/login que devuelve un JWT firmado.
 *  · El JWT viaja en la cabecera Authorization: Bearer <token>.
 *  · Spring Security + @PreAuthorize("hasRole('ADMIN')") validando CADA
 *    petición en el servidor.
 *  · El <RutaProtegida> del frontend se queda, pero pasa a ser solo una
 *    comodidad visual (que el usuario no vea botones que no puede usar).
 *    La seguridad de verdad SIEMPRE es la del servidor.
 *
 * La gracia es que la firma de `autenticar(correo, clave)` no va a cambiar:
 * hoy compara strings, mañana hace un fetch. El AuthContext ni se entera.
 * ==========================================================================*/

import { crearRepositorioBase } from "./repositorioBase";
import { CLAVES } from "./claves";
import { almacenamiento } from "./almacenamiento";

const base = crearRepositorioBase({
  clave: CLAVES.USUARIOS,
  prefijoId: "usr",
  nombre: "usuarios",
});

/**
 * Quita la contraseña antes de devolver un usuario.
 * Aunque esto sea una simulación, mantenemos la buena costumbre: la clave
 * nunca sale del repositorio hacia los componentes.
 */
function sinClave(usuario) {
  if (!usuario) return null;
  // eslint-disable-next-line no-unused-vars
  const { clave, ...publico } = usuario;
  return publico;
}

export const usuarioRepository = {
  ...base,

  /** Todos los usuarios, sin exponer sus contraseñas. */
  async obtenerTodos() {
    const usuarios = await base.obtenerTodos();
    return usuarios.map(sinClave);
  },

  /** Un usuario por id, sin su contraseña. */
  async obtenerPorId(id) {
    return sinClave(await base.obtenerPorId(id));
  },

  /** Busca por correo (no distingue mayúsculas). @returns {Promise<object|null>} */
  async obtenerPorCorreo(correo) {
    const normalizado = String(correo ?? "").trim().toLowerCase();
    const usuarios = base._leerColeccion();
    const encontrado = usuarios.find(
      (usuario) => usuario.correo.toLowerCase() === normalizado,
    );
    return sinClave(encontrado);
  },

  /* ------------------------------------------------------- AUTENTICACIÓN */

  /**
   * Valida credenciales. SIMULADO (ver advertencia arriba).
   *
   * @param {string} correo
   * @param {string} clave
   * @returns {Promise<object>} el usuario autenticado (sin su contraseña).
   * @throws {Error} con un mensaje listo para mostrarle al usuario.
   */
  async autenticar(correo, clave) {
    const normalizado = String(correo ?? "").trim().toLowerCase();
    const usuarios = base._leerColeccion();

    const usuario = usuarios.find(
      (candidato) => candidato.correo.toLowerCase() === normalizado,
    );

    // Mensaje genérico a propósito: no le decimos al atacante si el correo
    // existe o si solo falló la clave. (Buena práctica que igual conviene
    // mantener en el backend.)
    if (!usuario || usuario.clave !== clave) {
      throw new Error("Correo o contraseña incorrectos.");
    }

    if (usuario.activo === false) {
      throw new Error("Esta cuenta está desactivada. Contacta al administrador.");
    }

    return sinClave(usuario);

    /* 🔌 Versión con backend:
         const r = await fetch(`${API}/auth/login`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ correo, clave }),
         })
         if (!r.ok) throw new Error('Correo o contraseña incorrectos.')
         const { token, usuario } = await r.json()
         almacenamiento.escribir(CLAVES.SESION, { token, usuario })
         return usuario                                                      */
  },

  /**
   * Registra un cliente nuevo (para el futuro formulario de registro).
   * El rol se fuerza a CLIENTE: nadie se auto-asigna ADMIN desde la web.
   */
  async registrarCliente(datos) {
    const yaExiste = await this.obtenerPorCorreo(datos.correo);
    if (yaExiste) {
      throw new Error("Ya existe una cuenta registrada con ese correo.");
    }

    const creado = await base.crear({
      ...datos,
      rol: "CLIENTE",
      activo: true,
    });
    return sinClave(creado);
  },

  /* -------------------------------------------------------------- SESIÓN */
  /* La sesión vive aquí, junto a los usuarios, y NO en los componentes.
     El AuthContext la consume; ningún otro archivo debería tocarla. */

  /**
   * Guarda la sesión activa en localStorage, para que al recargar la página
   * el usuario siga logueado.
   */
  async guardarSesion(usuario) {
    almacenamiento.escribir(CLAVES.SESION, {
      usuario: sinClave(usuario),
      iniciadaEn: new Date().toISOString(),
      // 🔌 Con backend, aquí también iría: token: '<JWT>'
    });
    return usuario;
  },

  /**
   * Recupera la sesión guardada, si la hay.
   * @returns {Promise<object|null>} el usuario de la sesión, o null.
   */
  async obtenerSesion() {
    const sesion = almacenamiento.leer(CLAVES.SESION, null);
    if (!sesion?.usuario?.id) return null;

    // Revalidamos contra la lista de usuarios: si al usuario lo eliminaron o
    // lo desactivaron mientras tenía la sesión abierta, la sesión no vale.
    const vigente = base._leerColeccion().find((u) => u.id === sesion.usuario.id);
    if (!vigente || vigente.activo === false) {
      almacenamiento.eliminar(CLAVES.SESION);
      return null;
    }

    // Devolvemos el usuario fresco de la BD, no el foto-fija de la sesión:
    // así, si el admin le cambió el rol, se refleja al recargar.
    return sinClave(vigente);
  },

  /** Cierra la sesión. */
  async cerrarSesion() {
    almacenamiento.eliminar(CLAVES.SESION);
    return true;
  },
};
