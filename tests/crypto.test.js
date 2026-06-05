import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeHash, verifyHash, hashSecret, makeSalt } from '../js/crypto.js';

test('verifica el secreto correcto y rechaza el incorrecto', async () => {
    const h = await makeHash('1234');
    assert.ok(h.hash && h.salt, 'devuelve {hash, salt}');
    assert.equal(await verifyHash('1234', h), true);
    assert.equal(await verifyHash('0000', h), false);
});

test('el hash no es el secreto en claro', async () => {
    const h = await makeHash('1234');
    assert.notEqual(h.hash, '1234');
    assert.ok(h.hash.length >= 64); // SHA-256 hex
});

test('misma sal → mismo hash; distinta sal → distinto', async () => {
    const s = makeSalt();
    assert.equal(await hashSecret('x', s), await hashSecret('x', s));
    assert.notEqual(await hashSecret('x', s), await hashSecret('x', makeSalt()));
});

test('verifyHash con datos faltantes devuelve false', async () => {
    assert.equal(await verifyHash('x', null), false);
    assert.equal(await verifyHash('x', {}), false);
    assert.equal(await verifyHash('x', { hash: 'a' }), false);
});
