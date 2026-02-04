/**
 * ==========================================================================================
 * ZULORA OS - TITANIUM KERNEL (v12.0.0)
 * "The Unbreakable Neural Engine"
 * * [ SYSTEM ARCHITECTURE ]
 * 1. Bootloader ..... Instant-Load Technology (Zero Wait Time)
 * 2. Store .......... Redux-style State Management (Persistent)
 * 3. Auth ........... Google Firebase + Session Persistence
 * 4. Router ......... SPA Navigation (No Reloads)
 * 5. NeuralNet ...... Hybrid Template Engine (Offline Capable)
 * 6. UI ............. Toasts, Sidebar, Modals, DOM Manipulator
 * * (c) 2026 Zulora Inc. | Enterprise License
 * ==========================================================================================
 */

"use strict";

/* --------------------------------------------------------------------------
   SECTION 1: SYSTEM CONFIGURATION
   -------------------------------------------------------------------------- */
// Load config injected from HTML
const ENV_CONFIG = window.ZULORA_CONFIG || {};

const SYSTEM = {
    version: '12.0.0-titanium',
    debug: true,
    
    // Credit Economy
    economy: {
        signupBonus: 30,      // Given on first login
        referralReward: 15,   // Updated as per request (15 Credits)
        generationCost: 15,   // Cost to build a site
        aiEditCost: 3,        // Cost to edit via AI
        premiumCost: 199,     // INR
        premiumCredits: 1000  // Monthly credits for Pro
    },

    // Support Links
    support: ENV_CONFIG.admin || {}
};

/* --------------------------------------------------------------------------
   SECTION 2: GLOBAL UTILITIES
   -------------------------------------------------------------------------- */
const Utils = {
    // Generate UUID
    uuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    // Generate Referral Code
    generateRefCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'ZUL-';
        for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    },

    // Clipboard
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            UI.toast("Copied to clipboard!", "success");
        } catch (err) {
            // Fallback
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            UI.toast("Copied!", "success");
        }
    },

    // Delay
    wait(ms) { return new Promise(r => setTimeout(resolve, ms)); },

    // Get URL Param
    getParam(name) { return new URLSearchParams(window.location.search).get(name); },

    // Open External Link
    openLink(type) {
        const links = {
            whatsapp: `https://wa.me/${SYSTEM.support.whatsapp}`,
            instagram: SYSTEM.support.instagram,
            email: `mailto:${SYSTEM.support.email}`
        };
        if(links[type]) window.open(links[type], '_blank');
    }
};

/* --------------------------------------------------------------------------
   SECTION 3: STATE STORE (REDUX PATTERN)
   -------------------------------------------------------------------------- */
class StateStore {
    constructor() {
        this.state = {
            user: null, // Firebase User
            profile: {
                credits: 0,
                referrals: 0,
                projects: [],
                isPremium: false,
                displayName: 'Guest',
                photoURL: null,
                referralCode: 'LOADING'
            },
            isOffline: false
        };
        this.loadPersistence();
    }

    loadPersistence() {
        try {
            const saved = localStorage.getItem('ZULORA_V12_STATE');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state.profile = { ...this.state.profile, ...parsed.profile };
                console.log(">> [Store] Hydrated from LocalStorage");
            }
        } catch (e) { console.warn("State reset"); }
    }

    save() {
        try {
            localStorage.setItem('ZULORA_V12_STATE', JSON.stringify({
                profile: this.state.profile
            }));
        } catch (e) {}
    }

    // Actions
    setUser(user) { 
        this.state.user = user; 
        // We trigger UI updates when user changes
        UI.updateAuthUI();
    }

    updateProfile(data) {
        this.state.profile = { ...this.state.profile, ...data };
        this.save();
        UI.updateStats(); // Refresh credits, name, etc.
    }

    deductCredits(amount) {
        if (this.state.profile.credits >= amount) {
            this.updateProfile({ credits: this.state.profile.credits - amount });
            // Sync DB logic handled in DB Service
            return true;
        }
        return false;
    }
}
const Store = new StateStore();

