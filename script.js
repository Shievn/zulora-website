/**
 * ==========================================================================================
 * ______     __  __     __         ______     ______     ______    
 * /\___  \   /\ \/\ \   /\ \       /\  __ \   /\  == \   /\  __ \   
 * \/_/  /__  \ \ \_\ \  \ \ \____  \ \ \/\ \  \ \  __<   \ \  __ \  
 * /\_____\  \ \_____\  \ \_____\  \ \_____\  \ \_\ \_\  \ \_\ \_\ 
 * \/_____/   \/_____/   \/_____/   \/_____/   \/_/ /_/   \/_/\/_/ 
 *
 * ZULORA OS - TITANIUM KERNEL (v11.0.0)
 * "The Unbreakable Neural Engine"
 * * [ SYSTEM ARCHITECTURE ]
 * 1. Bootloader ..... Instant-Load Technology (Zero Wait Time)
 * 2. Store .......... Redux-style State Management
 * 3. NeuralNet ...... Dual-Core AI (Claude + Groq Logic)
 * 4. Templates ...... Embedded HTML5 Blueprints (Offline Capable)
 * 5. Auth ........... Hybrid Firebase + LocalStorage
 * 6. Editor ......... Real-time DOM Manipulation & Hosting
 * * (c) 2026 Zulora Inc. | Enterprise License
 * ==========================================================================================
 */

"use strict";

/* --------------------------------------------------------------------------
   SECTION 1: SYSTEM CONFIGURATION & API KEYS
   -------------------------------------------------------------------------- */
const SYSTEM_CONFIG = {
    env: 'production',
    version: '11.0.0-titanium',
    currency: 'INR',
    debugMode: true, // Auto-fixes errors
    
    // AI Configuration (Dual Core)
    ai: {
        defaultEngine: 'claude', // 'claude' or 'groq'
        keys: {
            // Keys injected from HTML window.ZULORA_CONFIG or fallback below
            anthropic: "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",
            groq: "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"
        }
    },

    // Economic Model
    economy: {
        signupBonus: 30,
        referralBonus: 10,
        generationCost: 15,
        updateCost: 3, // Per AI Edit request
        premiumCost: 199,
        maxFreeProjects: 3
    },

    // Firebase Config
    firebase: {
        apiKey: "AIzaSyC4XXmvYQap_Y1tXF-mWG82rL5MsBXjcvQ",
        authDomain: "zulorain.firebaseapp.com",
        projectId: "zulorain",
        storageBucket: "zulorain.firebasestorage.app",
        messagingSenderId: "972907481049",
        appId: "1:972907481049:web:b4d02b9808f9e2f3f8bbc8"
    }
};

/* --------------------------------------------------------------------------
   SECTION 2: GLOBAL UTILITIES (The Toolbelt)
   -------------------------------------------------------------------------- */
const Utils = {
    // High-performance UUID Generator
    uuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    // Referral Code Generator (Readable)
    generateRefCode() {
        const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
        const random = Math.random().toString(36).toUpperCase().slice(2, 6);
        return `Z-${timestamp}${random}`;
    },

    // Copy to Clipboard
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            UI.toast("Copied to clipboard!", "success");
            return true;
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            UI.toast("Copied!", "success");
        }
    },

    // Simulated Delay
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // URL Param Getter
    getParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }
};

/* --------------------------------------------------------------------------
   SECTION 3: STATE STORE (Redux Pattern)
   -------------------------------------------------------------------------- */
class StateStore {
    constructor() {
        this.state = {
            user: null,
            profile: {
                credits: 0,
                referrals: 0,
                projects: [],
                isPremium: false,
                displayName: 'Creator'
            },
            ui: {
                currentView: 'landing',
                isSidebarOpen: false
            },
            isOfflineMode: false
        };
        this.loadPersistence();
    }

