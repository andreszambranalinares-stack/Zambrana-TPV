import { globalState } from '../state.js';
import { deviceManager } from '../device.js';

// Mapa rol -> vista correspondiente
const ROLE_VIEW = {
    'Camarero': 'camarero',
    'Cocinero': 'cocinero',
    'Barra': 'barra',
    'Administrador': 'camarero'
};

export function renderHome(container, app) {
    const isShiftOpen = globalState.shift.isOpen;

    const kitchenPending = globalState.orders.filter(o => o.status === 'en_cocina').length;
    const barPending = globalState.orders.filter(o => o.status === 'en_barra').length;

    let shiftInfo = `<div class="banner" style="background:var(--color-danger); color:white;"><i class="bx bx-error-circle"></i> No hay turno abierto — contacta con el administrador</div>`;

    if (isShiftOpen) {
        const d = new Date(globalState.shift.startTime);
        shiftInfo = `<div style="color:var(--color-free); font-weight:bold; margin-bottom: 2rem;"><i class="bx bxs-circle" style="font-size:0.8rem;vertical-align:middle;"></i> Turno abierto desde ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}</div>`;
    }

    // Empleados activos asignados al turno de hoy
    const shiftEmps = isShiftOpen
        ? globalState.employees.filter(e =>
            e.active && globalState.shift.activeEmployees.includes(e.id))
        : [];

    let body = '';
    if (!isShiftOpen) {
        body = '';
    } else if (shiftEmps.length === 0) {
        body = `<div class="banner" style="background:var(--color-bg-soft); color:var(--color-text-muted); margin-top:1rem;"><i class="bx bx-user-x"></i> No hay empleados asignados a este turno — el administrador puede añadirlos.</div>`;
    } else {
        body = `<div class="role-cards">` + shiftEmps.map(emp => {
            const view = ROLE_VIEW[emp.role] || 'camarero';
            let pending = 0;
            if (view === 'cocinero') pending = kitchenPending;
            else if (view === 'barra') pending = barPending;
            return `
                <button class="role-card" id="emp-card-${emp.id}" data-emp-id="${emp.id}">
                    ${pending > 0 ? `<div class="badge">${pending}</div>` : ''}
                    <span class="emp-avatar" style="background:${emp.color || 'var(--color-primary)'}; width:56px; height:56px; line-height:56px; border-radius:50%; font-size:1.6rem; color:#fff; display:inline-block; text-align:center;">${(emp.alias || '?').charAt(0).toUpperCase()}</span>
                    <span class="role-title">${emp.alias || emp.name || 'Empleado'}</span>
                    <span class="role-sub">${emp.role || 'Camarero'}</span>
                </button>
            `;
        }).join('') + `</div>`;
    }

    container.innerHTML = `
        <div class="home-view">
            <img src="logo.png" alt="Zambrana TPV" style="height: 80px; max-width: 90%; object-fit: contain; margin-bottom: 1rem;">
            ${shiftInfo}
            ${body}
        </div>
    `;

    if (!isShiftOpen) return;

    const enterAs = (emp) => {
        const view = ROLE_VIEW[emp.role] || 'camarero';
        app.currentUser = emp;
        deviceManager.linkEmployee(emp.alias || emp.name || 'Empleado');
        app.navigate(view);
    };

    shiftEmps.forEach(emp => {
        const card = document.getElementById(`emp-card-${emp.id}`);
        if (card) card.addEventListener('click', () => enterAs(emp));
    });
}
