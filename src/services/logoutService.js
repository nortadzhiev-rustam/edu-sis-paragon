/**
 * Logout Service
 * Handles comprehensive cleanup of user data, notifications, and background services
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { clearNotificationHistory } from '../utils/messaging';
import guardianStorageService from './guardianStorageService';
import {
  removeCurrentUserFromDevice,
  removeStudentFromDevice,
  logoutUserFromDevice,
} from './deviceService';
import { getUserDataStorageKey, getAllLoggedInUsers } from './authService';

/**
 * Check if shared data should be cleared (only if no other users are logged in)
 * @param {string} currentUserType - The user type that is logging out
 * @returns {Promise<boolean>} - True if shared data should be cleared
 */
const shouldClearSharedData = async (currentUserType) => {
  try {
    const allUsers = await getAllLoggedInUsers(AsyncStorage);
    const otherUsers = Object.keys(allUsers).filter(
      (userType) => userType !== currentUserType
    );

    console.log(
      `🔍 LOGOUT: Checking for other active users besides ${currentUserType}:`,
      otherUsers
    );

    // Only clear shared data if no other users are logged in
    return otherUsers.length === 0;
  } catch (error) {
    console.error('❌ LOGOUT: Error checking for other users:', error);
    // If we can't determine, err on the side of caution and don't clear shared data
    return false;
  }
};

/**
 * Comprehensive logout function that cleans up all user data
 * @param {Object} options - Logout options
 * @param {string} options.userType - The type of user logging out (teacher, parent, student)
 * @param {boolean} options.clearDeviceToken - Whether to clear device token (default: false)
 * @param {boolean} options.clearAllData - Whether to clear all app data (default: false)
 * @param {Function} options.messagingCleanup - Optional messaging context cleanup function
 * @param {Function} options.notificationCleanup - Optional notification context cleanup function
 */
