import { CATEGORIES } from '../config/constants.js';
import { renderGrid } from './grid.js';

export function populateCategoryFilter() {
    const sel = document.getElementById('categoryFilter');
    if (!sel) return;

    CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        sel.appendChild(opt);
    });
}

export function initToolbarEvents() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortSelect = document.getElementById('sortSelect');

    if (searchInput) searchInput.addEventListener('input', renderGrid);
    if (categoryFilter) categoryFilter.addEventListener('change', renderGrid);
    if (sortSelect) sortSelect.addEventListener('change', renderGrid);
}
