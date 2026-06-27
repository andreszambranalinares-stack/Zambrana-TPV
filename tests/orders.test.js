import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyOrderUpdate, selectUnprinted } from '../js/orders.js';

test('inserta una comanda nueva', () => {
    const arr = [];
    applyOrderUpdate(arr, 'a', { id: 'a', x: 1 }, false);
    assert.deepEqual(arr, [{ id: 'a', x: 1 }]);
});

test('actualiza una comanda existente sin duplicar', () => {
    const arr = [{ id: 'a', x: 1 }];
    applyOrderUpdate(arr, 'a', { id: 'a', x: 2 }, false);
    assert.deepEqual(arr, [{ id: 'a', x: 2 }]);
});

test('elimina con deleted=true', () => {
    const arr = [{ id: 'a' }, { id: 'b' }];
    applyOrderUpdate(arr, 'a', null, true);
    assert.deepEqual(arr, [{ id: 'b' }]);
});

test('borrar inexistente no rompe', () => {
    const arr = [{ id: 'b' }];
    applyOrderUpdate(arr, 'z', null, true);
    assert.deepEqual(arr, [{ id: 'b' }]);
});

test('dos comandas distintas a la vez no se pisan', () => {
    const arr = [];
    applyOrderUpdate(arr, 'a', { id: 'a' }, false);
    applyOrderUpdate(arr, 'b', { id: 'b' }, false);
    assert.equal(arr.length, 2);
    assert.deepEqual(arr.map(o => o.id), ['a', 'b']);
});

test('state nulo (sin order y sin deleted) elimina si existe', () => {
    const arr = [{ id: 'a' }];
    applyOrderUpdate(arr, 'a', null, false);
    assert.deepEqual(arr, []);
});

// ── selectUnprinted: qué comandas debe imprimir un dispositivo de estación ──────
const sampleOrders = [
    { id: 'k1', dest: 'cocina', status: 'en_cocina' },
    { id: 'k2', dest: 'cocina', status: 'listo' },     // ya no en preparación
    { id: 'b1', dest: 'barra',  status: 'en_barra' },
    { id: 'k3', dest: 'cocina', status: 'en_cocina' },
];

test('selectUnprinted devuelve solo comandas de la estación en preparación', () => {
    const r = selectUnprinted(sampleOrders, 'cocina', []);
    assert.deepEqual(r.map(o => o.id), ['k1', 'k3']);
});

test('selectUnprinted excluye las ya impresas en este equipo', () => {
    const r = selectUnprinted(sampleOrders, 'cocina', ['k1']);
    assert.deepEqual(r.map(o => o.id), ['k3']);
});

test('selectUnprinted separa cocina de barra', () => {
    const r = selectUnprinted(sampleOrders, 'barra', []);
    assert.deepEqual(r.map(o => o.id), ['b1']);
});

test('selectUnprinted tolera entradas vacías', () => {
    assert.deepEqual(selectUnprinted(undefined, 'cocina', undefined), []);
});
