const admin = require('firebase-admin');

// IMPORTANT: Make sure this path is correct.
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testFirestoreWrite() {
  // IMPORTANT: Replace with a real user ID from your 'submissions' collection.
  // You can copy this from the Firestore console view in your last screenshot.
  const userId = 'XtvwsEJPcTNgFdak4WjcO2WQZhL2'; 
  
  const docRef = db.collection('submissions').doc(userId);

  const sampleFiles = [
    { fileName: 'test-from-server.jpg', path: `client-uploads/${userId}/test-from-server.jpg`, url: 'http://example.com/server-test' }
  ];

  try {
    console.log(`Attempting to update document: ${docRef.path}`);
    
    // We will use the 'update' command with a special 'arrayUnion' value.
    // This is what the client-side code tries to do.
    await docRef.update({
      uploadedFiles: admin.firestore.FieldValue.arrayUnion(...sampleFiles)
    });

    console.log('✅ SUCCESS: The Firestore document was updated successfully from the server!');

  } catch (error) {
    console.error('❌ ERROR: The direct server-side write failed.');
    console.error(error);
  }
}

testFirestoreWrite();