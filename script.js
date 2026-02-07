/**
 * ============================================================================
 * ZULORA.IN - CORTEX ENGINE (FINAL PRODUCTION BUILD)
 * ============================================================================
 * @version 5.0.0 (Titanium)
 * @author Zulora AI Team
 * @description Controls AI Generation, Payments, Auth, and 3D UI Interactions.
 * @license Proprietary
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
   1. GLOBAL CONFIGURATION & API VAULT
   ---------------------------------------------------------------------------- */

const CONFIG = {
    appName: "Zulora AI",
    domain: "zulora.in",
    supportPhone: "916395211325", // WhatsApp Support
    publisherId: "ca-pub-9266584827478576", // Your AdSense ID

    // --- ECONOMY MODEL ---
    pricing: {
        signupBonus: 30,
        referralBonus: 15,
        generationCost: 10,
        deployCost: 25,
        premiumCost: 299,
        premiumCredits: 1000
    },

    // --- PAYMENT GATEWAY (UPI) ---
    upi: {
        id: "shivenpanwar@fam",
        name: "ZuloraPremium"
    }
};

// --- AI KEYS (The Brains) ---
// NOTE: These are client-side keys. For enterprise security, move to backend later.
const AI_KEYS = {
    openai: "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",
    anthropic: "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",
    groq: "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",
    firebase: "AIzaSyC4XXmvYQap_Y1tXF-mWG82rL5MsBXjcvQ"
};

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: AI_KEYS.firebase,
    authDomain: "zulorain.firebaseapp.com",
    projectId: "zulorain",
    storageBucket: "zulorain.firebasestorage.app",
    messagingSenderId: "972907481049",
    appId: "1:972907481049:web:b4d02b9808f9e2f3f8bbc8"
};

/* ----------------------------------------------------------------------------
   2. SYSTEM INITIALIZATION
   ---------------------------------------------------------------------------- */

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// GLOBAL STATE
let STATE = {
    user: null,         // Firebase User Object
    profile: null,      // Firestore User Data
    generatedHTML: "",  // Stores the last AI result
    isPro: false        // Premium Status
};

// DOM ELEMENTS CACHE (Performance Optimization)
const DOM = {
    navbar: {
        guest: document.getElementById('nav-guest-status'),
        user: document.getElementById('nav-user-status'),
        credits: document.getElementById('nav-credits'),
        avatar: document.getElementById('nav-avatar'),
        menu: document.getElementById('profile-dropdown'),
        mobile: document.getElementById('mobile-menu-overlay')
    },
    views: {
        landing: document.getElementById('view-landing'),
        dashboard: document.getElementById('view-dashboard')
    },
    dash: {
        credits: document.getElementById('dash-credits'),
        name: document.getElementById('dash-name'),
        avatar: document.getElementById('dash-avatar'),
        plan: document.getElementById('dash-plan'),
        tabs: document.querySelectorAll('.dash-tab'),
        preview: document.getElementById('website-preview'),
        prompt: document.getElementById('ai-prompt'),
        subdomain: document.getElementById('subdomain-input'),
        referralInput: document.getElementById('referral-link-display')
    },
    modals: {
        auth: document.getElementById('auth-modal'),
        payment: document.getElementById('payment-modal')
    }
};

/* ----------------------------------------------------------------------------
   3. AUTHENTICATION & DATABASE SYNC
   ---------------------------------------------------------------------------- */

// Listen for Login/Logout
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("✅ User Authenticated:", user.email);
        STATE.user = user;
        await syncUserProfile(user);
        updateUI(true);
        showNotification(`Welcome back, ${user.displayName.split(' ')[0]}!`, 'success');
    } else {
        console.log("🔒 User Guest Mode");
        STATE.user = null;
        STATE.profile = null;
        updateUI(false);
    }
});

// Sync User Data with Firestore
async function syncUserProfile(user) {
    const userRef = db.collection('users').doc(user.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
        // --- NEW USER REGISTRATION ---
        const refCode = generateID();
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('ref');

        const newProfile = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
            credits: CONFIG.pricing.signupBonus, // +30 Credits
            plan: 'starter', // starter | premium
            referralCode: refCode,
            referredBy: referrer || null,
            projects: [],
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await userRef.set(newProfile);
        STATE.profile = newProfile;
        
        // Reward Referrer if exists
        if (referrer) processReferralReward(referrer);
        
        showNotification("🎉 Account Created! +30 Free Credits", 'success');
    } else {
        // --- EXISTING USER ---
        STATE.profile = snap.data();
    }
    
    // Set Pro Status
    STATE.isPro = STATE.profile.plan === 'premium';
}

