/**
 * ==========================================================================================
 * ______     __  __     __         ______     ______     ______    
 * /\___  \   /\ \/\ \   /\ \       /\  __ \   /\  == \   /\  __ \   
 * \/_/  /__  \ \ \_\ \  \ \ \____  \ \ \/\ \  \ \  __<   \ \  __ \  
 * /\_____\  \ \_____\  \ \_____\  \ \_____\  \ \_\ \_\  \ \_\ \_\ 
 * \/_____/   \/_____/   \/_____/   \/_____/   \/_/ /_/   \/_/\/_/ 
 *
 * ZULORA OS - TITANIUM KERNEL (v14.0.0 STABLE)
 * "The Unbreakable Neural Engine"
 * * [ CHANGELOG v14 ]
 * 1. FIXED: Sidebar Support Links (Instagram/Email now redirect correctly)
 * 2. FIXED: Bootloader Race Conditions
 * 3. UPGRADED: State Store Persistence
 * 4. OPTIMIZED: Dual-Core AI Logic
 * * (c) 2026 Zulora Inc. | Enterprise License
 * ==========================================================================================
 */

"use strict";

/* --------------------------------------------------------------------------
   SECTION 1: SYSTEM CONFIGURATION & ENVIRONMENT
   -------------------------------------------------------------------------- */
// Load config injected from HTML or fallback to defaults
const ENV = window.ZULORA_CONFIG || {};

const SYSTEM = {
    version: '14.0.0-titanium',
    build: '2026.02.05',
    debug: true, 
    
    // Economic Engine
    economy: {
        signupBonus: 30,       // Credits on new account
        referralReward: 15,    // Credits for referring
        generationCost: 15,    // Cost to build site
        aiEditCost: 3,         // Cost to AI edit
        premiumCost: 199       // INR Price
    },

    // Support Configuration (Hardcoded for stability)
    contact: {
        whatsapp: "916395211325", // Clean number for API
        email: "zulora.help@gmail.com",
        instagram: "https://www.instagram.com/zulora_official?igsh=MTRvOGYwNGZoZ3h0aw=="
    }
};

/* --------------------------------------------------------------------------
   SECTION 2: GLOBAL UTILITY TOOLKIT
   -------------------------------------------------------------------------- */
const Utils = {
    // Generate unique IDs
    uuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    // Generate readable referral codes
    generateRefCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = 'ZUL-';
        for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    },

    // Clipboard Copy
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            UI.toast("Copied to clipboard!", "success");
        } catch (err) {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            UI.toast("Copied!", "success");
        }
    },

    // Async Delay
    wait(ms) { return new Promise(r => setTimeout(r, ms)); },

    // Get URL Params
    getParam(name) { return new URLSearchParams(window.location.search).get(name); },

    // --- FIXED LINK HANDLER ---
    openLink(type) {
        let url = "";
        
        switch(type) {
            case 'whatsapp':
                url = `https://wa.me/${SYSTEM.contact.whatsapp}?text=Hi%20Zulora%20Support,%20I%20need%20help.`;
                break;
            case 'instagram':
                url = SYSTEM.contact.instagram;
                break;
            case 'email':
                url = `mailto:${SYSTEM.contact.email}?subject=Zulora%20Support%20Request`;
                break;
            default:
                console.warn("Unknown link type:", type);
                return;
        }
        
        console.log(`[Utils] Opening: ${url}`);
        window.open(url, '_blank');
    },
    
    // Alias for HTML onclicks
    contact(type) {
        this.openLink(type);
    }
};

/* --------------------------------------------------------------------------
   SECTION 3: STATE STORE (PERSISTENT DATA)
   -------------------------------------------------------------------------- */
