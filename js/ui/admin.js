import { globalState } from '../state.js';
import { tickets } from '../tickets.js';
import { storage } from '../storage.js';
import { showModal, closeModal } from './common.js';
import { deviceManager } from '../device.js';

// ── PAGOS A EMPLEADOS — helpers compartidos (módulo) ──────────────────────────
const PAYMENT_TYPES = ['Nómina', 'Adelanto', 'Propina', 'Hora extra', 'Otro'];
const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Bizum'];

const formatMoney = (n) => `${(n || 0).toFixed(2)} €`;

function buildEmployeePayCard(emp) {
    const empPayments = globalState.getPaymentsByEmployee(emp.id);
    const total = empPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const last = empPayments[0];
    const rateTxt = emp.rate ? `${formatMoney(emp.rate)}/h` : 'Sin tarifa';
    return `
        <div class="widget" style="margin-bottom:.75rem;display:flex;align-items:center;gap:1rem;">
            <div style="width:44px;height:44px;border-radius:50%;background:${emp.color};color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem;flex-shrink:0;">${(emp.alias || '?').charAt(0)}</div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:.95rem;">${emp.alias}</div>
                <div style="font-size:.75rem;color:var(--color-text-muted);">${rateTxt} · Pagado: <strong style="color:var(--color-primary);">${formatMoney(total)}</strong></div>
                <div style="font-size:.7rem;color:var(--color-text-muted);">${last ? `Último: ${formatMoney(last.amount)} · ${new Date(last.date).toLocaleDateString('es-ES')}` : 'Sin pagos aún'}</div>
            </div>
            <button class="btn btn-primary" style="padding:.45rem .8rem;font-size:.85rem;flex-shrink:0;" onclick="window.payEmployee('${emp.id}')"><i class='bx bx-money-withdraw'></i> Pagar</button>
        </div>`;
}

function buildPaymentsHistory(limit = 10) {
    const payments = (globalState.payments || []).slice(0, limit);
    if (payments.length === 0) {
        return '<div style="text-align:center;color:var(--color-text-muted);padding:1rem 0;font-size:.85rem;">Aún no se ha registrado ningún pago.</div>';
    }
    return payments.map(p => {
        const emp = globalState.employees.find(e => e.id === p.employeeId);
        return `
        <div class="widget" style="margin-bottom:.5rem;display:flex;align-items:center;gap:.75rem;padding:.6rem .8rem;">
            <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:.88rem;">${emp ? emp.alias : 'Empleado eliminado'} <span style="font-weight:500;color:var(--color-text-muted);">· ${p.type}</span></div>
                <div style="font-size:.72rem;color:var(--color-text-muted);">${new Date(p.date).toLocaleString('es-ES')} · ${p.method}${p.note ? ' · ' + p.note : ''}</div>
            </div>
            <div style="font-weight:800;font-size:1rem;color:var(--color-free);flex-shrink:0;">${formatMoney(p.amount)}</div>
            <button class="btn btn-secondary" style="padding:.3rem .5rem;font-size:.8rem;border-color:var(--color-danger);color:var(--color-danger);flex-shrink:0;" onclick="if(confirm('¿Eliminar este pago del registro?')) window.deletePayment('${p.id}')"><i class='bx bx-trash'></i></button>
        </div>`;
    }).join('');
}

function openPaymentForm(emp, onDone) {
    const app = window.app;
    const today = new Date().toISOString().slice(0, 10);
    const html = `
        <div style="display:flex; flex-direction:column; gap:.9rem;">
            <div style="display:flex;align-items:center;gap:.75rem;padding:.5rem 0;">
                <div style="width:40px;height:40px;border-radius:50%;background:${emp.color};color:white;display:flex;align-items:center;justify-content:center;font-weight:800;">${(emp.alias || '?').charAt(0)}</div>
                <div>
                    <div style="font-weight:700;">${emp.alias}</div>
                    <div style="font-size:.78rem;color:var(--color-text-muted);">${emp.role}${emp.rate ? ' · ' + formatMoney(emp.rate) + '/h' : ''}</div>
                </div>
            </div>

            <label>Importe (€):</label>
            <input type="number" id="pay-amount" min="0" step="0.01" placeholder="0.00" style="padding:0.5rem;font-size:1.1rem;font-weight:700;">

            <label>Concepto:</label>
            <select id="pay-type" style="padding:0.5rem;">
                ${PAYMENT_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>

            <label>Método de pago:</label>
            <select id="pay-method" style="padding:0.5rem;">
                ${PAYMENT_METHODS.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>

            <label>Fecha:</label>
            <input type="date" id="pay-date" value="${today}" style="padding:0.5rem;">

            <label>Nota (opcional):</label>
            <input type="text" id="pay-note" placeholder="Ej: pago semana del 1 al 7" style="padding:0.5rem;">
        </div>
    `;

    const modalId = showModal(`Pagar a ${emp.alias}`, html, `<button class="btn btn-primary" id="btn-save-pay"><i class='bx bx-check'></i> Registrar Pago</button>`);

    document.getElementById('btn-save-pay').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('pay-amount').value);
        if (!amount || amount <= 0) return alert('Introduce un importe válido mayor que 0.');

        const dateVal = document.getElementById('pay-date').value;
        const payment = {
            id: 'p_' + Date.now(),
            employeeId: emp.id,
            amount,
            type: document.getElementById('pay-type').value,
            method: document.getElementById('pay-method').value,
            date: dateVal ? new Date(dateVal).getTime() : Date.now(),
            note: document.getElementById('pay-note').value.trim(),
            paidBy: app?.currentUser?.alias || 'Admin'
        };

        globalState.addPayment(payment);
        closeModal(modalId);
        if (app) app.showToast(`💸 Pago de ${formatMoney(amount)} registrado a ${emp.alias}`);
        if (onDone) onDone();
    });
}

