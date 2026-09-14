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

    // Check if user is logged in via User Portal
    if (!state.currentUser) {
        grid.innerHTML = `
            <div class="auth-gateway-card">
                <div class="gateway-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h2>User Access Required</h2>
                <p>Please sign in with your <strong>NIAT ID</strong> or create an account to view questions in the vault and track your solved progress.</p>
                <div class="gateway-actions">
                    <button class="primary-btn gateway-btn" id="gatewaySignInBtn">Sign In with NIAT ID</button>
                    <button class="secondary-btn gateway-btn" id="gatewayRegisterBtn">Create Account</button>
                </div>
            </div>`;

        const signInBtn = document.getElementById('gatewaySignInBtn');
        const regBtn = document.getElementById('gatewayRegisterBtn');
        if (signInBtn) signInBtn.addEventListener('click', () => window.openAuthModal('login'));
        if (regBtn) regBtn.addEventListener('click', () => window.openAuthModal('register'));
        return;
    }

    const list = getFilteredSortedQuestions(state.questions, {
        search: searchInput ? searchInput.value : '',
        category: categoryFilter ? categoryFilter.value : '',
        sort: sortSelect ? sortSelect.value : 'newest'
    });

    const solvedCount = state.userProgress.size;

    if (totalQElem) totalQElem.textContent = `${solvedCount}/${state.questions.length} Solved`;
    if (totalEncElem) {
        const totalEnc = state.questions.reduce((sum, q) => sum + q.count, 0);
        totalEncElem.textContent = totalEnc;
    }

    if (state.questions.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>Your vault is empty</p>
                <p>No questions found in vault.</p>
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
        const qIdStr = String(item.id);
        const isCompleted = state.userProgress.has(qIdStr);

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

        const checkboxControl = `
            <label class="completion-checkbox-wrapper" title="${isCompleted ? 'Mark as unsolved' : 'Mark as solved'}">
                <input type="checkbox" class="completion-checkbox" data-action="toggle-complete" data-id="${item.id}" ${isCompleted ? 'checked' : ''}>
                <span class="custom-checkbox"></span>
            </label>
        `;

        return `
            <div class="card clickable-card ${isCompleted ? 'completed-card' : ''}" data-id="${item.id}">
                <div class="card-top">
                    <div class="card-top-left">
                        ${checkboxControl}
                        <div class="card-title">${escapeHtml(item.title)}</div>
                    </div>
                    <div class="card-top-right">
                        ${isCompleted ? `<span class="solved-badge">✓ Solved</span>` : ''}
                        ${deleteBtn}
                    </div>
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

    grid.addEventListener('click', async (e) => {
        // Completion checkbox toggle
        const checkboxWrapper = e.target.closest('.completion-checkbox-wrapper');
        if (checkboxWrapper) {
            e.stopPropagation();
            const checkbox = checkboxWrapper.querySelector('.completion-checkbox');
            if (checkbox) {
                const qId = checkbox.getAttribute('data-id');
                const targetQ = state.questions.find(q => String(q.id) === String(qId));
                await state.toggleQuestionCompletion(qId);
                const isNowDone = state.userProgress.has(String(qId));
                if (targetQ) {
                    showToast(isNowDone ? `Marked <strong>${escapeHtml(targetQ.title)}</strong> as solved! 🎉` : `Unmarked <strong>${escapeHtml(targetQ.title)}</strong>`);
                }
            }
            return;
        }

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
