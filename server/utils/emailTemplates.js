const getVerificationEmailTemplate = (firstName, verificationCode) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - HelioScribe</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
            margin: 0;
            letter-spacing: -0.5px;
        }
        .email-body {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .message {
            font-size: 16px;
            color: #4a4a4a;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .verification-code-container {
            background: #ffffff;
            border: 2px solid #1a73e8;
            border-radius: 12px;
            padding: 40px 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 2px 8px rgba(26, 115, 232, 0.15);
        }
        .verification-code {
            font-size: 42px;
            font-weight: 600;
            color: #1a73e8;
            letter-spacing: 12px;
            font-family: 'Courier New', monospace;
            margin: 20px 0;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            display: inline-block;
            min-width: 280px;
            border: 1px solid #e8eaed;
        }
        .code-label {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .expiry-notice {
            font-size: 14px;
            color: #888;
            margin-top: 20px;
            font-style: italic;
        }
        .instructions {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .instructions h3 {
            color: #1a1a1a;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .instructions ol {
            margin-left: 20px;
            color: #4a4a4a;
        }
        .instructions li {
            margin-bottom: 8px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        .footer p {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .security-notice {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #856404;
        }
        .button {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>HelioScribe</h1>
        </div>
        <div class="email-body">
            <div class="greeting">Hello ${firstName},</div>
            <div class="message">
                Thank you for registering with HelioScribe! We're excited to have you on board.
                To complete your registration and secure your account, please verify your email address.
            </div>
            
            <div class="verification-code-container">
                <div class="code-label">Your Verification Code</div>
                <div class="verification-code">${verificationCode}</div>
                <div class="expiry-notice">This code will expire in 15 minutes</div>
            </div>

            <div class="instructions">
                <h3>How to verify your email:</h3>
                <ol>
                    <li>Return to the HelioScribe application</li>
                    <li>Enter the verification code shown above</li>
                    <li>Click "Verify Email" to complete your registration</li>
                </ol>
            </div>

            <div class="security-notice">
                <strong>Security Notice:</strong> If you didn't create an account with HelioScribe, please ignore this email. 
                Never share your verification code with anyone.
            </div>

            <div class="message">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
            </div>
        </div>
        <div class="footer">
            <p><strong>HelioScribe Team</strong></p>
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} HelioScribe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
};

module.exports = {
  getVerificationEmailTemplate
};

