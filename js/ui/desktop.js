import { globalState } from '../state.js';
import { tickets } from '../tickets.js';
import { storage } from '../storage.js';
import { deviceManager } from '../device.js';
import { renderAdmin } from './admin.js';

export function renderDesktop(container, app) {
    let activeSection = 'mesas'; // mesas | comandas | carta | informes | ajustes
    let selectedOrderId = null;
    let tableFilter = 'Todas';
    let kitchenFilter = 'Todas';

    const nav = () => `
        <nav class="desktop-nav">
            <div class="desktop-nav-brand">
                <img src="logo.png" alt="Zambrana TPV" style="height:34px;cursor:pointer;" id="btn-nav-home">
            </div>
            <div class="desktop-nav-links">
                ${[['mesas',`<i class='bx bx-grid-alt'></i> Mesas`],['comandas',`<i class='bx bx-receipt'></i> Comandas`],['carta',`<i class='bx bx-package'></i> Productos`],['informes',`<i class='bx bx-bar-chart-alt-2'></i> Informes`],['ajustes',`<i class='bx bx-cog'></i> Ajustes`]].map(([k,l])=>`
                    <button class="desktop-nav-link ${activeSection===k?'active':''}" data-section="${k}">${l}</button>
                `).join('')}
            </div>
            <div class="desktop-nav-right" style="display:flex;align-items:center;gap:1rem;">
                <span style="color:var(--color-text-muted);font-size:0.9rem;">Administrador</span>
                <button class="btn btn-secondary" id="btn-exit-desktop" style="font-size:0.85rem;padding:0.4rem 0.8rem;"><i class='bx bx-log-out'></i> Salir</button>
            </div>
        </nav>`;

    const renderMesasSection = () => {
        const zones = ['Todas', 'Terraza', 'Salón', 'Barra', 'Privado'];
        const filtered = tableFilter === 'Todas' ? globalState.tables : globalState.tables.filter(t=>t.zone===tableFilter);

        const tables = filtered.map(t => {
            let bg = 'var(--color-free)';
            let textColor = '#0D0D0D';
            if(t.status==='ocupada'||t.status==='enviada'){bg='var(--color-occupied)';textColor='white';}
            if(t.status==='reservada'){bg='var(--color-reserved)';textColor='#0D0D0D';}
            if(t.status==='cerrada'){bg='var(--color-closed)';textColor='white';}
            const order = globalState.orders.find(o=>o.tableId===t.id&&o.status!=='pagado');
            const total = order ? order.items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2) : '';
            const tourAttr = t.id === 1 ? 'data-tour="mesa-01"' : '';
            return `<div class="mobile-table-card" ${tourAttr} style="background:${bg};color:${textColor};flex-direction:column;gap:2px;cursor:pointer;" data-table-id="${t.id}">
                <span style="font-size:1.1rem;font-weight:800;">${String(t.id).padStart(2,'0')}</span>
                ${total ? `<span style="font-size:0.7rem;opacity:0.85;">${total}€</span>` : ''}
                ${t.guests ? `<span style="font-size:0.65rem;opacity:0.7;"><i class='bx bx-user'></i>${t.guests}</span>` : ''}
            </div>`;
        }).join('');

        return `
        <div style="display:grid;grid-template-columns:1fr 350px;flex:1;overflow:hidden;padding:1.5rem;gap:1.5rem;height:100%;">
            <div class="desktop-col">
                <div class="desktop-col-header">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>PLANO DE MESAS</span>
                        <button class="btn btn-secondary" id="btn-open-table-editor" style="font-size:0.8rem;padding:0.4rem 0.8rem;"><i class='bx bx-edit-alt'></i> Editor de Plano</button>
                    </div>
                    <div class="tabs-container">
                        ${zones.map(z=>`<button class="tab-pill ${tableFilter===z?'active':''}" data-zone="${z}">${z}</button>`).join('')}
                    </div>
                </div>
                <div class="desktop-col-body" style="padding:0;">
                    <div style="display:grid; grid-template-columns:repeat(8, 1fr); grid-template-rows:repeat(6, 1fr); gap:10px; background:var(--color-bg); padding:1.5rem; border-radius:12px; height:500px; position:relative;">
                        ${Array.from({length: 48}, (_, i) => {
                            const t = globalState.tables.find(table => table.gridCell === i);
                            if (!t) return `<div style="border:1px dashed var(--color-border); border-radius:8px; opacity:0.3;"></div>`;
                            
                            const isFiltered = tableFilter === 'Todas' || t.zone === tableFilter;
                            let bg = 'var(--color-free)';
                            let textColor = '#0D0D0D';
                            if(t.status==='ocupada'||t.status==='enviada'){bg='var(--color-occupied)';textColor='white';}
                            if(t.status==='reservada'){bg='var(--color-reserved)';textColor='#0D0D0D';}
                            if(t.status==='cerrada'){bg='var(--color-closed)';textColor='white';}
                            
                            const order = globalState.orders.find(o=>o.tableId===t.id&&o.status!=='pagado');
                            const total = order ? order.items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2) : '';
                            
                            return `
                            <div class="mobile-table-card" style="background:${bg}; color:${textColor}; opacity:${isFiltered?1:0.2}; transform:scale(${isFiltered?1:0.9}); cursor:pointer; grid-column:${(i%8)+1}; grid-row:${Math.floor(i/8)+1}; flex-direction:column; gap:2px; height:100%; border:2px solid ${isFiltered?'var(--color-primary)':'transparent'};" data-table-id="${t.id}">
                                <span style="font-size:1.1rem;font-weight:800;">${String(t.id).padStart(2,'0')}</span>
                                ${total ? `<span style="font-size:0.7rem;opacity:0.85;">${total}€</span>` : ''}
                                ${t.guests ? `<span style="font-size:0.65rem;opacity:0.7;"><i class='bx bx-user'></i>${t.guests}</span>` : ''}
                            </div>`;
                        }).join('')}
                    </div>
                    <div style="margin-top:1.5rem;padding:0 1rem;display:flex;gap:1.5rem;font-size:0.8rem;flex-wrap:wrap;">
                        <div><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--color-free);margin-right:4px;"></span>Libre</div>
                        <div><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--color-occupied);margin-right:4px;"></span>Ocupada</div>
                        <div><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--color-reserved);margin-right:4px;"></span>Reservada</div>
                        <div><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--color-closed);margin-right:4px;"></span>Cerrada</div>
                    </div>
                </div>
            </div>
            <div class="desktop-col" style="overflow:hidden;">
                <div class="desktop-col-header">DETALLE DE MESA</div>
                <div class="desktop-col-body" id="mesa-detail-panel">
                    <div style="text-align:center;color:var(--color-text-muted);padding:2rem 0;">Selecciona una mesa</div>
                </div>
            </div>
        </div>`;
    };

    // ── Guest count modal ──────────────────────────────────────────────────────
    const showGuestModal = (tableId, onConfirm) => {
        const existing = document.getElementById('zt-guest-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'zt-guest-modal';
        overlay.style.cssText = `
            position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;
            display:flex;align-items:center;justify-content:center;
            backdrop-filter:blur(4px);animation:fadeInModal .2s ease;
        `;
        overlay.innerHTML = `
            <style>
                @keyframes fadeInModal { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
                .guest-modal-card {
                    background:var(--color-surface);
                    border:1px solid var(--color-border);
                    border-radius:20px;
                    padding:2rem;
                    width:min(380px,92vw);
                    box-shadow:0 24px 60px rgba(0,0,0,.5);
                    text-align:center;
                }
                .guest-modal-title { font-size:1.25rem;font-weight:800;margin-bottom:0.25rem; }
                .guest-modal-sub   { font-size:0.85rem;color:var(--color-text-muted);margin-bottom:1.5rem; }
                .guest-grid {
                    display:grid;grid-template-columns:repeat(4,1fr);gap:0.6rem;margin-bottom:1.5rem;
                }
                .guest-btn {
                    aspect-ratio:1;border-radius:12px;border:2px solid var(--color-border);
                    background:var(--color-bg);color:var(--color-text);
                    font-size:1.1rem;font-weight:700;cursor:pointer;transition:all .15s;
                }
                .guest-btn:hover, .guest-btn.sel {
                    background:var(--color-primary);border-color:var(--color-primary);color:#fff;
                    transform:scale(1.06);
                }
                .guest-custom {
                    display:flex;gap:0.5rem;align-items:center;margin-bottom:1.5rem;
                }
                .guest-custom input {
                    flex:1;padding:.6rem;border-radius:10px;
                    border:1px solid var(--color-border);background:var(--color-bg);
                    color:var(--color-text);font-size:1rem;text-align:center;
                }
                .guest-confirm {
                    width:100%;padding:.75rem;border-radius:12px;border:none;
                    background:var(--color-primary);color:#fff;font-size:1rem;font-weight:700;
                    cursor:pointer;transition:background .15s;
                }
                .guest-confirm:hover { background:var(--color-primary-dark,#b91c1c); }
                .guest-cancel {
                    display:block;margin-top:.75rem;width:100%;padding:.5rem;
                    background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:.9rem;
                }
            </style>
            <div class="guest-modal-card">
                <div class="guest-modal-title">👥 ¿Cuántos comensales?</div>
                <div class="guest-modal-sub">Mesa ${String(tableId).padStart(2,'0')}</div>
                <div class="guest-grid">
                    ${[1,2,3,4,5,6,7,8].map(n=>`<button class="guest-btn" data-n="${n}">${n}</button>`).join('')}
                </div>
                <div class="guest-custom">
                    <input type="number" id="guest-custom-input" min="1" max="50" placeholder="Otro número…">
                </div>
                <button class="guest-confirm" id="guest-confirm-btn">Abrir Mesa</button>
                <button class="guest-cancel" id="guest-cancel-btn">Cancelar</button>
            </div>
        `;
        document.body.appendChild(overlay);

        let selectedGuests = 2;
        // Default select 2
        overlay.querySelector('[data-n="2"]').classList.add('sel');

        overlay.querySelectorAll('.guest-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.querySelectorAll('.guest-btn').forEach(b => b.classList.remove('sel'));
                btn.classList.add('sel');
                selectedGuests = parseInt(btn.dataset.n);
                document.getElementById('guest-custom-input').value = '';
            });
        });

        document.getElementById('guest-custom-input').addEventListener('input', e => {
            if (e.target.value) {
                overlay.querySelectorAll('.guest-btn').forEach(b => b.classList.remove('sel'));
                selectedGuests = parseInt(e.target.value) || 1;
            }
        });

        document.getElementById('guest-confirm-btn').addEventListener('click', () => {
            overlay.remove();
            onConfirm(selectedGuests);
        });
        document.getElementById('guest-cancel-btn').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    };

    // ── Payment modal ──────────────────────────────────────────────────────────
    const showPaymentModal = (tableId) => {
        const orders = globalState.orders.filter(o => o.tableId === tableId && o.status !== 'pagado');
        const total = orders.reduce((s,o) => s + o.items.reduce((ss,i) => ss+i.price*i.qty, 0), 0);

        const existing = document.getElementById('zt-pay-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'zt-pay-modal';
        overlay.style.cssText = `
            position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;
            display:flex;align-items:center;justify-content:center;
            backdrop-filter:blur(4px);animation:fadeInModal .2s ease;
        `;
        overlay.innerHTML = `
            <div class="guest-modal-card" style="max-width:420px;">
                <div class="guest-modal-title">💳 Cobrar Mesa ${String(tableId).padStart(2,'0')}</div>
                <div class="guest-modal-sub" style="font-size:1.5rem;font-weight:800;color:var(--color-primary);margin-bottom:1rem;">${total.toFixed(2)} €</div>
                <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1.5rem;">
                    <button class="pay-method" data-method="efectivo" style="display:flex;align-items:center;gap:.75rem;padding:1rem;border-radius:12px;border:2px solid var(--color-border);background:var(--color-bg);color:var(--color-text);cursor:pointer;font-size:1rem;font-weight:600;transition:all .15s;">
                        <span style="font-size:1.4rem;">💵</span> Efectivo
                    </button>
                    <button class="pay-method" data-method="tarjeta" style="display:flex;align-items:center;gap:.75rem;padding:1rem;border-radius:12px;border:2px solid var(--color-border);background:var(--color-bg);color:var(--color-text);cursor:pointer;font-size:1rem;font-weight:600;transition:all .15s;">
                        <span style="font-size:1.4rem;">💳</span> Tarjeta
                    </button>
                    <button class="pay-method" data-method="dividida" style="display:flex;align-items:center;gap:.75rem;padding:1rem;border-radius:12px;border:2px solid var(--color-border);background:var(--color-bg);color:var(--color-text);cursor:pointer;font-size:1rem;font-weight:600;transition:all .15s;">
                        <span style="font-size:1.4rem;">🤝</span> Pago Dividido
                    </button>
                </div>
                <button class="guest-cancel" id="pay-cancel-btn">Cancelar</button>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelectorAll('.pay-method').forEach(btn => {
            btn.addEventListener('mouseenter', () => { btn.style.borderColor = 'var(--color-primary)'; btn.style.background = 'var(--color-surface-hover)'; });
            btn.addEventListener('mouseleave', () => { btn.style.borderColor = 'var(--color-border)'; btn.style.background = 'var(--color-bg)'; });
            btn.addEventListener('click', () => {
                const method = btn.dataset.method;
                const table = globalState.tables.find(t => t.id === tableId);
                
                // Generar e imprimir ticket oficial
                tickets.printCobro(table, orders, total, method);
                
                // Cerrar mesa y marcar comandas como pagadas
                globalState.closeTable(tableId);
                
                overlay.remove();
                app.showToast(`✅ Mesa ${tableId} cobrada — ${total.toFixed(2)} € (${method})`);
                render();
            });
        });

        document.getElementById('pay-cancel-btn').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    };

    // ── Mesa detail panel ──────────────────────────────────────────────────────
    // pendingItems: items being built before sending to kitchen (per session)
    const pendingByTable = {};

    const renderMesaDetail = (tableId) => {
        const t = globalState.tables.find(x => x.id === tableId);
        if (!t) return;
        const panel = document.getElementById('mesa-detail-panel');
        if (!panel) return;

        if (t.status === 'libre') {
            // ── FREE TABLE: show open button ────────────────────────────────
            panel.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:1.5rem;padding:2rem;text-align:center;">
                    <div style="width:80px;height:80px;border-radius:50%;background:rgba(34,197,94,.12);display:flex;align-items:center;justify-content:center;">
                        <i class='bx bx-check-circle' style="font-size:2.5rem;color:var(--color-free);"></i>
                    </div>
                    <div>
                        <div style="font-size:1.2rem;font-weight:800;color:var(--color-free);">Mesa ${String(tableId).padStart(2,'0')}</div>
                        <div style="font-size:.85rem;color:var(--color-text-muted);margin-top:.25rem;">Libre · Sin comensales</div>
                    </div>
                    <button class="btn btn-primary" style="width:100%;max-width:220px;padding:.8rem;font-size:1rem;" id="btn-quick-open">
                        <i class='bx bx-door-open'></i> Abrir Mesa
                    </button>
                </div>`;

            document.getElementById('btn-quick-open').addEventListener('click', () => {
                showGuestModal(tableId, guests => {
                    globalState.updateTable(tableId, { status: 'ocupada', openedAt: Date.now(), guests });
                    pendingByTable[tableId] = [];
                    renderMesaDetail(tableId);
                });
            });

        } else {
            // ── OCCUPIED TABLE: order panel ─────────────────────────────────
            if (!pendingByTable[tableId]) pendingByTable[tableId] = [];
            const pending = pendingByTable[tableId];

            const orders = globalState.orders.filter(o => o.tableId === tableId && o.status !== 'pagado');
            const sentTotal = orders.reduce((s,o) => s+o.items.reduce((ss,i) => ss+i.price*i.qty, 0), 0);
            const pendingTotal = pending.reduce((s,i) => s+i.price*i.qty, 0);
            const grandTotal = sentTotal + pendingTotal;

            // Group menu by category
            const menu = globalState.menu.filter(m => m.status === 'Activo');
            const categories = [...new Set(menu.map(m => m.category))];

            panel.innerHTML = `
                <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
                    <!-- Header -->
                    <div style="padding:.75rem 1rem;border-bottom:1px solid var(--color-border);flex-shrink:0;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <span style="font-size:1rem;font-weight:800;color:var(--color-primary);">Mesa ${String(tableId).padStart(2,'0')}</span>
                                <span style="font-size:.8rem;color:var(--color-text-muted);margin-left:.5rem;">
                                    <i class='bx bx-user'></i> ${t.guests || '?'} comensales
                                </span>
                            </div>
                            <div style="font-size:1rem;font-weight:700;">${grandTotal.toFixed(2)} €</div>
                        </div>
                    </div>

                    <!-- Body: menu + order summary side-by-side -->
                    <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;">

                        <!-- Sent orders summary -->
                        ${orders.length > 0 ? `
                        <div style="padding:.5rem 1rem;background:var(--color-surface-hover);flex-shrink:0;font-size:.8rem;">
                            <div style="font-weight:700;color:var(--color-text-muted);margin-bottom:.25rem;">ENVIADO A COCINA</div>
                            ${orders.flatMap(o => o.items).map(i => `
                                <div style="display:flex;justify-content:space-between;padding:1px 0;">
                                    <span>${i.qty}x ${i.name}</span>
                                    <span>${(i.price*i.qty).toFixed(2)}€</span>
                                </div>`).join('')}
                        </div>` : ''}

                        <!-- Pending items (not yet sent) -->
                        <div id="pending-items-list" style="padding:.5rem 1rem;flex-shrink:0;border-bottom:1px solid var(--color-border);min-height:40px;">
                            ${pending.length === 0
                                ? `<div style="color:var(--color-text-muted);font-size:.8rem;text-align:center;padding:.5rem 0;">Selecciona productos de la carta</div>`
                                : `<div style="font-weight:700;color:var(--color-text-muted);font-size:.8rem;margin-bottom:.25rem;">NUEVA COMANDA</div>
                                   ${pending.map((item, idx) => `
                                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:.85rem;padding:2px 0;">
                                        <span>${item.qty}x ${item.name}</span>
                                        <div style="display:flex;align-items:center;gap:.5rem;">
                                            <span>${(item.price*item.qty).toFixed(2)}€</span>
                                            <button onclick="window._deskRemovePending(${tableId},${idx})"
                                                style="background:none;border:none;color:var(--color-danger,#dc2626);cursor:pointer;font-size:.9rem;padding:0 2px;">✕</button>
                                        </div>
                                    </div>`).join('')}`
                            }
                        </div>

                        <!-- Menu items by category -->
                        <div style="flex:1;overflow-y:auto;padding:.75rem 1rem;">
                            ${categories.map(cat => `
                                <div style="margin-bottom:1rem;">
                                    <div style="font-size:.7rem;font-weight:800;color:var(--color-text-muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.4rem;">${cat}</div>
                                    ${menu.filter(m => m.category === cat).map(item => `
                                        <div class="item-card" data-item-id="${item.id}"
                                            style="display:flex;justify-content:space-between;align-items:center;
                                                   padding:.6rem .75rem;border-radius:10px;margin-bottom:.3rem;
                                                   background:var(--color-bg);border:1px solid var(--color-border);
                                                   cursor:pointer;transition:all .12s;">
                                            <span style="font-size:.9rem;">${item.name}</span>
                                            <div style="display:flex;align-items:center;gap:.6rem;">
                                                <span style="font-size:.85rem;color:var(--color-text-muted);">${item.price.toFixed(2)}€</span>
                                                <button style="width:26px;height:26px;border-radius:50%;background:var(--color-primary);color:#fff;border:none;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;font-weight:700;"
                                                    data-add-item="${item.id}">+</button>
                                            </div>
                                        </div>`).join('')}
                                </div>`).join('')}
                        </div>
                    </div>

                    <!-- Footer actions -->
                    <div style="padding:.75rem 1rem;border-top:1px solid var(--color-border);flex-shrink:0;display:flex;flex-direction:column;gap:.4rem;">
                        <button class="btn btn-primary" id="btn-send-kitchen" style="width:100%;" ${pending.length===0 ? 'disabled style="width:100%;opacity:.45;cursor:not-allowed;"' : ''}>
                            <i class='bx bx-send'></i> Enviar a Cocina ${pending.length>0?`(${pending.length} productos)`:''}</button>
                        ${grandTotal > 0 ? `<button class="btn btn-success" id="btn-cobrar-mesa" style="width:100%;">
                            <i class='bx bx-credit-card'></i> Cobrar — ${grandTotal.toFixed(2)} €</button>` : ''}
                        <button class="btn btn-secondary" id="btn-liberar-mesa" style="width:100%;font-size:.8rem;padding:.4rem;">
                            <i class='bx bx-reset'></i> Liberar sin cobrar</button>
                    </div>
                </div>`;

            // ── Add item buttons
            window._deskRemovePending = (tId, idx) => {
                if (!pendingByTable[tId]) return;
                pendingByTable[tId].splice(idx, 1);
                renderMesaDetail(tId);
            };

            panel.querySelectorAll('[data-add-item]').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const itemId = btn.dataset.addItem;
                    const menuItem = menu.find(m => m.id === itemId);
                    if (!menuItem) return;
                    const existing = pending.find(p => p.id === itemId);
                    if (existing) {
                        existing.qty++;
                    } else {
                        pending.push({ id: itemId, name: menuItem.name, price: menuItem.price, qty: 1, category: menuItem.category });
                    }
                    renderMesaDetail(tableId);
                });
            });

            // ── Send to kitchen
            const btnSend = document.getElementById('btn-send-kitchen');
            if (btnSend && !btnSend.disabled) {
                btnSend.addEventListener('click', () => {
                    if (pending.length === 0) return;
                    // Split into kitchen items (non-bebidas) and bar items (bebidas)
                    const kItems = pending.filter(i => i.category !== 'Bebidas');
                    const bItems = pending.filter(i => i.category === 'Bebidas');
                    if (typeof globalState.createOrders === 'function') {
                        globalState.createOrders(kItems, bItems, { tableId, waiter: app.currentUser?.alias || 'Admin' });
                    } else {
                        // Fallback: create order directly
                        const order = {
                            id: 'o_' + Date.now(),
                            tableId, status: 'en_cocina',
                            items: [...pending],
                            waiter: app.currentUser?.alias || 'Admin',
                            timestamp_entrada: Date.now()
                        };
                        globalState.orders.push(order);
                        globalState.notifyListeners('orders');
                    }
                    pendingByTable[tableId] = [];
                    app.showToast('✅ Comanda enviada a cocina');
                    renderMesaDetail(tableId);
                });
            }

            // ── Pay
            const btnCobrar = document.getElementById('btn-cobrar-mesa');
            if (btnCobrar) {
                btnCobrar.addEventListener('click', () => showPaymentModal(tableId));
            }

            // ── Release without paying
            const btnLiberar = document.getElementById('btn-liberar-mesa');
            if (btnLiberar) {
                btnLiberar.addEventListener('click', () => {
                    if (confirm('¿Liberar mesa sin cobrar?')) {
                        pendingByTable[tableId] = [];
                        globalState.updateTable(tableId, { status: 'libre', guests: 0, openedAt: null });
                        render();
                    }
                });
            }
        }
    };


    const renderComandasSection = () => {
        const filters = ['Todas','en_cocina','listo'];
        const filterLabels = {'Todas':'Todas','en_cocina':'En preparación','listo':'Listas'};
        const filtered = kitchenFilter==='Todas' ? globalState.orders : globalState.orders.filter(o=>o.status===kitchenFilter);
        const selOrder = selectedOrderId ? globalState.orders.find(o=>o.id===selectedOrderId) : null;

        return `
        <div style="display:grid;grid-template-columns:1fr 1fr 350px;flex:1;overflow:hidden;padding:1.5rem;gap:1.5rem;height:100%;">
            <div class="desktop-col">
                <div class="desktop-col-header">
                    <span>COMANDAS</span>
                    <div class="tabs-container">
                        ${filters.map(f=>`<button class="tab-pill ${kitchenFilter===f?'active':''}" data-kf="${f}">${filterLabels[f]||f} ${f==='Todas'?`(${globalState.orders.length})`:''}</button>`).join('')}
                    </div>
                </div>
                <div class="desktop-col-body">
                    ${filtered.length===0?'<p style="color:var(--color-text-muted);text-align:center;padding:2rem;">Sin comandas</p>':''}
                    ${filtered.map(o=>{
                        let badge = 'En cocina';
                        let badgeColor = 'var(--color-reserved)';
                        if(o.status==='listo'){badge='<i class="bx bx-check"></i> Lista';badgeColor='var(--color-free)';}
                        return `<div class="order-list-item ${selectedOrderId===o.id?'selected':''}" data-order-id="${o.id}">
                            <div class="order-list-header">
                                <div class="order-list-title">Mesa ${String(o.tableId).padStart(2,'0')}</div>
                                <span style="background:${badgeColor};color:#000;padding:2px 8px;border-radius:20px;font-size:0.75rem;font-weight:700;display:flex;align-items:center;gap:2px;">${badge}</span>
                            </div>
                            <div class="order-list-items">${o.items.map(i=>`${i.qty}x ${i.name}`).join(' · ')}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
            <div class="desktop-col" style="display:${selectedOrderId?'flex':'none'};flex-direction:column;">
                <div class="desktop-col-header">DETALLE COMANDA</div>
                <div class="desktop-col-body" id="comanda-detail">
                    ${selOrder ? `
                        <h3 style="color:var(--color-primary-light);">Mesa ${String(selOrder.tableId).padStart(2,'0')}</h3>
                        <div style="margin:1rem 0;">
                            ${selOrder.items.map(i=>`<div class="detalle-item"><span>${i.qty}x ${i.name}</span><span>${(i.price*i.qty).toFixed(2)}€</span></div>`).join('')}
                        </div>
                        <div class="detalle-total"><span>Total</span><span>${selOrder.items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)} €</span></div>
                        <div class="detalle-actions">
                            <button class="btn btn-secondary" id="btn-mark-prep"><i class='bx bx-time-five'></i> En preparación</button>
                            <button class="btn btn-primary" id="btn-mark-listo"><i class='bx bx-check-double'></i> Marcar Lista</button>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="desktop-col">
                <div class="desktop-col-header">RESUMEN DEL DÍA</div>
                <div class="desktop-col-body">
                    ${renderResumenDia()}
                </div>
            </div>
        </div>`;
    };

    const renderResumenDia = () => {
        const allT = tickets.getAllTickets();
        const cobros = allT.filter(t=>t.type==='cobro');
        const total = cobros.reduce((s,c)=>s+c.total,0);
        const ocupadas = globalState.tables.filter(t=>t.status!=='libre'&&t.status!=='cerrada').length;
        return `
            <div class="resumen-stat"><div class="resumen-stat-label">Ventas hoy</div><div class="resumen-stat-val">${total.toFixed(2)} €</div></div>
            <div class="resumen-stat"><div class="resumen-stat-label">Mesas cobradas</div><div class="resumen-stat-val">${cobros.length}</div></div>
            <div class="resumen-stat"><div class="resumen-stat-label">Mesas abiertas</div><div class="resumen-stat-val">${ocupadas}</div></div>
            <div class="resumen-stat"><div class="resumen-stat-label">Comandas pendientes</div><div class="resumen-stat-val">${globalState.orders.filter(o=>o.status==='en_cocina').length}</div></div>
        `;
    };

    const renderAjustesSection = () => {
        const panel = document.createElement('div');
        panel.style.cssText = 'padding:1.5rem;flex:1;overflow-y:auto;height:100%;';
        panel.innerHTML = '<div id="admin-panel-inner"></div>';
        return panel;
    };

    const render = () => {
        container.innerHTML = '';
        const layout = document.createElement('div');
        layout.className = 'desktop-layout';
        layout.innerHTML = nav();

        const main = document.createElement('main');
        main.style.cssText = 'flex:1;overflow:hidden;display:flex;flex-direction:column;';

        if (activeSection === 'mesas') {
            main.innerHTML = renderMesasSection();
        } else if (activeSection === 'comandas') {
            main.innerHTML = renderComandasSection();
        } else if (activeSection === 'ajustes') {
            main.innerHTML = '<div style="flex:1;overflow-y:auto;padding:1.5rem;" id="admin-wrapper"></div>';
        } else if (activeSection === 'carta') {
            main.innerHTML = '<div style="flex:1;overflow-y:auto;padding:1.5rem;" id="carta-wrapper"></div>';
        } else if (activeSection === 'informes') {
            main.innerHTML = `<div style="padding:2rem;flex:1;overflow-y:auto;">
                <h2 style="margin-bottom:1.5rem;">Informes</h2>
                <div class="dashboard-grid">${renderResumenDia()}</div>
            </div>`;
        }

        layout.appendChild(main);
        container.appendChild(layout);
        bindEvents();

        // Load sub-modules
        if (activeSection === 'ajustes') {
            const w = document.getElementById('admin-wrapper');
            if (w) renderAdmin(w, app);
        }
        if (activeSection === 'carta') {
            const w = document.getElementById('carta-wrapper');
            if (w) import('../carta.js').then(m=>m.renderManageMenu(w,app));
        }
    };

    const bindEvents = () => {
        // Nav section switching
        document.querySelectorAll('[data-section]').forEach(btn=>{
            btn.addEventListener('click',()=>{
                activeSection = btn.getAttribute('data-section');
                render();
            });
        });

        // Exit
        const btnExit = document.getElementById('btn-exit-desktop');
        if (btnExit) btnExit.addEventListener('click',()=>app.navigate('home'));
        const btnHome = document.getElementById('btn-nav-home');
        if (btnHome) btnHome.addEventListener('click',()=>app.navigate('home'));

        // Zone filter (Mesas)
        document.querySelectorAll('[data-zone]').forEach(btn=>{
            btn.addEventListener('click',()=>{
                tableFilter = btn.getAttribute('data-zone');
                render();
            });
        });

        // Table editor
        const btnEditor = document.getElementById('btn-open-table-editor');
        if (btnEditor) {
            btnEditor.addEventListener('click', ()=>{
                import('./admin.js').then(m=>{
                    // render table editor inside container
                    const wrap = document.createElement('div');
                    wrap.style.cssText='position:fixed;inset:0;background:var(--color-bg);z-index:9999;overflow:auto;';
                    document.body.appendChild(wrap);
                    // reuse admin renderTableEditor by mounting admin temporarily
                    wrap.innerHTML=`<div style="padding:1rem;max-width:1200px;margin:0 auto;">
                        <button class="btn btn-secondary" id="btn-close-editor-wrap" style="margin-bottom:1rem;"><i class='bx bx-arrow-back'></i> Volver al Panel</button>
                        <div id="admin-editor-inner"></div>
                    </div>`;
                    document.getElementById('btn-close-editor-wrap').addEventListener('click',()=>{
                        wrap.remove();
                        render();
                    });
                    const inner = document.getElementById('admin-editor-inner');
                    m.renderAdmin(inner, {...app, navigate: (v)=>{ if(v==='admin'){wrap.remove();render();} else app.navigate(v); }});
                });
            });
        }

        // Table click -> show detail
        document.querySelectorAll('[data-table-id]').forEach(card=>{
            card.addEventListener('click',()=>{
                const id = parseInt(card.getAttribute('data-table-id'));
                renderMesaDetail(id);
            });
        });

        // Kitchen filter
        document.querySelectorAll('[data-kf]').forEach(btn=>{
            btn.addEventListener('click',()=>{
                kitchenFilter = btn.getAttribute('data-kf');
                render();
            });
        });

        // Order select
        document.querySelectorAll('[data-order-id]').forEach(el=>{
            el.addEventListener('click',()=>{
                selectedOrderId = el.getAttribute('data-order-id');
                render();
            });
        });

        // Mark prep/listo
        const btnPrep = document.getElementById('btn-mark-prep');
        if (btnPrep) btnPrep.addEventListener('click',()=>{
            globalState.updateOrderStatus(selectedOrderId,'en_cocina');
            render();
        });
        const btnListo = document.getElementById('btn-mark-listo');
        if (btnListo) btnListo.addEventListener('click',()=>{
            globalState.updateOrderStatus(selectedOrderId,'listo');
            render();
        });
    };

    globalState.subscribe(()=>{
        if (document.querySelector('.desktop-layout')) render();
    });

    render();
}
