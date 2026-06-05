// ──────────────────────────────────────────────────────────────────────────────
// Lógica pura de fusión de comandas (una fila por comanda). Sin DOM ni estado
// global, para poder probarla con `node --test` (tests/orders.test.js).
//
// Inserta / actualiza / elimina una comanda concreta dentro del array en memoria,
// de forma que los cambios de un dispositivo no pisen las comandas de otro.
// ──────────────────────────────────────────────────────────────────────────────

export function applyOrderUpdate(orders, id, order, deleted) {
    const idx = orders.findIndex(o => o.id === id);
    if (deleted || order == null) {
        if (idx > -1) orders.splice(idx, 1);
    } else if (idx > -1) {
        orders[idx] = order;
    } else {
        orders.push(order);
    }
    return orders;
}
