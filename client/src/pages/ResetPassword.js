import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resetPassword } from '../services/authService';
import { formatErrorForDisplay } from '../utils/errorHandler';
import './Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const resetToken = location.state?.resetToken;
  const email = location.state?.email;

  useEffect(() => {
    if (!resetToken || !email) {
      // If no token or email, redirect to forgot password
      toast.error('Please verify your reset code first.', {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/forgot-password');
    }
  }, [resetToken, email, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

    if (!resetToken) {
      toast.error('Reset token is missing. Please start over.', {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/forgot-password');
      return false;
    }

    setLoading(true);

    try {
      const response = await resetPassword(resetToken, formData.newPassword);

      if (response.success) {
        toast.success('Password has been reset successfully! You can now sign in with your new password.', {
          position: 'top-right',
          autoClose: 4000,
        });
        setTimeout(() => {
          navigate('/login');
        }, 500);
      } else {
        const errorMessage = response.message || 'Failed to reset password. Please try again.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      const errorMessage = formatErrorForDisplay(error);
      
      // Check if token expired
      if (error.response?.status === 400 && errorMessage.includes('expired')) {
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 6000,
        });
        setTimeout(() => {
          navigate('/forgot-password', { state: { email } });
        }, 2000);
      } else {
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
      }

      // Handle validation errors for field-level display
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          const field = err.param || err.field || err.path;
          const message = err.msg || err.message;
          if (field && message) {
            // Map backend field names to frontend field names
            if (field === 'newPassword') {
              apiErrors.newPassword = message;
            }
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

  if (!resetToken || !email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">HelioScribe</h1>
          <h2 className="auth-title">Set new password</h2>
          <p className="auth-subtitle">
            Enter your new password below
          </p>
        </div>

        <form 
          onSubmit={handleSubmit}
          className="auth-form" 
          noValidate
        >
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={errors.newPassword ? 'error' : ''}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              autoFocus
            />
            {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
            <small className="form-hint">Must contain uppercase, lowercase, and number</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
