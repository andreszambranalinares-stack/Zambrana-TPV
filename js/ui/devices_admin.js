import { deviceManager } from '../device.js';
import { showModal } from './common.js';

export function renderDevicesAdmin(container, app) {
    let currentTab = 'devices';

    const render = () => {
        container.innerHTML = `
            <div style="max-width:1200px; margin:0 auto;">
                <div style="display:flex; gap:1rem; border-bottom:1px solid var(--color-border); margin-bottom:1rem; overflow-x:auto;">
                    <button class="btn ${currentTab === 'devices' ? 'btn-primary' : 'btn-secondary'}" style="border:none; border-radius:0; border-bottom: ${currentTab === 'devices' ? '2px solid' : 'none'};" id="tab-devices">Dispositivos</button>
                    <button class="btn ${currentTab === 'cocina' ? 'btn-primary' : 'btn-secondary'}" style="border:none; border-radius:0; border-bottom: ${currentTab === 'cocina' ? '2px solid' : 'none'};" id="tab-cocina">Almacén Cocina</button>
                    <button class="btn ${currentTab === 'barra' ? 'btn-primary' : 'btn-secondary'}" style="border:none; border-radius:0; border-bottom: ${currentTab === 'barra' ? '2px solid' : 'none'};" id="tab-barra">Almacén Barra</button>
                    <button class="btn ${currentTab === 'log' ? 'btn-primary' : 'btn-secondary'}" style="border:none; border-radius:0; border-bottom: ${currentTab === 'log' ? '2px solid' : 'none'};" id="tab-log">Log Sincronización</button>
                </div>
                <div id="tab-content"></div>
            </div>
        `;

        document.getElementById('tab-devices').onclick = () => { currentTab = 'devices'; render(); };
        document.getElementById('tab-cocina').onclick = () => { currentTab = 'cocina'; render(); };
        document.getElementById('tab-barra').onclick = () => { currentTab = 'barra'; render(); };
        document.getElementById('tab-log').onclick = () => { currentTab = 'log'; render(); };

        const content = document.getElementById('tab-content');
        if (currentTab === 'devices') renderDevicesTab(content);
        else if (currentTab === 'cocina') renderQueueTab(content, 'cocina');
        else if (currentTab === 'barra') renderQueueTab(content, 'barra');
        else if (currentTab === 'log') renderLogTab(content);
    };

    const renderDevicesTab = (content) => {
        const devices = deviceManager.getDevices();
        const list = Object.values(devices);
        
        content.innerHTML = `
            <div style="display:flex; gap:1rem; margin-bottom:1rem;">
                <button class="btn btn-secondary" id="btn-sim-device">+ Simular nuevo dispositivo</button>
                <button class="btn btn-secondary" id="btn-gen-qr"><i class='bx bx-link'></i> Generar QR de enlace</button>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse: collapse; min-width:800px;">
                    <thead>
                        <tr style="text-align:left; border-bottom: 2px solid var(--color-border);">
                            <th style="padding:0.5rem;">Dispositivo</th>
                            <th style="padding:0.5rem;">Rol</th>
                            <th style="padding:0.5rem;">Empleado</th>
                            <th style="padding:0.5rem;">Estado</th>
                            <th style="padding:0.5rem;">Última Actividad</th>
                            <th style="padding:0.5rem;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map(d => {
                            const isMobile = d.device_type === 'mobile';
                            const isTablet = d.device_type === 'tablet';
                            const icon = isMobile ? '<i class="bx bx-mobile-alt"></i>' : isTablet ? '<i class="bx bx-mobile"></i>' : '<i class="bx bx-desktop"></i>';
                            const isActive = (Date.now() - d.last_seen) < 120000; // 2 mins
                            const timeAgo = formatRelativeTime(d.last_seen);
                            
                            return `
                                <tr style="border-bottom: 1px solid var(--color-border); ${d.device_id === deviceManager.deviceId ? 'background:var(--color-surface); font-weight:bold;' : ''}">
                                    <td style="padding:0.5rem;">${icon} ${d.device_name} ${d.device_id === deviceManager.deviceId ? '(Este)' : ''}</td>
                                    <td style="padding:0.5rem;">${d.assigned_role}</td>
                                    <td style="padding:0.5rem;">${d.assigned_employee || 'Ninguno'}</td>
                                    <td style="padding:0.5rem;">
                                        <span style="color:${isActive ? 'var(--color-free)' : 'var(--color-danger)'}; display:flex; align-items:center; gap:0.4rem;">
                                            <i class='bx bxs-circle' style="font-size:0.7rem;"></i> ${isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style="padding:0.5rem;">${timeAgo}</td>
                                    <td style="padding:0.5rem; display:flex; gap:0.5rem;">
                                        <button class="btn btn-secondary" style="padding:0.25rem 0.5rem;" onclick="window.editDevice('${d.device_id}')"><i class='bx bx-edit-alt'></i> Editar</button>
                                        <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; color:var(--color-danger); border-color:var(--color-danger);" onclick="window.deleteDevice('${d.device_id}')"><i class='bx bx-trash'></i></button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('btn-sim-device').onclick = () => {
            const num = Object.keys(devices).length + 1;
            const simId = `mobile-${Date.now()}-sim${num}`;
            devices[simId] = {
                device_id: simId,
                device_name: `Móvil-Carlos (Simulado)`,
                device_type: 'mobile',
                assigned_role: 'sin asignar',
                assigned_employee: null,
                last_seen: Date.now(),
                first_registered: Date.now(),
                is_active: true,
                browser: 'Chrome',
                os: 'Android'
            };
            deviceManager.saveDevices(devices);
            deviceManager.logSync('dispositivo_registrado');
            render();
        };

        document.getElementById('btn-gen-qr').onclick = () => {
            const randomCode = Math.random().toString(36).substring(2,8).toUpperCase();
            const html = `
                <div style="text-align:center; padding:1rem;">
                    <div id="qrcode-container" style="display:flex; justify-content:center; margin-bottom:1rem;"></div>
                    <p style="color:var(--color-text-muted);">Escanea este QR desde el dispositivo que quieras añadir</p>
                    <div style="margin-top:1rem; font-size:1.5rem; font-weight:bold; letter-spacing:3px;">${randomCode}</div>
                    <p style="color:var(--color-text-muted); font-size:0.8rem;">Código manual alternativo</p>
                </div>
            `;
            showModal('Vincular Dispositivo', html);
            
            // Load QR script if not present
            if (!window.QRCode) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
                script.onload = () => new QRCode(document.getElementById('qrcode-container'), window.location.href);
                document.head.appendChild(script);
            } else {
                new QRCode(document.getElementById('qrcode-container'), window.location.href);
            }
        };

        window.editDevice = (id) => {
            const devs = deviceManager.getDevices();
            const d = devs[id];
            if (!d) return;
            const html = `
                <div style="display:flex; flex-direction:column; gap:1rem;">
                    <label>Nombre del dispositivo:</label>
                    <input type="text" id="dev-name" value="${d.device_name}" style="padding:0.5rem;">
                    <label>Rol asignado:</label>
                    <select id="dev-role" style="padding:0.5rem;">
                        <option ${d.assigned_role==='sin asignar'?'selected':''}>sin asignar</option>
                        <option ${d.assigned_role==='camarero'?'selected':''}>camarero</option>
                        <option ${d.assigned_role==='cocinero'?'selected':''}>cocinero</option>
                        <option ${d.assigned_role==='barra'?'selected':''}>barra</option>
                    </select>
                    <button class="btn btn-primary" id="btn-save-dev">Guardar</button>
                </div>
            `;
            const mId = showModal('Editar Dispositivo', html);
            document.getElementById('btn-save-dev').onclick = () => {
                d.device_name = document.getElementById('dev-name').value;
                d.assigned_role = document.getElementById('dev-role').value;
                deviceManager.saveDevices(devs);
                document.getElementById('modals-container').innerHTML = '';
                render();
            };
        };

        window.deleteDevice = (id) => {
            if(confirm('¿Eliminar dispositivo del registro?')) {
                const devs = deviceManager.getDevices();
                delete devs[id];
                deviceManager.saveDevices(devs);
                render();
            }
        };
    };

    const renderQueueTab = (content, station) => {
        const qName = station === 'cocina' ? 'queue_cocina' : 'queue_barra';
        const aName = station === 'cocina' ? 'archive_cocina' : 'archive_barra';
        const pending = deviceManager.getQueue(qName);
        const archive = deviceManager.getQueue(aName);

        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h3 style="margin:0;">${pending.length} pendientes · ${archive.length} completadas hoy</h3>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-secondary" id="btn-export-q">Descargar JSON</button>
                    <button class="btn btn-secondary" style="color:var(--color-danger); border-color:var(--color-danger);" id="btn-clear-q">Limpiar archivo</button>
                </div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:2rem;">
                <div>
                    <h4 style="border-bottom:1px solid var(--color-border); padding-bottom:0.5rem;">Pendientes</h4>
                    <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
                        ${pending.map(o => `
                            <div class="widget" style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 1rem;">
                                <div>
                                    <strong>Mesa ${o.mesa_num}</strong> — ${o.camarero || 'Desconocido'} 
                                    <span style="font-size:0.8rem; color:var(--color-text-muted); font-family:monospace; margin-left:0.5rem;">[${o.device_id_origen}]</span>
                                    <br>
                                    <span style="font-size:0.9rem;">${new Date(o.timestamp_entrada).toLocaleTimeString()} · ${o.items.length} ítems</span>
                                    <span style="color:var(--color-danger); font-size:0.9rem; margin-left:0.5rem;">(${o.estado})</span>
                                </div>
                                <button class="btn btn-secondary" onclick="window.viewQueueItem('${o.comanda_id}', '${station}', 'pending')">Ver detalle</button>
                            </div>
                        `).join('')}
                        ${pending.length === 0 ? '<p>No hay comandas pendientes.</p>' : ''}
                    </div>
                </div>
                
                <div>
                    <h4 style="border-bottom:1px solid var(--color-border); padding-bottom:0.5rem;">Completadas (turno actual)</h4>
                    <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
                        ${archive.map(o => `
                            <div class="widget" style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 1rem; opacity:0.8;">
                                <div>
                                    <strong>Mesa ${o.mesa_num}</strong> — ${o.camarero || 'Desconocido'}
                                    <span style="font-size:0.8rem; color:var(--color-text-muted); font-family:monospace; margin-left:0.5rem;">[${o.device_id_origen}]</span>
                                    <br>
                                    <span style="font-size:0.9rem;">Entrada: ${new Date(o.timestamp_entrada).toLocaleTimeString()} | Fin: ${new Date(o.timestamp_completada).toLocaleTimeString()}</span>
                                    <span style="color:var(--color-free); font-size:0.9rem; margin-left:0.5rem;">(${o.estado})</span>
                                </div>
                                <button class="btn btn-secondary" onclick="window.viewQueueItem('${o.comanda_id}', '${station}', 'archive')">Ver detalle</button>
                            </div>
                        `).join('')}
                        ${archive.length === 0 ? '<p>No hay comandas completadas.</p>' : ''}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-export-q').onclick = () => {
            const data = { pending, archive };
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            a.download = `comandas-${station}-${dateStr}.json`;
            a.click();
        };

        document.getElementById('btn-clear-q').onclick = () => {
            if(confirm('¿Seguro que quieres limpiar el archivo? Las comandas completadas se borrarán.')) {
                if(confirm('¿ESTÁS TOTALMENTE SEGURO?')) {
                    deviceManager.saveQueue(aName, []);
                    render();
                }
            }
        };

        window.viewQueueItem = (id, st, type) => {
            const qN = st === 'cocina' ? 'queue_cocina' : 'queue_barra';
            const aN = st === 'cocina' ? 'archive_cocina' : 'archive_barra';
            const arr = type === 'pending' ? deviceManager.getQueue(qN) : deviceManager.getQueue(aN);
            const o = arr.find(x => x.comanda_id === id);
            if(!o) return;

            const html = `
                <div style="font-size:0.9rem;">
                    <p><strong>Comanda ID:</strong> ${o.comanda_id}</p>
                    <p><strong>Mesa:</strong> ${o.mesa_num} (${o.num_comensales} pax)</p>
                    <p><strong>Notas de mesa:</strong> ${o.notas_mesa || 'Ninguna'}</p>
                    <hr style="margin:1rem 0;">
                    ${o.items.map(i => `
                        <div style="margin-bottom:0.5rem;">
                            <strong>${i.qty}x ${i.name}</strong>
                            ${i.modifiers && i.modifiers.length ? `<br><small style="color:var(--color-primary);">+ ${i.modifiers.join(', ')}</small>` : ''}
                            ${i.removedIngredients && i.removedIngredients.length ? `<br><small style="color:var(--color-danger);">- ${i.removedIngredients.join(', ')}</small>` : ''}
                            ${i.note ? `<br><small><i class='bx bx-note'></i> ${i.note}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            showModal('Detalle Comanda', html);
        };
    };

    const renderLogTab = (content) => {
        const logs = JSON.parse(localStorage.getItem('ztpv_sync_log') || '[]').reverse();
        content.innerHTML = `
            <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
                <button class="btn btn-secondary" id="btn-export-log">Exportar log</button>
            </div>
            <div style="background:var(--color-surface); padding:1rem; border-radius:8px; font-family:monospace; font-size:0.85rem; max-height:60vh; overflow-y:auto;">
                ${logs.map(l => `
                    <div style="border-bottom:1px solid var(--color-border); padding:0.5rem 0;">
                        <span style="color:var(--color-text-muted);">[${new Date(l.timestamp).toLocaleString()}]</span> 
                        <strong style="color:var(--color-primary);">${l.event_type}</strong> 
                        <span>(Device: ${l.device_id})</span>
                    </div>
                `).join('')}
                ${logs.length === 0 ? 'No hay eventos.' : ''}
            </div>
        `;

        document.getElementById('btn-export-log').onclick = () => {
            const text = logs.map(l => `[${new Date(l.timestamp).toLocaleString()}] ${l.event_type} - ${l.device_id}`).join('\n');
            const blob = new Blob([text], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sync_log_${Date.now()}.txt`;
            a.click();
        };
    };

    function formatRelativeTime(ts) {
        const diff = Math.floor((Date.now() - ts) / 1000);
        if (diff < 60) return `hace ${diff} seg`;
        if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
        if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
        return `hace ${Math.floor(diff/86400)} d`;
    }

    render();
}
