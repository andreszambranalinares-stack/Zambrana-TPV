import { globalState } from './state.js';
import { storage } from './storage.js';
import { renderHome } from './ui/home.js';
import { renderCamarero } from './ui/camarero.js';
import { renderCocinero } from './ui/cocinero.js';
import { renderBarra } from './ui/barra.js';
import { renderAdmin } from './ui/admin.js';
import { renderManageMenu } from './carta.js';
import { initSidebar } from './ui/sidebar.js';
import { auth } from './auth.js';

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

        this.init();
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
            if (timeEl && globalState.shiftStartTime) {
                const diff = Math.floor((Date.now() - globalState.shiftStartTime) / 60000);
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                timeEl.textContent = `${h}h ${m}m en servicio`;
            }
        }, 60000);

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
        
        if (view === 'home') {
            this.header.classList.add('hidden');
            this.currentUser = null;
            renderHome(this.container, this);
        } else {
            this.header.classList.remove('hidden');
            let userStr = this.currentUser ? ` — ${this.currentUser.alias}` : '';
            
            if (view === 'camarero') {
                this.title.innerHTML = `🍽️ Sala${userStr} <span class="header-service-time" id="shift-time"></span>`;
                renderCamarero(this.container, this);
            } else if (view === 'cocinero') {
                this.title.innerHTML = `🧑‍🍳 Cocina${userStr} <span class="header-service-time" id="shift-time"></span>`;
                renderCocinero(this.container, this);
            } else if (view === 'barra') {
                this.title.innerHTML = `🍺 Barra${userStr} <span class="header-service-time" id="shift-time"></span>`;
                renderBarra(this.container, this);
            } else if (view === 'admin') {
                if (!auth.isAdmin() && !this.currentUser?.isAdmin) {
                    this.navigate('home');
                    return;
                }
                this.title.innerHTML = `⚙️ Administración`;
                renderAdmin(this.container, this);
            } else if (view === 'carta') {
                if (!auth.isAdmin() && !this.currentUser?.isAdmin) {
                    this.navigate('home');
                    return;
                }
                this.title.innerHTML = `📖 Gestionar Carta`;
                renderManageMenu(this.container, this);
            }
            
            // Initial timer set
            const timeEl = document.getElementById('shift-time');
            if (timeEl && globalState.shiftStartTime) {
                const diff = Math.floor((Date.now() - globalState.shiftStartTime) / 60000);
                timeEl.textContent = `${Math.floor(diff / 60)}h ${diff % 60}m en servicio`;
            }
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
window.app = new App();
