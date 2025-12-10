import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyResetCode } from '../services/authService';
import { formatErrorForDisplay } from '../utils/errorHandler';
import './Auth.css';

const VerifyResetCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) {
      // If no email in state, redirect to forgot password
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (code.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyResetCode(email, code);

      if (response.success) {
        toast.success('Code verified successfully! You can now set your new password.', {
          position: 'top-right',
          autoClose: 2000,
        });
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { 
              email,
              resetToken: response.resetToken 
            } 
          });
        }, 500);
      } else {
        const errorMessage = response.message || 'Verification failed. Please check your code and try again.';
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 6000,
      });
    } finally {
      setLoading(false);
    }
    
    return false;
  };

  return (
    <div className="auth-container">
      <div className="auth-card verify-card">
        <div className="auth-header">
          <h1 className="auth-logo">HelioScribe</h1>
          <h2 className="auth-title">Verify reset code</h2>
          <p className="auth-subtitle">
            We've sent a verification code to <strong>{email}</strong>
          </p>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(e);
            return false;
          }}
          className="auth-form"
        >
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={handleChange}
              className={error ? 'error code-input' : 'code-input'}
              placeholder="000000"
              maxLength="6"
              autoFocus
            />
            {error && <span className="error-message">{error}</span>}
            <small className="form-hint">Enter the 6-digit code from your email</small>
          </div>

          <button type="submit" className="auth-button" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Didn't receive the code?{' '}
            <Link to="/forgot-password" state={{ email }}>
              Request a new one
            </Link>
          </p>
          <p style={{ marginTop: '12px' }}>
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetCode;

