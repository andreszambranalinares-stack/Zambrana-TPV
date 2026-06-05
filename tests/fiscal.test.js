import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    ivaBreakdown, sumTotal, round2, ivaRateOf,
    defaultIvaForItem, isAlcohol, formatInvoiceNumber
} from '../js/fiscal.js';

test('sumTotal suma líneas con cantidad', () => {
    assert.equal(sumTotal([{ price: 2.5, qty: 2 }, { price: 12.5, qty: 1 }]), 17.5);
    assert.equal(sumTotal([]), 0);
});

test('ivaRateOf devuelve 10 por defecto', () => {
    assert.equal(ivaRateOf({}), 10);
    assert.equal(ivaRateOf({ ivaRate: 21 }), 21);
    assert.equal(ivaRateOf({ ivaRate: '4' }), 4);
});

test('ivaBreakdown separa tipos 10% y 21%', () => {
    const items = [
        { name: 'Plato', price: 12.5, qty: 1, ivaRate: 10 },
        { name: 'Caña', price: 2.5, qty: 2, ivaRate: 21 }
    ];
    const b = ivaBreakdown(items);
    assert.equal(b.total, 17.5);
    const r10 = b.rows.find(r => r.rate === 10);
    const r21 = b.rows.find(r => r.rate === 21);
    assert.equal(r10.total, 12.5);
    assert.equal(r21.total, 5);
    // base + cuota cuadra con el total de cada tipo
    assert.equal(round2(r10.base + r10.cuota), 12.5);
    assert.equal(round2(r21.base + r21.cuota), 5);
    // y los agregados también cuadran
    assert.equal(round2(b.base + b.cuota), b.total);
});

test('cuota 21% de 5€ = 0.87 (base 4.13)', () => {
    const b = ivaBreakdown([{ price: 5, qty: 1, ivaRate: 21 }]);
    assert.equal(b.rows[0].base, 4.13);
    assert.equal(b.rows[0].cuota, 0.87);
});

test('filas ordenadas de mayor a menor tipo', () => {
    const b = ivaBreakdown([
        { price: 5, qty: 1, ivaRate: 10 },
        { price: 5, qty: 1, ivaRate: 21 }
    ]);
    assert.deepEqual(b.rows.map(r => r.rate), [21, 10]);
});

test('isAlcohol / defaultIvaForItem', () => {
    assert.equal(isAlcohol('Cerveza caña'), true);
    assert.equal(isAlcohol('Vino tinto copa'), true);
    assert.equal(isAlcohol('Agua 50cl'), false);
    assert.equal(defaultIvaForItem({ name: 'Sangría jarra' }), 21);
    assert.equal(defaultIvaForItem({ name: 'Pan con tomate' }), 10);
    assert.equal(defaultIvaForItem({ name: 'Café con leche' }), 10);
});

test('formatInvoiceNumber con padding y año', () => {
    assert.equal(formatInvoiceNumber(123, new Date('2026-06-06')), '2026-000123');
    assert.equal(formatInvoiceNumber(1, new Date('2026-01-01')), '2026-000001');
});
