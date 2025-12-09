import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const [searchParams] = useSearchParams();
  
  // Check for token in URL first (OAuth redirect)
  const urlToken = searchParams.get('token');
  const localToken = localStorage.getItem('token');
  
  // If token is in URL, save it to localStorage immediately (synchronously)
  // Don't remove from URL here - let Dashboard handle it and show success message
  if (urlToken && !localToken) {
    localStorage.setItem('token', urlToken);
  }
  
  // Check if we have a token (either from URL or localStorage)
  const hasToken = urlToken || localToken;
  
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;

