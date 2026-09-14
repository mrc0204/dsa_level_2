import { STORAGE_KEYS } from '../config/constants.js';

export function loadQuestions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to load questions from localStorage:', e);
        return [];
    }
}

export function saveQuestions(questions) {
    try {
        localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    } catch (e) {
        console.error('Failed to save questions to localStorage:', e);
    }
}

export function loadSettings() {
    const defaults = { theme: 'light', showDecrease: false };
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                theme: parsed.theme === 'dark' ? 'dark' : 'light',
                showDecrease: !!parsed.showDecrease
            };
        }
    } catch (e) {
        console.error('Failed to load settings from localStorage:', e);
    }
    return defaults;
}

export function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings to localStorage:', e);
    }
}
