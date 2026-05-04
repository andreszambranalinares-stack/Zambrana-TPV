import { globalState } from './state.js';
import { showModal } from './ui/common.js';

export function renderAllergensView() {
    const map = {}; // { 'gluten': ['Pan con tomate', ...] }

    globalState.menu.forEach(item => {
        if (!item.ingredients) return;
        item.ingredients.forEach(ing => {
            if (ing.isAllergen) {
                // We don't have a specific allergen type field (like 'gluten' vs 'lactosa') in the prompt's ingredient model, 
                // it just says "Alérgeno (si está ON, aparece con icono)". 
                // But the prompt also mentions "productos agrupados por alérgeno (gluten, lácteos, pescado...)".
                // Since the admin form doesn't let them specify *which* allergen, only a generic toggle, 
                // we might have to infer it from the name or just group them by the ingredient name itself (e.g. "Bechamel", "Queso manchego").
                
                // Let's do a simple heuristic based on the ingredient name for common ones to meet the requirement:
                let type = 'Otros';
                const name = ing.name.toLowerCase();
                if (name.includes('pan') || name.includes('fideos') || name.includes('pasta') || name.includes('rebozado') || name.includes('galleta') || name.includes('brioche') || name.includes('brownie')) type = 'Gluten';
                else if (name.includes('bechamel') || name.includes('queso') || name.includes('nata') || name.includes('helado') || name.includes('crema') || name.includes('leche') || name.includes('mantequilla')) type = 'Lácteos';
                else if (name.includes('bacalao') || name.includes('merluza') || name.includes('lubina') || name.includes('dorada') || name.includes('boquerones') || name.includes('anchoas')) type = 'Pescado';
                else if (name.includes('gamba') || name.includes('bogavante') || name.includes('langostino') || name.includes('cangrejo')) type = 'Crustáceos';
                else if (name.includes('calamar') || name.includes('mejillón') || name.includes('pulpo')) type = 'Moluscos';
                else if (name.includes('huevo') || name.includes('mayonesa') || name.includes('alioli') || name.includes('flan')) type = 'Huevo';
                else if (name.includes('nuez') || name.includes('nueces') || name.includes('almendra') || name.includes('piñones')) type = 'Frutos secos';

                if (!map[type]) map[type] = new Set();
                map[type].add(item.name);
            }
        });
    });

    let html = `<div style="display:flex; flex-direction:column; gap:1.5rem; max-height:70vh; overflow-y:auto;">`;
    
    if (Object.keys(map).length === 0) {
        html += `<p style="text-align:center; color:var(--color-text-muted);">No hay alérgenos registrados en la carta actual.</p>`;
    } else {
        Object.keys(map).sort().forEach(type => {
            html += `
                <div>
                    <h4 style="color:var(--color-danger); border-bottom:1px solid var(--color-border); padding-bottom:0.25rem;">
                        <i class='bx bx-error'></i> ${type}
                    </h4>
                    <ul style="list-style-type:disc; padding-left:1.5rem; margin-top:0.5rem;">
                        ${Array.from(map[type]).map(prod => `<li>${prod}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
    }
    
    html += `</div>`;
    
    showModal('Información de Alérgenos', html, `<button class="btn btn-primary" onclick="document.querySelector('.modal-overlay').remove()">Cerrar</button>`);
}
