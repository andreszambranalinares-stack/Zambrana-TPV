export function formatTimeElapsed(timestamp) {
    if (!timestamp) return '';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    if (minutes > 0) return `${minutes} min ${seconds} s`;
    return `${seconds} s`;
}

export function formatTimeHM(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function showModal(title, contentHtml, footerHtml = '') {
    const container = document.getElementById('modals-container');
    const modalId = 'modal-' + Date.now();
    
    const modalHTML = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="btn-icon" onclick="document.getElementById('${modalId}').remove()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="modal-body">
                    ${contentHtml}
                </div>
                ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', modalHTML);
    const overlay = document.getElementById(modalId);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    
    return modalId;
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
}