class StateStore {
    constructor() {
        this.state = {
            user: null, // Ephemeral Firebase User
            profile: {
                credits: 0,
                referrals: 0,
                projects: [],
                isPremium: false,
                displayName: 'Guest',
                email: '',
                photoURL: null,
                referralCode: 'GEN-WAIT'
            },
            ui: {
                sidebarOpen: false,
                currentView: 'home'
            },
            isOffline: false
        };
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem('ZULORA_V14_STATE');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state.profile = { ...this.state.profile, ...parsed.profile };
                console.log(">> [Store] Hydrated from disk.");
            }
        } catch (e) {
            console.warn(">> [Store] Resetting state.");
            localStorage.removeItem('ZULORA_V14_STATE');
        }
    }

    save() {
        try {
            localStorage.setItem('ZULORA_V14_STATE', JSON.stringify({
                profile: this.state.profile
            }));
        } catch (e) { console.error("Storage Error"); }
    }

    setUser(user) {
        this.state.user = user;
        UI.render();
    }

    updateProfile(data) {
        this.state.profile = { ...this.state.profile, ...data };
        this.save();
        UI.render();
    }

    deductCredits(amount) {
        if (this.state.profile.credits >= amount) {
            this.updateProfile({ credits: this.state.profile.credits - amount });
            return true;
        }
        return false;
    }

    addCredits(amount) {
        this.updateProfile({ credits: this.state.profile.credits + amount });
    }
}

const Store = new StateStore();

/* --------------------------------------------------------------------------
   SECTION 4: UI CONTROLLER (VISUALS)
   -------------------------------------------------------------------------- */
