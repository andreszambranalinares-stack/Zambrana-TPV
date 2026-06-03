// ──────────────────────────────────────────────────────────────────────────────
// Contrato de un proveedor de sincronización.
//
// Un proveedor traslada los cambios de estado entre dispositivos. La app no sabe
// (ni le importa) si por debajo hay BroadcastChannel, Supabase o, en el futuro, un
// servidor local en el PC de barra. Todos cumplen esta misma forma:
//
//   init(onRemoteChange, onStatus)
//       onRemoteChange(message)  → se llama cuando llega un cambio de OTRO origen.
//                                  message = { type:'STATE_UPDATE', key, state }
//                                  (o cualquier otro mensaje, p.ej. { type:'NEW_ORDER' })
//       onStatus(status)         → 'online' | 'offline' | 'connecting' | 'local'
//
//   set(key, value)              → propaga un cambio LOCAL hacia los demás.
//   flushOutbox()                → reintenta los envíos que quedaron pendientes sin red.
//
// Esta clase base define los no-ops; cada proveedor concreto sobrescribe lo suyo.
// ──────────────────────────────────────────────────────────────────────────────

export class SyncProvider {
    constructor() {
        this.name = 'base';
        this.status = 'offline';
        this.onRemoteChange = null;
        this.onStatus = null;
    }

    async init(onRemoteChange, onStatus) {
        this.onRemoteChange = onRemoteChange;
        this.onStatus = onStatus;
    }

    set(_key, _value) {}

    flushOutbox() {}

    _setStatus(status) {
        this.status = status;
        if (this.onStatus) this.onStatus(status);
    }
}
