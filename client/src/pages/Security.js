import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  changePassword, 
  getMFAStatus, 
  setupMFA, 
  verifyMFA, 
  disableMFA 
} from '../services/authService';
import { formatErrorForDisplay } from '../utils/errorHandler';
import './Security.css';

const Security = () => {
  const [activeTab, setActiveTab] = useState('password');
  const [mfaStatus, setMfaStatus] = useState({ mfaEnabled: false, hasSecret: false });
  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  
  // MFA setup state
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');
  const [mfaVerificationError, setMfaVerificationError] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  
  // MFA disable state
  const [disablePassword, setDisablePassword] = useState('');
  const [disableError, setDisableError] = useState('');

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    try {
      const response = await getMFAStatus();
      if (response.success) {
        setMfaStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching MFA status:', error);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: ''
      });
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (response.success) {
        toast.success('Password has been changed successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMFASetup = async () => {
    setMfaLoading(true);
    try {
      const response = await setupMFA();
      if (response.success) {
        setMfaSetupData(response.data);
        setBackupCodes(response.data.backupCodes);
        setActiveTab('mfa');
      }
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMFAVerify = async (e) => {
    e.preventDefault();
    
    if (!mfaVerificationCode || mfaVerificationCode.length !== 6) {
      setMfaVerificationError('Please enter a 6-digit verification code');
      return;
    }

    setMfaLoading(true);
    setMfaVerificationError('');

    try {
      const response = await verifyMFA(mfaVerificationCode);
      if (response.success) {
        toast.success('MFA has been enabled successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
        setMfaStatus({ mfaEnabled: true, hasSecret: true });
        setMfaSetupData(null);
        setMfaVerificationCode('');
        setShowBackupCodes(true);
        setBackupCodes(response.data.backupCodes);
      }
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      setMfaVerificationError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMFADisable = async (e) => {
    e.preventDefault();
    
    if (!disablePassword) {
      setDisableError('Password is required to disable MFA');
      return;
    }

    setMfaLoading(true);
    setDisableError('');

    try {
      const response = await disableMFA(disablePassword);
      if (response.success) {
        toast.success('MFA has been disabled successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
        setMfaStatus({ mfaEnabled: false, hasSecret: false });
        setDisablePassword('');
        setMfaSetupData(null);
      }
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      setDisableError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="security-container">
      <div className="security-header">
        <h1 className="security-title">Security Settings</h1>
        <p className="security-subtitle">Manage your account security and authentication preferences</p>
      </div>

      <div className="security-tabs">
        <button
          className={`security-tab ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1C8.96243 1 6.5 3.46243 6.5 6.5V9H4C2.89543 9 2 9.89543 2 11V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9H17.5V6.5C17.5 3.46243 15.0376 1 12 1ZM12 3C13.933 3 15.5 4.567 15.5 6.5V9H8.5V6.5C8.5 4.567 10.067 3 12 3Z" fill="currentColor"/>
          </svg>
          Change Password
        </button>
        <button
          className={`security-tab ${activeTab === 'mfa' ? 'active' : ''}`}
          onClick={() => setActiveTab('mfa')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.4 7 14.8 8.6 14.8 10V11.5C15.4 11.5 16 12.1 16 12.7V16.2C16 16.8 15.4 17.3 14.8 17.3H9.2C8.6 17.3 8 16.7 8 16.2V12.8C8 12.2 8.6 11.6 9.2 11.6V10C9.2 8.6 10.6 7 12 7ZM12 8.2C11.2 8.2 10.5 8.7 10.5 9.5V11.5H13.5V9.5C13.5 8.7 12.8 8.2 12 8.2Z" fill="currentColor"/>
          </svg>
          Two-Factor Authentication
        </button>
      </div>

      <div className="security-content">
        {activeTab === 'password' && (
          <div className="security-section">
            <div className="section-header">
              <h2>Change Password</h2>
              <p>Update your account password to keep your account secure</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="security-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={passwordErrors.currentPassword ? 'error' : ''}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
                {passwordErrors.currentPassword && (
                  <span className="error-message">{passwordErrors.currentPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={passwordErrors.newPassword ? 'error' : ''}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                />
                {passwordErrors.newPassword && (
                  <span className="error-message">{passwordErrors.newPassword}</span>
                )}
                <small className="form-hint">Must be at least 8 characters with uppercase, lowercase, and number</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={passwordErrors.confirmPassword ? 'error' : ''}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                />
                {passwordErrors.confirmPassword && (
                  <span className="error-message">{passwordErrors.confirmPassword}</span>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'mfa' && (
          <div className="security-section">
            <div className="section-header">
              <h2>Two-Factor Authentication</h2>
              <p>Add an extra layer of security to your account with two-factor authentication</p>
            </div>

            {!mfaStatus.mfaEnabled && !mfaSetupData && (
              <div className="mfa-setup-card">
                <div className="mfa-status">
                  <div className="status-indicator disabled">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="status-text">
                    <h3>Two-Factor Authentication is Disabled</h3>
                    <p>Enable two-factor authentication to add an extra layer of security to your account</p>
                  </div>
                </div>
                <button 
                  onClick={handleMFASetup}
                  className="btn-primary"
                  disabled={mfaLoading}
                >
                  {mfaLoading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                </button>
              </div>
            )}

            {mfaSetupData && !mfaStatus.mfaEnabled && (
              <div className="mfa-setup-process">
                <div className="setup-step">
                  <h3>Step 1: Scan QR Code</h3>
                  <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                  <div className="qr-code-container">
                    <img src={mfaSetupData.qrCode} alt="MFA QR Code" className="qr-code" />
                  </div>
                  <div className="manual-entry">
                    <p className="manual-entry-label">Can't scan? Enter this code manually:</p>
                    <div className="manual-entry-code">{mfaSetupData.manualEntryKey}</div>
                  </div>
                </div>

                <div className="setup-step">
                  <h3>Step 2: Verify Setup</h3>
                  <p>Enter the 6-digit code from your authenticator app to verify and enable MFA</p>
                  <form onSubmit={handleMFAVerify} className="mfa-verify-form">
                    <div className="form-group">
                      <input
                        type="text"
                        value={mfaVerificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setMfaVerificationCode(value);
                          setMfaVerificationError('');
                        }}
                        className={mfaVerificationError ? 'error code-input' : 'code-input'}
                        placeholder="000000"
                        maxLength="6"
                        autoFocus
                      />
                      {mfaVerificationError && (
                        <span className="error-message">{mfaVerificationError}</span>
                      )}
                    </div>
                    <button type="submit" className="btn-primary" disabled={mfaLoading || mfaVerificationCode.length !== 6}>
                      {mfaLoading ? 'Verifying...' : 'Verify and Enable MFA'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {showBackupCodes && backupCodes.length > 0 && (
              <div className="backup-codes-card">
                <div className="backup-codes-header">
                  <h3>Backup Codes</h3>
                  <p>Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.</p>
                </div>
                <div className="backup-codes-grid">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="backup-code">{code}</div>
                  ))}
                </div>
                <button 
                  onClick={() => setShowBackupCodes(false)}
                  className="btn-secondary"
                >
                  I've Saved These Codes
                </button>
              </div>
            )}

            {mfaStatus.mfaEnabled && !mfaSetupData && (
              <div className="mfa-enabled-card">
                <div className="mfa-status">
                  <div className="status-indicator enabled">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="status-text">
                    <h3>Two-Factor Authentication is Enabled</h3>
                    <p>Your account is protected with two-factor authentication</p>
                  </div>
                </div>
                <form onSubmit={handleMFADisable} className="mfa-disable-form">
                  <div className="form-group">
                    <label htmlFor="disablePassword">Enter your password to disable MFA</label>
                    <input
                      type="password"
                      id="disablePassword"
                      value={disablePassword}
                      onChange={(e) => {
                        setDisablePassword(e.target.value);
                        setDisableError('');
                      }}
                      className={disableError ? 'error' : ''}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    {disableError && (
                      <span className="error-message">{disableError}</span>
                    )}
                  </div>
                  <button type="submit" className="btn-danger" disabled={mfaLoading || !disablePassword}>
                    {mfaLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Security;

