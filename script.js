/**
 * ==========================================================================================
 * ZULORA OS - TITANIUM KERNEL (v17.0.0 PATCHED)
 * "The Unbreakable Neural Engine"
 * * [ CRITICAL FIXES ]
 * 1. FIXED: Mobile Menu/Sidebar Toggle (Three Lines)
 * 2. FIXED: 'Create from AI' Button Routing
 * 3. FIXED: Event Listener Race Conditions
 * 4. ADDED: Manual DOM Binding for guaranteed interactivity
 * * (c) 2026 Zulora Inc. | Enterprise License
 * ==========================================================================================
 */

"use strict";

/* --------------------------------------------------------------------------
   SECTION 1: KERNEL CONFIGURATION
   -------------------------------------------------------------------------- */
const ENV = window.ZULORA_CONFIG || {};

const SYSTEM = {
    version: '17.0.0-titanium',
    build: '2026.02.06.HOTFIX',
    debug: true, 
    
    // Economic Engine
    economy: {
        signupBonus: 30,
        referralReward: 15,
        generationCost: 15,
        aiEditCost: 5,
        premiumCost: 299,
        premiumCredits: 1000
    },

    // Support Vectors
    support: {
        ...ENV.admin,
        faq: "https://zulora.in/docs"
    },

    // Hosting Simulation
    hosting: {
        tld: '.zulora.in',
        propagationDelay: 1500
    },

    // AI Model Config
    ai: {
        defaults: { engine: 'openai', temperature: 0.7 }
    }
};

/* --------------------------------------------------------------------------
   SECTION 2: GLOBAL UTILITY TOOLKIT
   -------------------------------------------------------------------------- */
const Utils = {
    uuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    generateRefCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = 'ZUL-';
        for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    },

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

    wait(ms) { return new Promise(r => setTimeout(r, ms)); },

    getParam(name) { return new URLSearchParams(window.location.search).get(name); },

    openLink(type) {
        const s = SYSTEM.support;
        const urls = {
            whatsapp: `https://wa.me/${s.whatsapp}?text=Help`,
            email: `mailto:${s.email}`,
            instagram: s.instagram
        };
        if(urls[type]) window.open(urls[type], '_blank');
    }
};

/* --------------------------------------------------------------------------
   SECTION 3: STATE STORE (PERSISTENT DATA)
   -------------------------------------------------------------------------- */
class StateStore {
    constructor() {
        this.state = {
            user: null, 
            profile: {
                uid: null,
                displayName: 'Guest',
                email: '',
                photoURL: null,
                credits: 0,
                referrals: 0,
                referralCode: 'INIT...',
                projects: [],
                isPremium: false
            },
            isOffline: false
        };
        this.subscribers = [];
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem('ZULORA_V17_CORE');
            if (raw) {
                const data = JSON.parse(raw);
                this.state.profile = { ...this.state.profile, ...data.profile };
            }
        } catch (e) { localStorage.removeItem('ZULORA_V17_CORE'); }
    }

    save() {
        try {
            localStorage.setItem('ZULORA_V17_CORE', JSON.stringify({ profile: this.state.profile }));
        } catch (e) {}
    }

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

    subscribe(fn) { this.subscribers.push(fn); }
    notify() { this.subscribers.forEach(fn => fn(this.state)); UI.render(); }
}

const Store = new StateStore();

/* --------------------------------------------------------------------------
   SECTION 4: UI CONTROLLER
   -------------------------------------------------------------------------- */
