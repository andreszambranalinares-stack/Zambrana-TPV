import { storage } from './storage.js';
import { ivaBreakdown, formatInvoiceNumber } from './fiscal.js';

const BUSINESS_DEFAULTS = {
    name: 'Zambrana',
    legalName: '',
    cif: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    footer: '¡Gracias por su visita!',
    showLogo: true,
    ivaRate: 10
};

const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const tickets = {
    getAllTickets() {
        return storage.loadState('tickets_turno') || [];
    },

    saveTicket(ticketObj) {
        const list = this.getAllTickets();
        list.push(ticketObj);
        storage.saveState('tickets_turno', list);
    },

    clearTickets() {
        storage.saveState('tickets_turno', []);
    },

    // Datos del negocio (con valores por defecto si aún no se han rellenado).
    getBusiness() {
        return { ...BUSINESS_DEFAULTS, ...(storage.loadState('business') || {}) };
    },

    // Cabecera del ticket: logo + nombre. Con `full` añade los datos fiscales
    // (CIF, dirección, teléfono…) que solo tienen sentido en el ticket de cobro.
    buildHeader(title, full) {
        const b = this.getBusiness();
        const logo = b.showLogo
            ? `<img class="ticket-logo" src="logo.png" alt="">`
            : '';
        let fiscal = '';
        if (full) {
            const lines = [];
            if (b.legalName) lines.push(esc(b.legalName));
            if (b.cif) lines.push('CIF/NIF: ' + esc(b.cif));
            if (b.address) lines.push(esc(b.address));
            if (b.city) lines.push(esc(b.city));
            if (b.phone) lines.push('Tel: ' + esc(b.phone));
            if (b.email) lines.push(esc(b.email));
            if (lines.length) fiscal = `<div class="ticket-fiscal">${lines.join('<br>')}</div>`;
        }
        return `
            <div class="print-header" style="text-align:center;">
                ${logo}
                <div class="ticket-biz-name">${esc(b.name)}</div>
                ${fiscal}
                ================================<br>
                ${esc(title)}<br>
                ================================
            </div>
        `;
    },

    buildFooter() {
        const b = this.getBusiness();
        return `
            <div class="print-footer" style="text-align:center;">
                ================================<br>
                ${esc(b.footer)}<br>
                ${b.name ? esc(b.name) + '<br>' : ''}
                ================================
            </div>
        `;
    },

    printComanda(orderData, isAdditional) {
        let itemsHtmlK = '', itemsHtmlB = '';
        orderData.items.forEach(i => {
            const note = i.note ? `<br>     > ${esc(i.note)}` : '';
            const line = `  ${i.qty}x ${esc(i.name)}${note}`;
            if (i.dest === 'cocina') itemsHtmlK += line + '<br>';
            else itemsHtmlB += line + '<br>';
        });

        let ticketBody = '';
        if (itemsHtmlK) {
            ticketBody += `--------------------------------<br>COCINA:<br>${itemsHtmlK}`;
        }
        if (itemsHtmlB) {
            ticketBody += `--------------------------------<br>BARRA:<br>${itemsHtmlB}`;
        }

        const date = new Date(orderData.timestamp);
        const dateStr = date.toLocaleDateString('es-ES');
        const timeStr = date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit', second: '2-digit'});

        // Comanda interna de cocina/barra: cabecera ligera (logo + nombre, sin fiscal).
        const html = `
            <div id="print-area">
                ${this.buildHeader('Ticket de comanda', false)}
                <div style="text-align:left;">
                    Mesa: ${esc(orderData.tableId)}         Comensales: ${esc(orderData.guests)}<br>
                    Camarero: ${esc(orderData.waiterName || 'Desconocido')}<br>
                    Hora: ${timeStr}    Fecha: ${dateStr}<br>
                    ${ticketBody}
                    --------------------------------<br>
                    ADICIONAL: ${isAdditional ? 'Sí' : 'No'}<br>
                    ================================
                </div>
            </div>
        `;

        this.saveTicket({
            id: 'T' + Date.now(),
            type: 'comanda',
            tableId: orderData.tableId,
            waiter: orderData.waiterName,
            timestamp: orderData.timestamp,
            htmlContent: html
        });

        this.doPrint(html);
    },

    // Comanda de UNA estación (cocina o barra). El `order` ya viene filtrado por
    // `globalState.createOrders` con solo los ítems de su estación, así que aquí no
    // se vuelve a separar. Se usa tanto para la impresión automática como para la
    // reimpresión manual desde la pantalla de Cocina/Barra.
    printStationComanda(order) {
        const station = order.dest === 'barra' ? 'BARRA' : 'COCINA';

        let itemsHtml = '';
        (order.items || []).forEach(i => {
            const note = i.note ? `<br>     > ${esc(i.note)}` : '';
            itemsHtml += `  ${i.qty}x ${esc(i.name)}${note}<br>`;
        });

        const date = new Date(order.timestamp);
        const dateStr = date.toLocaleDateString('es-ES');
        const timeStr = date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit', second: '2-digit'});

        const html = `
            <div id="print-area">
                ${this.buildHeader('COMANDA ' + station, false)}
                <div style="text-align:left;">
                    Mesa: ${esc(order.tableId)}         Comensales: ${esc(order.guests)}<br>
                    Camarero: ${esc(order.waiterName || 'Desconocido')}<br>
                    Hora: ${timeStr}    Fecha: ${dateStr}<br>
                    --------------------------------<br>
                    ${itemsHtml}--------------------------------<br>
                    ${order.isAdditional ? 'ADICIONAL<br>' : ''}================================
                </div>
            </div>
        `;

        this.saveTicket({
            id: 'T' + Date.now(),
            type: 'comanda',
            station: order.dest,
            orderId: order.id,
            tableId: order.tableId,
            waiter: order.waiterName,
            timestamp: order.timestamp,
            htmlContent: html
        });

        this.doPrint(html);
    },

    async printCobro(table, orders, grandTotal, method, opts = {}) {
        const date = new Date();
        const dateStr = date.toLocaleDateString('es-ES');
        const timeStr = date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit', second: '2-digit'});

        // Número de factura (secuencial online; provisional offline). En modo
        // previsualización NO se consume un número real.
        let invNo = 'DEMO', provisional = false;
        if (!opts.preview) {
            try {
                const inv = await storage.getInvoiceNumber();
                provisional = inv.provisional;
                invNo = provisional
                    ? `PROV-${inv.deviceTag}-${inv.seq}`
                    : formatInvoiceNumber(inv.seq, date);
            } catch (e) { invNo = 'S/N'; }
        }

        let itemsHtml = '';
        const allItems = [];
        orders.forEach(o => {
            o.items.forEach(i => {
                allItems.push(i);
                const name = esc(i.name.substring(0, 18).padEnd(18, ' '));
                const price = (i.price * i.qty).toFixed(2).padStart(6, ' ');
                itemsHtml += `  ${i.qty}x ${name} ${price}€<br>`;
            });
        });

        // Proyección compacta de líneas para los informes (producto / categoría).
        const lines = allItems.map(i => ({
            name: i.name, qty: i.qty, price: i.price,
            category: i.category || 'Otros',
            ivaRate: Number.isFinite(Number(i.ivaRate)) ? Number(i.ivaRate) : 10
        }));

        // Desglose de IVA por tipo (base + cuota). El precio ya lleva el IVA incluido.
        const fiscal = ivaBreakdown(allItems);
        const pad = (s) => String(s).padStart(8, ' ');
        let ivaRows = '';
        fiscal.rows.forEach(r => {
            ivaRows += `  Base ${String(r.rate).padStart(2, ' ')}%: ${pad(r.base.toFixed(2))} €<br>`;
            ivaRows += `  IVA  ${String(r.rate).padStart(2, ' ')}%: ${pad(r.cuota.toFixed(2))} €<br>`;
        });

        // Ticket de cobro (factura simplificada): cabecera fiscal + nº + desglose IVA + pie.
        const html = `
            <div id="print-area">
                ${this.buildHeader('FACTURA SIMPLIFICADA', true)}
                <div style="text-align:left;">
                    Nº: ${esc(invNo)}${provisional ? ' (provisional)' : ''}<br>
                    Mesa: ${esc(table.id)}         Camarero: ${esc(orders[0]?.waiterName || 'Desconocido')}<br>
                    Fecha: ${dateStr}    Hora: ${timeStr}<br>
                    --------------------------------<br>
                    ${itemsHtml}
                    --------------------------------<br>
                    ${ivaRows}--------------------------------<br>
                    TOTAL:               ${pad(fiscal.total.toFixed(2))} €<br>
                    --------------------------------<br>
                    MÉTODO DE PAGO: ${esc(method.toUpperCase())}<br>
                </div>
                ${this.buildFooter()}
            </div>
        `;

        if (!opts.preview) {
            this.saveTicket({
                id: 'C' + Date.now(),
                type: 'cobro',
                invoiceNumber: invNo,
                provisional,
                tableId: table.id,
                waiter: orders[0]?.waiterName,
                method,
                timestamp: Date.now(),
                total: grandTotal,
                iva: fiscal,
                lines,
                htmlContent: html
            });
        }

        this.doPrint(html);
    },

    doPrint(html) {
        const oldPrint = document.getElementById('print-area');
        if (oldPrint) oldPrint.remove();
        document.body.insertAdjacentHTML('beforeend', html);

        const area = document.getElementById('print-area');
        const finish = () => {
            window.print();
            const p = document.getElementById('print-area');
            if (p) p.remove();
        };

        // Espera a que el logo (y cualquier imagen) cargue antes de imprimir, para
        // que no salga el ticket sin logo la primera vez.
        const imgs = area ? Array.from(area.querySelectorAll('img')) : [];
        const pending = imgs.filter(im => !im.complete || im.naturalWidth === 0);
        if (pending.length === 0) { finish(); return; }

        let remaining = pending.length;
        let printed = false;
        const settle = () => { if (!printed && --remaining <= 0) { printed = true; finish(); } };
        pending.forEach(im => {
            im.addEventListener('load', settle);
            im.addEventListener('error', settle);
        });
        // Red de seguridad: imprime igualmente si alguna imagen tarda demasiado.
        setTimeout(() => { if (!printed) { printed = true; finish(); } }, 1500);
    }
};
