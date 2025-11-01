/**
 * Student Notification Service
 * Handles all notification-related API calls specifically for students
 * This service ONLY uses student authCode to prevent cross-contamination with other user types
 */

import { Config, buildApiUrl } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserData } from './authService';

// Helper function to get student auth code from storage
const getStudentAuthCode = async () => {
  try {
    console.log('🔑 STUDENT NOTIFICATION SERVICE: Getting student auth code...');

    const studentData = await getUserData('student', AsyncStorage);
    if (studentData && (studentData.authCode || studentData.auth_code)) {
      const authCode = studentData.authCode || studentData.auth_code;
      console.log(
        '🔑 STUDENT NOTIFICATION SERVICE: Using student auth code:',
        authCode?.substring(0, 8) + '...',
        'Student name:',
        studentData.name || studentData.user_name
      );
      return authCode;
    }

    console.warn('⚠️ STUDENT NOTIFICATION SERVICE: No student auth code found');
    return null;
  } catch (error) {
    console.error('❌ STUDENT NOTIFICATION SERVICE: Error getting auth code:', error);
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
    console.error('STUDENT NOTIFICATION SERVICE: API request failed:', error);
    throw error;
  }
};

/**
 * Get student notifications list with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.category - Filter by category (optional)
 * @returns {Promise<Object>} - Notifications data
 */
export const getStudentNotifications = async (params = {}) => {
  try {
    const authCode = await getStudentAuthCode();
    if (!authCode) {
      throw new Error('No student authentication code found');
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
    console.error('STUDENT NOTIFICATION SERVICE: Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark a student notification as read
 * @param {number} notificationId - ID of the notification to mark as read
 * @returns {Promise<Object>} - Response data
 */
export const markStudentNotificationAsRead = async (notificationId) => {
  try {
    const authCode = await getStudentAuthCode();
    if (!authCode) {
      throw new Error('No student authentication code found');
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
    console.error('STUDENT NOTIFICATION SERVICE: Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all student notifications as read
 * @returns {Promise<Object>} - Response data
 */
export const markAllStudentNotificationsAsRead = async () => {
  try {
    console.log('🎓 STUDENT NOTIFICATION SERVICE: markAllStudentNotificationsAsRead called');

    const authCode = await getStudentAuthCode();
    if (!authCode) {
      console.error('❌ STUDENT NOTIFICATION SERVICE: No student authentication code found');
      throw new Error('No student authentication code found');
    }

    console.log('🎓 STUDENT NOTIFICATION SERVICE: Marking all notifications as read with authCode:', authCode.substring(0, 8) + '...');

    const url = buildApiUrl(Config.API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ);
    console.log('🎓 STUDENT NOTIFICATION SERVICE: API URL:', url);

    const response = await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
      }),
    });

    console.log('✅ STUDENT NOTIFICATION SERVICE: Mark all as read response:', response);
    return response;
  } catch (error) {
    console.error('❌ STUDENT NOTIFICATION SERVICE: Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get notification categories for students
 * @returns {Promise<Object>} - Categories data
 */
export const getStudentNotificationCategories = async () => {
  try {
    const authCode = await getStudentAuthCode();
    if (!authCode) {
      throw new Error('No student authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_NOTIFICATION_CATEGORIES, {
      authCode,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('STUDENT NOTIFICATION SERVICE: Error fetching notification categories:', error);
    throw error;
  }
};

// Export the auth code getter for use in other student-specific contexts
export { getStudentAuthCode };

