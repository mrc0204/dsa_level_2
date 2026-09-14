import { state } from '../services/state.js';
import { escapeHtml, showToast } from '../utils/dom.js';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

export function renderAdminHeader() {
    const headerRight = document.querySelector('.top-right');
    if (!headerRight) return;

    let adminNav = document.getElementById('adminNavControls');
    if (!adminNav) {
        adminNav = document.createElement('div');
        adminNav.id = 'adminNavControls';
        adminNav.className = 'admin-nav-controls';
        headerRight.insertBefore(adminNav, headerRight.firstChild);
    }

    const isAdmin = state.role === 'admin';
    const pendingCount = state.requests.length;

    if (isAdmin) {
        adminNav.innerHTML = `
            <span class="role-badge admin">Admin</span>
            <button class="nav-btn request-portal-btn" id="openAdminPortalBtn">
                Requests ${pendingCount > 0 ? `<span class="req-badge">${pendingCount}</span>` : ''}
            </button>
            <button class="nav-btn-link" id="adminLogoutBtn">Logout</button>
        `;
    } else {
        adminNav.innerHTML = `
            <button class="nav-btn request-question-btn" id="openUserRequestBtn">+ Request Question</button>
            <button class="nav-btn-link" id="openAdminLoginBtn">Admin Login</button>
        `;
    }

    bindAdminHeaderEvents();
}

function bindAdminHeaderEvents() {
    const openLoginBtn = document.getElementById('openAdminLoginBtn');
    const openPortalBtn = document.getElementById('openAdminPortalBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const openUserReqBtn = document.getElementById('openUserRequestBtn');

    if (openLoginBtn) openLoginBtn.addEventListener('click', openAdminLoginModal);
    if (openPortalBtn) openPortalBtn.addEventListener('click', openAdminPortalModal);
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            state.setRole('user');
            showToast('Logged out of Admin mode');
        });
    }
    if (openUserReqBtn) openUserReqBtn.addEventListener('click', openUserRequestModal);
}

export function openAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    const scrim = document.getElementById('modalScrim');
    if (modal) modal.classList.add('show');
    if (scrim) scrim.classList.add('show');

    const pwdInput = document.getElementById('adminPasswordInput');
    const errText = document.getElementById('adminLoginError');
    if (pwdInput) {
        pwdInput.value = '';
        pwdInput.focus();
    }
    if (errText) errText.textContent = '';
}

export function closeAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    const scrim = document.getElementById('modalScrim');
    if (modal) modal.classList.remove('show');
    if (scrim) scrim.classList.remove('show');
}

export function openAdminPortalModal() {
    const modal = document.getElementById('adminPortalModal');
    const scrim = document.getElementById('modalScrim');
    if (modal) modal.classList.add('show');
    if (scrim) scrim.classList.add('show');
    renderPendingRequestsList();
}

export function closeAdminPortalModal() {
    const modal = document.getElementById('adminPortalModal');
    const scrim = document.getElementById('modalScrim');
    if (modal) modal.classList.remove('show');
    if (scrim) scrim.classList.remove('show');
}

export function openUserRequestModal() {
    const modal = document.getElementById('userRequestModal');
    const scrim = document.getElementById('modalScrim');
    if (modal) modal.classList.add('show');
    if (scrim) scrim.classList.add('show');

    const titleInput = document.getElementById('reqTitleInput');
    const descInput = document.getElementById('reqDescInput');
    const suggContainer = document.getElementById('reqTitleSuggestions');
    const noteContainer = document.getElementById('reqExistingInfoNote');

    if (titleInput) {
        titleInput.value = '';
        titleInput.focus();
    }
    if (descInput) descInput.value = '';
    if (suggContainer) {
        suggContainer.innerHTML = '';
        suggContainer.classList.remove('show');
    }
    if (noteContainer) {
        noteContainer.innerHTML = '';
        noteContainer.classList.remove('show');
    }
}

export function closeUserRequestModal() {
    const modal = document.getElementById('userRequestModal');
    const scrim = document.getElementById('modalScrim');
    const suggContainer = document.getElementById('reqTitleSuggestions');
    const noteContainer = document.getElementById('reqExistingInfoNote');

    if (modal) modal.classList.remove('show');
    if (scrim) scrim.classList.remove('show');
    if (suggContainer) {
        suggContainer.innerHTML = '';
        suggContainer.classList.remove('show');
    }
    if (noteContainer) {
        noteContainer.innerHTML = '';
        noteContainer.classList.remove('show');
    }
}

export function renderPendingRequestsList() {
    const container = document.getElementById('pendingRequestsList');
    if (!container) return;

    const requests = state.requests;
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-requests">
                <p>No pending question requests.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = requests.map(req => {
        const reqTitleKey = req.titleKey || req.title.trim().toLowerCase().replace(/\s+/g, ' ');
        const existingMatch = state.questions.find(q => q.titleKey === reqTitleKey || q.title.trim().toLowerCase() === req.title.trim().toLowerCase());
        const matchNotice = existingMatch ?
            `<div class="match-badge">Increments encounter count (currently ×${existingMatch.count})</div>` :
            `<div class="new-badge">New Question</div>`;

        return `
        <div class="request-item-card" data-req-id="${req.id}">
            <div class="req-header">
                <span class="req-title">${escapeHtml(req.title)}</span>
                <span class="badge">${escapeHtml(req.category)}</span>
            </div>
            ${matchNotice}
            <p class="req-desc">${escapeHtml(req.description || 'No description provided.')}</p>
            <div class="req-actions">
                <button class="approve-btn" data-action="approve" data-id="${req.id}">
                    ${existingMatch ? 'Approve & Increment (+1)' : 'Approve & Add'}
                </button>
                <button class="reject-btn" data-action="reject" data-id="${req.id}">Reject</button>
            </div>
        </div>`;
    }).join('');
}

