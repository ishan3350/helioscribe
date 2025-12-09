# reCAPTCHA Setup Guide

## Current Configuration

**Site Key:** `6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-`  
**Secret Key:** `6LfwaSUsAAAAAFoT73s3G0yxtjsGgmH6m7Rcyl1r`

## Troubleshooting "Invalid key type" Error

This error typically occurs when:
1. **Site key and secret key don't match** - They must be from the same reCAPTCHA site
2. **Different reCAPTCHA versions** - Both keys must be for the same version (v2 or v3)
3. **Keys from different Google accounts** - Both keys must be from the same account
4. **Invalid or deleted keys** - Keys may have been deleted or are invalid

## How to Fix

### Step 1: Verify Keys in Google reCAPTCHA Console

1. Go to https://www.google.com/recaptcha/admin
2. Find the site with your site key: `6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-`
3. Check if the secret key matches: `6LfwaSUsAAAAAFoT73s3G0yxtjsGgmH6m7Rcyl1r`
4. Verify the reCAPTCHA type is **v2** (not v3)

### Step 2: Check Domain Configuration

1. In the reCAPTCHA console, ensure your domain is added:
   - For development: `localhost`
   - For production: your actual domain
2. Make sure the domain matches exactly (including `http://` vs `https://`)

### Step 3: Create New Keys (If Needed)

If the keys don't match, create new ones:

1. Go to https://www.google.com/recaptcha/admin
2. Click **"+ Create"** button
3. Select:
   - **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
4. Add domains:
   - `localhost` (for development)
   - Your production domain (for production)
5. Accept the terms and click **Submit**
6. Copy the **Site Key** and **Secret Key**
7. Update your `.env` files:

**Server (`server/.env`):**
```env
RECAPTCHA_SECRET_KEY=your-new-secret-key-here
```

**Client (`client/.env`):**
```env
REACT_APP_RECAPTCHA_SITE_KEY=your-new-site-key-here
```

### Step 4: Restart Servers

After updating the keys:
```bash
# Stop servers (Ctrl+C)
# Restart
npm run dev
```

## Testing

1. Open the registration or login page
2. Complete the reCAPTCHA checkbox
3. Check the browser console for any errors
4. Check the server console for detailed error messages

## Server Logs

The server now logs detailed reCAPTCHA errors. Check the console for:
- Error codes from Google
- IP address used for verification
- Specific error messages

Common error codes:
- `invalid-input-secret` - Secret key is wrong
- `invalid-input-response` - Token is invalid or expired
- `missing-input-secret` - Secret key not configured
- `missing-input-response` - Token not sent

## Environment Variables

Make sure these are set correctly:

**Server (`server/.env`):**
```env
RECAPTCHA_SECRET_KEY=6LfwaSUsAAAAAFoT73s3G0yxtjsGgmH6m7Rcyl1r
```

**Client (`client/.env`):**
```env
REACT_APP_RECAPTCHA_SITE_KEY=6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-
REACT_APP_API_URL=http://localhost:5000/api
```

## Still Having Issues?

1. **Check server logs** - Look for detailed error messages
2. **Verify keys match** - Use the Google reCAPTCHA console
3. **Test with new keys** - Create fresh keys and test
4. **Check domain settings** - Ensure `localhost` is added for development
5. **Clear browser cache** - Sometimes cached scripts cause issues

