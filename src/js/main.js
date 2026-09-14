import { state } from './services/state.js';
import { applyTheme } from './utils/dom.js';
import { populateCategoryFilter, initToolbarEvents } from './components/toolbar.js';
import { populateCategoryInput, initDrawerEvents } from './components/drawer.js';
import { renderGrid, initGridEvents } from './components/grid.js';
import { renderAdminHeader, initAdminEvents } from './components/admin.js';

async function initApp() {
    // 1. Initialize State from LocalStorage / Supabase
    await state.init();

    // 2. Populate Dropdowns
    populateCategoryFilter();
    populateCategoryInput();

    // 3. Apply Saved Settings & Theme
    applyTheme(state.settings.theme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const nextTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
            state.updateSettings({ theme: nextTheme });
            applyTheme(nextTheme);
        });
    }

    // 4. Render Admin Controls & Header
    renderAdminHeader();

    // 5. Initialize Event Listeners
    initToolbarEvents();
    initGridEvents();
    initAdminEvents();

    // 6. Subscribe Render function to state changes
    state.subscribe(() => {
        renderGrid();
        renderAdminHeader();
        applyTheme(state.settings.theme);
    });

    // 7. Initial Render
    renderGrid();
}

document.addEventListener('DOMContentLoaded', initApp);
