import { CATEGORIES } from '../config/constants.js';
import { state } from '../services/state.js';
import { escapeHtml, generateId, showToast, applyTheme } from '../utils/dom.js';
import { findByTitle, normalizeTitle } from '../utils/helpers.js';

let pendingNewTitle = null;

export function populateCategoryInput() {
    const sel = document.getElementById('categoryInput');
    const reqSel = document.getElementById('reqCategorySelect');
    const adminSel = document.getElementById('adminCategorySelect');

    const fillOptions = (target) => {
        if (!target) return;
        target.innerHTML = '';
        CATEGORIES.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            target.appendChild(opt);
        });
    };

    fillOptions(sel);
    fillOptions(reqSel);
    fillOptions(adminSel);
}

export function resetStepper() {
    pendingNewTitle = null;
    const titleInput = document.getElementById('titleInput');
    const descInput = document.getElementById('descInput');
    const existingNote = document.getElementById('existingNote');
    const newQForm = document.getElementById('newQForm');
    const titleStep = document.getElementById('titleStep');
    const addAnotherBtn = document.getElementById('addAnotherBtn');

    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (existingNote) existingNote.classList.remove('show');
    if (newQForm) newQForm.classList.remove('show');
    if (titleStep) titleStep.style.display = '';
    if (addAnotherBtn) addAnotherBtn.style.display = 'none';
    if (titleInput) titleInput.focus();
}

function handleContinue() {
    const titleInput = document.getElementById('titleInput');
    const existingNote = document.getElementById('existingNote');
    const titleStep = document.getElementById('titleStep');
    const addAnotherBtn = document.getElementById('addAnotherBtn');
    const newQTitleLabel = document.getElementById('newQTitleLabel');
    const newQForm = document.getElementById('newQForm');
    const descInput = document.getElementById('descInput');

    if (!titleInput || !titleInput.value.trim()) return;

    const raw = titleInput.value;
    const existing = findByTitle(state.questions, raw);

    if (existing) {
        state.updateQuestion(existing.id, q => q.count++);
        if (existingNote) {
            existingNote.innerHTML = `<strong>${escapeHtml(existing.title)}</strong> was already in your vault — now encountered ×${existing.count}.`;
            existingNote.classList.add('show');
        }
        if (titleStep) titleStep.style.display = 'none';
        if (addAnotherBtn) addAnotherBtn.style.display = 'block';
        showToast(`<strong>${escapeHtml(existing.title)}</strong> now encountered ×${existing.count}`);
    } else {
        pendingNewTitle = raw.trim();
        if (newQTitleLabel) newQTitleLabel.textContent = pendingNewTitle;
        if (titleStep) titleStep.style.display = 'none';
        if (newQForm) newQForm.classList.add('show');
        if (descInput) descInput.focus();
    }
}

function handleSaveNew() {
    if (!pendingNewTitle) return;

    const descInput = document.getElementById('descInput');
    const categoryInput = document.getElementById('categoryInput');
    const newQForm = document.getElementById('newQForm');
    const titleStep = document.getElementById('titleStep');
    const addAnotherBtn = document.getElementById('addAnotherBtn');
    const titleInput = document.getElementById('titleInput');

    const description = descInput ? descInput.value.trim() : '';
    const category = categoryInput ? categoryInput.value : CATEGORIES[0];

    const newItem = {
        id: generateId(),
        title: pendingNewTitle,
        titleKey: normalizeTitle(pendingNewTitle),
        description: description,
        category: category,
        count: 1,
        addedAt: Date.now()
    };

    state.addQuestion(newItem);
    showToast(`Added <strong>${escapeHtml(newItem.title)}</strong> to your vault`);

    if (newQForm) newQForm.classList.remove('show');
    if (titleStep) titleStep.style.display = '';
    if (addAnotherBtn) addAnotherBtn.style.display = 'none';
    pendingNewTitle = null;
    if (titleInput) {
        titleInput.value = '';
        titleInput.focus();
    }
}

function handleCancelNew() {
    pendingNewTitle = null;
    const newQForm = document.getElementById('newQForm');
    const titleStep = document.getElementById('titleStep');
    const titleInput = document.getElementById('titleInput');

    if (newQForm) newQForm.classList.remove('show');
    if (titleStep) titleStep.style.display = '';
    if (titleInput) {
        titleInput.value = '';
        titleInput.focus();
    }
}

export function openDrawer() {
    const drawer = document.getElementById('drawer');
    const scrim = document.getElementById('scrim');
    if (drawer) drawer.classList.add('open');
    if (scrim) scrim.classList.add('open');
    resetStepper();
}

export function closeDrawer() {
    const drawer = document.getElementById('drawer');
    const scrim = document.getElementById('scrim');
    if (drawer) drawer.classList.remove('open');
    if (scrim) scrim.classList.remove('open');
}

export function initDrawerEvents() {
    const settingsBtn = document.getElementById('settingsBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const scrim = document.getElementById('scrim');
    const continueBtn = document.getElementById('continueBtn');
    const titleInput = document.getElementById('titleInput');
    const saveNewBtn = document.getElementById('saveNewBtn');
    const cancelNewBtn = document.getElementById('cancelNewBtn');
    const addAnotherBtn = document.getElementById('addAnotherBtn');
    const darkModeBtn = document.getElementById('darkModeBtn');
    const lightModeBtn = document.getElementById('lightModeBtn');
    const showDecreaseToggle = document.getElementById('showDecreaseToggle');

    if (settingsBtn) settingsBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (scrim) scrim.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
    });

    if (continueBtn) continueBtn.addEventListener('click', handleContinue);
    if (titleInput) {
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleContinue();
            }
        });
    }

    if (saveNewBtn) saveNewBtn.addEventListener('click', handleSaveNew);
    if (cancelNewBtn) cancelNewBtn.addEventListener('click', handleCancelNew);
    if (addAnotherBtn) addAnotherBtn.addEventListener('click', resetStepper);

    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            state.updateSettings({ theme: 'dark' });
            applyTheme('dark');
        });
    }

    if (lightModeBtn) {
        lightModeBtn.addEventListener('click', () => {
            state.updateSettings({ theme: 'light' });
            applyTheme('light');
        });
    }

    if (showDecreaseToggle) {
        showDecreaseToggle.addEventListener('change', (e) => {
            state.updateSettings({ showDecrease: e.target.checked });
        });
    }
}
