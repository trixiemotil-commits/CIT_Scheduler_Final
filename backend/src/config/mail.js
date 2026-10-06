const { Resend } = require('resend');

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = 'CIT Scheduler <noreply@citscheduler.com>';

async function sendMail({ to, subject, text, html }) {
  const resend = getResendClient();
  if (!resend) {
    const error = new Error('Email delivery is not configured. Set RESEND_API_KEY in backend/.env.');
    error.code = 'MAIL_NOT_CONFIGURED';
    throw error;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, text, ...(html ? { html } : {}) });
  if (error) throw new Error(error.message);
}

async function sendPasswordOtpEmail({ to, code }) {
  await sendMail({
    to,
    subject: 'CIT Scheduler password-change code',
    text: `Your CIT Scheduler password-change code is ${code}. It expires in 5 minutes. If you did not request this code, you can safely ignore this email.`,
  });
}

async function sendLoginOtpEmail({ to, code }) {
  await sendMail({
    to,
    subject: 'CIT Scheduler login verification code',
    text: `Your CIT Scheduler login verification code is ${code}. It expires in 5 minutes. If you did not try to log in, you can safely ignore this email.`,
  });
}

async function sendTwoFactorEnabledEmail({ to }) {
  await sendMail({
    to,
    subject: 'CIT Scheduler email verification enabled',
    text: 'Email verification is now enabled for your CIT Scheduler account. A verification code will be sent to this address each time you log in. If you did not make this change, contact your administrator.',
  });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function sendNewDeviceLoginEmail({ to, device, location, ipAddress, occurredAt, trustUrl, reportUrl }) {
  const time = new Date(occurredAt).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "UTC",
  });
  const safeDevice = escapeHtml(device);
  const safeLocation = escapeHtml(location);
  const safeIpAddress = escapeHtml(ipAddress || "Unavailable");
  const safeTime = escapeHtml(`${time} (UTC)`);
  await sendMail({
    to,
    subject: "New device signed in to your CIT Scheduler account",
    text: `A new device signed in to your CIT Scheduler account.\n\nDevice: ${device}\nApproximate location: ${location}\nIP address: ${ipAddress || "Unavailable"}\nTime: ${time} (UTC)\n\nIf this was you, confirm here: ${trustUrl}\nIf this wasn't you, secure your account here: ${reportUrl}\n\nThese links expire in 15 minutes and can only be used once.`,
    html: `<div style="font-family:Arial,sans-serif;color:#202a32;max-width:560px;margin:0 auto;line-height:1.55"><h1 style="font-size:22px">New device sign-in</h1><p>A new device signed in to your CIT Scheduler account.</p><table style="border-collapse:collapse;width:100%;margin:20px 0"><tr><td style="padding:7px 0;color:#65717a">Device</td><td style="padding:7px 0">${safeDevice}</td></tr><tr><td style="padding:7px 0;color:#65717a">Approximate location</td><td style="padding:7px 0">${safeLocation}</td></tr><tr><td style="padding:7px 0;color:#65717a">IP address</td><td style="padding:7px 0">${safeIpAddress}</td></tr><tr><td style="padding:7px 0;color:#65717a">Time</td><td style="padding:7px 0">${safeTime}</td></tr></table><p><a href="${escapeHtml(trustUrl)}" style="display:inline-block;padding:12px 18px;margin:0 8px 8px 0;background:#176b55;color:#fff;text-decoration:none;border-radius:4px">It was me</a><a href="${escapeHtml(reportUrl)}" style="display:inline-block;padding:12px 18px;margin:0 0 8px;background:#a33434;color:#fff;text-decoration:none;border-radius:4px">It wasn't me</a></p><p style="font-size:13px;color:#65717a">Links expire in 15 minutes and can only be used once. Opening a link will not change your account until you confirm on the next page.</p></div>`,
  });
}

async function sendConsultationApprovedEmail({ to, studentName, subject, consultationDate, startTime, endTime }) {
  await sendMail({
    to,
    subject: 'CIT Scheduler consultation approved',
    text: `Hello ${studentName || 'Student'},\n\nYour consultation request${subject ? ` for ${subject}` : ''} has been approved.\n\nDate: ${consultationDate || 'To be confirmed'}\nTime: ${startTime || 'To be confirmed'}${endTime ? ` - ${endTime}` : ''}\n\nPlease log in to CIT Scheduler for more details.`,
  });
}

async function sendAccountApprovedEmail({ to, firstName }) {
  await sendMail({
    to,
    subject: 'CIT Scheduler account approved',
    text: `Hello ${firstName || 'Student'},\n\nYour CIT Scheduler account has been approved by an administrator. You can now log in using your registered email address and password.`,
  });
}

module.exports = {
  sendPasswordOtpEmail,
  sendLoginOtpEmail,
  sendTwoFactorEnabledEmail,
  sendNewDeviceLoginEmail,
  sendConsultationApprovedEmail,
  sendAccountApprovedEmail,
};