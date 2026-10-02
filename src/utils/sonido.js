/**
 * ============================================================================
 * sonido.js · Generador de sonidos con Web Audio API
 * ----------------------------------------------------------------------------
 * Permite reproducir un chime sutil y agradable al recibir pedidos web
 * de forma nativa sin depender de archivos de audio externos.
 * ==========================================================================*/

let audioCtx = null;

/**
 * Reproduce un chime suave de dos tonos (D5 -> A5) con decaimiento exponencial.
 */
export function reproducirChimeNotificacion() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const t = audioCtx.currentTime;

    // Tono 1: Re (D5 - 587.33 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, t);
    gain1.gain.setValueAtTime(0.18, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(t);
    osc1.stop(t + 0.28);

    // Tono 2: La (A5 - 880 Hz) con textura suave
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, t + 0.1);
    gain2.gain.setValueAtTime(0.22, t + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.55);
  } catch (err) {
    console.warn("[Sonido] No se pudo reproducir el chime de notificación:", err);
  }
}

/**
 * Reproduce un bip corto de alerta con Web Audio API para aviso de stock mínimo.
 * Utiliza un OscillatorNode (sine, ~880 Hz) con GainNode bajo (~0.1),
 * suena ~0.25 s con fade-out y cierra el contexto al terminar.
 */
export function reproducirAlertaStock() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);

    osc.onended = () => {
      ctx.close().catch(() => {});
    };
  } catch {
    // Ignorar si el audio no está disponible o está bloqueado en el navegador
  }
}

