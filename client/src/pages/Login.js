import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../services/authService';
import { formatErrorForDisplay } from '../utils/errorHandler';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fingerprint, setFingerprint] = useState('');
  const recaptchaLoaded = useRef(false);
  const errorShownRef = useRef(false);

  // Check for error parameters from OAuth redirect
  useEffect(() => {
    const error = searchParams.get('error');
    if (error && !errorShownRef.current) {
      errorShownRef.current = true;
      let errorMessage = 'We encountered an issue signing you in. Please try again.';
      if (error === 'google_auth_failed') {
        errorMessage = 'We couldn\'t complete your Google sign-in. Please try again or use your email and password.';
      } else if (error === 'google_auth_no_email') {
        errorMessage = 'We couldn\'t retrieve your email address from Google. Please ensure your Google account has a verified email address.';
      } else if (error === 'google_auth_not_registered') {
        errorMessage = 'This account hasn\'t been registered yet. Please create an account first using the "Create one" link below.';
      } else if (error === 'google_auth_already_registered') {
        errorMessage = 'This email is already registered. Please sign in with your password or use the Google sign-in option.';
      } else if (error === 'google_auth_email_not_verified') {
        errorMessage = 'Your Google email address needs to be verified. Please verify your email with Google and try again.';
      }
      toast.error(errorMessage);
      // Remove error from URL immediately
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    // Get device fingerprint
    const getFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (error) {
        console.error('Error getting fingerprint:', error);
      }
    };
    getFingerprint();

    // Load reCAPTCHA v3
    const loadRecaptcha = () => {
      if (window.grecaptcha && !recaptchaLoaded.current) {
        recaptchaLoaded.current = true;
      } else if (!recaptchaLoaded.current) {
        const checkInterval = setInterval(() => {
          if (window.grecaptcha) {
            recaptchaLoaded.current = true;
            clearInterval(checkInterval);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!recaptchaLoaded.current) {
            console.error('reCAPTCHA v3 failed to load');
          }
        }, 5000);
      }
    };

    if (window.grecaptcha) {
      recaptchaLoaded.current = true;
    } else {
      loadRecaptcha();
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executeRecaptcha = async () => {
    try {
      if (!window.grecaptcha) {
        throw new Error('reCAPTCHA v3 not loaded');
      }

      const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-';
      const token = await window.grecaptcha.execute(siteKey, { action: 'login' });
      
      if (errors.recaptcha) {
        setErrors({
          ...errors,
          recaptcha: ''
        });
      }
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution error:', error);
      setErrors({
        ...errors,
        recaptcha: 'Failed to execute reCAPTCHA. Please refresh the page.'
      });
      return null;
    }
  };

  const handleSubmit = async (e) => {
    // Prevent default form submission and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Validate form
    if (!validateForm()) {
      return false;
    }

    setLoading(true);

    try {
      // Execute reCAPTCHA v3 (invisible, automatic)
      const token = await executeRecaptcha();
      if (!token) {
        toast.error('Security verification couldn\'t be completed. Please refresh the page and try again.', {
          position: 'top-right',
          autoClose: 5000,
        });
        setLoading(false);
        return false;
      }

      const response = await login(formData.email, formData.password, token);

      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success('Welcome back! Taking you to your dashboard...', {
          position: 'top-right',
          autoClose: 2000,
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        const errorMessage = response.message || 'We couldn\'t sign you in. Please check your email and password, then try again.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Use centralized error handler
      const errorMessage = formatErrorForDisplay(error);
      
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 6000,
      });
      
      // Handle validation errors for field-level display
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          const field = err.param || err.field || err.path;
          const message = err.msg || err.message;
          if (field && message) {
            apiErrors[field] = message;
          }
        });
        if (Object.keys(apiErrors).length > 0) {
          setErrors(apiErrors);
        }
      }
    } finally {
      setLoading(false);
    }
    
    return false;
  };

  const handleGoogleLogin = () => {
    // Reset error ref when user explicitly tries to login again
    errorShownRef.current = false;
    // Redirect to backend Google OAuth endpoint
    // Handle both cases: with or without /api in base URL
    let apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    // Remove trailing /api if present
    apiBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    window.location.href = `${apiBaseUrl}/api/auth/google`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">HelioScribe</h1>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(e);
            return false;
          }}
          className="auth-form" 
          noValidate
        >
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="john.doe@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {errors.recaptcha && (
            <div className="form-group">
              <span className="error-message">{errors.recaptcha}</span>
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn-google"
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

