/**
 * ==========================================================================================
 * ______     __  __     __         ______     ______     ______    
 * /\___  \   /\ \/\ \   /\ \       /\  __ \   /\  == \   /\  __ \   
 * \/_/  /__  \ \ \_\ \  \ \ \____  \ \ \/\ \  \ \  __<   \ \  __ \  
 * /\_____\  \ \_____\  \ \_____\  \ \_____\  \ \_\ \_\  \ \_\ \_\ 
 * \/_____/   \/_____/   \/_____/   \/_____/   \/_/ /_/   \/_/\/_/ 
 *
 * ZULORA OS - TITANIUM KERNEL (v15.0.0 STABLE)
 * "The Infinite Context Engine"
 * * [ SYSTEM MANIFEST ]
 * 1. Kernel ......... Bootloader & Error Boundary
 * 2. StateStore ..... Reactive Redux-Like Data Layer
 * 3. AuthCore ....... Hybrid Firebase + Ghost Mode (Offline)
 * 4. NeuralNet ...... Quad-Core AI Orchestrator (GPT/Claude/Gemini/Llama)
 * 5. VFS ............ Virtual File System (HTML/CSS/JS Separation)
 * 6. Compiler ....... Real-time DOM Injection & Preview
 * 7. Economy ........ Credits, Referrals, & UPI Gateway
 * * (c) 2026 Zulora Inc. | Enterprise License
 * ==========================================================================================
 */

"use strict";

/* --------------------------------------------------------------------------
   SECTION 1: KERNEL CONFIGURATION
   -------------------------------------------------------------------------- */
// Load Environment Variables injected from HTML
const ENV = window.ZULORA_CONFIG || {};

const SYSTEM = {
    version: '15.0.0-titanium',
    build: '2026.02.05.RC1',
    debug: true, // Verbose logging for debugging
    
    // 1.1 Economic Engine
    economy: {
        signupBonus: 30,       // Credits given to new users
        referralReward: 15,    // Credits given to referrer
        generationCost: 15,    // Cost to generate a full stack site
        aiEditCost: 5,         // Cost to refine code
        premiumCost: 299,      // UPDATED PRICE (INR)
        premiumCredits: 1000   // Monthly allowance for Pro
    },

    // 1.2 Support Vectors
    support: {
        ...ENV.admin,
        faq: "https://zulora.in/docs"
    },

    // 1.3 Hosting Simulation
    hosting: {
        tld: '.zulora.in',
        regions: ['us-east', 'ap-south', 'eu-west'],
        ssl: true
    }
};

/* --------------------------------------------------------------------------
   SECTION 2: GLOBAL UTILITY TOOLKIT
   -------------------------------------------------------------------------- */
const Utils = {
    // Cryptographic ID Generator
    uuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    // Referral Code Generator (Base36 Upper)
    generateRefCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
        let result = 'ZUL-';
        for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    },

    // Format Date Relative
    timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        return "Just now";
    },

    // Safe Clipboard Copy
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            UI.toast("Copied to clipboard!", "success");
            return true;
        } catch (err) {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            UI.toast("Copied!", "success");
            return true;
        }
    },

    // Artificial Delay (for UX pacing)
    wait(ms) { return new Promise(r => setTimeout(r, ms)); },

    // Query String Parser
    getParam(name) { return new URLSearchParams(window.location.search).get(name); },

    // Contact Router
    contact(type) {
        const s = SYSTEM.support;
        const urls = {
            whatsapp: `https://wa.me/${s.whatsapp}?text=I%20need%20help%20with%20Zulora%20OS`,
            email: `mailto:${s.email}?subject=Enterprise%20Support`,
            instagram: s.instagram
        };
        if(urls[type]) window.open(urls[type], '_blank');
    }
};

/* --------------------------------------------------------------------------
   SECTION 3: STATE STORE (PERSISTENT REDUX LAYER)
   -------------------------------------------------------------------------- */
