// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

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

// --- Function to handle user registration ---
async function handleRegister(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Signed in 
        const user = userCredential.user;
        console.log("Registered successfully:", user);
        window.location.href = "/dashboard.html"; // Redirect to dashboard after registration
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Registration Error:", errorCode, errorMessage);
        alert(`Registration failed: ${errorMessage}`);
    }
}

// --- Function to handle user login ---
async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Signed in 
        const user = userCredential.user;
        console.log("Logged in successfully:", user);
        window.location.href = "/dashboard.html"; // Redirect to dashboard after login
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Login Error:", errorCode, errorMessage);
        alert(`Login failed: ${errorMessage}`);
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
// This function checks the user's login state on every page load
function checkAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        callback(user);
    });
}

// Export functions to be used in other scripts
export { auth, handleRegister, handleLogin, handleLogout, checkAuthState };
