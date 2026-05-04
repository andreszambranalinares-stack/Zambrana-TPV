import { globalState } from './state.js';

export function initTour(app) {
    // ── Demo seed on ?demo=1 ──────────────────────────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === '1') {
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('zambrana_demo', '1');
        localStorage.setItem('ztpv_config', JSON.stringify({ numTables: 5 }));
        localStorage.setItem('ztpv_menu', JSON.stringify([
            { id: 'b1', name: 'Cerveza',     price: 2.50, category: 'Bebidas',   status: 'Activo' },
            { id: 'b2', name: 'Refresco',    price: 2.00, category: 'Bebidas',   status: 'Activo' },
            { id: 'p1', name: 'Hamburguesa', price: 10.00, category: 'Carnes',   status: 'Activo' },
            { id: 'p2', name: 'Ensalada',    price: 8.50,  category: 'Entrantes',status: 'Activo' }
        ]));
        localStorage.setItem('ztpv_employees', JSON.stringify([
            { id: 'admin',     alias: 'Admin',  role: 'Administrador', pin: '1234', active: true, color: '#991b1b' },
            { id: 'emp_demo1', alias: 'Carlos', role: 'Camarero',      pin: '1111', active: true, color: '#2563eb' }
        ]));
        window.history.replaceState({}, document.title, 'index.html');
        location.reload();
        return;
    }

    if (sessionStorage.getItem('zambrana_demo') !== '1') return;
    if (sessionStorage.getItem('zambrana_demo_closed') === '1') return;

    // ── Bootstrap demo state ──────────────────────────────────────────────────
    if (!globalState.demoInitialized) {
        globalState.config.numTables = 5;
        globalState.tables = Array.from({length: 5}, (_, i) => ({
            id: i + 1, status: 'libre', guests: 0, openedAt: null
        }));
        globalState.menu = [
            { id: 'b1', name: 'Cerveza',     price: 2.50, category: 'Bebidas',   status: 'Activo' },
            { id: 'b2', name: 'Refresco',    price: 2.00, category: 'Bebidas',   status: 'Activo' },
            { id: 'p1', name: 'Hamburguesa', price: 10.00, category: 'Carnes',   status: 'Activo' },
            { id: 'p2', name: 'Ensalada',    price: 8.50,  category: 'Entrantes',status: 'Activo' }
        ];
        globalState.employees = [
            { id: 'admin',     alias: 'Admin',  role: 'Administrador', pin: '1234', active: true, color: '#991b1b' },
            { id: 'emp_demo1', alias: 'Carlos', role: 'Camarero',      pin: '1111', active: true, color: '#2563eb' }
        ];
        localStorage.setItem('ztpv_config',    JSON.stringify(globalState.config));
        localStorage.setItem('ztpv_menu',      JSON.stringify(globalState.menu));
        localStorage.setItem('ztpv_employees', JSON.stringify(globalState.employees));
        localStorage.setItem('ztpv_tables',    JSON.stringify(globalState.tables));
        globalState.demoInitialized = true;
    }

    // Log in as admin for demo
    if (!sessionStorage.getItem('admin_session')) {
        sessionStorage.setItem('admin_session', 'true');
        app.currentUser = globalState.employees.find(e => e.id === 'admin') || globalState.employees[0];
        globalState.notifyListeners('auth');
    }

    // ── Styles ────────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        #zt-hole {
            position: fixed;
            pointer-events: none;
            z-index: 9990;
            border-radius: 10px;
            box-shadow: 0 0 0 4px #D61F2C,
                        0 0 0 10px rgba(214,31,44,.22),
                        0 0 0 9999px rgba(0,0,0,.78);
            transition: top .25s, left .25s, width .25s, height .25s, opacity .25s;
        }
        #zt-card {
            position: fixed;
            z-index: 9995;
            background: #141414;
            color: #f0f0f0;
            border: 2px solid #D61F2C;
            border-radius: 14px;
            padding: 1.25rem 1.5rem 1rem;
            width: min(310px, 92vw);
            box-shadow: 0 12px 40px rgba(0,0,0,.75);
            font-family: var(--font-family, system-ui, sans-serif);
            font-size: .93rem;
            line-height: 1.55;
            pointer-events: all;
            animation: zt-in .25s ease both;
        }
        #zt-card strong { color: #D61F2C; }
        #zt-card em     { color: #aaa; font-style: normal; }
        #zt-step {
            font-size: .72rem;
            color: #D61F2C;
            font-weight: 700;
            letter-spacing: .06em;
            margin-bottom: .5rem;
        }
        #zt-text { margin-bottom: 1rem; }
        #zt-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: .5rem;
        }
        #zt-skip {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            font-size: .8rem;
            padding: .25rem;
        }
        #zt-skip:hover { color: #999; }
        #zt-next {
            background: #D61F2C;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: .5rem 1.1rem;
            font-size: .9rem;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s;
        }
        #zt-next:hover { background: #b51824; }
        #zt-dots {
            display: flex;
            gap: 4px;
            flex: 1;
            justify-content: center;
        }
        .zt-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #333;
            transition: background .2s;
        }
        .zt-dot.active { background: #D61F2C; }
        /* End screen */
        #zt-end-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,.88);
            z-index: 9990;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #zt-end-card {
            background: #141414;
            border: 2px solid #D61F2C;
            border-radius: 18px;
            padding: 2.5rem 2rem;
            width: min(380px, 94vw);
            text-align: center;
            color: #f0f0f0;
            font-family: var(--font-family, system-ui, sans-serif);
            box-shadow: 0 12px 50px rgba(0,0,0,.8);
            animation: zt-in .3s ease both;
        }
        #zt-end-card strong { color: #D61F2C; }
        #zt-end-card ul {
            text-align: left;
            margin: .75rem auto;
            max-width: 260px;
            padding-left: 1.2rem;
            line-height: 2;
            color: #ccc;
        }
        .zt-btn-primary {
            display: block;
            width: 100%;
            padding: .7rem;
            margin-top: .5rem;
            background: #D61F2C;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
        }
        .zt-btn-secondary {
            display: block;
            width: 100%;
            padding: .6rem;
            margin-top: .5rem;
            background: transparent;
            color: #999;
            border: 1px solid #333;
            border-radius: 10px;
            font-size: .9rem;
            cursor: pointer;
        }
        @keyframes zt-in {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // ── Steps ─────────────────────────────────────────────────────────────────
    // Helper to click a nav section in the Desktop view after it renders
    function goToSection(section, extraDelay = 0) {
        return new Promise(resolve => {
            // First make sure we're in admin/desktop view
            if (!document.querySelector('.desktop-nav')) {
                app.currentUser = globalState.employees.find(e => e.id === 'admin') || globalState.employees[0];
                app.navigate('admin');
            }
            setTimeout(() => {
                const btn = document.querySelector(`[data-section="${section}"]`);
                if (btn) btn.click();
                setTimeout(resolve, 400);
            }, extraDelay || 400);
        });
    }

    const steps = [
        // 0 — Welcome
        {
            text: '👋 <strong>¡Bienvenido a Zambrana TPV!</strong><br><br>Te guiaremos por <em>todas</em> las funciones: empleados, turnos, mesas, cocina y cobros.<br><br>Pulsa <strong>Siguiente</strong> para empezar.',
            selector: null,
            action: () => app.navigate('home'),
            waitMs: 400
        },
        // 1 — Go to Admin → Ajustes
        {
            text: '🔐 <strong>Panel de Administración</strong><br><br>Aquí el administrador gestiona empleados, configura el local y controla los turnos. Accede desde la pestaña <strong>Ajustes</strong>.',
            selector: '[data-section="ajustes"]',
            action: () => {
                app.currentUser = globalState.employees.find(e => e.id === 'admin') || globalState.employees[0];
                app.navigate('admin');
                // After desktop renders, auto-click Ajustes tab
                setTimeout(() => {
                    const btn = document.querySelector('[data-section="ajustes"]');
                    if (btn) btn.click();
                }, 500);
            },
            waitMs: 1100
        },
        // 2 — Show employees section (Ajustes already active from step 1)
        {
            text: '👥 <strong>Gestión de Empleados</strong><br><br>Cada empleado tiene un PIN de 4 dígitos y un rol (Camarero, Cocinero, Barra). El sistema controla quién puede hacer qué.',
            selector: '#sec-empleados',
            action: null,
            waitMs: 0
        },
        // 3 — Add employee button
        {
            text: '➕ <strong>Crear Nuevo Empleado</strong><br><br>Pulsa el botón para abrir el formulario de alta. Asigna nombre, PIN, rol y color identificativo.',
            selector: '#btn-add-emp',
            action: null,
            waitMs: 0,
            nextLabel: 'Abrir formulario →',
            onNext: () => {
                const btn = document.getElementById('btn-add-emp');
                if (btn) btn.click();
            }
        },
        // 4 — Save employee (modal open)
        {
            text: '💾 <strong>Guardar Empleado</strong><br><br>Rellena alias, PIN de 4 dígitos y rol. Pulsa <strong>Guardar Empleado</strong>.<br><br><em>Continuaremos rellenando un ejemplo.</em>',
            selector: '#btn-save-emp',
            action: null,
            waitMs: 0,
            nextLabel: 'Guardar ejemplo →',
            onNext: () => {
                const alias = document.getElementById('emp-alias');
                const pin   = document.getElementById('emp-pin');
                if (alias && !alias.value) alias.value = 'Maria';
                if (pin   && !pin.value)   pin.value   = '2222';
                const save = document.getElementById('btn-save-emp');
                if (save) save.click();
            }
        },
        // 5 — Open shift button
        {
            text: '🕐 <strong>Abrir Turno</strong><br><br>Antes de empezar el servicio, el administrador abre el turno. Registra hora de inicio y empleados activos.',
            selector: '#btn-open-shift',
            action: null,
            waitMs: 0,
            nextLabel: 'Abrir turno →',
            onNext: () => {
                const btn = document.getElementById('btn-open-shift');
                if (btn) btn.click();
            }
        },
        // 6 — Confirm shift
        {
            text: '✅ <strong>Confirmar Apertura</strong><br><br>Selecciona quién trabaja hoy. El sistema lo registrará automáticamente.',
            selector: '#btn-confirm-open',
            action: null,
            waitMs: 0,
            nextLabel: 'Confirmar →',
            onNext: () => {
                const btn = document.getElementById('btn-confirm-open');
                if (btn) btn.click();
            }
        },
        // 7 — Alerts section
        {
            text: '⏱️ <strong>Alertas de Tiempo</strong><br><br>Configura cuántos minutos antes de avisar cuando una comanda lleva demasiado en cocina. Amarillo = aviso, rojo = urgente.',
            selector: '#sec-alertas',
            action: null,
            waitMs: 0
        },
        // 8 — Table editor (inside Ajustes panel)
        {
            text: '🗺️ <strong>Editor de Plano</strong><br><br>Arrastra las mesas para replicar tu local: terraza, salón, barra, privado…',
            selector: '#btn-table-editor',
            action: null,
            waitMs: 0,
            nextLabel: 'Abrir editor →',
            onNext: () => {
                const btn = document.getElementById('btn-table-editor');
                if (btn) btn.click();
            }
        },
        // 9 — Inside editor (fixed overlay with btn-close-editor-wrap or btn-editor-cancel)
        {
            text: '↩️ <strong>Editor activo</strong><br><br>Arrastra cada mesa con el ratón o el dedo. Los cambios se guardan con "Guardar Plano".',
            selector: '#editor-area, #btn-editor-cancel, #btn-close-editor-wrap',
            action: null,
            waitMs: 0,
            nextLabel: 'Volver al panel →',
            onNext: () => {
                const btn = document.getElementById('btn-editor-cancel') || document.getElementById('btn-close-editor-wrap');
                if (btn) btn.click();
            }
        },
        // 10 — Tickets archive
        {
            text: '🧾 <strong>Archivo de Tickets</strong><br><br>Todos los cobros y comandas del turno quedan registrados. Puedes reimprimir cualquier ticket.',
            selector: '#btn-tickets-archive',
            action: null,
            waitMs: 0
        },
        // 11 — Switch to Mesas section (camarero view via desktop Mesas tab)
        {
            text: '🏃 <strong>Vista de Sala</strong><br><br>El camarero ve el plano de mesas en tiempo real. Las mesas libres están en verde, las ocupadas en rojo.',
            selector: '.mobile-table-card, [data-table-id]',
            action: () => {
                // Navigate to Mesas section in desktop
                const mesaBtn = document.querySelector('[data-section="mesas"]');
                if (mesaBtn) mesaBtn.click();
            },
            waitMs: 400
        },
        // 12 — Click table 1
        {
            text: '🟢 <strong>Abrir Mesa</strong><br><br>Las mesas verdes están libres. Haz clic en la Mesa 01 para sentarlos.',
            selector: '[data-table-id="1"]',
            action: null,
            waitMs: 0,
            nextLabel: 'Abrir Mesa 01 →',
            onNext: () => {
                const mesa = document.querySelector('[data-table-id="1"]');
                if (mesa) mesa.click();
            }
        },
        // 13 — Confirm open table
        {
            text: '👥 <strong>Confirmar comensales</strong><br><br>Indica cuántas personas se sientan y pulsa <strong>Abrir Mesa</strong>.',
            selector: '#btn-open-table, #btn-quick-open',
            action: null,
            waitMs: 0,
            nextLabel: 'Confirmar →',
            onNext: () => {
                const btn = document.querySelector('#btn-quick-open') || document.querySelector('#btn-open-table');
                if (btn) btn.click();
            }
        },
        // 14 — Add products (desktop order panel)
        {
            text: '🍺 <strong>Carta Digital</strong><br><br>Los productos están organizados por categorías. Selecciona uno para añadirlo a la comanda.',
            selector: '.item-card, .mobile-menu-item-add, [data-item-id]',
            action: null,
            waitMs: 0,
            nextLabel: 'Añadir producto →',
            onNext: () => {
                const item = document.querySelector('.item-card') || document.querySelector('[data-item-id]') || document.querySelector('.mobile-menu-item-add');
                if (item) { item.click(); setTimeout(() => { if (item.isConnected) item.click(); }, 300); }
            }
        },
        // 15 — Send to kitchen
        {
            text: '📨 <strong>Enviar a Cocina</strong><br><br>Con los productos seleccionados, pulsa <strong>Enviar a Cocina</strong>. La comanda llega al instante.',
            selector: '#btn-send-kitchen, #btn-send-order',
            action: null,
            waitMs: 0,
            nextLabel: 'Enviar comanda →',
            onNext: () => {
                const btn = document.querySelector('#btn-send-kitchen') || document.querySelector('#btn-send-order');
                if (btn) btn.click();
            }
        },
        // 16 — Kitchen view (navigate to cocinero via home then role select)
        {
            text: '👨‍🍳 <strong>Vista Cocina</strong><br><br>El cocinero ve las comandas como tarjetas con temporizador. El color cambia a amarillo/rojo si tarda mucho.',
            selector: '#app-container',
            action: () => {
                app.currentUser = globalState.employees.find(e => e.role === 'Camarero') || globalState.employees[0];
                app.navigate('cocinero');
            },
            waitMs: 600
        },
        // 17 — Mark all ready
        {
            text: '✅ <strong>TODO LISTO</strong><br><br>Cuando los platos están en el pase, pulsa el botón. El camarero recibe la notificación automáticamente.',
            selector: '[id^="btn-ready-all-"]',
            action: null,
            waitMs: 0,
            nextLabel: 'Marcar listo →',
            onNext: () => {
                const btn = document.querySelector('[id^="btn-ready-all-"]');
                if (btn) btn.click();
            }
        },
        // 18 — Back to camarero → charge
        {
            text: '💳 <strong>Cobrar Mesa</strong><br><br>Volvemos al panel. La mesa sigue abierta — ahora toca cobrar al cliente.',
            selector: '[data-table-id="1"]',
            action: () => {
                app.currentUser = globalState.employees.find(e => e.role === 'Camarero') || globalState.employees[0];
                app.navigate('admin');
            },
            waitMs: 600,
            nextLabel: 'Ir a la mesa →',
            onNext: () => {
                const mesa = document.querySelector('[data-table-id="1"]');
                if (mesa) mesa.click();
            }
        },
        // 19 — Checkout
        {
            text: '💰 <strong>Generar Ticket</strong><br><br>Selecciona el método de pago (efectivo, tarjeta o pago dividido) y el ticket queda registrado automáticamente.',
            selector: '#btn-checkout, #btn-cobrar-mesa',
            action: null,
            waitMs: 0,
            nextLabel: 'Cobrar mesa →',
            onNext: () => {
                const btn = document.querySelector('#btn-checkout') || document.querySelector('#btn-cobrar-mesa');
                if (btn) btn.click();
            }
        },
        // 20 — End
        {
            text: 'end',
            selector: null,
            action: null,
            waitMs: 0
        }
    ];

    // ── State ─────────────────────────────────────────────────────────────────
    let step = 0;
    let holeEl    = null;
    let cardEl    = null;
    let rafId     = null;

    // ── Helpers ───────────────────────────────────────────────────────────────
    function $(sel) {
        if (!sel) return null;
        try {
            // Pick first visible match
            const all = document.querySelectorAll(sel);
            for (const el of all) {
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0) return el;
            }
        } catch(_) {}
        return null;
    }

    function removeUI() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        if (holeEl) { holeEl.remove(); holeEl = null; }
        if (cardEl) { cardEl.remove(); cardEl = null; }
    }

    function posLoop() {
        if (!holeEl || !cardEl) return;
        const s = steps[step];
        const target = $(s.selector);
        if (target) {
            const r = target.getBoundingClientRect();
            const P = 10;
            holeEl.style.cssText = `
                top:${r.top-P}px; left:${r.left-P}px;
                width:${r.width+P*2}px; height:${r.height+P*2}px;
                opacity:1;
            `;
            // Reposition card
            const cw = 316;
            let ct = r.bottom + 18;
            let cl = r.left;
            if (ct + 200 > window.innerHeight) ct = Math.max(8, r.top - 210);
            cl = Math.max(8, Math.min(cl, window.innerWidth - cw - 8));
            cardEl.style.top  = ct + 'px';
            cardEl.style.left = cl + 'px';
        } else {
            holeEl.style.opacity = '0';
            // center card
            cardEl.style.top  = '50%';
            cardEl.style.left = '50%';
            cardEl.style.transform = 'translate(-50%,-50%)';
        }
        rafId = requestAnimationFrame(posLoop);
    }

    // ── Render a step ─────────────────────────────────────────────────────────
    function showStep() {
        removeUI();
        if (step >= steps.length) return;

        const s = steps[step];
        if (s.text === 'end') { showEnd(); return; }

        // Run navigation action
        if (s.action) s.action();

        // Wait for DOM to settle (use step's waitMs, default 350)
        const delay = s.waitMs != null ? (s.waitMs === 0 ? 80 : s.waitMs) : 350;

        setTimeout(() => {
            removeUI();

            // Hole
            holeEl = document.createElement('div');
            holeEl.id = 'zt-hole';
            document.body.appendChild(holeEl);

            // Card
            cardEl = document.createElement('div');
            cardEl.id = 'zt-card';

            const total = steps.filter(s => s.text !== 'end').length;
            const current = step + 1;
            const label = s.nextLabel || 'Siguiente →';

            // Dots
            const dots = steps
                .filter(x => x.text !== 'end')
                .map((_, i) => `<span class="zt-dot ${i === step ? 'active' : ''}"></span>`)
                .join('');

            cardEl.innerHTML = `
                <div id="zt-step">PASO ${current} DE ${total}</div>
                <div id="zt-text">${s.text}</div>
                <div id="zt-footer">
                    <button id="zt-skip">Saltar demo</button>
                    <div id="zt-dots">${dots}</div>
                    <button id="zt-next">${label}</button>
                </div>
            `;
            document.body.appendChild(cardEl);

            // Position card initially
            const target = $(s.selector);
            if (target) {
                const r = target.getBoundingClientRect();
                const cw = 316;
                let ct = r.bottom + 18;
                let cl = r.left;
                if (ct + 200 > window.innerHeight) ct = Math.max(8, r.top - 210);
                cl = Math.max(8, Math.min(cl, window.innerWidth - cw - 8));
                cardEl.style.top  = ct + 'px';
                cardEl.style.left = cl + 'px';
                target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                cardEl.style.top  = '50%';
                cardEl.style.left = '50%';
                cardEl.style.transform = 'translate(-50%,-50%)';
            }

            // Events
            cardEl.querySelector('#zt-skip').addEventListener('click', () => {
                removeUI();
                sessionStorage.setItem('zambrana_demo_closed', '1');
            });

            cardEl.querySelector('#zt-next').addEventListener('click', () => {
                if (s.onNext) s.onNext();
                step++;
                // Allow more time when onNext triggers a UI action
                setTimeout(showStep, s.onNext ? 700 : 80);
            });

            // Start positioning loop
            rafId = requestAnimationFrame(posLoop);

        }, delay); // wait for app.navigate() / section click to render
    }

    // ── End screen ────────────────────────────────────────────────────────────
    function showEnd() {
        removeUI();
        const overlay = document.createElement('div');
        overlay.id = 'zt-end-overlay';
        overlay.innerHTML = `
            <div id="zt-end-card">
                <div style="font-size:2.5rem;margin-bottom:.5rem">🎉</div>
                <h2 style="color:#D61F2C;margin:0 0 .75rem">¡Tour completado!</h2>
                <p style="color:#ccc;margin-bottom:1rem">Has visto toda la potencia de <strong>Zambrana TPV</strong>:</p>
                <ul>
                    <li>Gestión de empleados y PINs</li>
                    <li>Control de turno y caja</li>
                    <li>Comandas en tiempo real</li>
                    <li>Panel de cocina con alertas</li>
                    <li>Tickets y cobros digitales</li>
                </ul>
                <button class="zt-btn-primary" id="zt-contact">Contactar con Nosotros</button>
                <button class="zt-btn-secondary" id="zt-close">Cerrar demo</button>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#zt-contact').addEventListener('click', () => {
            alert('¡Gracias por probar Zambrana TPV!\n\nContacta con nosotros para instalarlo en tu local.');
        });
        overlay.querySelector('#zt-close').addEventListener('click', () => {
            overlay.remove();
            sessionStorage.setItem('zambrana_demo_closed', '1');
        });
    }

    // ── Demo order limit ──────────────────────────────────────────────────────
    const _orig = globalState.createOrders?.bind(globalState);
    if (_orig) {
        globalState.createOrders = (kItems, bItems, orderData) => {
            if (globalState.orders.length >= 5) {
                alert('⚠️ LÍMITE DE LA DEMO\n\nMáximo de comandas de prueba alcanzado.\nContacta con nosotros para el sistema completo.');
                return;
            }
            _orig(kItems, bItems, orderData);
        };
    }

    // ── Start ─────────────────────────────────────────────────────────────────
    setTimeout(showStep, 700);
}