/* --------------------------------------------------------------------------
   SECTION 4: UI CONTROLLER (VISUALS)
   -------------------------------------------------------------------------- */
class UIController {
    constructor() {
        this.loader = document.getElementById('bootloader');
        this.toastDock = document.getElementById('toast-dock');
    }

    // --- INSTANT BOOT (Fixes "Too much time loading") ---
    boot() {
        console.log(">> [UI] Booting System...");
        // Animate bar
        const bar = document.getElementById('boot-bar');
        if(bar) bar.style.width = '100%';

        // Hide loader quickly (500ms max)
        setTimeout(() => {
            if(this.loader) {
                this.loader.style.opacity = '0';
                this.loader.style.pointerEvents = 'none';
                setTimeout(() => this.loader.style.display = 'none', 500);
            }
        }, 500);
    }

    // Toast Notifications
    toast(msg, type = 'info') {
        const el = document.createElement('div');
        const configs = {
            success: { icon: 'ri-checkbox-circle-fill', color: 'text-green-400', border: 'border-green-500/30' },
            error:   { icon: 'ri-error-warning-fill',   color: 'text-red-400',   border: 'border-red-500/30' },
            info:    { icon: 'ri-information-fill',     color: 'text-brand-400', border: 'border-brand-500/30' },
            gold:    { icon: 'ri-vip-crown-fill',       color: 'text-yellow-400', border: 'border-yellow-500/30' }
        };
        const cfg = configs[type] || configs.info;

        el.className = `flex items-center gap-3 px-4 py-3 bg-slate-900/90 backdrop-blur-xl border ${cfg.border} rounded-xl shadow-2xl animate-toast-enter min-w-[300px] pointer-events-auto`;
        el.innerHTML = `
            <i class="${cfg.icon} ${cfg.color} text-xl"></i>
            <span class="text-sm font-medium text-slate-200">${msg}</span>
        `;

        this.toastDock.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(100%)';
            setTimeout(() => el.remove(), 300);
        }, 4000);
    }

    // Update Nav Bar based on Auth State
    updateAuthUI() {
        const loggedOutNav = document.getElementById('nav-auth-logged-out');
        const loggedInNav = document.getElementById('nav-auth-logged-in');
        
        if (Store.state.user) {
            if(loggedOutNav) loggedOutNav.classList.add('hidden');
            if(loggedInNav) loggedInNav.classList.remove('hidden');
            this.updateStats(); // Fill data
        } else {
            if(loggedOutNav) loggedOutNav.classList.remove('hidden');
            if(loggedInNav) loggedInNav.classList.add('hidden');
        }
    }

    // Update Text Data across the app
    updateStats() {
        const p = Store.state.profile;
        const setText = (id, txt) => {
            const el = document.getElementById(id);
            if(el) el.innerText = txt;
        };

        // Navbar
        setText('nav-user-name', p.displayName);
        setText('nav-user-credits', `${p.credits} Credits`);

        // Sidebar Drawer
        setText('sidebar-drawer-name', p.displayName);
        setText('sidebar-drawer-email', Store.state.user?.email || '');
        setText('sidebar-drawer-credits', p.credits);
        
        // Sidebar Avatar
        const avatarEls = document.querySelectorAll('#sidebar-avatar');
        avatarEls.forEach(el => {
            if(p.photoURL) {
                el.innerHTML = `<img src="${p.photoURL}" class="w-full h-full object-cover">`;
            } else {
                el.innerHTML = p.displayName.charAt(0).toUpperCase();
            }
        });

        // Dashboard Stats
        setText('dash-credits', p.credits);
        setText('dash-credits-lg', p.credits);
        setText('dash-sites', p.projects?.length || 0);
        setText('dash-referrals', p.referrals);

        // Referral Input
        const refInput = document.getElementById('referral-link-input');
        if(refInput) refInput.value = `${window.location.origin}?ref=${p.referralCode}`;
    }
}
const UI = new UIController();

