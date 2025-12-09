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

export const login = async (email, password, recaptchaToken) => {
  const response = await api.post('/auth/login', { email, password, recaptchaToken });
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