const UI = {
    loader: document.getElementById('bootloader'),
    toastDock: document.getElementById('toast-dock'),

    // Instant Boot Logic
    boot() {
        console.log(">> [Boot] System Online.");
        const bar = document.getElementById('boot-bar');
        if(bar) bar.style.width = '100%';

        setTimeout(() => {
            if(this.loader) {
                this.loader.style.opacity = '0';
                this.loader.style.pointerEvents = 'none';
                setTimeout(() => this.loader.style.display = 'none', 500);
            }
        }, 500);
    },

    toast(msg, type = 'info') {
        const el = document.createElement('div');
        const styles = {
            success: { bg: 'bg-slate-900/95', border: 'border-green-500/30', icon: 'ri-checkbox-circle-fill text-green-400' },
            error:   { bg: 'bg-slate-900/95', border: 'border-red-500/30',   icon: 'ri-error-warning-fill text-red-400' },
            info:    { bg: 'bg-slate-900/95', border: 'border-brand-500/30', icon: 'ri-information-fill text-brand-400' },
            gold:    { bg: 'bg-slate-900/95', border: 'border-yellow-500/30', icon: 'ri-vip-crown-fill text-yellow-400' }
        };
        const s = styles[type] || styles.info;

        el.className = `flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-in pointer-events-auto ${s.bg} ${s.border}`;
        el.innerHTML = `<i class="${s.icon} text-xl"></i><span class="text-sm font-medium text-slate-200">${msg}</span>`;

        this.toastDock.appendChild(el);
        setTimeout(() => {
            el.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => el.remove(), 300);
        }, 4000);
    },

    // Global UI Update
    render() {
        const s = Store.state;
        const p = s.profile;
        const isLoggedIn = !!s.user;

        // Navbar State
        const navOut = document.getElementById('nav-logged-out');
        const navIn = document.getElementById('nav-logged-in');
        
        if (isLoggedIn) {
            if(navOut) navOut.classList.add('hidden');
            if(navIn) { navIn.classList.remove('hidden'); navIn.classList.add('flex'); }
            
            // Text Updates
            const setText = (id, txt) => { const el = document.getElementById(id); if(el) el.innerText = txt; };
            
            setText('nav-user-name', p.displayName.split(' ')[0]);
            setText('nav-user-credits', `${p.credits} Cr`);
            
            // Sidebar Data
            setText('drawer-name', p.displayName);
            setText('drawer-email', s.user.email);
            setText('drawer-credits', p.credits);
            setText('sidebar-drawer-credits', p.credits); // Duplicate handle check

            // Avatars
            const avatars = document.querySelectorAll('#drawer-avatar, #sidebar-avatar');
            avatars.forEach(av => {
                if(p.photoURL) av.innerHTML = `<img src="${p.photoURL}" class="w-full h-full object-cover">`;
                else av.innerHTML = p.displayName.charAt(0).toUpperCase();
            });

            // Dashboard Stats
            setText('dash-credits', p.credits);
            setText('dash-sites', p.projects.length);
            setText('dash-referrals', p.referrals);

            // Referral Input
            const refInput = document.getElementById('referral-link-input');
            if(refInput) refInput.value = `${window.location.origin}?ref=${p.referralCode}`;

        } else {
            if(navOut) navOut.classList.remove('hidden');
            if(navIn) navIn.classList.add('hidden');
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 5: ROUTER (NAVIGATION)
   -------------------------------------------------------------------------- */
const Router = {
    go(route, params = {}) {
        Sidebar.close();
        
        // Hide all views
        const views = ['view-landing', 'app-root', 'view-auth'];
        views.forEach(id => {
            const el = document.getElementById(id);
            if(el && id !== 'view-auth') el.classList.add('hidden'); // Auth modal handled separately
        });

        switch(route) {
            case 'home':
            case 'landing':
                document.getElementById('view-landing').classList.remove('hidden'); // Show Landing Shell
                document.getElementById('app-root').classList.remove('hidden'); // Ensure shell visible
                this.switchTab('home');
                break;

            case 'auth':
                Auth.openModal();
                break;

            case 'app':
                if (!Store.state.user) return this.go('auth');
                document.getElementById('app-root').classList.remove('hidden');
                this.switchTab('dashboard');
                break;

            // Direct Links
            case 'create':
            case 'projects':
            case 'premium':
            case 'referral':
            case 'hosting':
            case 'support':
                if (!Store.state.user && !Store.state.isOffline) {
                    sessionStorage.setItem('ZULORA_REDIRECT', route);
                    Auth.openModal();
                    return;
                }
                document.getElementById('app-root').classList.remove('hidden');
                this.switchTab(route);
                break;

            default:
                this.switchTab('home');
        }
    },

    switchTab(tabId) {
        // Valid tabs map
        const valid = ['home', 'dashboard', 'create', 'projects', 'premium', 'referral', 'support', 'hosting'];
        const target = valid.includes(tabId) ? tabId : 'home';

        // Hide sections
        document.querySelectorAll('section[id^="view-"]').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active', 'animate-fade-in');
        });

        // Show Target
        const view = document.getElementById(`view-${target}`);
        if(view) {
            view.classList.remove('hidden');
            void view.offsetWidth; // Reflow
            view.classList.add('active', 'animate-fade-in');
        }

        // Scroll top
        const vp = document.getElementById('main-viewport');
        if(vp) vp.scrollTo(0,0);
    }
};
window.router = Router;

/* --------------------------------------------------------------------------
   SECTION 6: SIDEBAR (DRAWER)
   -------------------------------------------------------------------------- */
const Sidebar = {
    el: document.getElementById('sidebar-drawer'),
    overlay: document.getElementById('sidebar-overlay'),
    
    toggle() {
        if(!this.el) return;
        if (this.el.classList.contains('translate-x-full')) this.open();
        else this.close();
    },

    open() {
        if(!this.el) return;
        this.el.classList.remove('translate-x-full');
        this.overlay.classList.remove('hidden');
        setTimeout(() => this.overlay.classList.remove('opacity-0'), 10);
    },

    close() {
        if(!this.el) return;
        this.el.classList.add('translate-x-full');
        this.overlay.classList.add('opacity-0');
        setTimeout(() => this.overlay.classList.add('hidden'), 300);
    }
};
window.sidebar = Sidebar;

