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

    // Auth state visibility logic removed to always show admin tools

    // Standard actions
    document.getElementById('btn-change-role').addEventListener('click', () => {
        toggleMenu();
        app.navigate('home');
    });



    const btnDash = document.getElementById('btn-admin-dashboard');
    if (btnDash) {
        btnDash.addEventListener('click', () => {
            toggleMenu();
            if (auth.isAdmin() || (app.currentUser && app.currentUser.isAdmin)) {
                app.openAdminDrawer('dashboard');
            } else {
                auth.showLoginModal(() => {
                    app.openAdminDrawer('dashboard');
                });
            }
        });
    }
    
    const btnCarta = document.getElementById('btn-manage-carta');
    if (btnCarta) {
        btnCarta.addEventListener('click', () => {
            toggleMenu();
            if (auth.isAdmin() || (app.currentUser && app.currentUser.isAdmin)) app.openAdminDrawer('carta');
            else auth.showLoginModal(() => app.openAdminDrawer('carta'));
        });
    }
    
    const btnDevices = document.getElementById('btn-admin-devices');
    if (btnDevices) {
        btnDevices.addEventListener('click', () => {
            toggleMenu();
            if (auth.isAdmin() || (app.currentUser && app.currentUser.isAdmin)) app.openAdminDrawer('devices');
            else auth.showLoginModal(() => app.openAdminDrawer('devices'));
        });
    }

    document.getElementById('btn-view-allergens').addEventListener('click', () => {
        toggleMenu();
        import('../alergenos.js').then(m => m.renderAllergensView());
    });

    document.getElementById('btn-toggle-sound').addEventListener('click', () => {
        const soundEnabled = !globalState.config.soundEnabled;
        globalState.updateConfig({ soundEnabled });
        const icon = document.querySelector('#btn-toggle-sound .icon');
        const text = document.querySelector('#btn-toggle-sound .text');
        if(icon) icon.innerHTML = soundEnabled ? "<i class='bx bx-volume-full'></i>" : "<i class='bx bx-volume-mute'></i>";
        if(text) text.textContent = soundEnabled ? 'Sonido activado' : 'Sonido silenciado';
    });

    document.getElementById('btn-about').addEventListener('click', () => {
        toggleMenu();
        alert('Zambrana TPV v1.4\nDesarrollado para alta eficiencia en hostelería.');
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
