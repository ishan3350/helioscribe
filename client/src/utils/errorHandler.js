/**
 * Enterprise Error Handler
 * Centralized error handling utility for consistent error management across the application
 */

/**
 * Extract user-friendly error message from API error response
 * @param {Error} error - The error object from axios/API call
 * @returns {Object} - Object containing message, title, and type
 */
export const extractErrorMessage = (error) => {
  // Default error message
  let message = 'We encountered an unexpected issue. Please try again. If the problem continues, contact our support team.';
  let title = 'Something Went Wrong';
  let type = 'error';
  let statusCode = null;
  let errorCode = null;

  // Network errors (no response from server)
  if (!error.response) {
    if (error.request) {
      message = 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.';
      title = 'Connection Issue';
      type = 'network';
    } else if (error.message) {
      message = error.message;
    }
    return { message, title, type, statusCode, errorCode };
  }

  // HTTP errors (response received but with error status)
  const response = error.response;
  statusCode = response.status;
  errorCode = response.data?.errorCode || response.data?.code;

  // Extract message from various possible response formats
  let originalMessage = null;
  if (response.data) {
    if (response.data.message) {
      originalMessage = response.data.message;
      message = response.data.message;
    } else if (response.data.error) {
      originalMessage = response.data.error;
      message = response.data.error;
    } else if (response.data.errors && Array.isArray(response.data.errors)) {
      // Handle validation errors
      const firstError = response.data.errors[0];
      originalMessage = firstError.msg || firstError.message || 'Validation error occurred';
      message = originalMessage;
    } else if (typeof response.data === 'string') {
      originalMessage = response.data;
      message = response.data;
    }
  }

  // Map HTTP status codes to professional messages
  switch (statusCode) {
    case 400:
      title = 'Invalid Information';
      if (!message || (message.includes('Invalid') && !message.includes('credentials'))) {
        message = 'Some of the information you provided isn\'t valid. Please review your input and try again.';
      }
      break;
    case 401:
      // Check if this is an invalid credentials error (from login/register)
      // Check the original message from API before any modifications
      const apiMessage = originalMessage || message || '';
      const isInvalidCredentials = apiMessage && (
        apiMessage.toLowerCase().includes('invalid credentials') ||
        apiMessage.toLowerCase().includes('invalid email or password') ||
        apiMessage.toLowerCase().includes('incorrect password') ||
        apiMessage.toLowerCase().includes('authentication failed') ||
        apiMessage.toLowerCase().includes('wrong password') ||
        apiMessage.toLowerCase().includes('user not found')
      );
      
      if (isInvalidCredentials) {
        title = 'Sign-In Failed';
        message = 'The email or password you entered is incorrect. Please check your credentials and try again.';
        type = 'invalidCredentials';
      } else {
        // Generic 401 - session expired or unauthorized
        title = 'Session Expired';
        message = message || 'Your session has expired. Please sign in again to continue.';
        type = 'auth';
      }
      break;
    case 403:
      title = 'Access Restricted';
      // Check if this is a Google OAuth account error
      const apiMessage403 = originalMessage || message || '';
      const isGoogleOAuthError = response.data?.authMethod === 'google' || 
                                  apiMessage403.toLowerCase().includes('google') ||
                                  apiMessage403.toLowerCase().includes('registered using google');
      
      if (isGoogleOAuthError && originalMessage) {
        // Use the specific message from backend about Google OAuth
        message = originalMessage;
        type = 'googleOAuth';
      } else if (!originalMessage || originalMessage === message) {
        // Only use generic message if no specific message was provided
        message = 'You don\'t have permission to perform this action. If you believe this is an error, please contact support.';
        type = 'permission';
      } else {
        // Use the original message if it's different
        message = originalMessage;
        type = 'permission';
      }
      break;
    case 404:
      title = 'Not Found';
      message = 'The information you\'re looking for couldn\'t be found. It may have been moved or deleted.';
      type = 'notFound';
      break;
    case 409:
      title = 'Already Exists';
      // Use the specific message from backend if provided (it's usually very clear)
      if (!originalMessage || originalMessage === message || (!message || message.includes('This information already exists'))) {
        // Only use generic message if no specific message was provided
        if (!message || message.includes('This information already exists')) {
          message = 'This information already exists in our system. Please use a different value or sign in if you already have an account.';
        } else {
          // Use the specific message from backend
          message = originalMessage || message;
        }
      } else {
        // Backend provided a specific message, use it
        message = originalMessage;
      }
      break;
    case 422:
      title = 'Validation Error';
      message = 'Some of the information you provided isn\'t in the correct format. Please review all fields and try again.';
      break;
    case 429:
      title = 'Too Many Requests';
      message = 'You\'ve made too many requests in a short time. Please wait a moment before trying again.';
      type = 'rateLimit';
      break;
    case 500:
      title = 'Server Error';
      message = 'We\'re experiencing technical difficulties. Our team has been notified and is working on a fix. Please try again in a few moments.';
      type = 'server';
      break;
    case 503:
      title = 'Service Unavailable';
      message = 'Our service is temporarily unavailable. We\'re working to restore it as quickly as possible. Please try again shortly.';
      type = 'service';
      break;
    default:
      if (statusCode >= 500) {
        title = 'Server Error';
        message = 'We\'re experiencing a server issue. Please try again in a few moments. If the problem persists, contact our support team.';
        type = 'server';
      } else if (statusCode >= 400) {
        title = 'Request Error';
        message = message || 'We couldn\'t process your request. Please try again or contact support if the issue continues.';
      }
  }

  return { message, title, type, statusCode, errorCode };
};

/**
 * Format error message for display
 * @param {Error} error - The error object
 * @returns {string} - Formatted error message
 */
export const formatErrorForDisplay = (error) => {
  const { message, title, type } = extractErrorMessage(error);
  
  // For invalid credentials and common errors, show message without title prefix for cleaner UX
  if (type === 'invalidCredentials' || type === 'googleOAuth') {
    return message; // Message is already user-friendly and complete
  }
  
  // For other errors, show just the message (title is redundant in toast notifications)
  // The toast styling will indicate the error type visually
  return message;
};

/**
 * Check if error requires user action
 * @param {Error} error - The error object
 * @returns {boolean} - True if user action is required
 */
export const requiresUserAction = (error) => {
  const { statusCode } = extractErrorMessage(error);
  return statusCode === 401 || statusCode === 403;
};

/**
 * Get error severity level
 * @param {Error} error - The error object
 * @returns {string} - 'low', 'medium', or 'high'
 */
export const getErrorSeverity = (error) => {
  const { statusCode, type } = extractErrorMessage(error);
  
  if (statusCode >= 500 || type === 'server' || type === 'service') {
    return 'high';
  }
  
  if (statusCode === 401 || statusCode === 403 || type === 'auth' || type === 'permission') {
    return 'high';
  }
  
  if (statusCode === 429 || type === 'rateLimit') {
    return 'medium';
  }
  
  return 'low';
};