/* --------------------------------------------------------------------------
   SECTION 7: AUTHENTICATION (FIREBASE + GOOGLE)
   -------------------------------------------------------------------------- */
const Auth = {
    init() {
        if (firebase && !firebase.apps.length) {
            try {
                firebase.initializeApp(ENV.firebase);
                // Persistence
                firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            } catch (e) {
                console.error("Firebase Init Error:", e);
                Store.state.isOffline = true;
            }
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log(`[Auth] User: ${user.email}`);
                Store.setUser(user);
                await DB.syncProfile(user);
                this.closeModal();

                // Redirect Handling
                const redirect = sessionStorage.getItem('ZULORA_REDIRECT');
                if (redirect) {
                    sessionStorage.removeItem('ZULORA_REDIRECT');
                    Router.go(redirect);
                } else {
                    // Only toast if just logged in
                    if(document.getElementById('nav-logged-out').classList.contains('hidden') === false) {
                        UI.toast(`Welcome back, ${user.displayName}`, 'success');
                    }
                }
                
                // Pending Prompts
                const prompt = sessionStorage.getItem('ZULORA_PENDING_PROMPT');
                if (prompt) {
                    Router.go('create');
                    setTimeout(() => {
                        const input = document.getElementById('ai-prompt-input');
                        if(input) input.value = prompt;
                        sessionStorage.removeItem('ZULORA_PENDING_PROMPT');
                    }, 500);
                }

            } else {
                Store.setUser(null);
            }
        });

        this.provider = provider;
    },

    openModal() {
        const m = document.getElementById('auth-modal');
        if(m) {
            m.classList.remove('hidden');
            setTimeout(() => m.classList.remove('opacity-0', 'scale-95'), 10);
        }
    },

    closeModal() {
        const m = document.getElementById('auth-modal');
        if(m) {
            m.classList.add('opacity-0', 'scale-95');
            setTimeout(() => m.classList.add('hidden'), 300);
        }
    },

    async signIn() {
        const btn = document.getElementById('google-signin-btn');
        const original = btn.innerHTML;
        btn.innerHTML = `<i class="ri-loader-4-line animate-spin text-xl"></i> Connecting...`;
        btn.disabled = true;

        try {
            await firebase.auth().signInWithPopup(this.provider);
        } catch (error) {
            console.error(error);
            UI.toast("Sign in failed. Try again.", "error");
            btn.innerHTML = original;
            btn.disabled = false;
        }
    },

    logout() {
        firebase.auth().signOut();
        Sidebar.close();
        UI.toast("Signed out successfully.", "info");
        Router.go('home');
    }
};
window.auth = Auth;

/* --------------------------------------------------------------------------
   SECTION 8: DATABASE & REFERRAL ENGINE
   -------------------------------------------------------------------------- */
