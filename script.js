// CHECK FOR SUBDOMAIN
const fullDomain = window.location.hostname; // e.g., "shiven.zulora.in"
const subdomain = fullDomain.split('.')[0]; // Gets "shiven"

// If we are on the main site (zulora.in or www.zulora.in), do nothing.
// If we are on a USER subdomain (e.g., shiven.zulora.in), load their site.
if (subdomain !== "zulora" && subdomain !== "www" && subdomain !== "localhost") {
    
    // 1. Hide the Main Landing Page immediately
    document.getElementById('view-landing').style.display = 'none';
    
    // 2. Fetch User Data from Firebase based on this subdomain
    // (We search your database to find who owns "shiven")
    const usersRef = ref(db, 'users');
    get(usersRef).then((snapshot) => {
        let foundUser = false;
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            // Assuming you saved 'subdomain' in their profile
            if (user.subdomain === subdomain) {
                foundUser = true;
                // LOAD THEIR WEBSITE
                document.body.innerHTML = renderUserWebsite(user, user.theme); 
            }
        });
        
        if (!foundUser) {
            document.body.innerHTML = "<h1>404 - Site Not Found</h1><p>This Zulora site does not exist yet.</p>";
        }
    });
}

function renderUserWebsite(user, theme) {
    // This returns the HTML for the user's site
    return `
        <div class="gen-site theme-${theme}">
            <nav class="gen-nav"><h3>${user.subdomain}</h3></nav>
            <header class="gen-hero">
                <h1>Welcome to ${user.name}'s Site</h1>
                <p>Powered by Zulora.in</p>
            </header>
        </div>
    `;
}
// ==========================================
// 1. FIREBASE CONFIGURATION & IMPORTS
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, update, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// REPLACE WITH YOUR FIREBASE KEYS
const firebaseConfig = {
    apiKey: "AIzaSyC4XXmvYQap_Y1tXF-mWG82rL5MsBXjcvQ", // Use your real Key
    authDomain: "zulorain.firebaseapp.com",
    projectId: "zulorain",
    storageBucket: "zulorain.firebasestorage.app",
    messagingSenderId: "972907481049",
    appId: "1:972907481049:web:b4d02b9808f9e2f3f8bbc8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let currentImageTarget = null; // For the image uploader

// ==========================================
// 2. AUTHENTICATION (Google Sign In)
// ==========================================
window.loginWithGoogle = function() {
    signInWithPopup(auth, provider).then((result) => {
        const user = result.user;
        
        // Check if new user -> Create DB Entry
        const userRef = ref(db, 'users/' + user.uid);
        get(userRef).then((snapshot) => {
            if (!snapshot.exists()) {
                // NEW USER SETUP
                set(userRef, {
                    name: user.displayName,
                    email: user.email,
                    photo: user.photoURL,
                    isPremium: false,
                    websiteLimit: 3,
                    websitesCreated: 0,
                    referrals: 0,
                    referralCode: generateRefCode(user.uid)
                });
                showToast("Welcome to Zulora! Notification sent to email.", "success");
            } else {
                showToast("Welcome back, " + user.displayName.split(' ')[0], "success");
            }
        });
    }).catch((error) => {
        showToast("Login Failed: " + error.message, "error");
    });
};

window.logout = function() {
    signOut(auth).then(() => {
        window.location.reload();
    });
};

// Monitor Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('view-landing').classList.remove('active-view');
        document.getElementById('view-dashboard').classList.add('active-view');
        loadDashboardData(user.uid);
    }
});

// ==========================================
// 3. DASHBOARD LOGIC
// ==========================================
function loadDashboardData(uid) {
    const userRef = ref(db, 'users/' + uid);
    get(userRef).then((snapshot) => {
        const data = snapshot.val();
        
        // Update UI
        document.getElementById('dash-name').innerText = data.name;
        document.getElementById('dash-avatar').src = data.photo;
        document.getElementById('site-count').innerText = data.websitesCreated;
        document.getElementById('site-limit').innerText = data.websiteLimit;
        document.getElementById('ref-count').innerText = data.referrals;
        document.getElementById('ref-link').value = "https://zulora.in?ref=" + data.referralCode;

        // Update Referral Progress
        const refProgress = Math.min(data.referrals, 3);
        document.getElementById('ref-bar').style.width = (refProgress / 3 * 100) + "%";
        document.getElementById('ref-progress-text').innerText = refProgress + "/3";

        // Premium Check
        if (data.isPremium) {
            document.getElementById('plan-status').innerText = "Premium Member";
            document.getElementById('plan-status').classList.add('premium');
            document.getElementById('site-limit').innerText = "∞";
            document.getElementById('premium-secret').style.display = "block";
        }
    });
}