/* --------------------------------------------------------------------------
   SECTION 5: ROUTER (NAVIGATION)
   -------------------------------------------------------------------------- */
class Router {
    constructor() {
        this.landing = document.getElementById('view-landing');
        this.appShell = document.getElementById('app-shell');
    }

    go(route, params = {}) {
        // Close sidebar if open
        Sidebar.close();

        // 1. Landing Page
        if (route === 'home' || route === 'landing') {
            this.landing.classList.remove('hidden');
            this.appShell.classList.add('hidden');
            document.body.style.overflow = 'auto';
            // If logged in, we might want to stay on landing until they click dashboard
        }
        // 2. App Views (Dashboard, Create, etc.)
        else {
            // Auth Check
            if (!Store.state.user && !Store.state.isOffline) {
                // Save intended route
                sessionStorage.setItem('ZULORA_REDIRECT', route);
                Auth.openModal();
                return;
            }

            this.landing.classList.add('hidden');
            this.appShell.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // Switch Internal Tab
            this.switchTab(route);
        }
    }

    switchTab(tabId) {
        // Maps 'create', 'dashboard', 'premium' to view IDs
        const validTabs = ['dashboard', 'create', 'projects', 'premium', 'referral', 'support', 'hosting'];
        const target = validTabs.includes(tabId) ? tabId : 'dashboard';

        document.querySelectorAll('.view-section').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active', 'animate-fade-in-up');
        });

        const view = document.getElementById(`view-${target}`);
        if(view) {
            view.classList.remove('hidden');
            void view.offsetWidth; // Reflow
            view.classList.add('active', 'animate-fade-in-up');
        }

        // Update Sidebar Active State
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
            if(btn.getAttribute('onclick')?.includes(target)) btn.classList.add('active');
        });
    }
}
const router = new Router();
window.router = router;

/* --------------------------------------------------------------------------
   SECTION 6: SIDEBAR CONTROLLER (THREE DOTS MENU)
   -------------------------------------------------------------------------- */
const Sidebar = {
    el: document.getElementById('app-sidebar'),
    overlay: document.getElementById('sidebar-overlay'),
    isOpen: false,

    toggle() {
        this.isOpen ? this.close() : this.open();
    },

    open() {
        if(!this.el) return;
        this.el.classList.remove('translate-x-full');
        this.overlay.classList.remove('hidden');
        // Small delay for fade in
        setTimeout(() => this.overlay.classList.remove('opacity-0'), 10);
        this.isOpen = true;
    },

    close() {
        if(!this.el) return;
        this.el.classList.add('translate-x-full');
        this.overlay.classList.add('opacity-0');
        setTimeout(() => this.overlay.classList.add('hidden'), 300);
        this.isOpen = false;
    }
};
window.sidebar = Sidebar;
window.utils = Utils;

/* --------------------------------------------------------------------------
   SECTION 7: AUTHENTICATION (GOOGLE + FIREBASE)
   -------------------------------------------------------------------------- */
