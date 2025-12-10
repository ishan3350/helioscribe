import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../services/authService';
import { formatErrorForDisplay } from '../utils/errorHandler';
import './Auth.css';

const VerifyMFA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mfaToken, setMfaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState(null);

  useEffect(() => {
    // Get login data from location state
    const data = location.state?.loginData;
    if (!data || !data.email || !data.password || !data.recaptchaToken) {
      // If no login data, redirect back to login
      toast.error('Please sign in first', {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/login');
    } else {
      setLoginData(data);
    }
  }, [location.state, navigate]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setMfaToken(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (mfaToken.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return false;
    }

    if (!loginData) {
      toast.error('Login session expired. Please sign in again.', {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/login');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      // For MFA verification, we don't need reCAPTCHA since user already authenticated
      // Pass empty string or null - backend will skip reCAPTCHA when mfaToken is provided
      const response = await login(
        loginData.email,
        loginData.password,
        '', // Empty reCAPTCHA token - backend will skip verification when mfaToken is present
        mfaToken
      );

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
        const errorMessage = response.message || 'Invalid verification code. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      
      // Check if it's an MFA error
      if (error.response?.data?.mfaRequired) {
        const errorMessage = error.response.data.message || 'Invalid verification code. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
      } else {
        const errorMessage = formatErrorForDisplay(error);
        setError(errorMessage);
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
      <div className="auth-card verify-card">
        <div className="auth-header">
          <h1 className="auth-logo">HelioScribe</h1>
          <h2 className="auth-title">Two-Factor Authentication</h2>
          <p className="auth-subtitle">
            Enter the verification code from your authenticator app
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
            <label htmlFor="mfaToken">Verification Code</label>
            <input
              type="text"
              id="mfaToken"
              name="mfaToken"
              value={mfaToken}
              onChange={handleChange}
              className={error ? 'error code-input' : 'code-input'}
              placeholder="000000"
              maxLength="6"
              autoFocus
            />
            {error && <span className="error-message">{error}</span>}
            <small className="form-hint">Enter the 6-digit code from your authenticator app</small>
          </div>

          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading || mfaToken.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Having trouble? <button 
              type="button"
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                fontSize: '14px'
              }}
            >
              Go back to sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyMFA;

