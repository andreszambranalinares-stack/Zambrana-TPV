import { storage } from './storage.js';
import { defaultMenu } from './data.js';
import { deviceManager } from './device.js';
import { makeHash, verifyHash } from './crypto.js';
import { defaultIvaForItem } from './fiscal.js';
import { applyOrderUpdate } from './orders.js';

// Empleado: campos PÚBLICOS (sincronizan anónimos, los necesita el login rápido)
// vs. PRIVADOS (datos personales, van en `employees_private` protegido por RLS).
const EMP_PUBLIC_FIELDS = ['id', 'alias', 'role', 'color', 'active', 'isAdmin', 'favCategory', 'pin', 'pinHash'];
const EMP_PRIVATE_FIELDS = ['name', 'dni', 'phone', 'rate', 'hireDate'];
const pick = (obj, keys) => {
    const o = {};
    keys.forEach(k => { if (obj[k] !== undefined) o[k] = obj[k]; });
    return o;
};

class State {
    constructor() {
        this.tables = this.loadInitialTables();
        this.orders = this.loadInitialOrders();
        this.config = this.loadInitialConfig();
        this.menu = this.loadInitialMenu();
        this.employees = this.loadInitialEmployees();
        this.payments = this.loadInitialPayments();
        this.business = this.loadInitialBusiness();
        this.shift = this.loadInitialShift();
        this.isKitchenPaused = false;
        this.listeners = [];

        storage.subscribe((message) => {
            if (message.type === 'STATE_UPDATE') {
                // Comandas: una fila por comanda (clave 'order_<id>'). Se fusionan en
                // el array en memoria sin pisar las del resto de dispositivos.
                if (typeof message.key === 'string' && message.key.startsWith('order_')) {
                    this.applyOrderUpdate(message.key.slice('order_'.length), message.state, message.deleted);
                    this.notifyListeners('orders');
                    return;
                }
                // Empleados: parte pública (anónima) + parte privada (DNI/teléfono/
                // tarifa, protegida). Se fusionan en memoria para la UI.
                if (message.key === 'employees') {
                    const priv = this._privateById || {};
                    this.employees = (message.state || []).map(e => ({ ...e, ...(priv[e.id] || {}) }));
                    this.notifyListeners('employees');
                    return;
                }
                if (message.key === 'employees_private') {
                    this._privateById = message.state || {};
                    this.employees = (this.employees || []).map(e => ({ ...e, ...(this._privateById[e.id] || {}) }));
                    this.notifyListeners('employees');
                    return;
                }
                this[message.key] = message.state;
                this.notifyListeners(message.key);
            }
        });
    }

    // Inserta/actualiza/elimina una comanda concreta en el array en memoria
    // (delegado en la función pura de orders.js, que está cubierta por tests).
    applyOrderUpdate(id, order, deleted) {
        applyOrderUpdate(this.orders, id, order, deleted);
    }

    // Guarda una comanda como su propia fila; elimina su fila.
    saveOrder(order) { storage.saveState('order_' + order.id, order); }
    removeOrder(id) { storage.removeState('order_' + id); }

    loadInitialTables() {
        let stored = storage.loadState('tables');
        const numTables = storage.loadState('config')?.numTables || 12;

        if (stored && Array.isArray(stored)) {
            // Sanitize in case of corrupted array with nulls/undefined
            stored = stored.filter(t => t && t.id);
            if (stored.length < numTables) {
                for (let i = stored.length + 1; i <= numTables; i++) {
                    if (!stored.find(t => t.id === i)) {
                        stored.push({ id: i, status: 'libre', guests: 0, name: '', openedAt: null });
                    }
                }
            } else if (stored.length > numTables) {
                stored.length = numTables;
            }
            return stored;
        }
        
        return this.generateTables(numTables);
    }

    generateTables(num) {
        const tables = [];
        for (let i = 1; i <= num; i++) {
            tables.push({
                id: i, status: 'libre', guests: 0, name: '', openedAt: null, zone: 'Salón'
            });
        }
        return tables;
    }

