/**
 * ============================================================================
 * ZULORA STUDIO - CORTEX ENGINE (GEN 17.0)
 * ============================================================================
 * @version 17.0.0 (Production Master)
 * @author Zulora AI Team
 * @description Controls AI Generation, Editor Logic, Auth, and Payments.
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
   1. CONFIGURATION & API VAULT
   ---------------------------------------------------------------------------- */

// Firebase Configuration (From your request)
const firebaseConfig = {
    apiKey: "AIzaSyC4XXmvYQap_Y1tXF-mWG82rL5MsBXjcvQ",
    authDomain: "zulorain.firebaseapp.com",
    projectId: "zulorain",
    storageBucket: "zulorain.firebasestorage.app",
    messagingSenderId: "972907481049",
    appId: "1:972907481049:web:b4d02b9808f9e2f3f8bbc8"
};

const CONFIG = {
    appName: "Zulora Studio",
    domain: "zulora.in",
    
    // Support Contacts
    support: {
        whatsapp: "916395211325",
        email: "zulora.help@gmail.com",
        insta: "zulora_official"
    },
    
    // Economy
    credits: {
        start: 50,
        generateCost: 10,
        referralBonus: 30
    },

    // Payments
    upiId: "shivenpanwar@fam"
};

const AI_KEYS = {
    // Your provided Groq Key
    groq: "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" 
};

/* ----------------------------------------------------------------------------
   2. STATE MANAGEMENT
   ---------------------------------------------------------------------------- */

let STATE = {
    user: null,          
    credits: 0,
    currentProject: {
        html: "",
        prompt: ""
    },
    selectedElement: null // Tracks what the user clicked in the editor
};

/* ----------------------------------------------------------------------------
   3. INITIALIZATION
   ---------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Zulora Cortex Online");
    
    // Initialize Firebase (Safety check)
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    loadUser();
    initMobileMenu();
    initStudioTools();
    setupGlobalListeners();
});

/* ----------------------------------------------------------------------------
   4. MOBILE MENU & NAVIGATION (The 3-Bar Logic)
   ---------------------------------------------------------------------------- */

function initMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    const trigger = document.getElementById('mobile-menu-trigger');
    const closeBtn = document.getElementById('close-drawer-btn');
    const links = document.querySelectorAll('.drawer-links a');

    function openMenu() {
        drawer.classList.remove('hidden');
        // Small delay to allow CSS transition to catch the removal of 'hidden'
        setTimeout(() => drawer.classList.add('open'), 10);
    }

    function closeMenu() {
        drawer.classList.remove('open');
        setTimeout(() => drawer.classList.add('hidden'), 300);
    }

    if(trigger) trigger.addEventListener('click', openMenu);
    if(closeBtn) closeBtn.addEventListener('click', closeMenu);
    
    // Close when clicking a link
    links.forEach(link => link.addEventListener('click', closeMenu));

    // Close when clicking outside
    drawer.addEventListener('click', (e) => {
        if (e.target === drawer) closeMenu();
    });
}

// View Switcher (Landing <-> Studio)
window.switchView = function(viewName) {
    document.querySelectorAll('.view-layer').forEach(el => el.classList.add('hidden'));
    
    if (viewName === 'landing') {
        document.getElementById('view-landing').classList.remove('hidden');
        window.scrollTo(0, 0);
    } else if (viewName === 'studio') {
        if (!STATE.user) {
            openAuthModal();
            return;
        }
        document.getElementById('view-studio').classList.remove('hidden');
    }
};

/* ----------------------------------------------------------------------------
   5. AUTHENTICATION & USER SYSTEM
   ---------------------------------------------------------------------------- */

function loadUser() {
    const saved = localStorage.getItem('zulora_user');
    if (saved) {
        STATE.user = JSON.parse(saved);
        STATE.credits = parseInt(localStorage.getItem('zulora_credits')) || CONFIG.credits.start;
        updateUserUI();
    } else {
        document.getElementById('auth-guest').classList.remove('hidden');
    }
}

