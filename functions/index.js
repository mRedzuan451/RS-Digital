// functions/index.js

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { defineString } = require("firebase-functions/params");

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const functions = require('firebase-functions');

admin.initializeApp();

// Define parameters for your function.
// Make sure you have set these in your Firebase project environment:
// firebase functions:config:set nodemailer.email="your-gmail-address@gmail.com"
// firebase functions:config:set nodemailer.password="your-gmail-app-password"
const nodemailerEmail = defineString("NODEMAILER_EMAIL");
const nodemailerPassword = defineString("NODEMAILER_PASSWORD", { secret: "nodemailer-password" });

// Helper function to format the form data into a readable HTML table
function formatDataToHtml(data) {
    let html = `
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            table { border-collapse: collapse; width: 100%; max-width: 600px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            h1 { color: #0a192f; }
            p { font-size: 16px; }
        </style>
        <h1>New Project Questionnaire Submission</h1>
        <p>A new client has submitted the project questionnaire. Here are the details:</p>
        <table>
            <tbody>
    `;

    // A more user-friendly mapping of form keys to labels
    const prettyLabels = {
        "userEmail": "Client Email",
        "site-type": "Website Type",
        "business-name": "Business Name",
        "business-desc": "Business Description",
        "audience": "Target Audience",
        "goal": "Main Goal",
        "competitors": "Competitors / Inspirations",
        "lp-headline": "Landing Page Headline",
        "lp-action": "Landing Page Call to Action",
        "lp-sections": "Landing Page Sections",
        "sb-pages": "Small Business Pages",
        "sb-services": "Featured Services",
        "cms-needed": "CMS / Blog Needed?",
        "style": "Desired Style",
        "branding": "Logo & Branding",
        "content": "Content & Images",
        "budget": "Approximate Budget",
        "deadline": "Deadline"
    };

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const label = prettyLabels[key] || key;
            const value = Array.isArray(data[key]) ? data[key].join(', ') : data[key];
            if (value) { // Only add rows that have a value
                 html += `<tr><th>${label}</th><td>${value}</td></tr>`;
            }
        }
    }

    html += `
            </tbody>
        </table>
    `;
    return html;
}


exports.sendEmailOnSubmission = onDocumentCreated("submissions/{submissionId}", (event) => {
  const snap = event.data;
  if (!snap) {
    logger.log("No data associated with the event");
    return;
  }
  const submissionData = snap.data();
  
  const emailValue = nodemailerEmail.value();
  const passwordValue = nodemailerPassword.value();

  if (!emailValue || !passwordValue) {
      logger.error("CRITICAL: Nodemailer credentials are not loaded. Check environment configuration and Secret Manager permissions.");
      return;
  }

  // Set up the email transporter
  const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailValue,
      pass: passwordValue, // IMPORTANT: Use an App Password for Gmail
    },
  });

  // Define the email content
  const mailOptions = {
    from: `"RS Digital Bot" <${emailValue}>`,
    to: "developer@rs-digital.my", // The email address you want to receive notifications
    subject: `New Project Submission: ${submissionData["business-name"] || 'Unknown Business'}`,
    html: formatDataToHtml(submissionData), // Use the helper function here
  };

  logger.log(`Sending email for new submission by ${submissionData.userEmail}...`);
  return mailTransport.sendMail(mailOptions)
      .then(() => logger.log(`New submission email sent successfully to ${mailOptions.to}!`))
      .catch((error) => logger.error("There was an error sending the email:", error));
});

exports.getPersonalInfo = functions.https.onRequest(async (req, res) => {
  try {
    const userId = req.body.userId;
    const db = admin.firestore();
    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists) {
      res.status(200).json(null); // Or send an empty object: {}
      return;
    }

    res.status(200).json(doc.data());
  } catch (error) {
    console.error("Error getting personal info:", error);
    res.status(500).send(error);
  }
});

exports.savePersonalInfo = functions.https.onRequest(async (req, res) => {
  try {
    const userId = req.body.userId;
    const fullName = req.body.fullName;
    const address = req.body.address;
    const phone = req.body.phone;

    const db = admin.firestore();
    await db.collection('users').doc(userId).set({
      fullName,
      address,
      phone
    });
    res.status(200).json({ message: 'Personal info saved successfully' });
  } catch (error) {
    console.error("Error saving personal info:", error);
    res.status(500).send(error);
  }
});