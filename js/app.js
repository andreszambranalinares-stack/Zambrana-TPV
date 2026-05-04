import { globalState } from './state.js';
import { storage } from './storage.js';
import { renderHome } from './ui/home.js';
import { renderCamarero as renderDesktopCamarero } from './ui/camarero.js';
import { renderMobileCamarero } from './ui/mobile_camarero.js';
import { renderDesktop } from './ui/desktop.js';
import { renderCocinero } from './ui/cocinero.js';
import { renderBarra } from './ui/barra.js';
import { renderAdmin } from './ui/admin.js';
import { renderManageMenu } from './carta.js';
import { initSidebar } from './ui/sidebar.js';
import { auth } from './auth.js';
import { deviceManager } from './device.js';
import { initTour } from './tour.js';

class App {
    constructor() {
        this.container = document.getElementById('app-container');
        this.header = document.getElementById('main-header');
        this.title = document.getElementById('header-title');
        this.btnBack = document.getElementById('btn-back-home');
        this.currentView = 'home';
        this.currentUser = null;
        
        this.audioCtx = null;
        this.setupAudio();
    }

    setupAudio() {
        // Prepare beep for new orders
        storage.subscribe((msg) => {
            if (msg.type === 'NEW_ORDER' && globalState.config.soundEnabled) {
                if (this.currentView === 'cocinero' || this.currentView === 'barra') {
                    this.playBeep();
                }
            }
        });
    }

    playBeep() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.5);
    }

    init() {
        // Init theme
        this.applyTheme(globalState.config.theme);
        globalState.subscribe(() => {
            this.applyTheme(globalState.config.theme);
        });
        
        deviceManager.init();
        initTour(this);

        // Event listeners
        this.btnBack.addEventListener('click', () => this.navigate('home'));

        initSidebar(this);

        // Service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => console.error('SW Error', err));
        }

        // Session restore toast
        if (globalState.orders.length > 0 || globalState.tables.some(t => t.status !== 'libre')) {
            this.showToast('✅ Sesión restaurada');
        }

        // Shift timer update
        setInterval(() => {
            const timeEl = document.getElementById('shift-time');
            if (timeEl && globalState.shift.startTime && globalState.shift.isOpen) {
                const diff = Math.floor((Date.now() - globalState.shift.startTime) / 1000);
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
                const s = (diff % 60).toString().padStart(2, '0');
                timeEl.textContent = `${h.toString().padStart(2, '0')}:${m}:${s}`;
            } else if (timeEl) {
                timeEl.textContent = '';
            }
        }, 1000);

        // Render initial view
        this.navigate('home');
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('theme-dark');
            document.body.classList.remove('theme-light');
        } else {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
        }
    }

    navigate(view) {
        this.currentView = view;
        this.container.innerHTML = '';
        
        if (view === 'camarero' || view === 'admin') {
            this.header.classList.add('hidden');
        } else {
            this.header.classList.remove('hidden');
        }
        this.btnBack.style.visibility = view === 'home' ? 'hidden' : 'visible';
        
        if (view === 'home') {
            this.title.innerHTML = `<img src="logo.png" alt="Zambrana TPV" style="height: 28px; vertical-align: middle;">`;
            this.currentUser = null;
            renderHome(this.container, this);
        } else {
            let userStr = this.currentUser ? ` — ${this.currentUser.alias}` : '';
            
            if (view === 'camarero') {
                this.title.innerHTML = `<i class='bx bx-restaurant'></i> Sala${userStr} <span class="header-service-time" id="shift-time"></span>`;
                if (window.innerWidth > 800) {
                    renderDesktopCamarero(this.container, this);
                } else {
                    renderMobileCamarero(this.container, this);
                }
            } else if (view === 'cocinero') {
                this.title.innerHTML = `<i class='bx bx-bowl-hot'></i> Cocina${userStr} <span class="header-service-time" id="shift-time"></span>`;
                renderCocinero(this.container, this);
            } else if (view === 'barra') {
                this.title.innerHTML = `<i class='bx bx-drink'></i> Barra${userStr} <span class="header-service-time" id="shift-time"></span>`;
                renderBarra(this.container, this);
            } else if (view === 'admin') {
                if (!auth.isAdmin() && !this.currentUser?.isAdmin) {
                    this.navigate('home');
                    return;
                }
                renderDesktop(this.container, this);
            } else if (view === 'carta') {
                if (!auth.isAdmin() && !this.currentUser?.isAdmin) {
                    this.navigate('home');
                    return;
                }
                this.title.innerHTML = `<i class='bx bx-book'></i> Gestionar Carta`;
                renderManageMenu(this.container, this);
            }
            
            // Initial timer set
            const timeEl = document.getElementById('shift-time');
            if (timeEl && globalState.shiftStartTime && globalState.shift.isOpen) {
                const diff = Math.floor((Date.now() - globalState.shiftStartTime) / 1000);
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
                const s = (diff % 60).toString().padStart(2, '0');
                timeEl.textContent = `${h.toString().padStart(2, '0')}:${m}:${s}`;
            } else if (timeEl) {
                timeEl.textContent = '';
            }
        }
    }

    openAdminDrawer(section) {
        let drawer = document.getElementById('admin-drawer-overlay');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'admin-drawer-overlay';
            drawer.style.position = 'fixed';
            drawer.style.top = '0';
            drawer.style.left = '0';
            drawer.style.width = '100vw';
            drawer.style.height = '100vh';
            drawer.style.backgroundColor = 'var(--color-bg)';
            drawer.style.zIndex = '9999';
            drawer.style.overflowY = 'auto';
            document.body.appendChild(drawer);
        }
        drawer.innerHTML = `
            <div style="position:sticky; top:0; background:var(--color-surface); padding:1rem; border-bottom:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center; z-index:10;">
                <h2 style="margin:0;"><i class='bx bx-cog'></i> Administración</h2>
                <button id="btn-close-admin-drawer" class="btn-icon"><i class='bx bx-x'></i></button>
            </div>
            <div id="admin-drawer-content" style="padding: 1rem;"></div>
        `;
        document.getElementById('btn-close-admin-drawer').addEventListener('click', () => {
            drawer.style.display = 'none';
            this.navigate(this.currentView);
        });
        drawer.style.display = 'block';
        
        const content = document.getElementById('admin-drawer-content');
        if (section === 'dashboard') {
            drawer.style.display = 'none';
            this.navigate('admin');
        } else if (section === 'carta') {
            import('./carta.js').then(m => m.renderManageMenu(content, this));
        } else if (section === 'devices') {
            import('./ui/devices_admin.js').then(m => m.renderDevicesAdmin(content, this));
        }
    }

    showToast(msg) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Start app
const appInstance = new App();
window.app = appInstance;
appInstance.init();
