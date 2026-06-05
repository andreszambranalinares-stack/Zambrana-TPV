import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShiftReport, reportToCSV } from '../js/reports.js';

const sampleTickets = [
    {
        type: 'cobro', total: 17.5, method: 'efectivo', waiter: 'Ana',
        iva: { rows: [{ rate: 21, base: 4.13, cuota: 0.87, total: 5 }, { rate: 10, base: 11.36, cuota: 1.14, total: 12.5 }] },
        lines: [
            { name: 'Plato', qty: 1, price: 12.5, category: 'Carnes' },
            { name: 'Caña', qty: 2, price: 2.5, category: 'Bebidas' }
        ]
    },
    {
        type: 'cobro', total: 10, method: 'tarjeta', waiter: 'Ana',
        iva: { rows: [{ rate: 10, base: 9.09, cuota: 0.91, total: 10 }] },
        lines: [{ name: 'Plato', qty: 1, price: 10, category: 'Carnes' }]
    },
    { type: 'comanda' } // se ignora
];

test('totales, conteo y ticket medio', () => {
    const r = buildShiftReport({ tickets: sampleTickets });
    assert.equal(r.totalSales, 27.5);
    assert.equal(r.count, 2);
    assert.equal(r.avg, 13.75);
});

test('agrupa por método de pago', () => {
    const r = buildShiftReport({ tickets: sampleTickets });
    assert.equal(r.byMethod.efectivo, 17.5);
    assert.equal(r.byMethod.tarjeta, 10);
});

test('agrega IVA por tipo (ordenado desc)', () => {
    const r = buildShiftReport({ tickets: sampleTickets });
    assert.deepEqual(r.iva.map(x => x.rate), [21, 10]);
    const r10 = r.iva.find(x => x.rate === 10);
    assert.equal(r10.total, 22.5); // 12.5 + 10
    assert.equal(r10.cuota, 2.05); // 1.14 + 0.91
});

test('top productos y categorías', () => {
    const r = buildShiftReport({ tickets: sampleTickets });
    const plato = r.topProducts.find(p => p.name === 'Plato');
    assert.equal(plato.qty, 2);
    assert.equal(plato.total, 22.5);
    const carnes = r.categories.find(c => c.category === 'Carnes');
    assert.equal(carnes.total, 22.5);
});

test('ventas por camarero', () => {
    const r = buildShiftReport({ tickets: sampleTickets });
    const ana = r.waiters.find(w => w.waiter === 'Ana');
    assert.equal(ana.count, 2);
    assert.equal(ana.total, 27.5);
});

test('suma pagos a empleados (salida de caja)', () => {
    const r = buildShiftReport({ tickets: sampleTickets, payments: [{ amount: 50 }, { amount: 20 }] });
    assert.equal(r.totalPaidOut, 70);
});

test('informe vacío no rompe', () => {
    const r = buildShiftReport({});
    assert.equal(r.totalSales, 0);
    assert.equal(r.count, 0);
    assert.equal(r.avg, 0);
});

test('reportToCSV incluye cabeceras de sección', () => {
    const csv = reportToCSV(buildShiftReport({ tickets: sampleTickets }));
    assert.match(csv, /INFORME DE CAJA/);
    assert.match(csv, /MÉTODO DE PAGO/);
    assert.match(csv, /IVA;Base;Cuota;Total/);
    assert.match(csv, /CAMARERO/);
});