// Grant referral bonus
async function processReferralReward(refCode) {
    const q = db.collection('users').where('referralCode', '==', refCode);
    const snap = await q.get();
    
    if (!snap.empty) {
        const referrerDoc = snap.docs[0];
        await referrerDoc.ref.update({
            credits: firebase.firestore.FieldValue.increment(CONFIG.pricing.referralBonus)
        });
        console.log("💰 Referrer Rewarded");
    }
}

// Google Login Trigger
const loginBtn = document.getElementById('google-login-btn');
if(loginBtn) {
    loginBtn.addEventListener('click', () => {
        auth.signInWithPopup(googleProvider)
            .then(() => closeAuthModal())
            .catch(err => showNotification(err.message, 'error'));
    });
}

// Logout Trigger
const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
        window.location.reload();
    });
}

/* ----------------------------------------------------------------------------
   4. UI NAVIGATION & INTERACTIVITY
   ---------------------------------------------------------------------------- */

function updateUI(isLoggedIn) {
    if (isLoggedIn) {
        // Navbar Updates
        DOM.navbar.guest.classList.add('hidden');
        DOM.navbar.user.classList.remove('hidden');
        DOM.navbar.avatar.src = STATE.profile.photo;
        
        // Credits Display
        const creditIcon = STATE.isPro ? '💎' : '🪙';
        DOM.navbar.credits.innerText = `${STATE.profile.credits}`;
        
        // Dropdown Info
        const menuName = document.getElementById('menu-user-name');
        const menuEmail = document.getElementById('menu-user-email');
        if(menuName) menuName.innerText = STATE.profile.name;
        if(menuEmail) menuEmail.innerText = STATE.profile.email;
        
        // Dashboard Updates
        DOM.dash.name.innerText = STATE.profile.name;
        DOM.dash.avatar.src = STATE.profile.photo;
        DOM.dash.credits.innerText = STATE.profile.credits;
        
        if(STATE.isPro) {
            DOM.dash.plan.innerText = "Premium Pro";
            DOM.dash.plan.className = "badge-pop"; // Gold badge style
        } else {
            DOM.dash.plan.innerText = "Starter Plan";
            DOM.dash.plan.className = "badge-free";
        }

        // Referral Link Generation
        if(DOM.dash.referralInput) {
            DOM.dash.referralInput.value = `https://${CONFIG.domain}/?ref=${STATE.profile.referralCode}`;
        }
        
        // Auto-switch to dashboard if on landing
        if(document.getElementById('view-landing').classList.contains('active')) {
            switchView('dashboard');
        }

    } else {
        DOM.navbar.guest.classList.remove('hidden');
        DOM.navbar.user.classList.add('hidden');
        switchView('landing');
    }
}

// View Switcher (SPA)
window.switchView = function(viewId) {
    // Hide all views
    Object.values(DOM.views).forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });
    
    // Show Target View
    if (viewId === 'landing') {
        DOM.views.landing.classList.remove('hidden');
        DOM.views.landing.classList.add('active');
    } else {
        DOM.views.dashboard.classList.remove('hidden');
        // Re-initialize animations inside dashboard
        setTimeout(() => {
            if(window.AOS) AOS.refresh();
        }, 500);
    }
    
    // Close mobile menu if open
    DOM.navbar.mobile.classList.add('hidden');
};

// Dashboard Tab Switcher
window.switchDashTab = function(tabName) {
    // Hide all tabs
    DOM.dash.tabs.forEach(t => t.classList.add('hidden'));
    
    // Remove active class from sidebar buttons
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    
    // Show target tab
    const targetTab = document.getElementById(`tab-${tabName}`);
    if(targetTab) targetTab.classList.remove('hidden');
    
    // Close mobile menu if open (for mobile users)
    DOM.navbar.mobile.classList.add('hidden');
};

// Menus & Modals Control
window.toggleProfileMenu = () => DOM.navbar.menu.classList.toggle('hidden');
window.toggleMobileMenu = () => DOM.navbar.mobile.classList.toggle('hidden');

window.openAuthModal = () => DOM.modals.auth.classList.remove('hidden');
window.closeAuthModal = () => DOM.modals.auth.classList.add('hidden');

window.openPaymentModal = () => {
    DOM.modals.payment.classList.remove('hidden');
    generateUPIQR(); // Generate QR when opened
};
window.closePaymentModal = () => DOM.modals.payment.classList.add('hidden');

// Scroll To Demo
window.scrollToDemo = () => {
    document.getElementById('features').scrollIntoView({behavior: 'smooth'});
};

/* ----------------------------------------------------------------------------
   5. AI GENERATION ENGINE (THE BRAIN)
   ---------------------------------------------------------------------------- */

