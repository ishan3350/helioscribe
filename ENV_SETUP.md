# Environment Variables Setup

## Required Environment Variables

### Backend (`server/.env`)

Create or update `server/.env` with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://admin:vQYxa2mbJQE4wwBcl2FM%25vezKQbISSCWFjKxOZP%40%24g*NCmIX1G%26uI1VNxmwH@188.245.251.191:27017

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development

# Email Configuration
SMTP_HOST=mail.quickcatapi.com
SMTP_PORT=587
SMTP_USER=support@helioscribe.com
SMTP_PASS=Hello@9099
EMAIL_FROM=no-reply@helioscribe.com
EMAIL_FROM_NAME=HelioScribe Team

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-
RECAPTCHA_SECRET_KEY=6LfwaSUsAAAAAFoT73s3G0yxtjsGgmH6m7Rcyl1r
RECAPTCHA_SCORE_THRESHOLD=0.5

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Verification
VERIFICATION_CODE_EXPIRE=15
```

### Frontend (`client/.env`)

Create or update `client/.env` with the following variables:

```env
# API URL
REACT_APP_API_URL=http://localhost:5000/api

# reCAPTCHA Site Key
REACT_APP_RECAPTCHA_SITE_KEY=6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-

# Google OAuth Client ID
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Quick Setup

1. **Backend Setup:**
   ```bash
   cd server
   # Create .env file if it doesn't exist
   # Copy the variables above into server/.env
   ```

2. **Frontend Setup:**
   ```bash
   cd client
   # Create .env file if it doesn't exist
   # Copy the variables above into client/.env
   ```

3. **Restart Servers:**
   ```bash
   # From project root
   npm run dev
   ```

## Verification

After setting up the environment variables, restart your servers and check the console output. You should see:

**Backend:**
- ✓ MongoDB connected
- ✓ reCAPTCHA secret key is configured
- ✓ Google OAuth Client ID is configured

**Frontend:**
- No errors in console
- Google sign-in button appears on login/register pages

## Important Notes

- **Never commit `.env` files to version control**
- The `.env` files are already in `.gitignore`
- For production, use environment variables from your hosting platform
- Keep secrets secure and rotate them regularly

## Troubleshooting

### "GOOGLE_CLIENT_ID is not configured"
- Check that `GOOGLE_CLIENT_ID` is set in `server/.env`
- Ensure there are no extra spaces or quotes around the value
- Restart the server after adding the variable

### "Google sign-in button not appearing"
- Check that `REACT_APP_GOOGLE_CLIENT_ID` is set in `client/.env`
- Ensure the variable name starts with `REACT_APP_`
- Restart the React development server

### "Invalid client" error
- Verify the Client ID matches in both `.env` files
- Check that the Client ID is correct in Google Cloud Console
- Ensure authorized origins are configured correctly

