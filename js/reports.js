// ──────────────────────────────────────────────────────────────────────────────
// Informes de caja (X y Z). Funciones PURAS sobre los datos del turno, sin DOM ni
// estado global (tests/reports.test.js).
//
//   buildShiftReport({ tickets, payments, shift })  →  objeto informe agregado.
//   reportToCSV(report)                             →  string CSV exportable.
//
// El informe X es una foto del turno en curso; el informe Z es el mismo cálculo al
// cerrar caja (se archiva en shift_history). Ambos usan esta misma función.
// ──────────────────────────────────────────────────────────────────────────────

import { round2 } from './fiscal.js';

export function buildShiftReport({ tickets = [], payments = [], shift = {} } = {}) {
    const cobros = (tickets || []).filter(t => t && t.type === 'cobro');

    const totalSales = round2(cobros.reduce((s, t) => s + (Number(t.total) || 0), 0));
    const count = cobros.length;
    const avg = count ? round2(totalSales / count) : 0;

    // Por método de pago.
    const byMethod = {};
    cobros.forEach(t => {
        const m = t.method || 'otro';
        byMethod[m] = round2((byMethod[m] || 0) + (Number(t.total) || 0));
    });

    // Por tipo de IVA (suma de las filas de cada ticket).
    const ivaMap = new Map();
    cobros.forEach(t => {
        (t.iva && t.iva.rows ? t.iva.rows : []).forEach(r => {
            const cur = ivaMap.get(r.rate) || { base: 0, cuota: 0, total: 0 };
            ivaMap.set(r.rate, {
                base: round2(cur.base + (r.base || 0)),
                cuota: round2(cur.cuota + (r.cuota || 0)),
                total: round2(cur.total + (r.total || 0))
            });
        });
    });
    const iva = [...ivaMap.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([rate, v]) => ({ rate, ...v }));

    // Por producto y por categoría (desde las líneas guardadas en el ticket).
    const products = {};
    const categories = {};
    cobros.forEach(t => {
        (t.lines || []).forEach(l => {
            const qty = Number(l.qty) || 0;
            const lineTot = round2((Number(l.price) || 0) * qty);
            const pk = l.name || '—';
            if (!products[pk]) products[pk] = { name: pk, qty: 0, total: 0 };
            products[pk].qty += qty;
            products[pk].total = round2(products[pk].total + lineTot);

            const ck = l.category || 'Otros';
            if (!categories[ck]) categories[ck] = { category: ck, qty: 0, total: 0 };
            categories[ck].qty += qty;
            categories[ck].total = round2(categories[ck].total + lineTot);
        });
    });

    // Por camarero.
    const waiters = {};
    cobros.forEach(t => {
        const w = t.waiter || '—';
        if (!waiters[w]) waiters[w] = { waiter: w, count: 0, total: 0 };
        waiters[w].count += 1;
        waiters[w].total = round2(waiters[w].total + (Number(t.total) || 0));
    });

    // Pagos a empleados realizados (salida de caja), por si interesa cuadrar.
    const totalPaidOut = round2((payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0));

    return {
        generatedAt: Date.now(),
        shiftStart: shift.startTime || null,
        totalSales,
        count,
        avg,
        byMethod,
        iva,
        topProducts: Object.values(products).sort((a, b) => b.qty - a.qty),
        categories: Object.values(categories).sort((a, b) => b.total - a.total),
        waiters: Object.values(waiters).sort((a, b) => b.total - a.total),
        totalPaidOut
    };
}

// Exporta el informe a CSV (por secciones). Apto para abrir en Excel/Sheets.
export function reportToCSV(report) {
    const rows = [];
    const esc = (v) => {
        const s = String(v == null ? '' : v);
        return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const line = (...cells) => rows.push(cells.map(esc).join(';'));

    line('INFORME DE CAJA');
    line('Generado', new Date(report.generatedAt).toLocaleString('es-ES'));
    if (report.shiftStart) line('Inicio turno', new Date(report.shiftStart).toLocaleString('es-ES'));
    line('Ventas totales', report.totalSales);
    line('Tickets', report.count);
    line('Ticket medio', report.avg);
    line('');

    line('MÉTODO DE PAGO', 'Importe');
    Object.entries(report.byMethod).forEach(([m, v]) => line(m, v));
    line('');

    line('IVA', 'Base', 'Cuota', 'Total');
    report.iva.forEach(r => line(`${r.rate}%`, r.base, r.cuota, r.total));
    line('');

    line('CATEGORÍA', 'Unidades', 'Total');
    report.categories.forEach(c => line(c.category, c.qty, c.total));
    line('');

    line('PRODUCTO', 'Unidades', 'Total');
    report.topProducts.forEach(p => line(p.name, p.qty, p.total));
    line('');

    line('CAMARERO', 'Tickets', 'Total');
    report.waiters.forEach(w => line(w.waiter, w.count, w.total));

    return rows.join('\n');
}