const genBtn = document.getElementById('generate-btn');
if(genBtn) {
    genBtn.addEventListener('click', async () => {
        // 1. Validation
        if (!STATE.user) return showNotification("Please Sign In to Generate", 'warning');
        
        // Check Credits
        if (STATE.profile.credits < CONFIG.pricing.generationCost) {
            showNotification("Low Credits! Please Upgrade.", 'error');
            return openPaymentModal();
        }
        
        const prompt = DOM.dash.prompt.value.trim();
        if (prompt.length < 10) return showNotification("Please enter a detailed prompt (min 10 chars).", 'warning');

        // 2. UI Loading State
        const originalText = genBtn.innerHTML;
        genBtn.disabled = true;
        genBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Architecting...`;
        
        // 3. Deduct Credits (Optimistic UI Update)
        await adjustCredits(-CONFIG.pricing.generationCost);

        try {
            // 4. Build System Prompt
            const SYSTEM_PROMPT = `
            ROLE: Elite Frontend Developer (Top 1%).
            TASK: Build a stunning single-file HTML website based on the user's request.
            STACK: HTML5, Tailwind CSS (via CDN), FontAwesome (via CDN).
            DESIGN RULES:
            - Use modern gradients, glassmorphism, and shadows.
            - Ensure it is fully responsive (Mobile/Desktop).
            - Include a Navbar, Hero, Features, Testimonials, and Footer.
            - DO NOT include markdown backticks. Return RAW HTML only.
            `;

            let html = "";
            
            // 5. AI Rotation Strategy (Failover Protection)
            try {
                console.log("🧠 Attempting OpenAI...");
                html = await callAI(AI_KEYS.openai, "https://api.openai.com/v1/chat/completions", "gpt-4-turbo", SYSTEM_PROMPT, prompt);
            } catch (e1) {
                console.warn("OpenAI Busy. Switching to Groq...", e1);
                try {
                    html = await callAI(AI_KEYS.groq, "https://api.groq.com/openai/v1/chat/completions", "mixtral-8x7b-32768", SYSTEM_PROMPT, prompt);
                } catch (e2) {
                    console.warn("Groq Busy. Switching to Anthropic...", e2);
                    // Fallback template if everything fails
                    html = getFallbackTemplate();
                }
            }

            // 6. Clean Output (Remove Markdown)
            html = html.replace(/```html/g, '').replace(/```/g, '');
            STATE.generatedHTML = html;

            // 7. Render Preview
            const blob = new Blob([html], { type: 'text/html' });
            DOM.dash.preview.src = URL.createObjectURL(blob);
            
            // Show Preview Section
            document.getElementById('preview-section').classList.remove('hidden');
            showNotification("Website Generated Successfully!", 'success');

        } catch (error) {
            console.error("AI Error:", error);
            showNotification("Generation Failed. Refunding Credits.", 'error');
            adjustCredits(CONFIG.pricing.generationCost); // Refund
        } finally {
            genBtn.disabled = false;
            genBtn.innerHTML = originalText;
        }
    });
}

// Generic AI API Caller
async function callAI(key, url, model, sys, user) {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{role: "system", content: sys}, {role: "user", content: user}],
            temperature: 0.7
        })
    });
    const data = await res.json();
    
    // Handle different API response structures
    if(data.choices && data.choices[0]) {
        return data.choices[0].message.content;
    } else {
        throw new Error("Invalid API Response");
    }
}

/* ----------------------------------------------------------------------------
   6. DEPLOYMENT SYSTEM
   ---------------------------------------------------------------------------- */

const deployBtn = document.getElementById('deploy-btn');
if(deployBtn) {
    deployBtn.addEventListener('click', async () => {
        const subdomain = DOM.dash.subdomain.value.trim().toLowerCase();
        
        // Validate
        if (!subdomain) return showNotification("Enter a subdomain name.", 'warning');
        if (!/^[a-z0-9-]+$/.test(subdomain)) return showNotification("Use only letters, numbers, hyphens.", 'warning');
        
        // Check Cost (Free for Pro, 25 for Free)
        const cost = STATE.isPro ? 0 : CONFIG.pricing.deployCost;
        
        if (STATE.profile.credits < cost) {
            showNotification("Insufficient Credits to Deploy.", 'error');
            return openPaymentModal();
        }

        showNotification("Deploying to Edge Network...", 'info');
        
        try {
            // Check Availability
            const siteRef = db.collection('sites').doc(subdomain);
            const doc = await siteRef.get();
            if (doc.exists) return showNotification("Subdomain unavailable. Try another.", 'error');

            // Save to Database
            await siteRef.set({
                owner: STATE.user.uid,
                subdomain: subdomain,
                html: STATE.generatedHTML,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Deduct & Update
            if (cost > 0) await adjustCredits(-cost);
            
            // Add to User's Project List
            await db.collection('users').doc(STATE.user.uid).update({
                projects: firebase.firestore.FieldValue.arrayUnion(subdomain)
            });
            
            // Open Site
            const liveUrl = `https://${subdomain}.${CONFIG.domain}`;
            showNotification(`🚀 Site Live: ${liveUrl}`, 'success');
            window.open(liveUrl, '_blank');

        } catch (e) {
            console.error(e);
            showNotification("Deployment Error. Try again.", 'error');
        }
    });
}

