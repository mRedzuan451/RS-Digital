const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Get your email credentials from Firebase configuration
const gmailEmail = functions.config().nodemailer.email;
const gmailPassword = functions.config().nodemailer.password;

// Set up the email transporter using nodemailer
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// The function that triggers on new submissions
exports.sendEmailOnSubmission = functions.firestore
    .document("submissions/{submissionId}")
    .onCreate((snap, context) => {
      // Get the data from the new document
      const submissionData = snap.data();

      // Define the email content
      const mailOptions = {
        from: `"RS Digital Bot" <${gmailEmail}>`,
        to: "developer@rs-digital.my", // Your developer email
        subject: `New Project Submission: ${submissionData["business-name"]}`,
        html: `
            <h1>New Project Questionnaire Submission</h1>
            <p>A new client has submitted the project questionnaire. Here are the details:</p>
            <hr>
            <h3>Client Details</h3>
            <p><strong>Client Email:</strong> ${submissionData.userEmail}</p>
            <p><strong>Business Name:</strong> ${submissionData["business-name"]}</p>
            <h3>Project Details</h3>
            <ul>
              ${Object.entries(submissionData)
        .filter(([key]) => !["userId", "userEmail", "submittedAt", "status"].includes(key))
        .map(([key, value]) => `<li><strong>${key.replace(/-/g, " ")}:</strong> ${Array.isArray(value) ? value.join(", ") : value}</li>`)
        .join("")}
            </ul>
            <hr>
            <p>You can view and manage this submission in your admin dashboard.</p>
        `,
      };

      // Send the email
      return mailTransport.sendMail(mailOptions)
          .then(() => console.log("New submission email sent successfully!"))
          .catch((error) => console.error("There was an error sending the email:", error));
    });