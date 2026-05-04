import { globalState } from '../state.js';
import { auth } from '../auth.js';
import { showModal, closeModal } from './common.js';
import { deviceManager } from '../device.js';
import { storage } from '../storage.js';

export function renderHome(container, app) {
    const isShiftOpen = globalState.shift.isOpen;
    
    const kitchenPending = globalState.orders.filter(o => o.status === 'en_cocina').length;
    const barPending = globalState.orders.filter(o => o.status === 'en_barra').length;

    let shiftInfo = `<div class="banner" style="background:var(--color-danger); color:white;"><i class="bx bx-error-circle"></i> No hay turno abierto — contacta con el administrador</div>`;
    let disabledClass = 'disabled';
    
    if (isShiftOpen) {
        const d = new Date(globalState.shift.startTime);
        shiftInfo = `<div style="color:var(--color-free); font-weight:bold; margin-bottom: 2rem;"><i class="bx bxs-circle" style="font-size:0.8rem;vertical-align:middle;"></i> Turno abierto desde ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}</div>`;
        disabledClass = '';
    }

    const html = `
        <div class="home-view">
            <img src="logo.png" alt="Zambrana TPV" style="height: 80px; max-width: 90%; object-fit: contain; margin-bottom: 1rem;">
            ${shiftInfo}
            <div class="role-cards ${disabledClass}">
                <button class="role-card" id="role-camarero" data-tour="role-camarero">
                    <span class="icon"><i class="bx bx-restaurant"></i></span>
                    <span>Camarero</span>
                </button>
                <button class="role-card" id="role-cocinero" data-tour="role-cocinero">
                    ${kitchenPending > 0 ? `<div class="badge">${kitchenPending}</div>` : ''}
                    <span class="icon"><i class="bx bx-bowl-hot"></i></span>
                    <span>Cocinero</span>
                </button>
                <button class="role-card" id="role-barra" data-tour="role-barra">
                    ${barPending > 0 ? `<div class="badge">${barPending}</div>` : ''}
                    <span class="icon"><i class="bx bx-drink"></i></span>
                    <span>Barra</span>
                </button>
            </div>
            <button id="role-admin" title="Administración" style="display:${auth.isAdmin() || (app.currentUser && app.currentUser.isAdmin) ? 'none' : 'block'}; position:fixed; bottom:1rem; left:1rem; background:rgba(255,255,255,0.05); color:var(--color-text-muted); padding:0.8rem; border-radius:50%; border:1px solid var(--color-border); opacity:0.6; cursor:pointer; font-size:1.5rem; z-index:500;">
                <i class="bx bx-cog"></i>
            </button>
        </div>
    `;
    container.innerHTML = html;

    const selectEmployeeAndNavigate = (roleFilter, viewDest) => {
        if (!isShiftOpen) return;
        
        // Find active employees of this role in the current shift
        const shiftEmps = globalState.employees.filter(e => 
            e.active && 
            globalState.shift.activeEmployees.includes(e.id) &&
            (roleFilter === 'Barra' ? e.role === 'Camarero' || e.role === 'Barra' : e.role === roleFilter)
        );

        if (auth.isAdmin()) {
            app.currentUser = { id: 'admin', alias: 'Administrador', role: roleFilter, favCategory: 'favs', isAdmin: true };
            deviceManager.linkEmployee('Administrador');
            app.navigate(viewDest);
            return;
        }

        if (shiftEmps.length === 0) {
            alert(`No hay ningún empleado asignado a ${roleFilter} en este turno.`);
            return;
        }

        if (shiftEmps.length === 1 && viewDest === 'barra') {
            app.currentUser = shiftEmps[0];
            deviceManager.linkEmployee(shiftEmps[0].alias);
            app.navigate(viewDest);
            return;
        }

        let empsHtml = `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:1rem; margin-top:1rem;">`;
        shiftEmps.forEach(emp => {
            empsHtml += `
                <div class="emp-card" data-emp-id="${emp.id}">
                    <div class="emp-avatar" style="background:${emp.color}">${emp.alias.charAt(0)}</div>
                    <strong>${emp.alias}</strong>
                </div>
            `;
        });
        empsHtml += `</div>`;
        empsHtml += `<div style="margin-top:2rem; text-align:center;"><input type="password" id="pin-login" placeholder="PIN rápido" maxlength="4" style="width:150px; text-align:center; font-size:1.2rem; letter-spacing:4px;"></div>`;

        const modalId = showModal(`${roleFilter}s de turno hoy`, empsHtml);

        const tryPin = (pinStr) => {
            const emp = shiftEmps.find(e => e.pin === pinStr);
            if (emp) {
                app.currentUser = emp;
                deviceManager.linkEmployee(emp.alias);
                closeModal(modalId);
                app.navigate(viewDest);
            }
        };

        document.getElementById('pin-login').addEventListener('input', (e) => {
            if (e.target.value.length === 4) tryPin(e.target.value);
        });

        document.querySelectorAll('.emp-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-emp-id');
                const emp = shiftEmps.find(e => e.id === id);
                if (emp) {
                    app.currentUser = emp;
                    deviceManager.linkEmployee(emp.alias);
                    closeModal(modalId);
                    app.navigate(viewDest);
                }
            });
        });
    };

    document.getElementById('role-camarero').addEventListener('click', () => selectEmployeeAndNavigate('Camarero', 'camarero'));
    document.getElementById('role-cocinero').addEventListener('click', () => selectEmployeeAndNavigate('Cocinero', 'cocinero'));
    document.getElementById('role-barra').addEventListener('click', () => selectEmployeeAndNavigate('Barra', 'barra'));

    document.getElementById('role-admin').addEventListener('click', () => {
        if (auth.isAdmin() || (app.currentUser && app.currentUser.isAdmin)) {
            app.navigate('admin');
        } else {
            auth.showLoginModal(() => {
                app.navigate('admin');
            });
        }
    });

    const btnQuickAdmin = document.getElementById('btn-quick-admin');
    if (btnQuickAdmin) {
        btnQuickAdmin.addEventListener('click', () => app.navigate('admin'));
    }
}
