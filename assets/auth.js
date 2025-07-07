// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your web app's Firebase configuration that you provided
const firebaseConfig = {
  apiKey: "AIzaSyDVrCYmiu1ANPHpOmWR1oyY2LXdzeBJiLk",
  authDomain: "rs-digital-portfolio.firebaseapp.com",
  projectId: "rs-digital-portfolio",
  storageBucket: "rs-digital-portfolio.appspot.com",
  messagingSenderId: "10175685007",
  appId: "1:10175685007:web:9d7a700139626de1e8abfa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Define Admin ---
// **IMPORTANT**: This is your admin email address.
const ADMIN_EMAIL = "developer@rs-digital.my";

// --- Function to handle user registration ---
async function handleRegister(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create a document for the user in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: "client", // All new users are clients by default
            createdAt: new Date()
        });

        console.log("Registered successfully:", user);
        window.location.href = "/dashboard.html"; // Redirect to client dashboard
    } catch (error) {
        console.error("Registration Error:", error.code, error.message);
        alert(`Registration failed: ${error.message}`);
    }
}

// --- Function to handle user login ---
async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check user role and redirect accordingly
        if (user.email === ADMIN_EMAIL) {
            // It's the admin
            window.location.href = "/admin-dashboard.html";
        } else {
            // It's a regular client
            window.location.href = "/dashboard.html";
        }
        console.log("Logged in successfully:", user);

    } catch (error) {
        console.error("Login Error:", error.code, error.message);
        alert(`Login failed: ${error.message}`);
    }
}

// --- Function to handle user logout ---
async function handleLogout() {
    try {
        await signOut(auth);
        console.log("Logged out successfully");
        window.location.href = "/login.html"; // Redirect to login page after logout
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

// --- Auth State Observer ---
function checkAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in, check their role for redirection if needed
            if (window.location.pathname.includes('/login.html') || window.location.pathname.includes('/register.html')) {
                 if (user.email === ADMIN_EMAIL) {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            }
            callback(user);
        } else {
            // User is signed out.
            // If they are on a protected page, redirect to login.
            if (window.location.pathname.includes('/dashboard.html') || window.location.pathname.includes('/admin-dashboard.html')) {
                window.location.href = '/login.html';
            }
            callback(null);
        }
    });
}

// Export functions to be used in other scripts
export { auth, db, handleRegister, handleLogin, handleLogout, checkAuthState };