class StateStore {
    constructor() {
        this.state = {
            user: null, // Ephemeral Auth Object
            profile: {
                // Persistent User Data
                uid: null,
                displayName: 'Guest Developer',
                email: '',
                photoURL: null,
                credits: 0,
                referrals: 0,
                referralCode: 'INIT...',
                projects: [], // Array of VFS Objects
                isPremium: false,
                settings: { theme: 'dark', notifications: true }
            },
            ui: {
                sidebarOpen: false,
                currentView: 'home',
                isBooting: true
            },
            isOffline: false // Ghost Mode Flag
        };
        
        this.subscribers = [];
        this.load();
    }

    // Hydrate from LocalStorage
    load() {
        try {
            const raw = localStorage.getItem('ZULORA_V15_CORE');
            if (raw) {
                const data = JSON.parse(raw);
                this.state.profile = { ...this.state.profile, ...data.profile };
                console.log("%c[Store] Hydrated Successfully", "color: #3b82f6");
            }
        } catch (e) {
            console.error("[Store] Corruption detected. Resetting.");
            localStorage.removeItem('ZULORA_V15_CORE');
        }
    }

    // Persist to Disk
    save() {
        try {
            const dump = JSON.stringify({ profile: this.state.profile });
            localStorage.setItem('ZULORA_V15_CORE', dump);
        } catch (e) {
            console.warn("[Store] Storage Quota Exceeded");
        }
    }

    // --- ACTIONS ---

    setUser(firebaseUser) {
        this.state.user = firebaseUser;
        if(firebaseUser) {
            this.state.profile.uid = firebaseUser.uid;
            this.state.profile.email = firebaseUser.email;
            if(firebaseUser.displayName) this.state.profile.displayName = firebaseUser.displayName;
            if(firebaseUser.photoURL) this.state.profile.photoURL = firebaseUser.photoURL;
        }
        this.notify();
    }

    updateProfile(updates) {
        this.state.profile = { ...this.state.profile, ...updates };
        this.save();
        this.notify();
    }

    // Transaction Engine
    transact(amount, type = 'deduct') {
        const current = this.state.profile.credits;
        if (type === 'deduct') {
            if (current >= amount) {
                this.updateProfile({ credits: current - amount });
                return true;
            }
            return false;
        } else {
            this.updateProfile({ credits: current + amount });
            return true;
        }
    }

    // Observer Pattern
    subscribe(fn) { this.subscribers.push(fn); }
    notify() { this.subscribers.forEach(fn => fn(this.state)); UI.render(); }
}

const Store = new StateStore();

/* --------------------------------------------------------------------------
   SECTION 4: UI CONTROLLER (DOM ORCHESTRATOR)
   -------------------------------------------------------------------------- */
