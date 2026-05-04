export const deviceManager = {
    deviceId: null,
    
    init() {
        this.deviceId = localStorage.getItem('ztpv_current_device_id');
        if (!this.deviceId) {
            const type = this.detectDeviceType();
            const ts = Date.now();
            const rand = Math.random().toString(36).substring(2, 6);
            this.deviceId = `${type}-${ts}-${rand}`;
            localStorage.setItem('ztpv_current_device_id', this.deviceId);
        }
        
        this.registerDevice();
        
        // ping every 30s
        setInterval(() => this.updateLastSeen(), 30000);
        
        // Listener for new devices notification
        window.addEventListener('storage', (e) => {
            if (e.key === 'ztpv_devices_event' && sessionStorage.getItem('admin_session') === 'true') {
                try {
                    const data = JSON.parse(e.newValue);
                    if (data && data.type === 'new_device') {
                        if (window.app) window.app.showToast(`📱 Nuevo dispositivo registrado — ${data.name}`);
                    }
                } catch(err) {}
            }
        });
    },

    detectDeviceType() {
        const ua = navigator.userAgent;
        if (/Tablet|iPad/i.test(ua)) return 'tablet';
        if (/Mobile|Android|iP(hone|od)/i.test(ua)) return 'mobile';
        return 'desktop';
    },
    
    getBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes("Chrome")) return "Chrome";
        if (ua.includes("Safari")) return "Safari";
        if (ua.includes("Firefox")) return "Firefox";
        return "Desconocido";
    },
    
    getOS() {
        const ua = navigator.userAgent;
        if (ua.includes("Windows")) return "Windows";
        if (ua.includes("Mac OS")) return "macOS";
        if (ua.includes("Linux")) return "Linux";
        if (ua.includes("Android")) return "Android";
        if (ua.includes("iOS")) return "iOS";
        return "Desconocido";
    },

    getDevices() {
        return JSON.parse(localStorage.getItem('ztpv_devices') || '{}');
    },

    saveDevices(devices) {
        localStorage.setItem('ztpv_devices', JSON.stringify(devices));
    },

    registerDevice() {
        const devices = this.getDevices();
        const type = this.detectDeviceType();
        let isNew = false;
        if (!devices[this.deviceId]) {
            isNew = true;
            devices[this.deviceId] = {
                device_id: this.deviceId,
                device_name: `Dispositivo ${type} ${Object.keys(devices).length + 1}`,
                device_type: type,
                assigned_role: 'sin asignar',
                assigned_employee: null,
                last_seen: Date.now(),
                first_registered: Date.now(),
                is_active: true,
                browser: this.getBrowser(),
                os: this.getOS()
            };
        } else {
            devices[this.deviceId].last_seen = Date.now();
            devices[this.deviceId].is_active = true;
        }
        this.saveDevices(devices);
        
        if (isNew) {
            localStorage.setItem('ztpv_devices_event', JSON.stringify({
                type: 'new_device',
                name: devices[this.deviceId].device_name,
                ts: Date.now()
            }));
            this.logSync('dispositivo_registrado');
        }
    },

    updateLastSeen() {
        const devices = this.getDevices();
        if (devices[this.deviceId]) {
            devices[this.deviceId].last_seen = Date.now();
            devices[this.deviceId].is_active = true;
            this.saveDevices(devices);
        }
    },

    linkEmployee(employeeName) {
        const devices = this.getDevices();
        if (devices[this.deviceId]) {
            devices[this.deviceId].assigned_employee = employeeName;
            this.saveDevices(devices);
            this.logSync('empleado_identificado');
        }
    },

    // Queues
    getQueue(name) {
        return JSON.parse(localStorage.getItem(`ztpv_${name}`) || '[]');
    },
    
    saveQueue(name, data) {
        localStorage.setItem(`ztpv_${name}`, JSON.stringify(data));
    },

    addOrderToQueue(station, orderId, orderData, items) {
        const qName = station === 'cocina' ? 'queue_cocina' : 'queue_barra';
        const q = this.getQueue(qName);
        const order = {
            comanda_id: orderId,
            mesa_num: orderData.tableId,
            num_comensales: orderData.guests,
            camarero: orderData.waiterName,
            device_id_origen: this.deviceId,
            timestamp_entrada: Date.now(),
            timestamp_completada: null,
            items: items,
            notas_mesa: orderData.notes || '',
            estado: 'pendiente',
            curso_breakdown: this.breakdownItems(items)
        };
        q.push(order);
        this.saveQueue(qName, q);
        this.logSync('nueva_comanda');
    },

    breakdownItems(items) {
        const breakdown = { entrantes: [], primeros: [], segundos: [], postres: [], bebidas: [], otros: [] };
        items.forEach(item => {
            const course = item.course || 'otros';
            if (breakdown[course]) breakdown[course].push(item);
            else breakdown.otros.push(item);
        });
        return breakdown;
    },

    markOrderReady(station, comandaId) {
        const qName = station === 'cocina' ? 'queue_cocina' : 'queue_barra';
        const aName = station === 'cocina' ? 'archive_cocina' : 'archive_barra';
        const q = this.getQueue(qName);
        const a = this.getQueue(aName);
        
        const idx = q.findIndex(o => o.comanda_id === comandaId);
        if (idx !== -1) {
            const order = q.splice(idx, 1)[0];
            order.estado = 'lista';
            order.timestamp_completada = Date.now();
            a.push(order);
            this.saveQueue(qName, q);
            this.saveQueue(aName, a);
            this.logSync('comanda_lista');
        }
    },

    logSync(eventType) {
        const logs = JSON.parse(localStorage.getItem('ztpv_sync_log') || '[]');
        logs.push({
            timestamp: Date.now(),
            event_type: eventType,
            device_id: this.deviceId
        });
        if (logs.length > 100) logs.shift();
        localStorage.setItem('ztpv_sync_log', JSON.stringify(logs));
    }
};
