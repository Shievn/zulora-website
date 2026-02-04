/**
 * ==========================================================================================
 * ZULORA OS - CORE KERNEL (JAVASCRIPT)
 * Version: 4.0.0 (Enterprise Edition)
 * Architecture: MVC (Model-View-Controller)
 * Tech Stack: Vanilla JS, Firebase SDK, Local Neural Engine
 * ==========================================================================================
 */

/* --------------------------------------------------------------------------
   1. SYSTEM CONFIGURATION
   -------------------------------------------------------------------------- */
const CONFIG = {
    appName: "Zulora",
    currency: "INR",
    credits: {
        signupBonus: 30, // 10 (base) + 20 (promo)
        referralBonus: 10,
        generationCost: 15
    },
    // Firebase Config (Replace with your actual keys if needed)
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
   2. UTILITY SERVICE
   -------------------------------------------------------------------------- */
class Utils {
    static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static generateRefCode() {
        return 'REF' + Math.floor(100000 + Math.random() * 900000);
    }

    static async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            UI.toast(`Copied: ${text}`, 'success');
        } catch (err) {
            UI.toast('Failed to copy', 'error');
        }
    }

    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static getUrlParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }
}

/* --------------------------------------------------------------------------
   3. UI CONTROLLER (Toasts, Loaders, Stats)
   -------------------------------------------------------------------------- */
class UIController {
    constructor() {
        this.loader = document.getElementById('master-loader');
        this.toastContainer = document.getElementById('toast-container');
    }

    init() {
        // Hide Master Loader after 1.5s
        setTimeout(() => {
            if(this.loader) {
                this.loader.style.opacity = '0';
                setTimeout(() => this.loader.style.display = 'none', 500);
            }
        }, 1500);
    }

    toast(message, type = 'info') {
        const toast = document.createElement('div');
        let bgClass = 'bg-slate-900 border-slate-700 text-white';
        let icon = '<i class="ri-information-line text-blue-400"></i>';

        if (type === 'success') {
            bgClass = 'bg-slate-900 border-green-900 text-white';
            icon = '<i class="ri-checkbox-circle-fill text-green-500"></i>';
        }
        if (type === 'error') {
            bgClass = 'bg-slate-900 border-red-900 text-white';
            icon = '<i class="ri-error-warning-fill text-red-500"></i>';
        }

        toast.className = `${bgClass} border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] animate-bounce-in`;
        toast.innerHTML = `
            <div class="text-xl">${icon}</div>
            <div class="font-medium text-sm">${message}</div>
        `;

        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    updateStats(profile) {
        // Sidebar
        this.setText('sidebar-name', profile.displayName || 'Creator');
        this.setText('sidebar-credits', profile.credits);
        
        // Mobile Header
        this.setText('mobile-credits', `${profile.credits} Cr`);

        // Dashboard
        this.setText('dash-credits-lg', profile.credits);
        this.setText('dash-referrals-count', profile.referrals || 0);
        
        // Referral Input
        const input = document.getElementById('referral-link-input');
        if(input) input.value = `${window.location.origin}?ref=${profile.referralCode}`;
    }

    setText(id, text) {
        const el = document.getElementById(id);
        if(el) el.innerText = text;
    }
}
const UI = new UIController();

/* --------------------------------------------------------------------------
   4. ROUTER (View Navigation)
   -------------------------------------------------------------------------- */
class Router {
    constructor() {
        this.landing = document.getElementById('view-landing');
        this.auth = document.getElementById('view-auth');
        this.shell = document.getElementById('app-shell');
        this.internalViews = document.querySelectorAll('.view-section');
    }

    // High Level Navigation (Landing <-> Auth <-> App)
    go(route) {
        if (route === 'landing') {
            this.landing.classList.remove('hidden');
            this.auth.classList.add('hidden');
            this.shell.classList.add('hidden');
        } 
        else if (route === 'auth') {
            this.landing.classList.add('hidden');
            this.auth.classList.remove('hidden');
            this.shell.classList.add('hidden');
        } 
        else if (route === 'app') {
            this.landing.classList.add('hidden');
            this.auth.classList.add('hidden');
            this.shell.classList.remove('hidden');
        }
        // Internal App Routes
        else {
            if (this.shell.classList.contains('hidden')) this.go('app');
            this.switchInternal(route);
        }
    }

