// ──────────────────────────────────────────────────────────────────────────────
// Configuración de Zambrana TPV
//
// Para activar la sincronización en la nube (Bloque 1):
//   1. Crea un proyecto gratis en https://supabase.com (región: Europe / EU).
//   2. En el panel: Project Settings → API → copia "Project URL" y "anon public key".
//   3. Pégalas abajo en SUPABASE_URL y SUPABASE_ANON_KEY.
//   4. Ejecuta el SQL de la guía (docs/SUPABASE_SETUP.md) en el SQL Editor de Supabase.
//
// Mientras no rellenes esos dos valores, la app sigue funcionando en modo LOCAL
// (como hasta ahora, solo en este dispositivo). En cuanto los rellenes, pasa
// automáticamente a sincronizar en la nube entre todos los dispositivos.
// ──────────────────────────────────────────────────────────────────────────────

export const config = {
    // Pega aquí los datos de tu proyecto Supabase:
    SUPABASE_URL: 'https://lsmyqbduslyyjnqcwegi.supabase.co',          // ej: 'https://abcdefgh.supabase.co'
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbXlxYmR1c2x5eWpucWN3ZWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDIyMDksImV4cCI6MjA5NjA3ODIwOX0.23YaG4_RRDnPnsiqqCvgLAc8YHOi2stqVv3A-tHIq2k',     // ej: 'eyJhbGciOi...'

    // Identificador del restaurante. Si en el futuro gestionas varios locales,
    // cada uno tendrá su propio TENANT_ID y sus datos quedan separados.
    TENANT_ID: 'zambrana-principal',

    // 'auto'  → usa la nube si hay credenciales, si no modo local
    // 'local' → fuerza modo local (sin nube)
    // 'cloud' → fuerza nube (fallará si faltan credenciales)
    SYNC_MODE: 'auto',
};

// ¿Está configurada la nube?
export function isCloudConfigured() {
    return Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
}

// Modo de sincronización efectivo, una vez resuelto 'auto'.
export function resolveSyncMode() {
    if (config.SYNC_MODE === 'local') return 'local';
    if (config.SYNC_MODE === 'cloud') return 'cloud';
    return isCloudConfigured() ? 'cloud' : 'local';
}
