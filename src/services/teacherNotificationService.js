/**
 * Teacher Notification Service
 * Handles all notification-related API calls specifically for teachers
 * This service ONLY uses teacher authCode to prevent cross-contamination with other user types
 */

import { Config, buildApiUrl } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserData } from './authService';

// Helper function to get teacher auth code from storage
const getTeacherAuthCode = async () => {
  try {
    console.log('🔑 TEACHER NOTIFICATION SERVICE: Getting teacher auth code...');

    const teacherData = await getUserData('teacher', AsyncStorage);
    if (teacherData && (teacherData.authCode || teacherData.auth_code)) {
      const authCode = teacherData.authCode || teacherData.auth_code;
      console.log(
        '🔑 TEACHER NOTIFICATION SERVICE: Using teacher auth code:',
        authCode?.substring(0, 8) + '...',
        'Teacher name:',
        teacherData.name || teacherData.user_name
      );
      return authCode;
    }

    console.warn('⚠️ TEACHER NOTIFICATION SERVICE: No teacher auth code found');
    return null;
  } catch (error) {
    console.error('❌ TEACHER NOTIFICATION SERVICE: Error getting auth code:', error);
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
    console.error('TEACHER NOTIFICATION SERVICE: API request failed:', error);
    throw error;
  }
};

/**
 * Get teacher notifications list with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.category - Filter by category (optional)
 * @returns {Promise<Object>} - Notifications data
 */
export const getTeacherNotifications = async (params = {}) => {
  try {
    const authCode = await getTeacherAuthCode();
    if (!authCode) {
      throw new Error('No teacher authentication code found');
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
    console.error('TEACHER NOTIFICATION SERVICE: Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark a teacher notification as read
 * @param {number} notificationId - ID of the notification to mark as read
 * @returns {Promise<Object>} - Response data
 */
export const markTeacherNotificationAsRead = async (notificationId) => {
  try {
    const authCode = await getTeacherAuthCode();
    if (!authCode) {
      throw new Error('No teacher authentication code found');
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
    console.error('TEACHER NOTIFICATION SERVICE: Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all teacher notifications as read
 * @returns {Promise<Object>} - Response data
 */
export const markAllTeacherNotificationsAsRead = async () => {
  try {
    const authCode = await getTeacherAuthCode();
    if (!authCode) {
      throw new Error('No teacher authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
      }),
    });
  } catch (error) {
    console.error('TEACHER NOTIFICATION SERVICE: Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get notification categories for teachers
 * @returns {Promise<Object>} - Categories data
 */
export const getTeacherNotificationCategories = async () => {
  try {
    const authCode = await getTeacherAuthCode();
    if (!authCode) {
      throw new Error('No teacher authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_NOTIFICATION_CATEGORIES, {
      authCode,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('TEACHER NOTIFICATION SERVICE: Error fetching notification categories:', error);
    throw error;
  }
};

/**
 * Send notification (Teacher/Staff only)
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} - Response data
 */
export const sendTeacherNotification = async (notificationData) => {
  try {
    const authCode = await getTeacherAuthCode();
    if (!authCode) {
      throw new Error('No teacher authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SEND_NOTIFICATION);
    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        ...notificationData,
      }),
    });
  } catch (error) {
    console.error('TEACHER NOTIFICATION SERVICE: Error sending notification:', error);
    throw error;
  }
};

/**
 * Get notification statistics (Teacher/Staff only)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Statistics data
 */
export const getTeacherNotificationStatistics = async (params = {}) => {
  try {
    const authCode = await getTeacherAuthCode();
    if (!authCode) {
      throw new Error('No teacher authentication code found');
    }

    const queryParams = {
      authCode,
      ...params,
    };

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GET_NOTIFICATION_STATISTICS,
      queryParams
    );
    return await makeApiRequest(url);
  } catch (error) {
    console.error('TEACHER NOTIFICATION SERVICE: Error fetching notification statistics:', error);
    throw error;
  }
};

// Export the auth code getter for use in other teacher-specific contexts
export { getTeacherAuthCode };

