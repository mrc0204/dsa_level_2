import { state } from '../services/state.js';
import { escapeHtml, showToast } from '../utils/dom.js';
import { getFilteredSortedQuestions } from '../utils/helpers.js';

export function renderGrid() {
    const grid = document.getElementById('grid');
    const totalQElem = document.getElementById('statTotalQuestions');
    const totalEncElem = document.getElementById('statTotalEncounters');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortSelect = document.getElementById('sortSelect');

    if (!grid) return;

    const list = getFilteredSortedQuestions(state.questions, {
        search: searchInput ? searchInput.value : '',
        category: categoryFilter ? categoryFilter.value : '',
        sort: sortSelect ? sortSelect.value : 'newest'
    });

    if (totalQElem) totalQElem.textContent = state.questions.length;
    if (totalEncElem) {
        const totalEnc = state.questions.reduce((sum, q) => sum + q.count, 0);
        totalEncElem.textContent = totalEnc;
    }

    if (state.questions.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>Your vault is empty</p>
                <p>Open Settings and add the first question you want to track.</p>
            </div>`;
        return;
    }

    if (list.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>No matches</p>
                <p>Try a different search term or category.</p>
            </div>`;
        return;
    }

    const isAdmin = state.role === 'admin';

    grid.innerHTML = list.map(item => {
        const deleteBtn = isAdmin ? `
            <button class="delete-btn" data-action="del" data-id="${item.id}" aria-label="Delete question">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6h12z"/>
                </svg>
            </button>` : '';

        const minusBtn = isAdmin ?
            `<button class="count-btn minus" data-action="dec" data-id="${item.id}" aria-label="Decrease count">−</button>` :
            '';

        const plusBtn = isAdmin ?
            `<button class="count-btn plus" data-action="inc" data-id="${item.id}" aria-label="Increase count">+</button>` :
            '';

        return `
            <div class="card">
                <div class="card-top">
                    <div class="card-title">${escapeHtml(item.title)}</div>
                    ${deleteBtn}
                </div>
                <div class="card-desc">${escapeHtml(item.description || 'No description added.')}</div>
                <div class="card-bottom">
                    <span class="badge">${escapeHtml(item.category)}</span>
                    <div class="count-controls">
                        ${minusBtn}
                        <span class="count-value">×${item.count}</span>
                        ${plusBtn}
                    </div>
                </div>
            </div>`;
    }).join('');
}

export function initGridEvents() {
    const grid = document.getElementById('grid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        if (state.role !== 'admin') {
            showToast('Admin login required to modify questions.');
            return;
        }

        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');

        if (action === 'inc') {
            state.updateQuestion(id, q => q.count++);
        } else if (action === 'dec') {
            state.updateQuestion(id, q => q.count = Math.max(0, q.count - 1));
        } else if (action === 'del') {
            const q = state.questions.find(item => item.id === id);
            if (q && confirm(`Delete "${q.title}" from your vault?`)) {
                const deleted = state.deleteQuestion(id);
                if (deleted) {
                    showToast(`Deleted <strong>${escapeHtml(deleted.title)}</strong>`);
                }
            }
        }
    });
}
