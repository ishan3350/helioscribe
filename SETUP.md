# HelioScribe Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

### 2. Configure Environment Variables

#### Server Configuration (server/.env)
The `.env` file is already configured with your provided credentials. Verify the following:

- `MONGODB_URI` - Your MongoDB connection string
- `DB_NAME` - Database name (default: helioscribe)
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `SMTP_*` - Email service configuration
- `CLIENT_URL` - Frontend URL (default: http://localhost:3000)

#### Client Configuration (client/.env)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000/api)

### 3. Start the Application

#### Development Mode (Recommended)
Runs both server and client concurrently:
```bash
npm run dev
```

#### Separate Terminals
```bash
# Terminal 1 - Backend Server
npm run server

# Terminal 2 - Frontend Client
npm run client
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## First Time Setup

1. The application will automatically create the MongoDB database `helioscribe` on first connection
2. The `users` collection will be created automatically when the first user registers
3. Make sure your MongoDB server is accessible and credentials are correct

## Testing the Application

1. **Register a new user**
   - Go to http://localhost:3000/register
   - Fill in all required fields
   - Submit the form
   - Check your email for the verification code

2. **Verify your email**
   - Enter the 6-digit verification code
   - You'll be automatically logged in and redirected to the dashboard

3. **Login**
   - Go to http://localhost:3000/login
   - Use your registered email and password
   - Access the dashboard

## Troubleshooting

### MongoDB Connection Issues
- Verify the MongoDB URI is correct
- Check if the MongoDB server is running and accessible
- Ensure network/firewall allows connections to MongoDB port (27017)

### Email Not Sending
- Verify SMTP credentials are correct
- Check SMTP server is accessible
- Review server logs for email errors

### Port Already in Use
- Change `PORT` in server/.env if 5000 is taken
- Change React default port (3000) by setting `PORT` environment variable before `npm start`

### CORS Issues
- Ensure `CLIENT_URL` in server/.env matches your frontend URL
- Check browser console for CORS errors

## Production Deployment

1. Set `NODE_ENV=production` in server/.env
2. Use a strong, unique `JWT_SECRET`
3. Update `CLIENT_URL` with production frontend URL
4. Configure production MongoDB connection
5. Set up production SMTP service
6. Build frontend: `cd client && npm run build`
7. Serve the build folder with a web server (nginx, Apache, etc.)

## Security Checklist

- [ ] Change default JWT_SECRET to a strong random string
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting appropriate for your use case
- [ ] Regularly update dependencies
- [ ] Use environment variables for all sensitive data
- [ ] Enable MongoDB authentication
- [ ] Set up proper logging and monitoring

