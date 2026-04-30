import { storage } from './storage.js';

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

    printComanda(orderData, isAdditional) {
        let itemsHtmlK = '', itemsHtmlB = '';
        orderData.items.forEach(i => {
            const note = i.note ? `<br>     > ${i.note}` : '';
            const line = `  ${i.qty}x ${i.name}${note}`;
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

        const html = `
            <div id="print-area">
                <div class="print-header">
                    ================================<br>
                    CASA PEPA<br>
                    Ticket de comanda<br>
                    ================================
                </div>
                <div style="text-align:left;">
                    Mesa: ${orderData.tableId}         Comensales: ${orderData.guests}<br>
                    Camarero: ${orderData.waiterName || 'Desconocido'}<br>
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

    printCobro(table, orders, grandTotal, method) {
        const date = new Date();
        const dateStr = date.toLocaleDateString('es-ES');
        const timeStr = date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit', second: '2-digit'});

        let itemsHtml = '';
        orders.forEach(o => {
            o.items.forEach(i => {
                const name = i.name.substring(0, 18).padEnd(18, ' ');
                const price = (i.price * i.qty).toFixed(2).padStart(6, ' ');
                itemsHtml += `  ${i.qty}x ${name} ${price}€<br>`;
            });
        });

        const sub = (grandTotal / 1.1).toFixed(2);
        const iva = (grandTotal - sub).toFixed(2);
        const tot = grandTotal.toFixed(2);

        const html = `
            <div id="print-area">
                <div class="print-header">
                    ================================<br>
                    CASA PEPA<br>
                    TICKET DE COBRO<br>
                    ================================
                </div>
                <div style="text-align:left;">
                    Mesa: ${table.id}         Camarero: ${orders[0]?.waiterName || 'Desconocido'}<br>
                    Fecha: ${dateStr}    Hora: ${timeStr}<br>
                    --------------------------------<br>
                    ${itemsHtml}
                    --------------------------------<br>
                    SUBTOTAL:              ${sub.padStart(6, ' ')}€<br>
                    IVA (10%):             ${iva.padStart(6, ' ')}€<br>
                    TOTAL:                 ${tot.padStart(6, ' ')}€<br>
                    --------------------------------<br>
                    MÉTODO DE PAGO: ${method.toUpperCase()}<br>
                    ================================<br>
                </div>
                <div class="print-footer">
                    ¡Gracias y hasta pronto!<br>
                    Casa Pepa<br>
                    ================================
                </div>
            </div>
        `;

        this.saveTicket({
            id: 'C' + Date.now(),
            type: 'cobro',
            tableId: table.id,
            waiter: orders[0]?.waiterName,
            timestamp: Date.now(),
            total: grandTotal,
            htmlContent: html
        });

        this.doPrint(html);
    },

    doPrint(html) {
        const oldPrint = document.getElementById('print-area');
        if(oldPrint) oldPrint.remove();
        document.body.insertAdjacentHTML('beforeend', html);
        window.print();
        const p = document.getElementById('print-area');
        if(p) p.remove();
    }
};