const UI = {
    els: {
        loader: document.getElementById('bootloader'),
        dock: document.getElementById('toast-dock')
    },

    boot() {
        console.log(">> [Boot] System Online");
        const bar = document.getElementById('boot-bar');
        if(bar) bar.style.width = '100%';

        setTimeout(() => {
            if(this.els.loader) {
                this.els.loader.style.opacity = '0';
                this.els.loader.style.pointerEvents = 'none';
                setTimeout(() => this.els.loader.style.display = 'none', 300);
            }
        }, 500);
    },

    toast(msg, type = 'info') {
        const card = document.createElement('div');
        const themes = {
            success: 'border-green-500/20 bg-surface/95 text-green-400',
            error: 'border-red-500/20 bg-surface/95 text-red-400',
            info: 'border-brand-500/20 bg-surface/95 text-brand-400',
            gold: 'border-yellow-500/20 bg-surface/95 text-yellow-400'
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
        requestAnimationFrame(() => card.classList.remove('translate-x-full'));
        setTimeout(() => {
            card.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => card.remove(), 500);
        }, 3500);
    },

    render() {
        const s = Store.state;
        const p = s.profile;
        const isLoggedIn = !!s.user || (s.isOffline && p.uid);

        const guestUI = document.getElementById('auth-guest');
        const userUI = document.getElementById('auth-user');
        
        if (isLoggedIn) {
            if(guestUI) guestUI.classList.add('hidden');
            if(userUI) userUI.classList.remove('hidden');
            
            // Text Updates
            const setText = (id, val) => {
                const el = document.getElementById(id);
                if(el) el.innerText = val;
            };

            setText('header-credits', p.credits);
            setText('drawer-name', p.displayName);
            setText('drawer-email', p.email);
            setText('drawer-credits', p.credits);
            setText('stat-credits', p.credits);
            setText('stat-projects', p.projects.length);
            setText('stat-referrals', p.referrals);

            // Avatar Updates
            const avatars = document.querySelectorAll('#header-avatar, #drawer-avatar');
            avatars.forEach(av => {
                if(p.photoURL) av.innerHTML = `<img src="${p.photoURL}" class="w-full h-full object-cover">`;
                else av.innerHTML = p.displayName.charAt(0).toUpperCase();
            });

            const refInput = document.getElementById('ref-link');
            if(refInput) refInput.value = `${window.location.origin}?ref=${p.referralCode}`;

        } else {
            if(guestUI) guestUI.classList.remove('hidden');
            if(userUI) userUI.classList.add('hidden');
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 5: ROUTER (NAVIGATION)
   -------------------------------------------------------------------------- */
const Router = {
    go(route) {
        // Force Close Sidebar on nav
        Sidebar.close();
        
        // Auth Guard
        if (['create', 'projects', 'premium', 'referral', 'hosting'].includes(route)) {
            const s = Store.state;
            if (!s.user && !s.isOffline) {
                sessionStorage.setItem('ZULORA_REDIRECT', route);
                Auth.openModal();
                return;
            }
        }

        this.switchView(route);
    },

    switchView(viewId) {
        const map = {
            'home': 'view-home',
            'create': 'view-create',
            'premium': 'view-premium',
            'referral': 'view-referral',
            'projects': 'view-home', 
            'hosting': 'view-home'
        };

        const targetId = map[viewId] || 'view-home';

        // Hide all
        document.querySelectorAll('.view-section').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('animate-fade-in-up');
        });

        // Show target
        const target = document.getElementById(targetId);
        if(target) {
            target.classList.remove('hidden');
            void target.offsetWidth; 
            target.classList.add('animate-fade-in-up');
        }

        // Scroll top
        const stage = document.getElementById('content-stage');
        if(stage) stage.scrollTo(0,0);
    }
};
// Expose Router Globally
window.router = Router;

/* --------------------------------------------------------------------------
   SECTION 6: SIDEBAR (FIXED LOGIC)
   -------------------------------------------------------------------------- */
const Sidebar = {
    // Left sidebar is static on desktop.
    // Right sidebar is the mobile/user drawer.
    el: document.getElementById('sidebar-right'), // Was 'sidebar-drawer' in previous versions
    overlay: document.getElementById('sidebar-overlay'),
    
    // Toggle Function - Called by the 3-line button
    toggle() {
        // Fallback if ID changed in HTML
        if (!this.el) this.el = document.getElementById('sidebar-drawer') || document.getElementById('sidebar-right');
        
        if(!this.el) return console.error("Sidebar element not found");

        if (this.el.classList.contains('translate-x-full')) this.open();
        else this.close();
    },

    open() {
        if (!this.el) this.el = document.getElementById('sidebar-drawer') || document.getElementById('sidebar-right');
        this.el.classList.remove('translate-x-full');
        this.overlay.classList.remove('hidden');
        setTimeout(() => this.overlay.classList.remove('opacity-0'), 10);
    },

    close() {
        if (!this.el) this.el = document.getElementById('sidebar-drawer') || document.getElementById('sidebar-right');
        this.el.classList.add('translate-x-full');
        this.overlay.classList.add('opacity-0');
        setTimeout(() => this.overlay.classList.add('hidden'), 300);
    },

    // Alias for compatibility
    toggleRight() { this.toggle(); }
};
// Expose Sidebar Globally
window.sidebar = Sidebar;

/* --------------------------------------------------------------------------
   SECTION 7: AUTHENTICATION
   -------------------------------------------------------------------------- */
const Auth = {
    init() {
        if (firebase && !firebase.apps.length) {
            try {
                firebase.initializeApp(ENV.firebase);
                // Auth Listener
                firebase.auth().onAuthStateChanged(this.handleState.bind(this));
            } catch (e) {
                console.error("Firebase Error -> Ghost Mode");
                Store.state.isOffline = true;
            }
        }
    },

    async handleState(user) {
        if (user) {
            Store.setUser(user);
            await DB.sync(user);
            this.closeModal();
            
            const redirect = sessionStorage.getItem('ZULORA_REDIRECT');
            if(redirect) {
                sessionStorage.removeItem('ZULORA_REDIRECT');
                Router.go(redirect);
            }
            UI.toast(`Welcome, ${user.displayName}`, "success");
        } else {
            Store.setUser(null);
        }
    },

    openModal() {
        document.getElementById('auth-modal').classList.remove('hidden');
    },

    close() {
        document.getElementById('auth-modal').classList.add('hidden');
    },

    async signIn() {
        // Ghost Mode Check
        if(Store.state.isOffline) {
            this.handleState({ uid: 'ghost-'+Utils.uuid(), email: 'demo@zulora.in', displayName: 'Ghost User' });
            return;
        }

        const btn = document.getElementById('btn-google-login') || document.getElementById('google-signin-btn');
        if(btn) {
            const original = btn.innerHTML;
            btn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Connecting...`;
            btn.disabled = true;
            
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                await firebase.auth().signInWithPopup(provider);
            } catch(e) {
                UI.toast("Sign in failed.", "error");
                btn.innerHTML = original;
                btn.disabled = false;
            }
        }
    },

    logout() {
        if(!Store.state.isOffline) firebase.auth().signOut();
        Store.setUser(null);
        Sidebar.close();
        Router.go('home');
        UI.toast("Signed out", "info");
    }
};
window.auth = Auth;

/* --------------------------------------------------------------------------
   SECTION 8: DATABASE
   -------------------------------------------------------------------------- */
const DB = {
    async sync(user) {
        if(Store.state.isOffline) return;
        const db = firebase.firestore();
        const ref = db.collection('users').doc(user.uid);
        
        try {
            const doc = await ref.get();
            if(doc.exists) {
                Store.updateProfile(doc.data());
            } else {
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
                
                // Referral Check
                const refCode = Utils.getParam('ref');
                if(refCode) {
                    newProfile.credits += SYSTEM.economy.referralReward;
                    UI.toast("Referral Bonus +15 Credits!", "gold");
                }
                
                await ref.set(newProfile);
                Store.updateProfile(newProfile);
            }
            App.renderProjects();
        } catch(e) { console.warn("DB Sync Failed"); }
    },

    async saveProject(project) {
        const current = [project, ...Store.state.profile.projects];
        Store.updateProfile({ projects: current });
        App.renderProjects();
        
        if(Store.state.user && !Store.state.isOffline) {
            try {
                await firebase.firestore().collection('users').doc(Store.state.user.uid).update({
                    projects: current,
                    credits: Store.state.profile.credits
                });
            } catch(e) {}
        }
    }
};

/* --------------------------------------------------------------------------
   SECTION 9: AI & TEMPLATES
   -------------------------------------------------------------------------- */
const AI = {
    async generate() {
        const input = document.getElementById('ai-prompt');
        const prompt = input.value.trim().toLowerCase();
        
        if(!prompt) return UI.toast("Please describe your website.", "error");
        if(Store.state.profile.credits < SYSTEM.economy.generationCost) {
            Router.go('premium');
            return UI.toast("Insufficient Credits.", "error");
        }

        const btn = document.getElementById('btn-generate');
        const original = btn.innerHTML;
        btn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Generating...`;
        btn.disabled = true;

        try {
            // Deduct
            Store.transact(SYSTEM.economy.generationCost, 'deduct');
            await Utils.wait(2000);

            // Select Template
            let tId = 'startup';
            if(prompt.includes('shop') || prompt.includes('store')) tId = 'store';
            else if(prompt.includes('portfolio')) tId = 'portfolio';
            else if(prompt.includes('food')) tId = 'restaurant';
            else if(prompt.includes('dashboard')) tId = 'dashboard';

            const html = Templates[tId](Store.state.profile.displayName);
            
            const project = {
                id: Utils.uuid(),
                name: prompt.substring(0, 25),
                subdomain: `${Store.state.profile.displayName.toLowerCase().replace(/[^a-z0-9]/g,'')}-${Math.floor(Math.random()*999)}`,
                files: { 'index.html': html },
                createdAt: new Date().toISOString()
            };

            await DB.saveProject(project);
            UI.toast("Website Created!", "success");
            input.value = "";
            Editor.launch(project);

        } catch(e) {
            UI.toast("Error generating.", "error");
            Store.transact(SYSTEM.economy.generationCost, 'add'); // Refund
        } finally {
            btn.innerHTML = original;
            btn.disabled = false;
        }
    }
};
window.ai = AI;

/*
const Templates = {
    
    // 1. SAAS STARTUP TEMPLATE
    startup: (n) => `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${n} - Grow Faster</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
    <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap'); body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-white text-slate-900 antialiased">
    <nav class="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold"><i class="ri-rocket-2-fill"></i></div>
                <span class="text-xl font-bold tracking-tight">${n}</span>
            </div>
            <div class="hidden md:flex gap-8 text-sm font-medium text-slate-500">
                <a href="#features" class="hover:text-blue-600 transition">Features</a>
                <a href="#pricing" class="hover:text-blue-600 transition">Pricing</a>
                <a href="#testimonials" class="hover:text-blue-600 transition">Customers</a>
            </div>
            <div class="flex gap-4">
                <button class="hidden md:block text-slate-900 font-medium text-sm">Log in</button>
                <button class="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">Get Started</button>
            </div>
        </div>
    </nav>

    <header class="pt-32 pb-20 px-6 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/3 -translate-y-1/4"></div>
        <div class="max-w-5xl mx-auto text-center">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-8 border border-blue-100">
                <span class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span> v2.0 is now live
            </div>
            <h1 class="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight text-slate-900">
                Scale your business <br>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">without the chaos.</span>
            </h1>
            <p class="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                The all-in-one platform designed to help you automate workflows, manage teams, and drive revenue. No credit card required.
            </p>
            <div class="flex flex-col md:flex-row justify-center gap-4">
                <button class="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2">
                    Start Free Trial <i class="ri-arrow-right-line"></i>
                </button>
                <button class="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2">
                    <i class="ri-play-circle-line"></i> Watch Demo
                </button>
            </div>
            
            <div class="mt-16 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/50 max-w-4xl mx-auto">
                <div class="bg-slate-50 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-100">
                    <div class="text-slate-300 text-center">
                        <i class="ri-layout-masonry-line text-6xl"></i>
                        <p class="mt-2 font-medium">Dashboard Interface Preview</p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <section id="features" class="py-24 bg-slate-50">
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-16">
                <h2 class="text-3xl font-bold mb-4">Everything you need</h2>
                <p class="text-slate-500">Powerful features to help you grow.</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                    <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-2xl mb-6"><i class="ri-bar-chart-box-line"></i></div>
                    <h3 class="text-xl font-bold mb-3">Analytics</h3>
                    <p class="text-slate-500 leading-relaxed">Real-time data visualization to track your key performance indicators instantly.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                    <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-2xl mb-6"><i class="ri-team-line"></i></div>
                    <h3 class="text-xl font-bold mb-3">Team Sync</h3>
                    <p class="text-slate-500 leading-relaxed">Collaborate with your team in real-time with built-in commenting and tasks.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                    <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-2xl mb-6"><i class="ri-shield-keyhole-line"></i></div>
                    <h3 class="text-xl font-bold mb-3">Bank Security</h3>
                    <p class="text-slate-500 leading-relaxed">Enterprise-grade encryption keeps your data safe and compliant with GDPR.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="pricing" class="py-24 px-6">
        <div class="max-w-7xl mx-auto">
            <div class="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 class="text-4xl font-bold mb-6">Simple, transparent pricing.</h2>
                    <p class="text-lg text-slate-500 mb-8">No hidden fees. Cancel anytime.</p>
                    <ul class="space-y-4 text-slate-600">
                        <li class="flex items-center gap-3"><i class="ri-checkbox-circle-fill text-green-500"></i> Unlimited Projects</li>
                        <li class="flex items-center gap-3"><i class="ri-checkbox-circle-fill text-green-500"></i> 24/7 Priority Support</li>
                        <li class="flex items-center gap-3"><i class="ri-checkbox-circle-fill text-green-500"></i> Advanced Analytics</li>
                    </ul>
                </div>
                <div class="bg-slate-900 text-white p-10 rounded-3xl relative overflow-hidden shadow-2xl">
                    <div class="absolute top-0 right-0 bg-blue-600 w-32 h-32 blur-3xl opacity-20"></div>
                    <p class="text-slate-400 font-medium uppercase tracking-widest text-xs mb-2">PRO PLAN</p>
                    <div class="flex items-baseline gap-1 mb-6">
                        <span class="text-5xl font-bold">$29</span>
                        <span class="text-slate-400">/month</span>
                    </div>
                    <button class="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold transition mb-4">Get Started Now</button>
                    <p class="text-center text-xs text-slate-500">7-day free trial included.</p>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-slate-50 border-t border-slate-200 py-16 px-6">
        <div class="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
            <div class="col-span-1 md:col-span-2">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-xs font-bold"><i class="ri-rocket-2-fill"></i></div>
                    <span class="font-bold text-lg">${n}</span>
                </div>
                <p class="text-slate-500 text-sm max-w-xs">Making the world more productive, one task at a time. Built for modern teams.</p>
            </div>
            <div>
                <h4 class="font-bold mb-4">Product</h4>
                <ul class="space-y-2 text-sm text-slate-500">
                    <li><a href="#" class="hover:text-blue-600">Features</a></li>
                    <li><a href="#" class="hover:text-blue-600">Integrations</a></li>
                    <li><a href="#" class="hover:text-blue-600">Pricing</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold mb-4">Company</h4>
                <ul class="space-y-2 text-sm text-slate-500">
                    <li><a href="#" class="hover:text-blue-600">About</a></li>
                    <li><a href="#" class="hover:text-blue-600">Blog</a></li>
                    <li><a href="#" class="hover:text-blue-600">Contact</a></li>
                </ul>
            </div>
        </div>
        <div class="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
            &copy; 2026 ${n} Inc. All rights reserved.
        </div>
    </footer>
</body>
</html>`,

    // 2. CREATIVE PORTFOLIO TEMPLATE
    portfolio: (n) => `<!DOCTYPE html>
<html lang="en" class="scroll-smooth dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${n} | Visual Designer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { fontFamily: { sans: ['Manrope', 'sans-serif'] } } } }
    </script>
    <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
    <style>@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;800&display=swap');</style>
</head>
<body class="bg-black text-gray-100 font-sans selection:bg-lime-400 selection:text-black">
    
    <nav class="fixed w-full top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div class="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <a href="#" class="text-xl font-bold tracking-tighter uppercase">${n}.</a>
            <div class="flex gap-6 text-sm font-medium text-gray-400">
                <a href="#work" class="hover:text-white transition">Work</a>
                <a href="#about" class="hover:text-white transition">About</a>
                <a href="#contact" class="hover:text-white transition">Contact</a>
            </div>
        </div>
    </nav>

    <header class="min-h-screen flex items-center justify-center px-6 relative overflow-hidden pt-20">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800/20 via-black to-black"></div>
        <div class="max-w-5xl text-center relative z-10">
            <p class="text-lime-400 font-mono mb-6 animate-pulse">● Available for freelance</p>
            <h1 class="text-6xl md:text-9xl font-extrabold tracking-tighter mb-8 leading-none">
                VISUAL <br>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-600">ALCHEMIST</span>
            </h1>
            <p class="text-xl md:text-2xl text-neutral-500 max-w-2xl mx-auto mb-12">
                I craft digital experiences that blend aesthetic purity with functional depth. Based in the digital void.
            </p>
            <div class="flex justify-center gap-4">
                <a href="#work" class="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-lime-400 transition transform hover:scale-105">View Projects</a>
                <a href="#contact" class="px-8 py-4 rounded-full font-bold border border-white/20 hover:border-white transition">Contact Me</a>
            </div>
        </div>
    </header>

    <section id="work" class="py-32 px-6 border-t border-white/10">
        <div class="max-w-7xl mx-auto">
            <div class="flex justify-between items-end mb-16">
                <h2 class="text-4xl font-bold">Selected Works</h2>
                <span class="text-neutral-500">(2023 - 2026)</span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="group cursor-pointer">
                    <div class="aspect-[4/3] bg-neutral-900 rounded-2xl overflow-hidden relative mb-6 border border-white/5">
                        <div class="absolute inset-0 bg-neutral-800 group-hover:scale-105 transition duration-700 ease-out"></div>
                        <div class="absolute bottom-6 left-6 bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                            <span class="text-xs font-mono text-lime-400">UI/UX Design</span>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold mb-2 group-hover:text-lime-400 transition">Neon Finance App</h3>
                    <p class="text-neutral-500">Fintech mobile application redesign.</p>
                </div>

                <div class="group cursor-pointer md:mt-16">
                    <div class="aspect-[4/3] bg-neutral-900 rounded-2xl overflow-hidden relative mb-6 border border-white/5">
                        <div class="absolute inset-0 bg-neutral-800 group-hover:scale-105 transition duration-700 ease-out"></div>
                        <div class="absolute bottom-6 left-6 bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                            <span class="text-xs font-mono text-lime-400">Branding</span>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold mb-2 group-hover:text-lime-400 transition">Cyber Zenith</h3>
                    <p class="text-neutral-500">Brand identity for an AI startup.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="py-24 px-6 bg-neutral-900/30">
        <div class="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
            <div>
                <h4 class="text-lime-400 font-mono mb-4">01.</h4>
                <h3 class="text-2xl font-bold mb-4">Product Design</h3>
                <p class="text-neutral-500">End-to-end product design from initial wireframes to high-fidelity prototypes.</p>
            </div>
            <div>
                <h4 class="text-lime-400 font-mono mb-4">02.</h4>
                <h3 class="text-2xl font-bold mb-4">Development</h3>
                <p class="text-neutral-500">Bringing designs to life with modern frontend technologies (React, Tailwind, Three.js).</p>
            </div>
            <div>
                <h4 class="text-lime-400 font-mono mb-4">03.</h4>
                <h3 class="text-2xl font-bold mb-4">Art Direction</h3>
                <p class="text-neutral-500">Guiding the visual language and aesthetic consistency of your brand.</p>
            </div>
        </div>
    </section>

    <section id="contact" class="py-32 px-6 border-t border-white/10 text-center">
        <h2 class="text-5xl md:text-7xl font-bold mb-8">Let's build the future.</h2>
        <a href="mailto:hello@${n}.com" class="inline-block text-2xl md:text-4xl text-neutral-400 hover:text-white border-b border-neutral-700 hover:border-white pb-2 transition">hello@${n.toLowerCase()}.com</a>
        <div class="mt-20 flex justify-center gap-8 text-sm text-neutral-500 font-mono uppercase">
            <a href="#" class="hover:text-lime-400">Instagram</a>
            <a href="#" class="hover:text-lime-400">Twitter / X</a>
            <a href="#" class="hover:text-lime-400">LinkedIn</a>
        </div>
    </section>
</body>
</html>`,

    // 3. E-COMMERCE STORE TEMPLATE
    store: (n) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${n} | Official Store</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
    <style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap');</style>
</head>
<body class="bg-stone-50 text-stone-900 font-[Lato]">
    
    <div class="bg-stone-900 text-white text-center text-xs py-2 uppercase tracking-widest">
        Free Shipping on all orders over $150
    </div>

    <nav class="sticky top-0 bg-white/95 backdrop-blur z-40 border-b border-stone-200">
        <div class="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <button class="text-2xl"><i class="ri-menu-2-line"></i></button>
            <div class="text-3xl font-[Playfair_Display] font-bold italic tracking-tighter">${n}</div>
            <div class="flex gap-6 text-xl">
                <button><i class="ri-search-line"></i></button>
                <button class="relative">
                    <i class="ri-shopping-bag-line"></i>
                    <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">0</span>
                </button>
            </div>
        </div>
    </nav>

    <header class="relative h-[80vh] bg-stone-200 flex items-center justify-center overflow-hidden">
        <div class="absolute inset-0 bg-stone-300">
            <div class="w-full h-full bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-80"></div>
        </div>
        <div class="relative z-10 text-center text-white px-6">
            <p class="uppercase tracking-[0.3em] text-sm mb-4">Summer Collection 2026</p>
            <h1 class="text-6xl md:text-8xl font-[Playfair_Display] mb-8">Timeless Elegance</h1>
            <button class="bg-white text-stone-900 px-10 py-4 uppercase tracking-widest text-sm hover:bg-stone-100 transition">Shop The Collection</button>
        </div>
    </header>

    <section class="py-20 px-6 max-w-7xl mx-auto">
        <div class="grid md:grid-cols-3 gap-8">
            <div class="relative h-[500px] bg-stone-200 group overflow-hidden cursor-pointer">
                <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800" class="w-full h-full object-cover transition duration-700 group-hover:scale-110">
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition"></div>
                <div class="absolute bottom-8 left-8 text-white">
                    <h3 class="text-3xl font-[Playfair_Display] italic">Dresses</h3>
                    <span class="border-b border-white pb-1">View All</span>
                </div>
            </div>
            <div class="relative h-[500px] bg-stone-200 group overflow-hidden cursor-pointer">
                <img src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800" class="w-full h-full object-cover transition duration-700 group-hover:scale-110">
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition"></div>
                <div class="absolute bottom-8 left-8 text-white">
                    <h3 class="text-3xl font-[Playfair_Display] italic">Outerwear</h3>
                    <span class="border-b border-white pb-1">View All</span>
                </div>
            </div>
            <div class="relative h-[500px] bg-stone-200 group overflow-hidden cursor-pointer">
                <img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800" class="w-full h-full object-cover transition duration-700 group-hover:scale-110">
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition"></div>
                <div class="absolute bottom-8 left-8 text-white">
                    <h3 class="text-3xl font-[Playfair_Display] italic">Accessories</h3>
                    <span class="border-b border-white pb-1">View All</span>
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 px-6 bg-white">
        <div class="max-w-7xl mx-auto">
            <h2 class="text-4xl font-[Playfair_Display] text-center mb-16">Trending Now</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
                <div class="group cursor-pointer">
                    <div class="bg-stone-100 aspect-[3/4] mb-4 overflow-hidden relative">
                        <img src="https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600" class="w-full h-full object-cover group-hover:opacity-0 transition duration-500 absolute">
                        <img src="https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?w=600" class="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition duration-500">
                        <div class="absolute bottom-0 left-0 w-full bg-white p-3 text-center translate-y-full group-hover:translate-y-0 transition duration-300">Quick Add</div>
                    </div>
                    <h3 class="text-lg">Silk Blouse</h3>
                    <p class="text-stone-500">$120.00</p>
                </div>
                <div class="group cursor-pointer">
                    <div class="bg-stone-100 aspect-[3/4] mb-4 overflow-hidden relative">
                        <img src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600" class="w-full h-full object-cover">
                    </div>
                    <h3 class="text-lg">Linen Trousers</h3>
                    <p class="text-stone-500">$185.00</p>
                </div>
                <div class="group cursor-pointer">
                    <div class="bg-stone-100 aspect-[3/4] mb-4 overflow-hidden relative">
                        <img src="https://images.unsplash.com/photo-1551488852-080175b922a9?w=600" class="w-full h-full object-cover">
                    </div>
                    <h3 class="text-lg">Structured Blazer</h3>
                    <p class="text-stone-500">$250.00</p>
                </div>
                <div class="group cursor-pointer">
                    <div class="bg-stone-100 aspect-[3/4] mb-4 overflow-hidden relative">
                        <img src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600" class="w-full h-full object-cover">
                    </div>
                    <h3 class="text-lg">Evening Gown</h3>
                    <p class="text-stone-500">$450.00</p>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-stone-900 text-white py-20 px-6">
        <div class="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 text-sm text-stone-400">
            <div>
                <h4 class="text-white text-xl font-[Playfair_Display] italic mb-6">${n}</h4>
                <p>Redefining modern luxury through sustainable practices and timeless design.</p>
            </div>
            <div>
                <h5 class="text-white uppercase tracking-widest mb-6">Shop</h5>
                <ul class="space-y-3">
                    <li><a href="#">New Arrivals</a></li>
                    <li><a href="#">Best Sellers</a></li>
                    <li><a href="#">Dresses</a></li>
                    <li><a href="#">Accessories</a></li>
                </ul>
            </div>
            <div>
                <h5 class="text-white uppercase tracking-widest mb-6">Help</h5>
                <ul class="space-y-3">
                    <li><a href="#">Shipping & Returns</a></li>
                    <li><a href="#">Size Guide</a></li>
                    <li><a href="#">FAQ</a></li>
                    <li><a href="#">Contact Us</a></li>
                </ul>
            </div>
            <div>
                <h5 class="text-white uppercase tracking-widest mb-6">Stay Connected</h5>
                <p class="mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
                <div class="flex border-b border-stone-700 pb-2">
                    <input type="email" placeholder="Enter your email" class="bg-transparent w-full outline-none text-white">
                    <button class="text-white uppercase tracking-widest">Join</button>
                </div>
            </div>
        </div>
    </footer>
</body>
</html>`,

    // 4. RESTAURANT TEMPLATE
    restaurant: (n) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${n} | Fine Dining</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
    <style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;600&display=swap');</style>
</head>
<body class="bg-stone-900 text-stone-100 font-['Montserrat']">

    <nav class="absolute w-full z-50 px-6 py-8">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
            <div class="text-3xl font-['Cormorant_Garamond'] font-bold text-amber-500 tracking-wider">${n}</div>
            <div class="hidden md:flex gap-8 text-sm uppercase tracking-widest">
                <a href="#menu" class="hover:text-amber-500 transition">Menu</a>
                <a href="#about" class="hover:text-amber-500 transition">Story</a>
                <a href="#gallery" class="hover:text-amber-500 transition">Gallery</a>
            </div>
            <button class="bg-amber-600 text-white px-6 py-2 uppercase text-xs font-bold tracking-widest hover:bg-amber-700 transition">Book a Table</button>
        </div>
    </nav>

    <header class="h-screen relative flex items-center justify-center text-center px-4">
        <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=2070')] bg-cover bg-center">
            <div class="absolute inset-0 bg-black/60"></div>
        </div>
        <div class="relative z-10">
            <p class="text-amber-500 uppercase tracking-[0.3em] mb-4">Est. 2026</p>
            <h1 class="text-6xl md:text-9xl font-['Cormorant_Garamond'] font-bold mb-8 leading-none">Taste the <br> Extraordinary</h1>
            <p class="text-lg text-stone-300 max-w-2xl mx-auto mb-10 font-light">Experience a culinary journey inspired by tradition, crafted with passion, and served with elegance.</p>
            <a href="#menu" class="inline-block border border-amber-500 text-amber-500 px-8 py-3 uppercase tracking-widest text-sm hover:bg-amber-500 hover:text-white transition">View Menu</a>
        </div>
    </header>

    <section id="about" class="py-24 px-6 bg-stone-900">
        <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
                <div class="w-full aspect-[4/5] bg-stone-800 rounded-lg overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800" class="w-full h-full object-cover">
                    <div class="absolute -bottom-6 -right-6 w-40 h-40 border-2 border-amber-500 z-[-1]"></div>
                </div>
            </div>
            <div>
                <h3 class="text-amber-500 uppercase tracking-widest text-sm mb-4">Our Story</h3>
                <h2 class="text-5xl font-['Cormorant_Garamond'] font-bold mb-6">Cooking is an art, <br>served with love.</h2>
                <p class="text-stone-400 leading-relaxed mb-6">
                    Located in the heart of the city, ${n} brings you the finest flavors from around the world. Our chefs use only the freshest, locally-sourced ingredients to create dishes that are not just food, but an experience.
                </p>
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Signature_sample.svg" class="h-12 opacity-50 invert">
            </div>
        </div>
    </section>

    <section id="menu" class="py-24 px-6 bg-stone-950">
        <div class="max-w-4xl mx-auto">
            <div class="text-center mb-16">
                <h3 class="text-amber-500 uppercase tracking-widest text-sm mb-2">Discover</h3>
                <h2 class="text-5xl font-['Cormorant_Garamond'] font-bold">The Menu</h2>
            </div>

            <div class="space-y-12">
                <div>
                    <h4 class="text-2xl font-['Cormorant_Garamond'] border-b border-stone-800 pb-4 mb-8 text-center">Starters</h4>
                    <div class="grid gap-8">
                        <div class="flex justify-between items-baseline group">
                            <div class="flex-1">
                                <h5 class="text-xl font-['Cormorant_Garamond'] font-bold group-hover:text-amber-500 transition">Truffle Arancini</h5>
                                <p class="text-stone-500 text-sm mt-1">Risotto balls, black truffle, mozzarella, marinara.</p>
                            </div>
                            <div class="text-amber-500 font-bold ml-4">$18</div>
                        </div>
                        <div class="flex justify-between items-baseline group">
                            <div class="flex-1">
                                <h5 class="text-xl font-['Cormorant_Garamond'] font-bold group-hover:text-amber-500 transition">Wagyu Beef Carpaccio</h5>
                                <p class="text-stone-500 text-sm mt-1">Parmesan, arugula, capers, truffle oil.</p>
                            </div>
                            <div class="text-amber-500 font-bold ml-4">$24</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 class="text-2xl font-['Cormorant_Garamond'] border-b border-stone-800 pb-4 mb-8 text-center mt-12">Main Course</h4>
                    <div class="grid gap-8">
                        <div class="flex justify-between items-baseline group">
                            <div class="flex-1">
                                <h5 class="text-xl font-['Cormorant_Garamond'] font-bold group-hover:text-amber-500 transition">Pan-Seared Scallops</h5>
                                <p class="text-stone-500 text-sm mt-1">Cauliflower puree, crispy pancetta, lemon butter.</p>
                            </div>
                            <div class="text-amber-500 font-bold ml-4">$38</div>
                        </div>
                        <div class="flex justify-between items-baseline group">
                            <div class="flex-1">
                                <h5 class="text-xl font-['Cormorant_Garamond'] font-bold group-hover:text-amber-500 transition">Herb-Crusted Lamb Rack</h5>
                                <p class="text-stone-500 text-sm mt-1">Fondant potato, seasonal greens, red wine jus.</p>
                            </div>
                            <div class="text-amber-500 font-bold ml-4">$45</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-black text-center py-16 px-6">
        <h2 class="text-4xl font-['Cormorant_Garamond'] text-amber-500 mb-8">${n}</h2>
        <div class="text-stone-400 mb-8">
            <p>123 Culinary Avenue, Food District</p>
            <p>reservations@${n.toLowerCase()}.com | (555) 123-4567</p>
        </div>
        <div class="flex justify-center gap-6 text-xl text-stone-500">
            <a href="#" class="hover:text-white"><i class="ri-instagram-line"></i></a>
            <a href="#" class="hover:text-white"><i class="ri-facebook-circle-line"></i></a>
            <a href="#" class="hover:text-white"><i class="ri-tripadvisor-line"></i></a>
        </div>
    </footer>
</body>
</html>`,

    // 5. DASHBOARD TEMPLATE (Admin Panel)
    dashboard: (n) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${n} | Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
    <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'); body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 text-slate-900 flex h-screen overflow-hidden">

    <aside class="w-64 bg-slate-900 text-white flex-col hidden md:flex">
        <div class="h-16 flex items-center px-6 border-b border-slate-800">
            <div class="font-bold text-xl tracking-tight">${n} <span class="text-blue-500">Admin</span></div>
        </div>
        <div class="flex-1 overflow-y-auto py-4">
            <nav class="px-3 space-y-1">
                <a href="#" class="flex items-center gap-3 px-3 py-2 bg-blue-600 text-white rounded-lg transition"><i class="ri-dashboard-line"></i> Dashboard</a>
                <a href="#" class="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"><i class="ri-user-line"></i> Users</a>
                <a href="#" class="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"><i class="ri-shopping-cart-line"></i> Orders</a>
                <a href="#" class="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"><i class="ri-bar-chart-box-line"></i> Analytics</a>
                <a href="#" class="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"><i class="ri-settings-4-line"></i> Settings</a>
            </nav>
        </div>
        <div class="p-4 border-t border-slate-800">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">A</div>
                <div class="text-sm">
                    <div class="font-medium">Admin User</div>
                    <div class="text-xs text-slate-500">admin@${n.toLowerCase()}.com</div>
                </div>
            </div>
        </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
            <button class="md:hidden text-slate-500"><i class="ri-menu-line text-xl"></i></button>
            <div class="text-lg font-semibold text-slate-800">Overview</div>
            <div class="flex items-center gap-4">
                <button class="text-slate-400 hover:text-slate-600"><i class="ri-notification-3-line text-xl"></i></button>
                <div class="w-8 h-8 rounded-full bg-slate-200"></div>
            </div>
        </header>

        <div class="flex-1 overflow-auto p-6 md:p-8">
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-slate-500 text-sm font-medium">Total Revenue</p>
                            <h3 class="text-2xl font-bold mt-1">$45,231</h3>
                        </div>
                        <div class="p-2 bg-green-100 text-green-600 rounded-lg"><i class="ri-money-dollar-circle-line"></i></div>
                    </div>
                    <span class="text-green-500 text-sm font-medium">↑ 20.1%</span> <span class="text-slate-400 text-xs">from last month</span>
                </div>
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-slate-500 text-sm font-medium">Active Users</p>
                            <h3 class="text-2xl font-bold mt-1">2,345</h3>
                        </div>
                        <div class="p-2 bg-blue-100 text-blue-600 rounded-lg"><i class="ri-user-follow-line"></i></div>
                    </div>
                    <span class="text-green-500 text-sm font-medium">↑ 15%</span> <span class="text-slate-400 text-xs">from last month</span>
                </div>
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-slate-500 text-sm font-medium">New Orders</p>
                            <h3 class="text-2xl font-bold mt-1">+574</h3>
                        </div>
                        <div class="p-2 bg-purple-100 text-purple-600 rounded-lg"><i class="ri-shopping-bag-3-line"></i></div>
                    </div>
                    <span class="text-red-500 text-sm font-medium">↓ 4.5%</span> <span class="text-slate-400 text-xs">from last month</span>
                </div>
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-slate-500 text-sm font-medium">Pending Issues</p>
                            <h3 class="text-2xl font-bold mt-1">12</h3>
                        </div>
                        <div class="p-2 bg-orange-100 text-orange-600 rounded-lg"><i class="ri-alert-line"></i></div>
                    </div>
                    <span class="text-slate-400 text-xs">Requires attention</span>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800">Recent Transactions</h3>
                    <button class="text-sm text-blue-600 font-medium">View All</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-slate-600">
                        <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-medium text-xs">
                            <tr>
                                <th class="px-6 py-3">Transaction ID</th>
                                <th class="px-6 py-3">Customer</th>
                                <th class="px-6 py-3">Date</th>
                                <th class="px-6 py-3">Amount</th>
                                <th class="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            <tr class="hover:bg-slate-50 transition">
                                <td class="px-6 py-4 font-mono text-xs">#TRX-9871</td>
                                <td class="px-6 py-4 font-medium text-slate-900">Emma Watson</td>
                                <td class="px-6 py-4">Oct 24, 2026</td>
                                <td class="px-6 py-4">$120.00</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Completed</span></td>
                            </tr>
                            <tr class="hover:bg-slate-50 transition">
                                <td class="px-6 py-4 font-mono text-xs">#TRX-9872</td>
                                <td class="px-6 py-4 font-medium text-slate-900">James Doe</td>
                                <td class="px-6 py-4">Oct 24, 2026</td>
                                <td class="px-6 py-4">$85.50</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pending</span></td>
                            </tr>
                            <tr class="hover:bg-slate-50 transition">
                                <td class="px-6 py-4 font-mono text-xs">#TRX-9873</td>
                                <td class="px-6 py-4 font-medium text-slate-900">Sarah Connor</td>
                                <td class="px-6 py-4">Oct 23, 2026</td>
                                <td class="px-6 py-4">$340.00</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Completed</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>
</body>
</html>`
};

/* --------------------------------------------------------------------------
   SECTION 10: EDITOR
   -------------------------------------------------------------------------- */
const Editor = {
    els: {
        modal: document.getElementById('editor-modal'),
        iframe: document.getElementById('editor-frame'),
        url: document.getElementById('editor-url')
    },
    project: null,

    launch(p) {
        this.project = p;
        this.els.modal.classList.remove('hidden');
        this.els.url.innerText = `https://${p.subdomain}.zulora.in`;
        this.els.url.href = `https://${p.subdomain}.zulora.in`;
        
        requestAnimationFrame(() => {
            this.els.modal.classList.remove('opacity-0');
            this.render();
        });
    },

    render() {
        const doc = this.els.iframe.contentWindow.document;
        doc.open();
        doc.write(this.project.files['index.html']);
        doc.close();
        
        // Editable Script
        const s = doc.createElement('script');
        s.innerHTML = `document.body.addEventListener('click', e => { if(['H1','P','BUTTON'].includes(e.target.tagName)) { e.preventDefault(); e.target.contentEditable=true; e.target.focus(); }})`;
        doc.body.appendChild(s);
    },

    close() {
        this.els.modal.classList.add('opacity-0');
        setTimeout(() => {
            this.els.modal.classList.add('hidden');
            this.els.iframe.src = 'about:blank';
        }, 300);
        App.renderProjects();
    },

    save() {
        if(!this.project) return;
        const html = this.els.iframe.contentWindow.document.documentElement.outerHTML;
        this.project.files['index.html'] = html;
        DB.saveProject(this.project);
        UI.toast("Published Live!", "success");
    }
};
window.editor = Editor;

/* --------------------------------------------------------------------------
   SECTION 11: INITIALIZATION
   -------------------------------------------------------------------------- */
const App = {
    init() {
        UI.boot();
        Auth.init();
        this.setupEvents();
    },

    setupEvents() {
        // Manual Event Binding to Fix "Buttons Not Working"
        
        // 1. Mobile Menu (Three Lines)
        const btnMenu = document.getElementById('mobile-menu-trigger') || document.querySelector('button[onclick*="sidebar"]');
        if(btnMenu) {
            btnMenu.onclick = (e) => {
                e.preventDefault();
                Sidebar.toggle();
            };
        }

        // 2. User Menu (Avatar)
        const btnUser = document.getElementById('user-menu-trigger');
        if(btnUser) {
            btnUser.onclick = (e) => {
                e.preventDefault();
                Sidebar.toggleRight();
            };
        }

        // 3. Create Buttons
        const createBtns = document.querySelectorAll('#btn-create-new, #btn-launch-builder');
        createBtns.forEach(btn => {
            btn.onclick = () => Router.go('create');
        });

        // 4. Editor Buttons
        const closeEd = document.getElementById('btn-editor-close');
        if(closeEd) closeEd.onclick = () => Editor.close();
        
        const pubEd = document.getElementById('btn-publish');
        if(pubEd) pubEd.onclick = () => Editor.save();
    },

    renderProjects() {
        const list = document.getElementById('project-list');
        const empty = document.getElementById('project-empty');
        const projects = Store.state.profile.projects || [];

        if(projects.length === 0) {
            if(empty) { empty.classList.remove('hidden'); empty.classList.add('flex'); }
            if(list) list.innerHTML = '';
            return;
        }

        if(empty) { empty.classList.add('hidden'); empty.classList.remove('flex'); }

        if(list) {
            list.innerHTML = projects.map(p => `
                <div class="bg-surface border border-border rounded-xl overflow-hidden group hover:border-brand-500/50 transition-all cursor-pointer" onclick='editor.launch(${JSON.stringify(p)})'>
                    <div class="h-32 bg-panel relative">
                        <iframe srcdoc="${p.files['index.html'].replace(/"/g, "'")}" class="w-[200%] h-[200%] scale-50 origin-top-left pointer-events-none opacity-60"></iframe>
                        <div class="absolute bottom-2 left-2"><span class="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold">LIVE</span></div>
                    </div>
                    <div class="p-4">
                        <h4 class="text-white font-bold text-sm truncate">${p.name}</h4>
                        <div class="text-[10px] text-gray-500 truncate">${p.subdomain}.zulora.in</div>
                    </div>
                </div>
            `).join('');
        }
    }
};

// Start System
window.addEventListener('load', () => App.init());
