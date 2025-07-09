// Import the necessary modules for v2 functions
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { defineString } = require("firebase-functions/params");

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Define parameters for your function.
// The email will be loaded from a .env file, and the password from Secret Manager.
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

  // Set up the email transporter using the new parameters
  // We call .value() to get the actual string values
  const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: nodemailerEmail.value(),
      pass: nodemailerPassword.value(),
    },
  });

  // Define the email content
  const mailOptions = {
    from: `"RS Digital Bot" <${nodemailerEmail.value()}>`,
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