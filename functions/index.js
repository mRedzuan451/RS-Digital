// UPDATED: Import the new v2 function types
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Get email credentials from Firebase configuration (this part remains the same)
const gmailEmail = process.env.NODEMAILER_EMAIL;
const gmailPassword = process.env.NODEMAILER_PASSWORD;

// Set up the email transporter
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// UPDATED: This is the new v2 syntax for a Firestore trigger
exports.sendEmailOnSubmission = onDocumentCreated("submissions/{submissionId}", (event) => {
  // The data snapshot is now located in event.data
  const snap = event.data;
  if (!snap) {
    logger.log("No data associated with the event");
    return;
  }

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

  // Send the email and log the result
  logger.log(`Sending email for new submission by ${submissionData.userEmail}...`);
  return mailTransport.sendMail(mailOptions)
      .then(() => logger.log("New submission email sent successfully!"))
      .catch((error) => logger.error("There was an error sending the email:", error));
});