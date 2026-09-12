const nodemailer = require("nodemailer");

function getMailTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SERVICE } = process.env;

  if ((!SMTP_HOST && !SMTP_SERVICE) || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    ...(SMTP_SERVICE
      ? { service: SMTP_SERVICE }
      : {
          host: SMTP_HOST,
          port: Number(SMTP_PORT || 587),
          secure: Number(SMTP_PORT) === 465,
        }),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendPasswordOtpEmail({ to, code }) {
  const transporter = getMailTransporter();
  if (!transporter) {
    const error = new Error("Email delivery is not configured. Set SMTP_SERVICE (for example, Gmail), SMTP_USER, and SMTP_PASS in backend/.env.");
    error.code = "MAIL_NOT_CONFIGURED";
    throw error;
  }

  await transporter.verify();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "CIT Scheduler password-change code",
    text: `Your CIT Scheduler password-change code is ${code}. It expires in 1 minute. If you did not request this code, you can safely ignore this email.`,
  });
}

async function sendLoginOtpEmail({ to, code }) {
  const transporter = getMailTransporter();
  if (!transporter) {
    const error = new Error("Email delivery is not configured. Set SMTP_SERVICE, SMTP_USER, and SMTP_PASS in backend/.env.");
    error.code = "MAIL_NOT_CONFIGURED";
    throw error;
  }

  await transporter.verify();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "CIT Scheduler login verification code",
    text: `Your CIT Scheduler login verification code is ${code}. It expires in 5 minutes. If you did not try to log in, you can safely ignore this email.`,
  });
}

async function sendTwoFactorEnabledEmail({ to }) {
  const transporter = getMailTransporter();
  if (!transporter) {
    const error = new Error("Email delivery is not configured. Set SMTP_SERVICE, SMTP_USER, and SMTP_PASS in backend/.env.");
    error.code = "MAIL_NOT_CONFIGURED";
    throw error;
  }

  await transporter.verify();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "CIT Scheduler email verification enabled",
    text: "Email verification is now enabled for your CIT Scheduler account. A verification code will be sent to this address each time you log in. If you did not make this change, contact your administrator.",
  });
}

module.exports = { sendPasswordOtpEmail, sendLoginOtpEmail, sendTwoFactorEnabledEmail };
