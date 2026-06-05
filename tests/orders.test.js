import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyOrderUpdate } from '../js/orders.js';

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
