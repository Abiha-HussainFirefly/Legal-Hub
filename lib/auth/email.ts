const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Legal Hub';
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL  ?? 'http://localhost:3000';

// Interfaces //

interface PasswordResetEmailInput {
  to:     string;
  name:   string;
  token:  string;
  portal?: string; 
}

interface SendEmailInput {
  to:      string;
  subject: string;
  html:    string;
  text:    string;
}

//verification code email//

export async function sendVerificationCode({
  to,
  name,
  code,
}: { to: string; name: string; code: string }): Promise<void> {
  console.log("\n" + "=".repeat(40));
  console.log("VERIFICATION CODE");
  console.log(`Email: ${to}`);
  console.log(`Code:  ${code}`);
  console.log("=".repeat(40) + "\n");

  await sendEmail({
    to,
    subject: `${code} is your ${APP_NAME} verification code`,
    html:    buildVerificationHtml({ name, code }),
    text:    buildVerificationText({ name, code }),
  });
}

//password reset email//

export async function sendPasswordResetEmail({
  to,
  name,
  token,
  portal = 'lawyer', 
}: PasswordResetEmailInput): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}&portal=${portal}`; 

  await sendEmail({
    to,
    subject: `Reset your ${APP_NAME} password`,
    html:    buildPasswordResetHtml({ name, resetUrl }),
    text:    buildPasswordResetText({ name, resetUrl }),
  });
}

//  Core send function //
async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const emailFrom = process.env.EMAIL_FROM;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailFrom || !emailPassword) {
    console.log('\n──────── EMAIL (dev) ────────');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text}`);
    console.log('────────────────────────────\n');
    return;
  }

  // Production: send via Gmail + Nodemailer
  const nodemailer = await import('nodemailer');

  const transporter = nodemailer.default.createTransport({
    service: 'gmail',
    auth: {
      user: emailFrom,
      pass: emailPassword,
    },
  });

  await transporter.sendMail({
    from: `"${APP_NAME}" <${emailFrom}>`,
    to,
    subject,
    html,
    text,
  });
}

// Verification email templates //

function buildVerificationHtml({ name, code }: { name: string; code: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f7">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <tr><td style="background:linear-gradient(135deg,#4C2F5E,#9F63C4);padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">${APP_NAME}</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="margin:0 0 16px;font-size:16px;color:#374151">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
            Thanks for joining ${APP_NAME}. Please use the code below to verify your email address.
          </p>
          <div style="text-align:center;margin-bottom:32px">
            <div style="display:inline-block;padding:16px 32px;background:#f8f4ff;color:#9F63C4;font-size:32px;font-weight:700;letter-spacing:8px;border:2px dashed #9F63C4;border-radius:12px">
              ${code}
            </div>
          </div>
          <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center">This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="margin:0;font-size:12px;color:#d1d5db">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildVerificationText({ name, code }: { name: string; code: string }): string {
  return `Hi ${name},

Your ${APP_NAME} verification code is: ${code}

This code expires in 10 minutes. If you didn't sign up, ignore this email.

— The ${APP_NAME} Team`;
}

// Password reset email templates //

function buildPasswordResetHtml({ name, resetUrl }: { name: string; resetUrl: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f7">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <tr><td style="background:linear-gradient(135deg,#4C2F5E,#9F63C4);padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">${APP_NAME}</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="margin:0 0 16px;font-size:16px;color:#374151">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
            We received a request to reset the password for your ${APP_NAME} account.
            Click the button below to choose a new password.
          </p>
          <div style="text-align:center;margin-bottom:32px">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#9F63C4;color:#fff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px">
              Reset Password
            </a>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#9ca3af">Or copy this link into your browser:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#9F63C4;word-break:break-all">${resetUrl}</p>
          <p style="margin:0 0 12px;font-size:13px;color:#9ca3af">This link expires in <strong>1 hour</strong>.</p>
          <p style="margin:0;font-size:13px;color:#9ca3af">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="margin:0;font-size:12px;color:#d1d5db">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPasswordResetText({ name, resetUrl }: { name: string; resetUrl: string }): string {
  return `Hi ${name},

Reset your ${APP_NAME} password by clicking the link below:

${resetUrl}

This link expires in 1 hour. If you didn't request this, ignore this email. Your password will not be changed.

— The ${APP_NAME} Team`;
}
