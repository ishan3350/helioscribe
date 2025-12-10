import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { forgotPassword } from '../services/authService';
import { formatErrorForDisplay } from '../utils/errorHandler';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({
        ...errors,
        email: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) {
      return false;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const response = await forgotPassword(email);

      if (response.success) {
        setSuccess(true);
        toast.success('If an account with that email exists, a password reset code has been sent to your email.', {
          position: 'top-right',
          autoClose: 5000,
        });
      } else {
        const errorMessage = response.message || 'Failed to send reset code. Please try again.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      const errorMessage = formatErrorForDisplay(error);
      
      // Check if it's a Google OAuth account error
      if (error.response?.status === 403 && error.response?.data?.authMethod === 'google') {
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 6000,
        });
      } else {
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
    
    return false;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">HelioScribe</h1>
          <h2 className="auth-title">Reset your password</h2>
          <p className="auth-subtitle">
            {success 
              ? 'Check your email for the reset code' 
              : 'Enter your email address and we\'ll send you a reset code'}
          </p>
        </div>

        {!success ? (
          <form 
            onSubmit={handleSubmit}
            className="auth-form" 
            noValidate
          >
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="john.doe@example.com"
                autoComplete="email"
                autoFocus
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <div className="auth-form">
            <div className="form-group">
              <p style={{ 
                textAlign: 'center', 
                color: '#34a853', 
                fontSize: '15px',
                lineHeight: '1.6',
                marginBottom: '24px'
              }}>
                We've sent a password reset code to <strong>{email}</strong>. 
                Please check your inbox and enter the code to continue.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => navigate('/verify-reset-code', { state: { email } })}
              className="auth-button"
            >
              Continue to Verify Code
            </button>
          </div>
        )}

        <div className="auth-footer">
          <p>
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

