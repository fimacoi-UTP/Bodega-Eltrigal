/**
 * ============================================================================
 * LibroReclamacionesPage · Libro de Reclamaciones Virtual (INDECOPI Perú)
 * ----------------------------------------------------------------------------
 * Página pública conforme a la Ley N° 29571 y D.S. N° 011-2011-PCM.
 * Envío PÚBLICO y SIN TOKEN mediante reclamosApi.crearReclamo.
 * Con validación y sanitización en tiempo real y cascada de ubicación.
 * ==========================================================================*/

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { reclamosApi } from "../../api/reclamosApi";
import { RUTAS } from "../../routes/rutas";
import { BODEGA } from "../../constantes";
import { formatearFecha } from "../../utils/formato";
import { Alerta, Boton, Input, Select } from "../../components/ui";
import ubigeoPeru from "../../data/ubigeoPeru.json";
import "./LibroReclamacionesPage.css";

const TIPOS_DOCUMENTO = [
  { valor: "DNI", etiqueta: "DNI - Doc. Nacional de Identidad" },
  { valor: "CE", etiqueta: "Carnet de Extranjería (CE)" },
  { valor: "PASAPORTE", etiqueta: "Pasaporte" },
  { valor: "RUC", etiqueta: "RUC" },
];

const CANALES_COMPRA = [
  { valor: "TIENDA_WEB", etiqueta: "Tienda web (en línea)" },
  { valor: "LOCAL_PIURA", etiqueta: `Local físico Piura (${BODEGA.direccion})` },
];

const TIPOS_RESPUESTA = [
  { valor: "CORREO", etiqueta: "Correo electrónico" },
  { valor: "FISICA", etiqueta: "Dirección física (notificación escrita)" },
];

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// FUNCIONES DE SANITIZACIÓN EN TIEMPO REAL (onChange)
// ============================================================================

/**
 * Acepta únicamente letras, espacios, tildes, ñ/Ñ, ü/Ü, apóstrofo y guion.
 * Bloquea y elimina instantáneamente números y símbolos ajenos.
 */
function sanitizarTexto(val) {
  if (typeof val !== "string") return "";
  return val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ' -]/g, "");
}

/**
 * Sanitiza el número de documento según el tipo seleccionado.
 * - DNI: solo dígitos, exactamente hasta 8.
 * - RUC: solo dígitos, exactamente hasta 11.
 * - CE y Pasaporte: alfanumérico, hasta 12 caracteres en mayúsculas.
 */
function sanitizarDocumento(val, tipo) {
  if (typeof val !== "string") return "";
  if (tipo === "DNI") {
    return val.replace(/\D/g, "").slice(0, 8);
  }
  if (tipo === "RUC") {
    return val.replace(/\D/g, "").slice(0, 11);
  }
  return val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
}

/**
 * Teléfono / Celular: solo dígitos, máximo 9. Bloquea letras en vivo.
 */
function sanitizarTelefono(val) {
  if (typeof val !== "string") return "";
  return val.replace(/\D/g, "").slice(0, 9);
}

/**
 * Monto reclamado: solo números con hasta 2 decimales (un solo punto decimal).
 */
function sanitizarMonto(val) {
  if (typeof val !== "string") return "";
  let limpio = val.replace(/[^0-9.]/g, "");
  const partes = limpio.split(".");
  if (partes.length > 2) {
    limpio = `${partes[0]}.${partes.slice(1).join("")}`;
  }
  if (partes.length >= 2) {
    limpio = `${partes[0]}.${partes[1].slice(0, 2)}`;
  }
  return limpio;
}

// ============================================================================
// VALIDACIÓN EN VIVO (evalúa el valor al instante)
// ============================================================================