    // Internal Dashboard Navigation
    switchInternal(viewId) {
        const target = document.getElementById(`view-${viewId}`);
        if (!target) return;

        this.internalViews.forEach(v => {
            v.classList.add('hidden');
            v.classList.remove('active');
        });

        target.classList.remove('hidden');
        // Animation frame to allow transitions
        requestAnimationFrame(() => target.classList.add('active'));

        // Update Nav Active States
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => el.classList.remove('active'));
        // (Simple logic: highlighting handled via onclick classes in HTML or specific logic here)
    }
}
const router = new Router();
window.router = router;

/* --------------------------------------------------------------------------
   5. DATABASE SERVICE (Persistence)
   -------------------------------------------------------------------------- */
class DBService {
    constructor() { this.db = null; }
    
    init() { this.db = firebase.firestore(); }

    async getProfile(user) {
        const docRef = this.db.collection('users').doc(user.uid);
        const doc = await docRef.get();
        if (doc.exists) return doc.data();
        return await this.createProfile(user);
    }

    async createProfile(user) {
        // Check for Referral
        const refSource = localStorage.getItem('zulora_ref_source');
        let credits = CONFIG.credits.signupBonus;

        // If referred, give credit to referrer (Mocked logic for client-side)
        if (refSource) {
            console.log("Referred by:", refSource);
            // In a real app, cloud functions handle the cross-user credit update
            UI.toast('Referral bonus applied!', 'success');
        }

        const profile = {
            uid: user.uid,
            email: user.email,
            displayName: user.email.split('@')[0],
            credits: credits,
            referralCode: Utils.generateRefCode(),
            referrals: 0,
            projects: [],
            createdAt: new Date().toISOString()
        };

        await this.db.collection('users').doc(user.uid).set(profile);
        return profile;
    }

    async update(uid, data) {
        await this.db.collection('users').doc(uid).update(data);
    }
}
const DB = new DBService();

/* --------------------------------------------------------------------------
   6. AUTHENTICATION CONTROLLER
   -------------------------------------------------------------------------- */
class AuthController {
    constructor() {
        this.auth = null;
        this.user = null;
        this.profile = null;
        this.mode = 'login';
    }

    init() {
        if (!firebase.apps.length) firebase.initializeApp(CONFIG.firebase);
        this.auth = firebase.auth();
        DB.init();

        // Check URL Ref
        const ref = Utils.getUrlParam('ref');
        if (ref) {
            localStorage.setItem('zulora_ref_source', ref);
            this.toggle('signup'); // Auto switch to signup
            // Pre-fill hidden input if exists
             const refInput = document.getElementById('auth-referral');
             if(refInput) refInput.value = ref;
        }

        // Listener
        this.auth.onAuthStateChanged(async (u) => {
            if (u) {
                this.user = u;
                this.profile = await DB.getProfile(u);
                
                // Initialize App Data
                App.initDashboard(this.profile);
                router.go('app');
                UI.toast(`Welcome back, ${this.profile.displayName}`, 'success');

                // CHECK PENDING AI PROMPT (From Landing Page)
                const pendingPrompt = localStorage.getItem('zulora_pending_prompt');
                if(pendingPrompt) {
                    localStorage.removeItem('zulora_pending_prompt');
                    router.go('create');
                    document.getElementById('ai-prompt-input').value = pendingPrompt;
                    // Optional: Auto-generate
                    // AI.generate(); 
                    UI.toast('Restored your prompt. Ready to build!', 'info');
                }

            } else {
                // Stay on Landing Page unless manually navigated
                // If we are on app shell, kick to landing
                if (!document.getElementById('app-shell').classList.contains('hidden')) {
                    router.go('landing');
                }
            }
            UI.init(); // Hide master loader
        });
    }

