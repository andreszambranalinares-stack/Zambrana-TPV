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
            return `<div class="mobile-table-card" style="background:${bg};color:${textColor};flex-direction:column;gap:2px;cursor:pointer;" data-table-id="${t.id}">
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
                <div class="desktop-col-body">
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:1rem;">
                        ${tables}
                    </div>
                    <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--color-border);display:flex;gap:1.5rem;font-size:0.8rem;flex-wrap:wrap;">
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

    const renderMesaDetail = (tableId) => {
        const t = globalState.tables.find(x=>x.id===tableId);
        if (!t) return;
        const panel = document.getElementById('mesa-detail-panel');
        if (!panel) return;

        const orders = globalState.orders.filter(o=>o.tableId===tableId&&o.status!=='pagado');
        const total = orders.reduce((s,o)=>s+o.items.reduce((ss,i)=>ss+i.price*i.qty,0),0);

        let html = '';
        if (t.status === 'libre') {
            html = `
                <div style="text-align:center;padding:1rem 0;">
                    <div style="font-size:2.5rem;margin-bottom:0.5rem;color:var(--color-free);"><i class='bx bx-check-circle'></i></div>
                    <div style="font-weight:700;color:var(--color-free);">Mesa ${String(tableId).padStart(2,'0')} - Libre</div>
                    <button class="btn btn-primary" style="margin-top:1rem;width:100%;" id="btn-quick-open">Abrir Mesa</button>
                </div>`;
        } else {
            html = `
                <div style="margin-bottom:1rem;">
                    <div style="font-weight:800;color:var(--color-primary-light);font-size:1.1rem;">Mesa ${String(tableId).padStart(2,'0')}</div>
                    <div style="font-size:0.85rem;color:var(--color-text-muted);">${t.guests ? `<i class='bx bx-user'></i> ${t.guests} comensales` : ''} ${t.name||''}</div>
                </div>
                ${orders.map(o=>`
                    <div style="background:var(--color-surface-hover);border-radius:8px;padding:0.8rem;margin-bottom:0.5rem;">
                        <div style="font-size:0.75rem;font-weight:700;color:var(--color-primary-light);margin-bottom:0.5rem;">Comanda</div>
                        ${o.items.map(i=>`<div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:2px 0;"><span>${i.qty}x ${i.name}</span><span>${(i.price*i.qty).toFixed(2)}€</span></div>`).join('')}
                    </div>
                `).join('')}
                <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem;padding:1rem 0;border-top:1px solid var(--color-border);margin-top:0.5rem;">
                    <span>Total</span><span>${total.toFixed(2)} €</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                    <button class="btn btn-success" id="btn-cobrar-mesa"><i class='bx bx-credit-card'></i> Cobrar Mesa</button>
                    <button class="btn btn-secondary" id="btn-liberar-mesa"><i class='bx bx-reset'></i> Liberar (sin cobrar)</button>
                </div>`;
        }
        panel.innerHTML = html;

        const btnQuickOpen = document.getElementById('btn-quick-open');
        if (btnQuickOpen) {
            btnQuickOpen.addEventListener('click', ()=>{
                globalState.updateTable(tableId,{status:'ocupada',openedAt:Date.now(),guests:2});
                render();
            });
        }
        const btnCobrar = document.getElementById('btn-cobrar-mesa');
        if (btnCobrar) {
            btnCobrar.addEventListener('click',()=>{
                globalState.closeTable(tableId);
                app.showToast('Mesa cobrada y liberada');
                render();
            });
        }
        const btnLiberar = document.getElementById('btn-liberar-mesa');
        if (btnLiberar) {
            btnLiberar.addEventListener('click',()=>{
                globalState.closeTable(tableId);
                render();
            });
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