// Generate unique referral code
function generateRefCode(uid) {
    return uid.substring(0, 5).toUpperCase() + Math.floor(Math.random() * 1000);
}

// ==========================================
// 4. SUBSCRIPTION & PAYMENT (Simulation)
// ==========================================
window.showSubscriptionModal = function() {
    document.getElementById('modal-premium').style.display = "flex";
};

window.copyUPI = function() {
    navigator.clipboard.writeText("shivenpanwar@fam");
    showToast("UPI ID Copied!", "success");
};

window.simulatePayment = function() {
    if(!currentUser) return;
    
    // Simulate "Checking Payment"
    const btn = document.querySelector('.btn-pay');
    btn.innerText = "Verifying...";
    
    setTimeout(() => {
        // Upgrade User in DB
        update(ref(db, 'users/' + currentUser.uid), {
            isPremium: true,
            websiteLimit: 9999
        }).then(() => {
            btn.innerText = "Payment Verified!";
            btn.style.background = "#10b981";
            showToast("Premium Activated! You are now Unlimited.", "success");
            setTimeout(() => {
                closeModal('modal-premium');
                loadDashboardData(currentUser.uid);
            }, 2000);
        });
    }, 2000);
};

// ==========================================
// 5. EDITOR & IMAGE UPLOAD
// ==========================================
window.checkLimitAndCreate = function() {
    const limit = document.getElementById('site-limit').innerText;
    const current = document.getElementById('site-count').innerText;
    
    if (limit !== "∞" && parseInt(current) >= parseInt(limit)) {
        showToast("Free Limit Reached! Upgrade or Refer friends.", "error");
        showSubscriptionModal();
    } else {
        document.getElementById('view-dashboard').classList.remove('active-view');
        document.getElementById('view-builder').classList.add('active-view');
    }
};

window.startBuilding = function(style) {
    document.getElementById('step-2').style.display = 'none';
    document.getElementById('step-loading').style.display = 'flex';
    
    setTimeout(() => {
        document.getElementById('view-builder').classList.remove('active-view');
        document.getElementById('view-editor').classList.add('active-view');
        
        // Generate Template
        const subdomain = "site-" + Math.floor(Math.random() * 10000);
        document.getElementById('editor-subdomain').innerText = subdomain;
        
        // Inject Editable HTML
        const container = document.getElementById('website-canvas');
        container.innerHTML = `
            <div style="padding:50px; text-align:center; background:${style === 'Dark' ? '#1e293b' : '#fff'}; color:${style === 'Dark' ? '#fff' : '#000'}">
                <img src="https://via.placeholder.com/150" class="editable-img" onclick="triggerImageUpload(this)">
                <h1 class="editable-text" contenteditable="true">My ${style} Business</h1>
                <p class="editable-text" contenteditable="true">Tap any text to edit. Tap image to replace.</p>
                <button style="padding:10px 20px; background:#7e22ce; color:white; border:none; border-radius:5px; margin-top:20px;">Contact Us</button>
            </div>
        `;
    }, 2000);
};

// Handle Custom Image Upload
window.triggerImageUpload = function(imgElement) {
    currentImageTarget = imgElement;
    document.getElementById('image-upload').click();
};

window.handleImageUpload = function(event) {
    const file = event.target.files[0];
    if (file && currentImageTarget) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageTarget.src = e.target.result; // Set image src to the uploaded file
        };
        reader.readAsDataURL(file);
    }
};

window.saveWebsite = function() {
    // Save site count to DB
    const userRef = ref(db, 'users/' + currentUser.uid);
    get(userRef).then((snap) => {
        const currentCount = snap.val().websitesCreated || 0;
        update(userRef, { websitesCreated: currentCount + 1 });
    });
    
    showToast("Website Published Successfully!", "success");
    setTimeout(() => {
        window.location.reload(); // Return to dashboard
    }, 1500);
};

window.exitEditor = function() {
    if(confirm("Exit without saving?")) {
        document.getElementById('view-editor').classList.remove('active-view');
        document.getElementById('view-dashboard').classList.add('active-view');
    }
};

// ==========================================
// 6. UTILS & REFERRAL SYSTEM
// ==========================================
window.showReferralModal = function() {
    document.getElementById('modal-referral').style.display = 'flex';
};

window.closeModal = function(id) {
    document.getElementById(id).style.display = 'none';
};

window.copyRef = function() {
    const input = document.getElementById('ref-link');
    input.select();
    navigator.clipboard.writeText(input.value);
    showToast("Referral Link Copied!", "success");
};

function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = type === 'success' ? `<i class="fas fa-check-circle"></i> ${msg}` : `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
