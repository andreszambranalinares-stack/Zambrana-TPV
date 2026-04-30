import { showModal, closeModal } from './ui/common.js';
import { globalState } from './state.js';

export const auth = {
    isAdmin() {
        return sessionStorage.getItem('admin_session') === 'true';
    },

    login(username, password) {
        if (username === 'admin' && password === '1234') {
            sessionStorage.setItem('admin_session', 'true');
            this.renderAdminBadge();
            globalState.notifyListeners('auth');
            return true;
        }
        return false;
    },

    logout() {
        sessionStorage.removeItem('admin_session');
        const badge = document.getElementById('admin-badge');
        if (badge) badge.remove();
        globalState.notifyListeners('auth');
    },

    showLoginModal(onSuccess) {
        if (this.isAdmin()) {
            if (onSuccess) onSuccess();
            return;
        }

        const html = `
            <div style="display:flex; flex-direction:column; gap:1rem;">
                <p style="text-align:center; color:var(--color-text-muted);">Casa Pepa — Administración</p>
                <input type="text" id="admin-user" placeholder="Usuario" value="admin">
                <div style="position:relative;">
                    <input type="password" id="admin-pass" placeholder="Contraseña" style="width:100%;">
                    <button id="toggle-pass" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer;">👁️</button>
                </div>
                <div id="login-error" style="color:var(--color-danger); font-size:0.9rem; text-align:center; height:20px;"></div>
                <button class="btn btn-primary" id="btn-login-submit">Entrar</button>
            </div>
        `;
        const modalId = showModal('Acceso Admin', html);
        
        document.getElementById('toggle-pass').addEventListener('click', (e) => {
            const input = document.getElementById('admin-pass');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        document.getElementById('btn-login-submit').addEventListener('click', (e) => {
            const user = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;
            if (this.login(user, pass)) {
                closeModal(modalId);
                if (onSuccess) onSuccess();
            } else {
                const err = document.getElementById('login-error');
                err.textContent = 'Credenciales incorrectas';
                const modalContent = document.querySelector(`#${modalId} .modal-content`);
                modalContent.classList.remove('shake');
                void modalContent.offsetWidth; // trigger reflow
                modalContent.classList.add('shake');
            }
        });
    },

    renderAdminBadge() {
        if (!this.isAdmin()) return;
        if (document.getElementById('admin-badge')) return;
        
        const badge = document.createElement('div');
        badge.id = 'admin-badge';
        badge.className = 'admin-badge';
        badge.innerHTML = `
            <div id="btn-badge-admin-panel" style="position:absolute; bottom:calc(100% + 5px); left:0; background:var(--color-primary); color:white; padding:0.3rem 0.6rem; border-radius:10px; font-size:0.8rem; cursor:pointer; box-shadow:var(--shadow-md); display:flex; align-items:center; gap:0.3rem;">
                ⚙️ Panel Admin
            </div>
            ⚙️ Admin activo 
            <button id="btn-logout-admin" style="margin-left:0.5rem; background:white; color:black; border:none; padding:2px 6px; border-radius:10px; font-size:0.8rem; cursor:pointer;">Salir</button>
        `;
        document.body.appendChild(badge);
        
        document.getElementById('btn-logout-admin').addEventListener('click', (e) => {
            e.stopPropagation();
            this.logout();
            window.app.navigate('home');
        });

        document.getElementById('btn-badge-admin-panel').addEventListener('click', (e) => {
            e.stopPropagation();
            window.app.navigate('admin');
        });
    }
};

// Initial check
document.addEventListener('DOMContentLoaded', () => {
    auth.renderAdminBadge();
});
