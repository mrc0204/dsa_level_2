import { loadQuestions, saveQuestions, loadSettings, saveSettings } from './storage.js';
import {
    isSupabaseConfigured,
    fetchQuestions,
    insertQuestion,
    updateQuestion,
    deleteQuestion,
    fetchQuestionRequests,
    insertQuestionRequest,
    updateQuestionRequestStatus,
    registerAppUser,
    loginAppUser,
    fetchUserProgress,
    toggleUserProgress
} from './supabase.js';

class StateManager {
    constructor() {
        this.questions = [];
        this.requests = [];
        this.settings = { theme: 'light', showDecrease: false };
        this.role = sessionStorage.getItem('dsaVault.role') || 'user'; // 'user' | 'admin'
        
        // Restore user portal session
        const storedUser = localStorage.getItem('dsaVault.currentUser');
        this.currentUser = storedUser ? JSON.parse(storedUser) : null;
        this.userProgress = new Set();

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

        if (this.currentUser) {
            await this.loadUserProgress();
        }

        this.notify();
    }

    async loadUserProgress() {
        if (!this.currentUser) return;
        const niatId = this.currentUser.niatId;
        if (this.isSupabaseActive) {
            const completedIds = await fetchUserProgress(niatId);
            this.userProgress = new Set(completedIds);
        } else {
            const localKey = `dsaVault.progress.${niatId}`;
            const stored = localStorage.getItem(localKey);
            this.userProgress = new Set(stored ? JSON.parse(stored) : []);
        }
        this.notify();
    }

    async setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            localStorage.setItem('dsaVault.currentUser', JSON.stringify(user));
            await this.loadUserProgress();
        } else {
            localStorage.removeItem('dsaVault.currentUser');
            this.userProgress.clear();
        }
        this.notify();
    }

    async logoutUser() {
        await this.setCurrentUser(null);
    }

    async registerUser(niatId, password) {
        if (this.isSupabaseActive) {
            const res = await registerAppUser(niatId, password);
            if (res.success) {
                await this.setCurrentUser(res.user);
            }
            return res;
        } else {
            // Local fallback
            const userKey = `dsaVault.user.${niatId.trim().toUpperCase()}`;
            if (localStorage.getItem(userKey)) {
                return { success: false, error: 'NIAT ID is already registered.' };
            }
            const user = { niatId: niatId.trim().toUpperCase() };
            localStorage.setItem(userKey, JSON.stringify({ ...user, password }));
            await this.setCurrentUser(user);
            return { success: true, user };
        }
    }

    async loginUser(niatId, password) {
        if (this.isSupabaseActive) {
            const res = await loginAppUser(niatId, password);
            if (res.success) {
                await this.setCurrentUser(res.user);
            }
            return res;
        } else {
            // Local fallback
            const userKey = `dsaVault.user.${niatId.trim().toUpperCase()}`;
            const stored = localStorage.getItem(userKey);
            if (!stored) {
                return { success: false, error: 'User not found. Please register first.' };
            }
            const parsed = JSON.parse(stored);
            if (parsed.password !== password) {
                return { success: false, error: 'Incorrect password.' };
            }
            const user = { niatId: parsed.niatId };
            await this.setCurrentUser(user);
            return { success: true, user };
        }
    }

    async toggleQuestionCompletion(questionId) {
        if (!this.currentUser) return;
        const qIdStr = String(questionId);
        const isCurrentlyCompleted = this.userProgress.has(qIdStr);
        const newStatus = !isCurrentlyCompleted;

        if (newStatus) {
            this.userProgress.add(qIdStr);
        } else {
            this.userProgress.delete(qIdStr);
        }
        this.notify();

        if (this.isSupabaseActive) {
            await toggleUserProgress(this.currentUser.niatId, questionId, newStatus);
        } else {
            const localKey = `dsaVault.progress.${this.currentUser.niatId}`;
            localStorage.setItem(localKey, JSON.stringify(Array.from(this.userProgress)));
        }
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
        if (!item.id) {
            item.id = 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        }
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
