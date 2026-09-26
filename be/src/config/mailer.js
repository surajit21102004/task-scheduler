import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'swapanmandalrishra@gmail.com',
    pass: process.env.EMAIL_PASS || 'gkvo htyw abyp bbmf',
  },
});

/**
 * Send Employee Invitation Email
 */
export const sendInvitationEmail = async ({
  toEmail,
  employeeName,
  companyName,
  positionTitle,
  departmentName,
  reportingManagerName,
  invitationToken,
}) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const joinUrl = `${frontendUrl}/join?token=${invitationToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
        .content { padding: 30px; color: #334155; line-height: 1.6; }
        .badge-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
        .badge-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; }
        .badge-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .badge-label { color: #64748b; font-size: 14px; font-weight: 500; }
        .badge-value { color: #0f172a; font-size: 14px; font-weight: 600; }
        .btn-container { text-align: center; margin: 30px 0 20px 0; }
        .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Join ${companyName} on TaskFlow</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${employeeName}</strong>,</p>
          <p>You have been invited to join <strong>${companyName}</strong>'s workspace on TaskFlow Management Platform!</p>
          
          <div class="badge-card">
            <div class="badge-row">
              <span class="badge-label">Company:</span>
              <span class="badge-value">${companyName}</span>
            </div>
            <div class="badge-row">
              <span class="badge-label">Position:</span>
              <span class="badge-value">${positionTitle || 'Team Member'}</span>
            </div>
            <div class="badge-row">
              <span class="badge-label">Department:</span>
              <span class="badge-value">${departmentName || 'General'}</span>
            </div>
            <div class="badge-row">
              <span class="badge-label">Reporting Manager:</span>
              <span class="badge-value">${reportingManagerName || 'N/A'}</span>
            </div>
          </div>

          <p>Click the button below to accept your invitation, create your password, and access your dashboard.</p>

          <div class="btn-container">
            <a href="${joinUrl}" class="btn">Accept Invitation & Join Team</a>
          </div>

          <p style="font-size: 13px; color: #64748b;">Or copy & paste this link into your browser:<br>
          <a href="${joinUrl}" style="color: #4f46e5;">${joinUrl}</a></p>
        </div>
        <div class="footer">
          <p>If you were not expecting this invitation, you can safely ignore this email.</p>
          <p>&copy; ${new Date().getFullYear()} TaskFlow Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"TaskFlow Workspace" <${process.env.EMAIL_USER || 'swapanmandalrishra@gmail.com'}>`,
    to: toEmail,
    subject: `Invitation to join ${companyName} on TaskFlow`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Invitation email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send invitation email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default transporter;
