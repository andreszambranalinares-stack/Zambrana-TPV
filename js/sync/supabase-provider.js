import { SyncProvider } from './provider.js';

// ──────────────────────────────────────────────────────────────────────────────
// Proveedor SUPABASE: sincroniza entre dispositivos distintos a través de la nube.
//
// Modelo clave/valor en la tabla `app_state` (espejo del estado local):
//   tenant_id | key | value (jsonb) | source_id | updated_at
//
// - set(key, value)  → upsert de la fila (key). Si no hay red, lo encola (outbox).
// - Realtime         → escucha cambios de OTROS dispositivos y los reinyecta.
//                      Ignora los ecos de los cambios propios (source_id == deviceId).
// - hydrate()        → al conectar, descarga todo el estado actual del servidor.
// ──────────────────────────────────────────────────────────────────────────────

const OUTBOX_KEY = 'zambrana_outbox';

export class SupabaseProvider extends SyncProvider {
    constructor(client, tenantId, deviceId) {
        super();
        this.name = 'supabase';
        this.status = 'connecting';
        this.client = client;
        this.tenant = tenantId;
        this.deviceId = deviceId;
        this.rtChannel = null;
    }

    async init(onRemoteChange, onStatus) {
        await super.init(onRemoteChange, onStatus);
        this._setStatus('connecting');

        this.rtChannel = this.client
            .channel(`app_state_${this.tenant}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'app_state', filter: `tenant_id=eq.${this.tenant}` },
                (payload) => {
                    const row = payload.new && Object.keys(payload.new).length ? payload.new : payload.old;
                    if (!row || row.key === undefined) return;
                    if (row.source_id && row.source_id === this.deviceId) return; // ignora eco propio
                    if (this.onRemoteChange) {
                        this.onRemoteChange({ type: 'STATE_UPDATE', key: row.key, state: row.value });
                    }
                })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    this._setStatus('online');
                    // Primero subimos lo que quedó pendiente sin red, luego descargamos
                    // el estado del servidor (así no se pierden los cambios offline).
                    await this.flushOutbox();
                    await this.hydrate();
                } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
                    this._setStatus('offline');
                }
            });

        window.addEventListener('online', () => this.flushOutbox());
        window.addEventListener('offline', () => this._setStatus('offline'));
    }

    // Descarga el estado completo del servidor y lo aplica localmente.
    async hydrate() {
        try {
            const { data, error } = await this.client
                .from('app_state')
                .select('key,value')
                .eq('tenant_id', this.tenant);
            if (error) { console.error('[Supabase] hydrate', error); return; }
            (data || []).forEach(row => {
                if (this.onRemoteChange) {
                    this.onRemoteChange({ type: 'STATE_UPDATE', key: row.key, state: row.value });
                }
            });
        } catch (e) {
            console.error('[Supabase] hydrate', e);
        }
    }

    async set(key, value) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            this._enqueue(key, value);
            this._setStatus('offline');
            return;
        }
        try {
            const { error } = await this.client.from('app_state').upsert({
                tenant_id: this.tenant,
                key,
                value,
                source_id: this.deviceId,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'tenant_id,key' });
            if (error) {
                console.error('[Supabase] set', error);
                this._enqueue(key, value);
                this._setStatus('offline');
            } else {
                this._setStatus('online');
            }
        } catch (e) {
            console.error('[Supabase] set', e);
            this._enqueue(key, value);
            this._setStatus('offline');
        }
    }

    // ── Outbox: cola de envíos pendientes cuando no hay red ────────────────────
    _readOutbox() {
        try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '{}'); }
        catch (e) { return {}; }
    }

    _writeOutbox(box) {
        localStorage.setItem(OUTBOX_KEY, JSON.stringify(box));
    }

    _enqueue(key, value) {
        const box = this._readOutbox();
        box[key] = value; // se guarda el último valor por key (gana el más reciente)
        this._writeOutbox(box);
    }

    async flushOutbox() {
        const box = this._readOutbox();
        const keys = Object.keys(box);
        if (keys.length === 0) return;
        for (const key of keys) {
            try {
                const { error } = await this.client.from('app_state').upsert({
                    tenant_id: this.tenant,
                    key,
                    value: box[key],
                    source_id: this.deviceId,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'tenant_id,key' });
                if (error) { console.error('[Supabase] flush', error); return; }
                delete box[key];
                this._writeOutbox(box);
            } catch (e) {
                console.error('[Supabase] flush', e);
                return; // dejamos el resto para el siguiente intento
            }
        }
        this._setStatus('online');
    }
}