function updateUserUI() {
    // Hide Guest buttons, Show User Chip
    document.getElementById('auth-guest').classList.add('hidden');
    document.getElementById('auth-user').classList.remove('hidden');
    document.getElementById('nav-username').innerText = STATE.user.name.split(' ')[0];
    
    // Update Studio Credits
    const creditDisplay = document.getElementById('studio-credits');
    if(creditDisplay) creditDisplay.innerText = STATE.credits;

    // Update Drawer Profile
    document.getElementById('drawer-user-panel').classList.remove('hidden');
    document.getElementById('drawer-name').innerText = STATE.user.name;
    document.getElementById('drawer-email').innerText = STATE.user.email;
}

window.openAuthModal = () => document.getElementById('auth-modal').classList.remove('hidden');
window.closeAuthModal = () => document.getElementById('auth-modal').classList.add('hidden');

// Login Simulation
document.getElementById('google-login-btn').addEventListener('click', () => {
    const btn = document.getElementById('google-login-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Connecting...`;
    
    setTimeout(() => {
        const fakeUser = {
            id: 'u_' + Date.now(),
            name: 'Creator',
            email: 'creator@zulora.in',
            refCode: 'ZUL' + Math.floor(Math.random() * 9999)
        };
        
        STATE.user = fakeUser;
        STATE.credits = CONFIG.credits.start;
        
        localStorage.setItem('zulora_user', JSON.stringify(fakeUser));
        localStorage.setItem('zulora_credits', STATE.credits);
        
        updateUserUI();
        closeAuthModal();
        showToast("Logged in successfully!", "success");
        
        // If user typed a prompt before login, take them to studio
        const prompt = document.getElementById('landing-prompt').value;
        if(prompt) transferToStudio();
        
        btn.innerHTML = originalText;
    }, 1500);
});

/* ----------------------------------------------------------------------------
   6. AI GENERATION ENGINE (Groq + God Mode)
   ---------------------------------------------------------------------------- */

window.transferToStudio = () => {
    const prompt = document.getElementById('landing-prompt').value.trim();
    if (!prompt) return showToast("Please describe your website first.", "warning");
    
    if (!STATE.user) {
        openAuthModal();
        return;
    }

    switchView('studio');
    // Trigger generation with the prompt
    handleGeneration(prompt);
};

// Studio "Generate" Button
const studioBtn = document.getElementById('studio-generate-btn');
if(studioBtn) {
    studioBtn.addEventListener('click', () => {
        const p = document.getElementById('studio-ai-prompt').value.trim();
        handleGeneration(p);
    });
}

async function handleGeneration(prompt) {
    if(!prompt) return showToast("Enter a prompt first.", "warning");
    
    // Deduct Credits
    if(STATE.credits < CONFIG.credits.generateCost) {
        openPaymentModal();
        return showToast("Insufficient credits.", "error");
    }
    STATE.credits -= CONFIG.credits.generateCost;
    document.getElementById('studio-credits').innerText = STATE.credits;
    localStorage.setItem('zulora_credits', STATE.credits);

    // Loading State
    showToast("AI Architect is building...", "info");
    
    try {
        // 1. Try Groq API
        let html = await generateWithGroq(prompt);
        
        // 2. Fallback if API fails or returns empty
        if (!html || html.length < 100) {
            console.warn("API empty, using God Mode.");
            html = generateOfflineSite(prompt);
        }
        
        // 3. Load into Editor
        loadSiteToEditor(html);
        showToast("Website ready! Click elements to edit.", "success");

    } catch (e) {
        console.error("Generation Error", e);
        // Robust Fallback
        const html = generateOfflineSite(prompt);
        loadSiteToEditor(html);
        showToast("Generated with Offline Engine.", "success");
    }
}

// --- 6.1 Groq API Handler ---
async function generateWithGroq(prompt) {
    const sysPrompt = `You are a web generator. Output ONLY valid HTML with Tailwind CSS.
    Context: Create a single-page website for "${prompt}".
    Requirements:
    - Use <script src="https://cdn.tailwindcss.com"></script>
    - Include a Navbar, Hero (with Unsplash images), Features, Contact Section.
    - Make buttons functional (e.g., href="tel:..." or alert).
    - Design: Modern, Clean, Responsive.
    - NO Markdown. Just the HTML code.`;

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AI_KEYS.groq}`
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768",
                messages: [
                    {role: "system", content: sysPrompt},
                    {role: "user", content: prompt}
                ],
                temperature: 0.7
            })
        });
        const data = await res.json();
        let code = data.choices[0].message.content;
        return code.replace(/```html/g, '').replace(/```/g, '');
    } catch (e) {
        throw e; // Pass to catch block for fallback
    }
}

// --- 6.2 God Mode (The Advanced Offline Template Engine) ---
function generateOfflineSite(prompt, bizName, phone) {
    console.log("Engaging God Mode Brain v2.0...");
    
    const p = prompt.toLowerCase();
    
    // 1. DYNAMIC THEME DETECTION
    let type = "business";
    let imgKey = "office";
    
    if (p.includes("game") || p.includes("stream")) { type="gaming"; imgKey="gaming"; }
    else if (p.includes("food") || p.includes("cafe") || p.includes("rest")) { type="food"; imgKey="food"; }
    else if (p.includes("shop") || p.includes("store") || p.includes("fash")) { type="shop"; imgKey="fashion"; }
    else if (p.includes("gym") || p.includes("fit")) { type="fitness"; imgKey="fitness"; }
    else if (p.includes("tech") || p.includes("app")) { type="tech"; imgKey="technology"; }
    else if (p.includes("port") || p.includes("desig")) { type="creative"; imgKey="art"; }

    // Theme Configurations (Colors & Styles)
    const themes = {
        gaming: { 
            bg: "bg-slate-900", text: "text-white", panel: "bg-slate-800",
            accent: "text-purple-400", btn: "bg-purple-600 hover:bg-purple-500", 
            nav: "bg-slate-900/90" 
        },
        food: { 
            bg: "bg-orange-50", text: "text-slate-800", panel: "bg-white",
            accent: "text-orange-600", btn: "bg-orange-500 hover:bg-orange-600", 
            nav: "bg-white/90" 
        },
        shop: { 
            bg: "bg-white", text: "text-gray-900", panel: "bg-gray-50",
            accent: "text-blue-600", btn: "bg-black hover:bg-gray-800", 
            nav: "bg-white/90" 
        },
        fitness: { 
            bg: "bg-stone-900", text: "text-stone-100", panel: "bg-stone-800",
            accent: "text-lime-400", btn: "bg-lime-500 hover:bg-lime-400 text-black", 
            nav: "bg-stone-900/90" 
        },
        tech: { 
            bg: "bg-slate-50", text: "text-slate-900", panel: "bg-white",
            accent: "text-indigo-600", btn: "bg-indigo-600 hover:bg-indigo-700", 
            nav: "bg-white/90" 
        },
        creative: { 
            bg: "bg-zinc-100", text: "text-zinc-900", panel: "bg-white",
            accent: "text-rose-500", btn: "bg-rose-500 hover:bg-rose-600", 
            nav: "bg-white/90" 
        },
        business: { 
            bg: "bg-white", text: "text-gray-800", panel: "bg-gray-50",
            accent: "text-blue-600", btn: "bg-blue-600 hover:bg-blue-700", 
            nav: "bg-white/90" 
        }
    };
    
    const t = themes[type] || themes.business;
    const title = bizName || "My Brand";
    const desc = prompt.length > 10 ? prompt : "We provide world-class services tailored to your needs. Innovation, quality, and excellence in every project.";

    // 2. GENERATE THE HTML STRING
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .editable { transition: 0.2s; border: 1px solid transparent; }
        /* The Studio Editor Highlight Style */
        .editable:hover { 
            outline: 2px dashed ${t.btn.includes('bg-black') ? '#000' : '#4f46e5'}; 
            cursor: pointer; 
            background: rgba(0,0,0,0.02);
        }
        .scroll-hide::-webkit-scrollbar { display: none; }
    </style>
</head>
<body class="${t.bg} ${t.text} antialiased leading-relaxed selection:bg-indigo-500 selection:text-white">

    <nav class="fixed w-full z-50 transition-all duration-300 ${t.nav} backdrop-blur-md border-b border-gray-200/10">
        <div class="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <div class="text-2xl font-bold tracking-tight editable flex items-center gap-2">
                <i class="fas fa-layer-group ${t.accent}"></i> ${title}
            </div>
            
            <div class="hidden md:flex items-center space-x-8 font-medium text-sm">
                <a href="#home" class="hover:${t.accent} transition editable">Home</a>
                <a href="#features" class="hover:${t.accent} transition editable">Services</a>
                <a href="#about" class="hover:${t.accent} transition editable">About</a>
                <a href="#gallery" class="hover:${t.accent} transition editable">Work</a>
            </div>

            <a href="#contact" class="px-6 py-2.5 ${t.btn} text-white text-sm font-bold rounded-full shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 editable">
                Contact Us
            </a>
        </div>
    </nav>

    <header id="home" class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div class="relative z-10 text-center lg:text-left">
                <span class="inline-block py-1 px-3 rounded-full ${t.panel} border border-current opacity-60 text-xs font-bold uppercase tracking-widest mb-6 editable">
                    Welcome to the Future
                </span>
                <h1 class="text-5xl lg:text-7xl font-extrabold mb-8 leading-tight tracking-tight editable">
                    We Create <span class="${t.accent}">Digital</span> Experiences.
                </h1>
                <p class="text-lg lg:text-xl opacity-70 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed editable">
                    ${desc}
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <button onclick="document.getElementById('contact').scrollIntoView()" class="px-8 py-4 ${t.btn} text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition editable">
                        Get Started Now
                    </button>
                    <button class="px-8 py-4 ${t.panel} border border-gray-200/20 rounded-xl font-bold text-lg hover:opacity-80 transition editable">
                        View Portfolio
                    </button>
                </div>
                
                <div class="mt-12 flex items-center justify-center lg:justify-start gap-6 opacity-60">
                    <span class="text-sm font-semibold editable">Trusted by:</span>
                    <i class="fab fa-google text-xl editable"></i>
                    <i class="fab fa-amazon text-xl editable"></i>
                    <i class="fab fa-spotify text-xl editable"></i>
                    <i class="fab fa-apple text-xl editable"></i>
                </div>
            </div>
            
            <div class="relative z-10">
                <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/10 group">
                    <img src="https://source.unsplash.com/800x800/?${imgKey},hero" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-700 editable">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div class="absolute -bottom-10 -left-10 ${t.panel} p-6 rounded-2xl shadow-xl border border-gray-200/10 hidden lg:block editable">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full ${t.btn} flex items-center justify-center text-white text-xl">
                            <i class="fas fa-star"></i>
                        </div>
                        <div>
                            <p class="font-bold text-xl">4.9/5</p>
                            <p class="text-sm opacity-60">Customer Rating</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <section id="features" class="py-24 px-6 ${t.bg === 'bg-white' ? 'bg-slate-50' : 'bg-black/10'}">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-20">
                <h2 class="text-4xl font-bold mb-4 editable">Our Expertise</h2>
                <p class="text-lg opacity-60 max-w-2xl mx-auto editable">We provide comprehensive solutions to help your business grow and succeed in the digital age.</p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8">
                <div class="${t.panel} p-8 rounded-3xl shadow-lg border border-gray-200/10 hover:-translate-y-2 transition duration-300 group editable">
                    <div class="w-14 h-14 rounded-2xl ${t.btn} flex items-center justify-center text-white text-2xl mb-6 shadow-md group-hover:scale-110 transition">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-3 editable">High Performance</h3>
                    <p class="opacity-70 leading-relaxed editable">Lightning fast load times and optimized code for the best user experience.</p>
                </div>
                <div class="${t.panel} p-8 rounded-3xl shadow-lg border border-gray-200/10 hover:-translate-y-2 transition duration-300 group editable">
                    <div class="w-14 h-14 rounded-2xl ${t.btn} flex items-center justify-center text-white text-2xl mb-6 shadow-md group-hover:scale-110 transition">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-3 editable">Secure & Safe</h3>
                    <p class="opacity-70 leading-relaxed editable">Enterprise-grade security to keep your data and users protected 24/7.</p>
                </div>
                <div class="${t.panel} p-8 rounded-3xl shadow-lg border border-gray-200/10 hover:-translate-y-2 transition duration-300 group editable">
                    <div class="w-14 h-14 rounded-2xl ${t.btn} flex items-center justify-center text-white text-2xl mb-6 shadow-md group-hover:scale-110 transition">
                        <i class="fas fa-magic"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-3 editable">Creative Design</h3>
                    <p class="opacity-70 leading-relaxed editable">Stunning visuals and intuitive interfaces that capture attention.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="about" class="py-24 px-6">
        <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div class="order-2 lg:order-1">
                <img src="https://source.unsplash.com/800x600/?${imgKey},team" class="rounded-3xl shadow-2xl editable">
            </div>
            <div class="order-1 lg:order-2">
                <h2 class="text-4xl font-bold mb-6 editable">We Build for Growth</h2>
                <p class="text-lg opacity-70 mb-8 leading-relaxed editable">
                    Our team of experts is dedicated to delivering results. From strategy to execution, we handle everything to ensure your success.
                </p>
                
                <div class="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h4 class="text-3xl font-bold ${t.accent} editable">500+</h4>
                        <p class="opacity-60 text-sm font-bold uppercase tracking-wider editable">Projects Done</p>
                    </div>
                    <div>
                        <h4 class="text-3xl font-bold ${t.accent} editable">98%</h4>
                        <p class="opacity-60 text-sm font-bold uppercase tracking-wider editable">Client Satisfaction</p>
                    </div>
                </div>
                
                <button class="px-8 py-3 border-2 border-current rounded-xl font-bold hover:opacity-60 transition editable">
                    Read Our Story
                </button>
            </div>
        </div>
    </section>

    <section id="gallery" class="py-24 px-6 ${t.bg === 'bg-white' ? 'bg-gray-50' : 'bg-black/10'}">
        <div class="max-w-7xl mx-auto text-center mb-16">
            <h2 class="text-4xl font-bold mb-4 editable">Recent Work</h2>
            <p class="opacity-60 editable">A selection of our latest projects.</p>
        </div>
        <div class="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
            <div class="h-64 md:h-80 rounded-2xl overflow-hidden relative group cursor-pointer">
                <img src="https://source.unsplash.com/600x800/?${imgKey},1" class="w-full h-full object-cover transition duration-500 group-hover:scale-110 editable">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span class="text-white font-bold text-xl">Project One</span>
                </div>
            </div>
            <div class="h-64 md:h-80 rounded-2xl overflow-hidden relative group cursor-pointer md:col-span-2">
                <img src="https://source.unsplash.com/1200x800/?${imgKey},2" class="w-full h-full object-cover transition duration-500 group-hover:scale-110 editable">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span class="text-white font-bold text-xl">Project Two</span>
                </div>
            </div>
            <div class="h-64 md:h-80 rounded-2xl overflow-hidden relative group cursor-pointer md:col-span-2">
                <img src="https://source.unsplash.com/1200x800/?${imgKey},3" class="w-full h-full object-cover transition duration-500 group-hover:scale-110 editable">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span class="text-white font-bold text-xl">Project Three</span>
                </div>
            </div>
            <div class="h-64 md:h-80 rounded-2xl overflow-hidden relative group cursor-pointer">
                <img src="https://source.unsplash.com/600x800/?${imgKey},4" class="w-full h-full object-cover transition duration-500 group-hover:scale-110 editable">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span class="text-white font-bold text-xl">Project Four</span>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="py-24 px-6">
        <div class="max-w-4xl mx-auto ${t.panel} rounded-3xl p-10 md:p-16 shadow-2xl border border-gray-200/10 text-center">
            <h2 class="text-4xl md:text-5xl font-bold mb-6 editable">Ready to Start?</h2>
            <p class="text-xl opacity-70 mb-10 max-w-lg mx-auto editable">
                Contact us today to discuss your project. We are available 24/7.
            </p>
            
            <div class="flex flex-col sm:flex-row justify-center gap-6">
                <a href="https://wa.me/${phone}" class="flex items-center justify-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#20bd5a] transition shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1 editable">
                    <i class="fab fa-whatsapp text-2xl"></i>
                    Chat on WhatsApp
                </a>
                
                <a href="mailto:contact@${title.replace(/\s+/g, '').toLowerCase()}.com" class="flex items-center justify-center gap-3 px-8 py-4 bg-gray-800 text-white rounded-xl font-bold text-lg hover:bg-gray-700 transition shadow-lg hover:shadow-gray-500/30 transform hover:-translate-y-1 editable">
                    <i class="fas fa-envelope text-xl"></i>
                    Send Email
                </a>
            </div>
            
            <p class="mt-8 opacity-50 text-sm editable">Or call us at: ${phone}</p>
        </div>
    </section>

    <footer class="py-12 px-6 border-t border-current/10 opacity-80">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="text-2xl font-bold editable">${title}</div>
            <div class="flex gap-6 text-xl">
                <a href="#" class="hover:${t.accent} transition editable"><i class="fab fa-twitter"></i></a>
                <a href="#" class="hover:${t.accent} transition editable"><i class="fab fa-instagram"></i></a>
                <a href="#" class="hover:${t.accent} transition editable"><i class="fab fa-linkedin"></i></a>
            </div>
            <p class="text-sm editable">&copy; 2026 Powered by Zulora Studio</p>
        </div>
    </footer>

</body>
</html>
    `;
}