export const performLogout = async (options = {}) => {
  const {
    userType,
    clearDeviceToken = false,
    clearAllData = false,
    messagingCleanup,
    notificationCleanup,
  } = options;

  console.log('🚪 LOGOUT: Starting comprehensive logout process...');

  try {
    // 0. Clean up context states first
    if (messagingCleanup && typeof messagingCleanup === 'function') {
      console.log('💬 LOGOUT: Cleaning up messaging context...');
      messagingCleanup();
    }

    if (notificationCleanup && typeof notificationCleanup === 'function') {
      console.log('🔔 LOGOUT: Cleaning up notification context...');
      notificationCleanup();
    }
    // 1. Remove user from device using new authCode-based logout method
    console.log('� LOGOUT: Removing user from device using authCode...');
    try {
      // Get user data for the specific user type logging out
      const currentUserType = userType || 'unknown';
      let authCode = null;

      // Try to get auth code from user-type-specific storage first
      if (currentUserType !== 'unknown') {
        const userTypeKey = getUserDataStorageKey(currentUserType);
        const userTypeData = await AsyncStorage.getItem(userTypeKey);
        if (userTypeData) {
          const user = JSON.parse(userTypeData);
          authCode = user.authCode || user.auth_code;
          console.log(
            `👤 LOGOUT: Using ${currentUserType} user data for logout`
          );
          console.log(
            `🔑 LOGOUT: Auth code from ${currentUserType} data: ${
              authCode ? 'Yes' : 'No'
            }`
          );
        }
      }

      // Fallback to generic userData if no user-type-specific data found
      if (!authCode) {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          authCode = user.authCode || user.auth_code;
          console.log(
            `🔑 LOGOUT: Fallback auth code from generic userData: ${
              authCode ? 'Yes' : 'No'
            }`
          );
        }
      }

      // Check if there are student accounts on this device (parent accounts)
      const studentAccounts = await AsyncStorage.getItem('studentAccounts');
      const hasStudentAccounts =
        studentAccounts && JSON.parse(studentAccounts).length > 0;

      console.log(
        `👨‍👩‍👧‍👦 LOGOUT: Student accounts on device: ${
          hasStudentAccounts ? 'Yes' : 'No'
        }`
      );

      // Decision logic for device removal - check for other active users
      const noOtherUsersActive = await shouldClearSharedData(currentUserType);

      if (currentUserType === 'teacher' && hasStudentAccounts) {
        console.log('🏫 LOGOUT: Teacher logout with student accounts present');
        console.log(
          'ℹ️ LOGOUT: Skipping device removal to preserve student notifications'
        );
        console.log(
          '✅ LOGOUT: Teacher will stop receiving notifications via local data cleanup'
        );
      } else if (!noOtherUsersActive) {
        console.log(
          `🔒 LOGOUT: Skipping device logout - other users still active`
        );
        console.log(
          'ℹ️ LOGOUT: Device registration preserved for remaining users'
        );
      } else if (authCode) {
        // Use new authCode-based logout method
        console.log('� LOGOUT: Using new authCode-based logout method...');
        const logoutResult = await logoutUserFromDevice(authCode);
        if (logoutResult.success) {
          console.log('✅ LOGOUT: User successfully logged out from device');
          console.log('📊 LOGOUT: Response:', logoutResult.message);
        } else {
          console.warn(
            '⚠️ LOGOUT: Failed to logout from device:',
            logoutResult.error
          );

          // Fallback to old method if new method fails
          console.log('🔄 LOGOUT: Falling back to old removal method...');
          const fallbackResult = await removeCurrentUserFromDevice();
          if (fallbackResult.success) {
            console.log('✅ LOGOUT: Fallback removal successful');
          } else {
            console.warn(
              '⚠️ LOGOUT: Fallback removal also failed:',
              fallbackResult.error
            );
          }
        }
      } else {
        // No authCode available, use old method
        console.log(
          '� LOGOUT: No authCode available, using old removal method...'
        );
        const deviceRemovalResult = await removeCurrentUserFromDevice();
        if (deviceRemovalResult.success) {
          console.log(
            '✅ LOGOUT: User successfully removed from device database'
          );
        } else {
          console.warn(
            '⚠️ LOGOUT: Failed to remove user from device database:',
            deviceRemovalResult.error
          );
        }
      }
    } catch (error) {
      console.error('❌ LOGOUT: Error during device removal:', error);
      // Continue with logout even if device removal fails
    }

    // 1.5. Note: We don't unregister FCM completely during logout because:
    // - It would affect all users on the device (including students in parent accounts)
    // - The backend database removal (step 1) already prevents notifications for this user
    // - FCM token should remain active for other users who might still be logged in
    console.log(
      'ℹ️ LOGOUT: Keeping FCM active for other potential users on device'
    );
    console.log(
      '✅ LOGOUT: User-specific notifications stopped via backend database removal'
    );

    // 2. Clear app icon badge immediately
    console.log('📱 LOGOUT: Clearing app icon badge...');
    await Notifications.setBadgeCountAsync(0);

    // 3. Clear user data (user-type-specific)
    console.log('👤 LOGOUT: Clearing user data...');
    if (userType) {
      const userStorageKey = getUserDataStorageKey(userType);
      console.log(
        `👤 LOGOUT: Clearing ${userType} user data from key: ${userStorageKey}`
      );
      await AsyncStorage.removeItem(userStorageKey);

      // Only clear generic userData if it matches the current user type
      try {
        const genericUserData = await AsyncStorage.getItem('userData');
        if (genericUserData) {
          const parsed = JSON.parse(genericUserData);
          if (parsed.userType === userType) {
            console.log(
              '👤 LOGOUT: Clearing generic userData as it matches current user type'
            );
            await AsyncStorage.removeItem('userData');
          } else {
            console.log(
              `👤 LOGOUT: Preserving generic userData (different user type: ${parsed.userType})`
            );
          }
        }
      } catch (error) {
        console.warn('⚠️ LOGOUT: Error checking generic userData:', error);
        // Don't clear generic userData if we can't parse it - it might belong to another user
        console.log(
          '⚠️ LOGOUT: Preserving generic userData due to parsing error (might belong to another user)'
        );
      }
    } else {
      // Fallback: clear all user data if userType not specified
      console.log('👤 LOGOUT: No userType specified, clearing all user data');
      await AsyncStorage.removeItem('userData');
    }
    await AsyncStorage.removeItem('calendarUserData'); // Clear temporary calendar user data

    // 3.1. Clear guardian data
    console.log('🛡️ LOGOUT: Clearing guardian data...');
    await guardianStorageService.clearGuardianData();

    // 4. Clear notification history and related data (only if no other users)
    console.log(
      '🔔 LOGOUT: Checking if notification data should be cleared...'
    );
    const shouldClearNotifications = await shouldClearSharedData(userType);
    if (shouldClearNotifications) {
      console.log(
        '🔔 LOGOUT: Clearing notification data (no other active users)...'
      );
      await clearNotificationHistory();
      await AsyncStorage.removeItem('notificationHistory');
    } else {
      console.log(
        '🔔 LOGOUT: Preserving notification data (other users still active)...'
      );
    }

    // 5. Clear messaging data (only if no other users)
    console.log('💬 LOGOUT: Checking if messaging data should be cleared...');
    if (shouldClearNotifications) {
      console.log(
        '💬 LOGOUT: Clearing messaging data (no other active users)...'
      );
      const messagingKeys = [
        'conversationHistory',
        'unreadConversations',
        'messagingCache',
        'lastMessageUpdate',
      ];
      await AsyncStorage.multiRemove(messagingKeys);
    } else {
      console.log(
        '💬 LOGOUT: Preserving messaging data (other users still active)...'
      );
    }

    // 7. Clear cached user-specific data based on user type
    console.log(`🗂️ LOGOUT: Clearing ${userType}-specific cached data...`);

    let cacheKeys = [];

    if (userType === 'parent') {
      // Only clear parent/student-related cache
      cacheKeys = [
        'selectedStudent',
        'selectedStudentId',
        'studentGrades',
        'attendanceData',
        'homeworkData',
        'libraryData',
        'healthData',
      ];
    } else if (userType === 'teacher') {
      // Only clear teacher-related cache
      cacheKeys = [
        'teacherTimetable',
        'selectedBranch',
        'selectedBranchId',
        'bpsData',
      ];
    } else if (userType === 'student') {
      // Only clear student-related cache (selectedStudent/selectedStudentId cleared separately)
      cacheKeys = [
        'studentGrades',
        'attendanceData',
        'homeworkData',
        'libraryData',
        'healthData',
      ];
    } else {
      // Fallback: clear all cache if userType not specified
      cacheKeys = [
        'selectedStudent',
        'selectedStudentId',
        'selectedBranch',
        'selectedBranchId',
        'teacherTimetable',
        'studentGrades',
        'attendanceData',
        'homeworkData',
        'libraryData',
        'bpsData',
        'healthData',
      ];
    }

    if (cacheKeys.length > 0) {
      console.log(
        `🗂️ LOGOUT: Removing ${cacheKeys.length} cache keys for ${userType}:`,
        cacheKeys
      );
      await AsyncStorage.multiRemove(cacheKeys);
    }

    // 8. Handle student accounts based on user type and logout type
    if (clearAllData) {
      console.log('👨‍👩‍👧‍👦 LOGOUT: Clearing student accounts (complete logout)...');
      await AsyncStorage.removeItem('studentAccounts');
    } else if (userType === 'student') {
      console.log(
        '👨‍👩‍👧‍👦 LOGOUT: Student logout - clearing student-specific data...'
      );

      // Get student identifiers for dynamic key cleanup
      let studentAuthCode = null;
      let studentId = null;

      try {
        const studentStorageKey = getUserDataStorageKey('student');
        const studentData = await AsyncStorage.getItem(studentStorageKey);
        if (studentData) {
          const parsed = JSON.parse(studentData);
          studentAuthCode = parsed.authCode || parsed.auth_code;
          studentId = parsed.id || parsed.user_id || parsed.userId;
        }
      } catch (error) {
        console.warn('⚠️ LOGOUT: Error getting student identifiers:', error);
      }

      // Clear basic student data
      await AsyncStorage.multiRemove([
        'studentAccounts',
        'selectedStudent',
        'selectedStudentId',
      ]);

      // Clear dynamic student keys if we have identifiers
      if (studentAuthCode || studentId) {
        console.log('🔍 LOGOUT: Clearing dynamic student keys...');
        const dynamicKeys = [];

        if (studentAuthCode) {
          dynamicKeys.push(
            `grades_${studentAuthCode}`,
            `homework_${studentAuthCode}`,
            `attendance_${studentAuthCode}`,
            `timetable_${studentAuthCode}`,
            `library_${studentAuthCode}`,
            `bps_${studentAuthCode}`,
            `notifications_${studentAuthCode}`,
            `student_cache_${studentAuthCode}`
          );
        }

        if (studentId) {
          dynamicKeys.push(`student_data_${studentId}`);
        }

        if (dynamicKeys.length > 0) {
          await AsyncStorage.multiRemove(dynamicKeys);
          console.log(
            `🔍 LOGOUT: Cleared ${dynamicKeys.length} dynamic student keys`
          );
        }
      }

      console.log(
        '✅ LOGOUT: Student accounts and all student-specific data cleared'
      );
    } else {
      console.log(
        '👨‍👩‍👧‍👦 LOGOUT: Preserving student accounts (parent/teacher logout)...'
      );
      console.log(
        'ℹ️ LOGOUT: Student accounts remain for parent dashboard access'
      );
    }

    // 9. Optionally clear device token (usually not needed unless switching devices)
    if (clearDeviceToken) {
      console.log('📱 LOGOUT: Clearing device token...');
      await AsyncStorage.multiRemove(['deviceToken', 'fcmToken']);
    }

    // 10. If clearAllData is true, clear everything including device-specific data
    if (clearAllData) {
      console.log('🧹 LOGOUT: Clearing all app data...');
      const allKeys = await AsyncStorage.getAllKeys();
      // Keep only essential device keys if not clearing device token
      const keysToKeep = clearDeviceToken ? [] : ['deviceToken', 'fcmToken'];
      const keysToRemove = allKeys.filter((key) => !keysToKeep.includes(key));

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`🧹 LOGOUT: Cleared ${keysToRemove.length} storage keys`);
      }
    } else {
      // 11. Clear any remaining user-specific keys by pattern matching
      console.log('🔍 LOGOUT: Clearing remaining user-specific data...');
      const allKeys = await AsyncStorage.getAllKeys();

      // Patterns that indicate user-specific data
      const userDataPatterns = [
        /^grades_/,
        /^homework_/,
        /^attendance_/,
        /^timetable_/,
        /^library_/,
        /^bps_/,
        /^notifications_/,
        /^student_data_/,
        /^student_cache_/,
        /^teacher_/,
        /^parent_/,
        /_cache$/,
        /_history$/,
      ];

      const userSpecificKeys = allKeys.filter((key) =>
        userDataPatterns.some((pattern) => pattern.test(key))
      );

      if (userSpecificKeys.length > 0) {
        await AsyncStorage.multiRemove(userSpecificKeys);
        console.log(
          `🔍 LOGOUT: Cleared ${userSpecificKeys.length} user-specific keys`
        );
      }
    }

    console.log('✅ LOGOUT: Comprehensive logout completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ LOGOUT: Error during logout process:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Quick logout function for basic cleanup (backwards compatibility)
 * @param {string} userType - The type of user logging out (teacher, parent, student)
 */
export const quickLogout = async (userType) => {
  return await performLogout({
    userType,
    clearDeviceToken: false,
    clearAllData: false,
  });
};

/**
 * Complete logout function that clears everything including device data
 * This also unregisters FCM - use only when switching devices or complete reset
 * @param {string} userType - The type of user logging out (teacher, parent, student)
 */
export const completeLogout = async (userType) => {
  return await performLogout({
    userType,
    clearDeviceToken: true,
    clearAllData: true,
    unregisterFCM: true, // This will unregister FCM completely
  });
};

/**
 * Manual cleanup of student data from AsyncStorage
 * Use this to clean up any stuck student data after logout issues
 */
export const cleanupStudentDataFromStorage = async () => {
  console.log('🧹 MANUAL CLEANUP: Starting student data cleanup...');

  try {
    // 1. Clear basic student storage keys
    const basicKeys = [
      'studentUserData',
      'studentAccounts',
      'selectedStudent',
      'selectedStudentId',
      'studentGrades',
      'attendanceData',
      'homeworkData',
      'libraryData',
      'healthData',
    ];

    await AsyncStorage.multiRemove(basicKeys);
    console.log(
      `🧹 MANUAL CLEANUP: Cleared ${basicKeys.length} basic student keys`
    );

    // 2. Clear generic userData if it contains student data
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.userType === 'student') {
          await AsyncStorage.removeItem('userData');
          console.log(
            '🧹 MANUAL CLEANUP: Cleared generic userData (contained student data)'
          );
        }
      }
    } catch (error) {
      console.warn(
        '⚠️ MANUAL CLEANUP: Error checking generic userData:',
        error
      );
    }

    // 3. Find and clear dynamic student keys
    const allKeys = await AsyncStorage.getAllKeys();
    const studentPatterns = [
      /^grades_/,
      /^homework_/,
      /^attendance_/,
      /^timetable_/,
      /^library_/,
      /^bps_/,
      /^notifications_/,
      /^student_data_/,
      /^student_cache_/,
    ];

    const dynamicStudentKeys = allKeys.filter((key) =>
      studentPatterns.some((pattern) => pattern.test(key))
    );

    if (dynamicStudentKeys.length > 0) {
      await AsyncStorage.multiRemove(dynamicStudentKeys);
      console.log(
        `🧹 MANUAL CLEANUP: Cleared ${dynamicStudentKeys.length} dynamic student keys`
      );
    }

    console.log(
      '✅ MANUAL CLEANUP: Student data cleanup completed successfully'
    );
    return { success: true, message: 'Student data cleaned up successfully' };
  } catch (error) {
    console.error(
      '❌ MANUAL CLEANUP: Error during student data cleanup:',
      error
    );
    return { success: false, error: error.message };
  }
};