const UI = {
    // Element References
    els: {
        loader: document.getElementById('bootloader'),
        dock: document.getElementById('toast-dock'),
        navbar: document.getElementById('navbar'),
        sidebar: document.getElementById('sidebar-left')
    },

    // --- ZERO LATENCY BOOT ---
    boot() {
        console.log("%c[Kernel] Boot Sequence Initiated", "color: #10b981; font-weight: bold;");
        
        const bar = document.getElementById('boot-bar');
        if(bar) bar.style.width = '100%';

        // Force remove loader in 500ms max
        setTimeout(() => {
            if(this.els.loader) {
                this.els.loader.style.opacity = '0';
                this.els.loader.style.pointerEvents = 'none';
                setTimeout(() => this.els.loader.style.display = 'none', 300);
            }
        }, 500);
    },

    // Advanced Toast System
    toast(msg, type = 'info') {
        const card = document.createElement('div');
        
        const themes = {
            success: 'border-green-500/20 bg-void/90 text-green-400 shadow-green-500/10',
            error: 'border-red-500/20 bg-void/90 text-red-400 shadow-red-500/10',
            info: 'border-brand-500/20 bg-void/90 text-brand-400 shadow-brand-500/10',
            gold: 'border-yellow-500/20 bg-void/90 text-yellow-400 shadow-yellow-500/10'
        };
        const icons = {
            success: 'ri-checkbox-circle-fill',
            error: 'ri-error-warning-fill',
            info: 'ri-information-fill',
            gold: 'ri-vip-crown-fill'
        };

        const theme = themes[type] || themes.info;
        const icon = icons[type] || icons.info;

        card.className = `flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl transform translate-x-full transition-all duration-500 pointer-events-auto ${theme}`;
        card.innerHTML = `<i class="${icon} text-lg"></i><span class="text-xs font-bold tracking-wide">${msg}</span>`;

        this.els.dock.appendChild(card);

        // Animate In
        requestAnimationFrame(() => card.classList.remove('translate-x-full'));

        // Animate Out
        setTimeout(() => {
            card.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => card.remove(), 500);
        }, 3500);
    },

    // Global Render Loop
    render() {
        const s = Store.state;
        const p = s.profile;
        const isLoggedIn = !!s.user || (s.isOffline && p.uid);

        // 1. Toggle Auth UI States
        const guestUI = document.getElementById('auth-guest');
        const userUI = document.getElementById('auth-user');
        
        if (isLoggedIn) {
            if(guestUI) guestUI.classList.add('hidden');
            if(userUI) userUI.classList.remove('hidden');
            
            // Update Header Stats
            const credEl = document.getElementById('header-credits');
            if(credEl) credEl.innerText = p.credits;

            // Update Avatar
            const avEl = document.getElementById('header-avatar');
            if(avEl) {
                if(p.photoURL) avEl.innerHTML = `<img src="${p.photoURL}" class="w-full h-full object-cover">`;
                else avEl.innerHTML = p.displayName.charAt(0).toUpperCase();
            }

            // Update Sidebar Data
            const drawName = document.getElementById('drawer-name');
            const drawEmail = document.getElementById('drawer-email');
            const drawAv = document.getElementById('drawer-avatar');
            
            if(drawName) drawName.innerText = p.displayName;
            if(drawEmail) drawEmail.innerText = p.email;
            if(drawAv && p.photoURL) drawAv.innerHTML = `<img src="${p.photoURL}" class="w-full h-full object-cover">`;

            // Dashboard KPI
            const kpiCredits = document.getElementById('stat-credits');
            const kpiProjects = document.getElementById('stat-projects');
            const kpiReferrals = document.getElementById('stat-referrals');
            
            if(kpiCredits) kpiCredits.innerText = p.credits;
            if(kpiProjects) kpiProjects.innerText = p.projects.length;
            if(kpiReferrals) kpiReferrals.innerText = p.referrals;

            // Referral Link
            const refInput = document.getElementById('ref-link');
            if(refInput) refInput.value = `${window.location.origin}?ref=${p.referralCode}`;

        } else {
            if(guestUI) guestUI.classList.remove('hidden');
            if(userUI) userUI.classList.add('hidden');
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 5: ROUTER (SPA ENGINE)
   -------------------------------------------------------------------------- */
const Router = {
    go(route, params = {}) {
        // Close overlay menus
        Sidebar.close();
        
        // Hide all major containers
        // We assume 'content-stage' is always visible, but we toggle sections inside it
        
        // Handle Auth Gates
        if (['create', 'projects', 'premium', 'referral', 'hosting'].includes(route)) {
            const s = Store.state;
            if (!s.user && !s.isOffline) {
                sessionStorage.setItem('ZULORA_REDIRECT', route);
                Auth.openModal();
                return;
            }
        }

        // Switch View
        this.switchView(route);
    },

    switchView(viewId) {
        // Valid views map to section IDs
        const map = {
            'home': 'view-home',
            'create': 'view-create',
            'premium': 'view-premium',
            'referral': 'view-referral',
            'projects': 'view-home', // Reuse home for now or specific view
            'hosting': 'view-home'   // Reuse home for now
        };

        const targetId = map[viewId] || 'view-home';

        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('animate-fade-in');
        });

        // Show target
        const target = document.getElementById(targetId);
        if(target) {
            target.classList.remove('hidden');
            void target.offsetWidth; // Force Reflow
            target.classList.add('animate-fade-in');
        }

        // Update Nav Active State
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.remove('active', 'text-white', 'bg-white/10');
            btn.classList.add('text-gray-400');
            if(btn.dataset.target === viewId) {
                btn.classList.add('active', 'text-white', 'bg-white/10');
                btn.classList.remove('text-gray-400');
            }
        });

        // Scroll Top
        const stage = document.getElementById('content-stage');
        if(stage) stage.scrollTo(0,0);
    }
};
window.router = Router;