/* ----------------------------------------------------------------------------
   7. STUDIO EDITOR (Click-to-Edit Logic)
   ---------------------------------------------------------------------------- */

function loadSiteToEditor(html) {
    STATE.currentProject.html = html;
    const iframe = document.getElementById('editor-frame');
    const doc = iframe.contentWindow.document;
    
    doc.open();
    doc.write(html);
    doc.close();
    
    // Inject Script for Editing inside Iframe
    const script = doc.createElement('script');
    script.textContent = `
        document.body.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Highlight
            const prev = document.querySelector('.zulora-active');
            if(prev) prev.style.outline = 'none';
            e.target.style.outline = '2px solid #4f46e5';
            e.target.classList.add('zulora-active');
            
            // Send to Parent
            window.parent.postMessage({
                type: 'EL_CLICK',
                text: e.target.innerText,
                color: window.getComputedStyle(e.target).color,
                size: window.getComputedStyle(e.target).fontSize,
                src: e.target.src || ''
            }, '*');
        });

        window.addEventListener('message', function(ev) {
            const el = document.querySelector('.zulora-active');
            if(!el) return;
            if(ev.data.prop === 'text') el.innerText = ev.data.val;
            if(ev.data.prop === 'color') el.style.color = ev.data.val;
            if(ev.data.prop === 'size') el.style.fontSize = ev.data.val + 'px';
            if(ev.data.prop === 'src') el.src = ev.data.val;
        });
    `;
    doc.body.appendChild(script);
}

