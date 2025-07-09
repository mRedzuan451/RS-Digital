// UPDATED: We now import 'config' directly to avoid conflicts
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger, config } = require("firebase-functions");

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// This part now uses the directly imported 'config'
const gmailEmail = config().nodemailer.email;
const gmailPassword = config().nodemailer.password;

const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

exports.sendEmailOnSubmission = onDocumentCreated("submissions/{submissionId}", (event) => {
  const snap = event.data;
  if (!snap) {
    logger.log("No data associated with the event");
    return;
  }

  const submissionData = snap.data();

  const mailOptions = {
    from: `"RS Digital Bot" <${gmailEmail}>`,
    to: "developer@rs-digital.my",
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

  logger.log(`Sending email for new submission by ${submissionData.userEmail}...`);
  return mailTransport.sendMail(mailOptions)
      .then(() => logger.log("New submission email sent successfully!"))
      .catch((error) => logger.error("There was an error sending the email:", error));
});