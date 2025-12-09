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
  let message = 'An unexpected error occurred. Please try again.';
  let title = 'Error';
  let type = 'error';
  let statusCode = null;
  let errorCode = null;

  // Network errors (no response from server)
  if (!error.response) {
    if (error.request) {
      message = 'Unable to connect to the server. Please check your internet connection and try again.';
      title = 'Connection Error';
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
      title = 'Invalid Request';
      if (!message || (message.includes('Invalid') && !message.includes('credentials'))) {
        message = 'The information you provided is invalid. Please check your input and try again.';
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
        title = 'Invalid Credentials';
        message = 'The email or password you entered is incorrect. Please verify your credentials and try again.';
        type = 'invalidCredentials';
      } else {
        // Generic 401 - session expired or unauthorized
        title = 'Authentication Required';
        message = message || 'Your session has expired or you are not authorized. Please sign in again.';
        type = 'auth';
      }
      break;
    case 403:
      title = 'Access Denied';
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
        message = 'You do not have permission to perform this action.';
        type = 'permission';
      } else {
        // Use the original message if it's different
        message = originalMessage;
        type = 'permission';
      }
      break;
    case 404:
      title = 'Not Found';
      message = 'The requested resource could not be found.';
      type = 'notFound';
      break;
    case 409:
      title = 'Conflict';
      if (!message || message.includes('already')) {
        message = 'This resource already exists. Please use a different value.';
      }
      break;
    case 422:
      title = 'Validation Error';
      message = 'Please check your input and ensure all required fields are filled correctly.';
      break;
    case 429:
      title = 'Too Many Requests';
      message = 'You have made too many requests. Please wait a moment and try again.';
      type = 'rateLimit';
      break;
    case 500:
      title = 'Server Error';
      message = 'An internal server error occurred. Our team has been notified. Please try again later.';
      type = 'server';
      break;
    case 503:
      title = 'Service Unavailable';
      message = 'The service is temporarily unavailable. Please try again in a few moments.';
      type = 'service';
      break;
    default:
      if (statusCode >= 500) {
        title = 'Server Error';
        message = 'A server error occurred. Please try again later.';
        type = 'server';
      } else if (statusCode >= 400) {
        title = 'Request Error';
        message = message || 'An error occurred processing your request.';
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
  
  // For invalid credentials, show a more user-friendly message without the title prefix
  if (type === 'invalidCredentials') {
    return message; // Already includes "Invalid Credentials" context
  }
  
  // For enterprise applications, we show title and message
  if (title && title !== 'Error') {
    return `${title}: ${message}`;
  }
  
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