// Receive Data from Iframe
window.addEventListener('message', (e) => {
    if (e.data.type === 'EL_CLICK') {
        // Show Properties Panel
        document.getElementById('prop-empty').classList.add('hidden');
        document.getElementById('prop-active').classList.remove('hidden');
        
        // Fill Inputs
        document.getElementById('prop-text').value = e.data.text;
        // Simple RGB to Hex conversion or just use color picker value
        document.getElementById('prop-size').value = parseInt(e.data.size);
        
        if(e.data.src) {
            document.getElementById('prop-media-section').classList.remove('hidden');
            document.getElementById('prop-img-preview').src = e.data.src;
        } else {
            document.getElementById('prop-media-section').classList.add('hidden');
        }
    }
});

// Send Updates to Iframe
document.getElementById('prop-text').addEventListener('input', (e) => {
    document.getElementById('editor-frame').contentWindow.postMessage({prop:'text', val: e.target.value}, '*');
});
document.getElementById('prop-color').addEventListener('input', (e) => {
    document.getElementById('editor-frame').contentWindow.postMessage({prop:'color', val: e.target.value}, '*');
});
document.getElementById('prop-size').addEventListener('input', (e) => {
    document.getElementById('editor-frame').contentWindow.postMessage({prop:'size', val: e.target.value}, '*');
});

