/**
 * ============================================================================
 * ZULORA AI - MASTER CONTROLLER
 * ============================================================================
 * @version 3.0.0
 * @author Zulora Inc.
 * @description Handles Auth, Database, AI Generation (Groq), and UI Logic.
 */

// ----------------------------------------------------------------------------
// 1. IMPORTS & CONFIGURATION
// ----------------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    get, 
    update, 
    push, 
    child,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/**
 * FIREBASE CONFIGURATION
 * Please ensure these are your correct project details.
 */
const firebaseConfig = {
    apiKey: "AIzaSyC4XXmvYQap_Y1tXF-mWG82rL5MsBXjcvQ", // YOUR KEY
    authDomain: "zulorain.firebaseapp.com",
    projectId: "zulorain",
    storageBucket: "zulorain.firebasestorage.app",
    messagingSenderId: "972907481049",
    appId: "1:972907481049:web:b4d02b9808f9e2f3f8bbc8"
};

/**
 * AI CONFIGURATION (GROQ API)
 * Using the Llama3-70b-8192 model for high-speed generation.
 */
const AI_CONFIG = {
    apiKey: "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", // Groq Key
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama3-70b-8192"
};

// Initialize Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// ----------------------------------------------------------------------------
// 2. STATE MANAGEMENT (Global Application State)
// ----------------------------------------------------------------------------
const AppState = {
    currentUser: null,
    userData: null,
    currentProject: {
        name: "",
        method: "", // 'AI' or 'Template'
        prompt: "",
        templateId: ""
    },
    config: {
        freeCredits: 10,
        generationCost: 15, // As requested
        referralReward: 10,
        premiumCost: 199,
        premiumCredits: 1000
    }
};

// ----------------------------------------------------------------------------
// 3. CLASS: NOTIFICATION SYSTEM (Toast Manager)
// ----------------------------------------------------------------------------
class ToastManager {
    static show(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Icon selection based on type
        let icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'info') icon = 'fa-info-circle';

        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        
        container.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// ----------------------------------------------------------------------------
// 4. CLASS: DATABASE MANAGER (Handles Firebase Logic)
// ----------------------------------------------------------------------------
class DatabaseManager {
    
    /**
     * Creates or updates a user profile upon login.
     * Handles Referral Code generation and attribution.
     */
    static async handleUserLogin(user) {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            // NEW USER REGISTRATION
            const refCode = this.generateReferralCode(user.uid);
            
            // Check if they came from a referral link (URL param)
            const urlParams = new URLSearchParams(window.location.search);
            const referredBy = urlParams.get('ref');

            const newUserProfile = {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photo: user.photoURL,
                credits: AppState.config.freeCredits, // 10 Free Credits
                isPremium: false,
                referralCode: refCode,
                referredBy: referredBy || null,
                createdAt: serverTimestamp()
            };

            await set(userRef, newUserProfile);
            
            // If referred, reward the referrer
            if (referredBy) {
                this.processReferralReward(referredBy);
            }

            ToastManager.show("Welcome! 10 Free Credits Added.", "success");
        } else {
            // EXISTING USER
            ToastManager.show(`Welcome back, ${user.displayName.split(' ')[0]}`, "success");
        }
        
        // Start listening to live data
        this.syncUserData(user.uid);
    }

    /**
     * Generates a unique 6-character referral code
     */
    static generateReferralCode(uid) {
        return (uid.substring(0, 3) + Math.floor(Math.random() * 999)).toUpperCase();
    }

    /**
     * Rewards the person who referred the new user
     */
    static async processReferralReward(refCode) {
        // Find user ID by referral code (This requires a query, simplified here for performance)
        // Note: For large scale, we would use a lookup table `referralCodes/{code}`.
        // Implementing simple scan for now.
        
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        
        snapshot.forEach((childSnap) => {
            const userData = childSnap.val();
            if (userData.referralCode === refCode) {
                // Found the referrer! Add credits.
                const newCredits = (userData.credits || 0) + AppState.config.referralReward;
                const newRefCount = (userData.referralCount || 0) + 1;
                
                update(ref(db, `users/${userData.uid}`), {
                    credits: newCredits,
                    referralCount: newRefCount
                });
            }
        });
    }

