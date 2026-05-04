import { storage } from './storage.js';
import { defaultMenu } from './data.js';
import { deviceManager } from './device.js';

class State {
    constructor() {
        this.tables = this.loadInitialTables();
        this.orders = this.loadInitialOrders();
        this.config = this.loadInitialConfig();
        this.menu = this.loadInitialMenu();
        this.employees = this.loadInitialEmployees();
        this.shift = this.loadInitialShift();
        this.isKitchenPaused = false;
        this.listeners = [];

        storage.subscribe((message) => {
            if (message.type === 'STATE_UPDATE') {
                this[message.key] = message.state;
                this.notifyListeners(message.key);
            }
        });
    }

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
        return storage.loadState('orders') || [];
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
        const stored = storage.loadState('employees');
        if (stored && stored.length > 0) return stored;
        return [
            { id: 'admin', name: 'Administrador', alias: 'Admin', role: 'Camarero', color: '#10B981', pin: '1234', active: true, favCategory: '⭐', isAdmin: true }
        ];
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
        return storage.loadState('menu') || defaultMenu;
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
            storage.saveState('employees', this.employees);
            this.notifyListeners('employees');
        } else {
            storage.saveState('employees', this.employees);
            this.notifyListeners('employees');
        }
    }

    deleteEmployee(id) {
        this.employees = this.employees.filter(e => e.id !== id);
        storage.saveState('employees', this.employees);
        this.notifyListeners('employees');
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
            deviceManager.addOrderToQueue('barra', newOrderB.id, orderData, barItems);
        }
        
        storage.saveState('orders', this.orders);
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
            storage.saveState('orders', this.orders);
            this.notifyListeners('orders');
        }
    }

    updateOrderItemReady(orderId, itemIndex, isReady) {
        const order = this.orders.find(o => o.id === orderId);
        if (order && order.items[itemIndex]) {
            order.items[itemIndex].isReady = isReady;
            storage.saveState('orders', this.orders);
            this.notifyListeners('orders');
        }
    }

    splitOrderToReady(orderId, readyItemIndices) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order || readyItemIndices.length === 0) return;

        if (readyItemIndices.length === order.items.length) {
            order.items.forEach(i => i.isReady = true);
            this.updateOrderStatus(orderId, 'listo');
            // updateOrderStatus already handles deviceManager marking
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
        
        storage.saveState('orders', this.orders);
        this.notifyListeners('orders');
    }

    closeTable(tableId) {
        this.updateTable(tableId, { status: 'cerrada', guests: 0, name: '', openedAt: null });
        this.orders.forEach(o => {
            if (o.tableId === tableId && o.status !== 'pagado') o.status = 'pagado';
        });
        storage.saveState('orders', this.orders);
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
        this.orders = [];
        this.shiftStartTime = Date.now();
        storage.saveState('tables', this.tables);
        storage.saveState('orders', this.orders);
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