/* ----------------------------------------------------------------------------
   8. UTILITIES (Modals, Toast, Payments)
   ---------------------------------------------------------------------------- */

// Toast System
function showToast(msg, type="info") {
    const t = document.createElement('div');
    t.className = `toast-msg ${type}`;
    t.innerText = msg;
    Object.assign(t.style, {
        position: 'fixed', bottom: '20px', right: '20px',
        padding: '12px 24px', background: '#1e1e28', color: 'white',
        borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        borderLeft: `4px solid ${type=='success'?'#10b981':'#f59e0b'}`,
        zIndex: 10000, animation: 'slideIn 0.3s'
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// Payment
window.openPaymentModal = () => {
    const m = document.getElementById('payment-modal');
    m.classList.remove('hidden');
    // Render QR Code using the library included in HTML
    document.getElementById('qr-target').innerHTML = "";
    new QRCode(document.getElementById("qr-target"), {
        text: `upi://pay?pa=${CONFIG.upiId}&pn=Zulora&am=299&cu=INR`,
        width: 128, height: 128
    });
};
window.closePaymentModal = () => document.getElementById('payment-modal').classList.add('hidden');

window.verifyPayment = () => {
    const email = STATE.user ? STATE.user.email : 'guest';
    const msg = `Payment Done for Zulora Pro. Email: ${email}`;
    window.open(`https://wa.me/${CONFIG.support.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    closePaymentModal();
    showToast("Verification sent via WhatsApp!", "success");
};

// Referral
window.openReferralModal = () => {
    document.getElementById('referral-modal').classList.remove('hidden');
    const code = STATE.user ? STATE.user.refCode : 'GUEST';
    document.getElementById('ref-link').value = `${CONFIG.domain}/join?ref=${code}`;
};
window.closeReferralModal = () => document.getElementById('referral-modal').classList.add('hidden');

window.copyRef = () => {
    const el = document.getElementById('ref-link');
    el.select();
    document.execCommand('copy');
    showToast("Link copied!", "success");
};

// Contact
window.openContactModal = () => document.getElementById('contact-modal').classList.remove('hidden');
window.closeContactModal = () => document.getElementById('contact-modal').classList.add('hidden');

// Preview Overlay
window.openPreviewOverlay = () => {
    const html = STATE.currentProject.html;
    if(!html) return showToast("Create a site first.", "warning");
    const frame = document.getElementById('fs-frame');
    frame.src = URL.createObjectURL(new Blob([html], {type:'text/html'}));
    document.getElementById('preview-overlay').classList.remove('hidden');
};
window.closePreviewOverlay = () => document.getElementById('preview-overlay').classList.add('hidden');

// Setup Studio Tools
function initStudioTools() {
    const btns = document.querySelectorAll('.tool-btn');
    const panels = document.querySelectorAll('.panel-section');
    
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle active visual
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding panel (simplified logic)
            const target = btn.dataset.panel;
            if(target === 'add') {
                document.querySelector('.sidebar-panel-content').style.display = 'block';
            } else {
                // For this demo, close panel on other clicks or implement specific panels
                document.querySelector('.sidebar-panel-content').style.display = 'none';
            }
        });
    });
}

// Template Selection
window.selectTemplate = (cat) => {
    window.scrollTo(0,0);
    document.getElementById('landing-prompt').value = `Create a ${cat} website with modern design.`;
    showToast(`${cat} template selected. Click Generate!`, "info");
};
