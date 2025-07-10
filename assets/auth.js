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
    getDoc,
    collection,
    getDocs,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from './firebase-config.js'; // adjust import as needed

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
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (user.email === ADMIN_EMAIL) {
            window.location.href = "/admin-dashboard.html";
        } else {
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
        const isProtectedPage = window.location.pathname.includes('/dashboard.html') || 
                                window.location.pathname.includes('/admin-dashboard.html') ||
                                window.location.pathname.includes('/questionnaire.html');
        const isAuthPage = window.location.pathname.includes('/login.html') || window.location.pathname.includes('/register.html');

        if (user) {
            // User is logged in
            if (isAuthPage) {
                // If on login/register page, redirect away
                if (user.email === ADMIN_EMAIL) {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            }
            callback(user);
        } else {
            // User is signed out
            if (isProtectedPage) {
                // If on a protected page, redirect to login
                window.location.href = '/login.html';
            }
            callback(null);
        }
    });
}

// --- NEW: Function to submit questionnaire ---
async function submitQuestionnaire(user, formData) {
    if (!user) throw new Error("User not authenticated");
    
    const submissionData = {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        status: "Under Review", // Initial status
        submittedAt: serverTimestamp() // Use server time
    };

    try {
        await setDoc(doc(db, "submissions", user.uid), submissionData);
        console.log("Questionnaire submitted successfully!");
        window.location.href = "/dashboard.html"; // Redirect to dashboard to see status
    } catch (error) {
        console.error("Error submitting questionnaire:", error);
        alert(`Error: ${error.message}`);
    }
}

// --- NEW: Function to get a user's project data ---
async function getUserProject(userId) {
    if (!userId) return null;
    
    const projectDocRef = doc(db, "submissions", userId);
    const projectDocSnap = await getDoc(projectDocRef);

    if (projectDocSnap.exists()) {
        return projectDocSnap.data();
    } else {
        return null; // No project found for this user
    }
}

// --- NEW: Function for Admin to get all submissions ---
async function getAllSubmissions() {
    const submissionsCol = collection(db, "submissions");
    const snapshot = await getDocs(submissionsCol);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// --- NEW: Function for Admin to update project status ---
async function updateProjectStatus(userId, newStatus) {
    if (!userId || !newStatus) throw new Error("User ID and new status are required.");
    
    const projectDocRef = doc(db, "submissions", userId);
    try {
        await updateDoc(projectDocRef, {
            status: newStatus
        });
        console.log(`Status updated for user ${userId} to ${newStatus}`);
        return true;
    } catch (error) {
        console.error("Error updating status:", error);
        return false;
    }
}

export async function deleteSubmission(submissionId) {
    try {
        await deleteDoc(doc(db, "submissions", submissionId));
        return true;
    } catch (err) {
        console.error("Failed to delete submission:", err);
        return false;
    }
}


// Export all functions
export { 
    auth, 
    db, 
    handleRegister, 
    handleLogin, 
    handleLogout, 
    checkAuthState,
    submitQuestionnaire,
    getUserProject,
    getAllSubmissions,
    updateProjectStatus,
    deleteSubmission
};