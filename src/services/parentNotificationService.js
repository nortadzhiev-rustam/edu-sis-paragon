/**
 * Parent Notification Service
 * Handles all notification-related API calls specifically for parents
 * This service ONLY uses parent authCode to prevent cross-contamination with other user types
 */

import { Config, buildApiUrl } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserData } from './authService';

// Helper function to get parent auth code from storage
const getParentAuthCode = async () => {
  try {
    console.log('🔑 PARENT NOTIFICATION SERVICE: Getting parent auth code...');

    const parentData = await getUserData('parent', AsyncStorage);
    if (parentData && (parentData.authCode || parentData.auth_code)) {
      const authCode = parentData.authCode || parentData.auth_code;
      console.log(
        '🔑 PARENT NOTIFICATION SERVICE: Using parent auth code:',
        authCode?.substring(0, 8) + '...',
        'Parent name:',
        parentData.name || parentData.user_name
      );
      return authCode;
    }

    console.warn('⚠️ PARENT NOTIFICATION SERVICE: No parent auth code found');
    return null;
  } catch (error) {
    console.error('❌ PARENT NOTIFICATION SERVICE: Error getting auth code:', error);
    return null;
  }
};

// Helper function to make API requests
const makeApiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      timeout: Config.NETWORK.TIMEOUT,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('PARENT NOTIFICATION SERVICE: API request failed:', error);
    throw error;
  }
};

/**
 * Get parent notifications list with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.category - Filter by category (optional)
 * @returns {Promise<Object>} - Notifications data
 */
export const getParentNotifications = async (params = {}) => {
  try {
    const authCode = await getParentAuthCode();
    if (!authCode) {
      throw new Error('No parent authentication code found');
    }

    const queryParams = {
      authCode,
      page: params.page || 1,
      limit: params.limit || 20,
      ...params,
    };

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_NOTIFICATIONS,
      queryParams
    );
    return await makeApiRequest(url);
  } catch (error) {
    console.error('PARENT NOTIFICATION SERVICE: Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark a parent notification as read
 * @param {number} notificationId - ID of the notification to mark as read
 * @returns {Promise<Object>} - Response data
 */
export const markParentNotificationAsRead = async (notificationId) => {
  try {
    const authCode = await getParentAuthCode();
    if (!authCode) {
      throw new Error('No parent authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.MARK_NOTIFICATION_READ);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        notification_id: notificationId,
      }),
    });
  } catch (error) {
    console.error('PARENT NOTIFICATION SERVICE: Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all parent notifications as read
 * @returns {Promise<Object>} - Response data
 */
export const markAllParentNotificationsAsRead = async () => {
  try {
    const authCode = await getParentAuthCode();
    if (!authCode) {
      throw new Error('No parent authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
      }),
    });
  } catch (error) {
    console.error('PARENT NOTIFICATION SERVICE: Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get notification categories for parents
 * @returns {Promise<Object>} - Categories data
 */
export const getParentNotificationCategories = async () => {
  try {
    const authCode = await getParentAuthCode();
    if (!authCode) {
      throw new Error('No parent authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_NOTIFICATION_CATEGORIES, {
      authCode,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('PARENT NOTIFICATION SERVICE: Error fetching notification categories:', error);
    throw error;
  }
};

// Export the auth code getter for use in other parent-specific contexts
export { getParentAuthCode };