    /**
     * Live Sync of User Data (Credits, Plan) to UI
     */
    static syncUserData(uid) {
        const userRef = ref(db, `users/${uid}`);
        
        // Real-time listener
        onAuthStateChanged(auth, (user) => {
           if(user) {
               get(userRef).then(snap => {
                   AppState.userData = snap.val();
                   UIManager.updateDashboardUI(AppState.userData);
               });
           } 
        });
    }

    /**
     * Deducts credits from the user
     */
    static async deductCredits(amount) {
        if (!AppState.currentUser || !AppState.userData) return false;
        
        if (AppState.userData.credits < amount) {
            ToastManager.show("Insufficient Credits! Please top up.", "error");
            UIManager.openPremiumModal();
            return false;
        }

        const newBalance = AppState.userData.credits - amount;
        await update(ref(db, `users/${AppState.currentUser.uid}`), {
            credits: newBalance
        });
        
        // Update local state immediately for UI responsiveness
        AppState.userData.credits = newBalance;
        UIManager.updateDashboardUI(AppState.userData);
        return true;
    }

    /**
     * Upgrades user to Premium and adds credits
     */
    static async activatePremium() {
        if (!AppState.currentUser) return;
        
        const updates = {
            isPremium: true,
            credits: (AppState.userData.credits || 0) + AppState.config.premiumCredits,
            planName: "Zulora Pro"
        };
        
        await update(ref(db, `users/${AppState.currentUser.uid}`), updates);
        ToastManager.show("Premium Activated! 1000 Credits Added.", "success");
    }

    /**
     * Saves a published website to the Public Directory
     */
    static async publishWebsite(htmlContent, subdomain) {
        const siteId = subdomain.toLowerCase(); // Using subdomain as key
        
        const siteData = {
            owner: AppState.currentUser.uid,
            subdomain: siteId,
            html: htmlContent,
            createdAt: serverTimestamp(),
            views: 0
        };

        // Save to public 'websites' node (for wildcard routing)
        await set(ref(db, `websites/${siteId}`), siteData);

        // Add reference to user's profile
        await update(ref(db, `users/${AppState.currentUser.uid}/sites/${siteId}`), {
            subdomain: siteId,
            publishedAt: Date.now()
        });

        return true;
    }
}

// ----------------------------------------------------------------------------
// 5. CLASS: AI ENGINE (Groq / Gemini)
// ----------------------------------------------------------------------------
class AIEngine {
    
    /**
     * Calls Groq API to generate website code
     */
    static async generateWebsite(prompt) {
        const systemPrompt = `
            You are an expert Frontend Developer. 
            Create a modern, responsive single-page website based on the user's description.
            RULES:
            1. Return ONLY raw HTML code. Do not include markdown blocks (like \`\`\`html).
            2. Include embedded CSS in <style> tags within the head.
            3. Use FontAwesome via CDN.
            4. Make it look professional like Stripe or Linear.
            5. Ensure it is fully responsive (mobile-friendly).
            6. Do NOT include explanations, only code.
        `;

        const requestBody = {
            model: AI_CONFIG.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 8000
        };

        try {
            const response = await fetch(AI_CONFIG.endpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${AI_CONFIG.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }

            // Extract content and clean markdown if present
            let content = data.choices[0].message.content;
            content = content.replace(/```html/g, '').replace(/```/g, '');
            
            return content;

        } catch (error) {
            console.error("AI Generation Error:", error);
            ToastManager.show("AI Error: " + error.message, "error");
            return null;
        }
    }
}

// ----------------------------------------------------------------------------
// 6. CLASS: UI MANAGER (Handles DOM Interaction)
// ----------------------------------------------------------------------------
class UIManager {
    
    // --- Navigation ---
    static switchView(viewId) {
        document.querySelectorAll('.app-view, .app-view-overlay').forEach(el => {
            el.classList.remove('active-view');
            el.classList.add('hidden-view');
        });
        
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden-view');
            target.classList.add('active-view');
        }
    }

