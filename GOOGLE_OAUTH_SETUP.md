# Google OAuth Setup Guide

This guide will help you set up Google OAuth for registration and login in HelioScribe.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to Google Cloud Console

## Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: HelioScribe
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes:
     - `email`
     - `profile`
     - `openid`
   - Add test users (for development)
   - Save and continue

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: HelioScribe Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Click **Create**

7. Copy the **Client ID** (you'll need this)

## Step 2: Configure Environment Variables

### Backend (`server/.env`)

Add the following:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

### Frontend (`client/.env`)

Create or update `.env` file:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

**Note:** The Client ID is the same for both frontend and backend.

## Step 3: Restart the Application

After adding the environment variables, restart both servers:

```bash
# Stop current servers (Ctrl+C)
# Then restart
npm run dev
```

## Step 4: Test Google OAuth

1. Navigate to the login or register page
2. Click the "Sign in with Google" or "Sign up with Google" button
3. Select your Google account
4. Grant permissions
5. You should be redirected to the dashboard

## Features

### Registration with Google
- Automatically creates account with Google profile information
- Email is pre-verified (Google emails are verified)
- Captures IP address and device fingerprint
- No password required

### Login with Google
- Seamless authentication
- Updates last login timestamp
- Captures IP address and device fingerprint

### Security
- IP address is captured and stored
- Device fingerprint is captured and stored
- Google ID token is verified server-side
- Only verified Google emails are accepted

## Troubleshooting

### "Google sign-in failed"
- Check that `REACT_APP_GOOGLE_CLIENT_ID` is set in `client/.env`
- Verify the Client ID matches in Google Cloud Console
- Ensure authorized origins include your domain

### "Failed to verify Google token"
- Check that `GOOGLE_CLIENT_ID` is set in `server/.env`
- Verify the Client ID matches the frontend
- Check server logs for detailed error messages

### Button not appearing
- Ensure `@react-oauth/google` is installed: `npm install @react-oauth/google`
- Check browser console for errors
- Verify `GoogleOAuthProvider` wraps your app in `App.js`

### "Invalid client"
- Ensure the Client ID is correct
- Check that authorized origins match your current URL
- For localhost, use `http://localhost:3000` (not `https://`)

## Production Deployment

1. Update authorized origins in Google Cloud Console:
   - Add your production domain
   - Remove localhost origins (optional, but recommended)

2. Update environment variables:
   - Set `REACT_APP_GOOGLE_CLIENT_ID` in production
   - Set `GOOGLE_CLIENT_ID` in production server

3. Ensure HTTPS is enabled (required for production OAuth)

## Support

For issues or questions, check:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- Server logs for detailed error messages
- Browser console for client-side errors


