import api from '../utils/api';

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const verifyEmail = async (email, code) => {
  const response = await api.post('/auth/verify-email', { email, code });
  return response.data;
};

export const resendVerificationCode = async (email) => {
  const response = await api.post('/auth/resend-verification', { email });
  return response.data;
};

export const login = async (email, password, recaptchaToken, mfaToken = null) => {
  const response = await api.post('/auth/login', { 
    email, 
    password, 
    recaptchaToken,
    ...(mfaToken && { mfaToken })
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getDashboardData = async () => {
  const response = await api.get('/user/dashboard');
  return response.data;
};

export const loginWithGoogle = async (idToken, deviceFingerprint) => {
  const response = await api.post('/auth/google', { 
    idToken, 
    deviceFingerprint 
  });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const verifyResetCode = async (email, code) => {
  const response = await api.post('/auth/verify-reset-code', { 
    email, 
    code 
  });
  return response.data;
};

export const resetPassword = async (resetToken, newPassword) => {
  const response = await api.post('/auth/reset-password', { 
    resetToken, 
    newPassword 
  });
  return response.data;
};

// Security/Account Management
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/security/change-password', {
    currentPassword,
    newPassword
  });
  return response.data;
};

export const getMFAStatus = async () => {
  const response = await api.get('/security/mfa/status');
  return response.data;
};

export const setupMFA = async () => {
  const response = await api.get('/security/mfa/setup');
  return response.data;
};

export const verifyMFA = async (token) => {
  const response = await api.post('/security/mfa/verify', { token });
  return response.data;
};

export const disableMFA = async (password) => {
  const response = await api.post('/security/mfa/disable', { password });
  return response.data;
};

// Website Management
export const addWebsite = async (websiteData) => {
  const response = await api.post('/websites', websiteData);
  return response.data;
};

export const getWebsites = async () => {
  const response = await api.get('/websites');
  return response.data;
};

