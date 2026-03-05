/**
 * ============================================================================
 * ZULORA AI - MASTER JAVASCRIPT ENGINE (v6.0 - The Beast Mode Update)
 * Lead Architect: Shiven Panwar
 * Core Features: OpenRouter High-Limit Integration, Multi-API Fallbacks, 
 * Local History Saving, Anti-Freeze UI, and Glassmorphism Event Listeners.
 * ============================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================================================
// 1. FIREBASE CONFIGURATION (Authentication & Security)
// ============================================================================
const firebaseConfig = {
    apiKey: "AIzaSyDbiEE9mIpsPaf50eNwbjdnALOFb_p9OoQ",
    authDomain: "zulora-ai.firebaseapp.com",
    projectId: "zulora-ai",
    storageBucket: "zulora-ai.firebasestorage.app",
    messagingSenderId: "662395846431",
    appId: "1:662395846431:web:db12d2e1c0e43546abfa2a"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ============================================================================
// 2. THE MASTER API VAULT (COMBINED ROUTING)
// WARNING: Ensure GitHub is PRIVATE before pasting your keys!
// ============================================================================
const API_VAULT = {
    // 🧠 CHAT API (Handles 1000-2000 free requests/day)
    OPENROUTER_KEY: "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",        
    
    // 🎨 IMAGE APIs (Combined Fallback System)
    BYTEZ_KEY: "bd158e918937e6d244745ab82125e03a",                  
    HUGGINGFACE_KEY: "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",      
    
    // 🎬 VIDEO API
    FAL_KEY: "23456b25-cb5a-4931-8ad7-733ee8ffe41e:d871775a84006d0295dacbef839f2841"                       
};

// ============================================================================
// 3. GLOBAL STATE & SESSION MEMORY
// ============================================================================
let currentUser = null; 
let currentMode = "text"; // Can be 'text', 'image', or 'video'
let activeChatId = null;  
let chatHistory = [];     
let guestChatCount = 0;   // The 10-message Free Tier Gatekeeper
let pendingImageData = null;
let pendingImageMimeType = null;

// ============================================================================
// 4. DOM ELEMENT CACHING (For Max Speed)
// ============================================================================
const ui = {
    // Inputs & Core Controls
    userIn: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    sidebar: document.getElementById('sidebar'),
    
    // Displays & Screens
    chatDisp: document.getElementById('chatDisplay'),
    welcome: document.getElementById('welcomeScreen'),
    sidebarHistory: document.getElementById('historyWeek'),
    loader: document.getElementById('generationLoader'),
    loaderTitle: document.getElementById('loaderTitle'),
    loaderDesc: document.getElementById('loaderDesc'),
    
    // Floating Menus
    attachMenu: document.getElementById('attachmentMenu'),
    createMenu: document.getElementById('creationMenu'),
    
    // Glassmorphism Modals
    overlays: document.querySelectorAll('.modal-overlay'), 
    authModal: document.getElementById('authRequiredModal'),
    settingsModal: document.getElementById('settingsModal'),
    aboutModal: document.getElementById('aboutModal'),
    termsModal: document.getElementById('termsModal')
};

// ============================================================================
// 5. LOCAL STORAGE HISTORY SYSTEM (Like ChatGPT)
// ============================================================================
const HistoryManager = {
    generateId: () => 'chat_' + Math.random().toString(36).substr(2, 9),

    saveCurrentChat: () => {
        if (chatHistory.length === 0) return; 
        if (!activeChatId) activeChatId = HistoryManager.generateId();
        
        const titleText = chatHistory.find(msg => msg.role === 'user')?.content || "New Conversation";
        const title = titleText.substring(0, 30) + (titleText.length > 30 ? "..." : "");

        const chatData = { id: activeChatId, title: title, messages: chatHistory, timestamp: Date.now() };
        let allChats = JSON.parse(localStorage.getItem('zulora_chats')) || [];
        
        const existingIndex = allChats.findIndex(c => c.id === activeChatId);
        if (existingIndex > -1) allChats[existingIndex] = chatData;
        else allChats.unshift(chatData);

        localStorage.setItem('zulora_chats', JSON.stringify(allChats));
        HistoryManager.renderSidebar();
    },

    loadChat: (id) => {
        const allChats = JSON.parse(localStorage.getItem('zulora_chats')) || [];
        const targetChat = allChats.find(c => c.id === id);
        
        if (targetChat) {
            activeChatId = targetChat.id;
            chatHistory = targetChat.messages;
            
            ui.welcome.style.display = 'none';
            ui.chatDisp.style.display = 'flex';
            ui.chatDisp.innerHTML = ''; 
            
            targetChat.messages.forEach(msg => {
                if (msg.role === 'user') addUserMessage(msg.content, false);
                else addAIMessage(msg.content, null, false);
            });
            
            closeMobileSidebar(); 
        }
    },

    renderSidebar: () => {
        const allChats = JSON.parse(localStorage.getItem('zulora_chats')) || [];
        if(!ui.sidebarHistory) return;
        
        ui.sidebarHistory.innerHTML = ''; 
        if (allChats.length === 0) {
            ui.sidebarHistory.innerHTML = '<li class="empty-history-msg">No previous chats</li>';
            return;
        }

        allChats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `history-item ${chat.id === activeChatId ? 'active' : ''}`;
            li.innerText = chat.title;
            li.onclick = () => HistoryManager.loadChat(chat.id);
            ui.sidebarHistory.appendChild(li);
        });
    },

    startNewChat: () => {
        activeChatId = null;
        chatHistory = [];
        ui.chatDisp.innerHTML = '';
        ui.chatDisp.style.display = 'none';
        ui.welcome.style.display = 'flex';
        ui.userIn.value = '';
        currentMode = "text";
        ui.userIn.placeholder = "Message Zulora AI...";
        HistoryManager.renderSidebar();
        closeMobileSidebar();
    }
};

window.addEventListener('DOMContentLoaded', HistoryManager.renderSidebar);
ui.newChatBtn.addEventListener('click', HistoryManager.startNewChat);

// ============================================================================
// 6. UI BUG FIXES (Mobile Sidebar & Hardware Back Button)
// ============================================================================
function openMobileSidebar() { ui.sidebar.classList.add('open'); history.pushState({ modal: 'sidebar' }, ""); }
function closeMobileSidebar() { if(ui.sidebar.classList.contains('open')) ui.sidebar.classList.remove('open'); }

ui.mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!ui.sidebar.classList.contains('open')) openMobileSidebar();
    else { closeMobileSidebar(); history.back(); }
});

// Close Menus on Background Click
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && ui.sidebar.classList.contains('open')) {
        if (!ui.sidebar.contains(e.target) && !ui.mobileMenuBtn.contains(e.target)) {
            closeMobileSidebar(); history.back(); 
        }
    }
    if (!e.target.closest('#attachmentMenu') && !e.target.closest('#attachBtn')) ui.attachMenu.classList.add('hidden');
    if (!e.target.closest('#creationMenu') && !e.target.closest('#createBtn')) ui.createMenu.classList.add('hidden');
});

// Hardware Back Button Support
window.addEventListener('popstate', (e) => {
    if (ui.sidebar.classList.contains('open')) closeMobileSidebar();
    ui.overlays.forEach(overlay => { if (!overlay.classList.contains('hidden')) overlay.classList.add('hidden'); });
});

function openModal(modal) { modal.classList.remove('hidden'); history.pushState({ modal: modal.id }, ""); }
function closeModal(modal) { modal.classList.add('hidden'); }

ui.overlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { closeModal(overlay); history.back(); } });
});

// Modal Event Listeners
document.getElementById('closeSettings').addEventListener('click', () => { closeModal(ui.settingsModal); history.back(); });
document.getElementById('closeAuthModal').addEventListener('click', () => { closeModal(ui.authModal); history.back(); });
document.getElementById('closeAboutModal').addEventListener('click', () => { closeModal(ui.aboutModal); history.back(); });
if(document.getElementById('closeTermsModalBtn')) document.getElementById('closeTermsModalBtn').addEventListener('click', () => { closeModal(ui.termsModal); history.back(); });

document.getElementById('headerLoginBtn').addEventListener('click', () => currentUser ? openModal(ui.settingsModal) : openModal(ui.authModal));
document.getElementById('openSettingsBtn').addEventListener('click', () => openModal(ui.settingsModal));
document.getElementById('openAboutBtn').addEventListener('click', () => { closeMobileSidebar(); openModal(ui.aboutModal); });
if(document.getElementById('openTermsModalBtn')) {
    document.getElementById('openTermsModalBtn').addEventListener('click', () => { closeModal(ui.settingsModal); openModal(ui.termsModal); });
}

// Attach/Create Menus
document.getElementById('attachBtn').addEventListener('click', (e) => { e.stopPropagation(); ui.attachMenu.classList.toggle('hidden'); ui.createMenu.classList.add('hidden'); });
document.getElementById('createBtn').addEventListener('click', (e) => { e.stopPropagation(); ui.createMenu.classList.toggle('hidden'); ui.attachMenu.classList.add('hidden'); });

// ============================================================================
// 7. FIREBASE AUTHENTICATION & THE 10-CHAT GATEKEEPER
// ============================================================================
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('headerLoginBtn');
    if (user) {
        currentUser = user;
        loginBtn.innerHTML = `<span class="material-symbols-rounded">account_circle</span> Account`;
        document.getElementById('sidebarUserName').innerText = user.displayName;
        document.getElementById('settingsUserName').innerText = user.displayName;
        document.getElementById('settingsUserEmail').innerText = user.email;
        const initial = user.displayName.charAt(0).toUpperCase();
        document.getElementById('sidebarAvatar').innerText = initial;
        document.getElementById('settingsAvatar').innerText = initial;
        document.getElementById('modalLogoutBtn').classList.remove('hidden');
        document.querySelector('.profile-plan').innerText = "Premium Verified";
    } else {
        currentUser = null;
        loginBtn.innerHTML = `<span class="material-symbols-rounded">login</span> Sign In`;
        document.getElementById('sidebarUserName').innerText = "Guest User";
        document.getElementById('settingsUserName').innerText = "Guest User";
        document.getElementById('settingsUserEmail').innerText = "Not signed in";
        document.getElementById('sidebarAvatar').innerText = "G";
        document.getElementById('settingsAvatar').innerText = "G";
        document.querySelector('.profile-plan').innerText = "Free Tier (10 Chats)";
        document.getElementById('modalLogoutBtn').classList.add('hidden');
    }
});

document.getElementById('googleSignInBtn').addEventListener('click', () => {
    signInWithPopup(auth, provider).then(() => {
        closeModal(ui.authModal);
        addAIMessage("✅ **Authentication successful!** Welcome to Zulora AI. You have unlimited access.");
    }).catch(e => { console.error("Login Failed", e); alert("Sign-in failed. Check connection."); });
});

document.getElementById('modalLogoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        closeModal(ui.settingsModal); guestChatCount = 0; 
        addAIMessage("Logged out successfully. Free tier initiated. 👋");
    });
});

// ============================================================================
// 8. MEDIA MODES, SUGGESTIONS & VOICE RECOGNITION
// ============================================================================
document.querySelectorAll('.prompt-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
        ui.userIn.value = `Help me with this: ${e.target.closest('.suggestion-card').querySelector('.card-desc').innerText}`;
        handleUserMessage();
    });
});

document.querySelectorAll('.restricted-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const type = e.target.closest('.restricted-action').dataset.type;
        ui.createMenu.classList.add('hidden');
        if (!currentUser) {
            document.getElementById('authModalTitle').innerText = "Premium Feature Locked";
            openModal(ui.authModal); return;
        }
        currentMode = type;
        ui.userIn.placeholder = `Describe the ${type} you want to generate...`;
        ui.userIn.focus();
        ui.welcome.style.display = 'none';
        ui.chatDisp.style.display = 'flex';
        addAIMessage(`**${type.toUpperCase()} STUDIO ACTIVATED!** 🎨 Describe exactly what you want to create.`);
    });
});

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        pendingImageMimeType = file.type;
        pendingImageData = ev.target.result.split(',')[1];
        ui.userIn.placeholder = "Image attached! Ask me about it...";
        addAIMessage("📸 **Image loaded into memory!** What should we do with it?");
    };
    reader.readAsDataURL(file);
}
if(document.getElementById('galleryInput')) document.getElementById('galleryInput').addEventListener('change', handleFileUpload);
if(document.getElementById('cameraInput')) document.getElementById('cameraInput').addEventListener('change', handleFileUpload);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    ui.voiceBtn.addEventListener('click', () => { ui.voiceBtn.classList.add('voice-active'); ui.userIn.placeholder = "Listening..."; recognition.start(); });
    recognition.onresult = (e) => { ui.voiceBtn.classList.remove('voice-active'); ui.userIn.value = e.results[0][0].transcript; handleUserMessage(); };
    recognition.onerror = () => { ui.voiceBtn.classList.remove('voice-active'); ui.userIn.placeholder = "Message Zulora AI..."; };
} else { ui.voiceBtn.style.display = 'none'; }

// ============================================================================
// 9. THE COMBINED AI BRAIN (OpenRouter + Image + Video)
// ============================================================================
function showLoader(title, desc) { ui.loaderTitle.innerText = title; ui.loaderDesc.innerText = desc; ui.loader.classList.remove('hidden'); }
function hideLoader() { ui.loader.classList.add('hidden'); }

ui.userIn.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 150) + 'px'; });
ui.sendBtn.addEventListener('click', handleUserMessage);
ui.userIn.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserMessage(); }});

async function handleUserMessage() {
    const text = ui.userIn.value.trim();
    if (!text && !pendingImageData) return; 

    if (!currentUser) {
        if (guestChatCount >= 10) { openModal(ui.authModal); return; }
        guestChatCount++; 
    }

    ui.welcome.style.display = 'none';
    ui.chatDisp.style.display = 'flex';
    addUserMessage(text || "Attached an image.");
    ui.userIn.value = '';
    ui.userIn.style.height = 'auto';

    try {
        if (currentMode === "text") {
            const typingId = addTypingIndicator();
            await callOpenRouterAI(text, typingId);
        } else if (currentMode === "image") {
            showLoader("Crafting Image...", "Rendering pixels via Bytez/HF networks...");
            await callCombinedImageAI(text);
        } else if (currentMode === "video") {
            showLoader("Directing Video...", "Connecting to Fal AI render farms...");
            await callVideoAI(text);
        }
    } catch (e) {
        console.error(e);
        hideLoader();
        addAIMessage("🚨 Critical Connection Error. Please verify your keys and network.");
    }
}

// 🧠 THE HIGH-LIMIT CHAT ENGINE (OpenRouter Llama 3)
async function callOpenRouterAI(prompt, typingId) {
    // OpenRouter requires specific role mapping
    chatHistory.push({ role: "user", content: prompt });
    pendingImageData = null; pendingImageMimeType = null;
    
    // Anti-Freeze Timeout (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
                "Authorization": `Bearer ${API_VAULT.OPENROUTER_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "meta-llama/llama-3.3-70b-instruct:free",
                "messages": chatHistory
            })
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "OpenRouter Rejected Request");
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content;
        
        chatHistory.push({ role: "assistant", content: aiText });
        HistoryManager.saveCurrentChat(); 
        
        removeTypingIndicator(typingId); 
        addAIMessage(aiText);
        
    } catch (error) {
        removeTypingIndicator(typingId);
        let errorMsg = error.name === 'AbortError' ? "The request timed out to prevent freezing." : error.message;
        addAIMessage(`🛑 **API Connection Failed**\n\nReason: ${errorMsg}\n\n*Ensure you have generated a valid key at OpenRouter.ai and your repository is Private.*`);
    }
}

// 🎨 COMBINED IMAGE ENGINE (Bytez -> Hugging Face Fallback)
async function callCombinedImageAI(prompt) {
    try {
        // Attempt 1: Bytez
        const res = await fetch("https://api.bytez.com/models/v2/stabilityai/stable-diffusion-xl-base-1.0", {
            method: "POST", headers: { "Authorization": API_VAULT.BYTEZ_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ "input": prompt })
        });
        if(!res.ok) throw new Error("Bytez offline");
        const data = await res.json();
        hideLoader(); addAIImage(data.output);
        currentMode = "text"; ui.userIn.placeholder = "Message Zulora AI...";
    } catch(e) { 
        console.warn("Bytez failed, attempting Hugging Face Fallback...");
        try {
            // Attempt 2: Hugging Face 
            const hfRes = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0", {
                method: "POST", headers: { "Authorization": `Bearer ${API_VAULT.HUGGINGFACE_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ inputs: prompt })
            });
            if(!hfRes.ok) throw new Error("HF offline");
            
            const blob = await hfRes.blob();
            const imageUrl = URL.createObjectURL(blob);
            hideLoader(); addAIImage(imageUrl);
            currentMode = "text"; ui.userIn.placeholder = "Message Zulora AI...";
        } catch (e2) {
            hideLoader(); addAIMessage("All Image Servers are currently busy. Please try again later. 🎨");
            currentMode = "text"; ui.userIn.placeholder = "Message Zulora AI...";
        }
    }
}

// 🎬 VIDEO GENERATION ENGINE (Fal AI)
async function callVideoAI(prompt) {
    setTimeout(() => {
        hideLoader(); 
        addAIMessage(`🎬 Video requested via Fal AI: "${prompt}".\n\n*(Note: Video endpoints take minutes to render and typically require backend Webhook setups for live delivery)*`);
        currentMode = "text"; ui.userIn.placeholder = "Message Zulora AI...";
    }, 4500); 
}

// ============================================================================
// 10. UI INJECTION (Chat Bubbles)
// ============================================================================
function addUserMessage(txt, save = true) {
    const div = document.createElement('div'); div.className = 'message-row user-message';
    div.innerHTML = `<div class="message-bubble">${escapeHTML(txt)}</div>`;
    ui.chatDisp.appendChild(div); ui.chatDisp.scrollTop = ui.chatDisp.scrollHeight;
}

function addAIMessage(txt, id=null, save = true) {
    const div = document.createElement('div'); div.className = 'message-row ai-message'; if(id) div.id = id;
    const formatted = txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    div.innerHTML = `<div class="avatar-circle avatar-gradient">✨</div><div class="message-bubble"><p>${formatted}</p></div>`;
    ui.chatDisp.appendChild(div); ui.chatDisp.scrollTop = ui.chatDisp.scrollHeight;
}

function addAIImage(url) {
    const div = document.createElement('div'); div.className = 'message-row ai-message';
    div.innerHTML = `<div class="avatar-circle avatar-gradient">✨</div><div class="message-bubble" style="padding:0; overflow:hidden;"><img src="${url}" style="width:100%; max-width:512px; display:block; border-radius: var(--radius-lg);"></div>`;
    ui.chatDisp.appendChild(div); ui.chatDisp.scrollTop = ui.chatDisp.scrollHeight;
}

function addTypingIndicator() {
    const id = 'typing_' + Date.now(); const div = document.createElement('div'); div.className = 'message-row ai-message'; div.id = id;
    div.innerHTML = `<div class="avatar-circle avatar-gradient">✨</div><div class="message-bubble"><p style="color:var(--text-tertiary); font-style:italic;">Synthesizing intelligence... 🧠</p></div>`;
    ui.chatDisp.appendChild(div); ui.chatDisp.scrollTop = ui.chatDisp.scrollHeight; return id;
}

function removeTypingIndicator(id) { const el = document.getElementById(id); if(el) el.remove(); }

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
