import { globalState } from '../state.js';
import { formatTimeElapsed, formatTimeHM, showModal, closeModal } from './common.js';
import { getCategoryDestination } from '../data.js';
import { auth } from '../auth.js';
import { tickets } from '../tickets.js';

export function renderCamarero(container, app) {
    let currentTable = null;
    let draftOrder = { items: [] };
    let currentMenuTab = app.currentUser?.favCategory || 'Entrante';
    let searchQuery = '';

    let tableFilter = 'Todas';

    const renderTablesGrid = () => {
        let bannerHtml = '';
        if (globalState.isKitchenPaused) {
            bannerHtml = `<div class="banner">⚠️ Cocina saturada — revisar tiempos</div>`;
        }

        const zones = ['Todas', 'Terraza', 'Salón', 'Barra', 'Privado'];

        const html = `
            <div class="waiter-view">
                ${bannerHtml}
                <div class="view-header-bar" style="padding:1rem; display:flex; justify-content:space-between; align-items:center;">
                    <div class="tabs-container">
                        ${zones.map(z=>`<button class="tab-pill ${tableFilter===z?'active':''}" data-zone="${z}">${z}</button>`).join('')}
                    </div>
                    <div style="font-weight:700; color:var(--color-text-muted);">PLANO DE MESAS</div>
                </div>
                <div class="tables-spatial-grid" id="tables-container" style="display:grid; grid-template-columns:repeat(8, 1fr); grid-template-rows:repeat(6, 1fr); gap:12px; padding:1.5rem; background:var(--color-bg); flex:1; min-height:500px;"></div>
            </div>
        `;
        container.innerHTML = html;
        
        document.querySelectorAll('[data-zone]').forEach(btn => {
            btn.addEventListener('click', () => {
                tableFilter = btn.dataset.zone;
                renderTablesGrid();
            });
        });

        updateTables();
    };

    const updateTables = () => {
        const tContainer = document.getElementById('tables-container');
        if (!tContainer) return; 
        
        tContainer.innerHTML = '';
        
        // Fill all 48 cells of the 8x6 grid
        for (let i = 0; i < 48; i++) {
            const table = globalState.tables.find(t => t.gridCell === i);
            const cell = document.createElement('div');
            cell.style.border = '1px dashed var(--color-border)';
            cell.style.borderRadius = '12px';
            cell.style.opacity = '0.2';
            
            if (table) {
                const isFiltered = tableFilter === 'Todas' || table.zone === tableFilter;
                cell.className = `table-card table-status-${table.status}`;
                cell.style.opacity = isFiltered ? '1' : '0.15';
                cell.style.border = isFiltered ? '2px solid var(--color-primary)' : '1px solid var(--color-border)';
                cell.style.transform = isFiltered ? 'scale(1)' : 'scale(0.9)';
                cell.style.cursor = 'pointer';
                cell.style.position = 'relative';
                
                let timeStr = '';
                if (table.openedAt) {
                    timeStr = `<div class="time" style="position:absolute; bottom:5px; right:5px; font-size:0.65rem; opacity:0.8;">${formatTimeHM(table.openedAt)}</div>`;
                }

                cell.innerHTML = `
                    <div style="font-weight:800; font-size:1.2rem;">${String(table.id).padStart(2,'0')}</div>
                    ${table.guests ? `<div style="font-size:0.7rem;"><i class='bx bx-user'></i>${table.guests}</div>` : ''}
                    ${timeStr}
                `;
                
                cell.addEventListener('click', () => openTableDetails(table));
            }
            tContainer.appendChild(cell);
        }
    };

    const openTableDetails = (table) => {
        currentTable = table;
        if (table.status === 'libre') {
            const html = `
                <div style="display:flex; flex-direction:column; gap:1rem;">
                    <label>Comensales:</label>
                    <input type="number" id="input-guests" min="1" max="20" value="2">
                    <label>Nombre / Referencia (opcional):</label>
                    <input type="text" id="input-name" placeholder="Ej. Familia Pérez">
                </div>
            `;
            const footer = `<button class="btn btn-primary" id="btn-open-table">Abrir Mesa e ir a Carta</button>`;
            const modalId = showModal(`Abrir Mesa ${table.id}`, html, footer);
            
            document.getElementById('btn-open-table').addEventListener('click', () => {
                const guests = parseInt(document.getElementById('input-guests').value) || 1;
                const name = document.getElementById('input-name').value;
                globalState.updateTable(table.id, {
                    status: 'ocupada',
                    guests,
                    name,
                    openedAt: Date.now()
                });
                closeModal(modalId);
                renderOrderLayout();
            });
        } else if (table.status === 'cerrada') {
            const html = `<p>La mesa está pagada y lista para ser limpiada.</p>`;
            const footer = `<button class="btn btn-success" id="btn-free-table">Mesa Limpia (Liberar)</button>`;
            const modalId = showModal(`Mesa ${table.id} Cerrada`, html, footer);
            
            document.getElementById('btn-free-table').addEventListener('click', () => {
                globalState.updateTable(table.id, { status: 'libre' });
                closeModal(modalId);
                renderTablesGrid();
            });
        } else {
            renderOrderLayout();
        }
    };

    const renderOrderLayout = () => {
        currentTable = globalState.tables.find(t => t.id === currentTable.id);
        draftOrder = { items: [] };

        const html = `
            <div class="order-layout">
                <div class="menu-section">
                    <div style="display:flex; justify-content:space-between; margin-bottom:1rem; align-items:center;">
                        <button class="btn btn-secondary" id="btn-back-tables">← Mesas</button>
                        <input type="text" id="menu-search-camarero" placeholder="🔍 Buscar..." style="padding:0.5rem; border-radius:4px; border:1px solid var(--color-border); flex:1; margin-left:1rem; max-width:200px;">
                    </div>
                    
                    <div class="desktop-tab-row">
                <button class="tab-btn desktop-tab-pill ${currentMenuTab==='favs'?'active':''}" data-tab="favs"><i class='bx bx-star'></i> Favoritos</button>
                <button class="tab-btn desktop-tab-pill ${currentMenuTab==='Entrantes'?'active':''}" data-tab="Entrantes"><i class='bx bx-bowl-rice'></i> Entrantes</button>
                <button class="tab-btn desktop-tab-pill ${currentMenuTab==='Carnes'?'active':''}" data-tab="Carnes"><i class='bx bx-dish'></i> Carnes</button>
                <button class="tab-btn desktop-tab-pill ${currentMenuTab==='Pescados'?'active':''}" data-tab="Pescados"><i class='bx bx-water'></i> Pescado</button>
                <button class="tab-btn desktop-tab-pill ${currentMenuTab==='Pastas'?'active':''}" data-tab="Pastas"><i class='bx bx-restaurant'></i> Pastas</button>
                <button class="tab-btn desktop-tab-pill ${currentMenuTab==='Postres'?'active':''}" data-tab="Postres"><i class='bx bx-cake'></i> Postre</button>
                <button class="tab-btn desktop-tab-pill ${currentMenuTab==='Bebidas'?'active':''}" data-tab="Bebidas"><i class='bx bx-drink'></i> Bebidas</button>
            </div>

                    <div id="menu-container" style="margin-top:1rem; overflow-y:auto; flex:1;"></div>
                </div>
                <div class="order-section" id="order-panel">
                    <!-- Order details injected here -->
                </div>
                <button class="mobile-cart-toggle" id="btn-mobile-cart" class="hidden">🛒 Ver Pedido</button>
            </div>
        `;
        container.innerHTML = html;

        document.getElementById('btn-back-tables').addEventListener('click', renderTablesGrid);
        
        const searchInput = document.getElementById('menu-search-camarero');
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderMenu();
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentMenuTab = e.target.dataset.tab;
                searchQuery = '';
                searchInput.value = '';
                renderMenu();
            });
        });

        const btnMobileCart = document.getElementById('btn-mobile-cart');
        if (window.innerWidth <= 768) {
            btnMobileCart.classList.remove('hidden');
            btnMobileCart.addEventListener('click', () => {
                document.getElementById('order-panel').classList.toggle('open');
            });
        }

        renderMenu();
        updateOrderPanel();
    };

    const renderMenu = () => {
        const mContainer = document.getElementById('menu-container');
        mContainer.innerHTML = '';
        
        let filtered = globalState.menu.filter(p => p.status === 'Activo');
        
        if (searchQuery) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));
        } else if (currentMenuTab === '⭐') {
            // Get top 5 most ordered items overall
            const countMap = {};
            globalState.orders.forEach(o => {
                o.items.forEach(i => countMap[i.id] = (countMap[i.id] || 0) + i.qty);
            });
            const topIds = Object.entries(countMap).sort((a,b) => b[1]-a[1]).slice(0, 5).map(e => e[0]);
            filtered = filtered.filter(p => topIds.includes(p.id));
        } else {
            filtered = filtered.filter(p => p.category === currentMenuTab);
        }

        // Group by subcourse if any
        const groups = {};
        filtered.forEach(p => {
            const sc = p.subcourse || 'Otros';
            if (!groups[sc]) groups[sc] = [];
            groups[sc].push(p);
        });

        Object.keys(groups).sort().forEach(sc => {
            if (sc !== 'Otros') {
                mContainer.insertAdjacentHTML('beforeend', `<h4 style="margin: 1rem 0 0.5rem 0; border-bottom:1px solid var(--color-border); color:var(--color-text-muted);">${sc.toUpperCase()}</h4>`);
            }
            
            const itemsGrid = document.createElement('div');
            itemsGrid.className = 'items-grid';
            
            groups[sc].forEach(item => {
                const hasAllergens = item.ingredients && item.ingredients.some(i => i.isAllergen);
                const allergenIcon = hasAllergens ? `<span style="color:var(--color-danger); cursor:help;" title="Contiene alérgenos" onclick="event.stopPropagation(); alert('Contiene alérgenos. Ver pestaña alérgenos para más detalles.');">⚠️</span>` : '';
                
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                itemCard.innerHTML = `
                    <div>
                        <div class="item-name">${item.name} ${allergenIcon}</div>
                    </div>
                    <div class="item-price">
                        ${item.price.toFixed(2)} €
                    </div>
                `;
                
                itemCard.addEventListener('click', (e) => {
                    addItemToDraft(item);
                });
                itemsGrid.appendChild(itemCard);
            });
            mContainer.appendChild(itemsGrid);
        });
    };

    const addItemToDraft = (item) => {
        const dest = getCategoryDestination(item.category);
        const hasMods = (item.hasPuntoCarne || item.hasSinGluten || item.hasSinLactosa || item.hasSinSal);
        const hasIngs = item.ingredients && item.ingredients.some(i => i.isEliminable);
        
        if (!hasMods && !hasIngs) {
            const existing = draftOrder.items.find(i => i.id === item.id && !i.note);
            if (existing) {
                existing.qty++;
            } else {
                draftOrder.items.push({ ...item, qty: 1, note: '', dest, course: item.category });
            }
            updateOrderPanel();
            return;
        }

        let ingsHtml = '';
        if (hasIngs) {
            ingsHtml = `
                <div style="margin-bottom:1rem; border:1px solid var(--color-border); padding:0.5rem; border-radius:4px;">
                    <h4 style="margin-bottom:0.5rem; font-size:0.9rem;">Ingredientes (desmarcar para quitar)</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.9rem;">
                        ${item.ingredients.filter(i => i.isEliminable).map(ing => `
                            <label style="display:flex; align-items:center; gap:0.25rem;">
                                <input type="checkbox" class="ing-checkbox" value="${ing.name}" checked> ${ing.name}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        let modHtml = '';
        if (hasMods) {
            modHtml = `<div style="margin-bottom:1rem; border:1px solid var(--color-border); padding:0.5rem; border-radius:4px;">`;
            if (item.hasPuntoCarne) {
                modHtml += `
                    <h4 style="margin-bottom:0.5rem; font-size:0.9rem;">Punto de carne</h4>
                    <div style="display:flex; gap:1rem; margin-bottom:0.5rem; font-size:0.9rem;">
                        <label><input type="radio" name="punto" value="Poco hecho"> Poco hecho</label>
                        <label><input type="radio" name="punto" value="Al punto" checked> Al punto</label>
                        <label><input type="radio" name="punto" value="Muy hecho"> Muy hecho</label>
                    </div>
                `;
            }
            if (item.hasSinGluten || item.hasSinLactosa || item.hasSinSal) {
                modHtml += `<h4 style="margin-bottom:0.5rem; font-size:0.9rem; margin-top:0.5rem;">Avisos</h4>`;
                modHtml += `<div style="display:flex; gap:1rem; font-size:0.9rem;">`;
                if (item.hasSinGluten) modHtml += `<label><input type="checkbox" class="mod-checkbox" value="Sin gluten"> Sin gluten</label>`;
                if (item.hasSinLactosa) modHtml += `<label><input type="checkbox" class="mod-checkbox" value="Sin lactosa"> Sin lactosa</label>`;
                if (item.hasSinSal) modHtml += `<label><input type="checkbox" class="mod-checkbox" value="Sin sal"> Sin sal</label>`;
                modHtml += `</div>`;
            }
            modHtml += `</div>`;
        }
        
        const html = `
            ${ingsHtml}
            ${modHtml}
            <textarea id="item-note" placeholder="Nota libre..." style="width:100%; height:60px; padding:0.5rem;"></textarea>
        `;
        
        const modalId = showModal(`Añadir ${item.name}`, html, `<button class="btn btn-primary" id="btn-confirm-item">Añadir al pedido</button>`);
        
        document.getElementById('btn-confirm-item').addEventListener('click', () => {
            const mods = [];
            
            // Check removed ingredients
            const uncheckedIngs = Array.from(document.querySelectorAll('.ing-checkbox:not(:checked)')).map(c => c.value);
            uncheckedIngs.forEach(ing => mods.push(`Sin ${ing.toLowerCase()}`));

            if (hasMods) {
                if (item.hasPuntoCarne) {
                    const punto = document.querySelector('input[name="punto"]:checked')?.value;
                    if (punto) mods.push(`Punto: ${punto}`);
                }
                const checks = document.querySelectorAll('.mod-checkbox:checked');
                Array.from(checks).forEach(c => mods.push(c.value));
            }

            const note = document.getElementById('item-note').value.trim();
            if (note) mods.push(note);
            
            const noteStr = mods.join(' · ');

            const existing = draftOrder.items.find(i => i.id === item.id && i.note === noteStr);
            if (existing) {
                existing.qty++;
            } else {
                draftOrder.items.push({ ...item, qty: 1, note: noteStr, dest, course: item.category });
            }
            closeModal(modalId);
            updateOrderPanel();
        });
    };

    const updateOrderPanel = () => {
        const panel = document.getElementById('order-panel');
        if (!panel) return;
        
        const activeOrders = globalState.orders.filter(o => o.tableId === currentTable.id && o.status !== 'pagado');
        const isAdditional = activeOrders.length > 0;
        
        // Allergen check
        let hasAllergensInTable = draftOrder.items.some(i => i.ingredients && i.ingredients.some(ing => ing.isAllergen));
        activeOrders.forEach(o => {
            if (o.items.some(i => i.ingredients && i.ingredients.some(ing => ing.isAllergen))) {
                hasAllergensInTable = true;
            }
        });

        let existingHtml = '';
        if (activeOrders.length > 0) {
            // Group active items by course
            const activeByCourse = {};
            activeOrders.forEach(o => {
                o.items.forEach((i, idx) => {
                    const course = i.course || 'Otros';
                    if (!activeByCourse[course]) activeByCourse[course] = [];
                    activeByCourse[course].push({ ...i, oId: o.id, idx });
                });
            });

            existingHtml = `
                <div style="padding: 0.5rem 1rem; background: var(--color-surface-hover); border-bottom: 1px solid var(--color-border);">
                    <strong>Pedidos en curso:</strong><br>
                    <div style="font-size:0.9rem; margin-top:0.5rem;">
                        ${Object.keys(activeByCourse).map(course => `
                            <div style="color:var(--color-primary); font-size:0.8rem; font-weight:bold; margin-top:0.5rem;">── ${course.toUpperCase()} ──</div>
                            <ul style="margin-left: 1rem; color: var(--color-text-muted); list-style:none; padding:0;">
                                ${activeByCourse[course].map(i => `
                                    <li style="display:flex; justify-content:space-between; margin-bottom:4px; padding-left:10px; border-left:2px solid ${i.isReady ? 'var(--color-free)' : 'var(--color-warning)'};">
                                        <span>${i.qty}x ${i.name} ${i.isReady ? '✅' : '⏳'}</span>
                                        <button class="btn btn-secondary" style="padding:2px 8px; font-size:0.8rem;" data-mark-served="${i.oId}-${i.idx}">Servir</button>
                                    </li>
                                `).join('')}
                            </ul>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const renderDraftGroup = (groupItems, label) => {
            if (groupItems.length === 0) return '';
            return `
                <div class="order-group-title" style="margin-top:1rem; font-size:0.85rem;">── ${label.toUpperCase()} ──</div>
                ${groupItems.map(item => {
                    const index = draftOrder.items.indexOf(item);
                    return `
                    <div class="order-item-row" style="padding-left:0.5rem;">
                        <div style="flex:1">
                            <div style="font-weight:600">${item.qty}x ${item.name}</div>
                            ${item.note ? `<div style="font-size:0.8rem; color:var(--color-text-muted);">${item.note}</div>` : ''}
                            <div style="color:var(--color-primary); font-size:0.9rem;">${(item.price * item.qty).toFixed(2)} €</div>
                        </div>
                        <div class="qty-controls">
                            <button class="qty-btn" data-action="dec" data-idx="${index}">-</button>
                            <span style="font-weight:bold; width:20px; text-align:center;">${item.qty}</span>
                            <button class="qty-btn" data-action="inc" data-idx="${index}">+</button>
                            <button class="qty-btn del" data-action="del" data-idx="${index}">×</button>
                        </div>
                    </div>
                `}).join('')}
            `;
        };

        const draftByCourse = {};
        draftOrder.items.forEach(i => {
            const course = i.course || 'Otros';
            if (!draftByCourse[course]) draftByCourse[course] = [];
            draftByCourse[course].push(i);
        });

        let draftHtml = Object.keys(draftByCourse).map(course => renderDraftGroup(draftByCourse[course], course)).join('');

        if (draftOrder.items.length === 0) {
            draftHtml = `<div style="text-align:center; color:var(--color-text-muted); margin-top:2rem;">Selecciona productos para el pedido.</div>`;
        }

        const total = draftOrder.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const grandTotal = total + activeOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.price * i.qty), 0), 0);

        const adminMode = window.app && window.app.currentUser && window.app.currentUser.isAdmin || (window.auth && window.auth.isAdmin && window.auth.isAdmin());

        panel.innerHTML = `
            <div class="order-header">
                <h2>Mesa ${currentTable.id} ${isAdditional ? '<span style="color:var(--color-warning);font-size:1rem;">(Añadir +)</span>' : ''}</h2>
                <div style="font-size:0.9rem; color:var(--color-text-muted);">Comensales: ${currentTable.guests} ${currentTable.name ? `| ${currentTable.name}` : ''}</div>
                ${hasAllergensInTable ? `<div style="margin-top:0.5rem; background:var(--color-danger); color:white; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem; text-align:center;">⚠️ ALÉRGENOS EN MESA</div>` : ''}
            </div>
            ${existingHtml}
            <div class="order-items">
                ${draftHtml}
            </div>
            <div class="order-footer" style="background:#ffffff; border-top:1px solid var(--color-border); padding:1rem; box-shadow:0 -4px 10px rgba(0,0,0,0.02);">
                <div class="order-total" style="font-size:1rem; margin-bottom:0.3rem; display:flex; justify-content:space-between; font-weight:600;">
                    <span>Subtotal nuevo:</span>
                    <span style="color:var(--color-primary);">${total.toFixed(2)} €</span>
                </div>
                ${isAdditional ? `
                <div class="order-total" style="font-size:0.9rem; color:var(--color-text-muted); display:flex; justify-content:space-between; margin-bottom:0.5rem; font-weight:500;">
                    <span>Total acumulado:</span>
                    <span>${grandTotal.toFixed(2)} €</span>
                </div>` : ''}
                <div class="action-buttons" style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.8rem;">
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-secondary btn-full" id="btn-copy-order" ${activeOrders.length === 0 && draftOrder.items.length === 0 ? 'disabled' : ''} style="flex:1;">📄 Copiar</button>
                    </div>
                    <button class="btn btn-primary btn-full ${draftOrder.items.length > 0 ? 'pulse-btn' : ''}" id="btn-send-kitchen" ${draftOrder.items.length === 0 ? 'disabled' : ''} style="font-size:1.1rem; padding:0.8rem; border-radius:12px; font-weight:700; display:flex; justify-content:center; align-items:center; gap:0.5rem; transition:all 0.3s;">
                        🔔 Enviar a Cocina / Barra
                    </button>
                    <button class="btn btn-success btn-full" id="btn-checkout" ${grandTotal === 0 ? 'disabled' : ''} style="font-size:1rem; padding:0.8rem; border-radius:12px; font-weight:600;">
                        💳 Cobrar Mesa
                    </button>
                    ${adminMode ? `
                    <button class="btn btn-secondary btn-full" id="btn-force-close" style="border-color:var(--color-danger); color:var(--color-danger); margin-top:0.5rem; background:transparent;">
                        ⚠️ Forzar Cierre
                    </button>` : ''}
                </div>
            </div>
            <style>
                @keyframes pulse-primary {
                    0% { box-shadow: 0 0 0 0 rgba(139, 0, 0, 0.4); transform: scale(1); }
                    70% { box-shadow: 0 0 0 10px rgba(139, 0, 0, 0); transform: scale(1.02); }
                    100% { box-shadow: 0 0 0 0 rgba(139, 0, 0, 0); transform: scale(1); }
                }
                .pulse-btn { animation: pulse-primary 2s infinite; }
                .pulse-btn:hover { animation: none; transform: translateY(-2px); box-shadow: 0 8px 15px rgba(139,0,0,0.2); }
            </style>
        `;

        panel.querySelectorAll('[data-mark-served]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const [oId, idx] = e.target.dataset.markServed.split('-');
                const o = globalState.orders.find(ord => ord.id === oId);
                if (o) {
                    o.items[parseInt(idx)].isReady = true;
                    e.target.closest('li').style.textDecoration = 'line-through';
                    e.target.remove();
                    globalState.createOrders([], [], {tableId: -1}); 
                }
            });
        });

        panel.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                const action = e.target.dataset.action;
                if (action === 'inc') draftOrder.items[idx].qty++;
                if (action === 'dec') {
                    draftOrder.items[idx].qty--;
                    if (draftOrder.items[idx].qty <= 0) draftOrder.items.splice(idx, 1);
                }
                if (action === 'del') draftOrder.items.splice(idx, 1);
                updateOrderPanel();
            });
        });

        const btnCopy = document.getElementById('btn-copy-order');
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                const html = `
                    <div style="display:flex; flex-direction:column; gap:0.5rem;">
                        <label>Selecciona la mesa de la que quieres copiar el pedido:</label>
                        <select id="copy-table-select" style="padding:0.5rem;">
                            ${globalState.tables.filter(t => t.id !== currentTable.id && globalState.orders.some(o => o.tableId === t.id && o.status !== 'pagado')).map(t => `<option value="${t.id}">Mesa ${t.id}</option>`).join('')}
                        </select>
                    </div>
                `;
                const modalId = showModal('Copiar pedido', html, `<button class="btn btn-primary" id="btn-confirm-copy">Copiar</button>`);
                document.getElementById('btn-confirm-copy')?.addEventListener('click', () => {
                    const tid = parseInt(document.getElementById('copy-table-select').value);
                    if (tid) {
                        const sourceOrders = globalState.orders.filter(o => o.tableId === tid && o.status !== 'pagado');
                        sourceOrders.forEach(o => {
                            o.items.forEach(i => {
                                draftOrder.items.push({...i}); // clone
                            });
                        });
                        updateOrderPanel();
                    }
                    closeModal(modalId);
                });
            });
        }

        const btnSend = document.getElementById('btn-send-kitchen');
        if (btnSend) {
            btnSend.addEventListener('click', () => {
                const kitchenItems = draftOrder.items.filter(i => i.dest === 'cocina');
                const barItems = draftOrder.items.filter(i => i.dest === 'barra');
                globalState.createOrders(kitchenItems, barItems, {
                    tableId: currentTable.id,
                    guests: currentTable.guests,
                    isAdditional,
                    waiterName: app.currentUser ? app.currentUser.alias : 'Desconocido'
                });
                renderTablesGrid();
            });
        }

        const btnForceClose = document.getElementById('btn-force-close');
        if (btnForceClose) {
            btnForceClose.addEventListener('click', () => {
                if (confirm('⚠️ ¿Estás seguro de cerrar esta mesa manualmente sin generar cobro ni ticket? Esto es una acción de Administrador.')) {
                    globalState.closeTable(currentTable.id);
                    renderTablesGrid();
                }
            });
        }

        const btnCheckout = document.getElementById('btn-checkout');
        if (btnCheckout) {
            btnCheckout.addEventListener('click', () => {
                const html = `
                    <div style="text-align:center;">
                        <h2>Total a pagar: ${grandTotal.toFixed(2)} €</h2>
                        <div style="margin-top:2rem; display:flex; gap:1rem; justify-content:center;">
                            <button class="pay-method" data-method="efectivo" style="display:flex;align-items:center;gap:.75rem;padding:1rem;border-radius:12px;border:2px solid var(--color-border);background:var(--color-bg);color:var(--color-text);cursor:pointer;font-size:1rem;font-weight:600;transition:all .15s;">
                                <span style="font-size:1.4rem;"><i class='bx bx-money'></i></span> Efectivo
                            </button>
                            <button class="pay-method" data-method="tarjeta" style="display:flex;align-items:center;gap:.75rem;padding:1rem;border-radius:12px;border:2px solid var(--color-border);background:var(--color-bg);color:var(--color-text);cursor:pointer;font-size:1rem;font-weight:600;transition:all .15s;">
                                <span style="font-size:1.4rem;"><i class='bx bx-credit-card'></i></span> Tarjeta
                            </button>
                            <button class="pay-method" data-method="dividida" style="display:flex;align-items:center;gap:.75rem;padding:1rem;border-radius:12px;border:2px solid var(--color-border);background:var(--color-bg);color:var(--color-text);cursor:pointer;font-size:1rem;font-weight:600;transition:all .15s;">
                                <span style="font-size:1.4rem;"><i class='bx bx-group'></i></span> Pago Dividido
                            </button>
                        </div>
                    </div>
                `;
                const modalId = showModal(`Cobrar Mesa ${currentTable.id}`, html);
                
                const processPayment = (method) => {
                    tickets.printCobro(currentTable, activeOrders, grandTotal, method);
                    globalState.closeTable(currentTable.id);
                    closeModal(modalId);
                    renderTablesGrid();
                };
                
                document.querySelectorAll('.pay-method').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const method = btn.dataset.method;
                        if (method === 'dividida') {
                            const splitHtml = `
                                <div style="text-align:center;">
                                    <label>¿Entre cuántas personas?</label>
                                    <input type="number" id="split-count" min="2" max="20" value="2" style="width:60px; margin-left:1rem; padding:0.5rem; border-radius:4px; border:1px solid var(--color-border);">
                                    <div style="margin-top:1.5rem; font-size:1.2rem;" id="split-calc"></div>
                                    <button class="btn btn-primary" id="btn-confirm-split" style="margin-top:1.5rem; width:100%;">Confirmar Pago</button>
                                </div>
                            `;
                            const splitModalId = showModal('Dividir Cuenta', splitHtml);
                            closeModal(modalId);
                            
                            const updateSplit = () => {
                                const count = parseInt(document.getElementById('split-count').value) || 1;
                                const perPerson = grandTotal / count;
                                document.getElementById('split-calc').innerHTML = `<strong>${perPerson.toFixed(2)} €</strong> por persona`;
                            };
                            
                            document.getElementById('split-count').addEventListener('input', updateSplit);
                            updateSplit();
                            
                            document.getElementById('btn-confirm-split').addEventListener('click', () => {
                                tickets.printCobro(currentTable, activeOrders, grandTotal, 'dividida');
                                globalState.closeTable(currentTable.id);
                                closeModal(splitModalId);
                                renderTablesGrid();
                            });
                        } else {
                            processPayment(method);
                        }
                    });
                });
            });
        }
    };

    const notifiedOrders = new Set();
    const showNotification = (msg) => {
        let banner = document.getElementById('ready-notification-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'ready-notification-banner';
            banner.className = 'notification-banner';
            document.body.appendChild(banner);
        }
        banner.textContent = msg;
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), 5000);
    };

    const updateHandler = (state, key) => {
        if (key === 'orders') {
            const newlyReady = globalState.orders.filter(o => o.status === 'listo' && !notifiedOrders.has(o.id));
            if (newlyReady.length > 0) {
                newlyReady.forEach(o => {
                    notifiedOrders.add(o.id);
                    showNotification(`✅ Mesa ${o.tableId} — ${o.dest.charAt(0).toUpperCase() + o.dest.slice(1)} lista para servir`);
                });
            }
        }
        
        if (key === 'kitchenPaused' && document.querySelector('.waiter-view')) {
            renderTablesGrid(); 
        } else if (document.getElementById('tables-container')) {
            updateTables();
        } else if (document.getElementById('order-panel') && currentTable) {
            currentTable = globalState.tables.find(t => t.id === currentTable.id);
            updateOrderPanel();
        }
    };
    globalState.subscribe(updateHandler);

    renderTablesGrid();

    const interval = setInterval(() => {
        if (document.getElementById('tables-container')) {
            updateTables();
        }
    }, 60000); 
}
