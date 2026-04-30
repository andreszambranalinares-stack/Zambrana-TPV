import { globalState } from '../state.js';
import { auth } from '../auth.js';

export function initSidebar(app) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btnMenu = document.getElementById('btn-menu');
    const btnCloseMenu = document.getElementById('btn-close-menu');

    const toggleMenu = () => {
        if (!sidebar || !overlay) return;
        const isHidden = sidebar.classList.contains('sidebar-hidden');
        if (isHidden) {
            sidebar.classList.remove('sidebar-hidden');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('sidebar-hidden');
            overlay.classList.add('hidden');
        }
    };

    if (btnMenu) btnMenu.addEventListener('click', toggleMenu);
    if (btnCloseMenu) btnCloseMenu.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', toggleMenu);

    // Auth state visibility
    const adminSection = document.getElementById('admin-menu-section');
    const updateAdminVisibility = () => {
        const hasAdminAccess = auth.isAdmin() || (app.currentUser && app.currentUser.isAdmin);
        if (adminSection) adminSection.style.display = hasAdminAccess ? 'block' : 'none';
    };
    
    // Subscribe to state to toggle visibility when auth changes
    globalState.subscribe(() => updateAdminVisibility());
    updateAdminVisibility();

    // Standard actions
    document.getElementById('btn-change-role').addEventListener('click', () => {
        toggleMenu();
        app.navigate('home');
    });

    document.getElementById('btn-toggle-theme').addEventListener('click', () => {
        const current = globalState.config.theme || 'light';
        const newTheme = current === 'light' ? 'dark' : 'light';
        globalState.updateConfig({ theme: newTheme });
        
        document.body.className = `theme-${newTheme}`;
        const icon = document.querySelector('#btn-toggle-theme .icon');
        const text = document.querySelector('#btn-toggle-theme .text');
        if (text) text.textContent = newTheme === 'light' ? 'Modo oscuro' : 'Modo claro';
        if (icon) icon.textContent = newTheme === 'light' ? '🌙' : '☀️';
    });

    const btnDash = document.getElementById('btn-admin-dashboard');
    if (btnDash) btnDash.addEventListener('click', () => { toggleMenu(); app.navigate('admin'); });
    
    const btnCarta = document.getElementById('btn-manage-carta');
    if (btnCarta) btnCarta.addEventListener('click', () => { toggleMenu(); app.navigate('carta'); });

    document.getElementById('btn-view-allergens').addEventListener('click', () => {
        toggleMenu();
        import('../alergenos.js').then(m => m.renderAllergensView());
    });

    document.getElementById('btn-toggle-sound').addEventListener('click', () => {
        const soundEnabled = !globalState.config.soundEnabled;
        globalState.updateConfig({ soundEnabled });
        const icon = document.querySelector('#btn-toggle-sound .icon');
        const text = document.querySelector('#btn-toggle-sound .text');
        if(icon) icon.textContent = soundEnabled ? '🔊' : '🔇';
        if(text) text.textContent = soundEnabled ? 'Sonido activado' : 'Sonido silenciado';
    });

    document.getElementById('btn-about').addEventListener('click', () => {
        toggleMenu();
        alert('Casa Pepa TPV v1.3\nDesarrollado para alta eficiencia en hostelería.');
    });

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            toggleMenu();
            auth.logout();
            app.navigate('home');
        });
    }
}