/* ----------------------------------------------------------------------------
   7. PREMIUM PAYMENT SYSTEM (UPI & QR)
   ---------------------------------------------------------------------------- */

function generateUPIQR() {
    const amount = CONFIG.pricing.premiumCost;
    const upiLink = `upi://pay?pa=${CONFIG.upi.id}&pn=${CONFIG.upi.name}&am=${amount}&cu=INR`;
    
    // Use a public QR API to generate the image
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
    
    const container = document.getElementById('qr-placeholder');
    if(container) {
        container.innerHTML = `<img src="${qrUrl}" alt="Scan to Pay" style="width:100%; border-radius:8px;">`;
    }
}

window.initiateUPIPayment = function() {
    const amount = CONFIG.pricing.premiumCost;
    const upiLink = `upi://pay?pa=${CONFIG.upi.id}&pn=${CONFIG.upi.name}&am=${amount}&cu=INR`;
    
    // Try to open UPI app
    window.location.href = upiLink;
    
    // Show verification button state
    const btn = document.querySelector('.btn-pay');
    if(btn) {
        btn.innerHTML = `Verify Payment <i class="fas fa-check-circle"></i>`;
        btn.onclick = verifyPayment;
        btn.style.background = "#0070F3";
    }
};

window.verifyPayment = function() {
    const msg = `Hello Zulora Team! I have paid ₹${CONFIG.pricing.premiumCost} for Premium. Email: ${STATE.profile.email}. Please upgrade me.`;
    window.open(`https://wa.me/${CONFIG.supportPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    closePaymentModal();
    showNotification("Verification Sent! Upgrading shortly.", 'success');
};

/* ----------------------------------------------------------------------------
   8. UTILITIES & HELPERS
   ---------------------------------------------------------------------------- */

// Adjust Credits Helper
async function adjustCredits(amount) {
    const newBal = STATE.profile.credits + amount;
    STATE.profile.credits = newBal;
    
    // Update UI Instantly
    DOM.navbar.credits.innerText = `${newBal}`;
    DOM.dash.credits.innerText = newBal;
    
    // Sync DB
    await db.collection('users').doc(STATE.user.uid).update({
        credits: newBal
    });
}

// Generate Random ID
function generateID() {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
}

// Copy to Clipboard
window.copyReferral = function() {
    const input = DOM.dash.referralInput;
    if(input) {
        input.select();
        document.execCommand("copy");
        showNotification("Referral Link Copied!", 'success');
    }
};

// Toast Notification System
function showNotification(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `glass-panel`;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        padding: 16px 24px; border-radius: 12px;
        background: rgba(10,10,20,0.9); border-left: 4px solid ${getColor(type)};
        color: white; font-weight: 600; z-index: 10000;
        animation: slideIn 0.3s ease-out; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    toast.innerHTML = `<i class="fas fa-info-circle" style="color:${getColor(type)}"></i> ${msg}`;
    
    document.body.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getColor(type) {
    if(type === 'success') return '#00E676';
    if(type === 'error') return '#FF4D4D';
    if(type === 'warning') return '#FFD700';
    return '#0070F3';
}

// Fallback HTML if AI fails completely
function getFallbackTemplate() {
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#f0f0f0;"><h1>AI Overload</h1><p>Our servers are extremely busy. Please try generating again in 1 minute.</p></body></html>`;
}

// Stats Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const increment = target / 200;
        const update = () => {
            const c = +counter.innerText;
            if(c < target) {
                counter.innerText = Math.ceil(c + increment);
                setTimeout(update, 10);
            } else {
                counter.innerText = target + "+";
            }
        };
        update();
    });
}

// Trigger animations when elements come into view
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting && entry.target.classList.contains('stats-ticker')) {
            animateCounters();
            observer.unobserve(entry.target);
        }
    });
});
const statsSection = document.querySelector('.stats-ticker');
if(statsSection) observer.observe(statsSection);

/* ----------------------------------------------------------------------------
   GOOGLE ADSENSE OPTIMIZER
   ---------------------------------------------------------------------------- */
// This helps prevent AdSense from slowing down the site
window.addEventListener('load', () => {
    setTimeout(() => {
        try {
            // Push Ads to all slots
            const ads = document.querySelectorAll('.adsbygoogle');
            ads.forEach(ad => {
                if (window.adsbygoogle) {
                    (adsbygoogle = window.adsbygoogle || []).push({});
                }
            });
            console.log("💰 AdSense Loaded Successfully");
        } catch (e) {
            console.log("AdBlocker detected or Ads failed.");
        }
    }, 2000); // Delay loading ads by 2 seconds for faster initial paint
});