const Auth = {
    provider: null,

    init() {
        // 1. Init Firebase
        if (firebase && !firebase.apps.length) {
            firebase.initializeApp(ENV_CONFIG.firebase);
        }
        
        // 2. Setup Google Provider
        this.provider = new firebase.auth.GoogleAuthProvider();
        this.provider.setCustomParameters({ prompt: 'select_account' });

        // 3. Listen for Auth State Changes
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log("[Auth] User:", user.email);
                Store.setUser(user);
                await DB.syncProfile(user);
                
                // Close Modal if open
                this.closeModal();

                // Check Redirection
                const redirect = sessionStorage.getItem('ZULORA_REDIRECT');
                if (redirect) {
                    sessionStorage.removeItem('ZULORA_REDIRECT');
                    router.go(redirect);
                }
                // Check Pending Prompt
                const prompt = sessionStorage.getItem('ZULORA_PENDING_PROMPT');
                if (prompt) {
                    router.go('create');
                    setTimeout(() => {
                        const input = document.getElementById('ai-prompt-input');
                        if(input) input.value = prompt;
                        sessionStorage.removeItem('ZULORA_PENDING_PROMPT');
                    }, 500);
                }

                UI.toast(`Signed in as ${user.displayName}`, 'success');
            } else {
                Store.setUser(null);
                UI.updateAuthUI();
                // If on restricted page, go home
                if (!document.getElementById('app-shell').classList.contains('hidden')) {
                    router.go('home');
                }
            }
        });
    },

    // Modal Controls
    openModal() {
        const m = document.getElementById('auth-modal');
        m.classList.remove('hidden');
        // Render Google Button Dynamic Logic here if needed
    },
    
    closeModal() {
        const m = document.getElementById('auth-modal');
        m.classList.add('hidden');
    },

    // Trigger Google Sign In
    async signIn() {
        const btn = document.getElementById('google-signin-btn');
        const original = btn.innerHTML;
        btn.innerHTML = `<i class="ri-loader-4-line animate-spin text-xl"></i> Connecting...`;
        btn.disabled = true;

        try {
            await firebase.auth().signInWithPopup(this.provider);
            // onAuthStateChanged handles the rest
        } catch (error) {
            console.error("Auth Error:", error);
            UI.toast("Sign in failed. Try again.", "error");
            btn.innerHTML = original;
            btn.disabled = false;
        }
    },

    logout() {
        firebase.auth().signOut();
        Sidebar.close();
        UI.toast("Logged out successfully.", "info");
    }
};
window.auth = Auth;

/* --------------------------------------------------------------------------
   SECTION 8: DATABASE (FIRESTORE SYNC)
   -------------------------------------------------------------------------- */
