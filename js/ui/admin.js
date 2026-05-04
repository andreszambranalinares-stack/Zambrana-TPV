import { globalState } from '../state.js';
import { tickets } from '../tickets.js';
import { storage } from '../storage.js';
import { showModal, closeModal } from './common.js';
import { deviceManager } from '../device.js';

export function renderAdmin(container, app) {
    const render = () => {
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

        document.getElementById('input-num-tables').addEventListener('change', (e) => {
            globalState.updateConfig({ numTables: parseInt(e.target.value) });
            render();
        });

        document.getElementById('btn-table-editor').addEventListener('click', renderTableEditor);
        document.getElementById('btn-tickets-archive').addEventListener('click', renderTicketsArchive);
        document.getElementById('btn-shift-history').addEventListener('click', renderShiftHistory);

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

        
        document.getElementById('btn-save-alerts').addEventListener('click', () => {
            globalState.updateConfig({
                alertWarning: parseInt(document.getElementById('input-alert-warn').value),
                alertDanger: parseInt(document.getElementById('input-alert-danger').value),
                barAlertWarning: parseInt(document.getElementById('input-alert-bwarn').value),
                barAlertDanger: parseInt(document.getElementById('input-alert-bdanger').value)
            });
            app.showToast('Alertas guardadas');
        });

        document.getElementById('btn-add-emp').addEventListener('click', () => openEmployeeForm());
    };
    
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
        let servidas = 0;
        let pendientes = 0;
        const counts = {};
        
        aB.forEach(o => o.items.forEach(i => {
            servidas += i.qty;
            counts[i.name] = (counts[i.name] || 0) + i.qty;
        }));
        qB.forEach(o => o.items.forEach(i => {
            pendientes += i.qty;
            counts[i.name] = (counts[i.name] || 0) + i.qty;
        }));
        
        let top = 'Ninguna';
        let max = 0;
        for (const [name, qty] of Object.entries(counts)) {
            if (qty > max) { max = qty; top = name; }
        }
        
        return { servidas, pendientes, topVentas: top };
    };

    window.editEmployee = (id) => {
        const emp = globalState.employees.find(e => e.id === id);
        if (emp) openEmployeeForm(emp);
    };

    window.deleteEmployee = (id) => {
        globalState.deleteEmployee(id);
        renderAdmin(container, app);
    };

    const openEmployeeForm = (emp = null) => {
        const isEdit = !!emp;
        const eData = emp || { id: 'e_' + Date.now(), alias: '', pin: '', role: 'Camarero', active: true, isAdmin: false, color: '#8B0000' };

        const html = `
            <div style="display:flex; flex-direction:column; gap:1rem;">
                <label>Alias (Nombre visible):</label>
                <input type="text" id="emp-alias" value="${eData.alias}" style="padding:0.5rem;">
                
                <label>PIN de 4 dígitos:</label>
                <input type="text" id="emp-pin" value="${eData.pin}" maxlength="4" style="padding:0.5rem;">
                
                <label>Rol principal:</label>
                <select id="emp-role" style="padding:0.5rem;">
                    <option value="Camarero" ${eData.role==='Camarero'?'selected':''}>Camarero</option>
                    <option value="Cocinero" ${eData.role==='Cocinero'?'selected':''}>Cocinero</option>
                    <option value="Barra" ${eData.role==='Barra'?'selected':''}>Barra</option>
                </select>

                <label>Color representativo:</label>
                <input type="color" id="emp-color" value="${eData.color}" style="width:100%; height:40px;">

                <div style="display:flex; gap:1rem; margin-top:0.5rem;">
                    <label><input type="checkbox" id="emp-active" ${eData.active?'checked':''}> Activo</label>
                    <label><input type="checkbox" id="emp-admin" ${eData.isAdmin?'checked':''}> Permisos Administrador</label>
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
        const html = `
            <div style="padding:1rem; border:1px solid var(--color-border); border-radius:4px; margin-top:1rem;">
                <h4>Selecciona empleados del turno:</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin:1rem 0; max-height:200px; overflow-y:auto;">
                    ${activeEmps.map(emp => `
                        <label style="display:flex; align-items:center; gap:0.5rem;">
                            <input type="checkbox" class="shift-emp-check" value="${emp.id}" checked>
                            ${emp.alias} (${emp.role})
                        </label>
                    `).join('')}
                </div>
                <button class="btn btn-primary" id="btn-confirm-open">Confirmar Apertura</button>
                <button class="btn btn-secondary" onclick="document.getElementById('sec-turno-form').remove()">Cancelar</button>
            </div>
        `;
        const div = document.createElement('div');
        div.id = 'sec-turno-form';
        div.innerHTML = html;
        document.getElementById('sec-turno').appendChild(div);

        document.getElementById('btn-confirm-open').addEventListener('click', () => {
            const selected = Array.from(document.querySelectorAll('.shift-emp-check:checked')).map(c => c.value);
            if (selected.length === 0) return alert('Selecciona al menos uno.');
            globalState.shift.isOpen = true;
            globalState.shift.startTime = Date.now();
            globalState.shift.activeEmployees = selected;
            globalState.shift.logs = [];
            globalState.logAction('Apertura de turno');
            render();
        });
    };

    const closeShiftInline = () => {
        if(confirm('¿Estás seguro de cerrar el turno? Se generará el informe final.')) {
            globalState.logAction('Cierre de turno');
            globalState.shift.isOpen = false;
            
            const summaryHtml = renderShiftSummaryHtml();
            const history = storage.loadState('shiftHistory') || [];
            history.unshift({ date: Date.now(), html: summaryHtml });
            if (history.length > 7) history.pop();
            storage.saveState('shiftHistory', history);

            tickets.clearTickets();
            globalState.resetShift();
            render();
            // Show summary in full view
            container.innerHTML = `
                <div style="padding: 2rem; max-width: 600px; margin: 0 auto;">
                    <h2>Turno Cerrado</h2>
                    <div style="background:var(--color-surface); padding:1rem; border-radius:8px; margin:1rem 0;">
                        ${summaryHtml}
                    </div>
                    <button class="btn btn-primary" onclick="window.app.navigate('home')">Volver a Inicio</button>
                </div>
            `;
        }
    };

    const resetShiftInline = () => {
        if(confirm('⚠️ ¿Estás seguro de resetear el turno completamente? Esto borrará comandas activas sin generar informe.')) {
            globalState.logAction('Reset forzado de turno');
            tickets.clearTickets();
            globalState.resetShift();
            render();
            app.showToast('Turno reseteado');
        }
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
                        <span>📐 Cuadrícula: ${COLS} × ${ROWS} = ${MAX_TABLES} celdas máx.</span>
                        <span>🟥 ${globalState.tables.length} mesa${globalState.tables.length !== 1 ? 's' : ''} configurada${globalState.tables.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div style="display:flex;gap:.5rem;">
                        <button class="btn btn-secondary" id="btn-editor-cancel">↩ Volver</button>
                        <button class="btn btn-primary" id="btn-editor-save">💾 Guardar Plano</button>
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