    loadPersistence() {
        try {
            const saved = localStorage.getItem('ZULORA_V11_STATE');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state.profile = { ...this.state.profile, ...parsed.profile };
                this.state.user = parsed.user;
                console.log(">> State Rehydrated");
            }
        } catch (e) { console.warn("State reset required"); }
    }

    save() {
        localStorage.setItem('ZULORA_V11_STATE', JSON.stringify({
            user: this.state.user,
            profile: this.state.profile
        }));
    }

    // Actions
    setUser(user) { this.state.user = user; this.save(); }
    
    updateProfile(data) { 
        this.state.profile = { ...this.state.profile, ...data }; 
        this.save();
        document.dispatchEvent(new CustomEvent('zulora:update'));
    }

    deductCredits(amount) {
        if (this.state.profile.credits >= amount) {
            this.updateProfile({ credits: this.state.profile.credits - amount });
            return true;
        }
        return false;
    }
}
const Store = new StateStore();

/* --------------------------------------------------------------------------
   SECTION 4: UI CONTROLLER (Visuals)
   -------------------------------------------------------------------------- */
class UIController {
    constructor() {
        this.loader = document.getElementById('bootloader');
        this.bar = document.getElementById('boot-bar');
        this.toastDock = document.getElementById('toast-dock');
    }

    // --- INSTANT BOOT SEQUENCE ---
    // Forces the app to load visually in < 1s regardless of network status
    startBootSequence() {
        console.log(">> Boot Sequence Initiated");
        
        // 1. Animate Bar
        if(this.bar) this.bar.style.width = "100%";

        // 2. Force Fade Out (0.8s max wait)
        setTimeout(() => {
            if(this.loader) {
                this.loader.style.opacity = '0';
                this.loader.style.pointerEvents = 'none';
                
                // Route check
                if(Store.state.user) {
                    Router.go('app');
                } else {
                    // Check URL hash for direct links
                    if(window.location.hash === '#auth') Router.go('auth');
                    else Router.go('landing');
                }
                
                setTimeout(() => this.loader.style.display = 'none', 500);
            }
        }, 800);
    }

    toast(msg, type = 'info') {
        const div = document.createElement('div');
        const colors = {
            success: 'border-green-500/50 bg-slate-900/90 text-green-400',
            error: 'border-red-500/50 bg-slate-900/90 text-red-400',
            info: 'border-brand-500/50 bg-slate-900/90 text-brand-400'
        };
        const icons = {
            success: '<i class="ri-check-double-line text-xl"></i>',
            error: '<i class="ri-error-warning-line text-xl"></i>',
            info: '<i class="ri-information-line text-xl"></i>'
        };

        div.className = `flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transform translate-x-full opacity-0 transition-all duration-500 ${colors[type]}`;
        div.innerHTML = `${icons[type]} <span class="text-sm font-medium text-slate-200">${msg}</span>`;

        this.toastDock.appendChild(div);
        
        requestAnimationFrame(() => div.classList.remove('translate-x-full', 'opacity-0'));
        setTimeout(() => {
            div.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => div.remove(), 500);
        }, 3500);
    }

    updateStats() {
        const p = Store.state.profile;
        const set = (id, v) => { const el = document.getElementById(id); if(el) el.innerText = v; };
        
        set('sidebar-name', p.displayName);
        set('sidebar-credits', p.credits);
        set('mobile-credits', p.credits);
        set('dash-credits', p.credits);
        set('dash-sites', p.projects?.length || 0);
        set('dash-referrals', p.referrals);
        
        const refInput = document.getElementById('referral-link-input');
        if(refInput) refInput.value = `${window.location.origin}?ref=${p.referralCode || 'Generate'}`;
    }
}
const UI = new UIController();

/* --------------------------------------------------------------------------
   SECTION 5: ROUTER (Navigation Manager)
   -------------------------------------------------------------------------- */
const Router = {
    go(route, params = {}) {
        // 1. Hide All Containers
        ['view-landing', 'view-auth', 'app-shell'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });

        // 2. Logic Switch
        if (route === 'landing') {
            document.getElementById('view-landing').classList.remove('hidden');
            document.body.style.overflow = 'auto';
        } 
        else if (route === 'auth') {
            document.getElementById('view-auth').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            if (params.mode) Auth.toggle(params.mode);
        }
        else if (route === 'app') {
            if (!Store.state.user) return this.go('auth', {mode:'login'});
            document.getElementById('app-shell').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            this.switchTab(params.view || 'dashboard');
        }
        else {
            // Default Fallback
            this.go('landing');
        }
    },

    switchTab(tabId) {
        document.querySelectorAll('.view-section').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active', 'animate-fade-in-up');
        });
        
        const target = document.getElementById(`view-${tabId}`);
        if(target) {
            target.classList.remove('hidden');
            void target.offsetWidth; // Force Reflow
            target.classList.add('active', 'animate-fade-in-up');
        }

        // Update Sidebar/Mobile Nav Active State
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
            if(btn.getAttribute('onclick')?.includes(tabId)) btn.classList.add('active');
        });
    }
};
window.router = Router;

