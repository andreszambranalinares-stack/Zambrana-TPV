import { SyncProvider } from './provider.js';

// ──────────────────────────────────────────────────────────────────────────────
// Proveedor LOCAL: sincroniza entre pestañas/ventanas del MISMO navegador usando
// BroadcastChannel (+ fallback con eventos de localStorage para Safari).
//
// Es la lógica que tenía la app desde el principio. Ahora cumple dos papeles:
//   1. Sincronización instantánea entre pestañas del mismo dispositivo.
//   2. Base para el futuro modo "servidor local en el PC de barra".
//
// Siempre está activo (incluso con la nube encendida) porque es gratis y al
// instante para el mismo equipo.
// ──────────────────────────────────────────────────────────────────────────────

const CHANNEL_NAME = 'zambrana_channel';
const TRIGGER_KEY = 'zambrana_state_update';

export class LocalProvider extends SyncProvider {
    constructor() {
        super();
        this.name = 'local';
        this.status = 'online';
        this.channel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel(CHANNEL_NAME) : null;
    }

    async init(onRemoteChange, onStatus) {
        await super.init(onRemoteChange, onStatus);

        if (this.channel) {
            this.channel.onmessage = (event) => this._dispatch(event.data);
        }

        // Fallback para navegadores sin BroadcastChannel (eventos de storage).
        window.addEventListener('storage', (event) => {
            if (event.key === TRIGGER_KEY && event.newValue) {
                try { this._dispatch(JSON.parse(event.newValue)); } catch (e) { /* ignore */ }
            }
        });

        this._setStatus('online');
    }

    _dispatch(data) {
        if (this.onRemoteChange) this.onRemoteChange(data);
    }

    // Propaga un cambio de estado a las demás pestañas de este equipo.
    // Con deleted=true indica que la clave debe eliminarse (p. ej. comanda cerrada).
    set(key, value, deleted = false) {
        this._broadcast({ type: 'STATE_UPDATE', key, state: value, deleted });
    }

    // Difunde un mensaje arbitrario (p.ej. { type:'NEW_ORDER' }) por el mismo canal.
    _broadcast(message) {
        if (this.channel) this.channel.postMessage(message);
        // Disparo por evento de storage (otras pestañas que no oigan el canal).
        try {
            localStorage.setItem(TRIGGER_KEY, JSON.stringify({ ...message, ts: Date.now() }));
        } catch (e) { /* ignore */ }
    }
}
