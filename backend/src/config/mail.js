const { Resend } = require('resend');

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = 'CIT Scheduler <noreply@citscheduler.com>';

async function sendMail({ to, subject, text }) {
  const resend = getResendClient();
  if (!resend) {
    const error = new Error('Email delivery is not configured. Set RESEND_API_KEY in backend/.env.');
    error.code = 'MAIL_NOT_CONFIGURED';
    throw error;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, text });
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
  sendConsultationApprovedEmail,
  sendAccountApprovedEmail,
};