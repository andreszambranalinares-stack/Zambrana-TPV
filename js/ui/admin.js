import { globalState } from '../state.js';
import { tickets } from '../tickets.js';
import { storage } from '../storage.js';
import { showModal, closeModal } from './common.js'; // Keep for simple prompts if needed, but avoid for main UI

export function renderAdmin(container, app) {
    const render = () => {
        container.innerHTML = `
            <div style="padding: 1rem; max-width: 1200px; margin: 0 auto; padding-bottom: 5rem;">
                <h2 style="margin-bottom: 1rem;">Panel de Administración</h2>
                
                <div class="dashboard-grid">
                    <div class="widget" id="sec-turno">
                        <h3>Estado del Turno</h3>
                        <div class="value" style="color: ${globalState.shift.isOpen ? 'var(--color-free)' : 'var(--color-danger)'};">
                            ${globalState.shift.isOpen ? '🟢 Abierto' : '🔴 Cerrado'}
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
                            <button class="btn btn-secondary" id="btn-table-editor">✏️ Editor de Plano</button>
                        </div>
                    </div>
                    
                    <div class="widget" id="sec-tickets">
                        <h3>Comandas (Hoy)</h3>
                        <div class="value">${tickets.getAllTickets().length}</div>
                        <div style="margin-top: 1rem;">
                            <button class="btn btn-secondary" id="btn-tickets-archive" style="width:100%;">🖨️ Archivo Tickets</button>
                            <button class="btn btn-secondary" id="btn-shift-history" style="width:100%; margin-top:0.5rem;">📚 Historial Turnos</button>
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
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse: collapse; min-width: 600px;">
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
                                            <td style="padding:0.5rem;">${emp.isAdmin ? '✅ Sí' : '❌ No'}</td>
                                            <td style="padding:0.5rem;">${emp.pin}</td>
                                            <td style="padding:0.5rem; color:${emp.active ? 'var(--color-free)' : 'var(--color-danger)'};">${emp.active ? 'Activo' : 'Inactivo'}</td>
                                            <td style="padding:0.5rem;">
                                                <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.8rem;" onclick="window.editEmployee('${emp.id}')">✏️ Editar</button>
                                                <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.8rem; border-color:var(--color-danger); color:var(--color-danger);" onclick="if(confirm('¿Seguro que quieres eliminar a este empleado?')) window.deleteEmployee('${emp.id}')">🗑️ Eliminar</button>
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
                            <input type="checkbox" class="shift-emp-check" value="${emp.id}">
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
        container.innerHTML = `
            <div style="padding: 1rem; max-width: 1200px; margin: 0 auto; height:100vh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; flex-wrap:wrap; gap:1rem;">
                    <h2>Editor de Plano de Mesas</h2>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <button class="btn btn-secondary" id="btn-multi-select" style="background:var(--color-surface); border:1px solid var(--color-border); color:var(--color-text);">🔲 Multiselección: OFF</button>
                        <button class="btn btn-secondary" id="btn-editor-cancel">Volver</button>
                        <button class="btn btn-primary" id="btn-editor-save">Guardar Plano</button>
                    </div>
                </div>
                <div class="editor-container" id="editor-area" style="width: 100%; aspect-ratio: 16/9; max-width: 1200px; background: var(--color-surface); border: 2px dashed var(--color-border); border-radius: var(--radius-md); margin: 0 auto; position:relative; overflow:hidden;"></div>
            </div>
        `;

        const area = document.getElementById('editor-area');
        let multiSelectMode = false;
        let selectedTables = new Set();
        let isDragging = false;
        let dragStartClient = { x: 0, y: 0 };
        let activeDragEl = null;
        let initialPositions = new Map(); // Store {x, y} for each selected table at the start of drag

        const btnMulti = document.getElementById('btn-multi-select');
        btnMulti.addEventListener('click', () => {
            multiSelectMode = !multiSelectMode;
            btnMulti.innerHTML = multiSelectMode ? '🔳 Multiselección: ON' : '🔲 Multiselección: OFF';
            btnMulti.style.borderColor = multiSelectMode ? 'var(--color-primary)' : 'var(--color-border)';
            if (!multiSelectMode) {
                selectedTables.clear();
                document.querySelectorAll('.table-card-absolute').forEach(el => el.style.boxShadow = '');
            }
        });

        const elementsMap = new Map();

        globalState.tables.forEach((table, i) => {
            const el = document.createElement('div');
            el.className = 'table-card-absolute table-status-libre';
            el.textContent = table.id;
            el.dataset.id = table.id;
            
            // Round existing coordinates to nearest grid point
            const GRID_SIZE = 5;
            let x = table.x !== undefined ? table.x : (i % 5) * 15 + 5;
            let y = table.y !== undefined ? table.y : Math.floor(i / 5) * 20 + 5;
            
            x = Math.round(x / GRID_SIZE) * GRID_SIZE;
            y = Math.round(y / GRID_SIZE) * GRID_SIZE;
            
            el.style.left = x + '%';
            el.style.top = y + '%';
            table.newX = x;
            table.newY = y;
            
            elementsMap.set(table.id, { el, table });

            const startDrag = (e) => {
                if (multiSelectMode) {
                    if (selectedTables.has(table.id)) {
                        selectedTables.delete(table.id);
                        el.style.boxShadow = '';
                        return; // Just toggled off, don't drag
                    } else {
                        selectedTables.add(table.id);
                        el.style.boxShadow = '0 0 0 3px var(--color-primary)';
                    }
                } else {
                    if (!selectedTables.has(table.id)) {
                        selectedTables.clear();
                        document.querySelectorAll('.table-card-absolute').forEach(e => e.style.boxShadow = '');
                        selectedTables.add(table.id);
                        el.style.boxShadow = '0 0 0 3px var(--color-primary)';
                    }
                }

                isDragging = true;
                activeDragEl = el;
                dragStartClient = {
                    x: e.touches ? e.touches[0].clientX : e.clientX,
                    y: e.touches ? e.touches[0].clientY : e.clientY
                };
                
                // Store initial positions of all selected elements
                initialPositions.clear();
                selectedTables.forEach(id => {
                    const t = elementsMap.get(id).table;
                    initialPositions.set(id, { x: t.newX, y: t.newY });
                });
            };

            el.addEventListener('mousedown', startDrag);
            el.addEventListener('touchstart', startDrag, {passive: false});
            area.appendChild(el);
        });

        const moveHandler = (e) => {
            if (!isDragging || !activeDragEl) return;
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const rect = area.getBoundingClientRect();
            
            // Calculate delta in percentages
            const deltaX = ((clientX - dragStartClient.x) / rect.width) * 100;
            const deltaY = ((clientY - dragStartClient.y) / rect.height) * 100;
            
            const GRID_SIZE = 5;

            selectedTables.forEach(id => {
                const item = elementsMap.get(id);
                const initPos = initialPositions.get(id);
                if (initPos) {
                    let newX = initPos.x + deltaX;
                    let newY = initPos.y + deltaY;
                    
                    // Keep within bounds
                    newX = Math.max(0, Math.min(newX, 100));
                    newY = Math.max(0, Math.min(newY, 100));
                    
                    // Snap to grid
                    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
                    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
                    
                    item.el.style.left = newX + '%';
                    item.el.style.top = newY + '%';
                    item.table.newX = newX;
                    item.table.newY = newY;
                }
            });
        };

        const endHandler = () => {
            isDragging = false;
            activeDragEl = null;
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('touchmove', moveHandler, {passive:false});
        window.addEventListener('mouseup', endHandler);
        window.addEventListener('touchend', endHandler);

        document.getElementById('btn-editor-cancel').addEventListener('click', () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('touchmove', moveHandler);
            window.removeEventListener('mouseup', endHandler);
            window.removeEventListener('touchend', endHandler);
            render();
        });
        
        document.getElementById('btn-editor-save').addEventListener('click', () => {
            globalState.tables.forEach(t => {
                if (t.newX !== undefined) { 
                    t.x = t.newX; 
                    t.y = t.newY; 
                    delete t.newX; 
                    delete t.newY;
                }
            });
            storage.saveState('tables', globalState.tables);
            app.showToast('Plano guardado');
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('touchmove', moveHandler);
            window.removeEventListener('mouseup', endHandler);
            window.removeEventListener('touchend', endHandler);
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