const DB = {
    async syncProfile(user) {
        if (Store.state.isOffline) return;

        const db = firebase.firestore();
        const docRef = db.collection('users').doc(user.uid);

        try {
            const doc = await docRef.get();

            if (doc.exists) {
                const data = doc.data();
                // Ensure photoURL update
                if(data.photoURL !== user.photoURL) {
                    await docRef.update({ photoURL: user.photoURL });
                    data.photoURL = user.photoURL;
                }
                Store.updateProfile(data);
            } else {
                // NEW USER REGISTRATION
                console.log("[DB] Registering New User");
                
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
                    newProfile.credits += SYSTEM.economy.referralReward;
                    UI.toast(`Referral Accepted! +${SYSTEM.economy.referralReward} Credits`, "gold");
                    // In real backend, award referrer here
                }

                await docRef.set(newProfile);
                Store.updateProfile(newProfile);
            }
            App.renderProjects();
        } catch (e) {
            console.error("DB Error:", e);
        }
    },

    async saveProject(project) {
        const currentProjects = [project, ...(Store.state.profile.projects || [])];
        Store.updateProfile({ projects: currentProjects });
        App.renderProjects();

        if (Store.state.user && !Store.state.isOffline) {
            try {
                await firebase.firestore().collection('users').doc(Store.state.user.uid).update({
                    projects: currentProjects,
                    credits: Store.state.profile.credits
                });
            } catch(e) { console.error(e); }
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 9: NEURAL ENGINE (AI GENERATION)
   -------------------------------------------------------------------------- */
const AI = {
    triggerFromHome() {
        const val = document.getElementById('hero-prompt').value;
        if (!val) return UI.toast("Please enter a prompt", "warning");
        
        sessionStorage.setItem('ZULORA_PENDING_PROMPT', val);
        if (Store.state.user) {
            Router.go('create');
            setTimeout(() => {
                const el = document.getElementById('ai-prompt-input');
                if(el) el.value = val;
            }, 500);
        } else {
            Auth.openModal();
        }
    },

    async generate() {
        const input = document.getElementById('ai-prompt-input');
        const prompt = input.value.trim().toLowerCase();
        
        if (!prompt) return UI.toast("Prompt cannot be empty", "error");
        
        if (Store.state.profile.credits < SYSTEM.economy.generationCost) {
            Router.go('premium');
            return UI.toast("Insufficient Credits. Upgrade needed.", "error");
        }

        const btn = document.getElementById('btn-generate');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="flex items-center gap-2"><i class="ri-loader-4-line animate-spin"></i> Processing...</span>`;
        btn.disabled = true;

        try {
            await Utils.wait(2500); // Simulate processing

            // Deduct Credits
            Store.deductCredits(SYSTEM.economy.generationCost);

            // Select Template
            let t = 'startup';
            if (prompt.includes('shop') || prompt.includes('store')) t = 'store';
            else if (prompt.includes('portfolio') || prompt.includes('resume')) t = 'portfolio';
            else if (prompt.includes('food') || prompt.includes('restaurant')) t = 'restaurant';
            else if (prompt.includes('agency')) t = 'agency';
            else if (prompt.includes('blog')) t = 'blog';

            const html = Templates[t](Store.state.profile.displayName);

            const project = {
                id: Utils.uuid(),
                name: prompt.substring(0, 25) + (prompt.length > 25 ? '...' : ''),
                subdomain: `${Store.state.profile.displayName.toLowerCase().replace(/ /g,'')}-${Math.floor(Math.random()*999)}`,
                html: html,
                engine: document.querySelector('input[name="ai_engine"]:checked')?.value || 'claude',
                createdAt: new Date().toISOString()
            };

            await DB.saveProject(project);
            
            UI.toast("Website Built Successfully!", "success");
            input.value = "";
            Editor.open(project);

        } catch (e) {
            console.error(e);
            UI.toast("Generation Error. Credits Refunded.", "error");
            Store.addCredits(SYSTEM.economy.generationCost);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};
window.ai = AI;

/* --------------------------------------------------------------------------
   SECTION 10: TEMPLATE LIBRARY
   -------------------------------------------------------------------------- */
const Templates = {
    startup: (n) => `<!DOCTYPE html><html class="scroll-smooth"><head><script src="https://cdn.tailwindcss.com"></script></head><body class="font-sans antialiased text-slate-900 bg-white"><nav class="p-6 flex justify-between items-center border-b"><div class="text-xl font-bold text-indigo-600">${n} Inc.</div><button class="bg-slate-900 text-white px-5 py-2 rounded-lg">Login</button></nav><header class="py-32 text-center px-4"><h1 class="text-6xl font-black mb-6">Ship Faster.</h1><p class="text-xl text-slate-500 mb-8">The ultimate platform for growth.</p><button class="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold">Get Started</button></header></body></html>`,
    portfolio: (n) => `<!DOCTYPE html><html class="dark"><head><script src="https://cdn.tailwindcss.com"></script><script>tailwind.config={darkMode:'class'}</script></head><body class="bg-black text-white font-sans"><nav class="p-8 flex justify-between"><div class="font-bold tracking-widest">${n}</div><a href="#" class="underline">Contact</a></nav><header class="py-32 px-8"><h1 class="text-9xl font-black mb-4">VISUAL<br><span class="text-green-500">ARTIST.</span></h1></header></body></html>`,
    store: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-stone-50 font-serif"><nav class="p-6 border-b border-stone-200 flex justify-between"><div class="text-2xl font-bold italic">${n}</div><div>Cart (0)</div></nav><header class="py-24 text-center"><h1 class="text-7xl mb-6">New Arrivals</h1><button class="bg-black text-white px-8 py-3 uppercase tracking-widest text-sm">Shop Now</button></header></body></html>`,
    restaurant: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-orange-50 font-sans"><nav class="p-6 flex justify-between"><div class="text-2xl font-bold text-orange-900">${n}</div><button class="bg-orange-600 text-white px-6 py-2 rounded-full">Book Table</button></nav><header class="py-32 text-center"><h1 class="text-6xl font-black text-orange-950 mb-4">Taste Real Food.</h1></header></body></html>`,
    agency: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-zinc-900 text-white font-sans"><nav class="p-6 border-b border-zinc-800"><div class="font-bold text-xl">${n} Agency</div></nav><header class="py-32 px-6"><h1 class="text-7xl font-bold mb-6">Digital Impact.</h1><p class="text-xl text-zinc-400">We build brands.</p></header></body></html>`,
    blog: (n) => `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white font-serif"><nav class="p-6 border-b"><div class="font-bold text-xl">${n}'s Blog</div></nav><main class="max-w-2xl mx-auto py-12 px-4"><h1 class="text-4xl font-bold mb-4">Hello World</h1><p class="text-lg text-gray-600">Welcome to my new site.</p></main></body></html>`
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
            
            // Edit Script
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

    save() {
        if(!this.current) return;
        const html = this.frame.contentWindow.document.documentElement.outerHTML;
        const projects = Store.state.profile.projects;
        const idx = projects.findIndex(p => p.id === this.current.id);
        
        if(idx > -1) {
            projects[idx].html = html;
            Store.updateProfile({ projects });
            DB.saveProject(this.current);
            UI.toast("Published Live!", "success");
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
        const list = document.getElementById('project-list');
        const dashList = document.getElementById('dash-project-list'); // If used
        const empty = document.getElementById('project-empty');
        const projects = Store.state.profile.projects || [];

        // Clear existing
        if(list) list.innerHTML = '';
        
        if (projects.length === 0) {
            if(empty) { empty.classList.remove('hidden'); empty.classList.add('flex'); }
            return;
        }

        if(empty) { empty.classList.add('hidden'); empty.classList.remove('flex'); }

        const render = (p) => `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-brand-500/50 transition group shadow-sm" onclick='editor.open(${JSON.stringify(p)})'>
                <div class="h-40 bg-slate-950 relative overflow-hidden">
                    <iframe srcdoc="${p.html.replace(/"/g, "'")}" class="w-[200%] h-[200%] scale-50 origin-top-left pointer-events-none opacity-60 group-hover:opacity-100 transition grayscale group-hover:grayscale-0"></iframe>
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80 group-hover:opacity-40 transition"></div>
                    <div class="absolute bottom-3 left-3"><span class="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded backdrop-blur">LIVE</span></div>
                </div>
                <div class="p-4">
                    <h4 class="text-white font-bold truncate">${p.name}</h4>
                    <p class="text-xs text-slate-500 font-mono">${p.subdomain}.zulora.in</p>
                </div>
            </div>`;

        if(list) list.innerHTML = projects.map(render).join('');
    }
};

// --- GLOBAL UTILS FOR HTML ACCESS ---
window.utils = Utils;

// --- START SYSTEM ---
window.addEventListener('load', App.init);
