# reCAPTCHA Enterprise Setup Guide

## Overview

This application now supports **reCAPTCHA Enterprise**, which provides better fraud detection and risk analysis compared to standard reCAPTCHA.

## Current Configuration

**Site Key:** `6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-`  
**Project ID:** `helioscribe` (default)

## Setup Requirements

### Option 1: Use Standard reCAPTCHA API (Simpler - No Google Cloud Setup)

If you don't have Google Cloud credentials, the system will automatically fall back to the standard reCAPTCHA API. Just ensure your keys work with the standard API.

**Environment Variables:**
```env
# Server (.env)
RECAPTCHA_SECRET_KEY=6LfwaSUsAAAAAFoT73s3G0yxtjsGgmH6m7Rcyl1r
RECAPTCHA_ENTERPRISE=false  # Set to false to use standard API

# Client (.env)
REACT_APP_RECAPTCHA_SITE_KEY=6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-
```

### Option 2: Use reCAPTCHA Enterprise (Requires Google Cloud)

For full Enterprise features, you need:

1. **Google Cloud Project** with reCAPTCHA Enterprise API enabled
2. **Service Account** with reCAPTCHA Enterprise permissions
3. **Service Account Key** (JSON file)

#### Step 1: Enable reCAPTCHA Enterprise API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable the **reCAPTCHA Enterprise API**
4. Go to **APIs & Services** → **Credentials**

#### Step 2: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g., `recaptcha-enterprise`)
4. Grant role: **reCAPTCHA Enterprise Agent**
5. Click **Done**

#### Step 3: Create Service Account Key

1. Click on the service account you created
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** format
5. Download the JSON file

#### Step 4: Configure Environment Variables

**Server (`server/.env`):**
```env
# Enable Enterprise mode
RECAPTCHA_ENTERPRISE=true

# Google Cloud Project ID
GOOGLE_CLOUD_PROJECT_ID=helioscribe

# Path to service account key JSON file
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# OR set as environment variable
# GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json

# reCAPTCHA Site Key
RECAPTCHA_SITE_KEY=6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-

# Score threshold (0.0 to 1.0, default 0.5)
# Scores below this will be rejected
RECAPTCHA_SCORE_THRESHOLD=0.5
```

**Client (`client/.env`):**
```env
REACT_APP_RECAPTCHA_SITE_KEY=6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-
```

#### Step 5: Place Service Account Key

1. Create a `keys` folder in the server directory (add to `.gitignore`)
2. Place your service account JSON file there
3. Update `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`

**Example:**
```
server/
  keys/
    recaptcha-service-account.json
  .env  (GOOGLE_APPLICATION_CREDENTIALS=./keys/recaptcha-service-account.json)
```

## How It Works

### Frontend (Client)
- Uses `grecaptcha.enterprise.execute()` instead of checkbox
- Executes automatically when form is submitted
- No visible checkbox - works invisibly in the background
- Action-based: `register` for registration, `login` for login

### Backend (Server)
- Verifies token with Google Cloud reCAPTCHA Enterprise API
- Gets risk score (0.0 to 1.0)
- Checks if score meets threshold (default: 0.5)
- Validates action matches expected action
- Falls back to standard API if Enterprise credentials not configured

## Security Features

1. **Risk Score Analysis**: Enterprise provides a risk score (0.0 = bot, 1.0 = human)
2. **Action Validation**: Ensures token was generated for the correct action
3. **IP Address Tracking**: Includes user IP in assessment
4. **Automatic Fallback**: Falls back to standard API if Enterprise not configured

## Testing

1. **Without Google Cloud** (Standard API):
   - Set `RECAPTCHA_ENTERPRISE=false` or don't set it
   - System will use standard reCAPTCHA API
   - Works with standard reCAPTCHA keys

2. **With Google Cloud** (Enterprise):
   - Set `RECAPTCHA_ENTERPRISE=true`
   - Configure service account credentials
   - System will use Enterprise API with risk scoring

## Troubleshooting

### "Invalid key type" Error
- **Cause**: Keys don't match or are for different reCAPTCHA types
- **Solution**: Verify keys in [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)

### "Google Cloud authentication failed"
- **Cause**: Service account credentials not configured correctly
- **Solution**: 
  - Check `GOOGLE_APPLICATION_CREDENTIALS` path
  - Verify service account has correct permissions
  - Ensure JSON key file is valid

### "reCAPTCHA Enterprise not loaded"
- **Cause**: Enterprise script not loaded in browser
- **Solution**: Check browser console, ensure script loads from CDN

### Low Score Rejections
- **Cause**: Risk score below threshold
- **Solution**: Adjust `RECAPTCHA_SCORE_THRESHOLD` in `.env` (lower = more lenient)

## Score Interpretation

- **0.9 - 1.0**: Very likely legitimate user
- **0.7 - 0.9**: Likely legitimate user
- **0.5 - 0.7**: Suspicious, but may be legitimate
- **0.3 - 0.5**: Likely bot
- **0.0 - 0.3**: Very likely bot

Default threshold is 0.5. Adjust based on your security needs.

## Production Recommendations

1. **Use Enterprise** for better fraud detection
2. **Set appropriate score threshold** based on your traffic patterns
3. **Monitor scores** and adjust threshold as needed
4. **Keep service account key secure** - never commit to git
5. **Use environment variables** for all sensitive configuration
6. **Enable logging** to track reCAPTCHA assessments

