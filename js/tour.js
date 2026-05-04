import { globalState } from './state.js';
import { deviceManager } from './device.js';

export function initTour(app) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === '1') {
        // "que cada vez que se abra no tenga memoria y hayan 5 mesas"
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('zambrana_demo', '1');
        
        localStorage.setItem('ztpv_config', JSON.stringify({ numTables: 5 }));
        
        // Simpler menu for visual clarity
        const simplifiedMenu = [
            { id: "b1", name: "Cerveza", price: 2.50, category: "Bebidas", status: "Activo" },
            { id: "b2", name: "Refresco", price: 2.00, category: "Bebidas", status: "Activo" },
            { id: "p1", name: "Hamburguesa", price: 10.00, category: "Carnes", status: "Activo" },
            { id: "p2", name: "Ensalada", price: 8.50, category: "Entrantes", status: "Activo" }
        ];
        localStorage.setItem('ztpv_menu', JSON.stringify(simplifiedMenu));

        // Test employee
        const demoEmployees = [
            { id: 'admin', alias: 'Admin', role: 'Administrador', pin: '1234', active: true, color: '#991b1b', favCategory: '⭐' },
            { id: 'emp_demo1', alias: 'Carlos', role: 'Camarero', pin: '1111', active: true, color: '#2563eb', favCategory: 'Bebidas' }
        ];
        localStorage.setItem('ztpv_employees', JSON.stringify(demoEmployees));
        
        // Clean URL and reload to ensure pristine state
        window.history.replaceState({}, document.title, "index.html");
        location.reload();
        return;
    }

    const isDemo = sessionStorage.getItem('zambrana_demo') === '1';
    if (!isDemo) return;

    // Force data in memory unconditionally for Demo to guarantee pristine state
    if (!globalState.demoInitialized) {
        globalState.config.numTables = 5;
        globalState.tables = Array.from({length: 5}, (_, i) => ({ id: i + 1, status: 'libre', guests: 0, openedAt: null }));
        globalState.menu = [
            { id: "b1", name: "Cerveza", price: 2.50, category: "Bebidas", status: "Activo" },
            { id: "b2", name: "Refresco", price: 2.00, category: "Bebidas", status: "Activo" },
            { id: "p1", name: "Hamburguesa", price: 10.00, category: "Carnes", status: "Activo" },
            { id: "p2", name: "Ensalada", price: 8.50, category: "Entrantes", status: "Activo" }
        ];
        globalState.employees = [
            { id: 'admin', alias: 'Admin', role: 'Administrador', pin: '1234', active: true, color: '#991b1b', favCategory: '⭐' },
            { id: 'emp_demo1', alias: 'Carlos', role: 'Camarero', pin: '1111', active: true, color: '#2563eb', favCategory: 'Bebidas' }
        ];
        localStorage.setItem('ztpv_config', JSON.stringify(globalState.config));
        localStorage.setItem('ztpv_menu', JSON.stringify(globalState.menu));
        localStorage.setItem('ztpv_employees', JSON.stringify(globalState.employees));
        localStorage.setItem('ztpv_tables', JSON.stringify(globalState.tables));
        
        globalState.demoInitialized = true;
    }


    if (!sessionStorage.getItem('admin_session')) {
        sessionStorage.setItem('admin_session', 'true');
        app.currentUser = globalState.employees.find(e => e.id === 'admin') || globalState.employees[0];
        globalState.notifyListeners('auth');
    }

    // Add styles for the forced tour
    const style = document.createElement('style');
    style.innerHTML = `
        .tour-focus-overlay {
            position: fixed;
            box-shadow: 0 0 0 9999px rgba(0,0,0,0.85);
            z-index: 9998;
            border-radius: 8px;
            pointer-events: none;
            transition: all 0.3s ease;
        }
        .tour-blocker {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 9997;
            background: transparent;
        }
        .tour-tooltip {
            position: fixed;
            background: var(--color-surface);
            color: var(--color-text);
            padding: 1.5rem;
            border-radius: 12px;
            border: 2px solid var(--color-primary);
            z-index: 9999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            width: 300px;
            font-family: var(--font-family);
            animation: fadeIn 0.3s ease;
        }
        .tour-tooltip strong {
            color: var(--color-primary);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    let currentStep = 0;
    
    const steps = [
        {
            selector: '#btn-menu',
            text: '👋 ¡Bienvenido a Zambrana TPV!<br><br>Vamos a hacer un recorrido rápido para ver cómo funciona.<br><br>Primero, abre el <strong>Menú lateral</strong>.'
        },
        {
            selector: '#btn-admin-dashboard',
            text: 'Este es el menú principal. Entra en <strong>Panel de Control</strong> para gestionar tu local.',
            delay: 500
        },
        {
            selector: '#btn-open-shift',
            text: 'Desde aquí ves en tiempo real todo lo que ocurre.<br><br>Comienza el día pulsando <strong>Abrir Turno</strong>.',
            delay: 500
        },
        {
            selector: '#btn-confirm-open',
            text: 'Puedes seleccionar quién trabaja hoy y hacer seguimiento de caja. Pulsa <strong>Confirmar Apertura</strong>.',
            delay: 500
        },
        {
            selector: '#btn-table-editor',
            text: '¡Turno abierto! Ahora vamos a configurar el salón. Pulsa en <strong>Editor de Plano</strong>.',
            delay: 1000
        },
        {
            selector: '#btn-editor-cancel',
            text: 'Aquí puedes mover las mesas arrastrándolas para replicar la distribución de tu restaurante.<br><br>Cuando estés listo, pulsa <strong>Volver</strong>.',
            delay: 1000
        },
        {
            selector: '#btn-close-admin-drawer',
            text: 'El panel de administración se superpone para no interrumpir tu trabajo en sala.<br><br>Ciérralo desde la <strong>❌</strong>.',
            delay: 500
        },
        {
            selector: '#role-camarero',
            text: '¡Estás listo para atender a los clientes! Entra como <strong>Camarero</strong>.',
            delay: 500
        },
        {
            selector: '.table-card', // Mesa 1
            text: 'Haz clic en la <strong>Mesa 1</strong> para tomar una comanda.',
            delay: 500
        },
        {
            selector: '.menu-item', // Primer producto
            text: 'Añade el primer producto de la carta.',
            delay: 500
        },
        {
            selector: '#btn-send-order',
            text: 'Todo listo. Pulsa <strong>Enviar a Cocina</strong>.',
            delay: 500
        },
        {
            selector: '#btn-menu',
            text: '¡Enviada al instante! Vamos a la cocina a ver cómo entra. Abre el <strong>Menú</strong>.',
            delay: 500
        },
        {
            selector: '#btn-change-role',
            text: 'Haz clic en <strong>Cambiar rol</strong>.',
            delay: 500
        },
        {
            selector: '#role-cocinero',
            text: 'Entra como <strong>Cocinero</strong>.',
            delay: 500
        },
        {
            selector: '.order-card button.btn-primary', // Terminar/Servir botón
            text: '¡Aquí tienes la comanda en pantalla! Púlsalo para marcarla como <strong>Servida</strong>.',
            delay: 1000
        },
        {
            selector: 'body',
            action: 'end',
            text: '🎉 <strong>¡Ciclo completado con éxito!</strong><br><br>Has visto lo fácil y rápido que fluye la información.<br><br>Esta demo es breve y tiene operaciones limitadas. ¿Listo para modernizar tu negocio?'
        }
    ];

    let overlay, blocker, tooltip;

    function cleanup() {
        if (overlay) overlay.remove();
        if (blocker) blocker.remove();
        if (tooltip) tooltip.remove();
    }

    function runStep() {
        cleanup();
        if (currentStep >= steps.length) return;
        
        const step = steps[currentStep];
        
        setTimeout(() => {
            const el = document.querySelector(step.selector);
            
            // If element not found, retry up to 10 times then skip? No, just keep retrying.
            if (!el && step.action !== 'end') {
                setTimeout(runStep, 300);
                return;
            }

            if (step.action === 'end') {
                showEndTooltip(step.text);
                return;
            }

            // Scroll into view if needed
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            
            setTimeout(() => {
                const rect = el.getBoundingClientRect();
                
                // Overlay Hole (Visual only)
                overlay = document.createElement('div');
                overlay.className = 'tour-focus-overlay';
                overlay.style.top = (rect.top - 8) + 'px';
                overlay.style.left = (rect.left - 8) + 'px';
                overlay.style.width = (rect.width + 16) + 'px';
                overlay.style.height = (rect.height + 16) + 'px';
                document.body.appendChild(overlay);

                // Tooltip
                tooltip = document.createElement('div');
                tooltip.className = 'tour-tooltip';
                tooltip.innerHTML = step.text;
                
                let top = rect.bottom + 20;
                let left = rect.left;
                if (top + 150 > window.innerHeight) top = rect.top - 150;
                tooltip.style.top = Math.max(10, top) + 'px';
                tooltip.style.left = Math.max(10, Math.min(left, window.innerWidth - 320)) + 'px';
                document.body.appendChild(tooltip);

                // Force click interceptor
                const captureClick = (e) => {
                    // Allow clicks inside tooltip
                    if (tooltip.contains(e.target)) return;
                    
                    // If click is outside the target element, block it!
                    if (!el.contains(e.target) && e.target !== el) {
                        e.stopPropagation();
                        e.preventDefault();
                        
                        // Small shake effect to hint the user
                        tooltip.style.transform = 'translateX(5px)';
                        setTimeout(() => tooltip.style.transform = 'translateX(-5px)', 100);
                        setTimeout(() => tooltip.style.transform = 'translateX(0)', 200);
                    }
                };
                document.addEventListener('click', captureClick, true);

                const nextStep = () => {
                    document.removeEventListener('click', captureClick, true);
                    el.removeEventListener('click', nextStep);
                    currentStep++;
                    runStep();
                };

                el.addEventListener('click', nextStep);

            }, 300); // wait for scroll

        }, step.delay || 100);
    }

    function showEndTooltip(text) {
        blocker = document.createElement('div');
        blocker.className = 'tour-blocker';
        blocker.style.background = 'rgba(0,0,0,0.85)';
        document.body.appendChild(blocker);

        tooltip = document.createElement('div');
        tooltip.className = 'tour-tooltip';
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
        tooltip.style.textAlign = 'center';
        tooltip.innerHTML = `
            ${text}
            <br><br>
            <button class="btn btn-primary" onclick="alert('En la versión real, esto abriría un contacto directo con Ventas.\\n\\n¡Gracias por probar Zambrana TPV!')" style="width:100%; margin-top:1rem;">Contactar con Nosotros</button>
            <button class="btn btn-secondary" id="btn-tour-close" style="width:100%; margin-top:0.5rem; background:transparent; border-color:var(--color-border); color:var(--color-text);">Terminar Demo</button>
        `;
        document.body.appendChild(tooltip);

        document.getElementById('btn-tour-close').onclick = () => {
            cleanup();
            sessionStorage.setItem('zambrana_demo_closed', '1');
        };
    }

    if (sessionStorage.getItem('zambrana_demo_closed') !== '1') {
        runStep();
    }

    // Strict limits for Demo
    const originalCreateOrders = globalState.createOrders.bind(globalState);
    globalState.createOrders = (kItems, bItems, orderData) => {
        const totalOrders = globalState.orders.length;
        if (totalOrders >= 5) {
            alert("⚠️ LÍMITE DE LA DEMO ALCANZADO ⚠️\\n\\nHas creado el máximo de comandas de prueba. Contacta con ventas para conocer el precio e instalar el sistema completo.");
            return;
        }
        originalCreateOrders(kItems, bItems, orderData);
    };
}
