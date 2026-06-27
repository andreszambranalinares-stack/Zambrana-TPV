// ──────────────────────────────────────────────────────────────────────────────
// Auto-impresión de comandas POR ESTACIÓN.
//
// Montaje previsto: un dispositivo por estación (una tablet/PC en cocina con su
// impresora, otra en barra con la suya). Cada equipo, cuando le llega una comanda
// nueva de SU estación, la imprime contra su impresora predeterminada vía
// window.print() (ver tickets.printStationComanda). El "enrutado" cocina/barra lo da
// el propio equipo: no hace falta elegir impresora por código.
//
// El disparador fiable entre dispositivos NO es el beep `NEW_ORDER` (solo viaja en el
// mismo equipo), sino la llegada de la comanda a `globalState.orders` vía Realtime,
// que termina en notifyListeners('orders'). Por eso esto se engancha a la suscripción
// de estado en app.js.
//
// Estado guardado por dispositivo en localStorage (no en la comanda, que se
// sincronizaría a todos los equipos):
//   - ztpv_autoprint            '1' | '0'  → auto-impresión activada en este equipo
//   - ztpv_printed_comandas     JSON array → ids de comandas ya impresas aquí (acotado)
// ──────────────────────────────────────────────────────────────────────────────

import { globalState } from './state.js';
import { tickets } from './tickets.js';
import { selectUnprinted } from './orders.js';

const AUTOPRINT_KEY = 'ztpv_autoprint';
const PRINTED_KEY = 'ztpv_printed_comandas';
const MAX_PRINTED = 300;

export function isAutoPrintEnabled() {
    return localStorage.getItem(AUTOPRINT_KEY) === '1';
}

export function setAutoPrint(on) {
    localStorage.setItem(AUTOPRINT_KEY, on ? '1' : '0');
}

function getPrinted() {
    try { return JSON.parse(localStorage.getItem(PRINTED_KEY) || '[]'); }
    catch (e) { return []; }
}

function savePrinted(list) {
    while (list.length > MAX_PRINTED) list.shift();
    localStorage.setItem(PRINTED_KEY, JSON.stringify(list));
}

function markPrinted(id) {
    const list = getPrinted();
    if (list.includes(id)) return;
    list.push(id);
    savePrinted(list);
}

// Marca como "ya vistas" todas las comandas activas de la estación SIN imprimirlas.
// Se llama al ACTIVAR la auto-impresión para no volcar de golpe el backlog que ya
// estaba en pantalla; a partir de ahí solo se imprimen las nuevas.
export function markStationPrinted(station) {
    const pending = selectUnprinted(globalState.orders, station, getPrinted());
    if (!pending.length) return;
    const list = getPrinted();
    pending.forEach(o => { if (!list.includes(o.id)) list.push(o.id); });
    savePrinted(list);
}

// Imprime las comandas nuevas de la estación que aún no se han impreso en este equipo.
// No-op si la auto-impresión está desactivada.
export function autoPrintFor(station) {
    if (!isAutoPrintEnabled()) return;
    const pending = selectUnprinted(globalState.orders, station, getPrinted());
    pending.forEach(order => {
        tickets.printStationComanda(order);
        markPrinted(order.id);
    });
}
