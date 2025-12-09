# Fix Google OAuth 403 Error - "Origin not allowed"

## The Problem

You're seeing these errors in the browser console:
- `Failed to load resource: the server responded with a status of 403`
- `[GSI_LOGGER]: The given origin is not allowed for the given client ID`

This happens because `http://localhost:3000` is not added to your Google Cloud Console's **Authorized JavaScript origins**.

## Solution: Add Localhost to Google Cloud Console

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project (or create one if needed)
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth 2.0 Client ID

1. Find your OAuth 2.0 Client ID:
   - Look for: `418494481430-anjc8q9si1esa3prejvl2afl61ae008b.apps.googleusercontent.com`
2. Click the **Edit** button (pencil icon) next to it

### Step 3: Add Authorized JavaScript Origins

In the **Authorized JavaScript origins** section:

1. Click **+ ADD URI**
2. Add: `http://localhost:3000`
3. Click **+ ADD URI** again
4. Add: `http://localhost` (some configurations require this)
5. Click **SAVE**

**Important:** 
- Use `http://` (not `https://`) for localhost
- Do NOT include a trailing slash for JavaScript origins
- Port number (3000) is required

### Step 4: Verify Authorized Redirect URIs

While you're there, verify **Authorized redirect URIs** includes:

1. `http://localhost:3000`
2. `http://localhost:3000/` (with trailing slash)

### Step 5: Restart Your Application

After saving:

1. Stop your development servers (Ctrl+C)
2. Restart: `npm run dev`
3. Hard refresh your browser: `Ctrl+Shift+R` or `Ctrl+F5`

### Step 6: Test

1. Open `http://localhost:3000/login` or `http://localhost:3000/register`
2. Check the browser console (F12) - the 403 errors should be gone
3. Try clicking the "Sign in with Google" or "Sign up with Google" button

## For Production

When deploying to production, add your production domain:

- **Authorized JavaScript origins:**
  - `https://yourdomain.com`
  
- **Authorized redirect URIs:**
  - `https://yourdomain.com`
  - `https://yourdomain.com/`

**Note:** Production MUST use `https://` (not `http://`)

## Button Text Standards

The application now uses Google's approved button text:
- **Login page**: "Sign in with Google" ✅
- **Register page**: "Sign up with Google" ✅

These are Google's standard approved texts per their branding guidelines.

## Still Seeing Errors?

If you still see 403 errors after following these steps:

1. **Clear browser cache**: Clear all cached data for localhost:3000
2. **Wait a few minutes**: Google Cloud Console changes can take 1-5 minutes to propagate
3. **Verify Client ID**: Ensure `REACT_APP_GOOGLE_CLIENT_ID` in `client/.env` matches your Google Cloud Console Client ID exactly
4. **Check OAuth Consent Screen**: Ensure your OAuth consent screen is properly configured in Google Cloud Console

## Visual Guide

```
Google Cloud Console
├── APIs & Services
│   └── Credentials
│       └── OAuth 2.0 Client IDs
│           └── [Your Client ID - Edit]
│               ├── Authorized JavaScript origins
│               │   ├── http://localhost:3000  ← ADD THIS
│               │   └── https://yourdomain.com (for production)
│               └── Authorized redirect URIs
│                   ├── http://localhost:3000  ← ADD THIS
│                   ├── http://localhost:3000/ ← ADD THIS
│                   └── https://yourdomain.com (for production)
```

