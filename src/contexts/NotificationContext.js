import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  getNotificationHistory,
  getUnreadNotificationCount,
  markNotificationAsRead as markLocalNotificationAsRead,
  clearNotificationHistory,
  setupLocalNotifications,
} from '../utils/messaging';
// Import user-type-specific notification services
import {
  getTeacherNotifications,
  markTeacherNotificationAsRead,
  markAllTeacherNotificationsAsRead,
  getTeacherNotificationCategories,
  sendTeacherNotification,
  getTeacherNotificationStatistics,
} from '../services/teacherNotificationService';
import {
  getParentNotifications,
  markParentNotificationAsRead,
  markAllParentNotificationsAsRead,
  getParentNotificationCategories,
} from '../services/parentNotificationService';
import {
  getStudentNotifications,
  markStudentNotificationAsRead,
  markAllStudentNotificationsAsRead,
  getStudentNotificationCategories,
} from '../services/studentNotificationService';
// Keep legacy service for backward compatibility
import { getNotifications as getAPINotifications } from '../services/notificationService';
import { Config, buildApiUrl } from '../config/env';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Student-specific notifications for parent view
  const [studentNotifications, setStudentNotifications] = useState({});
  const [studentUnreadCounts, setStudentUnreadCounts] = useState({});
  const [currentStudentAuthCode, setCurrentStudentAuthCode] = useState(null);

  // Detect current user type from AsyncStorage by checking user-type-specific keys
  const detectUserType = async () => {
    try {
      console.log('🔍 NOTIFICATION CONTEXT: Starting user type detection...');

      // Check user-type-specific storage keys directly
      // This is more reliable than using the generic userData key
      const teacherData = await AsyncStorage.getItem(
        Config.STORAGE_KEYS.TEACHER_USER_DATA
      );
      const parentData = await AsyncStorage.getItem(
        Config.STORAGE_KEYS.PARENT_USER_DATA
      );
      const studentData = await AsyncStorage.getItem(
        Config.STORAGE_KEYS.STUDENT_USER_DATA
      );

      console.log('🔍 NOTIFICATION CONTEXT: Storage keys check:', {
        hasTeacherData: !!teacherData,
        hasParentData: !!parentData,
        hasStudentData: !!studentData,
      });

      // Now check the generic userData key to see which user is currently active
      const currentUserData = await AsyncStorage.getItem('userData');
      if (currentUserData) {
        const parsed = JSON.parse(currentUserData);
        console.log(
          '🔍 NOTIFICATION CONTEXT: Current active user from userData:',
          {
            userType: parsed.userType,
            username: parsed.username,
            name: parsed.name,
          }
        );

        // Verify that the user type actually has data in storage
        if (parsed.userType === 'teacher' && teacherData) {
          console.log('✅ NOTIFICATION CONTEXT: Detected user type: teacher');
          return 'teacher';
        } else if (parsed.userType === 'parent' && parentData) {
          console.log('✅ NOTIFICATION CONTEXT: Detected user type: parent');
          return 'parent';
        } else if (parsed.userType === 'student' && studentData) {
          console.log('✅ NOTIFICATION CONTEXT: Detected user type: student');
          return 'student';
        }
      }

      // Fallback: if no userData key, check which user-type-specific keys exist
      // Priority: parent > teacher > student
      console.log(
        '⚠️ NOTIFICATION CONTEXT: No userData key, checking user-type-specific keys...'
      );

      if (parentData) {
        console.log(
          '🔔 NOTIFICATION CONTEXT: Detected user type: parent (from parentUserData)'
        );
        return 'parent';
      }

      if (teacherData) {
        console.log(
          '🔔 NOTIFICATION CONTEXT: Detected user type: teacher (from teacherUserData)'
        );
        return 'teacher';
      }

      if (studentData) {
        console.log(
          '🔔 NOTIFICATION CONTEXT: Detected user type: student (from studentUserData)'
        );
        return 'student';
      }

      console.warn('⚠️ NOTIFICATION CONTEXT: No user type detected');
      return null;
    } catch (error) {
      console.error(
        '❌ NOTIFICATION CONTEXT: Error detecting user type:',
        error
      );
      return null;
    }
  };

  // Get the appropriate notification service based on user type
  const getNotificationService = (userType) => {
    switch (userType) {
      case 'teacher':
        return {
          getNotifications: getTeacherNotifications,
          markAsRead: markTeacherNotificationAsRead,
          markAllAsRead: markAllTeacherNotificationsAsRead,
          getCategories: getTeacherNotificationCategories,
          sendNotification: sendTeacherNotification,
          getStatistics: getTeacherNotificationStatistics,
        };
      case 'parent':
        return {
          getNotifications: getParentNotifications,
          markAsRead: markParentNotificationAsRead,
          markAllAsRead: markAllParentNotificationsAsRead,
          getCategories: getParentNotificationCategories,
        };
      case 'student':
        return {
          getNotifications: getStudentNotifications,
          markAsRead: markStudentNotificationAsRead,
          markAllAsRead: markAllStudentNotificationsAsRead,
          getCategories: getStudentNotificationCategories,
        };
      default:
        // Fallback to legacy service
        console.warn(
          '⚠️ NOTIFICATION CONTEXT: Using legacy notification service'
        );
        return {
          getNotifications: getAPINotifications,
          markAsRead: null,
          markAllAsRead: null,
          getCategories: null,
        };
    }
  };

  // Update app icon badge when unread count changes
  const updateAppIconBadge = async (count) => {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log(`📱 BADGE: App icon badge updated to ${count}`);
    } catch (error) {
      console.error('❌ BADGE: Error updating app icon badge:', error);
    }
  };

  // Calculate total unread count including student notifications for parent users
  const getTotalUnreadCount = () => {
    // Get total unread count from all student notifications
    const studentUnreadTotal = Object.values(studentUnreadCounts).reduce(
      (total, count) => total + count,
      0
    );

    // Return the higher of main unread count or student unread total
    // This handles both teacher/student accounts and parent accounts
    return Math.max(unreadCount, studentUnreadTotal);
  };

  // Update app icon badge whenever unread count or student unread counts change
  useEffect(() => {
    const totalUnread = getTotalUnreadCount();
    updateAppIconBadge(totalUnread);
  }, [unreadCount, studentUnreadCounts]);

  // Load notifications on mount and when app becomes active
  useEffect(() => {
    loadNotifications();
    setupLocalNotifications();

    // Add app state listener to refresh notifications when app becomes active
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log(
          '🔔 NOTIFICATION CONTEXT: App became active, refreshing notifications'
        );
        loadNotifications();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Add debouncing to prevent excessive API calls
  const lastLoadTime = React.useRef(0);
  const lastUserType = React.useRef(null);
  const isLoading = React.useRef(false);

  // Load notifications from API and local storage
  const loadNotifications = async (forcedUserType = null, forcedAuthCode = null) => {
    try {
      // Prevent multiple simultaneous calls
      if (isLoading.current) {
        console.log('🔔 NOTIFICATION CONTEXT: Already loading, skipping...');
        return;
      }

      // Use forced user type if provided, otherwise detect from storage
      let userType = forcedUserType;
      if (!userType) {
        userType = await detectUserType();
      }

      if (!userType) {
        console.warn(
          '⚠️ NOTIFICATION CONTEXT: No user type detected, skipping API call'
        );
        setLoading(false);
        isLoading.current = false;
        return;
      }

      // Debounce: only allow calls every 5 seconds for the SAME user type
      // If user type changes, bypass debounce to ensure fresh data
      const now = Date.now();
      const timeSinceLastLoad = now - lastLoadTime.current;
      const isSameUserType = lastUserType.current === userType;

      if (isSameUserType && timeSinceLastLoad < 5000) {
        console.log(
          `🔔 NOTIFICATION CONTEXT: Debouncing ${userType} notifications (${timeSinceLastLoad}ms since last load)`
        );
        return;
      }

      console.log('🔔 NOTIFICATION CONTEXT: Loading notifications for user type:', userType);
      if (!isSameUserType) {
        console.log('🔔 NOTIFICATION CONTEXT: User type changed from', lastUserType.current, 'to', userType, '- bypassing debounce');
      }
      if (forcedAuthCode) {
        console.log('🔔 NOTIFICATION CONTEXT: Using forced authCode:', forcedAuthCode.substring(0, 8) + '...');
      }

      lastLoadTime.current = now;
      lastUserType.current = userType;
      isLoading.current = true;
      setLoading(true);

      const service = getNotificationService(userType);

      // Try to fetch from API first
      try {
        console.log(
          '🔔 NOTIFICATION CONTEXT: Loading notifications from API for user type:',
          userType
        );
        const apiResponse = await service.getNotifications({
          page: 1,
          limit: 50,
        });
        console.log('🔔 NOTIFICATION CONTEXT: API response:', {
          success: apiResponse?.success,
          dataCount: apiResponse?.data?.length || 0,
          notificationsCount: apiResponse?.notifications?.length || 0,
          firstNotification:
            apiResponse?.data?.[0] || apiResponse?.notifications?.[0],
        });

        if (
          apiResponse?.success &&
          (apiResponse?.data || apiResponse?.notifications)
        ) {
          // Handle both data and notifications response formats
          const notificationArray =
            apiResponse.notifications || apiResponse.data;

          // Transform API data to match local notification format
          const apiNotifications = notificationArray.map((notification) => ({
            id:
              notification.notification_id?.toString() ||
              notification.id?.toString() ||
              Date.now().toString(),
            title: notification.title || 'Notification',
            body: notification.body || notification.message || '',
            timestamp: notification.created_at
              ? new Date(notification.created_at).getTime()
              : Date.now(),
            read: !!notification.read_at || !!notification.is_read,
            type: notification.type || notification.category || 'general',
            data: notification.data || {},
            // Keep original API data for reference
            _apiData: notification,
          }));

          console.log('🔔 NOTIFICATION CONTEXT: Processed notifications:', {
            count: apiNotifications.length,
            types: [...new Set(apiNotifications.map((n) => n.type))],
            titles: apiNotifications.slice(0, 3).map((n) => n.title),
          });

          setNotifications(apiNotifications);
          setUnreadCount(apiNotifications.filter((n) => !n.read).length);

          // Also store in local storage as backup
          await AsyncStorage.setItem(
            'notificationHistory',
            JSON.stringify(apiNotifications)
          );
          return;
        }
      } catch (apiError) {
        // API notifications not available, falling back to local storage
      }

      // Fallback to local storage if API fails
      const [notificationHistory, unreadNotificationCount] = await Promise.all([
        getNotificationHistory(),
        getUnreadNotificationCount(),
      ]);

      setNotifications(notificationHistory);
      setUnreadCount(unreadNotificationCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      isLoading.current = false;
    }
  };

  // Refresh notifications (with debouncing)
  // Can optionally pass userType and authCode to force loading for a specific user
  const refreshNotifications = React.useCallback(async (userType = null, authCode = null) => {
    await loadNotifications(userType, authCode);
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId, userType = null) => {
    try {
      console.log('📱 NOTIFICATION CONTEXT: markAsRead called with:', {
        notificationId,
        userType,
      });

      // First, check if this is a student notification (has studentAuthCode)
      let targetNotification = null;
      let isStudentNotification = false;
      let studentAuthCode = null;

      // Check main notifications first
      targetNotification = notifications.find((n) => n.id === notificationId);

      // If found in main notifications, check if it's a parent viewing child's notification
      if (targetNotification) {
        // Check if this notification contains child information (parent viewing child's notification)
        let parsedData = null;
        try {
          if (
            targetNotification.data &&
            typeof targetNotification.data === 'string'
          ) {
            parsedData = JSON.parse(targetNotification.data);
          } else if (
            targetNotification._apiData?.data &&
            typeof targetNotification._apiData.data === 'string'
          ) {
            parsedData = JSON.parse(targetNotification._apiData.data);
          }
        } catch (error) {
          console.log(
            'Could not parse notification data for mark as read:',
            error
          );
        }

        // Check if this is a parent viewing a child's notification
        const hasChildInfo =
          targetNotification.studentAuthCode ||
          parsedData?.student_id ||
          parsedData?.studentId ||
          (parsedData?.notification_for === 'parent' &&
            parsedData?.student_name);

        // Get current user type
        try {
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const user = JSON.parse(userData);
            const currentUserType = user.userType;

            if (currentUserType === 'parent' && hasChildInfo) {
              isParentViewingChildNotification = true;
              // Try to get the child's authCode if available
              if (targetNotification.studentAuthCode) {
                studentAuthCode = targetNotification.studentAuthCode;
              } else if (parsedData?.student_name) {
                // Try to find child's authCode by matching student name
                try {
                  const savedStudents = await AsyncStorage.getItem(
                    'studentAccounts'
                  );
                  if (savedStudents) {
                    const students = JSON.parse(savedStudents);
                    const matchingStudent = students.find(
                      (student) => student.name === parsedData.student_name
                    );
                    if (matchingStudent) {
                      studentAuthCode = matchingStudent.authCode;
                      console.log(
                        '📱 NOTIFICATION: Found child authCode by name matching'
                      );
                    }
                  }
                } catch (error) {
                  console.log('Error finding child authCode by name:', error);
                }
              }
              console.log(
                '📱 NOTIFICATION: Parent marking child notification as read',
                {
                  notificationId,
                  hasChildInfo,
                  studentAuthCode:
                    studentAuthCode?.substring(0, 8) + '...' || 'not found',
                  parsedData,
                }
              );
            }
          }
        } catch (error) {
          console.log('Could not get user data for mark as read:', error);
        }
      }

      // If not found in main notifications, check student notifications
      if (!targetNotification) {
        for (const [authCode, studentNotifs] of Object.entries(
          studentNotifications
        )) {
          const found = studentNotifs.find((n) => n.id === notificationId);
          if (found) {
            targetNotification = found;
            isStudentNotification = true;
            studentAuthCode = authCode;
            break;
          }
        }
      }

      if (!targetNotification) {
        console.error('❌ NOTIFICATION CONTEXT: Notification not found in local state:', notificationId);
        console.log('📱 NOTIFICATION CONTEXT: Attempting to mark as read via API anyway...');

        // Even if not found in local state, try to mark as read via API
        // This handles the case where NotificationScreen uses contextNotifications
        if (userType) {
          try {
            const apiResponse = await markAPINotificationAsRead(notificationId, userType);
            if (apiResponse?.success) {
              console.log('✅ NOTIFICATION CONTEXT: Notification marked as read via API (not found in local state)');
              return true;
            }
          } catch (error) {
            console.error('❌ NOTIFICATION CONTEXT: Failed to mark as read via API:', error);
          }
        }
        return false;
      }

      // Try API method first if notification has API data
      if (
        targetNotification?._apiData?.id ||
        targetNotification?._apiData?.notification_id
      ) {
        try {
          // Use the original notification_id from the API data
          const originalNotificationId =
            targetNotification._apiData.notification_id ||
            targetNotification._apiData.id;

          let apiResponse;

          // Use the user-type-specific service to mark as read
          console.log('📱 NOTIFICATION: Using user-type-specific mark as read');
          apiResponse = await markAPINotificationAsRead(originalNotificationId, userType);

          if (apiResponse?.success) {
            // Update local state based on notification type
            if (isStudentNotification && studentAuthCode) {
              // Update student notifications
              setStudentNotifications((prev) => ({
                ...prev,
                [studentAuthCode]: prev[studentAuthCode].map((n) =>
                  n.id === notificationId ? { ...n, read: true } : n
                ),
              }));
              // Update student unread count
              setStudentUnreadCounts((prev) => ({
                ...prev,
                [studentAuthCode]: Math.max(
                  0,
                  (prev[studentAuthCode] || 0) - 1
                ),
              }));
            } else {
              // Update main notifications
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === notificationId ? { ...n, read: true } : n
                )
              );
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            return true;
          }
        } catch (apiError) {
          // API mark as read failed, using local method
        }
      }

      // Fallback to local method
      const success = await markLocalNotificationAsRead(notificationId);
      if (success) {
        // Update local state based on notification type
        if (isStudentNotification && studentAuthCode) {
          // Update student notifications
          setStudentNotifications((prev) => ({
            ...prev,
            [studentAuthCode]: prev[studentAuthCode].map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
          }));
          // Update student unread count
          setStudentUnreadCounts((prev) => ({
            ...prev,
            [studentAuthCode]: Math.max(0, (prev[studentAuthCode] || 0) - 1),
          }));
        } else {
          // Update main notifications
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === notificationId
                ? { ...notification, read: true }
                : notification
            )
          );
          // Update unread count
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
      return success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    try {
      const success = await clearNotificationHistory();
      if (success) {
        setNotifications([]);
        setUnreadCount(0);
        // Clear app icon badge when all notifications are cleared
        await updateAppIconBadge(0);
      }
      return success;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  };

  // Clear notifications for current user (called during logout)
  const clearNotificationsForCurrentUser = async () => {
    try {
      console.log('🧹 NOTIFICATION CONTEXT: Clearing notifications for current user');

      // Clear all notification state
      setNotifications([]);
      setUnreadCount(0);
      setStudentNotifications({});
      setStudentUnreadCounts({});
      setCurrentStudentAuthCode(null);

      // Clear app icon badge
      await updateAppIconBadge(0);

      // Clear local storage
      await clearNotificationHistory();

      console.log('✅ NOTIFICATION CONTEXT: Notifications cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ NOTIFICATION CONTEXT: Error clearing notifications:', error);
      return false;
    }
  };

  // Get notifications by type
  const getNotificationsByType = (type) => {
    return notifications.filter((notification) => notification.type === type);
  };

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return notifications.filter(
      (notification) => notification.timestamp > oneDayAgo
    );
  };

  // Add new notification (for testing or manual additions)
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
      type: 'general',
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  // API-based notification functions

  // Fetch notifications from API
  const fetchNotificationsFromAPI = async (
    page = 1,
    limit = 20,
    category = null
  ) => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (category) params.category = category;

      const response = await getAPINotifications(params);
      return response;
    } catch (error) {
      console.error('Error fetching API notifications:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mark API notification as read
  const markAPINotificationAsRead = async (notificationId, forcedUserType = null) => {
    try {
      // Use forced user type if provided, otherwise detect from storage
      let userType = forcedUserType;
      if (!userType) {
        userType = await detectUserType();
      }

      if (!userType) {
        throw new Error('No user type detected');
      }

      console.log('📱 NOTIFICATION CONTEXT: Marking notification as read for user type:', userType);

      const service = getNotificationService(userType);
      if (!service.markAsRead) {
        throw new Error(
          `Mark as read not supported for user type: ${userType}`
        );
      }

      const response = await service.markAsRead(notificationId);
      if (response?.success) {
        console.log('✅ NOTIFICATION CONTEXT: Notification marked as read successfully');
        // Update local state if needed
        await refreshNotifications(userType);
      }
      return response;
    } catch (error) {
      console.error('Error marking API notification as read:', error);
      return null;
    }
  };

  // Mark all API notifications as read
  const markAllAPINotificationsAsRead = async (forcedUserType = null) => {
    try {
      console.log('📱 NOTIFICATION CONTEXT: markAllAPINotificationsAsRead called with forcedUserType:', forcedUserType);

      // Use forced user type if provided, otherwise detect from storage
      let userType = forcedUserType;
      if (!userType) {
        console.log('📱 NOTIFICATION CONTEXT: No forced userType, detecting from storage...');
        userType = await detectUserType();
      }

      if (!userType) {
        throw new Error('No user type detected');
      }

      console.log(
        '📱 NOTIFICATION CONTEXT: Marking all notifications as read for user type:',
        userType
      );

      const service = getNotificationService(userType);
      console.log('📱 NOTIFICATION CONTEXT: Service for', userType, ':', {
        hasGetNotifications: !!service.getNotifications,
        hasMarkAsRead: !!service.markAsRead,
        hasMarkAllAsRead: !!service.markAllAsRead,
        markAllAsReadFunction: service.markAllAsRead?.name || 'undefined',
      });

      if (!service.markAllAsRead) {
        throw new Error(
          `Mark all as read not supported for user type: ${userType}`
        );
      }

      console.log('📱 NOTIFICATION CONTEXT: Calling service.markAllAsRead()...');
      const response = await service.markAllAsRead();
      console.log('📱 NOTIFICATION CONTEXT: service.markAllAsRead() response:', response);

      if (response?.success) {
        console.log('✅ NOTIFICATION CONTEXT: All notifications marked as read successfully');
        // Update local state with the correct user type
        await refreshNotifications(userType);
      } else {
        console.warn('⚠️ NOTIFICATION CONTEXT: service.markAllAsRead() returned success=false');
      }
      return response;
    } catch (error) {
      console.error('❌ NOTIFICATION CONTEXT: Error marking all API notifications as read:', error);
      console.error('❌ NOTIFICATION CONTEXT: Error stack:', error.stack);
      return null;
    }
  };

  // Mark all student notifications as read (for parent context)
  // NOTE: This is a wrapper for parent viewing student notifications
  // The actual student service function is imported and used in getNotificationService()
  const markAllStudentNotificationsAsReadForParent = async (studentAuthCode) => {
    try {
      console.log('📱 NOTIFICATION CONTEXT: markAllStudentNotificationsAsReadForParent called (parent context)');
      // For parent context, use parent service
      const response = await markAllParentNotificationsAsRead();
      if (response?.success) {
        // In parent proxy system, refresh main notifications instead
        await refreshNotifications();
      }
      return response;
    } catch (error) {
      console.error('Error marking all student notifications as read (parent context):', error);
      return null;
    }
  };

  // Get notification categories
  const fetchNotificationCategories = async () => {
    try {
      const userType = await detectUserType();
      if (!userType) {
        throw new Error('No user type detected');
      }

      const service = getNotificationService(userType);
      if (!service.getCategories) {
        throw new Error(
          `Get categories not supported for user type: ${userType}`
        );
      }

      const response = await service.getCategories();
      return response;
    } catch (error) {
      console.error('Error fetching notification categories:', error);
      return null;
    }
  };

  // Send notification (staff only - teachers)
  const sendNotificationToAPI = async (notificationData) => {
    try {
      const userType = await detectUserType();
      if (userType !== 'teacher') {
        throw new Error('Only teachers can send notifications');
      }

      const service = getNotificationService(userType);
      if (!service.sendNotification) {
        throw new Error('Send notification not supported');
      }

      const response = await service.sendNotification(notificationData);
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  };

  // Get notification statistics (staff only - teachers)
  const fetchNotificationStatistics = async (params = {}) => {
    try {
      const userType = await detectUserType();
      if (userType !== 'teacher') {
        throw new Error('Only teachers can view notification statistics');
      }

      const service = getNotificationService(userType);
      if (!service.getStatistics) {
        throw new Error('Get statistics not supported');
      }

      const response = await service.getStatistics(params);
      return response;
    } catch (error) {
      console.error('Error fetching notification statistics:', error);
      return null;
    }
  };

  // Student-specific notification functions for parent view
  const loadStudentNotifications = async (studentAuthCode) => {
    if (!studentAuthCode) {
      console.error('No studentAuthCode provided to loadStudentNotifications');
      return { notifications: [], unreadCount: 0 };
    }

    try {
      // Create a temporary API call with the student's authCode
      const tempApiCall = async (params) => {
        const url = buildApiUrl(Config.API_ENDPOINTS.GET_NOTIFICATIONS, {
          authCode: studentAuthCode,
          page: params.page || 1,
          limit: params.limit || 50,
          ...params,
        });

        const response = await fetch(url, {
          timeout: Config.NETWORK.TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      };

      const apiResponse = await tempApiCall({ page: 1, limit: 50 });

      if (apiResponse?.success && apiResponse?.notifications) {
        // Transform API data to match local notification format
        const apiNotifications = apiResponse.notifications.map(
          (notification) => ({
            id:
              notification.notification_id?.toString() ||
              notification.id?.toString() ||
              Date.now().toString(),
            title: notification.title || 'Notification',
            body: notification.body || notification.message || '',
            timestamp: notification.created_at
              ? new Date(notification.created_at).getTime()
              : Date.now(),
            read: !!notification.read_at || !!notification.is_read,
            type: notification.type || notification.category || 'general',
            data: notification.data || {},
            studentAuthCode: studentAuthCode,
            _apiData: notification,
          })
        );

        // Store notifications for this student
        setStudentNotifications((prev) => ({
          ...prev,
          [studentAuthCode]: apiNotifications,
        }));

        // Calculate and store unread count for this student
        const unreadCount = apiNotifications.filter((n) => !n.read).length;
        setStudentUnreadCounts((prev) => ({
          ...prev,
          [studentAuthCode]: unreadCount,
        }));

        return { notifications: apiNotifications, unreadCount };
      } else {
        return { notifications: [], unreadCount: 0 };
      }
    } catch (error) {
      console.error('Error loading student notifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  };

  // Set current student for notification context
  const setCurrentStudent = React.useCallback((studentAuthCode) => {
    setCurrentStudentAuthCode(studentAuthCode);
    // In parent proxy system, we don't load individual student notifications
    // All notifications come through the main parent context
  }, []);

  // Get current student's unread count
  const getCurrentStudentUnreadCount = () => {
    if (!currentStudentAuthCode) return 0;
    return studentUnreadCounts[currentStudentAuthCode] || 0;
  };

  // Get current student's notifications
  const getCurrentStudentNotifications = () => {
    if (!currentStudentAuthCode) return [];
    return studentNotifications[currentStudentAuthCode] || [];
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    refreshNotifications,
    markAsRead,
    clearAll,
    clearNotificationsForCurrentUser,
    getNotificationsByType,
    getRecentNotifications,
    addNotification,
    // Badge management
    updateAppIconBadge,
    getTotalUnreadCount,
    // API functions
    fetchNotificationsFromAPI,
    markAPINotificationAsRead,
    markAllAPINotificationsAsRead,
    // NOTE: Removed markAllStudentNotificationsAsRead from exports to avoid shadowing
    // The actual student service function is used via getNotificationService()
    // Parent context uses markAllStudentNotificationsAsReadForParent internally
    fetchNotificationCategories,
    sendNotificationToAPI,
    fetchNotificationStatistics,
    // Student-specific functions for parent view
    loadStudentNotifications,
    setCurrentStudent,
    getCurrentStudentUnreadCount,
    getCurrentStudentNotifications,
    studentNotifications,
    studentUnreadCounts,
    currentStudentAuthCode,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
