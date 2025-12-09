# HelioScribe - Enterprise MERN Stack Application

A modern, secure, and production-ready MERN stack application with user authentication, email verification, and a professional dashboard.

## Features

- ✅ User Registration with comprehensive data collection
- ✅ Email Verification using verification codes
- ✅ Secure Login with JWT authentication
- ✅ Protected Dashboard (only accessible to verified users)
- ✅ Modern, professional UI design
- ✅ Enterprise-grade security measures
- ✅ Production-ready configuration

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email services
- Express Validator for input validation
- Security middleware (Helmet, Rate Limiting, XSS Protection, MongoDB Sanitization)

### Frontend
- React.js
- React Router for navigation
- Axios for API calls
- React Toastify for notifications
- Modern CSS with gradient designs

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB connection string
- SMTP credentials for email service

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd helioscribe
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables**

   Backend (server/.env):
   - Update MongoDB URI
   - Set JWT secret
   - Configure SMTP settings
   - Set RECAPTCHA_SECRET_KEY (your reCAPTCHA secret key)
   - Set other environment variables

   Frontend (client/.env):
   - Set API URL (default: http://localhost:5000/api)
   - Set REACT_APP_RECAPTCHA_SITE_KEY (your reCAPTCHA site key)

4. **Start the application**

   Development mode (runs both server and client):
   ```bash
   npm run dev
   ```

   Or run separately:
   ```bash
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run client
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
helioscribe/
├── server/
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── middleware/
│   │   └── auth.js        # Authentication middleware
│   ├── models/
│   │   └── User.js        # User model
│   ├── routes/
│   │   ├── auth.js        # Authentication routes
│   │   └── user.js        # User routes
│   ├── utils/
│   │   ├── generateToken.js    # JWT token generation
│   │   ├── sendEmail.js        # Email service
│   │   └── emailTemplates.js   # Email templates
│   ├── index.js           # Server entry point
│   └── package.json
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── PrivateRoute.js
│   │   ├── pages/
│   │   │   ├── Register.js
│   │   │   ├── Login.js
│   │   │   ├── VerifyEmail.js
│   │   │   └── Dashboard.js
│   │   ├── services/
│   │   │   └── authService.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/verify-email` - Verify email with code
- `POST /api/auth/resend-verification` - Resend verification code
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### User
- `GET /api/user/dashboard` - Get dashboard data (Protected)

## Security Features

- **Google reCAPTCHA v2**: Protection on registration and login pages
- Password hashing with bcrypt (12 rounds)
- JWT token-based authentication
- Rate limiting on authentication endpoints
- Input validation and sanitization
- XSS protection
- MongoDB injection prevention
- Helmet.js for security headers
- CORS configuration
- Email verification requirement
- Device fingerprinting for fraud detection
- IP address tracking
- Server-side reCAPTCHA verification

See [SECURITY.md](SECURITY.md) for detailed security documentation.

## Registration Fields

- First Name
- Last Name
- Email Address
- Phone Number
- Address
- How You Heard About Us
- Password (with strength requirements)

## Email Verification

- 6-digit verification code
- 15-minute expiration
- Beautiful HTML email template
- Resend functionality

## Dashboard Features

- User profile information display
- Account statistics
- Last login tracking
- Account creation date
- Email verification status

## Production Deployment

1. Set `NODE_ENV=production` in server/.env
2. Update `CLIENT_URL` with production frontend URL
3. Use strong `JWT_SECRET` in production
4. Configure production MongoDB connection
5. Set up production SMTP service
6. Build frontend: `cd client && npm run build`
7. Serve frontend build with a web server (nginx, etc.)

## License

ISC

