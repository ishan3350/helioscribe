# Google OAuth Configuration

## Environment Variables Setup

### Backend Configuration (`server/.env`)

Add the following line to your `server/.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Frontend Configuration (`client/.env`)

Add the following line to your `client/.env` file:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Note:** The Client ID is the same for both frontend and backend. The Client Secret is only needed on the backend.

## Authorized Redirect URIs

In your Google Cloud Console, you need to add the following **Authorized redirect URIs**:

### For Development (Localhost) - ADD THESE:
```
http://localhost:3000
http://localhost:3000/
```

**Note:** For Google OAuth with `@react-oauth/google`, the redirect URI is typically just your origin URL. The library handles the OAuth flow internally without requiring a traditional redirect URI callback.

### For Production (when deployed):
```
https://yourdomain.com
https://yourdomain.com/
```

**Important Notes:**
- For localhost development, use `http://` (not `https://`)
- For production, you **must** use `https://`
- Include both with and without trailing slash
- The redirect URI must exactly match what you configure
- With `@react-oauth/google`, the redirect happens automatically, but you still need to add your origin URLs

## Authorized JavaScript Origins

Also add these **Authorized JavaScript origins**:

### For Development:
```
http://localhost:3000
```

### For Production:
```
https://yourdomain.com
```

## How to Configure in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID (the one ending in `...008b.apps.googleusercontent.com`)
4. Click **Edit** (pencil icon)
5. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
6. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   - `http://localhost:3000` (for development)
   - `http://localhost:3000/` (for development - with trailing slash)
   - `https://yourdomain.com` (for production)
   - `https://yourdomain.com/` (for production - with trailing slash)
7. Click **SAVE**

## Testing

After configuring:

1. Restart your development servers:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login` or `http://localhost:3000/register`

3. You should see a "Sign in with Google" or "Sign up with Google" button

4. Click the button and test the OAuth flow

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure the redirect URI in Google Console exactly matches your current URL
- For localhost, it must be `http://localhost:3000` (not `https://`)
- Check for trailing slashes - they must match exactly

### "Invalid client" Error
- Verify the Client ID is correct in both `.env` files
- Ensure the Client ID matches in Google Cloud Console
- Restart your servers after updating `.env` files

### Button Not Appearing
- Check browser console for errors
- Verify `REACT_APP_GOOGLE_CLIENT_ID` is set in `client/.env`
- Ensure `GoogleOAuthProvider` is wrapping your app in `App.js`

### "Failed to verify Google token"
- Check that `GOOGLE_CLIENT_ID` is set in `server/.env`
- Verify the Client ID matches the frontend
- Check server logs for detailed error messages

## Security Notes

- **Never commit `.env` files to version control**
- The Client Secret should only be on the backend
- For production, use environment variables from your hosting platform
- Ensure HTTPS is enabled in production (required for OAuth)