function validarCampoEnVivo(nombre, valor, formActual = {}) {
  const val = typeof valor === "string" ? valor.trim() : valor;

  switch (nombre) {
    case "nombres":
      if (!val) return "Ingresa tus nombres.";
      if (val.length < 2) return "Los nombres deben tener al menos 2 letras.";
      return null;

    case "apellidoPaterno":
      if (!val) return "Ingresa tu apellido paterno.";
      if (val.length < 2) return "El apellido paterno debe tener al menos 2 letras.";
      return null;

    case "apellidoMaterno":
      if (val && val.length < 2) return "El apellido materno debe tener al menos 2 letras.";
      return null;

    case "tipoDocumento":
      if (!val) return "Selecciona el tipo de documento.";
      return null;

    case "numeroDocumento": {
      const tipo = formActual.tipoDocumento || "DNI";
      if (!val) return "Ingresa tu número de documento.";
      if (tipo === "DNI") {
        if (val.length !== 8) return `El DNI debe tener exactamente 8 dígitos (${val.length}/8).`;
      } else if (tipo === "RUC") {
        if (val.length !== 11) return `El RUC debe tener exactamente 11 dígitos (${val.length}/11).`;
      } else if (tipo === "CE") {
        if (val.length < 4) return `El Carné de Extranjería debe tener entre 4 y 12 caracteres (${val.length}/12).`;
      } else if (tipo === "PASAPORTE") {
        if (val.length < 4) return `El pasaporte debe tener entre 4 y 12 caracteres (${val.length}/12).`;
      }
      return null;
    }

    case "telefono":
      if (val && val.length > 0 && val.length < 9) {
        return `El celular debe tener 9 dígitos (${val.length}/9).`;
      }
      return null;

    case "correo":
      if (!val) return "Ingresa tu correo electrónico.";
      if (!REGEX_EMAIL.test(val)) return "Ingresa un correo electrónico válido (ej: nombre@correo.com).";
      return null;

    case "direccion":
      if (formActual.tipoRespuesta === "FISICA" && !val) {
        return "La dirección es obligatoria para enviar la respuesta escrita.";
      }
      return null;

    case "montoReclamado":
      if (val && Number(val) <= 0) {
        return "El monto reclamado debe ser mayor a 0.";
      }
      return null;

    case "detalle":
      if (!val) return "Describe detalladamente los hechos ocurridos.";
      if (val.length < 10) return "El detalle debe contener al menos 10 caracteres.";
      return null;

    case "requerimiento":
      if (!val) return "Indica concretamente qué solución o respuesta solicitas.";
      if (val.length < 5) return "El requerimiento debe tener al menos 5 caracteres.";
      return null;

    default:
      return null;
  }
}