/**
 * Complete device reset - unregisters FCM and clears all data
 * Use this when switching devices or doing a factory reset
 */
export const performDeviceReset = async () => {
  console.log('🔄 DEVICE RESET: Starting complete device reset...');

  try {
    // Import FCM unregistration function only when needed
    const { unregisterDeviceFromFCM } = await import('../utils/messaging');

    // 1. Unregister device from FCM completely
    console.log('🚫 DEVICE RESET: Unregistering device from FCM...');
    try {
      const fcmResult = await unregisterDeviceFromFCM();
      if (fcmResult.success) {
        console.log(
          '✅ DEVICE RESET: Device successfully unregistered from FCM'
        );
      } else {
        console.warn(
          '⚠️ DEVICE RESET: Failed to unregister device from FCM:',
          fcmResult.error
        );
      }
    } catch (error) {
      console.error(
        '❌ DEVICE RESET: Error unregistering device from FCM:',
        error
      );
    }

    // 2. Perform complete logout with all data clearing
    const logoutResult = await performLogout({
      clearDeviceToken: true,
      clearAllData: true,
    });

    if (logoutResult.success) {
      console.log('✅ DEVICE RESET: Complete device reset successful');
      return { success: true, message: 'Device reset completed successfully' };
    } else {
      console.error(
        '❌ DEVICE RESET: Logout portion failed:',
        logoutResult.error
      );
      return { success: false, error: logoutResult.error };
    }
  } catch (error) {
    console.error('❌ DEVICE RESET: Error during device reset:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Student removal cleanup (for parent users)
 * @param {Object} studentData - Student data to remove
 */
export const cleanupStudentData = async (studentData) => {
  console.log(
    `🧹 STUDENT CLEANUP: Cleaning up data for student ${studentData.name}...`
  );

  try {
    // 1. Remove student from device in database first
    console.log('🔌 STUDENT CLEANUP: Removing student from device database...');
    try {
      const deviceRemovalResult = await removeStudentFromDevice(studentData);
      if (deviceRemovalResult.success) {
        console.log(
          '✅ STUDENT CLEANUP: Student successfully removed from device database'
        );
      } else {
        console.warn(
          '⚠️ STUDENT CLEANUP: Failed to remove student from device database:',
          deviceRemovalResult.error
        );
        // Continue with cleanup even if device removal fails
      }
    } catch (error) {
      console.error(
        '❌ STUDENT CLEANUP: Error removing student from device database:',
        error
      );
      // Continue with cleanup even if device removal fails
    }

    // 2. Clean up student-specific cache keys
    const studentSpecificKeys = [
      `grades_${studentData.authCode}`,
      `homework_${studentData.authCode}`,
      `attendance_${studentData.authCode}`,
      `timetable_${studentData.authCode}`,
      `library_${studentData.authCode}`,
      `bps_${studentData.authCode}`,
      `notifications_${studentData.authCode}`,
      `student_data_${studentData.id}`,
      `student_cache_${studentData.authCode}`,
    ];

    // Remove known student-specific keys
    await AsyncStorage.multiRemove(studentSpecificKeys);

    // Clean up notification history for this student
    try {
      const notificationHistory = await AsyncStorage.getItem(
        'notificationHistory'
      );
      if (notificationHistory) {
        const notifications = JSON.parse(notificationHistory);
        if (Array.isArray(notifications)) {
          const filteredNotifications = notifications.filter(
            (notification) =>
              !(
                notification.studentAuthCode === studentData.authCode ||
                notification.authCode === studentData.authCode ||
                notification.studentId === studentData.id
              )
          );

          if (filteredNotifications.length !== notifications.length) {
            await AsyncStorage.setItem(
              'notificationHistory',
              JSON.stringify(filteredNotifications)
            );
            console.log(
              '🔔 STUDENT CLEANUP: Cleaned up student-specific notifications'
            );
          }
        }
      }
    } catch (error) {
      console.log(
        '⚠️ STUDENT CLEANUP: Could not clean notification history:',
        error
      );
    }

    // Find and remove any dynamic keys containing student identifiers
    const allKeys = await AsyncStorage.getAllKeys();
    const dynamicStudentKeys = allKeys.filter(
      (key) =>
        key.includes(studentData.id) ||
        key.includes(studentData.authCode) ||
        (studentData.username && key.includes(studentData.username))
    );

    if (dynamicStudentKeys.length > 0) {
      await AsyncStorage.multiRemove(dynamicStudentKeys);
      console.log(
        `🔍 STUDENT CLEANUP: Removed ${dynamicStudentKeys.length} dynamic student keys`
      );
    }

    console.log('✅ STUDENT CLEANUP: Student data cleanup completed');
    return { success: true };
  } catch (error) {
    console.error('❌ STUDENT CLEANUP: Error during student cleanup:', error);
    return { success: false, error: error.message };
  }
};
