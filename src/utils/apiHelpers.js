/**
 * API Helper Utilities
 * Common utilities for making API requests
 */

import Config from '../config/env';

/**
 * Build API URL with query parameters
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {string} - Complete API URL
 */
export const buildApiUrl = (endpoint, params = {}) => {
  try {
    // Get base URL from config
    const baseUrl = Config.API_BASE_URL || 'https://your-domain.com/mobile-api';

    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.slice(1)
      : endpoint;

    // Build base URL
    let fullUrl = `${baseUrl}/${cleanEndpoint}`;

    // Manually build query string without encoding
    const queryParams = [];
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParams.push(`${key}=${params[key]}`);
      }
    });

    if (queryParams.length > 0) {
      fullUrl += '?' + queryParams.join('&');
    }

    console.log('🔗 API HELPERS: Built URL:', fullUrl);
    return fullUrl;
  } catch (error) {
    console.error('❌ API HELPERS: Error building URL:', error);
    throw new Error('Failed to build API URL');
  }
};

/**
 * Make API request with common error handling
 * @param {string} url - API URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - API response
 */
export const makeApiRequest = async (url, options = {}) => {
  try {
    console.log('📤 API HELPERS: Making request to:', url);
    console.log('📤 API HELPERS: Request options:', options);

    // Default options
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: Config.NETWORK?.TIMEOUT || 30000,
    };

    // Merge options
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    // Make the request
    const response = await fetch(url, requestOptions);

    console.log('📥 API HELPERS: Response status:', response.status);
    console.log('📥 API HELPERS: Response headers:', response.headers);

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse response
    const responseText = await response.text();
    console.log('📥 API HELPERS: Raw response:', responseText);
    console.log('📥 API HELPERS: Response text type:', typeof responseText);

    // Try to parse as JSON, fallback to text
    let responseData;
    try {
      // Handle empty or undefined response text
      if (!responseText || responseText.trim() === '') {
        console.warn('⚠️ API HELPERS: Empty response text received');
        responseData = {
          success: false,
          message: 'Empty response from server',
        };
      } else {
        responseData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.log(
        '📥 API HELPERS: JSON parse failed, trying text parsing:',
        parseError.message
      );
      // Handle non-JSON responses (like the pickup request API)
      responseData = parseApiTextResponse(responseText);
    }

    console.log('📥 API HELPERS: Parsed response:', responseData);
    return responseData;
  } catch (error) {
    console.error('❌ API HELPERS: Request failed:', error);
    throw error;
  }
};

/**
 * Parse text-based API responses (like pickup request API)
 * @param {string} responseText - Raw response text
 * @returns {Object} - Parsed response object
 */
export const parseApiTextResponse = (responseText) => {
  try {
    // Handle undefined, null, or non-string input
    if (!responseText || typeof responseText !== 'string') {
      console.warn('⚠️ API HELPERS: Invalid response text:', responseText);
      return {
        success: false,
        message: 'Invalid or empty response from server',
        originalResponse: responseText,
      };
    }

    const text = responseText.trim();

    // Handle empty string after trim
    if (!text) {
      console.warn('⚠️ API HELPERS: Empty response text after trim');
      return {
        success: false,
        message: 'Empty response from server',
      };
    }

    // Handle success responses: "ok|Message"
    if (text.startsWith('ok|')) {
      const message = text.substring(3); // Remove "ok|" prefix
      return {
        success: true,
        message: message,
      };
    }

    // Handle failure responses: "fail|Error message"
    if (text.startsWith('fail|')) {
      const message = text.substring(5); // Remove "fail|" prefix
      return {
        success: false,
        message: message,
      };
    }

    // Handle other text responses
    return {
      success: true,
      message: text,
    };
  } catch (error) {
    console.error('❌ API HELPERS: Error parsing text response:', error);
    return {
      success: false,
      message: 'Failed to parse API response',
    };
  }
};

/**
 * Handle API errors with user-friendly messages
 * @param {Error} error - Error object
 * @returns {string} - User-friendly error message
 */
export const handleApiError = (error) => {
  console.error('❌ API HELPERS: Handling error:', error);

  if (
    error.name === 'TypeError' &&
    error.message.includes('Network request failed')
  ) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (error.message.includes('HTTP error')) {
    const status = error.message.match(/status: (\d+)/)?.[1];
    switch (status) {
      case '401':
        return 'Authentication failed. Please log in again.';
      case '403':
        return 'Access denied. You do not have permission to perform this action.';
      case '404':
        return 'Service not found. Please try again later.';
      case '500':
        return 'Server error. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Create form data for multipart requests
 * @param {Object} data - Data to convert to form data
 * @returns {FormData} - Form data object
 */
export const createFormData = (data) => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });

  return formData;
};

/**
 * Check if response indicates success
 * @param {Object} response - API response
 * @returns {boolean} - True if successful
 */
export const isSuccessResponse = (response) => {
  return (
    response &&
    (response.success === true ||
      response.status === 'success' ||
      (typeof response.message === 'string' &&
        response.message.startsWith('ok|')))
  );
};

/**
 * Extract error message from response
 * @param {Object} response - API response
 * @returns {string} - Error message
 */
export const getErrorMessage = (response) => {
  if (response?.message) {
    // Handle "fail|Error message" format
    if (
      typeof response.message === 'string' &&
      response.message.startsWith('fail|')
    ) {
      return response.message.substring(5);
    }
    return response.message;
  }

  if (response?.error) {
    return response.error;
  }

  return 'An unknown error occurred';
};

/**
 * API Helpers Export
 */
export default {
  buildApiUrl,
  makeApiRequest,
  parseApiTextResponse,
  handleApiError,
  createFormData,
  isSuccessResponse,
  getErrorMessage,
};
