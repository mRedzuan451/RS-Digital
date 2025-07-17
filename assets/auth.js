// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { 
    getFunctions, 
    httpsCallable 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// Your web app's Firebase configuration
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
const functions = getFunctions(app); // Initialize Firebase Functions
const storage = getStorage(app); // --- NEW: Initialize Storage ---

// --- Define Admin ---
const ADMIN_EMAIL = "developer@rs-digital.my";

// --- Function to handle user registration ---
async function handleRegister(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create a user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: "client",
            createdAt: serverTimestamp() // Use server-side timestamp
        });

        console.log("Registered successfully:", user);
        window.location.href = "/dashboard.html"; // Redirect to dashboard
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

        // Redirect based on role
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
        window.location.href = "/login.html"; // Redirect to login page
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

// --- Auth State Observer ---
function checkAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        // Define which pages are protected
        const isProtectedPage = window.location.pathname.includes('/dashboard.html') || 
                                window.location.pathname.includes('/admin-dashboard.html') ||
                                window.location.pathname.includes('/questionnaire.html');
        // Define auth pages
        const isAuthPage = window.location.pathname.includes('/login.html') || window.location.pathname.includes('/register.html');

        if (user) {
            // If user is logged in and on an auth page, redirect them
            if (isAuthPage) {
                if (user.email === ADMIN_EMAIL) {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            }
            callback(user); // Proceed with loading page-specific data
        } else {
            // If user is not logged in and tries to access a protected page, redirect
            if (isProtectedPage) {
                window.location.href = '/login.html';
            }
            callback(null);
        }
    });
}

// --- Function to submit questionnaire ---
// --- MODIFIED: Updated function to handle file upload ---
async function submitQuestionnaire(user, formData, file) {
    if (!user) throw new Error("User not authenticated");
    
    let fileUrl = '';
    let filePath = '';

    // --- Step 1: Upload the file if it exists ---
    if (file) {
        // Create a storage reference with a unique path
        filePath = `client-uploads/${user.uid}/${file.name}`;
        const storageRef = ref(storage, filePath);

        try {
            // Upload the file
            const snapshot = await uploadBytes(storageRef, file);
            // Get the public URL of the uploaded file
            fileUrl = await getDownloadURL(snapshot.ref);
            console.log('File uploaded successfully. URL:', fileUrl);
        } catch (error) {
            console.error("File Upload Error:", error);
            alert(`File upload failed: ${error.message}. Please try again.`);
            // Stop the submission if the file fails to upload
            return; 
        }
    }

    // --- Step 2: Prepare the data for Firestore ---
    const submissionData = {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        status: "Under Review",
        submittedAt: serverTimestamp(),
        // Add file information to the submission data
        uploadedFileUrl: fileUrl, 
        uploadedFilePath: filePath
    };

    // --- Step 3: Save the submission data to Firestore ---
    try {
        await setDoc(doc(db, "submissions", user.uid), submissionData);
        console.log("Questionnaire submitted successfully!");
        window.location.href = "/dashboard.html";
    } catch (error) {
        console.error("Error submitting questionnaire:", error);
        alert(`Error: ${error.message}`);
    }
}

// --- Function to get a user's project data ---
async function getUserProject(userId) {
    if (!userId) return null;
    
    const projectDocRef = doc(db, "submissions", userId);
    const projectDocSnap = await getDoc(projectDocRef);

    return projectDocSnap.exists() ? projectDocSnap.data() : null;
}

// --- Function for Admin to get all submissions ---
async function getAllSubmissions() {
    const submissionsCol = collection(db, "submissions");
    const snapshot = await getDocs(submissionsCol);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// --- Function for Admin to update project status ---
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

// --- Function to delete a submission ---
async function deleteSubmission(submissionId) {
    try {
        await deleteDoc(doc(db, "submissions", submissionId));
        console.log(`Submission ${submissionId} deleted successfully.`);
        return true;
    } catch (err) {
        console.error("Failed to delete submission:", err);
        return false;
    }
}

async function getUserInfo(userId) {
    if (!userId) throw new Error("User ID is required.");
    
    const getUserInfoFunction = httpsCallable(functions, 'getUserInfo');
    try {
        const result = await getUserInfoFunction({ userId: userId });
        return result.data;
    } catch (error) {
        console.error("Error fetching user info:", error);
        return null; // Return null on error to handle it gracefully
    }
}

async function handlePasswordReset(email) {
    const auth = getAuth();
    console.log("Attempting to send password reset email to:", email); // <-- Add this

    try {
        await sendPasswordResetEmail(auth, email);
        console.log("Firebase function sendPasswordResetEmail was called successfully."); // <-- Add this
        alert('Password reset email sent! Please check your inbox (and spam folder).');
        window.location.href = "/login.html";
    } catch (error) {
        console.error("Password Reset Error:", error); // <-- This will show any errors from Firebase
        alert(`Error sending password reset email: ${error.message}`);
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
    deleteSubmission,
    getUserInfo,
    handlePasswordReset, 
    // Export Firebase Functions utilities
    httpsCallable,
    // RENAMED for clarity to avoid conflict with 'functions' variable
    getFunctions as getFirebaseFunctions
};