/* --------------------------------------------------------------------------
   SECTION 6: SIDEBAR CONTROLLER
   -------------------------------------------------------------------------- */
const Sidebar = {
    el: document.getElementById('sidebar-drawer'),
    
    toggle() {
        if(!this.el) return;
        const isClosed = this.el.classList.contains('translate-x-full');
        if(isClosed) this.open();
        else this.close();
    },

    open() {
        this.el.classList.remove('translate-x-full');
    },

    close() {
        this.el.classList.add('translate-x-full');
    },

    // Right Sidebar (User Dropdown substitute)
    toggleRight() {
        this.toggle(); // Reusing the same drawer for simplicity in this layout
    }
};
window.sidebar = Sidebar;

/* --------------------------------------------------------------------------
   SECTION 7: AUTHENTICATION CORE (FIREBASE + GHOST MODE)
   -------------------------------------------------------------------------- */
const Auth = {
    provider: null,

    init() {
        // 1. Initialize Firebase
        if (firebase && !firebase.apps.length) {
            try {
                firebase.initializeApp(ENV.firebase);
                this.provider = new firebase.auth.GoogleAuthProvider();
                this.provider.setCustomParameters({ prompt: 'select_account' });
                
                // Listener
                firebase.auth().onAuthStateChanged(this.handleStateChange.bind(this));
                
                console.log("[Auth] Firebase Connected");
            } catch (e) {
                console.error("[Auth] Connection Failed. Enabling Ghost Mode.");
                this.enableGhostMode();
            }
        }
    },

    async handleStateChange(user) {
        if (user) {
            Store.setUser(user);
            await DB.sync(user); // Sync Profile
            
            // Close Modal
            const m = document.getElementById('auth-modal');
            if(m) m.classList.add('hidden');

            // Handle Redirects
            const redirect = sessionStorage.getItem('ZULORA_REDIRECT');
            if(redirect) {
                sessionStorage.removeItem('ZULORA_REDIRECT');
                Router.go(redirect);
            }

            // Handle Pending Prompt
            const prompt = sessionStorage.getItem('ZULORA_PENDING_PROMPT');
            if(prompt) {
                Router.go('create');
                setTimeout(() => {
                    const el = document.getElementById('ai-prompt');
                    if(el) el.value = prompt;
                    sessionStorage.removeItem('ZULORA_PENDING_PROMPT');
                }, 500);
            }

            UI.toast(`Session Active: ${user.displayName}`, "success");
        } else {
            Store.setUser(null);
        }
    },

    enableGhostMode() {
        Store.state.isOffline = true;
        // Check if we have a cached user
        if(Store.state.profile.uid) {
            console.log("[Auth] Ghost Mode: Restored Local Session");
            UI.render();
        }
    },

    // UI Triggers
    openModal() {
        const m = document.getElementById('auth-modal');
        if(m) m.classList.remove('hidden');
    },

    close() {
        const m = document.getElementById('auth-modal');
        if(m) m.classList.add('hidden');
    },

    async signIn() {
        if (Store.state.isOffline) {
            // Fake Login for Demo/Offline
            const mockUser = {
                uid: 'ghost-' + Utils.uuid(),
                email: 'demo@zulora.local',
                displayName: 'Ghost Developer',
                photoURL: null
            };
            this.handleStateChange(mockUser);
            return;
        }

        const btn = document.getElementById('btn-google');
        const original = btn.innerHTML;
        btn.innerHTML = `<i class="ri-loader-4-line animate-spin text-xl"></i> Connecting...`;
        btn.disabled = true;

        try {
            await firebase.auth().signInWithPopup(this.provider);
        } catch (e) {
            UI.toast("Auth Failed. Check Network.", "error");
            btn.innerHTML = original;
            btn.disabled = false;
        }
    },

    logout() {
        if(!Store.state.isOffline) firebase.auth().signOut();
        Store.setUser(null);
        Sidebar.close();
        Router.go('home');
        UI.toast("Terminated Session", "info");
    }
};
window.auth = Auth;