// ── COPIA DE SEGURIDAD (Bloque 2): exportar / importar todo el estado ─────────
function exportBackup() {
    const data = {};
    storage.getAllKeys().forEach(k => { data[k] = storage.loadState(k); });
    const payload = { _app: 'ZambranaTPV', _version: 1, _date: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zambrana-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (window.app) window.app.showToast('💾 Copia de seguridad descargada');
}

function triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                const data = parsed.data || parsed;
                if (!data || typeof data !== 'object') throw new Error('Formato no válido');
                if (!confirm('Esto reemplazará los datos de este dispositivo (y los sincronizará a la nube) con los de la copia. ¿Continuar?')) return;
                Object.keys(data).forEach(k => storage.saveState(k, data[k]));
                alert('Copia restaurada correctamente. La app se recargará.');
                location.reload();
            } catch (e) {
                alert('No se pudo leer la copia: ' + e.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

window.exportBackup = exportBackup;
window.triggerImport = triggerImport;

// ── Pantalla dedicada de Personal / Pagos (usada por el panel de escritorio) ──
export function renderPayroll(container, app) {
    const refresh = () => renderPayroll(container, app);
    window.payEmployee = (id) => {
        const emp = globalState.employees.find(e => e.id === id);
        if (emp) openPaymentForm(emp, refresh);
    };
    window.deletePayment = (id) => {
        globalState.deletePayment(id);
        refresh();
    };

    const totalPagado = (globalState.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
    container.innerHTML = `
        <div style="max-width:1100px;margin:0 auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
                <h2 style="margin:0;"><i class='bx bx-euro'></i> Personal y Pagos</h2>
                <div style="font-size:.95rem;color:var(--color-text-muted);">Total pagado (histórico): <strong style="color:var(--color-primary);font-size:1.1rem;">${formatMoney(totalPagado)}</strong></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 380px;gap:1.5rem;align-items:start;">
                <div>
                    <h3 style="margin-bottom:.75rem;font-size:1rem;color:var(--color-text-muted);">EMPLEADOS</h3>
                    ${globalState.employees.map(emp => buildEmployeePayCard(emp)).join('')}
                    ${globalState.employees.length === 0 ? '<div style="color:var(--color-text-muted);padding:2rem 0;">Añade empleados en Ajustes → Equipo para poder pagarles.</div>' : ''}
                </div>
                <div>
                    <h3 style="margin-bottom:.75rem;font-size:1rem;color:var(--color-text-muted);">HISTORIAL DE PAGOS</h3>
                    ${buildPaymentsHistory(20)}
                </div>
            </div>
        </div>
    `;
}

export function renderAdmin(container, app) {
    // Track which section is active in mobile bottom nav
    let mobileSection = 'servicio'; // servicio | turno | mesas | empleados | alertas

    const isMobile = () => window.innerWidth < 768;

    // ── HELPER STATS (declared early so section builders can use them) ─────────
    const calculateAverageWaitTime = () => {
        const qC = deviceManager.getQueue('queue_cocina');
        const qB = deviceManager.getQueue('queue_barra');
        const all = [...qC, ...qB];
        if (all.length === 0) return 0;
        let total = 0;
        all.forEach(o => total += (Date.now() - o.timestamp_entrada));
        return Math.floor((total / all.length) / 60000);
    };

    const calculateBarraStats = () => {
        const aB = deviceManager.getQueue('archive_barra');
        const qB = deviceManager.getQueue('queue_barra');
        const counts = {};
        [...aB, ...qB].forEach(o => o.items.forEach(i => {
            counts[i.name] = (counts[i.name] || 0) + i.qty;
        }));
        let top = 'Ninguna', max = 0;
        for (const [name, qty] of Object.entries(counts)) {
            if (qty > max) { max = qty; top = name; }
        }
        return { topVentas: top };
    };

    const render = () => {
        if (isMobile()) {
            renderMobile();
        } else {
            renderDesktop();
        }
    };

    // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
    const renderMobile = () => {
        const sections = [
            { id: 'servicio', icon: 'bx-signal-5', label: 'Servicio' },
            { id: 'turno',    icon: 'bx-time-five', label: 'Turno' },
            { id: 'empleados',icon: 'bx-group',     label: 'Equipo' },
            { id: 'pagos',    icon: 'bx-euro',      label: 'Pagos' },
            { id: 'mesas',    icon: 'bx-grid-alt',  label: 'Mesas' },
            { id: 'alertas',  icon: 'bx-bell',      label: 'Alertas' },
        ];

        container.innerHTML = `
        <div class="admin-mobile-layout">
            <div class="admin-mobile-topbar">
                <div class="admin-mobile-topbar-title">
                    <i class='bx bx-cog'></i> Panel Admin
                </div>
                <button class="btn btn-secondary" id="btn-admin-exit"
                    style="font-size:.8rem;padding:.35rem .7rem;display:flex;align-items:center;gap:.3rem;">
                    <i class='bx bx-arrow-back'></i> Salir
                </button>
            </div>
            <div class="admin-mobile-scroll" id="admin-mob-content">
                ${renderMobileSection()}
            </div>
            <nav class="admin-bottom-nav">
                ${sections.map(s => `
                <button class="admin-bottom-btn ${mobileSection === s.id ? 'active' : ''}" data-mob-section="${s.id}">
                    <i class='bx ${s.icon}'></i>
                    <span>${s.label}</span>
                </button>`).join('')}
            </nav>
        </div>`;

        // Bind bottom nav
        container.querySelectorAll('[data-mob-section]').forEach(btn => {
            btn.addEventListener('click', () => {
                mobileSection = btn.dataset.mobSection;
                render();
            });
        });

        // Exit button
        const btnExit = container.querySelector('#btn-admin-exit');
        if (btnExit) btnExit.addEventListener('click', () => app.navigate('home'));

        // ── Bind section-specific buttons (use container scope to avoid ID conflicts) ──
        const q = (id) => container.querySelector('#' + id);
        const qs = (sel) => container.querySelectorAll(sel);

        // Shift buttons
        const btnOpen = q('btn-open-shift');
        if (btnOpen) btnOpen.addEventListener('click', () => openShiftInline());
        const btnClose = q('btn-close-shift');
        if (btnClose) btnClose.addEventListener('click', () => closeShiftInline());
        const btnReset = q('btn-reset-shift');
        if (btnReset) btnReset.addEventListener('click', () => resetShiftInline());

        // Table section
        const numTablesEl = q('input-num-tables');
        if (numTablesEl) numTablesEl.addEventListener('change', e => {
            globalState.updateConfig({ numTables: parseInt(e.target.value) });
            render();
        });
        const btnEditor = q('btn-table-editor');
        if (btnEditor) btnEditor.addEventListener('click', () => renderTableEditor());
        const btnAssignZone = q('btn-assign-zone');
        if (btnAssignZone) btnAssignZone.addEventListener('click', () => {
            const zone = q('zone-select').value;
            const checked = Array.from(qs('.zone-table-check:checked')).map(c => parseInt(c.value));
            checked.forEach(id => globalState.updateTable(id, { zone }));
            app.showToast(`Zona "${zone}" asignada a ${checked.length} mesas`);
            render();
        });

        // Alerts section
        const btnSaveAlerts = q('btn-save-alerts');
        if (btnSaveAlerts) btnSaveAlerts.addEventListener('click', () => {
            globalState.updateConfig({
                alertWarning: parseInt(q('input-alert-warn').value),
                alertDanger: parseInt(q('input-alert-danger').value),
                barAlertWarning: parseInt(q('input-alert-bwarn').value),
                barAlertDanger: parseInt(q('input-alert-bdanger').value)
            });
            app.showToast('Alertas guardadas');
        });

        // Employees section
        const btnAddEmp = q('btn-add-emp');
        if (btnAddEmp) btnAddEmp.addEventListener('click', () => openEmployeeForm());

        // Archive / history buttons
        const btnTickets = q('btn-tickets-archive');
        if (btnTickets) btnTickets.addEventListener('click', () => renderTicketsArchive());
        const btnHistory = q('btn-shift-history');
        if (btnHistory) btnHistory.addEventListener('click', () => renderShiftHistory());
    };

    const renderMobileSection = () => {
        switch (mobileSection) {
            case 'servicio': return renderServicioSection();
            case 'turno':    return renderTurnoSection();
            case 'mesas':    return renderMesasSection();
            case 'empleados':return renderEmpleadosSection();
            case 'pagos':    return renderPagosSection();
            case 'alertas':  return renderAlertasSection();
            default:         return renderServicioSection();
        }
    };

    // ── SECTION BUILDERS ──────────────────────────────────────────────────────
    const renderServicioSection = () => `
        <div style="padding:1rem;">
            <div class="admin-section-header" style="margin:-1rem -1rem 1rem;padding:1rem;">
                <div class="admin-section-title"><i class='bx bx-signal-5'></i> Estado en Vivo</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin-bottom:1rem;">
                <div class="admin-stat-card">
                    <div class="stat-val">${deviceManager.getQueue('queue_cocina').length}</div>
                    <div class="stat-lbl"><i class='bx bx-bowl-hot'></i> Cocina</div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-val">${deviceManager.getQueue('queue_barra').length}</div>
                    <div class="stat-lbl"><i class='bx bx-drink'></i> Barra</div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-val" style="color:var(--color-free);">${globalState.tables.filter(t => t.status !== 'libre').length}</div>
                    <div class="stat-lbl"><i class='bx bx-table'></i> Mesas</div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-val">${Object.values(deviceManager.getDevices()).filter(d => (Date.now()-d.last_seen)<120000).length}</div>
                    <div class="stat-lbl"><i class='bx bx-devices'></i> Dispositivos</div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-val" style="font-size:1.3rem;">${calculateAverageWaitTime()} min</div>
                    <div class="stat-lbl"><i class='bx bx-time'></i> Espera</div>
                </div>
                <div class="admin-stat-card">
                    <div class="stat-val" style="font-size:.9rem;line-height:1.2;">${calculateBarraStats().topVentas}</div>
                    <div class="stat-lbl"><i class='bx bx-trophy'></i> Top Ventas</div>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.75rem;">
                <button class="btn btn-secondary" id="btn-tickets-archive" style="width:100%;"><i class='bx bx-printer'></i> Archivo de Tickets</button>
                <button class="btn btn-secondary" id="btn-shift-history" style="width:100%;"><i class='bx bx-history'></i> Historial de Turnos</button>
                <button class="btn btn-secondary" onclick="window.exportBackup()" style="width:100%;"><i class='bx bx-download'></i> Exportar copia de seguridad</button>
                <button class="btn btn-secondary" onclick="window.triggerImport()" style="width:100%;"><i class='bx bx-upload'></i> Importar copia</button>
            </div>
        </div>`;

    const renderTurnoSection = () => `
        <div style="padding:1rem;">
            <div class="admin-section-header" style="margin:-1rem -1rem 1rem;padding:1rem;">
                <div class="admin-section-title"><i class='bx bx-time-five'></i> Estado del Turno</div>
                <div style="font-size:.8rem;color:${globalState.shift.isOpen ? 'var(--color-free)' : 'var(--color-danger)'}; font-weight:700;">
                    <i class="bx bxs-circle" style="font-size:.7rem;"></i> ${globalState.shift.isOpen ? 'Abierto' : 'Cerrado'}
                </div>
            </div>
            <div class="widget" style="margin-bottom:1rem;">
                <div class="value" style="color:${globalState.shift.isOpen ? 'var(--color-free)' : 'var(--color-danger)'}; margin-bottom:1rem;">
                    ${globalState.shift.isOpen ? '<i class="bx bxs-circle" style="font-size:1rem;vertical-align:middle;"></i> Abierto' : '<i class="bx bxs-circle" style="font-size:1rem;vertical-align:middle;"></i> Cerrado'}
                </div>
                ${globalState.shift.isOpen
                    ? `<button class="btn btn-primary" style="background:var(--color-danger);width:100%;margin-bottom:.5rem;" id="btn-close-shift"><i class='bx bx-x-circle'></i> Cerrar Turno</button>`
                    : `<button class="btn btn-primary" style="width:100%;margin-bottom:.5rem;" id="btn-open-shift"><i class='bx bx-play-circle'></i> Abrir Turno</button>`
                }
                <button class="btn btn-secondary" style="width:100%;" id="btn-reset-shift"><i class='bx bx-reset'></i> Resetear Turno Completo</button>
            </div>
            <div class="widget">
                <h3>Comandas (Hoy)</h3>
                <div class="value">${tickets.getAllTickets().length}</div>
            </div>
        </div>`;

    const renderMesasSection = () => `
        <div style="padding:1rem;">
            <div class="admin-section-header" style="margin:-1rem -1rem 1rem;padding:1rem;">
                <div class="admin-section-title"><i class='bx bx-grid-alt'></i> Mesas y Plano</div>
                <span style="font-size:.9rem;color:var(--color-text-muted);">${globalState.tables.filter(t=>t.status!=='libre').length}/${globalState.config.numTables}</span>
            </div>
            <div class="widget" style="margin-bottom:1rem;">
                <h3>Número de mesas totales</h3>
                <input type="number" id="input-num-tables" value="${globalState.config.numTables}" min="1" max="50" style="margin-top:.5rem;">
            </div>
            <div class="widget" style="margin-bottom:1rem;">
                <h3>Asignar zona</h3>
                <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin:.5rem 0;" id="zone-assign-btns">
                    ${globalState.tables.map(t=>`<label style="display:flex;align-items:center;gap:4px;font-size:0.85rem;background:var(--color-bg);padding:.25rem .5rem;border-radius:6px;border:1px solid var(--color-border);"><input type="checkbox" class="zone-table-check" value="${t.id}"> M${String(t.id).padStart(2,'0')}</label>`).join('')}
                </div>
                <select id="zone-select" style="margin-bottom:.5rem;">
                    <option value="Salón">Salón</option><option value="Terraza">Terraza</option>
                    <option value="Barra">Barra</option><option value="Privado">Privado</option>
                </select>
                <button class="btn btn-secondary" style="width:100%;" id="btn-assign-zone">Asignar Zona</button>
            </div>
            <button class="btn btn-secondary" style="width:100%;" id="btn-table-editor"><i class='bx bx-edit-alt'></i> Editor de Plano</button>
        </div>`;

    const renderEmpleadosSection = () => `
        <div style="padding:1rem;">
            <div class="admin-section-header" style="margin:-1rem -1rem 1rem;padding:1rem;">
                <div class="admin-section-title"><i class='bx bx-group'></i> Empleados</div>
                <button class="btn btn-primary" id="btn-add-emp" style="font-size:.8rem;padding:.35rem .7rem;">+ Nuevo</button>
            </div>
            ${globalState.employees.map(emp => `
            <div class="widget" style="margin-bottom:.75rem;display:flex;align-items:center;gap:1rem;">
                <div style="width:44px;height:44px;border-radius:50%;background:${emp.color};color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem;flex-shrink:0;">${emp.alias.charAt(0)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:.95rem;">${emp.alias}</div>
                    <div style="font-size:.78rem;color:var(--color-text-muted);">${emp.role} · ${emp.isAdmin ? '<span style="color:var(--color-free);">Admin</span>' : 'Staff'} · <span style="color:${emp.active ? 'var(--color-free)' : 'var(--color-danger)'};">${emp.active ? 'Activo' : 'Inactivo'}</span></div>
                </div>
                <div style="display:flex;gap:.4rem;flex-shrink:0;">
                    <button class="btn btn-secondary" style="padding:.35rem .6rem;font-size:.8rem;" onclick="window.editEmployee('${emp.id}')"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-secondary" style="padding:.35rem .6rem;font-size:.8rem;border-color:var(--color-danger);color:var(--color-danger);" onclick="if(confirm('¿Eliminar a ${emp.alias}?')) window.deleteEmployee('${emp.id}')"><i class='bx bx-trash'></i></button>
                </div>
            </div>`).join('')}
            ${globalState.employees.length === 0 ? '<div style="text-align:center;color:var(--color-text-muted);padding:2rem 0;"><i class=\'bx bx-group\' style=\'font-size:2rem;display:block;margin-bottom:.5rem;\'></i>Sin empleados aún</div>' : ''}
        </div>`;

    const renderPagosSection = () => {
        const totalPagado = (globalState.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
        return `
        <div style="padding:1rem;">
            <div class="admin-section-header" style="margin:-1rem -1rem 1rem;padding:1rem;">
                <div class="admin-section-title"><i class='bx bx-euro'></i> Pagos a Empleados</div>
            </div>
            <div class="widget" style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:.85rem;color:var(--color-text-muted);">Total pagado (histórico)</span>
                <span style="font-size:1.3rem;font-weight:800;color:var(--color-primary);">${formatMoney(totalPagado)}</span>
            </div>
            ${globalState.employees.map(emp => buildEmployeePayCard(emp)).join('')}
            ${globalState.employees.length === 0 ? '<div style="text-align:center;color:var(--color-text-muted);padding:2rem 0;">Añade empleados en la sección Equipo para poder pagarles.</div>' : ''}
            <div style="margin-top:1.5rem;">
                <div style="font-weight:700;font-size:.9rem;margin-bottom:.5rem;display:flex;align-items:center;gap:.4rem;"><i class='bx bx-history'></i> Últimos pagos</div>
                ${buildPaymentsHistory(8)}
            </div>
        </div>`;
    };

    const renderAlertasSection = () => `
        <div style="padding:1rem;">
            <div class="admin-section-header" style="margin:-1rem -1rem 1rem;padding:1rem;">
                <div class="admin-section-title"><i class='bx bx-bell'></i> Alertas de Tiempo</div>
            </div>
            <div class="widget">
                <div style="display:flex;flex-direction:column;gap:1rem;">
                    <label style="display:flex;justify-content:space-between;align-items:center;">
                        <span><i class='bx bx-bowl-hot' style="color:var(--color-reserved);"></i> Cocina Aviso (min)</span>
                        <input type="number" id="input-alert-warn" value="${globalState.config.alertWarning}" style="width:70px;text-align:center;">
                    </label>
                    <label style="display:flex;justify-content:space-between;align-items:center;">
                        <span><i class='bx bx-bowl-hot' style="color:var(--color-danger);"></i> Cocina Peligro (min)</span>
                        <input type="number" id="input-alert-danger" value="${globalState.config.alertDanger}" style="width:70px;text-align:center;">
                    </label>
                    <label style="display:flex;justify-content:space-between;align-items:center;">
                        <span><i class='bx bx-drink' style="color:var(--color-reserved);"></i> Barra Aviso (min)</span>
                        <input type="number" id="input-alert-bwarn" value="${globalState.config.barAlertWarning}" style="width:70px;text-align:center;">
                    </label>
                    <label style="display:flex;justify-content:space-between;align-items:center;">
                        <span><i class='bx bx-drink' style="color:var(--color-danger);"></i> Barra Peligro (min)</span>
                        <input type="number" id="input-alert-bdanger" value="${globalState.config.barAlertDanger}" style="width:70px;text-align:center;">
                    </label>
                    <button class="btn btn-primary" id="btn-save-alerts" style="width:100%;"><i class='bx bx-save'></i> Guardar Alertas</button>
                </div>
            </div>
        </div>`;

    // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────
    const renderDesktop = () => {
        container.innerHTML = `
            <div style="padding: 1rem; max-width: 1200px; margin: 0 auto; padding-bottom: 5rem;">
                <h2 style="margin-bottom: 1rem;">Panel de Administración</h2>
                
                <div class="widget" id="sec-estado-servicio" style="margin-bottom:1rem;">
                    <h3>Estado del Servicio en Vivo</h3>
                    <div class="admin-stats-row" style="margin-top:.75rem;">
                        <div class="admin-stat-card">
                            <div class="stat-val">${deviceManager.getQueue('queue_cocina').length}</div>
                            <div class="stat-lbl">Cocina</div>
                        </div>
                        <div class="admin-stat-card">
                            <div class="stat-val">${deviceManager.getQueue('queue_barra').length}</div>
                            <div class="stat-lbl">Barra</div>
                        </div>
                        <div class="admin-stat-card">
                            <div class="stat-val" style="color:var(--color-free);">${globalState.tables.filter(t => t.status !== 'libre').length}</div>
                            <div class="stat-lbl">Mesas Abiertas</div>
                        </div>
                        <div class="admin-stat-card">
                            <div class="stat-val">${Object.values(deviceManager.getDevices()).filter(d => (Date.now()-d.last_seen)<120000).length}</div>
                            <div class="stat-lbl">Dispositivos</div>
                        </div>
                        <div class="admin-stat-card">
                            <div class="stat-val" style="font-size:1.4rem;">${calculateAverageWaitTime()} min</div>
                            <div class="stat-lbl">Espera Media</div>
                        </div>
                        <div class="admin-stat-card">
                            <div class="stat-val" style="font-size:1.1rem;">${calculateBarraStats().topVentas}</div>
                            <div class="stat-lbl">Top Ventas</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <div class="widget" id="sec-turno">
                        <h3>Estado del Turno</h3>
                        <div class="value" style="color: ${globalState.shift.isOpen ? 'var(--color-free)' : 'var(--color-danger)'};">
                            ${globalState.shift.isOpen ? '<i class="bx bxs-circle" style="font-size:1rem;vertical-align:middle;"></i> Abierto' : '<i class="bx bxs-circle" style="font-size:1rem;vertical-align:middle;"></i> Cerrado'}
                        </div>
                        <div style="margin-top: 1rem;">
                            ${globalState.shift.isOpen 
                                ? `<button class="btn btn-primary" style="background:var(--color-danger);" id="btn-close-shift">Cerrar Turno</button>` 
                                : `<button class="btn btn-primary" id="btn-open-shift">Abrir Turno</button>`
                            }
                            <button class="btn btn-secondary" style="margin-top:0.5rem; width:100%;" id="btn-reset-shift">Resetear Turno Completo</button>
                        </div>
                    </div>
                    
                    <div class="widget" id="sec-mesas">
                        <h3>Mesas y Plano</h3>
                        <div class="value">${globalState.tables.filter(t => t.status !== 'libre').length} / ${globalState.config.numTables}</div>
                        <div style="margin-top: 1rem; display:flex; flex-direction:column; gap:0.5rem;">
                            <label>Número de mesas totales:</label>
                            <input type="number" id="input-num-tables" value="${globalState.config.numTables}" min="1" max="50" style="padding:0.5rem;">
                            <label style="margin-top:0.5rem;">Asignar zona a mesas seleccionadas:</label>
                            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;" id="zone-assign-btns">
                                ${globalState.tables.map(t=>`<label style="display:flex;align-items:center;gap:4px;font-size:0.85rem;"><input type="checkbox" class="zone-table-check" value="${t.id}"> M${String(t.id).padStart(2,'0')}</label>`).join('')}
                            </div>
                            <select id="zone-select" style="padding:0.5rem;">
                                <option value="Salón">Salón</option>
                                <option value="Terraza">Terraza</option>
                                <option value="Barra">Barra</option>
                                <option value="Privado">Privado</option>
                            </select>
                            <button class="btn btn-secondary" id="btn-assign-zone">Asignar Zona</button>
                            <button class="btn btn-secondary" id="btn-table-editor"><i class="bx bx-edit-alt"></i> Editor de Plano</button>
                        </div>
                    </div>

                    
                    <div class="widget" id="sec-tickets">
                        <h3>Comandas (Hoy)</h3>
                        <div class="value">${tickets.getAllTickets().length}</div>
                        <div style="margin-top: 1rem;">
                            <button class="btn btn-secondary" id="btn-tickets-archive" style="width:100%;"><i class="bx bx-printer"></i> Archivo Tickets</button>
                            <button class="btn btn-secondary" id="btn-shift-history" style="width:100%; margin-top:0.5rem;"><i class="bx bx-history"></i> Historial Turnos</button>
                        </div>
                    </div>

                    <div class="widget" id="sec-alertas">
                        <h3>Alertas de Tiempo</h3>
                        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:1rem;">
                            <label>Cocina Aviso (min): <input type="number" id="input-alert-warn" value="${globalState.config.alertWarning}" style="width:60px;"></label>
                            <label>Cocina Peligro (min): <input type="number" id="input-alert-danger" value="${globalState.config.alertDanger}" style="width:60px;"></label>
                            <label>Barra Aviso (min): <input type="number" id="input-alert-bwarn" value="${globalState.config.barAlertWarning}" style="width:60px;"></label>
                            <label>Barra Peligro (min): <input type="number" id="input-alert-bdanger" value="${globalState.config.barAlertDanger}" style="width:60px;"></label>
                            <button class="btn btn-primary" id="btn-save-alerts">Guardar Alertas</button>
                        </div>
                    </div>

                    <div class="widget" id="sec-backup">
                        <h3>Copia de Seguridad</h3>
                        <p style="font-size:.85rem;color:var(--color-text-muted);margin:.5rem 0 1rem;">Descarga o restaura todos los datos (empleados, pagos, ventas, configuración).</p>
                        <div style="display:flex;flex-direction:column;gap:0.5rem;">
                            <button class="btn btn-secondary" onclick="window.exportBackup()" style="width:100%;"><i class='bx bx-download'></i> Exportar copia</button>
                            <button class="btn btn-secondary" onclick="window.triggerImport()" style="width:100%;"><i class='bx bx-upload'></i> Importar copia</button>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid" style="margin-top:2rem;" id="sec-empleados">
                    <div class="widget" style="grid-column: 1 / -1;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                            <h3>Empleados</h3>
                            <button class="btn btn-primary" id="btn-add-emp">+ Nuevo Empleado</button>
                        </div>
                        <div class="emp-table-wrap">
                            <table style="border-collapse: collapse;">
                                <thead>
                                    <tr style="text-align:left; border-bottom: 2px solid var(--color-border);">
                                        <th style="padding:0.5rem;">Alias</th>
                                        <th style="padding:0.5rem;">Rol</th>
                                        <th style="padding:0.5rem;">Admin</th>
                                        <th style="padding:0.5rem;">PIN</th>
                                        <th style="padding:0.5rem;">Estado</th>
                                        <th style="padding:0.5rem;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${globalState.employees.map(emp => `
                                        <tr style="border-bottom: 1px solid var(--color-border);">
                                            <td style="padding:0.5rem; display:flex; align-items:center; gap:0.5rem;">
                                                <div style="width:24px; height:24px; border-radius:50%; background:${emp.color}; color:white; display:flex; align-items:center; justify-content:center; font-size:0.7rem;">${emp.alias.charAt(0)}</div>
                                                ${emp.alias}
                                            </td>
                                            <td style="padding:0.5rem;">${emp.role}</td>
                                            <td style="padding:0.5rem;">${emp.isAdmin ? '<i class="bx bx-check" style="color:var(--color-free);font-size:1.2rem;"></i> Sí' : '<i class="bx bx-x" style="color:var(--color-danger);font-size:1.2rem;"></i> No'}</td>
                                            <td style="padding:0.5rem;">${emp.pin}</td>
                                            <td style="padding:0.5rem; color:${emp.active ? 'var(--color-free)' : 'var(--color-danger)'};">${emp.active ? 'Activo' : 'Inactivo'}</td>
                                            <td style="padding:0.5rem;">
                                                <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.8rem;" onclick="window.editEmployee('${emp.id}')"><i class="bx bx-edit"></i> Editar</button>
                                                <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.8rem; border-color:var(--color-danger); color:var(--color-danger);" onclick="if(confirm('¿Seguro que quieres eliminar a este empleado?')) window.deleteEmployee('${emp.id}')"><i class="bx bx-trash"></i> Eliminar</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid" style="margin-top:2rem;" id="sec-pagos">
                    <div class="widget" style="grid-column: 1 / -1;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                            <h3><i class='bx bx-euro'></i> Pagos a Empleados</h3>
                            <span style="font-size:.9rem;color:var(--color-text-muted);">Total pagado: <strong style="color:var(--color-primary);">${formatMoney((globalState.payments || []).reduce((s, p) => s + (p.amount || 0), 0))}</strong></span>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.75rem;margin-bottom:1.5rem;">
                            ${globalState.employees.map(emp => buildEmployeePayCard(emp)).join('')}
                        </div>
                        <div style="font-weight:700;font-size:.9rem;margin-bottom:.5rem;display:flex;align-items:center;gap:.4rem;"><i class='bx bx-history'></i> Últimos pagos</div>
                        ${buildPaymentsHistory(12)}
                    </div>
                </div>
            </div>
        `;

        if (document.getElementById('btn-open-shift')) {
            document.getElementById('btn-open-shift').addEventListener('click', openShiftInline);
        }
        if (document.getElementById('btn-close-shift')) {
            document.getElementById('btn-close-shift').addEventListener('click', closeShiftInline);
        }
        if (document.getElementById('btn-reset-shift')) {
            document.getElementById('btn-reset-shift').addEventListener('click', resetShiftInline);
        }

        const numTablesEl = document.getElementById('input-num-tables');
        if (numTablesEl) numTablesEl.addEventListener('change', (e) => {
            globalState.updateConfig({ numTables: parseInt(e.target.value) });
            render();
        });

        const btnEditor = document.getElementById('btn-table-editor');
        if (btnEditor) btnEditor.addEventListener('click', renderTableEditor);
        const btnTickets = document.getElementById('btn-tickets-archive');
        if (btnTickets) btnTickets.addEventListener('click', renderTicketsArchive);
        const btnHistory = document.getElementById('btn-shift-history');
        if (btnHistory) btnHistory.addEventListener('click', renderShiftHistory);

        const btnAssignZone = document.getElementById('btn-assign-zone');
        if (btnAssignZone) {
            btnAssignZone.addEventListener('click', () => {
                const zone = document.getElementById('zone-select').value;
                const checked = Array.from(document.querySelectorAll('.zone-table-check:checked')).map(c=>parseInt(c.value));
                checked.forEach(id => globalState.updateTable(id, { zone }));
                app.showToast(`Zona "${zone}" asignada a ${checked.length} mesas`);
                render();
            });
        }

        const btnSaveAlerts = document.getElementById('btn-save-alerts');
        if (btnSaveAlerts) btnSaveAlerts.addEventListener('click', () => {
            globalState.updateConfig({
                alertWarning: parseInt(document.getElementById('input-alert-warn').value),
                alertDanger: parseInt(document.getElementById('input-alert-danger').value),
                barAlertWarning: parseInt(document.getElementById('input-alert-bwarn').value),
                barAlertDanger: parseInt(document.getElementById('input-alert-bdanger').value)
            });
            app.showToast('Alertas guardadas');
        });

        const btnAddEmp = document.getElementById('btn-add-emp');
        if (btnAddEmp) btnAddEmp.addEventListener('click', () => openEmployeeForm());
    };




    window.editEmployee = (id) => {
        const emp = globalState.employees.find(e => e.id === id);
        if (emp) openEmployeeForm(emp);
    };

    window.deleteEmployee = (id) => {
        globalState.deleteEmployee(id);
        renderAdmin(container, app);
    };

    // ── PAGOS A EMPLEADOS (handlers; helpers viven a nivel de módulo) ──────────
    window.payEmployee = (id) => {
        const emp = globalState.employees.find(e => e.id === id);
        if (emp) openPaymentForm(emp, () => renderAdmin(container, app));
    };

    window.deletePayment = (id) => {
        globalState.deletePayment(id);
        renderAdmin(container, app);
    };

    const openEmployeeForm = (emp = null) => {
        const isEdit = !!emp;
        const eData = emp || { id: 'e_' + Date.now(), alias: '', pin: '', role: 'Camarero', active: true, isAdmin: false, color: '#8B0000', name: '', dni: '', phone: '', hireDate: '', rate: 0 };

        const html = `
            <div style="display:flex; flex-direction:column; gap:1rem;">
                <div style="font-weight:700;font-size:.85rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;">Acceso al TPV</div>
                <label>Alias (Nombre visible):</label>
                <input type="text" id="emp-alias" value="${eData.alias || ''}" style="padding:0.5rem;">

                <label>PIN de 4 dígitos:</label>
                <input type="text" id="emp-pin" value="${eData.pin || ''}" maxlength="4" style="padding:0.5rem;">

                <label>Rol principal:</label>
                <select id="emp-role" style="padding:0.5rem;">
                    <option value="Camarero" ${eData.role==='Camarero'?'selected':''}>Camarero</option>
                    <option value="Cocinero" ${eData.role==='Cocinero'?'selected':''}>Cocinero</option>
                    <option value="Barra" ${eData.role==='Barra'?'selected':''}>Barra</option>
                </select>

                <label>Color representativo:</label>
                <input type="color" id="emp-color" value="${eData.color || '#8B0000'}" style="width:100%; height:40px;">

                <div style="display:flex; gap:1rem; margin-top:0.5rem;">
                    <label><input type="checkbox" id="emp-active" ${eData.active?'checked':''}> Activo</label>
                    <label><input type="checkbox" id="emp-admin" ${eData.isAdmin?'checked':''}> Permisos Administrador</label>
                </div>

                <div style="font-weight:700;font-size:.85rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;margin-top:.5rem;border-top:1px solid var(--color-border);padding-top:1rem;">Datos para pagos</div>
                <label>Nombre completo:</label>
                <input type="text" id="emp-name" value="${eData.name || ''}" placeholder="Nombre y apellidos" style="padding:0.5rem;">

                <label>DNI / NIF:</label>
                <input type="text" id="emp-dni" value="${eData.dni || ''}" placeholder="00000000X" style="padding:0.5rem;">

                <label>Teléfono:</label>
                <input type="tel" id="emp-phone" value="${eData.phone || ''}" placeholder="600 000 000" style="padding:0.5rem;">

                <div style="display:flex; gap:1rem;">
                    <div style="flex:1;">
                        <label>Fecha de alta:</label>
                        <input type="date" id="emp-hiredate" value="${eData.hireDate || ''}" style="padding:0.5rem;width:100%;">
                    </div>
                    <div style="flex:1;">
                        <label>Tarifa (€/hora):</label>
                        <input type="number" id="emp-rate" value="${eData.rate || ''}" min="0" step="0.01" placeholder="0.00" style="padding:0.5rem;width:100%;">
                    </div>
                </div>
            </div>
        `;

        const modalId = showModal(isEdit ? 'Editar Empleado' : 'Nuevo Empleado', html, `<button class="btn btn-primary" id="btn-save-emp">Guardar Empleado</button>`);

        document.getElementById('btn-save-emp').addEventListener('click', () => {
            const alias = document.getElementById('emp-alias').value.trim();
            const pin = document.getElementById('emp-pin').value.trim();
            if (!alias || pin.length !== 4) return alert('El alias es obligatorio y el PIN debe tener 4 dígitos.');

            eData.alias = alias;
            eData.pin = pin;
            eData.role = document.getElementById('emp-role').value;
            eData.color = document.getElementById('emp-color').value;
            eData.active = document.getElementById('emp-active').checked;
            eData.isAdmin = document.getElementById('emp-admin').checked;
            eData.name = document.getElementById('emp-name').value.trim();
            eData.dni = document.getElementById('emp-dni').value.trim();
            eData.phone = document.getElementById('emp-phone').value.trim();
            eData.hireDate = document.getElementById('emp-hiredate').value;
            eData.rate = parseFloat(document.getElementById('emp-rate').value) || 0;

            if (isEdit) {
                globalState.updateEmployee(eData.id, eData);
            } else {
                globalState.employees.push(eData);
                globalState.updateEmployee(eData.id, eData); // to trigger save and notify
            }
            
            closeModal(modalId);
            renderAdmin(container, app); // Refresh entire admin view to show new employee
        });
    };

    const openShiftInline = () => {
        const activeEmps = globalState.employees.filter(e => e.active);
        // Use a floating modal overlay so it works in both mobile and desktop
        const existing = document.getElementById('shift-open-modal');
        if (existing) existing.remove();

        const ov = document.createElement('div');
        ov.id = 'shift-open-modal';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:1rem;';
        ov.innerHTML = `
            <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:20px;padding:1.5rem;width:min(380px,94vw);max-height:80vh;overflow-y:auto;">
                <div style="font-size:1.1rem;font-weight:800;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem;">
                    <i class='bx bx-play-circle' style="color:var(--color-free);"></i> Abrir Turno
                </div>
                <div style="font-size:.85rem;color:var(--color-text-muted);margin-bottom:.75rem;">Selecciona los empleados del turno:</div>
                <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem;max-height:200px;overflow-y:auto;">
                    ${activeEmps.length > 0 ? activeEmps.map(emp => `
                        <label style="display:flex;align-items:center;gap:.75rem;background:var(--color-bg);padding:.6rem .75rem;border-radius:10px;border:1px solid var(--color-border);cursor:pointer;">
                            <input type="checkbox" class="shift-emp-check" value="${emp.id}" checked style="width:auto;min-height:auto;">
                            <div>
                                <div style="font-weight:600;font-size:.9rem;">${emp.alias}</div>
                                <div style="font-size:.75rem;color:var(--color-text-muted);">${emp.role}</div>
                            </div>
                        </label>
                    `).join('') : '<div style="color:var(--color-text-muted);font-size:.85rem;text-align:center;padding:1rem;">Sin empleados activos. Añade empleados en la sección Equipo.</div>'}
                </div>
                <button id="btn-confirm-open" class="btn btn-primary" style="width:100%;margin-bottom:.5rem;">
                    <i class='bx bx-check'></i> Confirmar Apertura
                </button>
                <button id="btn-cancel-open" style="width:100%;padding:.5rem;background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:.88rem;">Cancelar</button>
            </div>`;
        document.body.appendChild(ov);

        document.getElementById('btn-confirm-open').addEventListener('click', () => {
            const selected = Array.from(document.querySelectorAll('.shift-emp-check:checked')).map(c => c.value);
            globalState.shift.isOpen = true;
            globalState.shift.startTime = Date.now();
            globalState.shift.activeEmployees = selected;
            globalState.shift.logs = [];
            globalState.logAction('Apertura de turno');
            ov.remove();
            render();
        });
        document.getElementById('btn-cancel-open').addEventListener('click', () => ov.remove());
        ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    };

    const closeShiftInline = () => {
        if (!confirm('¿Estás seguro de cerrar el turno? Se generará el informe final.')) return;

        globalState.logAction('Cierre de turno');
        globalState.shift.isOpen = false;

        const summaryHtml = renderShiftSummaryHtml();
        const history = storage.loadState('shiftHistory') || [];
        history.unshift({ date: Date.now(), html: summaryHtml });
        if (history.length > 7) history.pop();
        storage.saveState('shiftHistory', history);

        tickets.clearTickets();
        globalState.resetShift();

        // Show summary in a full-screen modal overlay (works in both mobile and desktop)
        const existing = document.getElementById('shift-close-modal');
        if (existing) existing.remove();

        const ov = document.createElement('div');
        ov.id = 'shift-close-modal';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);padding:1rem;';
        ov.innerHTML = `
            <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:20px;padding:1.5rem;width:min(420px,94vw);max-height:85vh;overflow-y:auto;display:flex;flex-direction:column;gap:1rem;">
                <div style="display:flex;align-items:center;gap:.75rem;padding-bottom:1rem;border-bottom:1px solid var(--color-border);">
                    <div style="width:44px;height:44px;border-radius:50%;background:var(--color-free);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class='bx bx-check' style="font-size:1.5rem;color:#fff;"></i>
                    </div>
                    <div>
                        <div style="font-weight:800;font-size:1.1rem;">Turno Cerrado</div>
                        <div style="font-size:.8rem;color:var(--color-text-muted);">${new Date().toLocaleString('es-ES')}</div>
                    </div>
                </div>
                <div style="background:var(--color-bg);border-radius:12px;padding:1rem;">
                    ${summaryHtml}
                </div>
                <button id="btn-shift-close-ok" class="btn btn-primary" style="width:100%;">
                    <i class='bx bx-home'></i> Volver a Inicio
                </button>
            </div>`;
        document.body.appendChild(ov);

        document.getElementById('btn-shift-close-ok').addEventListener('click', () => {
            ov.remove();
            app.navigate('home');
        });
    };


    const resetShiftInline = () => {
        const existing = document.getElementById('shift-reset-modal');
        if (existing) existing.remove();
        const ov = document.createElement('div');
        ov.id = 'shift-reset-modal';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);padding:1rem;';
        ov.innerHTML = `
            <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:20px;padding:1.5rem;width:min(380px,94vw);display:flex;flex-direction:column;gap:1rem;">
                <div style="display:flex;align-items:center;gap:.75rem;">
                    <div style="width:44px;height:44px;border-radius:50%;background:var(--color-warning,#f59e0b);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class='bx bx-error' style="font-size:1.5rem;color:#fff;"></i>
                    </div>
                    <div>
                        <div style="font-weight:800;font-size:1rem;">Resetear Turno</div>
                        <div style="font-size:.8rem;color:var(--color-text-muted);">Esta acción no se puede deshacer</div>
                    </div>
                </div>
                <p style="font-size:.88rem;color:var(--color-text-muted);margin:0;">Esto borrará todas las comandas activas sin generar informe de cierre. ¿Continuar?</p>
                <div style="display:flex;gap:.75rem;">
                    <button id="btn-reset-cancel" class="btn btn-secondary" style="flex:1;">Cancelar</button>
                    <button id="btn-reset-confirm" class="btn btn-primary" style="flex:1;background:var(--color-warning,#f59e0b);border-color:var(--color-warning,#f59e0b);">
                        <i class='bx bx-reset'></i> Resetear
                    </button>
                </div>
            </div>`;
        document.body.appendChild(ov);
        document.getElementById('btn-reset-cancel').addEventListener('click', () => ov.remove());
        document.getElementById('btn-reset-confirm').addEventListener('click', () => {
            ov.remove();
            globalState.logAction('Reset forzado de turno');
            tickets.clearTickets();
            globalState.resetShift();
            render();
            app.showToast('Turno reseteado');
        });
    };


    const renderShiftSummaryHtml = () => {
        const allTickets = tickets.getAllTickets();
        const cobros = allTickets.filter(t => t.type === 'cobro');
        const comandas = allTickets.filter(t => t.type === 'comanda');
        
        let total = 0, totalTarjeta = 0, totalEfectivo = 0, totalDividida = 0;
        cobros.forEach(c => {
            total += c.total;
            if (c.htmlContent.includes('TARJETA')) totalTarjeta += c.total;
            else if (c.htmlContent.includes('EFECTIVO')) totalEfectivo += c.total;
            else totalDividida += c.total;
        });

        return `
            <div style="font-family: monospace; font-size:14px; text-align:left;">
                <p><strong>Apertura:</strong> ${new Date(globalState.shift.startTime).toLocaleString('es-ES')}</p>
                <p><strong>Cierre:</strong> ${new Date().toLocaleString('es-ES')}</p>
                <hr style="margin: 1rem 0; border: 1px dashed #ccc;">
                <p><strong>Total Facturado:</strong> ${total.toFixed(2)} €</p>
                <p> - Tarjeta: ${totalTarjeta.toFixed(2)} €</p>
                <p> - Efectivo: ${totalEfectivo.toFixed(2)} €</p>
                <p> - Dividida/Mixto: ${totalDividida.toFixed(2)} €</p>
                <p><strong>Mesas Cobradas:</strong> ${cobros.length}</p>
                <p><strong>Comandas Enviadas:</strong> ${comandas.length}</p>
            </div>
        `;
    };

    const renderTableEditor = () => {
        const COLS = 8;
        const ROWS = 6;
        const MAX_TABLES = COLS * ROWS; // 48

        // Build grid state: cellIndex → tableId (or null)
        // Assign default positions for tables that don't have one yet
        const gridMap = new Map(); // cellIndex → tableId

        globalState.tables.forEach((table, i) => {
            const defaultCell = Math.min(i, MAX_TABLES - 1);
            const cell = (table.gridCell !== undefined && table.gridCell < MAX_TABLES) ? table.gridCell : defaultCell;
            // Avoid duplicate assignments
            if (!gridMap.has(cell)) {
                gridMap.set(cell, table.id);
                table._tempCell = cell;
            } else {
                // Find next free cell
                for (let c = 0; c < MAX_TABLES; c++) {
                    if (!gridMap.has(c)) {
                        gridMap.set(c, table.id);
                        table._tempCell = c;
                        break;
                    }
                }
            }
        });

        container.innerHTML = `
            <style>
                #grid-editor-wrap {
                    padding: 1.5rem;
                    max-width: 1100px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    height: 100%;
                }
                #grid-editor-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: .75rem;
                }
                #grid-editor-header h2 { margin: 0; font-size: 1.2rem; }
                #grid-editor-legend {
                    display: flex;
                    gap: 1rem;
                    font-size: .8rem;
                    color: var(--color-text-muted);
                    flex-wrap: wrap;
                }
                #editor-grid {
                    display: grid;
                    grid-template-columns: repeat(${COLS}, 1fr);
                    grid-template-rows: repeat(${ROWS}, 1fr);
                    gap: 6px;
                    flex: 1;
                    background: var(--color-surface);
                    border: 2px solid var(--color-border);
                    border-radius: 12px;
                    padding: 10px;
                    min-height: 340px;
                }
                .grid-cell {
                    border: 2px dashed var(--color-border);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 52px;
                    position: relative;
                    transition: background .12s, border-color .12s;
                    cursor: default;
                }
                .grid-cell.cell-occupied { border-style: solid; border-color: transparent; }
                .grid-cell.drag-over {
                    background: rgba(214,31,44,.15);
                    border-color: var(--color-primary);
                    border-style: solid;
                }
                .table-chip {
                    width: 100%;
                    height: 100%;
                    border-radius: 7px;
                    background: var(--color-primary);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: .95rem;
                    cursor: grab;
                    user-select: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,.3);
                    transition: transform .12s, box-shadow .12s;
                }
                .table-chip:active { cursor: grabbing; transform: scale(.97); }
                .table-chip.dragging {
                    opacity: .5;
                    transform: scale(.9);
                }
            </style>
            <div id="grid-editor-wrap">
                <div id="grid-editor-header">
                    <h2><i class='bx bx-grid-alt'></i> Editor de Plano</h2>
                    <div id="grid-editor-legend">
                        <span><i class='bx bx-shape-square'></i> Cuadrícula: ${COLS} × ${ROWS} = ${MAX_TABLES} celdas máx.</span>
                        <span><i class='bx bx-rectangle'></i> ${globalState.tables.length} mesa${globalState.tables.length !== 1 ? 's' : ''} configurada${globalState.tables.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div style="display:flex;gap:.5rem;">
                        <button class="btn btn-secondary" id="btn-editor-cancel"><i class='bx bx-undo'></i> Volver</button>
                        <button class="btn btn-primary" id="btn-editor-save"><i class='bx bx-save'></i> Guardar Plano</button>
                    </div>
                </div>
                <div id="editor-grid">
                    ${Array.from({length: ROWS * COLS}, (_, i) => `<div class="grid-cell" data-cell="${i}"></div>`).join('')}
                </div>
                <p style="font-size:.8rem;color:var(--color-text-muted);text-align:center;margin:0;">
                    Arrastra las mesas para reposicionarlas en la cuadrícula. Las celdas vacías quedan disponibles.
                </p>
            </div>
        `;

        const grid = document.getElementById('editor-grid');

        // Paint initial state
        const renderGrid = () => {
            // Rebuild gridMap from _tempCell
            const cellToTable = new Map();
            globalState.tables.forEach(t => {
                if (t._tempCell !== undefined) cellToTable.set(t._tempCell, t);
            });

            grid.querySelectorAll('.grid-cell').forEach(cell => {
                const idx = parseInt(cell.dataset.cell);
                const table = cellToTable.get(idx);
                cell.innerHTML = '';
                cell.classList.remove('cell-occupied');
                if (table) {
                    cell.classList.add('cell-occupied');
                    const chip = document.createElement('div');
                    chip.className = 'table-chip';
                    chip.draggable = true;
                    chip.dataset.tableId = table.id;
                    chip.innerHTML = `
                        <div style="text-align:center;line-height:1.2;">
                            <div style="font-size:1rem;">${String(table.id).padStart(2,'0')}</div>
                            ${table.zone ? `<div style="font-size:.6rem;opacity:.7;">${table.zone}</div>` : ''}
                        </div>`;
                    cell.appendChild(chip);
                }
            });
            bindDrag();
        };

        let dragTableId = null;
        let dragSourceCell = null;

        const bindDrag = () => {
            grid.querySelectorAll('.table-chip').forEach(chip => {
                chip.addEventListener('dragstart', e => {
                    dragTableId = parseInt(chip.dataset.tableId);
                    dragSourceCell = parseInt(chip.closest('.grid-cell').dataset.cell);
                    chip.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                });
                chip.addEventListener('dragend', () => {
                    chip.classList.remove('dragging');
                    grid.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over'));
                });
            });

            grid.querySelectorAll('.grid-cell').forEach(cell => {
                cell.addEventListener('dragover', e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    grid.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over'));
                    cell.classList.add('drag-over');
                });
                cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
                cell.addEventListener('drop', e => {
                    e.preventDefault();
                    cell.classList.remove('drag-over');
                    const targetCell = parseInt(cell.dataset.cell);
                    if (targetCell === dragSourceCell || dragTableId === null) return;

                    // Check if target is occupied — swap
                    const targetTable = globalState.tables.find(t => t._tempCell === targetCell);
                    const sourceTable = globalState.tables.find(t => t.id === dragTableId);

                    if (targetTable) {
                        // Swap positions
                        targetTable._tempCell = dragSourceCell;
                    }
                    if (sourceTable) {
                        sourceTable._tempCell = targetCell;
                    }

                    dragTableId = null;
                    dragSourceCell = null;
                    renderGrid();
                });
            });

            // Touch drag for mobile
            let touchDragId = null, touchSourceCellIdx = null;
            grid.querySelectorAll('.table-chip').forEach(chip => {
                chip.addEventListener('touchstart', e => {
                    touchDragId = parseInt(chip.dataset.tableId);
                    touchSourceCellIdx = parseInt(chip.closest('.grid-cell').dataset.cell);
                    chip.classList.add('dragging');
                }, {passive:true});

                chip.addEventListener('touchend', e => {
                    chip.classList.remove('dragging');
                    const touch = e.changedTouches[0];
                    const el = document.elementFromPoint(touch.clientX, touch.clientY);
                    const targetCell = el?.closest('.grid-cell');
                    if (!targetCell || !touchDragId) return;
                    const targetIdx = parseInt(targetCell.dataset.cell);
                    if (targetIdx === touchSourceCellIdx) return;

                    const targetTable = globalState.tables.find(t => t._tempCell === targetIdx);
                    const srcTable = globalState.tables.find(t => t.id === touchDragId);
                    if (targetTable) targetTable._tempCell = touchSourceCellIdx;
                    if (srcTable) srcTable._tempCell = targetIdx;

                    touchDragId = null;
                    touchSourceCellIdx = null;
                    renderGrid();
                });
            });
        };

        renderGrid();

        document.getElementById('btn-editor-cancel').addEventListener('click', () => {
            globalState.tables.forEach(t => delete t._tempCell);
            render();
        });

        document.getElementById('btn-editor-save').addEventListener('click', () => {
            globalState.tables.forEach(t => {
                if (t._tempCell !== undefined) {
                    t.gridCell = t._tempCell;
                    // Also keep % coords for backward compat with mobile view
                    t.x = Math.round(((t._tempCell % COLS) / COLS) * 100);
                    t.y = Math.round((Math.floor(t._tempCell / COLS) / ROWS) * 100);
                    delete t._tempCell;
                }
            });
            storage.saveState('tables', globalState.tables);
            globalState.notifyListeners('tables');
            app.showToast('✅ Plano guardado');
            render();
        });
    };

    const renderTicketsArchive = () => {
        const all = tickets.getAllTickets();
        if (!window.app.printTicketHtml) {
            window.app.printTicketHtml = (encodedHtml) => tickets.doPrint(decodeURIComponent(encodedHtml));
        }
        container.innerHTML = `
            <div style="padding: 1rem; max-width: 800px; margin: 0 auto;">
                <button class="btn btn-secondary" onclick="window.app.navigate('admin')" style="margin-bottom:1rem;">← Volver</button>
                <h2>Archivo de Tickets</h2>
                <div style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    ${all.map(t => `
                        <div class="widget" style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong>Ticket ${t.type.toUpperCase()} - Mesa ${t.tableId}</strong><br>
                                <span style="font-size:0.8rem; color:var(--color-text-muted);">
                                    ${new Date(t.timestamp).toLocaleTimeString()} - Camarero: ${t.waiter || 'N/A'}
                                </span>
                            </div>
                            <button class="btn btn-secondary" onclick="window.app.printTicketHtml('${encodeURIComponent(t.htmlContent)}')">🖨️ Imprimir</button>
                        </div>
                    `).join('')}
                    ${all.length === 0 ? '<p>No hay tickets en el turno actual.</p>' : ''}
                </div>
            </div>
        `;
    };

    const renderShiftHistory = () => {
        const history = storage.loadState('shiftHistory') || [];
        container.innerHTML = `
            <div style="padding: 1rem; max-width: 800px; margin: 0 auto;">
                <button class="btn btn-secondary" onclick="window.app.navigate('admin')" style="margin-bottom:1rem;">← Volver</button>
                <h2>Historial de Turnos</h2>
                <div style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    ${history.map(h => `
                        <div style="border:1px solid var(--color-border); border-radius:4px; padding:1rem; background:var(--color-surface);">
                            <h4 style="margin-bottom:0.5rem; color:var(--color-primary);">${new Date(h.date).toLocaleDateString()}</h4>
                            ${h.html}
                        </div>
                    `).join('')}
                    ${history.length === 0 ? '<p>No hay historial de turnos.</p>' : ''}
                </div>
            </div>
        `;
    };

    render();
}