    loadInitialOrders() {
        // Nuevo modelo: una fila por comanda ('order_<id>').
        const orderKeys = storage.getAllKeys().filter(k => k.startsWith('order_'));
        if (orderKeys.length > 0) {
            const arr = [];
            orderKeys.forEach(k => { const o = storage.loadState(k); if (o) arr.push(o); });
            return arr.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        }
        // Migración del modelo antiguo (todas las comandas en un único array 'orders').
        const legacy = storage.loadState('orders');
        if (legacy && Array.isArray(legacy) && legacy.length) {
            legacy.forEach(o => { if (o && o.id) storage.saveState('order_' + o.id, o); });
            storage.removeState('orders');
            return legacy;
        }
        return [];
    }

    loadInitialConfig() {
        const conf = storage.loadState('config') || {};
        return {
            numTables: 12, alertWarning: 15, alertDanger: 25,
            barAlertWarning: 5, barAlertDanger: 10, theme: 'light', soundEnabled: true,
            ...conf
        };
    }

    loadInitialEmployees() {
        // Datos personales (DNI/teléfono/tarifa) en clave aparte protegida por RLS.
        const priv = storage.loadState('employees_private') || {};
        this._privateById = priv;
        const stored = storage.loadState('employees');
        const base = (stored && stored.length > 0) ? stored : [
            { id: 'admin', name: 'Administrador', alias: 'Admin', role: 'Camarero', color: '#10B981', pin: '1234', active: true, favCategory: '⭐', isAdmin: true, dni: '', phone: '', hireDate: '', rate: 0 }
        ];
        // Fusión pública + privada para que la UI vea el empleado completo.
        return base.map(e => ({ ...e, ...(priv[e.id] || {}) }));
    }

    // Persiste empleados separando la parte pública (anónima) de la privada (DNI,
    // teléfono, tarifa), que se cierra con la cuenta segura (RLS como `payments`).
    _persistEmployees() {
        const pub = this.employees.map(e => pick(e, EMP_PUBLIC_FIELDS));
        const priv = {};
        this.employees.forEach(e => { priv[e.id] = pick(e, EMP_PRIVATE_FIELDS); });
        this._privateById = priv;
        storage.saveState('employees', pub);
        storage.saveState('employees_private', priv);
    }

    loadInitialPayments() {
        return storage.loadState('payments') || [];
    }

    // Datos del negocio que salen impresos en el ticket (logo + fiscales).
    loadInitialBusiness() {
        const stored = storage.loadState('business') || {};
        return {
            name: 'Zambrana',
            legalName: '',
            cif: '',
            address: '',
            city: '',
            phone: '',
            email: '',
            footer: '¡Gracias por su visita!',
            showLogo: true,
            ivaRate: 10,
            ...stored
        };
    }

    updateBusiness(data) {
        this.business = { ...this.business, ...data };
        storage.saveState('business', this.business);
        this.notifyListeners('business');
    }

    loadInitialShift() {
        return storage.loadState('shift') || {
            isOpen: false,
            startTime: null,
            activeEmployees: [], // array of employee IDs
            logs: []
        };
    }

