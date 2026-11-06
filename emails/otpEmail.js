/**
 * Nexus Branded OTP Email Template Builder
 * Generates responsive inline-styled HTML and plain-text alternatives.
 */

function buildOtpEmail({ to, code, purpose, ttlMinutes = 10 }) {
  let subject = 'Your Nexus verification code';
  let title = 'Verification Code';
  let description = 'Use the 6-digit code below to complete verification.';

  switch (purpose) {
    case 'register':
      subject = 'Verify your email for Nexus';
      title = 'Verify your email';
      description = 'Thank you for registering your organization on Nexus. Enter this code to verify your corporate administrator account:';
      break;
    case 'reset':
      subject = 'Reset your Nexus password';
      title = 'Reset your password';
      description = 'We received a request to reset your password for your Nexus account. Enter this code to proceed:';
      break;
    case 'login':
      subject = 'Your Nexus sign-in code';
      title = 'Sign-in verification code';
      description = 'A sign-in attempt requires two-step verification. Enter this code to sign in:';
      break;
  }

  const plainText = [
    `Nexus - ${title}`,
    '',
    description,
    '',
    `Verification Code: ${code}`,
    '',
    `This code expires in ${ttlMinutes} minutes.`,
    "If you didn't request this, you can safely ignore this email.",
    '',
    '© 2026 Nexus Workspace. All rights reserved.'
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #f6f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #14123d; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e4e2fd; box-shadow: 0 4px 16px rgba(20, 18, 61, 0.05); overflow: hidden;">
    <!-- Brand Header -->
    <tr>
      <td style="background-color: #3b2fd9; padding: 24px 32px; text-align: left;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle;">
              <span style="display: inline-block; width: 34px; height: 34px; line-height: 34px; text-align: center; background-color: #ffffff; color: #3b2fd9; font-weight: 800; font-size: 20px; border-radius: 10px; font-family: 'Space Grotesk', -apple-system, sans-serif;">N</span>
            </td>
            <td style="vertical-align: middle; padding-left: 12px;">
              <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; font-family: 'Space Grotesk', -apple-system, sans-serif;">Nexus</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Card Body -->
    <tr>
      <td style="padding: 32px 32px 24px 32px;">
        <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #14123d; letter-spacing: -0.01em;">${title}</h1>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; color: #475569;">${description}</p>

        <!-- Monospace OTP Block -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0;">
          <tr>
            <td style="background-color: #f1f0fe; border: 1px solid #cac6fb; border-radius: 12px; padding: 18px 24px; text-align: center;">
              <span style="font-family: 'SF Mono', Monaco, Menlo, 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 0.35em; color: #3b2fd9; display: inline-block; margin-right: -0.35em;">${code}</span>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; color: #64748b; font-weight: 500;">
          ⏱ This code expires in <strong>${ttlMinutes} minutes</strong>.
        </p>
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #fafafc; border-top: 1px solid #f1f0fe; padding: 16px 32px; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
          Nexus Collaborative Workspace &bull; Authorized Personnel Only
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text: plainText };
}

module.exports = {
  buildOtpEmail
};

