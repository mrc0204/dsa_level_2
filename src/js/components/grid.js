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
            <div class="card clickable-card" data-id="${item.id}">
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
                <div class="card-footer-action">
                    <button class="view-details-btn" data-action="view" data-id="${item.id}">View full description →</button>
                </div>
            </div>`;
    }).join('');
}

export function openQuestionDetailModal(item) {
    if (!item) return;

    // Close any other open modals first
    document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));

    const modal = document.getElementById('questionDetailModal');
    const scrim = document.getElementById('modalScrim');

    const titleEl = document.getElementById('detailTitle');
    const catEl = document.getElementById('detailCategory');
    const descEl = document.getElementById('detailDescription');
    const countEl = document.getElementById('detailCount');
    const dateEl = document.getElementById('detailDate');

    try {
        if (titleEl) titleEl.textContent = item.title || 'Untitled Question';
        if (catEl) catEl.textContent = item.category || 'General';
        if (descEl) descEl.textContent = item.description && String(item.description).trim() ? item.description : 'No description added.';
        if (countEl) countEl.textContent = `Encounters: ×${item.count || 1}`;
        if (dateEl) {
            let dateStr = '';
            if (item.addedAt) {
                const parsed = new Date(item.addedAt);
                if (!isNaN(parsed.getTime())) {
                    dateStr = `Added ${parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
                }
            }
            dateEl.textContent = dateStr;
        }
    } catch (err) {
        console.error('Error rendering question details:', err);
    }

    if (modal) modal.classList.add('show');
    if (scrim) scrim.classList.add('show');
}

export function closeQuestionDetailModal() {
    const modal = document.getElementById('questionDetailModal');
    const scrim = document.getElementById('modalScrim');
    if (modal) modal.classList.remove('show');
    if (scrim) scrim.classList.remove('show');
}

export function initGridEvents() {
    const grid = document.getElementById('grid');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    const scrim = document.getElementById('modalScrim');

    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeQuestionDetailModal);
    }
    if (scrim) {
        scrim.addEventListener('click', closeQuestionDetailModal);
    }

    if (!grid) return;

    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (btn) {
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');

            if (action === 'view') {
                e.stopPropagation();
                const card = btn.closest('.card');
                const cardTitleText = card ? card.querySelector('.card-title')?.textContent?.trim() : '';
                let q = state.questions.find(item => String(item.id) === String(id) || (item.title && item.title.trim() === cardTitleText));
                if (!q && cardTitleText) {
                    const cardDescText = card.querySelector('.card-desc')?.textContent?.trim() || '';
                    const cardCategoryText = card.querySelector('.badge')?.textContent?.trim() || '';
                    const cardCountText = card.querySelector('.count-value')?.textContent?.replace(/[^0-9]/g, '') || '1';
                    q = {
                        id: id,
                        title: cardTitleText,
                        description: cardDescText !== 'No description added.' ? cardDescText : '',
                        category: cardCategoryText,
                        count: parseInt(cardCountText, 10) || 1
                    };
                }
                if (q) openQuestionDetailModal(q);
                return;
            }

            e.stopPropagation();
            if (state.role !== 'admin') {
                showToast('Admin login required to modify questions.');
                return;
            }

            if (action === 'inc') {
                state.updateQuestion(id, q => q.count++);
            } else if (action === 'dec') {
                state.updateQuestion(id, q => q.count = Math.max(0, q.count - 1));
            } else if (action === 'del') {
                const q = state.questions.find(item => String(item.id) === String(id));
                if (q && confirm(`Delete "${q.title}" from your vault?`)) {
                    const deleted = state.deleteQuestion(id);
                    if (deleted) {
                        showToast(`Deleted <strong>${escapeHtml(deleted.title)}</strong>`);
                    }
                }
            }
            return;
        }

        // Click on card opens question details modal for all users
        const card = e.target.closest('.card');
        if (card) {
            const id = card.getAttribute('data-id');
            const cardTitleText = card.querySelector('.card-title')?.textContent?.trim() || '';
            const cardDescText = card.querySelector('.card-desc')?.textContent?.trim() || '';
            const cardCategoryText = card.querySelector('.badge')?.textContent?.trim() || '';
            const cardCountText = card.querySelector('.count-value')?.textContent?.replace(/[^0-9]/g, '') || '1';

            let q = state.questions.find(item => String(item.id) === String(id) || (item.title && item.title.trim() === cardTitleText));

            if (!q && cardTitleText) {
                q = {
                    id: id,
                    title: cardTitleText,
                    description: cardDescText !== 'No description added.' ? cardDescText : '',
                    category: cardCategoryText,
                    count: parseInt(cardCountText, 10) || 1
                };
            }

            if (q) {
                openQuestionDetailModal(q);
            }
        }
    });
}
