import { globalState } from './state.js';
import { getCategoryDestination } from './data.js';

export function renderManageMenu(container, app) {
    let currentCategoryFilter = 'Todas';
    let searchQuery = '';

    const renderList = () => {
        let filtered = globalState.menu;
        
        if (currentCategoryFilter !== 'Todas') {
            filtered = filtered.filter(p => p.category === currentCategoryFilter);
        }
        if (searchQuery) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        let html = `
            <div style="padding: 1rem; max-width: 1200px; margin: 0 auto; display:flex; flex-direction:column; gap:1rem; height:calc(100vh - 60px); overflow:hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                    <div style="display:flex; align-items:center; gap: 1rem;">
                        <button class="btn btn-secondary" onclick="window.history.back()">← Volver</button>
                        <h2>Gestionar Carta</h2>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <input type="text" id="menu-search" placeholder="🔍 Buscar producto..." value="${searchQuery}" style="padding:0.5rem; border-radius:4px; border:1px solid var(--color-border);">
                        <select id="menu-cat-filter" style="padding:0.5rem; border-radius:4px; border:1px solid var(--color-border);">
                            <option value="Todas">Todas las categorías</option>
                            <option value="Entrantes" ${currentCategoryFilter === 'Entrantes' ? 'selected' : ''}>Entrantes</option>
                            <option value="Carnes" ${currentCategoryFilter === 'Carnes' ? 'selected' : ''}>Carnes</option>
                            <option value="Pescados" ${currentCategoryFilter === 'Pescados' ? 'selected' : ''}>Pescados</option>
                            <option value="Pastas" ${currentCategoryFilter === 'Pastas' ? 'selected' : ''}>Pastas</option>
                            <option value="Postres" ${currentCategoryFilter === 'Postres' ? 'selected' : ''}>Postres</option>
                            <option value="Bebidas" ${currentCategoryFilter === 'Bebidas' ? 'selected' : ''}>Bebidas</option>
                            <option value="Extra cocina" ${currentCategoryFilter === 'Extra cocina' ? 'selected' : ''}>Extras cocina</option>
                            <option value="Extra barra" ${currentCategoryFilter === 'Extra barra' ? 'selected' : ''}>Extras barra</option>
                        </select>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-secondary" id="btn-view-history">📜 Historial</button>
                        <button class="btn btn-primary" id="btn-add-product">+ Nuevo Producto</button>
                    </div>
                </div>
                
                <div style="overflow-y:auto; border:1px solid var(--color-border); border-radius:4px; flex:1; background:var(--color-surface);">
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead style="position:sticky; top:0; background:var(--color-surface); z-index:1; border-bottom:2px solid var(--color-border);">
                            <tr>
                                <th style="padding:0.5rem;">Nombre</th>
                                <th style="padding:0.5rem;">Categoría / Subcurso</th>
                                <th style="padding:0.5rem;">Precio (€)</th>
                                <th style="padding:0.5rem;">Ingredientes</th>
                                <th style="padding:0.5rem;">Estado</th>
                                <th style="padding:0.5rem; text-align:right;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(p => `
                                <tr style="border-bottom:1px solid var(--color-border); ${p.status === 'Inactivo' ? 'opacity:0.5;' : ''}">
                                    <td style="padding:0.5rem;"><strong>${p.name}</strong></td>
                                    <td style="padding:0.5rem;">
                                        <span style="font-size:0.85rem; background:var(--color-bg); padding:0.2rem 0.4rem; border-radius:4px;">${p.category}</span>
                                        ${p.subcourse ? `<br><span style="font-size:0.75rem; color:var(--color-text-muted);">${p.subcourse}</span>` : ''}
                                    </td>
                                    <td style="padding:0.5rem;">
                                        <input type="number" class="inline-price-edit" data-id="${p.id}" value="${p.price.toFixed(2)}" step="0.10" style="width:70px; padding:0.2rem; border:1px solid transparent; border-radius:4px; background:transparent;">
                                    </td>
                                    <td style="padding:0.5rem; font-size:0.8rem; color:var(--color-text-muted);">
                                        ${p.ingredients ? p.ingredients.length : 0} ings. ${p.ingredients && p.ingredients.some(i => i.isAllergen) ? '⚠️' : ''}
                                    </td>
                                    <td style="padding:0.5rem;">
                                        <span style="color:${p.status === 'Activo' ? 'var(--color-free)' : 'var(--color-danger)'};">${p.status}</span>
                                    </td>
                                    <td style="padding:0.5rem; text-align:right;">
                                        <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.8rem;" onclick="window.editProduct('${p.id}')">✏️ Editar</button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${filtered.length === 0 ? '<tr><td colspan="6" style="padding:1rem; text-align:center;">No hay productos</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        container.innerHTML = html;

        document.getElementById('menu-search').addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderList();
        });
        document.getElementById('menu-cat-filter').addEventListener('change', (e) => {
            currentCategoryFilter = e.target.value;
            renderList();
        });
        
        document.getElementById('btn-add-product').addEventListener('click', () => {
            openProductForm(null, renderList);
        });

        document.getElementById('btn-view-history').addEventListener('click', () => {
            const history = JSON.parse(localStorage.getItem('casa_pepa_menuHistory')) || [];
            let hHtml = `<div style="padding: 1rem; max-width: 800px; margin: 0 auto; height:calc(100vh - 60px); overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                    <h2>Historial de Cambios en Carta</h2>
                    <button class="btn btn-secondary" id="btn-back-to-carta">Volver</button>
                </div>`;
            if (history.length === 0) {
                hHtml += `<p>No hay historial de cambios.</p>`;
            } else {
                hHtml += history.map(h => `
                    <div style="border:1px solid var(--color-border); border-radius:4px; padding:1rem; background:var(--color-surface); margin-bottom:0.5rem;">
                        <div style="color:var(--color-text-muted); font-size:0.8rem;">${new Date(h.time).toLocaleString()}</div>
                        <strong>${h.product}</strong> - ${h.action}
                        ${h.oldVal !== '-' ? `<br><span style="color:var(--color-danger); text-decoration:line-through;">${h.oldVal}€</span> ➔ <span style="color:var(--color-free);">${h.newVal}€</span>` : ''}
                    </div>
                `).join('');
            }
            hHtml += `</div>`;
            container.innerHTML = hHtml;
            document.getElementById('btn-back-to-carta').addEventListener('click', renderList);
        });

        document.querySelectorAll('.inline-price-edit').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const newPrice = parseFloat(e.target.value);
                if (!isNaN(newPrice)) {
                    const item = globalState.menu.find(i => i.id === id);
                    if (item) {
                        const oldPrice = item.price;
                        item.price = newPrice;
                        globalState.updateMenu(globalState.menu);
                        globalState.logMenuChange(item.name, 'Precio', oldPrice, newPrice);
                    }
                }
            });
            input.addEventListener('focus', e => e.target.style.border = '1px solid var(--color-primary)');
            input.addEventListener('blur', e => e.target.style.border = '1px solid transparent');
        });

        window.editProduct = (id) => {
            openProductForm(globalState.menu.find(p => p.id === id), renderList);
        };
    };

    const openProductForm = (product, onBack) => {
        const isEdit = !!product;
        const p = product || {
            id: 'p_' + Date.now(),
            name: '', desc: '', price: 0, category: 'Entrantes', subcourse: '', status: 'Activo',
            hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
            ingredients: []
        };

        let tempIngredients = [...(p.ingredients || [])];

        const renderForm = () => {
            const canHaveMods = !['Postres', 'Bebidas'].includes(p.category) && p.subcourse !== 'Ensaladas';

            const formHtml = `
                <div style="padding: 1rem; max-width: 800px; margin: 0 auto; height:calc(100vh - 60px); overflow-y:auto; display:flex; flex-direction:column; gap:1.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h2>${isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <div style="display:flex; gap:0.5rem;">
                            <button class="btn btn-secondary" id="btn-cancel-form">Cancelar</button>
                            <button class="btn btn-primary" id="btn-save-form">Guardar</button>
                        </div>
                    </div>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; background:var(--color-surface); padding:1rem; border-radius:4px;">
                        <div>
                            <label>Nombre del producto*</label>
                            <input type="text" id="fp-name" value="${p.name}" style="width:100%; padding:0.5rem;">
                        </div>
                        <div>
                            <label>Precio (€)*</label>
                            <input type="number" id="fp-price" value="${p.price.toFixed(2)}" step="0.10" style="width:100%; padding:0.5rem;">
                        </div>
                        <div>
                            <label>Categoría*</label>
                            <select id="fp-category" style="width:100%; padding:0.5rem;">
                                <option value="Entrantes" ${p.category==='Entrantes'?'selected':''}>Entrantes</option>
                                <option value="Carnes" ${p.category==='Carnes'?'selected':''}>Carnes</option>
                                <option value="Pescados" ${p.category==='Pescados'?'selected':''}>Pescados</option>
                                <option value="Pastas" ${p.category==='Pastas'?'selected':''}>Pastas</option>
                                <option value="Postres" ${p.category==='Postres'?'selected':''}>Postres</option>
                                <option value="Bebidas" ${p.category==='Bebidas'?'selected':''}>Bebidas</option>
                                <option value="Extra cocina" ${p.category==='Extra cocina'?'selected':''}>Extra cocina</option>
                                <option value="Extra barra" ${p.category==='Extra barra'?'selected':''}>Extra barra</option>
                            </select>
                        </div>
                        <div>
                            <label>Subcurso (opcional, ej. Ensaladas)</label>
                            <input type="text" id="fp-subcourse" value="${p.subcourse}" style="width:100%; padding:0.5rem;">
                        </div>
                    </div>

                    <div style="background:var(--color-surface); padding:1rem; border-radius:4px;">
                        <label>Estado</label><br>
                        <label><input type="radio" name="fp-status" value="Activo" ${p.status==='Activo'?'checked':''}> Activo</label>
                        <label style="margin-left:1rem;"><input type="radio" name="fp-status" value="Inactivo" ${p.status==='Inactivo'?'checked':''}> Inactivo</label>
                    </div>

                    <div style="border:1px solid var(--color-border); padding:1rem; border-radius:4px; background:var(--color-surface); opacity: ${canHaveMods ? '1' : '0.5'}; pointer-events: ${canHaveMods ? 'auto' : 'none'};">
                        <h4>Modificadores de preparación</h4>
                        <p style="font-size:0.8rem; color:var(--color-text-muted); margin-bottom:0.5rem;">No aplica a postres, bebidas ni ensaladas.</p>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
                            <label><input type="checkbox" id="mod-punto" ${p.hasPuntoCarne?'checked':''}> Punto de carne</label>
                            <label><input type="checkbox" id="mod-gluten" ${p.hasSinGluten?'checked':''}> Mod. Sin gluten</label>
                            <label><input type="checkbox" id="mod-lactosa" ${p.hasSinLactosa?'checked':''}> Mod. Sin lactosa</label>
                            <label><input type="checkbox" id="mod-sal" ${p.hasSinSal?'checked':''}> Mod. Sin sal</label>
                            <label><input type="checkbox" id="mod-libre" ${p.hasAlergiaLibre?'checked':''}> Campo libre alérgenos</label>
                        </div>
                    </div>

                    <div style="border:1px solid var(--color-border); padding:1rem; border-radius:4px; background:var(--color-surface);">
                        <h4>Ingredientes</h4>
                        <div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                            <input type="text" id="new-ing-name" placeholder="Nombre ingrediente..." style="flex:1; padding:0.5rem;">
                            <button class="btn btn-secondary" id="btn-add-ing">Añadir</button>
                        </div>
                        <table style="width:100%; border-collapse:collapse; font-size:0.9rem;" id="ings-table">
                            <tr style="border-bottom:1px solid var(--color-border);">
                                <th>Nombre</th>
                                <th>Eliminable</th>
                                <th>Alérgeno</th>
                                <th></th>
                            </tr>
                            ${tempIngredients.map((ing, i) => `
                                <tr style="border-bottom:1px solid var(--color-border);">
                                    <td style="padding:0.5rem;">${ing.name}</td>
                                    <td><input type="checkbox" onchange="window.updateIng(${i}, 'elim', this.checked)" ${ing.isEliminable?'checked':''}></td>
                                    <td><input type="checkbox" onchange="window.updateIng(${i}, 'aler', this.checked)" ${ing.isAllergen?'checked':''}></td>
                                    <td><button class="btn-icon text-danger" onclick="window.removeIng(${i})">❌</button></td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                </div>
            `;
            
            container.innerHTML = formHtml;

            document.getElementById('btn-add-ing').addEventListener('click', () => {
                const name = document.getElementById('new-ing-name').value.trim();
                if (name) {
                    tempIngredients.push({ name, isEliminable: true, isAllergen: false });
                    renderForm();
                }
            });

            window.updateIng = (idx, type, val) => {
                if (type === 'elim') tempIngredients[idx].isEliminable = val;
                if (type === 'aler') tempIngredients[idx].isAllergen = val;
            };

            window.removeIng = (idx) => {
                tempIngredients.splice(idx, 1);
                renderForm();
            };

            document.getElementById('fp-category').addEventListener('change', (e) => {
                p.category = e.target.value;
                renderForm();
            });
            document.getElementById('fp-subcourse').addEventListener('input', (e) => {
                p.subcourse = e.target.value;
                if (e.target.value.toLowerCase() === 'ensaladas' || p.subcourse.toLowerCase() === 'ensaladas') {
                    renderForm();
                }
            });

            document.getElementById('btn-cancel-form').addEventListener('click', onBack);

            document.getElementById('btn-save-form').addEventListener('click', () => {
                p.name = document.getElementById('fp-name').value.trim();
                p.price = parseFloat(document.getElementById('fp-price').value) || 0;
                p.status = document.querySelector('input[name="fp-status"]:checked').value;
                
                if (!p.name) return alert('El nombre es obligatorio');
                
                if (canHaveMods) {
                    p.hasPuntoCarne = document.getElementById('mod-punto').checked;
                    p.hasSinGluten = document.getElementById('mod-gluten').checked;
                    p.hasSinLactosa = document.getElementById('mod-lactosa').checked;
                    p.hasSinSal = document.getElementById('mod-sal').checked;
                    p.hasAlergiaLibre = document.getElementById('mod-libre').checked;
                } else {
                    p.hasPuntoCarne = false; p.hasSinGluten = false; p.hasSinLactosa = false;
                    p.hasSinSal = false; p.hasAlergiaLibre = true;
                }
                p.ingredients = tempIngredients;

                if (isEdit) {
                    const idx = globalState.menu.findIndex(x => x.id === p.id);
                    globalState.menu[idx] = p;
                    globalState.logMenuChange(p.name, 'Edición completa', '-', '-');
                } else {
                    globalState.menu.push(p);
                    globalState.logMenuChange(p.name, 'Creación', '-', '-');
                }
                
                globalState.updateMenu(globalState.menu);
                onBack();
            });
        };

        renderForm();
    };

    renderList();
}
