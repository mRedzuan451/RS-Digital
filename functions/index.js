// functions/index.js

// Import the necessary modules for v2 functions
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { defineString } = require("firebase-functions/params");

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Define parameters for your function.
const nodemailerEmail = defineString("NODEMAILER_EMAIL");
const nodemailerPassword = defineString("NODEMAILER_PASSWORD", { secret: "nodemailer-password" });

exports.sendEmailOnSubmission = onDocumentCreated("submissions/{submissionId}", (event) => {
  // Check if data exists
  const snap = event.data;
  if (!snap) {
    logger.log("No data associated with the event");
    return;
  }
  const submissionData = snap.data();

  // --- TEMPORARY DEBUG LOGS ---
  const emailValue = nodemailerEmail.value();
  const passwordValue = nodemailerPassword.value();
  logger.log("Nodemailer Email Loaded:", emailValue); 
  logger.log("Is Nodemailer Password Loaded:", !!passwordValue, "Length:", passwordValue ? passwordValue.length : 0);
  // --- END DEBUG LOGS ---

  // Check if credentials are truly missing before proceeding
  if (!emailValue || !passwordValue) {
      logger.error("CRITICAL: Nodemailer credentials are not loaded. Check .env and Secret Manager permissions.");
      return; // Stop the function
  }

  // Set up the email transporter
  const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailValue,
      pass: passwordValue,
    },
  });

  // Define the email content
  const mailOptions = {
    from: `"RS Digital Bot" <${emailValue}>`,
    to: "developer@rs-digital.my",
    subject: `New Project Submission: ${submissionData["business-name"]}`,
    html: `
        <h1>New Project Questionnaire Submission</h1>
        <p>A new client has submitted the project questionnaire. Here are the details:</p>
        <hr>
        <p><strong>Client Email:</strong> ${submissionData.userEmail}</p>
        <p><strong>Business Name:</strong> ${submissionData["business-name"]}</p>
    `,
  };

  logger.log(`Sending email for new submission by ${submissionData.userEmail}...`);
  return mailTransport.sendMail(mailOptions)
      .then(() => logger.log("New submission email sent successfully!"))
      .catch((error) => logger.error("There was an error sending the email:", error));
});