export function initAdminEvents() {
    // Admin login form submit
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pwdInput = document.getElementById('adminPasswordInput');
            const errText = document.getElementById('adminLoginError');

            if (pwdInput && pwdInput.value === ADMIN_PASSWORD) {
                state.setRole('admin');
                closeAdminLoginModal();
                showToast('<strong>Admin Access Granted</strong>');
            } else {
                if (errText) errText.textContent = 'Incorrect admin password.';
            }
        });
    }

    // Modal close buttons
    const closeLoginBtn = document.getElementById('closeAdminLoginBtn');
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeAdminLoginModal);

    const closePortalBtn = document.getElementById('closeAdminPortalBtn');
    if (closePortalBtn) closePortalBtn.addEventListener('click', closeAdminPortalModal);

    const closeUserReqBtn = document.getElementById('closeUserRequestBtn');
    if (closeUserReqBtn) closeUserReqBtn.addEventListener('click', closeUserRequestModal);

    const scrim = document.getElementById('modalScrim');
    if (scrim) {
        scrim.addEventListener('click', () => {
            closeAdminLoginModal();
            closeAdminPortalModal();
            closeUserRequestModal();
        });
    }

    // Title autocomplete for question requests
    const titleInput = document.getElementById('reqTitleInput');
    const suggContainer = document.getElementById('reqTitleSuggestions');
    const noteContainer = document.getElementById('reqExistingInfoNote');
    const categorySelect = document.getElementById('reqCategorySelect');
    const descInput = document.getElementById('reqDescInput');

    if (titleInput) {
        titleInput.addEventListener('input', () => {
            const query = titleInput.value.trim().toLowerCase();
            if (!query) {
                if (suggContainer) {
                    suggContainer.innerHTML = '';
                    suggContainer.classList.remove('show');
                }
                if (noteContainer) {
                    noteContainer.innerHTML = '';
                    noteContainer.classList.remove('show');
                }
                return;
            }

            const matches = state.questions.filter(q =>
                q.title.toLowerCase().includes(query)
            );

            // Check if exact match
            const exactMatch = state.questions.find(q =>
                q.title.trim().toLowerCase() === query
            );

            if (exactMatch && noteContainer) {
                noteContainer.innerHTML = `Existing question found! Submitting request will increment encounter count (currently ×${exactMatch.count}).`;
                noteContainer.classList.add('show');
            } else if (noteContainer) {
                noteContainer.innerHTML = '';
                noteContainer.classList.remove('show');
            }

            if (matches.length > 0 && suggContainer) {
                suggContainer.innerHTML = matches.map(m => `
                    <div class="sugg-item" data-id="${m.id}">
                        <div class="sugg-top">
                            <span class="sugg-title">${escapeHtml(m.title)}</span>
                            <span class="sugg-count">×${m.count}</span>
                        </div>
                        <span class="sugg-cat">${escapeHtml(m.category)}</span>
                    </div>
                `).join('');
                suggContainer.classList.add('show');
            } else if (suggContainer) {
                suggContainer.innerHTML = '';
                suggContainer.classList.remove('show');
            }
        });
    }

    if (suggContainer) {
        suggContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.sugg-item');
            if (!item) return;
            const qId = item.getAttribute('data-id');
            const targetQ = state.questions.find(q => q.id === qId);

            if (targetQ) {
                if (titleInput) titleInput.value = targetQ.title;
                if (categorySelect) categorySelect.value = targetQ.category;
                if (descInput) descInput.value = targetQ.description || '';

                if (noteContainer) {
                    noteContainer.innerHTML = `Selected existing question: <strong>${escapeHtml(targetQ.title)}</strong>. Submitting will increment count to ×${targetQ.count + 1} upon approval.`;
                    noteContainer.classList.add('show');
                }
            }

            suggContainer.innerHTML = '';
            suggContainer.classList.remove('show');
        });
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (suggContainer && !e.target.closest('.autocomplete-wrapper')) {
            suggContainer.innerHTML = '';
            suggContainer.classList.remove('show');
        }
    });

    // User question request form submit
    const userReqForm = document.getElementById('userRequestForm');
    if (userReqForm) {
        userReqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = titleInput ? titleInput.value.trim() : '';
            const description = descInput ? descInput.value.trim() : '';
            const category = categorySelect ? categorySelect.value : 'Greedy & Observations';

            if (!title) return;

            await state.submitQuestionRequest({
                title,
                description,
                category
            });

            closeUserRequestModal();
            showToast(`Submitted request for <strong>${escapeHtml(title)}</strong>! Awaiting admin approval.`);
        });
    }

    // Pending Requests Approval / Rejection delegation
    const pendingList = document.getElementById('pendingRequestsList');
    if (pendingList) {
        pendingList.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const reqId = btn.getAttribute('data-id');

            if (action === 'approve') {
                const approved = await state.approveRequest(reqId);
                if (approved) {
                    if (approved.isEncounterIncrement) {
                        showToast(`Incremented count for <strong>${escapeHtml(approved.title)}</strong> to ×${approved.count}`);
                    } else {
                        showToast(`Approved & added <strong>${escapeHtml(approved.title)}</strong>`);
                    }
                    renderPendingRequestsList();
                }
            } else if (action === 'reject') {
                const rejected = await state.rejectRequest(reqId);
                if (rejected) {
                    showToast(`Rejected request for <strong>${escapeHtml(rejected.title)}</strong>`);
                    renderPendingRequestsList();
                }
            }
        });
    }
}
