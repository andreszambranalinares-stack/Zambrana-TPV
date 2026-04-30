import { globalState } from '../state.js';
import { formatTimeElapsed } from './common.js';

export function renderCocinero(container, app) {
    let timerInterval = null;
    let currentFilter = 'Todos';

    const render = () => {
        container.innerHTML = `
            <div class="cook-view">
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem; background:var(--color-surface); padding:1rem; border-radius:var(--radius-sm); align-items:center; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <strong>Comandas activas:</strong> <span id="stat-active">0</span> | 
                        <strong>Listas:</strong> <span id="stat-ready">0</span>
                    </div>
                    <div class="menu-tabs" style="margin:0; padding:0; border:none; display:flex; gap:0.5rem;">
                        <button class="tab-btn active" data-filter="Todos">Todos</button>
                        <button class="tab-btn" data-filter="Entrante">Entrantes</button>
                        <button class="tab-btn" data-filter="Primer plato">Primeros</button>
                        <button class="tab-btn" data-filter="Segundo plato">Segundos</button>
                    </div>
                    <button class="btn btn-secondary" id="btn-pause-kitchen">Pausar Cocina (Ocupado)</button>
                </div>
                <div class="cook-kanban" id="kanban-container">
                    <div class="kanban-col">
                        <div class="kanban-header">En preparación</div>
                        <div class="kanban-body" id="col-prep"></div>
                    </div>
                    <div class="kanban-col">
                        <div class="kanban-header" style="background:var(--color-free);">Listas para servir</div>
                        <div class="kanban-body" id="col-ready"></div>
                    </div>
                </div>
            </div>
        `;

        const btnPause = document.getElementById('btn-pause-kitchen');
        if (globalState.isKitchenPaused) {
            btnPause.classList.add('btn-danger');
            btnPause.classList.remove('btn-secondary');
            btnPause.style.background = 'var(--color-danger)';
            btnPause.style.color = 'white';
            btnPause.textContent = 'Reanudar Cocina';
            document.getElementById('kanban-container').style.opacity = '0.5';
        }

        btnPause.addEventListener('click', (e) => {
            const isPaused = !globalState.isKitchenPaused;
            globalState.setKitchenPaused(isPaused);
            if (!isPaused) {
                e.target.classList.remove('btn-danger');
                e.target.classList.add('btn-secondary');
                e.target.style.background = '';
                e.target.style.color = '';
                e.target.textContent = 'Pausar Cocina (Ocupado)';
                document.getElementById('kanban-container').style.opacity = '1';
            } else {
                e.target.classList.add('btn-danger');
                e.target.classList.remove('btn-secondary');
                e.target.style.background = 'var(--color-danger)';
                e.target.style.color = 'white';
                e.target.textContent = 'Reanudar Cocina';
                document.getElementById('kanban-container').style.opacity = '0.5';
            }
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                updateBoard();
            });
        });

        updateBoard();

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateTimes, 1000);
    };

    const updateBoard = () => {
        const colPrep = document.getElementById('col-prep');
        const colReady = document.getElementById('col-ready');
        if (!colPrep || !colReady) return;

        let activeOrders = globalState.orders.filter(o => o.status === 'en_cocina' && o.dest === 'cocina');
        let readyOrders = globalState.orders.filter(o => o.status === 'listo' && o.dest === 'cocina');

        document.getElementById('stat-active').textContent = activeOrders.length;
        document.getElementById('stat-ready').textContent = readyOrders.length;

        // Sort active by timestamp ascending
        activeOrders.sort((a, b) => a.timestamp - b.timestamp);
        
        colPrep.innerHTML = activeOrders.map(order => createTicketHTML(order, true)).join('');
        colReady.innerHTML = readyOrders.map(order => createTicketHTML(order, false)).join('');

        // Bind events for prep column
        activeOrders.forEach(order => {
            // "Enviar seleccionados"
            const btnSendSelected = document.getElementById(`btn-send-sel-${order.id}`);
            if (btnSendSelected) {
                btnSendSelected.addEventListener('click', () => {
                    const readyIndices = [];
                    order.items.forEach((item, idx) => {
                        const check = document.getElementById(`check-${order.id}-${idx}`);
                        if (check && check.checked) {
                            readyIndices.push(idx);
                        }
                    });
                    
                    if (readyIndices.length > 0) {
                        globalState.splitOrderToReady(order.id, readyIndices);
                    }
                });
            }

            // "TODO LISTO"
            const btnAllReady = document.getElementById(`btn-ready-all-${order.id}`);
            if (btnAllReady) {
                btnAllReady.addEventListener('click', () => {
                    order.items.forEach(i => i.isReady = true);
                    globalState.updateOrderStatus(order.id, 'listo');
                });
            }
        });

        readyOrders.forEach(order => {
            const btn = document.getElementById(`btn-served-${order.id}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    globalState.updateOrderStatus(order.id, 'servido');
                });
            }
        });
        
        updateTimes();
    };

    const getCourseIcon = (course) => {
        if (course === 'Entrante') return '🥗';
        if (course === 'Primer plato') return '🍲';
        if (course === 'Segundo plato') return '🥩';
        return '🍽️';
    };

    const createTicketHTML = (order, isPrep) => {
        // Group items by course
        const courses = {};
        let hasVisibleItems = false;

        order.items.forEach((item, idx) => {
            const c = item.course || 'Otros';
            if (currentFilter !== 'Todos' && c !== currentFilter && c !== 'Otros') return; // hide if filtered
            if (!courses[c]) courses[c] = [];
            courses[c].push({ ...item, idx });
            hasVisibleItems = true;
        });

        // If filtering and no items match, don't render ticket at all
        if (!hasVisibleItems && isPrep && currentFilter !== 'Todos') return '';

        // Calculate course progress
        const courseProgress = {};
        order.items.forEach(item => {
            const c = item.course || 'Otros';
            if (!courseProgress[c]) courseProgress[c] = { total: 0, ready: 0 };
            courseProgress[c].total++;
            if (item.isReady) courseProgress[c].ready++;
        });

        const progressIndicators = Object.keys(courseProgress).map(c => {
            const p = courseProgress[c];
            const statusIcon = p.ready === p.total ? '✅' : '⏳';
            return `${c.split(' ')[0]} ${statusIcon}`;
        }).join(' · ');

        let itemsHtml = Object.keys(courses).map(c => {
            const courseItems = courses[c].map(item => `
                <li class="ticket-item" style="border-bottom: 1px dashed var(--color-border); padding-bottom: 0.5rem;">
                    ${isPrep && !item.isReady ? `<input type="checkbox" class="ticket-item-check" id="check-${order.id}-${item.idx}" style="transform: scale(1.5); margin-right: 1rem; cursor:pointer;">` : ''}
                    <div style="flex:1; ${item.isReady && isPrep ? 'text-decoration:line-through; opacity:0.5;' : ''}">
                        <span class="ticket-item-qty">${item.qty}x</span> <strong>${item.name}</strong> ${item.isReady ? '✅' : ''}
                        ${item.note ? `<div class="ticket-notes" style="color:var(--color-danger);">${item.note}</div>` : ''}
                    </div>
                </li>
            `).join('');

            return `
                <div style="margin-top:0.5rem; margin-bottom:0.5rem; font-weight:bold; color:var(--color-primary); border-bottom:2px solid var(--color-primary); padding-bottom:2px;">
                    ── ${c.toUpperCase()} ──
                </div>
                <ul class="ticket-items" style="list-style:none; padding:0; margin:0;">
                    ${courseItems}
                </ul>
            `;
        }).join('');

        const tagAdd = order.isAdditional ? `<span class="ticket-tag-additional">⚡ ADICIONAL</span>` : '';
        const timeAttr = `data-timestamp="${order.timestamp}"`;
        const readyAttr = order.readyAt ? `data-ready-timestamp="${order.readyAt}"` : '';

        return `
            <div class="ticket-card" id="ticket-${order.id}">
                <div class="ticket-header">
                    <div class="ticket-table">MESA ${order.tableId} ${tagAdd}</div>
                    <div class="ticket-time" id="time-${order.id}" ${timeAttr} ${readyAttr}></div>
                </div>
                <div style="font-size:0.8rem; margin-bottom:0.5rem; color:var(--color-text-muted);">
                    Camarero: <strong>${order.waiterName || 'Desconocido'}</strong> | ${new Date(order.timestamp).toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}
                </div>
                <div style="font-size:0.75rem; background:var(--color-surface-hover); padding:0.25rem 0.5rem; border-radius:4px; margin-bottom:0.5rem; text-align:center;">
                    ${progressIndicators}
                </div>
                ${itemsHtml}
                ${isPrep ? `
                    <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                        <button class="btn btn-secondary" style="flex:1; font-size:0.9rem;" id="btn-send-sel-${order.id}">
                            Enviar Seleccionados ✅
                        </button>
                        <button class="btn btn-primary" style="flex:1; font-size:0.9rem;" id="btn-ready-all-${order.id}">
                            TODO LISTO
                        </button>
                    </div>
                ` : `
                    <button class="btn btn-secondary" style="width:100%; border-color:var(--color-free); color:var(--color-free); margin-top:1rem;" id="btn-served-${order.id}">
                        Marcar como Entregado
                    </button>
                `}
            </div>
        `;
    };

    const updateTimes = () => {
        document.querySelectorAll('.ticket-time').forEach(el => {
            const ts = el.getAttribute('data-timestamp');
            const readyTs = el.getAttribute('data-ready-timestamp');
            
            if (readyTs) {
                const diffMins = (Date.now() - parseInt(readyTs)) / 60000;
                el.textContent = `Esperando: ${formatTimeElapsed(parseInt(readyTs))}`;
                if (diffMins > 5) el.style.color = 'var(--color-danger)';
            } else if (ts) {
                const elapsed = formatTimeElapsed(parseInt(ts));
                el.textContent = elapsed;
                
                const diffMins = (Date.now() - parseInt(ts)) / 60000;
                const warn = globalState.config.alertWarning;
                const danger = globalState.config.alertDanger;
                
                el.className = 'ticket-time';
                const card = el.closest('.ticket-card');
                card.style.borderColor = 'var(--color-border)';

                if (diffMins > danger) {
                    el.classList.add('danger');
                    card.style.borderColor = 'var(--color-danger)';
                } else if (diffMins > warn) {
                    el.classList.add('warning');
                    card.style.borderColor = 'var(--color-warning)';
                }
            }
        });
    };

    globalState.subscribe(() => {
        if (document.getElementById('col-prep')) {
            updateBoard();
        }
    });

    render();
}