export function LibroReclamacionesPage() {
  const { usuario } = useAuth();

  const [formulario, setFormulario] = useState(() => ({
    nombres: usuario?.nombres || usuario?.nombre || "",
    apellidoPaterno: usuario?.apellidos || "",
    apellidoMaterno: "",
    tipoDocumento: "DNI",
    numeroDocumento: "",
    telefono: usuario?.telefono || "",
    tipoRespuesta: "CORREO",
    correo: usuario?.email || usuario?.correo || "",
    direccion: "",
    urbanizacion: "",
    departamento: "Piura",
    provincia: "Piura",
    distrito: "Piura",
    menorDeEdad: false,
    canalCompra: "TIENDA_WEB",
    motivo: "RECLAMO", // RECLAMO | QUEJA
    relacionadoA: "PRODUCTO", // PRODUCTO | SERVICIO
    numeroPedido: "",
    descripcionBien: "",
    detalle: "",
    requerimiento: "",
    montoReclamado: "",
  }));

  // Sincronización si los datos del usuario cargan de forma asíncrona
  const [prevUsuario, setPrevUsuario] = useState(usuario);
  if (usuario && usuario !== prevUsuario) {
    setPrevUsuario(usuario);
    setFormulario((prev) => ({
      ...prev,
      nombres: prev.nombres || usuario.nombres || usuario.nombre || "",
      apellidoPaterno: prev.apellidoPaterno || usuario.apellidos || "",
      correo: prev.correo || usuario.email || usuario.correo || "",
      telefono: prev.telefono || usuario.telefono || "",
    }));
  }

  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultadoReclamo, setResultadoReclamo] = useState(null);
  const [declaracionVerdad, setDeclaracionVerdad] = useState(true);

  // ==========================================================================
  // COMBOBOX EN CASCADA DE UBICACIÓN (Departamento → Provincia → Distrito)
  // ==========================================================================
  const listaDepartamentos = useMemo(() => {
    return Object.keys(ubigeoPeru).sort();
  }, []);

  const listaProvincias = useMemo(() => {
    if (!formulario.departamento || !ubigeoPeru[formulario.departamento]) return [];
    return Object.keys(ubigeoPeru[formulario.departamento]).sort();
  }, [formulario.departamento]);

  const listaDistritos = useMemo(() => {
    if (
      !formulario.departamento ||
      !formulario.provincia ||
      !ubigeoPeru[formulario.departamento]?.[formulario.provincia]
    ) {
      return [];
    }
    return ubigeoPeru[formulario.departamento][formulario.provincia];
  }, [formulario.departamento, formulario.provincia]);

  // ==========================================================================
  // MANEJADOR DE ENTRADA CON SANITIZACIÓN Y VALIDACIÓN EN VIVO (onChange)
  // ==========================================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let valorFinal = type === "checkbox" ? checked : value;

    // 1. Sanitización estricta en tiempo real
    if (name === "nombres" || name === "apellidoPaterno" || name === "apellidoMaterno") {
      valorFinal = sanitizarTexto(valorFinal);
    } else if (name === "numeroDocumento") {
      valorFinal = sanitizarDocumento(valorFinal, formulario.tipoDocumento);
    } else if (name === "telefono") {
      valorFinal = sanitizarTelefono(valorFinal);
    } else if (name === "montoReclamado") {
      valorFinal = sanitizarMonto(valorFinal);
    }

    // 2. Construcción del nuevo estado
    let nuevoForm = { ...formulario, [name]: valorFinal };

    // Si cambia el tipo de documento, re-sanitizar y re-validar el número de documento
    if (name === "tipoDocumento") {
      const docReSanitizado = sanitizarDocumento(formulario.numeroDocumento, valorFinal);
      nuevoForm.numeroDocumento = docReSanitizado;
      const errorDoc = validarCampoEnVivo("numeroDocumento", docReSanitizado, nuevoForm);
      setErrores((prev) => ({ ...prev, numeroDocumento: errorDoc }));
    }

    // Cascada de ubicación: reiniciar provincia y distrito según corresponda
    if (name === "departamento") {
      nuevoForm.provincia = "";
      nuevoForm.distrito = "";
    } else if (name === "provincia") {
      nuevoForm.distrito = "";
    }

    // Si cambia el tipo de respuesta (CORREO / FISICA), re-evaluar la dirección
    if (name === "tipoRespuesta") {
      const errorDir = validarCampoEnVivo("direccion", formulario.direccion, nuevoForm);
      setErrores((prev) => ({ ...prev, direccion: errorDir }));
    }

    setFormulario(nuevoForm);

    // 3. Validación instantánea en vivo para el campo que cambia
    const errorDelCampo = validarCampoEnVivo(name, valorFinal, nuevoForm);
    setErrores((prev) => ({
      ...prev,
      [name]: errorDelCampo,
    }));

    if (errorGeneral) setErrorGeneral(null);
  };

  const handleBlur = (name) => {
    const errorDelCampo = validarCampoEnVivo(name, formulario[name], formulario);
    setErrores((prev) => ({
      ...prev,
      [name]: errorDelCampo,
    }));
  };

  // ==========================================================================
  // VALIDACIÓN GENERAL AL ENVIAR
  // ==========================================================================
  const validarFormularioCompleto = () => {
    const camposAValidar = [
      "nombres",
      "apellidoPaterno",
      "tipoDocumento",
      "numeroDocumento",
      "correo",
      "direccion",
      "telefono",
      "montoReclamado",
      "detalle",
      "requerimiento",
    ];

    const nuevosErrores = {};
    for (const campo of camposAValidar) {
      const err = validarCampoEnVivo(campo, formulario[campo], formulario);
      if (err) {
        nuevosErrores[campo] = err;
      }
    }

    if (!declaracionVerdad) {
      nuevosErrores.declaracion = "Debes declarar la veracidad de los datos conforme a ley.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const alEnviar = async (evento) => {
    evento.preventDefault();
    setErrorGeneral(null);

    const esValido = validarFormularioCompleto();

    if (!esValido) {
      setErrorGeneral("Revisa los campos señalados en rojo antes de enviar tu reclamación.");

      // Scroll suave hacia el primer campo con error
      setTimeout(() => {
        const primerError = document.querySelector(
          ".ui-campo__caja--error, .libro-caja-textarea.ui-campo__caja--error, .libro-error-declaracion, .ui-campo__error"
        );
        if (primerError) {
          primerError.scrollIntoView({ behavior: "smooth", block: "center" });
          primerError.querySelector?.("input, select, textarea")?.focus();
        }
      }, 50);

      return;
    }

    setEnviando(true);

    const payload = {
      nombres: formulario.nombres.trim(),
      apellidoPaterno: formulario.apellidoPaterno.trim(),
      apellidoMaterno: formulario.apellidoMaterno?.trim() || null,
      tipoDocumento: formulario.tipoDocumento,
      numeroDocumento: formulario.numeroDocumento.trim(),
      telefono: formulario.telefono?.trim() || null,
      tipoRespuesta: formulario.tipoRespuesta,
      correo: formulario.correo.trim(),
      direccion: formulario.direccion?.trim() || null,
      urbanizacion: formulario.urbanizacion?.trim() || null,
      departamento: formulario.departamento?.trim() || "Piura",
      provincia: formulario.provincia?.trim() || "Piura",
      distrito: formulario.distrito?.trim() || "Piura",
      menorDeEdad: Boolean(formulario.menorDeEdad),
      canalCompra: formulario.canalCompra,
      motivo: formulario.motivo,
      relacionadoA: formulario.relacionadoA,
      numeroPedido: formulario.numeroPedido?.trim() || null,
      descripcionBien: formulario.descripcionBien?.trim() || null,
      detalle: formulario.detalle.trim(),
      requerimiento: formulario.requerimiento.trim(),
      montoReclamado:
        formulario.montoReclamado !== "" && !Number.isNaN(Number(formulario.montoReclamado))
          ? Number(formulario.montoReclamado)
          : null,
    };

    try {
      const data = await reclamosApi.crearReclamo(payload);
      setResultadoReclamo({
        ...data,
        ...payload,
        numeroCorrelativo:
          data.numeroCorrelativo || data.correlativo || `REC-${new Date().getFullYear()}-000001`,
        fechaCreacion: data.fechaCreacion || new Date().toISOString(),
        fechaLimiteRespuesta:
          data.fechaLimiteRespuesta ||
          new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorGeneral(err.message || "No se pudo registrar el reclamo. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  const resetearFormulario = () => {
    setResultadoReclamo(null);
    setErrorGeneral(null);
    setErrores({});
    setFormulario({
      nombres: usuario?.nombres || usuario?.nombre || "",
      apellidoPaterno: usuario?.apellidos || "",
      apellidoMaterno: "",
      tipoDocumento: "DNI",
      numeroDocumento: "",
      telefono: usuario?.telefono || "",
      tipoRespuesta: "CORREO",
      correo: usuario?.email || usuario?.correo || "",
      direccion: "",
      urbanizacion: "",
      departamento: "Piura",
      provincia: "Piura",
      distrito: "Piura",
      menorDeEdad: false,
      canalCompra: "TIENDA_WEB",
      motivo: "RECLAMO",
      relacionadoA: "PRODUCTO",
      numeroPedido: "",
      descripcionBien: "",
      detalle: "",
      requerimiento: "",
      montoReclamado: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==========================================================================
  // PANTALLA DE CONFIRMACIÓN PREMIUM (sub-vista)
  // ==========================================================================
  if (resultadoReclamo) {
    const fechaLimite = formatearFecha(resultadoReclamo.fechaLimiteRespuesta);
    const fechaEnvio = formatearFecha(resultadoReclamo.fechaCreacion, { conHora: true });

    return (
      <div className="contenedor seccion libro-confirmacion-vista">
        <div className="libro-confirmacion-card">
          <div className="libro-confirmacion-icono" aria-hidden="true">
            ✓
          </div>

          <span className="libro-confirmacion-chip">Hoja de Reclamación Asentada</span>

          <h1 className="libro-confirmacion-titulo serif">¡Reclamo registrado!</h1>

          <p className="libro-confirmacion-bajada">
            Tu hoja de reclamación virtual ha sido registrada formalmente en el sistema de
            Bodega El Trigal conforme al reglamento de INDECOPI.
          </p>

          <div className="libro-confirmacion-codigo-caja">
            <span className="libro-confirmacion-codigo-label">NÚMERO CORRELATIVO</span>
            <strong className="libro-confirmacion-codigo-valor serif">
              {resultadoReclamo.numeroCorrelativo}
            </strong>
            <span className="libro-confirmacion-codigo-ayuda">
              Guarda este código para cualquier consulta o seguimiento de tu trámite.
            </span>
          </div>

          <div className="libro-confirmacion-detalles">
            <div className="libro-confirmacion-fila">
              <span className="libro-confirmacion-clave">Consumidor:</span>
              <strong className="libro-confirmacion-valor">
                {resultadoReclamo.nombres} {resultadoReclamo.apellidoPaterno}{" "}
                {resultadoReclamo.apellidoMaterno || ""}
              </strong>
            </div>

            <div className="libro-confirmacion-fila">
              <span className="libro-confirmacion-clave">Documento:</span>
              <span className="libro-confirmacion-valor">
                {resultadoReclamo.tipoDocumento}: {resultadoReclamo.numeroDocumento}
              </span>
            </div>

            <div className="libro-confirmacion-fila">
              <span className="libro-confirmacion-clave">Tipo y motivo:</span>
              <span className="libro-confirmacion-valor">
                {resultadoReclamo.motivo === "RECLAMO" ? "Reclamo" : "Queja"} ·{" "}
                {resultadoReclamo.relacionadoA === "PRODUCTO" ? "Producto" : "Servicio"}
              </span>
            </div>

            <div className="libro-confirmacion-fila">
              <span className="libro-confirmacion-clave">Fecha de presentación:</span>
              <span className="libro-confirmacion-valor">{fechaEnvio}</span>
            </div>

            <div className="libro-confirmacion-fila libro-confirmacion-fila--destacada">
              <span className="libro-confirmacion-clave">Fecha límite de respuesta:</span>
              <strong className="libro-confirmacion-valor libro-confirmacion-valor--plazo">
                Te responderemos antes del {fechaLimite}
              </strong>
            </div>

            <div className="libro-confirmacion-fila">
              <span className="libro-confirmacion-clave">Canal de respuesta:</span>
              <span className="libro-confirmacion-valor">
                {resultadoReclamo.tipoRespuesta === "CORREO"
                  ? `Correo electrónico (${resultadoReclamo.correo})`
                  : `Dirección física (${resultadoReclamo.direccion || "Dirección indicada"})`}
              </span>
            </div>
          </div>

          <div className="libro-confirmacion-aviso">
            <span className="libro-confirmacion-aviso-icono" aria-hidden="true">
              📧
            </span>
            <span>
              Hemos enviado una copia fiel de esta hoja de reclamación a{" "}
              <strong>{resultadoReclamo.correo}</strong>. El proveedor cuenta con un plazo máximo
              de 15 días hábiles improrrogables para dar respuesta.
            </span>
          </div>

          <div className="libro-confirmacion-acciones">
            <Boton como={Link} to={RUTAS.INICIO} variante="primario" tamano="lg">
              ← Volver a la tienda
            </Boton>
            <Boton variante="contorno" tamano="lg" onClick={resetearFormulario}>
              Registrar otro reclamo
            </Boton>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // FORMULARIO PRINCIPAL
  // ==========================================================================
  const esNumeroDocNumerico =
    formulario.tipoDocumento === "DNI" || formulario.tipoDocumento === "RUC";

  return (
    <div className="contenedor seccion libro-reclamaciones-page">
      {/* ==================== CABECERA INSTITUCIONAL ==================== */}
      <header className="libro-cabecera">
        <div className="libro-cabecera__top">
          <Link to={RUTAS.INICIO} className="libro-cabecera__logo-link">
            <span className="libro-cabecera__logo-isotipo" aria-hidden="true">
              🌾
            </span>
            <div className="libro-cabecera__logo-textos">
              <span className="libro-cabecera__logo-nombre serif">Bodega El Trigal</span>
              <span className="libro-cabecera__logo-lema">PIURA · PERÚ</span>
            </div>
          </Link>
          <span className="libro-cabecera__ley-chip">Ley N° 29571 · D.S. N° 011-2011-PCM</span>
        </div>

        <div className="libro-cabecera__cuerpo">
          <span className="libro-cabecera__kicker">Libro de Reclamaciones Virtual</span>
          <h1 className="libro-cabecera__titulo serif">Hoja de Reclamación</h1>
          <p className="libro-cabecera__descripcion">
            Ponemos a tu disposición nuestro Libro de Reclamaciones Virtual conforme a las
            disposiciones de INDECOPI. Los campos marcados con{" "}
            <strong className="libro-asterisco">(*)</strong> son obligatorios.
          </p>

          <div className="libro-cabecera__datos-proveedor">
            <div className="libro-dato-chip">
              <span className="libro-dato-icono" aria-hidden="true">
                🏪
              </span>
              <span>
                <strong>Razón Social:</strong> {BODEGA.nombre}
              </span>
            </div>
            <div className="libro-dato-chip">
              <span className="libro-dato-icono" aria-hidden="true">
                📋
              </span>
              <span>
                <strong>RUC:</strong> {BODEGA.ruc}
              </span>
            </div>
            <div className="libro-dato-chip">
              <span className="libro-dato-icono" aria-hidden="true">
                📍
              </span>
              <span>
                <strong>Dirección:</strong> {BODEGA.direccion}, Piura
              </span>
            </div>
            <div className="libro-dato-chip">
              <span className="libro-dato-icono" aria-hidden="true">
                💬
              </span>
              <span>
                <strong>WhatsApp:</strong> +51 920 642 639
              </span>
            </div>
          </div>
        </div>
      </header>

      {errorGeneral && (
        <div className="libro-alerta-global">
          <Alerta variante="peligro" alCerrar={() => setErrorGeneral(null)}>
            {errorGeneral}
          </Alerta>
        </div>
      )}

      <form className="libro-formulario" onSubmit={alEnviar} noValidate>
        {/* ================================================================
         * SECCIÓN 1: IDENTIFICACIÓN DEL CONSUMIDOR
         * ============================================================== */}
        <section className="libro-card" aria-labelledby="sec-consumidor">
          <header className="libro-card__cabecera">
            <span className="libro-card__icono" aria-hidden="true">
              👤
            </span>
            <div className="libro-card__titulos">
              <h2 id="sec-consumidor" className="libro-card__titulo serif">
                1. Identificación del consumidor reclamante
              </h2>
              <p className="libro-card__subtitulo">
                Datos de la persona que presenta el reclamo o queja para fines de notificación.
              </p>
            </div>
          </header>

          <div className="libro-card__cuerpo">
            <div className="libro-grid-3">
              <Input
                etiqueta="Nombres"
                name="nombres"
                value={formulario.nombres}
                onChange={handleChange}
                onBlur={() => handleBlur("nombres")}
                error={errores.nombres}
                placeholder="Ej: Juan Carlos"
                inputMode="text"
                autoFocus
                requerido
              />

              <Input
                etiqueta="Apellido Paterno"
                name="apellidoPaterno"
                value={formulario.apellidoPaterno}
                onChange={handleChange}
                onBlur={() => handleBlur("apellidoPaterno")}
                error={errores.apellidoPaterno}
                placeholder="Ej: Pérez"
                inputMode="text"
                requerido
              />

              <Input
                etiqueta="Apellido Materno (opcional)"
                name="apellidoMaterno"
                value={formulario.apellidoMaterno}
                onChange={handleChange}
                onBlur={() => handleBlur("apellidoMaterno")}
                error={errores.apellidoMaterno}
                placeholder="Ej: Gómez"
                inputMode="text"
              />
            </div>

            <div className="libro-grid-3">
              <Select
                etiqueta="Tipo de Documento"
                name="tipoDocumento"
                value={formulario.tipoDocumento}
                onChange={handleChange}
                error={errores.tipoDocumento}
                requerido
              >
                {TIPOS_DOCUMENTO.map((doc) => (
                  <option key={doc.valor} value={doc.valor}>
                    {doc.etiqueta}
                  </option>
                ))}
              </Select>

              <Input
                etiqueta={
                  formulario.tipoDocumento === "DNI"
                    ? "Número de DNI (8 dígitos)"
                    : formulario.tipoDocumento === "RUC"
                    ? "Número de RUC (11 dígitos)"
                    : `Número de ${formulario.tipoDocumento} (hasta 12 car.)`
                }
                name="numeroDocumento"
                value={formulario.numeroDocumento}
                onChange={handleChange}
                onBlur={() => handleBlur("numeroDocumento")}
                error={errores.numeroDocumento}
                placeholder={
                  formulario.tipoDocumento === "DNI"
                    ? "8 dígitos"
                    : formulario.tipoDocumento === "RUC"
                    ? "11 dígitos"
                    : "Alfanumérico"
                }
                inputMode={esNumeroDocNumerico ? "numeric" : "text"}
                maxLength={formulario.tipoDocumento === "DNI" ? 8 : formulario.tipoDocumento === "RUC" ? 11 : 12}
                requerido
              />

              <Input
                etiqueta="Teléfono / Celular (opcional)"
                type="tel"
                name="telefono"
                value={formulario.telefono}
                onChange={handleChange}
                onBlur={() => handleBlur("telefono")}
                error={errores.telefono}
                placeholder="Ej: 920642639 (9 dígitos)"
                inputMode="numeric"
                maxLength={9}
              />
            </div>

            <div className="libro-grid-2">
              <Select
                etiqueta="Medio de respuesta preferido"
                name="tipoRespuesta"
                value={formulario.tipoRespuesta}
                onChange={handleChange}
                ayuda="Por este canal te notificaremos la respuesta formal de ley."
                requerido
              >
                {TIPOS_RESPUESTA.map((resp) => (
                  <option key={resp.valor} value={resp.valor}>
                    {resp.etiqueta}
                  </option>
                ))}
              </Select>

              <Input
                etiqueta="Correo Electrónico"
                type="email"
                name="correo"
                value={formulario.correo}
                onChange={handleChange}
                onBlur={() => handleBlur("correo")}
                error={errores.correo}
                placeholder="tucorreo@ejemplo.com"
                inputMode="email"
                ayuda="Recibirás aquí la copia de esta hoja de reclamación."
                requerido
              />
            </div>

            <div className="libro-grid-2">
              <Input
                etiqueta={
                  formulario.tipoRespuesta === "FISICA"
                    ? "Dirección de domicilio"
                    : "Dirección de domicilio (opcional)"
                }
                name="direccion"
                value={formulario.direccion}
                onChange={handleChange}
                onBlur={() => handleBlur("direccion")}
                error={errores.direccion}
                placeholder="Av., Jr., Calle, Nro., Mz., Lote"
                requerido={formulario.tipoRespuesta === "FISICA"}
              />

              <Input
                etiqueta="Urbanización / Barrio (opcional)"
                name="urbanizacion"
                value={formulario.urbanizacion}
                onChange={handleChange}
                placeholder="Urb., Sector o Referencia"
              />
            </div>

            {/* COMBOBOX EN CASCADA DE UBICACIÓN */}
            <div className="libro-grid-3">
              <Select
                etiqueta="Departamento (opcional)"
                name="departamento"
                value={formulario.departamento}
                onChange={handleChange}
              >
                <option value="">Selecciona departamento</option>
                {listaDepartamentos.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </Select>

              <Select
                etiqueta="Provincia (opcional)"
                name="provincia"
                value={formulario.provincia}
                onChange={handleChange}
                disabled={!formulario.departamento}
                ayuda={!formulario.departamento ? "Elige primero el departamento" : undefined}
              >
                <option value="">
                  {!formulario.departamento ? "Primero departamento" : "Selecciona provincia"}
                </option>
                {listaProvincias.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </Select>

              <Select
                etiqueta="Distrito (opcional)"
                name="distrito"
                value={formulario.distrito}
                onChange={handleChange}
                disabled={!formulario.provincia}
                ayuda={!formulario.provincia ? "Elige primero la provincia" : undefined}
              >
                <option value="">
                  {!formulario.provincia ? "Primero provincia" : "Selecciona distrito"}
                </option>
                {listaDistritos.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </Select>
            </div>

            {/* Menor de edad */}
            <div className="libro-campo-grupo">
              <span className="libro-label-grupo">¿El consumidor es menor de edad?</span>
              <div className="libro-radios-fila" role="radiogroup" aria-label="Menor de edad">
                <label className="libro-radio-opcion">
                  <input
                    type="radio"
                    name="menorDeEdad"
                    value="false"
                    checked={!formulario.menorDeEdad}
                    onChange={() => setFormulario((p) => ({ ...p, menorDeEdad: false }))}
                  />
                  <span>No (Mayor de edad)</span>
                </label>

                <label className="libro-radio-opcion">
                  <input
                    type="radio"
                    name="menorDeEdad"
                    value="true"
                    checked={formulario.menorDeEdad}
                    onChange={() => setFormulario((p) => ({ ...p, menorDeEdad: true }))}
                  />
                  <span>Sí (Representado por padre/tutor)</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
         * SECCIÓN 2: DETALLE DE LA RECLAMACIÓN Y PEDIDO
         * ============================================================== */}
        <section className="libro-card" aria-labelledby="sec-detalle">
          <header className="libro-card__cabecera">
            <span className="libro-card__icono" aria-hidden="true">
              📝
            </span>
            <div className="libro-card__titulos">
              <h2 id="sec-detalle" className="libro-card__titulo serif">
                2. Detalle de la reclamación y pedido
              </h2>
              <p className="libro-card__subtitulo">
                Especifica la compra o atención recibida y expón con claridad los hechos.
              </p>
            </div>
          </header>

          <div className="libro-card__cuerpo">
            <div className="libro-grid-2">
              <Select
                etiqueta="Canal de compra / atención"
                name="canalCompra"
                value={formulario.canalCompra}
                onChange={handleChange}
                requerido
              >
                {CANALES_COMPRA.map((canal) => (
                  <option key={canal.valor} value={canal.valor}>
                    {canal.etiqueta}
                  </option>
                ))}
              </Select>

              <Input
                etiqueta="Número de Pedido / Boleta (opcional)"
                name="numeroPedido"
                value={formulario.numeroPedido}
                onChange={handleChange}
                placeholder="Ej: PED-2026-001 o B001-123"
              />
            </div>

            {/* Motivo: Reclamo o Queja */}
            <div className="libro-campo-grupo">
              <span className="libro-label-grupo">
                Motivo de la presentación <span className="libro-asterisco">*</span>
              </span>
              <div
                className="libro-radios-cards"
                role="radiogroup"
                aria-label="Motivo de la presentación"
              >
                <label
                  className={`libro-radio-card ${
                    formulario.motivo === "RECLAMO" ? "libro-radio-card--activo" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value="RECLAMO"
                    checked={formulario.motivo === "RECLAMO"}
                    onChange={handleChange}
                  />
                  <div className="libro-radio-card__contenido">
                    <div className="libro-radio-card__top">
                      <span className="libro-radio-card__icono">📦</span>
                      <strong className="libro-radio-card__nombre">RECLAMO</strong>
                    </div>
                    <span className="libro-radio-card__desc">
                      Disconformidad relacionada a los productos y/o servicios adquiridos.
                    </span>
                  </div>
                </label>

                <label
                  className={`libro-radio-card ${
                    formulario.motivo === "QUEJA" ? "libro-radio-card--activo" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value="QUEJA"
                    checked={formulario.motivo === "QUEJA"}
                    onChange={handleChange}
                  />
                  <div className="libro-radio-card__contenido">
                    <div className="libro-radio-card__top">
                      <span className="libro-radio-card__icono">💬</span>
                      <strong className="libro-radio-card__nombre">QUEJA</strong>
                    </div>
                    <span className="libro-radio-card__desc">
                      Disconformidad no relacionada directamente a los productos o malestar en la
                      atención al público.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Relacionado a: Producto o Servicio */}
            <div className="libro-campo-grupo">
              <span className="libro-label-grupo">
                Bien o servicio contratado <span className="libro-asterisco">*</span>
              </span>
              <div
                className="libro-radios-fila"
                role="radiogroup"
                aria-label="Relacionado a producto o servicio"
              >
                <label className="libro-radio-opcion">
                  <input
                    type="radio"
                    name="relacionadoA"
                    value="PRODUCTO"
                    checked={formulario.relacionadoA === "PRODUCTO"}
                    onChange={handleChange}
                  />
                  <span>Producto (abarrotes, bebidas, lácteos, etc.)</span>
                </label>

                <label className="libro-radio-opcion">
                  <input
                    type="radio"
                    name="relacionadoA"
                    value="SERVICIO"
                    checked={formulario.relacionadoA === "SERVICIO"}
                    onChange={handleChange}
                  />
                  <span>Servicio (delivery, atención en local, cobro, etc.)</span>
                </label>
              </div>
            </div>

            <div className="libro-grid-2">
              <Input
                etiqueta="Identificación del bien contratado (opcional)"
                name="descripcionBien"
                value={formulario.descripcionBien}
                onChange={handleChange}
                placeholder="Ej: Arroz Costeño 5kg, Leche Gloria, Envío a domicilio..."
              />

              <Input
                etiqueta="Monto reclamado en Soles (opcional)"
                type="text"
                name="montoReclamado"
                prefijo="S/"
                inputMode="decimal"
                value={formulario.montoReclamado}
                onChange={handleChange}
                onBlur={() => handleBlur("montoReclamado")}
                error={errores.montoReclamado}
                placeholder="0.00"
              />
            </div>

            {/* Textarea: Detalle */}
            <div className="ui-campo">
              <div className="libro-label-fila">
                <label htmlFor="libro-detalle" className="ui-campo__etiqueta">
                  Detalle de la reclamación o queja <span className="libro-asterisco">*</span>
                </label>
                <span className="libro-contador-caracteres">
                  {formulario.detalle.length} / 4000
                </span>
              </div>
              <div
                className={`ui-campo__caja libro-caja-textarea ${
                  errores.detalle ? "ui-campo__caja--error" : ""
                }`}
              >
                <textarea
                  id="libro-detalle"
                  name="detalle"
                  rows={5}
                  maxLength={4000}
                  className="ui-campo__input libro-textarea"
                  placeholder="Explica detalladamente qué ocurrió, fechas, circunstancias y motivo de tu insatisfacción..."
                  value={formulario.detalle}
                  onChange={handleChange}
                  onBlur={() => handleBlur("detalle")}
                  aria-invalid={errores.detalle ? true : undefined}
                  required
                />
              </div>
              {errores.detalle && (
                <p className="ui-campo__error" role="alert">
                  {errores.detalle}
                </p>
              )}
            </div>

            {/* Textarea: Requerimiento */}
            <div className="ui-campo">
              <label htmlFor="libro-requerimiento" className="ui-campo__etiqueta">
                Pedido / Requerimiento del consumidor <span className="libro-asterisco">*</span>
              </label>
              <div
                className={`ui-campo__caja libro-caja-textarea ${
                  errores.requerimiento ? "ui-campo__caja--error" : ""
                }`}
              >
                <textarea
                  id="libro-requerimiento"
                  name="requerimiento"
                  rows={3}
                  className="ui-campo__input libro-textarea"
                  placeholder="Indica qué solución o respuesta concreta solicitas (ej: cambio de producto, devolución de dinero, disculpas formales)..."
                  value={formulario.requerimiento}
                  onChange={handleChange}
                  onBlur={() => handleBlur("requerimiento")}
                  aria-invalid={errores.requerimiento ? true : undefined}
                  required
                />
              </div>
              {errores.requerimiento && (
                <p className="ui-campo__error" role="alert">
                  {errores.requerimiento}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================
         * RECUADRO LEGAL INDECOPI
         * ============================================================== */}
        <aside className="libro-legal" aria-label="Información legal INDECOPI">
          <div className="libro-legal__cabecera">
            <span className="libro-legal__icono" aria-hidden="true">
              ⚖️
            </span>
            <strong className="libro-legal__titulo">Base Legal y Plazos de Atención</strong>
          </div>
          <ul className="libro-legal__lista">
            <li>
              <strong>(1) Reclamo:</strong> Disconformidad relacionada a los productos y/o
              servicios adquiridos.
            </li>
            <li>
              <strong>(2) Queja:</strong> Disconformidad no relacionada a los productos y/o
              servicios; o malestar o descontento respecto a la atención al público.
            </li>
            <li>
              <strong>Plazo de respuesta:</strong> Conforme al Código de Protección y Defensa del
              Consumidor (Ley N° 29571), el proveedor debe responder en un plazo no mayor a{" "}
              <strong>quince (15) días hábiles improrrogables</strong>.
            </li>
            <li>
              La formulación del reclamo no impide acudir a otras vías de solución de controversias ni
              es requisito previo para interponer una denuncia ante el <strong>INDECOPI</strong>.
            </li>
            <li>
              <strong>Protección de datos:</strong> En cumplimiento de la Ley N° 29733, los datos
              proporcionados serán utilizados exclusivamente para la gestión y resolución de la
              presente reclamación.
            </li>
          </ul>
        </aside>

        {/* ================================================================
         * DECLARACIÓN JURADA Y BOTÓN DE ENVÍO
         * ============================================================== */}
        <div className="libro-pie-acciones">
          <label className="libro-declaracion">
            <input
              type="checkbox"
              checked={declaracionVerdad}
              onChange={(e) => {
                setDeclaracionVerdad(e.target.checked);
                if (errores.declaracion) {
                  setErrores((prev) => ({ ...prev, declaracion: null }));
                }
              }}
            />
            <span>
              Declaro que los datos consignados en la presente hoja de reclamación son verdaderos y
              de mi entera responsabilidad conforme a ley.
            </span>
          </label>
          {errores.declaracion && (
            <p className="ui-campo__error libro-error-declaracion" role="alert">
              {errores.declaracion}
            </p>
          )}

          <Boton
            type="submit"
            variante="primario"
            tamano="lg"
            bloque
            cargando={enviando}
            disabled={enviando}
            className="libro-btn-enviar"
          >
            {enviando ? (
              "Enviando reclamo..."
            ) : (
              <>
                <span>Enviar reclamo</span>
                <span className="libro-btn-flecha" aria-hidden="true">
                  →
                </span>
              </>
            )}
          </Boton>
        </div>
      </form>
    </div>
  );
}

export default LibroReclamacionesPage;