const DB = {
    async syncProfile(user) {
        const db = firebase.firestore();
        const ref = db.collection('users').doc(user.uid);
        
        try {
            const doc = await ref.get();
            if (doc.exists) {
                // Existing User: Merge
                Store.updateProfile(doc.data());
            } else {
                // New User: Create
                const newProfile = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    credits: SYSTEM.economy.signupBonus,
                    referrals: 0,
                    referralCode: Utils.generateRefCode(),
                    projects: [],
                    isPremium: false,
                    createdAt: new Date().toISOString()
                };

                // Check Referral
                const refCode = Utils.getParam('ref');
                if (refCode) {
                    // In real app, call cloud function to award referrer
                    console.log("Ref Code Used:", refCode);
                    UI.toast(`Referral Bonus! +${SYSTEM.economy.referralReward} Credits`, "gold");
                    newProfile.credits += SYSTEM.economy.referralReward; 
                }

                await ref.set(newProfile);
                Store.updateProfile(newProfile);
            }
            App.renderProjects();
        } catch (e) {
            console.error("DB Sync Failed:", e);
            Store.state.isOffline = true;
        }
    },

    async saveProject(project) {
        // Update Local
        const projects = [project, ...(Store.state.profile.projects || [])];
        Store.updateProfile({ projects });
        App.renderProjects();

        // Update Cloud
        if (Store.state.user) {
            try {
                await firebase.firestore().collection('users').doc(Store.state.user.uid).update({
                    projects: projects,
                    credits: Store.state.profile.credits
                });
            } catch (e) { console.error("Cloud save error"); }
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 9: NEURAL ENGINE (AI GENERATOR)
   -------------------------------------------------------------------------- */
const AI = {
    
    // Landing Page Trigger
    landingTrigger() {
        const val = document.getElementById('hero-prompt').value;
        if(!val) return UI.toast("Please enter a prompt!", "warning");
        sessionStorage.setItem('ZULORA_PENDING_PROMPT', val);
        window.auth.openModal();
    },

    // Main Generate Function
    async generate() {
        const input = document.getElementById('ai-prompt-input');
        const prompt = input.value.trim().toLowerCase();
        
        if (!prompt) return UI.toast("Prompt is empty.", "error");
        
        // Credit Check
        if (Store.state.profile.credits < SYSTEM.economy.generationCost) {
            router.go('premium');
            return UI.toast("Insufficient Credits. Upgrade needed.", "error");
        }

        // Loading
        const btn = document.getElementById('btn-generate');
        const original = btn.innerHTML;
        btn.innerHTML = `<i class="ri-cpu-line animate-spin"></i> Generating...`;
        btn.disabled = true;

        try {
            await Utils.wait(2000); // Simulate AI thinking

            // Deduct Credits
            Store.deductCredits(SYSTEM.economy.generationCost);
            
            // --- HYBRID TEMPLATE SELECTION ---
            let template = 'startup';
            if (prompt.includes('shop') || prompt.includes('store')) template = 'store';
            else if (prompt.includes('portfolio')) template = 'portfolio';
            else if (prompt.includes('food')) template = 'restaurant';

            const html = Templates[template](Store.state.profile.displayName);

            const project = {
                id: Utils.uuid(),
                name: prompt.substring(0, 20) + '...',
                subdomain: `${Store.state.profile.displayName.toLowerCase().replace(/ /g,'')}-${Math.floor(Math.random()*999)}`,
                html: html,
                createdAt: new Date().toISOString()
            };

            await DB.saveProject(project);
            
            UI.toast("Website Built Successfully!", "success");
            input.value = "";
            Editor.open(project);

        } catch (e) {
            console.error(e);
            UI.toast("Generation Error. Credits Refunded.", "error");
            Store.updateProfile({ credits: Store.state.profile.credits + SYSTEM.economy.generationCost });
        } finally {
            btn.innerHTML = original;
            btn.disabled = false;
        }
    },

    useTemplate(type) {
        const map = {
            'startup': "A B2B SaaS landing page with pricing.",
            'portfolio': "A creative dark portfolio.",
            'store': "A modern fashion e-commerce store.",
            'restaurant': "A restaurant landing page with menu."
        };
        router.go('create');
        document.getElementById('ai-prompt-input').value = map[type];
    }
};
window.ai = AI;

/* --------------------------------------------------------------------------
   SECTION 10: TEMPLATES (OFFLINE BRAIN)
   -------------------------------------------------------------------------- */
const Templates = {
    startup: (n) => `<!DOCTYPE html><html class="scroll-smooth"><head><script src="https://cdn.tailwindcss.com"></script></head><body class="font-sans antialiased text-gray-900 bg-white"><nav class="p-6 flex justify-between items-center border-b"><div class="text-xl font-bold text-indigo-600">${n}.io</div><button class="bg-gray-900 text-white px-6 py-2 rounded-full">Login</button></nav><header class="py-32 text-center px-4"><h1 class="text-6xl font-black mb-6">Ship Faster.</h1><p class="text-xl text-gray-500 mb-8">The all-in-one platform.</p><button class="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold">Start Free</button></header></body></html>`,
    portfolio: (n) => `<!DOCTYPE html><html class="dark"><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-black text-white font-sans"><nav class="p-8 flex justify-between"><div class="font-bold tracking-widest">${n}</div><a href="#" class="underline">Contact</a></nav><header class="py-32 px-8"><h1 class="text-9xl font-black mb-4">VISUAL<br><span class="text-green-500">ARTIST.</span></h1></header></body></html>`,
    store: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-stone-50 font-serif"><nav class="p-6 border-b border-stone-200 flex justify-between"><div class="text-2xl font-bold italic">${n}</div><div>Cart (0)</div></nav><header class="py-24 text-center"><h1 class="text-7xl mb-6">New Arrivals</h1><button class="bg-black text-white px-8 py-3 uppercase tracking-widest text-sm">Shop Now</button></header></body></html>`,
    restaurant: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-orange-50 font-sans"><nav class="p-6 flex justify-between"><div class="text-2xl font-bold text-orange-900">${n}</div><button class="bg-orange-600 text-white px-6 py-2 rounded-lg">Order</button></nav><header class="py-32 text-center"><h1 class="text-6xl font-black text-orange-950 mb-4">Taste Real Food.</h1></header></body></html>`
};

/* --------------------------------------------------------------------------
   SECTION 11: EDITOR CONTROLLER
   -------------------------------------------------------------------------- */
const Editor = {
    modal: document.getElementById('editor-modal'),
    frame: document.getElementById('preview-frame'),
    current: null,

    open(project) {
        this.current = project;
        this.modal.classList.remove('hidden');
        document.getElementById('editor-subdomain').innerText = `https://${project.subdomain}.zulora.in`;
        
        requestAnimationFrame(() => {
            this.modal.classList.remove('opacity-0');
            const doc = this.frame.contentWindow.document;
            doc.open();
            doc.write(project.html);
            doc.close();
            
            // Inject Edit Script
            const s = doc.createElement('script');
            s.innerHTML = `document.body.addEventListener('click',e=>{if(['H1','P','BUTTON','A'].includes(e.target.tagName)){e.preventDefault();e.target.contentEditable=true;e.target.focus();e.target.style.outline='2px dashed #6366f1';e.target.onblur=()=>{e.target.style.outline='none';}}});`;
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
        if(mode === 'mobile') c.classList.add('mobile-view');
        else c.classList.remove('mobile-view');
    },

    async aiEdit() {
        if(Store.deductCredits(SYSTEM.economy.aiEditCost)) {
            UI.toast("AI optimizing layout... (Simulated)", "info");
            UI.updateStats();
        } else {
            UI.toast("Not enough credits.", "error");
        }
    },

    save() {
        if(!this.current) return;
        const html = this.frame.contentWindow.document.documentElement.outerHTML;
        const projects = Store.state.profile.projects;
        const idx = projects.findIndex(p => p.id === this.current.id);
        
        if(idx > -1) {
            projects[idx].html = html;
            Store.updateProfile({ projects });
            DB.saveProject(this.current); // Sync to cloud
            UI.toast("Published successfully!", "success");
        }
    }
};
window.editor = Editor;

/* --------------------------------------------------------------------------
   SECTION 12: APP RENDERERS
   -------------------------------------------------------------------------- */
const App = {
    init() {
        UI.boot();
        Auth.init();
    },

    renderProjects() {
        const list = document.getElementById('dash-project-list');
        const allList = document.getElementById('all-projects-grid');
        const empty = document.getElementById('dash-empty');
        const projects = Store.state.profile.projects || [];

        if (projects.length === 0) {
            if(empty) { empty.classList.remove('hidden'); empty.classList.add('flex'); }
            if(list) list.innerHTML = '';
            if(allList) allList.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500">No projects yet.</div>';
            return;
        }

        if(empty) { empty.classList.add('hidden'); empty.classList.remove('flex'); }

        const render = (p) => `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-brand-500/50 transition group" onclick='editor.open(${JSON.stringify(p)})'>
                <div class="h-40 bg-slate-950 relative overflow-hidden">
                    <iframe srcdoc="${p.html.replace(/"/g, "'")}" class="w-[200%] h-[200%] scale-50 origin-top-left pointer-events-none opacity-60"></iframe>
                    <div class="absolute bottom-3 left-3"><span class="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded">LIVE</span></div>
                </div>
                <div class="p-4">
                    <h4 class="text-white font-bold truncate">${p.name}</h4>
                    <p class="text-xs text-slate-500 font-mono">${p.subdomain}.zulora.in</p>
                </div>
            </div>`;

        if(list) list.innerHTML = projects.slice(0, 3).map(render).join('');
        if(allList) allList.innerHTML = projects.map(render).join('');
    }
};

// Start System
window.onload = App.init;