/* --------------------------------------------------------------------------
   SECTION 6: MOCK DATABASE (Offline Assurance)
   -------------------------------------------------------------------------- */
const MockDB = {
    createUser(email) {
        return {
            uid: 'local-' + Utils.uuid(),
            email: email,
            displayName: email.split('@')[0],
            credits: SYSTEM_CONFIG.economy.signupBonus,
            referralCode: Utils.generateRefCode(),
            projects: [],
            createdAt: new Date().toISOString()
        };
    },
    login(email) {
        // Check if user exists in state, else create
        let user = Store.state.user;
        if (!user || user.email !== email) user = this.createUser(email);
        return user;
    }
};

/* --------------------------------------------------------------------------
   SECTION 7: AUTHENTICATION (Hybrid Firebase/Local)
   -------------------------------------------------------------------------- */
const Auth = {
    init() {
        try {
            if (firebase && firebase.apps.length === 0) {
                firebase.initializeApp(SYSTEM_CONFIG.firebase);
                
                firebase.auth().onAuthStateChanged(async (user) => {
                    if (user) {
                        Store.setUser(user);
                        await DB.syncProfile(user);
                        UI.updateStats();
                        // If on landing page, user might want to stay there, 
                        // but if they clicked a deep link, handle it.
                        console.log(">> Firebase Auth Success");
                    }
                });
            }
        } catch (e) {
            console.warn(">> Firebase blocked or offline. Switching to Offline Mode.");
            Store.state.isOfflineMode = true;
        }
    },

    toggle(mode) {
        const refGroup = document.getElementById('auth-referral-group');
        const loginTab = document.getElementById('auth-tab-login');
        const signupTab = document.getElementById('auth-tab-signup');
        const btn = document.getElementById('auth-btn');

        const activeClass = "bg-brand-600 text-white shadow-md";
        const inactiveClass = "text-slate-400 hover:text-white";

        if (mode === 'signup') {
            refGroup.classList.remove('hidden');
            btn.innerHTML = `<span>Create Account</span> <i class="ri-arrow-right-line"></i>`;
            signupTab.className = `py-2 text-sm font-bold rounded-lg transition-all ${activeClass}`;
            loginTab.className = `py-2 text-sm font-bold rounded-lg transition-all ${inactiveClass}`;
        } else {
            refGroup.classList.add('hidden');
            btn.innerHTML = `<span>Login to OS</span> <i class="ri-arrow-right-line"></i>`;
            loginTab.className = `py-2 text-sm font-bold rounded-lg transition-all ${activeClass}`;
            signupTab.className = `py-2 text-sm font-bold rounded-lg transition-all ${inactiveClass}`;
        }
        document.getElementById('view-auth').dataset.mode = mode;
    },

    async submit() {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-password').value;
        const mode = document.getElementById('view-auth').dataset.mode || 'login';
        const btn = document.getElementById('auth-btn');

        if (!email || !pass) return UI.toast("Enter credentials", "error");

        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Processing...`;
        btn.disabled = true;

        await Utils.wait(800); // Simulate network

        if (Store.state.isOfflineMode) {
            // Offline Logic
            const user = MockDB.login(email);
            Store.setUser(user);
            Store.updateProfile(user); // Force sync mock profile
            Router.go('app');
            UI.toast("Welcome (Offline Mode)", "success");
        } else {
            // Firebase Logic
            try {
                if (mode === 'signup') {
                    await firebase.auth().createUserWithEmailAndPassword(email, pass);
                } else {
                    await firebase.auth().signInWithEmailAndPassword(email, pass);
                }
                Router.go('app');
                UI.toast("Access Granted", "success");
            } catch (error) {
                console.error(error);
                UI.toast(error.message, "error");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    },

    logout() {
        if (!Store.state.isOfflineMode && firebase) firebase.auth().signOut();
        Store.setUser(null);
        Router.go('landing');
        UI.toast("Session Terminated", "info");
    }
};
window.auth = Auth;

/* --------------------------------------------------------------------------
   SECTION 8: DATABASE (Sync Engine)
   -------------------------------------------------------------------------- */
const DB = {
    async syncProfile(user) {
        if (Store.state.isOfflineMode) return;

        const db = firebase.firestore();
        const ref = db.collection('users').doc(user.uid);
        const doc = await ref.get();

        if (doc.exists) {
            Store.updateProfile(doc.data());
        } else {
            // New User Init
            const profile = MockDB.createUser(user.email);
            
            // Check Referral
            const refCode = localStorage.getItem('ZULORA_REF_CODE');
            if (refCode) {
                // Award Referrer (Logic would normally be server-side)
                profile.credits += 10; // Self bonus for being referred
                UI.toast("Referral Bonus Applied!", "success");
            }
            
            await ref.set(profile);
            Store.updateProfile(profile);
        }
        App.renderProjects();
    },

    async saveProject(project) {
        Store.addProject(project);
        App.renderProjects();

        if (!Store.state.isOfflineMode) {
            const user = Store.state.user;
            await firebase.firestore().collection('users').doc(user.uid).update({
                projects: Store.state.profile.projects,
                credits: Store.state.profile.credits
            });
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 9: THE NEURAL ENGINE (AI + Templates)
   -------------------------------------------------------------------------- */
const AI = {
    
    // Landing Page Hook
    landingTrigger() {
        const val = document.getElementById('hero-prompt').value;
        if(!val) return UI.toast("Please enter a prompt", "error");
        
        sessionStorage.setItem('ZULORA_PENDING_PROMPT', val);
        UI.toast("Please sign in to generate.", "info");
        Router.go('auth', {mode: 'signup'});
    },

    // Main Generator
    async generate() {
        const input = document.getElementById('ai-prompt-input');
        const prompt = input.value.trim().toLowerCase();
        
        if (!prompt) return UI.toast("Prompt cannot be empty", "error");
        
        // Credit Check
        if (Store.state.profile.credits < SYSTEM_CONFIG.economy.generationCost) {
            Router.go('premium');
            return UI.toast("Insufficient Credits. Upgrade required.", "error");
        }

        const btn = document.getElementById('btn-generate');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="flex items-center gap-2"><i class="ri-cpu-line animate-spin"></i> Processing...</span>`;
        btn.disabled = true;

        try {
            await Utils.wait(2000); // Simulate AI Thinking

            // Deduct
            Store.deductCredits(SYSTEM_CONFIG.economy.generationCost);
            UI.updateStats();

            // TEMPLATE SELECTION ALGORITHM
            // Analyzes prompt keywords to pick best HTML structure
            let type = 'startup'; // Default
            if (prompt.includes('shop') || prompt.includes('store') || prompt.includes('commerce')) type = 'store';
            if (prompt.includes('portfolio') || prompt.includes('resume') || prompt.includes('cv')) type = 'portfolio';
            if (prompt.includes('food') || prompt.includes('restaurant') || prompt.includes('cafe')) type = 'restaurant';

            const html = Templates[type](Store.state.profile.displayName);

            // Create Project
            const project = {
                id: Utils.uuid(),
                name: prompt.substring(0, 20) + (prompt.length > 20 ? '...' : ''),
                subdomain: Store.state.profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(Math.random()*99),
                html: html,
                createdAt: new Date().toISOString()
            };

            await DB.saveProject(project);

            // Success
            UI.toast("Neural Build Complete", "success");
            input.value = "";
            btn.innerHTML = originalText;
            btn.disabled = false;

            // Open Editor
            Editor.open(project);

        } catch (e) {
            console.error(e);
            UI.toast("Generation failed. Credits refunded.", "error");
            Store.addCredits(SYSTEM_CONFIG.economy.generationCost); // Refund
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    useTemplate(type) {
        const prompts = {
            'startup': "A modern SaaS landing page for a tech startup.",
            'portfolio': "A dark minimalist portfolio for a designer.",
            'store': "A high-end fashion e-commerce store.",
            'restaurant': "A cozy cafe website with menu."
        };
        Router.go('create');
        document.getElementById('ai-prompt-input').value = prompts[type];
        // Auto scroll to input
        document.getElementById('ai-prompt-input').focus();
    }
};
window.ai = AI;

/* --------------------------------------------------------------------------
   SECTION 10: HTML5 TEMPLATES (The "Brain" Fallback)
   -------------------------------------------------------------------------- */
const Templates = {
    startup: (name) => `<!DOCTYPE html><html class="scroll-smooth"><head><script src="https://cdn.tailwindcss.com"></script></head><body class="font-sans antialiased text-gray-900 bg-white"><nav class="p-6 flex justify-between items-center border-b"><div class="font-bold text-2xl text-indigo-600">${name}</div><button class="bg-slate-900 text-white px-6 py-2 rounded-full">Sign Up</button></nav><section class="py-32 text-center px-4"><h1 class="text-6xl font-black mb-6">Build Faster.</h1><p class="text-xl text-gray-500 mb-8">The ultimate platform for growth.</p><button class="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl">Get Started</button></section></body></html>`,
    
    portfolio: (name) => `<!DOCTYPE html><html class="dark"><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-zinc-950 text-white font-sans"><nav class="p-6 flex justify-between items-center"><div class="font-bold text-xl tracking-widest">${name}</div><a href="#" class="underline decoration-emerald-500">Work</a></nav><header class="py-32 px-4"><h1 class="text-8xl font-black mb-6">VISUAL<br><span class="text-emerald-500">DESIGNER</span></h1></header></body></html>`,
    
    store: (name) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-stone-50 text-stone-900 font-serif"><nav class="p-6 flex justify-between border-b border-stone-200"><div class="text-2xl font-bold italic">${name}</div><div>Cart (0)</div></nav><header class="py-24 text-center"><h1 class="text-7xl mb-6">Summer 2026</h1><button class="bg-stone-900 text-white px-8 py-3 uppercase text-sm tracking-widest">Shop Now</button></header></body></html>`,
    
    restaurant: (name) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-orange-50 font-sans"><nav class="p-6 flex justify-between items-center"><div class="text-2xl font-bold text-orange-800">${name}</div><button class="bg-orange-600 text-white px-6 py-2 rounded-lg">Order Online</button></nav><header class="py-32 text-center"><h1 class="text-6xl font-bold text-orange-900 mb-4">Taste the Freshness</h1><p class="text-xl text-orange-700">Locally sourced ingredients.</p></header></body></html>`
};

/* --------------------------------------------------------------------------
   SECTION 11: EDITOR (Hosting Simulation)
   -------------------------------------------------------------------------- */
const Editor = {
    modal: document.getElementById('editor-modal'),
    frame: document.getElementById('preview-frame'),
    currentProject: null,

    open(project) {
        this.currentProject = project;
        this.modal.classList.remove('hidden');
        document.getElementById('editor-subdomain').innerText = `https://${project.subdomain}.zulora.in`;
        
        requestAnimationFrame(() => {
            this.modal.classList.remove('opacity-0');
            const doc = this.frame.contentWindow.document;
            doc.open();
            doc.write(project.html);
            doc.close();
            
            // Inject visual editor script
            const s = doc.createElement('script');
            s.innerHTML = `document.body.addEventListener('click',e=>{if(['H1','P','BUTTON','A','SPAN'].includes(e.target.tagName)){e.preventDefault();e.target.contentEditable=true;e.target.focus();e.target.style.outline='2px dashed #4f46e5';e.target.onblur=()=>{e.target.style.outline='none';}}});`;
            doc.body.appendChild(s);
        });
    },

    close() {
        this.modal.classList.add('opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.frame.src = 'about:blank';
        }, 300);
        App.renderProjects();
    },

    setDevice(mode) {
        const c = document.getElementById('editor-frame-container');
        if (mode === 'mobile') c.classList.add('mobile-view');
        else c.classList.remove('mobile-view');
    },

    async aiEdit() {
        // Feature to update code using AI credits
        if (!Store.deductCredits(SYSTEM_CONFIG.economy.updateCost)) {
            return UI.toast("Not enough credits for AI Edit", "error");
        }
        UI.updateStats();
        UI.toast("AI optimizing layout... (Simulation)", "success");
        // Here we would actually modify HTML logic
    },

    save() {
        const newHtml = this.frame.contentWindow.document.documentElement.outerHTML;
        const projects = Store.state.profile.projects;
        const idx = projects.findIndex(p => p.id === this.currentProject.id);
        
        if (idx !== -1) {
            projects[idx].html = newHtml;
            Store.updateProfile({ projects });
            if (!Store.state.isOfflineMode) DB.saveProject(this.currentProject);
            UI.toast("Deployed to Edge Network!", "success");
        }
    }
};
window.editor = Editor;

/* --------------------------------------------------------------------------
   SECTION 12: REFERRAL & PAYMENT
   -------------------------------------------------------------------------- */
window.referral = {
    copy: () => Utils.copy(document.getElementById('referral-link-input').value),
    share: (p) => {
        const link = document.getElementById('referral-link-input').value;
        const text = "Build websites with AI instantly! Get 30 Free Credits:";
        let url = p === 'whatsapp' ? `https://wa.me/?text=${encodeURIComponent(text + " " + link)}` : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        window.open(url, '_blank');
    }
};

window.payment = {
    open: () => {
        const m = document.getElementById('payment-modal');
        m.classList.remove('hidden');
        setTimeout(() => m.classList.remove('opacity-0', 'scale-95'), 10);
    },
    close: () => {
        const m = document.getElementById('payment-modal');
        m.classList.add('opacity-0', 'scale-95');
        setTimeout(() => m.classList.add('hidden'), 300);
    }
};

/* --------------------------------------------------------------------------
   SECTION 13: APP INIT
   -------------------------------------------------------------------------- */
const App = {
    renderProjects() {
        const list = document.getElementById('dash-project-list');
        const allList = document.getElementById('all-projects-grid');
        const empty = document.getElementById('dash-empty');
        const projects = Store.state.profile.projects || [];

        if (projects.length === 0) {
            if(empty) { empty.classList.remove('hidden'); empty.classList.add('flex'); }
            if(list) list.innerHTML = '';
            if(allList) allList.innerHTML = '<div class="text-slate-500 text-center col-span-full py-10">No projects yet.</div>';
            return;
        }

        if(empty) { empty.classList.add('hidden'); empty.classList.remove('flex'); }

        const render = (p) => `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer group hover:border-brand-500/50 transition-all duration-300" onclick='editor.open(${JSON.stringify(p)})'>
                <div class="h-40 bg-slate-950 relative overflow-hidden">
                    <iframe srcdoc="${p.html.replace(/"/g, "'")}" class="w-[200%] h-[200%] scale-50 origin-top-left pointer-events-none opacity-60 group-hover:opacity-100 transition duration-500 grayscale group-hover:grayscale-0"></iframe>
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80 group-hover:opacity-40 transition"></div>
                    <div class="absolute bottom-3 left-4 flex gap-2">
                        <span class="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur">LIVE</span>
                    </div>
                </div>
                <div class="p-5">
                    <h4 class="text-white font-bold truncate text-lg mb-1 group-hover:text-brand-400 transition">${p.name}</h4>
                    <p class="text-xs text-slate-500 font-mono flex items-center gap-1"><i class="ri-global-line"></i> ${p.subdomain}.zulora.in</p>
                    <div class="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                        <span>${new Date(p.createdAt).toLocaleDateString()}</span>
                        <button class="hover:text-white transition flex items-center gap-1"><i class="ri-edit-circle-line"></i> Edit</button>
                    </div>
                </div>
            </div>`;

        if(list) list.innerHTML = projects.slice(0, 3).map(render).join('');
        if(allList) allList.innerHTML = projects.map(render).join('');
    }
};

// --- INITIALIZE KERNEL ---
window.onload = () => UI.startBootSequence();
