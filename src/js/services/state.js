import { loadQuestions, saveQuestions, loadSettings, saveSettings } from './storage.js';
import {
    isSupabaseConfigured,
    fetchQuestions,
    insertQuestion,
    updateQuestion,
    deleteQuestion,
    fetchQuestionRequests,
    insertQuestionRequest,
    updateQuestionRequestStatus
} from './supabase.js';

class StateManager {
    constructor() {
        this.questions = [];
        this.requests = [];
        this.settings = { theme: 'dark', showDecrease: false };
        this.role = sessionStorage.getItem('dsaVault.role') || 'user'; // 'user' | 'admin'
        this.listeners = [];
        this.isSupabaseActive = isSupabaseConfigured;
    }

    async init() {
        this.settings = loadSettings();
        if (this.isSupabaseActive) {
            const remoteQuestions = await fetchQuestions();
            if (remoteQuestions && remoteQuestions.length > 0) {
                this.questions = remoteQuestions;
                saveQuestions(this.questions);
            } else {
                this.questions = loadQuestions();
            }
            await this.loadRequests();
        } else {
            this.questions = loadQuestions();
            const storedRequests = localStorage.getItem('dsaVault.requests');
            this.requests = storedRequests ? JSON.parse(storedRequests) : [];
        }
        this.notify();
    }

    setRole(role) {
        this.role = role;
        sessionStorage.setItem('dsaVault.role', role);
        this.notify();
    }

    async loadRequests() {
        if (this.isSupabaseActive) {
            this.requests = await fetchQuestionRequests();
        } else {
            const storedRequests = localStorage.getItem('dsaVault.requests');
            this.requests = storedRequests ? JSON.parse(storedRequests) : [];
        }
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this));
    }

    setQuestions(questions) {
        this.questions = questions;
        saveQuestions(this.questions);
        this.notify();
    }

    async addQuestion(item) {
        this.questions.push(item);
        saveQuestions(this.questions);
        this.notify();

        if (this.isSupabaseActive) {
            const inserted = await insertQuestion(item);
            if (inserted && inserted.id) {
                item.id = inserted.id;
                saveQuestions(this.questions);
                this.notify();
            }
        }
    }

    async submitQuestionRequest(item) {
        const requestItem = {
            id: 'req_' + Date.now(),
            title: item.title,
            titleKey: item.titleKey || item.title.toLowerCase().replace(/[^a-z0-9]/g, ''),
            description: item.description || '',
            category: item.category,
            requestedBy: item.requestedBy || 'User',
            status: 'pending',
            createdAt: Date.now()
        };

        if (this.isSupabaseActive) {
            const inserted = await insertQuestionRequest(requestItem);
            if (inserted && inserted.id) {
                requestItem.id = inserted.id;
            }
        }

        this.requests.unshift(requestItem);
        if (!this.isSupabaseActive) {
            localStorage.setItem('dsaVault.requests', JSON.stringify(this.requests));
        }
        this.notify();
        return requestItem;
    }

    async approveRequest(requestId) {
        const reqIndex = this.requests.findIndex(r => r.id === requestId);
        if (reqIndex === -1) return null;

        const req = this.requests[reqIndex];
        this.requests.splice(reqIndex, 1);
        if (!this.isSupabaseActive) {
            localStorage.setItem('dsaVault.requests', JSON.stringify(this.requests));
        }

        if (this.isSupabaseActive) {
            await updateQuestionRequestStatus(requestId, 'approved');
        }

        // Check if an existing question matches this title
        const reqTitleKey = req.titleKey || req.title.trim().toLowerCase().replace(/\s+/g, ' ');
        const existing = this.questions.find(q => q.titleKey === reqTitleKey || q.title.trim().toLowerCase() === req.title.trim().toLowerCase());

        if (existing) {
            await this.updateQuestion(existing.id, q => q.count++);
            return { ...existing, isEncounterIncrement: true };
        } else {
            const newQuestion = {
                id: req.id,
                title: req.title,
                titleKey: reqTitleKey,
                description: req.description,
                category: req.category,
                count: 1,
                addedAt: Date.now()
            };
            await this.addQuestion(newQuestion);
            return newQuestion;
        }
    }

    async rejectRequest(requestId) {
        const reqIndex = this.requests.findIndex(r => r.id === requestId);
        if (reqIndex !== -1) {
            const rejected = this.requests.splice(reqIndex, 1)[0];
            if (!this.isSupabaseActive) {
                localStorage.setItem('dsaVault.requests', JSON.stringify(this.requests));
            }
            this.notify();

            if (this.isSupabaseActive) {
                await updateQuestionRequestStatus(requestId, 'rejected');
            }
            return rejected;
        }
        return null;
    }

    async updateQuestion(id, updater) {
        const item = this.questions.find(q => q.id === id);
        if (item) {
            updater(item);
            saveQuestions(this.questions);
            this.notify();

            if (this.isSupabaseActive) {
                await updateQuestion(id, {
                    title: item.title,
                    titleKey: item.titleKey,
                    description: item.description,
                    category: item.category,
                    count: item.count
                });
            }
        }
    }

    async deleteQuestion(id) {
        const idx = this.questions.findIndex(q => q.id === id);
        if (idx !== -1) {
            const deleted = this.questions.splice(idx, 1)[0];
            saveQuestions(this.questions);
            this.notify();

            if (this.isSupabaseActive) {
                await deleteQuestion(id);
            }
            return deleted;
        }
        return null;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        saveSettings(this.settings);
        this.notify();
    }
}

export const state = new StateManager();
