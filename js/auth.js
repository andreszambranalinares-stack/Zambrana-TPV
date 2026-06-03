import { showModal, closeModal } from './ui/common.js';
import { globalState } from './state.js';
import { storage } from './storage.js';
import { makeHash, verifyHash } from './crypto.js';

export const auth = {
    isAdmin() {
        return sessionStorage.getItem('admin_session') === 'true';
    },

    // Verifica la contraseña de admin contra el hash guardado en config.
    // Si todavía no hay hash (instalación nueva), acepta el '1234' por defecto una
    // sola vez y lo migra a hash automáticamente.
    async login(password) {
        const cfg = globalState.config || {};
        let ok = false;
        if (cfg.adminPass && cfg.adminPass.hash) {
            ok = await verifyHash(password, cfg.adminPass);
        } else if (password === '1234') {
            ok = true;
            globalState.updateConfig({ adminPass: await makeHash('1234') });
        }
        if (ok) {
            sessionStorage.setItem('admin_session', 'true');
            this.renderAdminBadge();
            globalState.notifyListeners('auth');
            return true;
        }
        return false;
    },

    // Cambia la contraseña de administrador (guardada cifrada en config, sincroniza).
    async setAdminPassword(newPass) {
        const hashed = await makeHash(newPass);
        globalState.updateConfig({ adminPass: hashed });
    },

    // ── Cuenta segura (Supabase Auth) para datos personales (salarios) ──────────
    // Inicia sesión real en la nube. Mientras está activa, los datos protegidos por
    // RLS (pagos/salarios) pueden leerse y escribirse. Es opcional: la app funciona
    // sin ella, pero los importes de pagos no saldrán de este dispositivo.
    async signInSecure(email, password) {
        const client = storage.getCloudClient && storage.getCloudClient();
        if (!client) return { ok: false, error: 'La nube no está configurada.' };
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
    },

    async signOutSecure() {
        const client = storage.getCloudClient && storage.getCloudClient();
        if (client) await client.auth.signOut();
    },

    async isSecure() {
        const client = storage.getCloudClient && storage.getCloudClient();
        if (!client) return false;
        const { data } = await client.auth.getSession();
        return !!(data && data.session);
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
                <p style="text-align:center; color:var(--color-text-muted);">Zambrana TPV — Administración</p>
                <div style="position:relative;">
                    <input type="password" id="admin-pass" placeholder="Contraseña de administrador" style="width:100%;">
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

        const submit = async () => {
            const pass = document.getElementById('admin-pass').value;
            if (await this.login(pass)) {
                closeModal(modalId);
                if (onSuccess) onSuccess();
            } else {
                const err = document.getElementById('login-error');
                err.textContent = 'Contraseña incorrecta';
                const modalContent = document.querySelector(`#${modalId} .modal-content`);
                modalContent.classList.remove('shake');
                void modalContent.offsetWidth; // trigger reflow
                modalContent.classList.add('shake');
            }
        };
        document.getElementById('btn-login-submit').addEventListener('click', submit);
        document.getElementById('admin-pass').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submit();
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
                <i class='bx bx-cog'></i> Panel Admin
            </div>
            <i class='bx bx-cog'></i> Admin activo 
            <button id="btn-logout-admin" style="margin-left:0.5rem; background:white; color:black; border:none; padding:2px 6px; border-radius:10px; font-size:0.8rem; cursor:pointer;">Salir</button>
        `;
        document.body.appendChild(badge);
        
        // Hide badge when mobile admin layout is active (has its own nav)
        const updateBadgeVisibility = () => {
            const hasMobileAdmin = !!document.querySelector('.admin-mobile-layout');
            badge.style.display = hasMobileAdmin ? 'none' : '';
        };
        updateBadgeVisibility();
        const observer = new MutationObserver(updateBadgeVisibility);
        observer.observe(document.getElementById('app-container') || document.body, { childList: true, subtree: true });

        document.getElementById('btn-logout-admin').addEventListener('click', (e) => {
            e.stopPropagation();
            observer.disconnect();
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