    toggle(mode) {
        this.mode = mode;
        const btn = document.getElementById('auth-submit-btn');
        const loginTab = document.getElementById('tab-login');
        const signupTab = document.getElementById('tab-signup');
        const refField = document.getElementById('referral-field');

        if (mode === 'signup') {
            btn.innerText = "Create Free Account";
            loginTab.classList.replace('bg-indigo-600', 'text-slate-400');
            loginTab.classList.replace('text-white', 'text-slate-400'); // simple toggle logic
            signupTab.className = "flex-1 py-2 text-sm font-bold text-white bg-indigo-600 rounded shadow-lg transition-all";
            loginTab.className = "flex-1 py-2 text-sm font-bold text-slate-400 hover:text-white transition-all";
            refField.classList.remove('hidden');
        } else {
            btn.innerText = "Log In to Dashboard";
            loginTab.className = "flex-1 py-2 text-sm font-bold text-white bg-indigo-600 rounded shadow-lg transition-all";
            signupTab.className = "flex-1 py-2 text-sm font-bold text-slate-400 hover:text-white transition-all";
            refField.classList.add('hidden');
        }
    }

    async submit() {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-password').value;
        if (!email || !pass) return UI.toast('Please enter email and password', 'error');

        const btn = document.getElementById('auth-submit-btn');
        const originalText = btn.innerText;
        btn.innerText = "Processing...";
        btn.disabled = true;

        try {
            if (this.mode === 'signup') {
                await this.auth.createUserWithEmailAndPassword(email, pass);
            } else {
                await this.auth.signInWithEmailAndPassword(email, pass);
            }
            // onAuthStateChanged handles redirection
        } catch (err) {
            UI.toast(err.message, 'error');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    logout() {
        this.auth.signOut();
        router.go('landing');
        UI.toast('Logged out successfully');
    }
}
const auth = new AuthController();
window.auth = auth;

/* --------------------------------------------------------------------------
   7. AI ENGINE (Hybrid Logic)
   -------------------------------------------------------------------------- */
class AIEngine {
    
    // Triggered from Landing Page Input
    generateFromLanding() {
        const input = document.getElementById('hero-input');
        const val = input.value.trim();
        
        if (!val) return UI.toast('Please describe your business first.', 'error');

        // Store prompt
        localStorage.setItem('zulora_pending_prompt', val);
        
        // Redirect to Auth to capture lead
        router.go('auth');
        auth.toggle('signup'); // Encourage signup
        UI.toast('Please create an account to save your website.', 'info');
    }

    fillPrompt(text) {
        document.getElementById('ai-prompt-input').value = text;
    }

    useTemplate(type) {
        const templates = {
            'business': 'A corporate landing page for a SaaS company with blue theme, hero section, pricing, and features.',
            'portfolio': 'A minimalist dark-themed portfolio for a creative designer with gallery and contact form.',
            'store': 'A modern e-commerce homepage for a fashion brand with product grid and newsletter.'
        };
        this.fillPrompt(templates[type]);
        router.go('create');
        UI.toast('Template loaded. Click Generate.', 'success');
    }

    async generate() {
        const promptInput = document.getElementById('ai-prompt-input');
        const prompt = promptInput.value.trim();
        const profile = auth.profile;

        if (!prompt) return UI.toast('Please enter a description.', 'error');
        if (profile.credits < CONFIG.credits.generationCost) {
            router.go('premium');
            return UI.toast('Insufficient Credits. Upgrade Plan.', 'error');
        }

        // UI Loading State
        const btn = document.getElementById('btn-generate');
        btn.innerText = "Building...";
        btn.disabled = true;

        await Utils.wait(1500); // Simulate AI Thinking

        try {
            // Generate Code (Local Engine to bypass CORS/API costs for demo)
            const html = this.localNeuralEngine(prompt, profile);
            
            // Deduct Credits
            profile.credits -= CONFIG.credits.generationCost;
            await DB.update(profile.uid, { credits: profile.credits });
            UI.updateStats(profile);

            // Save Project
            const project = {
                id: Utils.uuid(),
                name: prompt.substring(0, 15) + '...',
                subdomain: `${profile.displayName.toLowerCase().replace(/\s/g,'')}-${Math.floor(Math.random()*999)}`,
                html: html,
                createdAt: new Date().toISOString()
            };

            if (!profile.projects) profile.projects = [];
            profile.projects.unshift(project);
            await DB.update(profile.uid, { projects: profile.projects });

            // Reset UI
            promptInput.value = '';
            btn.innerText = `Generate (${CONFIG.credits.generationCost} Cr)`;
            btn.disabled = false;
            
            UI.toast('Website Generated Successfully!', 'success');
            
            // Open Editor
            editor.open(project);
            App.renderProjectsList(profile.projects);

        } catch (err) {
            console.error(err);
            UI.toast('Generation failed.', 'error');
            btn.innerText = "Generate";
            btn.disabled = false;
        }
    }

    // --- LOCAL GENERATOR (Ensures result) ---
    localNeuralEngine(prompt, user) {
        const p = prompt.toLowerCase();
        const isDark = p.includes('dark');
        
        let theme = isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900';
        let nav = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100';

        // Dynamic Content Logic
        let heroTitle = "Build the Future.";
        let heroSub = "We provide the best solutions for your growth.";
        
        if (p.includes('coffee')) {
            heroTitle = "Fresh Brewed Happiness.";
            heroSub = "Experience the finest beans roasted to perfection.";
        } else if (p.includes('portfolio')) {
            heroTitle = `I am ${user.displayName}.`;
            heroSub = "Visual Designer & Creative Developer based in India.";
        } else if (p.includes('pizza') || p.includes('food')) {
            heroTitle = "Taste the Authentic.";
            heroSub = "Fresh ingredients, wood-fired oven, delivered hot.";
        }

        return `
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
</head>
<body class="${theme} antialiased font-sans">
    <nav class="fixed w-full z-50 ${nav} backdrop-blur border-b">
        <div class="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
            <div class="font-bold text-xl tracking-tight">Brand.</div>
            <div class="space-x-6 text-sm font-medium opacity-80">
                <a href="#" class="hover:text-indigo-500">Home</a>
                <a href="#" class="hover:text-indigo-500">Services</a>
                <a href="#" class="hover:text-indigo-500">Contact</a>
            </div>
        </div>
    </nav>
    <section class="pt-32 pb-20 px-6 text-center">
        <h1 class="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">${heroTitle}</h1>
        <p class="text-xl opacity-70 mb-8 max-w-2xl mx-auto">${heroSub}</p>
        <button class="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition">Get Started</button>
    </section>
    <section class="py-20 px-6">
        <div class="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            <div class="p-8 border border-gray-200 dark:border-gray-800 rounded-2xl hover:shadow-xl transition">
                <i class="ri-rocket-line text-3xl text-indigo-500 mb-4 block"></i>
                <h3 class="text-xl font-bold mb-2">Fast & Secure</h3>
                <p class="opacity-70">Built for speed and performance.</p>
            </div>
            <div class="p-8 border border-gray-200 dark:border-gray-800 rounded-2xl hover:shadow-xl transition">
                <i class="ri-palette-line text-3xl text-purple-500 mb-4 block"></i>
                <h3 class="text-xl font-bold mb-2">Modern Design</h3>
                <p class="opacity-70">Crafted with attention to detail.</p>
            </div>
            <div class="p-8 border border-gray-200 dark:border-gray-800 rounded-2xl hover:shadow-xl transition">
                <i class="ri-customer-service-line text-3xl text-pink-500 mb-4 block"></i>
                <h3 class="text-xl font-bold mb-2">24/7 Support</h3>
                <p class="opacity-70">We are always here to help you.</p>
            </div>
        </div>
    </section>
    <footer class="py-10 text-center opacity-60 border-t border-gray-200 dark:border-gray-800">
        &copy; ${new Date().getFullYear()} ${user.displayName}. Powered by Zulora.
    </footer>
</body>
</html>`;
    }
}
const ai = new AIEngine();
window.ai = ai;

/* --------------------------------------------------------------------------
   8. EDITOR CONTROLLER
   -------------------------------------------------------------------------- */
class EditorController {
    constructor() {
        this.modal = document.getElementById('editor-modal');
        this.frame = document.getElementById('preview-frame');
        this.currentProject = null;
    }

    open(project) {
        this.currentProject = project;
        this.modal.classList.remove('hidden');
        document.getElementById('editor-subdomain').innerText = `${project.subdomain}.zulora.in`;
        
        // Write content
        const doc = this.frame.contentWindow.document;
        doc.open();
        doc.write(project.html);
        doc.close();

        // Inject Click-to-Edit script
        const script = doc.createElement('script');
        script.textContent = `
            document.body.addEventListener('click', e => {
                if(['H1','P','BUTTON','A'].includes(e.target.tagName)) {
                    e.preventDefault();
                    e.target.contentEditable = true;
                    e.target.focus();
                }
            });
        `;
        doc.body.appendChild(script);
    }

    close() {
        this.modal.classList.add('hidden');
        this.frame.src = 'about:blank';
    }

    setView(mode) {
        const container = document.getElementById('editor-frame-container');
        if (mode === 'mobile') {
            container.style.width = '375px';
            container.style.height = '667px';
            container.style.border = '10px solid #1e293b';
            container.style.borderRadius = '20px';
        } else {
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.border = 'none';
            container.style.borderRadius = '0';
        }
    }

    save() {
        const newHtml = this.frame.contentWindow.document.documentElement.outerHTML;
        // Update local state
        const projects = auth.profile.projects;
        const idx = projects.findIndex(p => p.id === this.currentProject.id);
        if (idx !== -1) projects[idx].html = newHtml;
        
        // Sync DB
        DB.update(auth.profile.uid, { projects: projects });
        UI.toast('Changes published!', 'success');
    }
}
const editor = new EditorController();
window.editor = editor;

/* --------------------------------------------------------------------------
   9. REFERRAL & PAYMENT
   -------------------------------------------------------------------------- */
const referral = {
    copy: () => {
        const val = document.getElementById('referral-link-input').value;
        Utils.copy(val);
    },
    share: (platform) => {
        const link = document.getElementById('referral-link-input').value;
        const text = "Build AI websites with Zulora! Get 30 Free Credits:";
        if(platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`);
        if(platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`);
    }
};
window.referral = referral;

const payment = {
    openModal: () => document.getElementById('payment-modal').classList.remove('hidden'),
    closeModal: () => document.getElementById('payment-modal').classList.add('hidden')
};
window.payment = payment;

/* --------------------------------------------------------------------------
   10. APP INITIALIZER
   -------------------------------------------------------------------------- */
const App = {
    init: () => {
        auth.init(); // Starts everything
    },

    initDashboard: (profile) => {
        UI.updateStats(profile);
        App.renderProjectsList(profile.projects);
    },

    renderProjectsList: (projects) => {
        const list = document.getElementById('dashboard-projects-list');
        const allList = document.getElementById('all-projects-container');
        const empty = document.getElementById('dashboard-empty-state');

        if (!projects || projects.length === 0) {
            empty.classList.remove('hidden');
            list.innerHTML = '';
            allList.innerHTML = '<p class="text-white text-center col-span-full">No projects found.</p>';
            return;
        }

        empty.classList.add('hidden');
        
        const html = projects.map(p => `
            <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-indigo-500 transition cursor-pointer" onclick='editor.open(${JSON.stringify(p)})'>
                <div class="h-40 bg-slate-800 relative overflow-hidden">
                    <iframe srcdoc="${p.html.replace(/"/g, "'")}" class="w-[200%] h-[200%] scale-50 origin-top-left pointer-events-none"></iframe>
                    <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition"></div>
                </div>
                <div class="p-4">
                    <h4 class="text-white font-bold truncate">${p.name}</h4>
                    <p class="text-xs text-indigo-400">${p.subdomain}.zulora.in</p>
                </div>
            </div>
        `).join('');

        list.innerHTML = html; // Shows all in dashboard for now (can slice for recent)
        allList.innerHTML = html;
        
        document.getElementById('dash-sites-count').innerText = projects.length;
    }
};

// Launch
window.onload = App.init;