    // --- Dashboard Updates ---
    static updateDashboardUI(data) {
        if (!data) return;

        // Header
        const avatar = document.getElementById('dash-user-avatar');
        const name = document.getElementById('dash-user-name');
        const credits = document.getElementById('dash-user-credits');
        
        // Sidebar
        const sideAvatar = document.getElementById('dash-user-avatar');
        const sideName = document.getElementById('dash-user-name');
        const sideCredits = document.getElementById('dash-user-credits');

        if(avatar) avatar.src = data.photo || "https://via.placeholder.com/40";
        if(name) name.innerText = data.name;
        if(credits) credits.innerText = data.credits;

        // Referral Modal Updates
        const refLink = `https://zulora.in?ref=${data.referralCode}`;
        const refInput = document.getElementById('my-ref-link');
        if(refInput) refInput.value = refLink;
        
        const refCount = document.getElementById('total-referrals');
        if(refCount) refCount.innerText = data.referralCount || 0;
        
        const refEarned = document.getElementById('earned-credits');
        if(refEarned) refEarned.innerText = (data.referralCount || 0) * AppState.config.referralReward;

        // Load Projects
        this.loadUserProjects();
    }

    // --- Project Listing ---
    static async loadUserProjects() {
        const container = document.getElementById('projects-container');
        if (!container || !AppState.currentUser) return;

        const sitesRef = ref(db, `users/${AppState.currentUser.uid}/sites`);
        const snapshot = await get(sitesRef);

        if (snapshot.exists()) {
            container.innerHTML = ""; // Clear empty state
            
            snapshot.forEach(siteSnap => {
                const site = siteSnap.val();
                // Create Card Element
                const card = document.createElement('div');
                card.className = "project-card";
                card.innerHTML = `
                    <div class="card-preview">
                        <i class="fas fa-desktop"></i>
                    </div>
                    <div class="card-info">
                        <h4>${site.subdomain}.zulora.in</h4>
                        <div class="card-actions">
                            <a href="https://${site.subdomain}.zulora.in" target="_blank" class="card-link">Visit</a>
                            <button class="card-edit-btn" onclick="editWebsite('${site.subdomain}')">Edit</button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    }

    // --- Wizard Controls ---
    static openWizard() {
        document.getElementById('wizard-overlay').style.display = 'flex';
        // Reset steps
        this.resetWizard();
    }

    static closeWizard() {
        document.getElementById('wizard-overlay').style.display = 'none';
    }

    static resetWizard() {
        document.querySelectorAll('.wiz-step').forEach(s => s.classList.remove('active'));
        document.getElementById('wiz-step-1').classList.add('active');
        document.getElementById('wiz-subdomain').value = "";
        document.getElementById('ai-prompt-text').value = "";
    }

    // --- Modals ---
    static openPremiumModal() {
        document.getElementById('modal-premium').style.display = 'flex';
    }
    
    static openReferralModal() {
        document.getElementById('modal-referral').style.display = 'flex';
    }

    static closeModal(id) {
        document.getElementById(id).style.display = 'none';
    }
}

// ----------------------------------------------------------------------------
// 7. MAIN LOGIC & EVENT LISTENERS
// ----------------------------------------------------------------------------

/**
 * Global Initialization
 */
window.onload = function() {
    
    // 1. Subdomain Router Check
    const host = window.location.hostname;
    const parts = host.split('.');
    
    // Ignore localhost, main domain, or vercel app domain
    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'zulora') {
        const subdomain = parts[0];
        // Fetch and Render User Site
        renderSubdomainSite(subdomain);
        return; // Stop loading main app
    }
    
    // 2. Hide Loader
    setTimeout(() => {
        document.getElementById('global-loader').style.display = 'none';
    }, 800);
};

// --- Subdomain Renderer ---
async function renderSubdomainSite(subdomain) {
    document.body.innerHTML = `
        <div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif;">
            <div style="width:50px;height:50px;border:4px solid #eee;border-top:4px solid #6366f1;border-radius:50%;animation:spin 1s linear infinite;"></div>
            <h2 style="margin-top:20px;color:#333;">Loading ${subdomain}...</h2>
        </div>
        <style>@keyframes spin { 0% {transform:rotate(0deg);} 100% {transform:rotate(360deg);} }</style>
    `;

    const siteRef = ref(db, `websites/${subdomain}`);
    const snapshot = await get(siteRef);

    if (snapshot.exists()) {
        const html = snapshot.val().html;
        document.open();
        document.write(html);
        document.close();
    } else {
        document.body.innerHTML = `
            <div style="text-align:center;padding:50px;font-family:sans-serif;">
                <h1>404</h1>
                <p>Website <strong>${subdomain}</strong> not found.</p>
                <a href="https://zulora.in" style="color:#6366f1;">Build your own site at Zulora</a>
            </div>
        `;
    }
}

// --- Auth Functions ---
window.triggerGoogleLogin = function() {
    signInWithPopup(auth, provider).then((result) => {
        DatabaseManager.handleUserLogin(result.user);
    }).catch((error) => {
        ToastManager.show(error.message, "error");
    });
};

window.logoutUser = function() {
    signOut(auth).then(() => {
        window.location.reload();
    });
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        AppState.currentUser = user;
        UIManager.switchView('view-dashboard');
        DatabaseManager.handleUserLogin(user);
    } else {
        UIManager.switchView('view-landing');
    }
});


// --- Wizard & Builder Functions ---
window.openBuilderWizard = () => UIManager.openWizard();
window.closeBuilderWizard = () => UIManager.closeWizard();

window.wizardNext = function(step) {
    if (step === 2) {
        const sub = document.getElementById('wiz-subdomain').value;
        if (sub.length < 3) {
            ToastManager.show("Project name too short!", "error");
            return;
        }
        AppState.currentProject.name = sub;
    }
    
    // Switch Wizard Tab
    document.querySelectorAll('.wiz-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`wiz-step-${step}`).classList.add('active');
};

window.selectMethod = function(method) {
    AppState.currentProject.method = method;
    if (method === 'AI') {
        window.wizardNext('3a');
        // Update balance display
        const balance = AppState.userData ? AppState.userData.credits : 0;
        document.getElementById('wiz-balance').innerText = balance;
    } else {
        window.wizardNext('3b');
    }
};

// --- AI GENERATION LOGIC ---
window.startGeneration = async function() {
    const prompt = document.getElementById('ai-prompt-text').value;
    if (!prompt) {
        ToastManager.show("Please describe your website first.", "error");
        return;
    }

    // 1. Check Credits
    if (!await DatabaseManager.deductCredits(AppState.config.generationCost)) {
        return; // Failed to deduct (not enough balance)
    }

    // 2. Show Loader
    document.querySelectorAll('.wiz-step').forEach(s => s.classList.remove('active'));
    document.getElementById('wiz-step-loading').classList.add('active');

    // 3. Call AI
    const generatedHTML = await AIEngine.generateWebsite(prompt);

    if (generatedHTML) {
        // 4. Success -> Go to Editor
        document.getElementById('website-canvas').innerHTML = generatedHTML;
        document.getElementById('editor-domain-display').innerText = AppState.currentProject.name + ".zulora.in";
        
        UIManager.closeWizard();
        UIManager.switchView('view-editor');
        ToastManager.show("Website Generated Successfully!", "success");
    } else {
        // Failed
        UIManager.openWizard(); // Reopen to try again
        // Ideally refund credits here, skipping for simplicity in this demo
    }
};

// --- Template Logic ---
window.finalizeTemplate = function(templateName) {
    // Load a hardcoded template for demo
    const templateHTML = getTemplateHTML(templateName, AppState.currentProject.name);
    document.getElementById('website-canvas').innerHTML = templateHTML;
    document.getElementById('editor-domain-display').innerText = AppState.currentProject.name + ".zulora.in";
    
    UIManager.closeWizard();
    UIManager.switchView('view-editor');
    ToastManager.show(`Loaded ${templateName} Template`, "success");
};

// --- Editor Functions ---
window.setCanvasWidth = (width) => {
    document.querySelector('.canvas-container').style.width = width;
};

window.exitEditor = () => {
    if(confirm("Discard unsaved changes?")) {
        UIManager.switchView('view-dashboard');
    }
};

window.saveAndPublish = async function() {
    const html = document.getElementById('website-canvas').innerHTML;
    const sub = AppState.currentProject.name;
    
    ToastManager.show("Publishing to global servers...", "info");
    
    await DatabaseManager.publishWebsite(html, sub);
    
    ToastManager.show("Live at: " + sub + ".zulora.in", "success");
    
    setTimeout(() => {
        UIManager.switchView('view-dashboard');
    }, 2000);
};

// --- Editor Tools ---
window.enableTextEdit = () => {
    const canvas = document.getElementById('website-canvas');
    canvas.contentEditable = "true";
    ToastManager.show("Text Editing Enabled. Click any text.", "info");
};

window.handleImageUpload = (event) => {
    // Basic file reader implementation
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Insert image at cursor or append
            // For simplicity in this demo, we replace the first image found or alert user
            const img = document.querySelector('#website-canvas img');
            if (img) {
                img.src = e.target.result;
                ToastManager.show("Image Replaced", "success");
            } else {
                ToastManager.show("Drag image to place it", "info");
            }
        };
        reader.readAsDataURL(file);
    }
};

// --- Modal Controls ---
window.openPremiumModal = () => UIManager.openPremiumModal();
window.openReferralModal = () => UIManager.openReferralModal();
window.closeModal = (id) => UIManager.closeModal(id);

window.copyUPI = () => {
    navigator.clipboard.writeText("shivenpanwar@fam");
    ToastManager.show("UPI ID Copied!", "success");
};

window.copyRefLink = () => {
    const input = document.getElementById('my-ref-link');
    input.select();
    navigator.clipboard.writeText(input.value);
    ToastManager.show("Referral Link Copied!", "success");
};

// --- Payment Verification (Simulation) ---
window.verifyPayment = () => {
    const btn = document.getElementById('verify-pay-btn');
    const originalText = btn.innerText;
    
    btn.innerText = "Verifying with Bank...";
    btn.disabled = true;
    
    setTimeout(async () => {
        await DatabaseManager.activatePremium();
        
        btn.innerText = "Verified!";
        btn.style.background = "#10b981";
        
        setTimeout(() => {
            UIManager.closeModal('modal-premium');
            btn.innerText = originalText;
            btn.disabled = false;
        }, 2000);
        
    }, 2500); // 2.5s simulated delay
};

// --- Helpers: Template Data ---
function getTemplateHTML(name, siteName) {
    const colors = name === 'Agency' ? '#6366f1' : (name === 'SaaS' ? '#10b981' : '#f59e0b');
    return `
        <div style="font-family: 'Inter', sans-serif; color: #333;">
            <nav style="padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee;">
                <h3 style="font-weight: 800; color: ${colors};">${siteName}</h3>
                <div>
                    <a style="margin-right: 20px; cursor: pointer;">Home</a>
                    <a style="margin-right: 20px; cursor: pointer;">Services</a>
                    <a style="cursor: pointer; padding: 8px 16px; background: ${colors}; color: white; border-radius: 6px;">Contact</a>
                </div>
            </nav>
            <header style="padding: 100px 20px; text-align: center; background: #f8fafc;">
                <h1 style="font-size: 3.5rem; margin-bottom: 20px;">We are ${siteName}</h1>
                <p style="font-size: 1.2rem; color: #666; max-width: 600px; margin: 0 auto 40px;">
                    The best ${name} solution for your needs. Professional, reliable, and fast.
                </p>
                <button style="padding: 15px 30px; background: ${colors}; color: white; border: none; font-size: 1.1rem; border-radius: 8px; cursor: pointer;">
                    Get Started
                </button>
            </header>
            <div style="padding: 80px 40px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;">
                <div style="padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h3 style="margin-bottom: 10px;">Quality</h3>
                    <p>We deliver the best results.</p>
                </div>
                <div style="padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h3 style="margin-bottom: 10px;">Speed</h3>
                    <p>Fast turnaround times.</p>
                </div>
                <div style="padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h3 style="margin-bottom: 10px;">Support</h3>
                    <p>24/7 customer service.</p>
                </div>
            </div>
        </div>
    `;
}
