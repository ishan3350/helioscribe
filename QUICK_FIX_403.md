# Quick Fix: Google OAuth 403 Error

## The Error
```
Failed to load resource: the server responded with a status of 403
[GSI_LOGGER]: The given origin is not allowed for the given client ID
```

## What It Means
Your Google OAuth Client ID doesn't have `http://localhost:3000` in its authorized origins list.

## Quick Fix (5 minutes)

### Step 1: Open Google Cloud Console
Go to: **https://console.cloud.google.com/**

### Step 2: Navigate to Credentials
1. Select your project (or create one)
2. Click **APIs & Services** in the left menu
3. Click **Credentials**

### Step 3: Edit Your OAuth Client
1. Find your OAuth 2.0 Client ID:
   - Look for: `418494481430-anjc8q9si1esa3prejvl2afl61ae008b.apps.googleusercontent.com`
2. Click the **Edit** button (pencil icon) next to it

### Step 4: Add Authorized JavaScript Origins
1. Scroll to **Authorized JavaScript origins**
2. Click **+ ADD URI**
3. Enter: `http://localhost:3000`
4. **IMPORTANT**: 
   - Use `http://` (NOT `https://`)
   - NO trailing slash
   - Include the port number (3000)

### Step 5: Add Authorized Redirect URIs
1. Scroll to **Authorized redirect URIs**
2. Click **+ ADD URI** and add:
   - `http://localhost:3000`
   - `http://localhost:3000/` (with trailing slash)
3. **IMPORTANT**: 
   - Use `http://` (NOT `https://`)
   - Add BOTH with and without trailing slash

### Step 6: Save
1. Click **SAVE** at the bottom
2. Wait 1-2 minutes for changes to propagate

### Step 7: Test
1. Hard refresh your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Go to: `http://localhost:3000/register` or `http://localhost:3000/login`
3. The 403 error should be gone!

## Visual Guide

```
Google Cloud Console
└── APIs & Services
    └── Credentials
        └── OAuth 2.0 Client IDs
            └── [Your Client ID] ← Click Edit
                ├── Authorized JavaScript origins
                │   └── + ADD URI: http://localhost:3000
                └── Authorized redirect URIs
                    ├── + ADD URI: http://localhost:3000
                    └── + ADD URI: http://localhost:3000/
```

## Common Mistakes

❌ **WRONG:**
- `https://localhost:3000` (use http, not https)
- `http://localhost` (missing port)
- `http://localhost:3000/` (trailing slash in JavaScript origins)

✅ **CORRECT:**
- JavaScript origins: `http://localhost:3000` (no trailing slash)
- Redirect URIs: `http://localhost:3000` AND `http://localhost:3000/` (both)

## Still Not Working?

1. **Wait longer**: Changes can take up to 5 minutes to propagate
2. **Clear browser cache**: Or use Incognito/Private mode
3. **Check Client ID**: Verify it matches in both `.env` files
4. **Restart servers**: Stop and restart `npm run dev`

## For Production

When deploying, add your production domain:
- JavaScript origins: `https://yourdomain.com`
- Redirect URIs: `https://yourdomain.com` and `https://yourdomain.com/`

**Note**: Production MUST use `https://` (not `http://`)


