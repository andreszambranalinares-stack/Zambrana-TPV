// ──────────────────────────────────────────────────────────────────────────────
// Utilidades de cifrado (Web Crypto API).
//
// Sirve para NO guardar nunca en claro los PIN de los empleados ni la contraseña
// del administrador. Guardamos un hash SHA-256 salado: del hash no se puede volver
// al PIN original, así que aunque alguien vea los datos no obtiene la clave.
//
//   { hash, salt }  →  se guarda en el empleado / config
//   verify(pin, {hash, salt})  →  true/false sin desvelar el original
//
// Compatibilidad: si un empleado todavía tiene `pin` en texto plano (datos antiguos),
// las funciones de verificación lo aceptan y la app lo migra a hash al vuelo.
// ──────────────────────────────────────────────────────────────────────────────

const enc = new TextEncoder();

function bufToHex(buf) {
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Genera una sal aleatoria (hex de 16 bytes).
export function makeSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return bufToHex(arr);
}

// Calcula el hash SHA-256 de `secret + salt`.
export async function hashSecret(secret, salt) {
    const data = enc.encode(String(secret) + '::' + String(salt));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return bufToHex(digest);
}

// Crea un objeto {hash, salt} a partir de un secreto en claro.
export async function makeHash(secret) {
    const salt = makeSalt();
    const hash = await hashSecret(secret, salt);
    return { hash, salt };
}

// Comprueba un secreto contra un objeto {hash, salt}.
export async function verifyHash(secret, stored) {
    if (!stored || !stored.hash || !stored.salt) return false;
    const h = await hashSecret(secret, stored.salt);
    return timingSafeEqual(h, stored.hash);
}

// Comparación en tiempo constante (evita filtrar info por el tiempo de respuesta).
function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
