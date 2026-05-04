import { globalState } from '../state.js';
import { tickets } from '../tickets.js';

export function renderMobileCamarero(container, app) {
    let subView = null;       // null | 'table_detail' | 'nueva_comanda'
    let activeTableId = null;
    let pendingItems = [];
    let currentCat = null;
    let tableFilter = 'Todas';
    let drawerOpen = false;

    const menu = () => globalState.menu.filter(m => m.status === 'Activo');
    const cats = () => [...new Set(menu().map(m => m.category))];
    const $ = id => document.getElementById(id);

    const render = () => {
        if (!currentCat || !cats().includes(currentCat)) currentCat = cats()[0] || null;
        container.innerHTML = buildHTML();
        bind();
    };

    // ── modals ────────────────────────────────────────────────────────────────
    const showGuestModal = (onConfirm) => {
        const ov = document.createElement('div');
        ov.id = 'mob-guest-modal';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
        ov.innerHTML = `
            <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:20px;padding:1.75rem;width:min(340px,92vw);text-align:center;">
                <div style="font-size:1.3rem;font-weight:800;margin-bottom:.2rem;"><i class='bx bx-group'></i> Comensales</div>
                <div style="font-size:.82rem;color:var(--color-text-muted);margin-bottom:1.25rem;">Mesa ${String(activeTableId).padStart(2, '0')}</div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:1rem;">
                    ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button class="g-btn" data-n="${n}" style="aspect-ratio:1;border-radius:10px;border:2px solid var(--color-border);background:var(--color-bg);color:var(--color-text);font-size:1.1rem;font-weight:800;cursor:pointer;">${n}</button>`).join('')}
                </div>
                <input type="number" id="g-custom" min="1" max="50" placeholder="Otro número…" style="margin-bottom:1rem;text-align:center;border-radius:10px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text);padding:.6rem;font-size:1rem;width:100%;">
                <button id="g-confirm" style="width:100%;padding:.8rem;border-radius:12px;background:var(--color-primary);color:#fff;font-size:1rem;font-weight:800;border:none;cursor:pointer;"><i class='bx bx-door-open'></i> Abrir Mesa</button>
                <button id="g-cancel" style="display:block;width:100%;margin-top:.5rem;background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:.88rem;">Cancelar</button>
            </div>`;
        document.body.appendChild(ov);
        let sel = 2;
        ov.querySelector('[data-n="2"]').style.cssText += 'background:var(--color-primary);color:#fff;';
        ov.querySelectorAll('.g-btn').forEach(b => b.addEventListener('click', () => {
            ov.querySelectorAll('.g-btn').forEach(x => { x.style.background = 'var(--color-bg)'; x.style.color = 'var(--color-text)'; });
            b.style.background = 'var(--color-primary)'; b.style.color = '#fff';
            sel = parseInt(b.dataset.n);
            $('g-custom').value = '';
        }));
        $('g-custom').addEventListener('input', e => { if (e.target.value) { ov.querySelectorAll('.g-btn').forEach(x => { x.style.background = 'var(--color-bg)'; x.style.color = 'var(--color-text)'; }); sel = parseInt(e.target.value) || 1; } });
        $('g-confirm').addEventListener('click', () => { ov.remove(); onConfirm(sel); });
        $('g-cancel').addEventListener('click', () => ov.remove());
        ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    };

    const showPayModal = () => {
        const orders = globalState.orders.filter(o => o.tableId === activeTableId && o.status !== 'pagado');
        const total = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.price * i.qty, 0), 0);
        const ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
        ov.innerHTML = `
            <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:20px;padding:1.75rem;width:min(340px,92vw);text-align:center;">
                <div style="font-size:1.2rem;font-weight:800;margin-bottom:.2rem;"><i class='bx bx-credit-card'></i> Cobrar Mesa ${String(activeTableId).padStart(2, '0')}</div>
                <div style="font-size:2rem;font-weight:800;color:var(--color-primary);margin-bottom:1.25rem;">${total.toFixed(2)} €</div>
                ${['efectivo', 'tarjeta', 'dividida'].map(m => `
                <button class="pay-btn" data-m="${m}" style="display:flex;align-items:center;gap:.75rem;width:100%;padding:.9rem 1rem;border-radius:12px;border:2px solid var(--color-border);background:var(--color-bg);color:var(--color-text);font-size:1rem;font-weight:700;cursor:pointer;margin-bottom:.5rem;">
                    <span><i class='bx ${m==='efectivo'?'bx-money':m==='tarjeta'?'bx-credit-card':'bx-group'}'></i></span>${m.charAt(0).toUpperCase()+m.slice(1)}
                </button>`).join('')}
                <button id="pay-cancel" style="width:100%;margin-top:.25rem;background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:.88rem;padding:.5rem;">Cancelar</button>
            </div>`;
        document.body.appendChild(ov);
        ov.querySelectorAll('.pay-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => { btn.style.borderColor = 'var(--color-primary)'; });
            btn.addEventListener('mouseleave', () => { btn.style.borderColor = 'var(--color-border)'; });
            btn.addEventListener('click', () => {
                const method = btn.dataset.m;
                const table = globalState.tables.find(t => t.id === activeTableId);
                
                // Generar e imprimir ticket oficial
                tickets.printCobro(table, orders, total, method);
                
                // Cerrar mesa y marcar comandas como pagadas
                globalState.closeTable(activeTableId);
                
                ov.remove();
                app.showToast(`Mesa ${activeTableId} cobrada — ${total.toFixed(2)}€ (${method})`);
                subView = null; activeTableId = null; render();
            });
        });
        $('pay-cancel').addEventListener('click', () => ov.remove());
        ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    };

    // ── HTML builders ─────────────────────────────────────────────────────────
    const buildHTML = () => {
        if (subView === 'table_detail') return buildDetail();
        if (subView === 'nueva_comanda') return buildComanda();
        return buildMesas();
    };

    const buildMesas = () => {
        const tables = globalState.tables;
        const occupied = tables.filter(t => t.status !== 'libre').length;
        return `
        <div class="mob-full">
            <div class="mob-header">
                <button id="btn-hamburger" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.5rem;flex-shrink:0;"><i class="bx bx-menu"></i></button>
                <div style="flex:1;margin-left:.5rem;">
                    <div class="mob-header-title">${app.currentUser?.alias || 'Camarero'}</div>
                    <div class="mob-header-sub">${occupied}/${tables.length} mesas ocupadas</div>
                </div>
                <div style="background:rgba(255,255,255,.15);border-radius:20px;padding:.25rem .75rem;color:#fff;font-size:.8rem;font-weight:700;"><i class='bx bx-time'></i> ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div class="mob-scroll" style="padding:1rem;">
                <div style="display:flex; gap:0.5rem; overflow-x:auto; padding-bottom:1rem; margin-bottom:0.5rem; scrollbar-width:none;">
                    ${['Todas', 'Terraza', 'Salón', 'Barra', 'Privado'].map(z => `
                        <button class="mob-zone-pill ${tableFilter===z?'active':''}" data-mzone="${z}" style="flex-shrink:0; padding:0.4rem 1rem; border-radius:20px; border:1px solid var(--color-border); background:${tableFilter===z?'var(--color-primary)':'var(--color-surface)'}; color:${tableFilter===z?'#fff':'var(--color-text)'}; font-size:0.8rem; font-weight:700;">${z}</button>
                    `).join('')}
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:.75rem;">
                    ${tables.map(t => {
                        const isFiltered = tableFilter === 'Todas' || t.zone === tableFilter;
                        const occ = t.status !== 'libre';
                        const orders = globalState.orders.filter(o => o.tableId === t.id && o.status !== 'pagado');
                        const total = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.price * i.qty, 0), 0);
                        return `
                        <div class="mob-table-tile" data-table-id="${t.id}" style="background:${occ ? 'var(--color-surface)' : 'var(--color-surface)'};border:1px solid ${occ ? 'var(--color-primary)' : 'var(--color-border)'};box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);border-radius:14px;padding:.85rem .5rem;text-align:center;cursor:pointer;transition:all .2s;position:relative; opacity: ${isFiltered ? 1 : 0.4};">
                            <div style="font-size:1.3rem;font-weight:800;color:${occ ? 'var(--color-primary)' : 'var(--color-text)'};">${String(t.id).padStart(2, '0')}</div>
                            ${t.guests ? `<div style="font-size:.7rem;color:var(--color-text-muted);"><i class='bx bx-user'></i> ${t.guests}</div>` : ''}
                            ${total ? `<div style="font-size:.78rem;font-weight:700;color:var(--color-text);">${total.toFixed(2)}€</div>` : ''}
                            <div style="font-size:.62rem;margin-top:.2rem;color:${occ ? 'var(--color-primary)' : 'var(--color-text-muted)'};">${occ ? 'Ocupada' : 'Libre'}</div>
                            ${occ ? `<div style="position:absolute;top:8px;right:8px;width:8px;height:8px;background:var(--color-primary);border-radius:50%;"></div>` : ``}
                        </div>`;
        }).join('')}
                </div>
                <div style="margin-top:1.25rem;display:flex;justify-content:space-around;font-size:.72rem;color:var(--color-text-muted);">
                    <span><span style="display:inline-block;width:10px;height:10px;background:var(--color-surface);border-radius:2px;border:1px solid var(--color-border);"></span> Libre</span>
                    <span><span style="display:inline-block;width:10px;height:10px;background:var(--color-primary);border-radius:2px;"></span> Ocupada</span>
                </div>
            </div>
        </div>
        ${buildDrawer()}`;
    };

    const buildDrawer = () => `
        <div id="admin-drawer" class="${drawerOpen ? '' : 'hidden'}">
            <div id="admin-drawer-overlay"></div>
            <div id="admin-drawer-panel">
                <div style="padding:1.25rem 1.25rem 1rem;border-bottom:1px solid var(--color-border);display:flex;align-items:center;gap:.75rem;">
                    <div style="width:42px;height:42px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1.1rem;"><i class='bx bx-user'></i></div>
                    <div>
                        <div style="font-weight:700;">${app.currentUser?.alias || 'Camarero'}</div>
                        <div style="font-size:.75rem;color:var(--color-text-muted);">${app.currentUser?.role || 'Camarero'}</div>
                    </div>
                </div>
                <div class="admin-drawer-item" id="drawer-comandas"><i class='bx bx-receipt'></i>Ver Comandas</div>
                <div class="admin-drawer-item" id="drawer-cambiar-rol"><i class='bx bx-transfer-alt'></i>Cambiar de Rol</div>
                <div class="admin-drawer-item" id="drawer-reload"><i class='bx bx-refresh'></i>Recargar App</div>
                <div class="admin-drawer-item" style="color:var(--color-primary-light);margin-top:auto;" id="drawer-logout"><i class='bx bx-log-out'></i>Cerrar Sesión</div>
            </div>
        </div>`;

    const buildDetail = () => {
        const t = globalState.tables.find(x => x.id === activeTableId);
        if (!t) { subView = null; return buildMesas(); }
        const orders = globalState.orders.filter(o => o.tableId === activeTableId && o.status !== 'pagado');
        const total = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.price * i.qty, 0), 0);

        if (t.status === 'libre') return `
        <div class="mob-full">
            <div class="mob-header">
                <button id="btn-back" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.4rem;"><i class="bx bx-arrow-back"></i></button>
                <div class="mob-header-title" style="margin-left:.5rem;">Mesa ${String(activeTableId).padStart(2, '0')}</div>
            </div>
            <div class="mob-scroll" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;padding:2rem;text-align:center;">
                <div style="width:88px;height:88px;border-radius:50%;background:rgba(34,197,94,.15);display:flex;align-items:center;justify-content:center;"><i class='bx bx-check-circle' style="font-size:2.8rem;color:#22c55e;"></i></div>
                <div><div style="font-size:1.2rem;font-weight:800;color:#22c55e;">Mesa Libre</div><div style="font-size:.85rem;color:var(--color-text-muted);margin-top:.3rem;">Sin comensales</div></div>
                <button id="btn-open-table" class="btn btn-primary" style="width:100%;max-width:240px;padding:.9rem;font-size:1rem;"><i class='bx bx-door-open'></i> Abrir Mesa</button>
            </div>
        </div>`;

        return `
        <div class="mob-full">
            <div class="mob-header">
                <button id="btn-back" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.4rem;"><i class="bx bx-arrow-back"></i></button>
                <div style="margin-left:.5rem;flex:1;">
                    <div class="mob-header-title">Mesa ${String(activeTableId).padStart(2, '0')}</div>
                    <div class="mob-header-sub"><i class='bx bx-user'></i> ${t.guests || '?'} comensales${total ? ' · ' + total.toFixed(2) + '€' : ''}</div>
                </div>
            </div>
            <div class="mob-scroll" style="padding:1rem;display:flex;flex-direction:column;gap:.75rem;">
                ${orders.length ? `
                <div style="background:var(--color-surface);border-radius:14px;padding:1rem;border:1px solid var(--color-border);">
                    <div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--color-text-muted);margin-bottom:.5rem;"><i class='bx bx-kitchen'></i> Enviado a cocina</div>
                    ${orders.flatMap(o => o.items).map(i => `<div class="pending-row"><span>${i.qty}× ${i.name}</span><span style="color:var(--color-text-muted);">${(i.price * i.qty).toFixed(2)}€</span></div>`).join('')}
                    <div style="display:flex;justify-content:space-between;font-weight:800;margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--color-border);">
                        <span>Total</span><span style="color:var(--color-primary);">${total.toFixed(2)} €</span>
                    </div>
                </div>`:
                `<div style="text-align:center;color:var(--color-text-muted);padding:2rem 0;font-size:.9rem;"><i class='bx bx-receipt' style="font-size:2rem;display:block;margin-bottom:.5rem;"></i>Sin comandas enviadas</div>`}
            </div>
            <div class="mob-footer" style="display:flex;flex-direction:column;gap:.5rem;">
                <button id="btn-add-comanda" class="btn btn-primary" style="padding:.85rem;font-size:1rem;"><i class='bx bx-plus'></i> Nueva Comanda</button>
                ${total ? `<button id="btn-cobrar" class="btn btn-success" style="padding:.85rem;font-size:1rem;"><i class='bx bx-credit-card'></i> Cobrar — ${total.toFixed(2)} €</button>` : ''}
                <button id="btn-liberar" style="padding:.55rem;background:none;border:1px solid var(--color-border);border-radius:10px;color:var(--color-text-muted);cursor:pointer;font-size:.85rem;">Liberar sin cobrar</button>
            </div>
        </div>`;
    };

    const buildComanda = () => {
        const catList = cats();
        const items = menu().filter(m => m.category === currentCat);
        const pCount = pendingItems.reduce((s, i) => s + i.qty, 0);
        const pTotal = pendingItems.reduce((s, i) => s + i.price * i.qty, 0);

        // Category icons
        const catIcons = { 'Carne': 'bx-dish', 'Pescado': 'bx-water', 'Entrante': 'bx-bowl-rice', 'Postre': 'bx-cake', 'Postres': 'bx-cake', 'Bebidas': 'bx-drink', 'Bebida': 'bx-drink', 'Pizza': 'bx-pizza', 'Pasta': 'bx-restaurant', 'Ensalada': 'bx-bowl-rice' };
        const icon = c => `<i class='bx ${catIcons[c] || 'bx-restaurant'}'></i>`;

        return `
        <div class="mob-full">
            <div class="mob-header">
                <button id="btn-back" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.4rem;"><i class="bx bx-arrow-back"></i></button>
                <div style="margin-left:.5rem;flex:1;">
                    <div class="mob-header-title">Nueva Comanda</div>
                    <div class="mob-header-sub">Mesa ${String(activeTableId).padStart(2, '0')}</div>
                </div>
                ${pCount ? `<div style="background:rgba(255,255,255,.2);border-radius:20px;padding:.25rem .8rem;color:#fff;font-size:.82rem;font-weight:800;">${pCount} items · ${pTotal.toFixed(2)}€</div>` : ''}
            </div>

            <!-- Category pills -->
            <div class="cat-pill-row">
                ${catList.map(c => `
                <button class="cat-pill ${c === currentCat ? 'active' : ''}" data-cat="${c}" style="display:flex;align-items:center;gap:.3rem;">
                    <span>${icon(c)}</span><span>${c}</span>
                </button>`).join('')}
            </div>

            <!-- Pending items strip -->
            ${pendingItems.length ? `
            <div class="pending-strip">
                <div class="pending-strip-title">En esta comanda</div>
                ${pendingItems.map((item, idx) => `
                <div class="pending-row">
                    <span>${item.qty}× ${item.name}</span>
                    <div style="display:flex;align-items:center;gap:.6rem;">
                        <span style="color:var(--color-text-muted);">${(item.price * item.qty).toFixed(2)}€</span>
                        <button data-remove="${idx}" style="background:none;border:none;color:var(--color-primary-light);cursor:pointer;font-size:1.2rem;padding:0 2px;min-height:auto;"><i class='bx bx-x'></i></button>
                    </div>
                </div>`).join('')}
            </div>`: ''}

            <!-- Product list -->
            <div class="mob-scroll" style="padding:.75rem 1rem;">
                ${items.length ? items.map(item => `
                <div class="prod-row">
                    <div class="prod-row-info">
                        <div class="prod-row-name">${item.name}</div>
                        <div class="prod-row-price">${item.price.toFixed(2)} €</div>
                    </div>
                    <button class="prod-add-btn mob-add-item" data-item-id="${item.id}">+</button>
                </div>`).join('')
                : `<div style="text-align:center;color:var(--color-text-muted);padding:2rem 0;"><i class='bx bx-package' style="font-size:2rem;display:block;margin-bottom:.5rem;"></i>Sin productos en esta categoría</div>`}
            </div>

            <!-- Send button -->
            <div class="mob-footer">
                <button id="btn-send-kitchen" class="kitchen-btn ${pCount ? 'ready' : 'empty'}" ${pCount ? '' : 'disabled'}>
                    <i class='bx bx-send'></i>
                    ${pCount ? `Enviar a Cocina · ${pCount} prod. · ${pTotal.toFixed(2)}€` : 'Añade productos a la comanda'}
                </button>
            </div>
        </div>`;
    };

    // ── events ────────────────────────────────────────────────────────────────
    const bind = () => {
        // Mesas
        document.querySelectorAll('.mob-table-tile').forEach(c => {
            c.addEventListener('click', () => {
                activeTableId = parseInt(c.dataset.tableId);
                subView = 'table_detail';
                render();
            });
        });

        // Zone filters mobile
        document.querySelectorAll('[data-mzone]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                tableFilter = btn.dataset.mzone;
                render();
            });
        });

        // Hamburger
        const ham = $('btn-hamburger');
        if (ham) ham.addEventListener('click', () => { drawerOpen = true; render(); });
        const drawerOv = $('admin-drawer-overlay');
        if (drawerOv) drawerOv.addEventListener('click', () => { drawerOpen = false; render(); });
        const drawCmds = $('drawer-comandas');
        if (drawCmds) drawCmds.addEventListener('click', () => { drawerOpen = false; render(); });
        const drawRol = $('drawer-cambiar-rol');
        if (drawRol) drawRol.addEventListener('click', () => { drawerOpen = false; app.navigate('home'); });
        const drawRel = $('drawer-reload');
        if (drawRel) drawRel.addEventListener('click', () => location.reload());
        const drawOut = $('drawer-logout');
        if (drawOut) drawOut.addEventListener('click', () => { drawerOpen = false; app.navigate('home'); });

        // Back
        const back = $('btn-back');
        if (back) back.addEventListener('click', () => {
            if (subView === 'nueva_comanda') {
                if (pendingItems.length > 0 && !confirm('¿Descartar comanda?')) return;
                pendingItems = []; subView = 'table_detail';
            } else { subView = null; activeTableId = null; }
            render();
        });

        // Open table
        const btnOpen = $('btn-open-table');
        if (btnOpen) btnOpen.addEventListener('click', () => {
            showGuestModal(guests => {
                globalState.updateTable(activeTableId, { status: 'ocupada', openedAt: Date.now(), guests });
                pendingItems = []; subView = 'nueva_comanda'; render();
            });
        });

        // Add comanda
        const btnAdd = $('btn-add-comanda');
        if (btnAdd) btnAdd.addEventListener('click', () => { pendingItems = []; subView = 'nueva_comanda'; render(); });

        // Cobrar
        const btnCob = $('btn-cobrar');
        if (btnCob) btnCob.addEventListener('click', () => showPayModal());

        // Liberar
        const btnLib = $('btn-liberar');
        if (btnLib) btnLib.addEventListener('click', () => {
            if (!confirm('¿Liberar mesa sin cobrar?')) return;
            globalState.updateTable(activeTableId, { status: 'libre', guests: 0, openedAt: null });
            subView = null; activeTableId = null; render();
        });

        // Category pills
        document.querySelectorAll('.cat-pill').forEach(btn => {
            btn.addEventListener('click', () => { currentCat = btn.dataset.cat; render(); });
        });

        // Add item
        document.querySelectorAll('.mob-add-item').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const found = menu().find(m => m.id === btn.dataset.itemId);
                if (!found) return;
                const ex = pendingItems.find(p => p.id === found.id);
                if (ex) ex.qty++; else pendingItems.push({ ...found, qty: 1 });
                render();
            });
        });

        // Remove pending
        document.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                pendingItems.splice(parseInt(btn.dataset.remove), 1);
                render();
            });
        });

        // Send to kitchen
        const btnSend = $('btn-send-kitchen');
        if (btnSend && !btnSend.disabled) {
            btnSend.addEventListener('click', () => {
                if (!pendingItems.length) return;
                if (typeof globalState.createOrders === 'function') {
                    const kItems = pendingItems.filter(i => i.category !== 'Bebidas' && i.category !== 'Bebida');
                    const bItems = pendingItems.filter(i => i.category === 'Bebidas' || i.category === 'Bebida');
                    globalState.createOrders(kItems, bItems, { tableId: activeTableId, waiter: app.currentUser?.alias || 'Camarero' });
                } else {
                    globalState.orders.push({ id: 'o_' + Date.now(), tableId: activeTableId, status: 'en_cocina', items: [...pendingItems], waiter: app.currentUser?.alias || 'Camarero', timestamp_entrada: Date.now() });
                    globalState.notifyListeners('orders');
                }
                const n = pendingItems.reduce((s, i) => s + i.qty, 0);
                pendingItems = []; app.showToast(`${n} productos enviados a cocina`);
                subView = 'table_detail'; render();
            });
        }
    };

    globalState.subscribe(() => {
        if (document.querySelector('.mob-table-tile,.mob-full,.prod-row')) render();
    });
    render();
}