    loadInitialMenu() {
        const menu = storage.loadState('menu') || defaultMenu;
        // Migración de IVA: a los productos sin `ivaRate` se les asigna el tipo por
        // defecto (10% hostelería, 21% bebida alcohólica). Editable luego en la carta.
        return menu.map(m => ({
            ...m,
            ivaRate: Number.isFinite(Number(m.ivaRate)) ? Number(m.ivaRate) : defaultIvaForItem(m)
        }));
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(key = null) {
        this.listeners.forEach(cb => cb(this, key));
    }

    logAction(action) {
        this.shift.logs.push({ time: Date.now(), action });
        storage.saveState('shift', this.shift);
    }

    logMenuChange(productName, action, oldVal, newVal) {
        const history = storage.loadState('menuHistory') || [];
        history.unshift({
            time: Date.now(),
            product: productName,
            action, oldVal, newVal
        });
        if (history.length > 50) history.pop();
        storage.saveState('menuHistory', history);
    }

    // Actions
    updateConfig(newConfig) {
        const oldNumTables = this.config.numTables || this.tables.length;
        this.config = { ...this.config, ...newConfig };
        storage.saveState('config', this.config);
        
        // Handle dynamic table resizing
        if (newConfig.numTables && newConfig.numTables !== oldNumTables) {
            let currentTables = [...this.tables].filter(t => t && t.id); // Sanitize
            if (newConfig.numTables > oldNumTables) {
                for (let i = oldNumTables + 1; i <= newConfig.numTables; i++) {
                    currentTables.push({ id: i, status: 'libre', guests: 0, name: '', openedAt: null });
                }
            } else {
                currentTables = currentTables.slice(0, newConfig.numTables);
            }
            this.tables = currentTables;
            storage.saveState('tables', this.tables);
        }
        
        this.notifyListeners('config');
    }

    updateMenu(newMenu) {
        this.menu = newMenu;
        storage.saveState('menu', this.menu);
        this.notifyListeners('menu');
    }

    updateTable(tableId, data) {
        const index = this.tables.findIndex(t => t.id === tableId);
        if (index > -1) {
            this.tables[index] = { ...this.tables[index], ...data };
            storage.saveState('tables', this.tables);
            this.notifyListeners('tables');
        }
    }

    updateEmployee(id, data) {
        const index = this.employees.findIndex(e => e.id === id);
        if (index > -1) {
            this.employees[index] = { ...this.employees[index], ...data };
        } else {
            this.employees.push({ ...data });
        }
        this._persistEmployees();
        this.notifyListeners('employees');
    }

    deleteEmployee(id) {
        this.employees = this.employees.filter(e => e.id !== id);
        this._persistEmployees();
        this.notifyListeners('employees');
    }

    // ── PIN cifrado ────────────────────────────────────────────────────────────
    // Verifica el PIN de un empleado contra su hash. Si el empleado aún tiene el
    // PIN en texto plano (datos antiguos), lo acepta una vez y lo migra a hash.
    async verifyEmployeePin(emp, pin) {
        if (!emp) return false;
        if (emp.pinHash) return await verifyHash(pin, emp.pinHash);
        if (emp.pin != null && String(emp.pin) === String(pin)) {
            emp.pinHash = await makeHash(pin);
            delete emp.pin;
            this.updateEmployee(emp.id, emp);
            return true;
        }
        return false;
    }

    // Busca en una lista el primer empleado cuyo PIN coincide (async por el hash).
    async findEmployeeByPin(emps, pin) {
        for (const emp of (emps || [])) {
            if (await this.verifyEmployeePin(emp, pin)) return emp;
        }
        return null;
    }

    // Asigna un PIN nuevo cifrado a un objeto empleado (no guarda; lo hace el caller).
    async setEmployeePin(emp, pin) {
        emp.pinHash = await makeHash(pin);
        delete emp.pin;
        return emp;
    }

    // ── Pagos a empleados (nómina / adelantos / propinas) ──────────────────────
    addPayment(payment) {
        if (!Array.isArray(this.payments)) this.payments = [];
        this.payments.unshift(payment);
        storage.saveState('payments', this.payments);
        this.notifyListeners('payments');
    }

    deletePayment(id) {
        this.payments = (this.payments || []).filter(p => p.id !== id);
        storage.saveState('payments', this.payments);
        this.notifyListeners('payments');
    }

    getPaymentsByEmployee(employeeId) {
        return (this.payments || []).filter(p => p.employeeId === employeeId);
    }

    getEmployeeTotalPaid(employeeId) {
        return this.getPaymentsByEmployee(employeeId).reduce((s, p) => s + (p.amount || 0), 0);
    }

    createOrders(kitchenItems, barItems, orderData) {
        const timestamp = Date.now();
        if (kitchenItems.length > 0) {
            const newOrderK = {
                id: 'k' + timestamp, tableId: orderData.tableId, guests: orderData.guests,
                timestamp, isAdditional: orderData.isAdditional, dest: 'cocina',
                waiterName: orderData.waiterName,
                status: 'en_cocina', items: kitchenItems.map(item => ({...item, isReady: false}))
            };
            this.orders.push(newOrderK);
            this.saveOrder(newOrderK);
            deviceManager.addOrderToQueue('cocina', newOrderK.id, orderData, kitchenItems);
        }
        if (barItems.length > 0) {
            const newOrderB = {
                id: 'b' + timestamp, tableId: orderData.tableId, guests: orderData.guests,
                timestamp, isAdditional: orderData.isAdditional, dest: 'barra',
                waiterName: orderData.waiterName,
                status: 'en_barra', items: barItems.map(item => ({...item, isReady: false}))
            };
            this.orders.push(newOrderB);
            this.saveOrder(newOrderB);
            deviceManager.addOrderToQueue('barra', newOrderB.id, orderData, barItems);
        }

        this.updateTable(orderData.tableId, { status: 'enviada' });
        this.notifyListeners('orders');
        
        // Notify new order for sound
        storage.channel.postMessage({ type: 'NEW_ORDER' });
    }

    updateOrderStatus(orderId, status) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            if (status === 'listo' || status === 'servido') {
                order.readyAt = Date.now();
                if (status === 'listo') {
                    // Mark in device manager
                    deviceManager.markOrderReady(order.dest, order.id);
                }
            }
            this.saveOrder(order);
            this.notifyListeners('orders');
        }
    }

    updateOrderItemReady(orderId, itemIndex, isReady) {
        const order = this.orders.find(o => o.id === orderId);
        if (order && order.items[itemIndex]) {
            order.items[itemIndex].isReady = isReady;
            this.saveOrder(order);
            this.notifyListeners('orders');
        }
    }

    splitOrderToReady(orderId, readyItemIndices) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order || readyItemIndices.length === 0) return;

        if (readyItemIndices.length === order.items.length) {
            order.items.forEach(i => i.isReady = true);
            this.updateOrderStatus(orderId, 'listo');
            // updateOrderStatus already handles deviceManager marking + save
            return;
        }

        const readyItems = readyItemIndices.map(idx => ({...order.items[idx], isReady: true}));
        const pendingItems = order.items.filter((_, idx) => !readyItemIndices.includes(idx));

        const newOrder = {
            ...order,
            id: order.id + '_' + Date.now().toString().slice(-4),
            items: readyItems,
            status: 'listo',
            readyAt: Date.now()
        };

        order.items = pendingItems;
        this.orders.push(newOrder);

        this.saveOrder(order);
        this.saveOrder(newOrder);
        this.notifyListeners('orders');
    }

    closeTable(tableId) {
        this.updateTable(tableId, { status: 'cerrada', guests: 0, name: '', openedAt: null });
        this.orders.forEach(o => {
            if (o.tableId === tableId && o.status !== 'pagado') {
                o.status = 'pagado';
                this.saveOrder(o);
            }
        });
        this.notifyListeners('orders');
    }

    resetShift() {
        this.tables = this.tables.map(t => ({
            ...t,
            status: 'libre',
            guests: 0,
            name: '',
            openedAt: null
        }));
        // Elimina cada comanda (su propia fila) en local y en la nube.
        const prevOrders = this.orders;
        this.orders = [];
        prevOrders.forEach(o => { if (o && o.id) this.removeOrder(o.id); });
        this.shiftStartTime = Date.now();
        storage.saveState('tables', this.tables);
        storage.saveState('shiftStart', this.shiftStartTime);
        this.notifyListeners('reset');
    }

    setKitchenPaused(paused) {
        this.isKitchenPaused = paused;
        storage.saveState('kitchenPaused', paused);
        this.notifyListeners('kitchenPaused');
    }
}

export const globalState = new State();
