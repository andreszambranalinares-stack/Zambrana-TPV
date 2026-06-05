import { config, resolveSyncMode } from './config.js';
import { LocalProvider } from './sync/local-provider.js';

// ──────────────────────────────────────────────────────────────────────────────
// Orquestador de almacenamiento (offline-first).
//
// - localStorage es la fuente de LECTURA inmediata: la UI es instantánea y funciona
//   sin conexión.
// - Cada escritura: 1) cachea en localStorage, 2) avisa a las otras pestañas del
//   equipo (LocalProvider) y 3) la sube a la nube si está activa (SupabaseProvider).
// - Los cambios entrantes (de otra pestaña o de otro dispositivo) pasan todos por
//   handleIncoming(): refrescan la caché y disparan el mismo mensaje STATE_UPDATE
//   que state.js ya escuchaba → así el resto de la app no cambia.
//
// La API pública (saveState, loadState, subscribe, notifyListeners, channel) se
// mantiene idéntica para no tocar state.js ni la UI.
// ──────────────────────────────────────────────────────────────────────────────

export class StorageManager {
    constructor() {
        this.listeners = [];

        // Proveedor local: siempre activo (sincroniza pestañas del mismo equipo).
        this.local = new LocalProvider();
        // Se preserva `storage.channel` (state.js lo usa para el aviso NEW_ORDER).
        this.channel = this.local.channel;

        // Proveedor en la nube (se inicializa de forma asíncrona si está configurado).
        this.cloud = null;

        // Estado de sincronización: 'local' | 'connecting' | 'online' | 'offline'
        this.syncStatus = 'local';
        this.onSyncStatus = null;

        // Recepción de cambios (mismo equipo) e inicialización.
        this.local.init((data) => this.handleIncoming(data), null);

        // Arranque de la nube (no bloquea; la app ya funciona en local).
        this.initCloud();
    }

    async initCloud() {
        if (resolveSyncMode() !== 'cloud') {
            this.setSyncStatus('local');
            return;
        }
        if (typeof window === 'undefined' || !window.supabase || !window.supabase.createClient) {
            console.warn('[Zambrana] SDK de Supabase no disponible — funcionando en modo local.');
            this.setSyncStatus('local');
            return;
        }
        try {
            // Normaliza la URL: el cliente necesita la URL BASE del proyecto, no el
            // endpoint REST. Quita '/rest/v1', '/auth/v1' y barras finales por si se pegó de más.
            const baseUrl = config.SUPABASE_URL
                .trim()
                .replace(/\/(rest|auth|realtime|storage)\/v1\/?$/i, '')
                .replace(/\/+$/, '');
            const client = window.supabase.createClient(baseUrl, config.SUPABASE_ANON_KEY);
            const deviceId = localStorage.getItem('ztpv_current_device_id') || ('dev-' + Date.now());
            const { SupabaseProvider } = await import('./sync/supabase-provider.js');
            this.cloud = new SupabaseProvider(client, config.TENANT_ID, deviceId);
            await this.cloud.init(
                (data) => this.handleIncoming(data),
                (status) => this.setSyncStatus(status)
            );
        } catch (e) {
            console.error('[Zambrana] No se pudo iniciar la nube — modo local.', e);
            this.setSyncStatus('local');
        }
    }

    // Cliente Supabase activo (o null en modo local). Lo usa la cuenta segura (Auth).
    getCloudClient() {
        return this.cloud ? this.cloud.client : null;
    }

    // Número de factura para un cobro. Online: contador atómico en la nube (secuencia
    // legal, sin colisiones entre dispositivos). Offline / local: secuencia provisional
    // por dispositivo (marcada como tal).
    async getInvoiceNumber() {
        if (this.cloud && this.syncStatus === 'online') {
            try {
                const seq = await this.cloud.nextCounter('invoice');
                return { seq, provisional: false };
            } catch (e) {
                console.warn('[Zambrana] nextCounter falló, número provisional local.', e);
            }
        }
        const k = 'zambrana_invoice_local';
        const n = (parseInt(localStorage.getItem(k) || '0', 10) || 0) + 1;
        localStorage.setItem(k, String(n));
        const dev = (localStorage.getItem('ztpv_current_device_id') || 'L').slice(-4);
        return { seq: n, provisional: true, deviceTag: dev };
    }

    setSyncStatus(status) {
        this.syncStatus = status;
        if (this.onSyncStatus) this.onSyncStatus(status);
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    unsubscribe(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    notifyListeners(data) {
        this.listeners.forEach(cb => cb(data));
    }

    // Punto único de entrada para cambios que vienen de FUERA (otra pestaña / nube).
    handleIncoming(data) {
        if (!data) return;
        if (data.type === 'STATE_UPDATE' && data.key !== undefined) {
            if (data.deleted) {
                // Borrado entrante: quitar la clave de la caché local.
                localStorage.removeItem(`zambrana_${data.key}`);
            } else {
                // Mantener la caché local fresca (imprescindible entre dispositivos).
                try { localStorage.setItem(`zambrana_${data.key}`, JSON.stringify(data.state)); }
                catch (e) { /* ignore */ }
            }
        }
        this.notifyListeners(data);
    }

    // Guarda y propaga un cambio LOCAL.
    saveState(key, state) {
        // 1. Caché inmediata (lectura offline-first).
        localStorage.setItem(`zambrana_${key}`, JSON.stringify(state));
        // 2. Otras pestañas del mismo equipo.
        this.local.set(key, state);
        // 3. Nube (si está activa).
        if (this.cloud) this.cloud.set(key, state);
    }

    // Elimina una clave (p. ej. una comanda antigua) localmente y en la nube, y
    // avisa al resto de pestañas/dispositivos para que la quiten también.
    removeState(key) {
        localStorage.removeItem(`zambrana_${key}`);
        this.local.set(key, null, true);
        if (this.cloud) this.cloud.remove(key);
    }

    loadState(key) {
        const data = localStorage.getItem(`zambrana_${key}`);
        return data ? JSON.parse(data) : null;
    }

    // Devuelve todas las keys de estado guardadas (para copias de seguridad).
    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('zambrana_') && k !== 'zambrana_state_update') {
                keys.push(k.slice('zambrana_'.length));
            }
        }
        return keys;
    }
}

export const storage = new StorageManager();
