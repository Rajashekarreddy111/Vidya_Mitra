// Brevo email API configuration and sender defaults
const axios = require("axios");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const brevoSender = {
  email: process.env.BREVO_SENDER_EMAIL,
  name: process.env.BREVO_SENDER_NAME || "VidyaMitra",
};

const sendBrevoEmail = async ({ to, subject, htmlContent }) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is required");
  }
  if (!brevoSender.email) {
    throw new Error("BREVO_SENDER_EMAIL is required");
  }

  try {
    await axios.post(
      BREVO_API_URL,
      {
        sender: brevoSender,
        to: [{ email: to }],
        subject,
        htmlContent,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        timeout: 15000,
      }
    );
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      const authError = new Error("Email service authentication failed. Check Brevo API key and sender verification.");
      authError.statusCode = 502;
      throw authError;
    }
    throw error;
  }
};

module.exports = { sendBrevoEmail };
