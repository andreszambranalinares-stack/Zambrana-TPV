import { globalState } from '../state.js';
import { showModal, closeModal } from './common.js';
import { getCategoryDestination } from '../data.js';
import { tickets } from '../tickets.js';

export function renderMobileCamarero(container, app) {
    let currentTab = 'mesas'; // mesas, comandas, productos, mas
    let subView = null; // null = main tab, 'table_detail' = viewing a specific table
    let activeTableId = null;
    let draftOrder = { items: [] };
    let currentMenuCategory = 'Entrante';
    let searchQuery = '';

    const render = () => {
        container.innerHTML = `
            <div class="mobile-layout">
                ${renderHeader()}
                <main class="mobile-main" id="mobile-main-content">
                    ${renderContent()}
                </main>
                ${subView === null ? renderBottomNav() : ''}
            </div>
        `;
        bindEvents();
    };

    const renderHeader = () => {
        let title = 'Zambrana TPV';
        let leftIcon = '';
        let rightIcon = '<button class="btn-icon" style="color:white;width:auto;height:auto;" id="btn-search"><i class="bx bx-search"></i></button>';

        if (subView === 'table_detail' || subView === 'nueva_comanda') {
            title = `Mesa ${activeTableId.toString().padStart(2,'0')}`;
            leftIcon = '<button class="btn-icon" style="color:white;width:auto;height:auto;" id="btn-back"><i class="bx bx-arrow-back"></i></button>';
            rightIcon = '';
        } else if (subView === 'order_detail') {
            title = `Detalle comanda`;
            leftIcon = '<button class="btn-icon" style="color:white;width:auto;height:auto;" id="btn-back"><i class="bx bx-arrow-back"></i></button>';
            rightIcon = '';
        } else if (currentTab === 'mesas') title = 'Mesas';
        else if (currentTab === 'comandas') title = 'Comandas';
        else if (currentTab === 'productos') title = 'Productos';
        else if (currentTab === 'mas') title = 'Ajustes';

        return `
            <header class="mobile-header">
                <div>${leftIcon}</div>
                <div class="mobile-header-title">${title}</div>
                <div>${rightIcon}</div>
            </header>
        `;
    };

    const renderBottomNav = () => {
        return `
            <nav class="mobile-bottom-nav">
                <button class="mobile-nav-btn ${currentTab==='mesas'?'active':''}" data-tab="mesas">
                    <div class="mobile-nav-icon"><i class='bx bx-grid-alt'></i></div>
                    <div class="mobile-nav-text">Mesas</div>
                </button>
                <button class="mobile-nav-btn ${currentTab==='comandas'?'active':''}" data-tab="comandas">
                    <div class="mobile-nav-icon"><i class='bx bx-receipt'></i></div>
                    <div class="mobile-nav-text">Comandas</div>
                </button>
                <button class="mobile-nav-btn ${currentTab==='productos'?'active':''}" data-tab="productos">
                    <div class="mobile-nav-icon"><i class='bx bx-package'></i></div>
                    <div class="mobile-nav-text">Productos</div>
                </button>
                <button class="mobile-nav-btn ${currentTab==='mas'?'active':''}" data-tab="mas">
                    <div class="mobile-nav-icon"><i class='bx bx-dots-horizontal-rounded'></i></div>
                    <div class="mobile-nav-text">Más</div>
                </button>
            </nav>
        `;
    };

    const renderContent = () => {
        if (subView === 'table_detail') return renderTableDetail();
        if (subView === 'nueva_comanda') return renderNuevaComanda();
        
        if (currentTab === 'mesas') return renderMesas();
        if (currentTab === 'comandas') return renderComandas();
        if (currentTab === 'productos') return renderProductos();
        if (currentTab === 'mas') return renderMas();
        return '';
    };

    const renderMesas = () => {
        let activeTabMenu = 'Todas';
        return `
            <div class="tabs-container" style="margin-bottom:1rem;">
                <button class="tab-pill active">Todas</button>
                <button class="tab-pill">Terraza</button>
                <button class="tab-pill">Salón</button>
                <button class="tab-pill">Privado</button>
            </div>
            <div class="mobile-grid">
                ${globalState.tables.map(t => {
                    let statusColor = 'var(--color-free)';
                    if(t.status==='ocupada' || t.status==='enviada') statusColor = 'var(--color-occupied)';
                    if(t.status==='reservada') statusColor = 'var(--color-reserved)';
                    if(t.status==='cerrada') statusColor = 'var(--color-closed)';
                    
                    return `
                    <div class="mobile-table-card" style="background:${statusColor};" data-table-id="${t.id}">
                        ${t.id.toString().padStart(2, '0')}
                        ${t.status==='ocupada'?`<div class="mobile-time">10:45</div>`:''}
                    </div>
                    `;
                }).join('')}
            </div>
            <div style="margin-top:2rem; display:flex; justify-content:space-between; font-size:0.75rem; color:var(--color-text-muted);">
                <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--color-free);"></div>Libre</div>
                <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--color-occupied);"></div>Ocupada</div>
                <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--color-reserved);"></div>Reservada</div>
                <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--color-closed);"></div>Cerrada</div>
            </div>
        `;
    };

    const renderComandas = () => {
        return `
            <div class="tabs-container" style="margin-bottom:1rem;">
                <button class="tab-pill active">Todas</button>
                <button class="tab-pill">Nuevas (3)</button>
                <button class="tab-pill">En preparación</button>
                <button class="tab-pill">Listas</button>
            </div>
            ${globalState.orders.map(o => {
                let stText = 'Nueva';
                let stClass = 'nueva';
                if (o.status === 'en_cocina') { stText = 'En preparación'; stClass = 'preparacion'; }
                if (o.status === 'listo') { stText = 'Lista'; stClass = 'listo'; }
                
                return `
                <div class="order-list-item" data-order-id="${o.id}">
                    <div class="order-list-header">
                        <div class="order-list-title">#${o.id.substring(0,2)} - Mesa ${o.tableId.toString().padStart(2,'0')}</div>
                        <div class="order-list-meta">${o.items.length} productos</div>
                    </div>
                    <div class="order-list-meta" style="margin-bottom:0.5rem;">Hace 2 min</div>
                    <div class="order-list-status ${stClass}">${stText}</div>
                </div>
                `;
            }).join('')}
        `;
    };

    const renderProductos = () => {
        const categories = [...new Set(globalState.menu.map(i => i.category))];
        const catsHtml = categories.map(c => `
            <button class="tab-pill ${currentMenuCategory===c?'active':''}" data-cat="${c}">${c}</button>
        `).join('');

        const items = globalState.menu.filter(i => i.category === currentMenuCategory && i.name.toLowerCase().includes(searchQuery.toLowerCase()));

        return `
            <div style="margin-bottom:1rem;">
                <input type="text" id="search-input" placeholder="🔍 Buscar producto..." value="${searchQuery}" style="width:100%; padding:0.8rem; border-radius:var(--radius-md); background:var(--color-surface); border:1px solid var(--color-border); color:white;">
            </div>
            <div class="tabs-container" style="margin-bottom:1rem;">
                ${catsHtml}
            </div>
            <div>
                ${items.map(i => `
                    <div class="mobile-menu-item">
                        <div class="mobile-menu-item-img"><i class="bx bx-dish" style="font-size:2rem;color:var(--color-primary-light);"></i></div>
                        <div class="mobile-menu-item-info">
                            <div class="mobile-menu-item-title">${i.name}</div>
                            <div class="mobile-menu-item-price">${i.price.toFixed(2)} €</div>
                        </div>
                        <button class="mobile-menu-item-add" data-item-id="${i.id}">+</button>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const renderTableDetail = () => {
        const table = globalState.tables.find(t => t.id === activeTableId);
        const order = globalState.orders.find(o => o.tableId === activeTableId && o.status !== 'pagado');
        
        let actions = '';
        if (table.status === 'libre') {
            actions = `
                <div style="text-align:center; margin-top:2rem;">
                    <p style="color:var(--color-text-muted); margin-bottom:1rem;">Mesa libre</p>
                    <button class="btn btn-primary" style="width:100%;" id="btn-open-table">Abrir Mesa</button>
                </div>
            `;
        } else {
            const itemsHtml = order ? order.items.map(i => `
                <div class="detalle-item">
                    <div style="flex:1;">${i.qty} ${i.name}</div>
                    <div>${(i.price * i.qty).toFixed(2)} €</div>
                </div>
            `).join('') : '<p>Sin comandas</p>';
            
            const total = order ? order.items.reduce((s,i)=>s+i.price*i.qty, 0) : 0;

            actions = `
                <div class="mobile-order-detail-header">
                    <div class="mobile-order-detail-title">Mesa ${activeTableId.toString().padStart(2,'0')}</div>
                    <div style="font-size:0.85rem; color:var(--color-text-muted);">${table.guests} comensales</div>
                </div>
                <div style="margin-bottom:2rem;">
                    ${itemsHtml}
                    ${order ? `<div class="detalle-total"><span>Total</span><span>${total.toFixed(2)} €</span></div>` : ''}
                </div>
                <div style="display:flex; flex-direction:column; gap:1rem;">
                    <button class="btn btn-primary" id="btn-add-comanda">+ Nueva Comanda</button>
                    <button class="btn btn-success" id="btn-cobrar">Cobrar Mesa</button>
                    <button class="btn btn-secondary" id="btn-liberar" style="border-color:var(--color-border); color:var(--color-text-muted);">Liberar Mesa (Sin cobrar)</button>
                </div>
            `;
        }
        return actions;
    };

    const renderNuevaComanda = () => {
        const productsHtml = renderProductos();
        let cartTotal = draftOrder.items.reduce((s,i) => s + (i.price*i.qty), 0);
        let cartItems = draftOrder.items.reduce((s,i) => s + i.qty, 0);

        let fabHtml = '';
        if (cartItems > 0) {
            fabHtml = `
                <div class="mobile-fab-cart" id="btn-view-cart">
                    <span>Ver comanda (${cartItems})</span>
                    <span>${cartTotal.toFixed(2)} €</span>
                </div>
            `;
        }

        return `
            <div style="text-align:center; margin-bottom:1rem; font-size:0.85rem; color:var(--color-text-muted);">
                Mesa ${activeTableId.toString().padStart(2,'0')} - Nueva comanda
            </div>
            ${productsHtml}
            ${fabHtml}
        `;
    };

    const renderMas = () => {
        return `
            <div style="display:flex; flex-direction:column; gap:1rem;">
                <button class="btn btn-secondary" style="justify-content:flex-start; padding:1.2rem; background:var(--color-surface); border:1px solid var(--color-border);">
                    <i class='bx bx-transfer-alt' style="margin-right:0.5rem; font-size:1.2rem;"></i> Cambiar de Rol
                </button>
                <button class="btn btn-secondary" style="justify-content:flex-start; padding:1.2rem; background:var(--color-surface); border:1px solid var(--color-border);" onclick="location.reload()">
                    <i class='bx bx-refresh' style="margin-right:0.5rem; font-size:1.2rem;"></i> Recargar App
                </button>
                <button class="btn btn-secondary" style="justify-content:flex-start; padding:1.2rem; background:var(--color-surface); border:1px solid var(--color-border); color:var(--color-danger);">
                    <i class='bx bx-log-out' style="margin-right:0.5rem; font-size:1.2rem;"></i> Cerrar Sesión
                </button>
            </div>
        `;
    };

    const bindEvents = () => {
        // Tab switching
        document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentTab = e.currentTarget.getAttribute('data-tab');
                subView = null;
                render();
            });
        });

        // Table clicking
        document.querySelectorAll('.mobile-table-card').forEach(card => {
            card.addEventListener('click', (e) => {
                activeTableId = parseInt(e.currentTarget.getAttribute('data-table-id'));
                subView = 'table_detail';
                render();
            });
        });

        // Back button
        const btnBack = document.getElementById('btn-back');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                if (subView === 'nueva_comanda') {
                    if (draftOrder.items.length > 0) {
                        if(confirm('¿Descartar comanda en curso?')) {
                            draftOrder.items = [];
                            subView = 'table_detail';
                            render();
                        }
                    } else {
                        subView = 'table_detail';
                        render();
                    }
                } else {
                    subView = null;
                    render();
                }
            });
        }

        // Table details buttons
        const btnOpenTable = document.getElementById('btn-open-table');
        if (btnOpenTable) {
            btnOpenTable.addEventListener('click', () => {
                globalState.updateTable(activeTableId, { status: 'ocupada', openedAt: Date.now(), guests: 2 });
                subView = 'nueva_comanda';
                draftOrder.items = [];
                render();
            });
        }

        const btnAddComanda = document.getElementById('btn-add-comanda');
        if (btnAddComanda) {
            btnAddComanda.addEventListener('click', () => {
                subView = 'nueva_comanda';
                draftOrder.items = [];
                render();
            });
        }

        const btnCobrar = document.getElementById('btn-cobrar');
        if (btnCobrar) {
            btnCobrar.addEventListener('click', () => {
                alert('Cobro simulado con éxito.');
                globalState.closeTable(activeTableId);
                subView = null;
                render();
            });
        }
        
        const btnLiberar = document.getElementById('btn-liberar');
        if (btnLiberar) {
            btnLiberar.addEventListener('click', () => {
                globalState.closeTable(activeTableId);
                subView = null;
                render();
            });
        }

        // Categories
        document.querySelectorAll('[data-cat]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentMenuCategory = e.currentTarget.getAttribute('data-cat');
                render();
            });
        });

        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus(); // Keep focus if it was typing
            const len = searchInput.value.length;
            searchInput.setSelectionRange(len, len);

            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                // debounce render
                setTimeout(()=>render(), 300);
            });
        }

        // Add item
        document.querySelectorAll('.mobile-menu-item-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.currentTarget.getAttribute('data-item-id'));
                const item = globalState.menu.find(i => i.id === itemId);
                if(item) {
                    const existing = draftOrder.items.find(i => i.id === itemId);
                    if(existing) existing.qty++;
                    else draftOrder.items.push({...item, qty: 1});
                    render();
                }
            });
        });

        // View Cart
        const btnViewCart = document.getElementById('btn-view-cart');
        if (btnViewCart) {
            btnViewCart.addEventListener('click', () => {
                // Instantly send order for this demo
                globalState.addOrder({
                    tableId: activeTableId,
                    waiterId: app.currentUser ? app.currentUser.id : null,
                    waiterName: app.currentUser ? app.currentUser.name : 'Camarero',
                    items: draftOrder.items.map(i => ({...i, dest: getCategoryDestination(i.category)})),
                    timestamp: Date.now(),
                    status: 'en_cocina'
                });
                draftOrder.items = [];
                subView = 'table_detail';
                render();
            });
        }
    };

    globalState.subscribe(() => {
        if (document.querySelector('.mobile-layout')) render();
    });

    render();
}
