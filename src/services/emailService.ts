import nodemailer from 'nodemailer';

let transporter: any = null;

const getTransporter = () => {
  if (!transporter) {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || '587');

    if (!user || !pass) {
      console.warn('⚠️ Email credentials not fully configured. Notifications will be logged to console instead.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  const mailTransporter = getTransporter();
  
  if (!mailTransporter) {
    console.log('--- EMAIL MOCK ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log('-------------------');
    return;
  }

  try {
    await mailTransporter.sendMail({
      from: `"CoopTrust v2" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
  }
};

export const sendWelcomeEmail = async (email: string, name: string, tempPass: string) => {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  await sendEmail({
    to: email,
    subject: 'Welcome to CoopTrust v2 - Account Provisioned',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h1 style="color: #6366f1;">Welcome to the Cooperative, ${name}!</h1>
        <p>Your membership account has been generated successfully.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin-top: 0;"><strong>Temporary Access Token:</strong> <code>${tempPass}</code></p>
          <p style="margin-bottom: 0;">Please use the link below to access the repository and rotate your credentials immediately.</p>
        </div>
        <a href="${appUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Repository</a>
        <p style="margin-top: 20px; font-size: 12px; color: #64748b;">This is an automated institutional notification.</p>
      </div>
    `
  });
};

export const sendLoanStatusUpdate = async (email: string, name: string, loanId: string, status: string, comment: string) => {
  await sendEmail({
    to: email,
    subject: `Loan Application Update: ${status}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #6366f1;">Loan Application Status: ${status}</h2>
        <p>Hello ${name},</p>
        <p>The status of your loan application (Ref: ${loanId}) has been updated.</p>
        <div style="border-left: 4px solid #6366f1; padding-left: 15px; margin: 20px 0;">
          <p><strong>Current Status:</strong> ${status}</p>
          ${comment ? `<p><strong>Administrator Note:</strong> ${comment}</p>` : ''}
        </div>
        <p>Please log in to your dashboard for more details.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Institutional Loan Management System - CoopTrust v2</p>
      </div>
    `
  });
};
