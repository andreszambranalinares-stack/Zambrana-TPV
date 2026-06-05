// ──────────────────────────────────────────────────────────────────────────────
// Cálculo fiscal (IVA) y numeración de facturas. Funciones PURAS, sin DOM ni estado
// global, para poder probarlas con `node --test` (tests/fiscal.test.js).
//
// Convención: el `price` de cada producto es el PVP **con IVA incluido** (lo que paga
// el cliente). Por eso la base imponible se obtiene "desbrozando" el IVA hacia atrás:
//     base = total / (1 + tipo/100)     cuota = total - base
//
// Los importes se redondean a 2 decimales (céntimos) en cada paso, de forma que la
// suma de bases + cuotas cuadre con el total mostrado.
// ──────────────────────────────────────────────────────────────────────────────

// Tipos de IVA admitidos en hostelería (España).
export const IVA_RATES = [21, 10, 4, 0];

export function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Importe (con IVA) de una línea de comanda.
export function lineTotal(item) {
    const qty = Number(item && item.qty) || 0;
    const price = Number(item && item.price) || 0;
    return round2(price * qty);
}

// Total (con IVA) de un conjunto de líneas.
export function sumTotal(items) {
    return round2((items || []).reduce((s, i) => s + lineTotal(i), 0));
}

// Tipo de IVA de un item (por defecto 10% si no está definido).
export function ivaRateOf(item) {
    const r = Number(item && item.ivaRate);
    return Number.isFinite(r) ? r : 10;
}

// Desglose del IVA por tipo. Devuelve filas ordenadas de mayor a menor tipo y los
// totales agregados: { rows: [{rate, base, cuota, total}], base, cuota, total }.
export function ivaBreakdown(items) {
    const byRate = new Map();
    (items || []).forEach(i => {
        const rate = ivaRateOf(i);
        const total = lineTotal(i);
        byRate.set(rate, round2((byRate.get(rate) || 0) + total));
    });

    const rows = [];
    let totalAll = 0, baseAll = 0, cuotaAll = 0;
    [...byRate.keys()].sort((a, b) => b - a).forEach(rate => {
        const total = byRate.get(rate);
        const base = round2(total / (1 + rate / 100));
        const cuota = round2(total - base);
        rows.push({ rate, base, cuota, total });
        totalAll = round2(totalAll + total);
        baseAll = round2(baseAll + base);
        cuotaAll = round2(cuotaAll + cuota);
    });
    return { rows, base: baseAll, cuota: cuotaAll, total: totalAll };
}

// Heurística: ¿es una bebida alcohólica? (para asignar 21% por defecto).
export function isAlcohol(name = '') {
    return /(cerveza|vino|sangr[ií]a|cava|brandy|manzanilla|tinto de verano|whisky|whiskey|ron\b|ginebra|vermut|licor|chupito|gin\b|tonic)/i.test(name);
}

// IVA por defecto de un producto: hostelería 10%, salvo bebida alcohólica 21%.
export function defaultIvaForItem(item) {
    if (item && isAlcohol(item.name)) return 21;
    return 10;
}

// Número de factura legible: AAAA-000123.
export function formatInvoiceNumber(seq, date = new Date()) {
    const year = (date instanceof Date ? date : new Date(date)).getFullYear();
    const n = String(seq).padStart(6, '0');
    return `${year}-${n}`;
}