/* --------------------------------------------------------------------------
   SECTION 8: DATABASE LAYER (SYNC ENGINE)
   -------------------------------------------------------------------------- */
const DB = {
    async sync(user) {
        if (Store.state.isOffline) return; // Skip if offline

        const db = firebase.firestore();
        const ref = db.collection('users').doc(user.uid);

        try {
            const doc = await ref.get();
            
            if (doc.exists) {
                // Existing: Merge Cloud -> Local
                const data = doc.data();
                Store.updateProfile(data);
            } else {
                // New: Create -> Cloud
                console.log("[DB] Minting New Profile...");
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

                // Referral Logic
                const refCode = Utils.getParam('ref');
                if (refCode) {
                    newProfile.credits += SYSTEM.economy.referralReward;
                    // Logic to award referrer would go here in a Cloud Function
                    UI.toast("Referral Bonus Applied!", "gold");
                }

                await ref.set(newProfile);
                Store.updateProfile(newProfile);
            }
            // Update Project List
            App.refreshProjects();
        } catch (e) {
            console.warn("[DB] Sync Failed. Using Local Cache.");
        }
    },

    async saveProject(project) {
        // 1. Local Save (Optimistic)
        const current = [...Store.state.profile.projects];
        current.unshift(project);
        Store.updateProfile({ projects: current });
        App.refreshProjects();

        // 2. Cloud Save (Async)
        if (!Store.state.isOffline && Store.state.user) {
            try {
                await firebase.firestore().collection('users').doc(Store.state.user.uid).update({
                    projects: current,
                    credits: Store.state.profile.credits
                });
            } catch (e) { console.error("Cloud Save Error", e); }
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 9: NEURAL ENGINE (THE AI BRAIN)
   -------------------------------------------------------------------------- */
const AI = {
    
    async generate() {
        const input = document.getElementById('ai-prompt');
        const prompt = input.value.trim().toLowerCase();
        
        // 1. Validation
        if (!prompt) return UI.toast("Prompt cannot be void.", "error");
        
        // 2. Credit Check
        if (Store.state.profile.credits < SYSTEM.economy.generationCost) {
            Router.go('premium');
            return UI.toast("Insufficient Compute Credits.", "error");
        }

        // 3. UI State
        const btn = document.getElementById('btn-generate');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="flex items-center gap-2"><i class="ri-loader-4-line animate-spin"></i> Compiling...</span>`;
        btn.disabled = true;

        try {
            // 4. Payment
            Store.transact(SYSTEM.economy.generationCost, 'deduct');

            // 5. Simulation Delay (Neural Processing Time)
            await Utils.wait(2500);

            // 6. Template Matching Algorithm (The "Fake" AI)
            // This logic maps keywords to our internal database of templates.
            // In a real backend, this would call GPT-4.
            let templateId = 'startup'; // Default
            
            if (prompt.includes('shop') || prompt.includes('store')) templateId = 'ecommerce';
            else if (prompt.includes('portfolio') || prompt.includes('resume')) templateId = 'portfolio';
            else if (prompt.includes('food') || prompt.includes('restaurant')) templateId = 'restaurant';
            else if (prompt.includes('blog') || prompt.includes('news')) templateId = 'blog';
            else if (prompt.includes('dashboard') || prompt.includes('admin')) templateId = 'dashboard';

            const sourceCode = Templates[templateId](Store.state.profile.displayName);

            // 7. Virtual File System Creation
            const project = {
                id: Utils.uuid(),
                name: prompt.substring(0, 20) + '...',
                subdomain: `${Store.state.profile.displayName.toLowerCase().replace(/\s/g,'')}-${Math.floor(Math.random()*999)}`,
                files: {
                    'index.html': sourceCode,
                    'style.css': '/* CSS generated by Zulora AI */ body { margin: 0; }',
                    'script.js': '// JS generated by Zulora AI console.log("Init");'
                },
                engine: document.querySelector('input[name="ai_model"]:checked')?.value || 'openai',
                createdAt: new Date().toISOString()
            };

            // 8. Commit
            await DB.saveProject(project);
            
            UI.toast("Build Successful!", "success");
            input.value = "";
            
            // 9. Launch IDE
            Editor.launch(project);

        } catch (e) {
            console.error(e);
            UI.toast("Neural Failure. Refund issued.", "error");
            Store.transact(SYSTEM.economy.generationCost, 'add');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};
window.ai = AI;

/* --------------------------------------------------------------------------
   SECTION 10: TEMPLATE REPOSITORY (INTERNAL DB)
   -------------------------------------------------------------------------- */
const Templates = {
    startup: (n) => `<!DOCTYPE html><html class="scroll-smooth"><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white text-slate-900 font-sans"><nav class="p-6 border-b flex justify-between items-center max-w-7xl mx-auto"><div class="font-bold text-2xl text-blue-600">${n}.io</div><button class="bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-800 transition">Login</button></nav><header class="py-32 px-6 text-center"><h1 class="text-6xl font-black mb-6 tracking-tight">Scale Faster.</h1><p class="text-xl text-slate-500 mb-8">The all-in-one platform for growth.</p><button class="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:bg-blue-700 transition">Get Started</button></header></body></html>`,
    
    portfolio: (n) => `<!DOCTYPE html><html class="dark"><head><script src="https://cdn.tailwindcss.com"></script><script>tailwind.config={darkMode:'class'}</script></head><body class="bg-zinc-950 text-white font-sans antialiased"><nav class="p-8 flex justify-between items-center"><div class="text-xl font-bold tracking-widest uppercase">${n}</div><a href="#" class="underline decoration-emerald-500 underline-offset-4">Work</a></nav><header class="py-32 px-8 max-w-5xl mx-auto"><h1 class="text-8xl font-black mb-6 leading-none">VISUAL<br><span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">ENGINEER.</span></h1><p class="text-2xl text-zinc-500 mt-8">Creating digital experiences.</p></header></body></html>`,
    
    ecommerce: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-stone-50 text-stone-900 font-serif"><nav class="p-6 border-b border-stone-200 flex justify-between items-center bg-white"><div class="text-2xl font-bold italic">${n}</div><div class="font-sans text-sm font-bold uppercase tracking-widest">Cart (0)</div></nav><header class="h-[80vh] flex items-center justify-center bg-stone-200 relative"><div class="text-center z-10"><h1 class="text-7xl mb-6">Autumn Collection</h1><button class="bg-stone-900 text-white px-10 py-4 uppercase tracking-[0.2em] text-sm hover:bg-stone-800 transition">Shop Now</button></div></header></body></html>`,
    
    restaurant: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-orange-50 font-sans text-orange-950"><nav class="p-6 flex justify-between items-center"><div class="text-3xl font-black text-orange-800">${n}</div><button class="bg-orange-600 text-white px-6 py-2 rounded-full font-bold">Book Table</button></nav><header class="py-32 text-center px-4"><h1 class="text-6xl font-black mb-4">Taste the Fire.</h1><p class="text-xl text-orange-800/60 mb-8">Authentic wood-fired cuisine.</p></header></body></html>`,
    
    dashboard: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-50 font-sans flex h-screen"><aside class="w-64 bg-slate-900 text-white p-6"><div class="font-bold text-xl mb-8">${n} Admin</div><div class="space-y-4 text-slate-400"><div class="text-white">Dashboard</div><div>Users</div><div>Settings</div></div></aside><main class="flex-1 p-8"><h1 class="text-2xl font-bold mb-6">Overview</h1><div class="grid grid-cols-3 gap-6"><div class="bg-white p-6 rounded-xl shadow-sm h-32"></div><div class="bg-white p-6 rounded-xl shadow-sm h-32"></div><div class="bg-white p-6 rounded-xl shadow-sm h-32"></div></div></main></body></html>`
};

/* --------------------------------------------------------------------------
   SECTION 11: EDITOR & COMPILER (HOSTING SIMULATION)
   -------------------------------------------------------------------------- */
const Editor = {
    els: {
        modal: document.getElementById('editor-modal'),
        iframe: document.getElementById('editor-frame'),
        url: document.getElementById('editor-url')
    },
    project: null,

    launch(project) {
        this.project = project;
        this.els.modal.classList.remove('hidden');
        this.els.url.innerText = `https://${project.subdomain}.zulora.in`;
        
        requestAnimationFrame(() => {
            this.els.modal.classList.remove('opacity-0');
            this.render();
        });
    },

    render() {
        const doc = this.els.iframe.contentWindow.document;
        doc.open();
        // Check if project has files object (v15) or just html string (legacy)
        const html = this.project.files ? this.project.files['index.html'] : this.project.html;
        doc.write(html);
        doc.close();
        
        // Inject Edit Script (The Magic Click-to-Edit)
        const s = doc.createElement('script');
        s.innerHTML = `
            document.body.addEventListener('click', e => {
                const t = e.target;
                if(['H1','H2','P','BUTTON','A','SPAN'].includes(t.tagName)) {
                    e.preventDefault();
                    t.contentEditable = true;
                    t.focus();
                    t.style.outline = '2px dashed #3b82f6';
                    t.onblur = () => t.style.outline = 'none';
                }
            });
        `;
        doc.body.appendChild(s);
    },

    close() {
        this.els.modal.classList.add('opacity-0');
        setTimeout(() => {
            this.els.modal.classList.add('hidden');
            this.els.iframe.src = 'about:blank';
        }, 300);
        App.refreshProjects();
    },

    device(type) {
        const wrap = document.getElementById('editor-frame-wrap');
        if(type === 'mobile') {
            wrap.style.width = '375px';
            wrap.style.borderRadius = '20px';
        } else {
            wrap.style.width = '100%';
            wrap.style.borderRadius = '0';
        }
    },

    save() {
        if(!this.project) return;
        const newHtml = this.els.iframe.contentWindow.document.documentElement.outerHTML;
        
        // Update Object
        if(this.project.files) this.project.files['index.html'] = newHtml;
        else this.project.html = newHtml;

        // Save
        const idx = Store.state.profile.projects.findIndex(p => p.id === this.project.id);
        const projects = Store.state.profile.projects;
        if(idx !== -1) projects[idx] = this.project;
        
        Store.updateProfile({ projects });
        if(!Store.state.isOffline) DB.saveProject(this.project);
        
        UI.toast("Deployed to Edge Network", "success");
    }
};
window.editor = Editor;

/* --------------------------------------------------------------------------
   SECTION 12: APP INITIALIZATION
   -------------------------------------------------------------------------- */
const App = {
    init() {
        // 1. Boot UI
        UI.boot();
        
        // 2. Start Auth
        Auth.init();

        // 3. Render Initial State
        this.refreshProjects();
    },

    refreshProjects() {
        const list = document.getElementById('project-list');
        const empty = document.getElementById('project-empty');
        const projects = Store.state.profile.projects || [];

        if(projects.length === 0) {
            empty.classList.remove('hidden');
            empty.classList.add('flex');
            list.innerHTML = '';
            return;
        }

        empty.classList.add('hidden');
        empty.classList.remove('flex');

        list.innerHTML = projects.map(p => {
            const htmlContent = p.files ? p.files['index.html'] : p.html;
            // Clean HTML for srcdoc (escape quotes)
            const safeHtml = htmlContent.replace(/"/g, "'");
            
            return `
            <div class="bg-surface border border-border rounded-xl overflow-hidden group hover:border-brand-500/50 transition-all duration-300" onclick='editor.launch(${JSON.stringify(p)})'>
                <div class="h-32 bg-panel relative overflow-hidden">
                    <iframe srcdoc="${safeHtml}" class="w-[200%] h-[200%] scale-50 origin-top-left pointer-events-none opacity-50 group-hover:opacity-100 transition grayscale group-hover:grayscale-0"></iframe>
                    <div class="absolute bottom-2 left-2"><span class="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/20">LIVE</span></div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="text-white font-bold text-sm truncate pr-2">${p.name}</h4>
                        <span class="text-[10px] text-gray-500 uppercase bg-white/5 px-1 rounded">${p.engine || 'AI'}</span>
                    </div>
                    <div class="text-[10px] text-gray-500 font-mono truncate">${p.subdomain}.zulora.in</div>
                </div>
            </div>`;
        }).join('');
    }
};

// Global Exports for HTML
window.utils = Utils;

// START
window.addEventListener('load', () => App.init());
