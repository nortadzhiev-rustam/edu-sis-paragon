import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faBell,
  faTrash,
  faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from '../components/NotificationItem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAllLoggedInUsers,
  getMostRecentUser,
  getUserData,
} from '../services/authService';

const NotificationScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    clearAll,
    markAsRead,
    markAllAPINotificationsAsRead,
    markAllStudentNotificationsAsRead,
    currentStudentAuthCode,
    studentNotifications,
    studentUnreadCounts,
    setCurrentStudent,
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'behavior', 'attendance', 'grade', 'homework', 'announcement', 'messaging'
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState(null);
  const [contextNotifications, setContextNotifications] = useState([]);
  const [contextUnreadCount, setContextUnreadCount] = useState(0);
  const [contextLoading, setContextLoading] = useState(true);

  // Load notifications for specific user type
  const loadNotificationsForUserType = async (userType) => {
    try {
      setContextLoading(true);
      console.log(
        '📱 NOTIFICATION: Loading notifications for user type:',
        userType
      );

      // Get the auth code for the specific user type
      let authCode = null;
      if (userType === 'teacher') {
        console.log('📱 NOTIFICATION: Fetching teacher data...');
        const teacherData = await getUserData('teacher', AsyncStorage);
        console.log(
          '📱 NOTIFICATION: Teacher data retrieved:',
          teacherData ? 'success' : 'null'
        );
        authCode = teacherData?.authCode || teacherData?.auth_code;
        console.log(
          '📱 NOTIFICATION: Using teacher auth code:',
          authCode?.substring(0, 8) + '...'
        );
      } else if (userType === 'parent') {
        const parentData = await getUserData('parent', AsyncStorage);
        authCode = parentData?.authCode || parentData?.auth_code;
        console.log(
          '📱 NOTIFICATION: Using parent auth code:',
          authCode?.substring(0, 8) + '...'
        );
      } else if (userType === 'student') {
        const studentData = await getUserData('student', AsyncStorage);
        authCode = studentData?.authCode || studentData?.auth_code;
        console.log(
          '📱 NOTIFICATION: Using student auth code:',
          authCode?.substring(0, 8) + '...'
        );
      }

      if (authCode) {
        // Make direct API call with specific auth code
        console.log('📱 NOTIFICATION: Step 1 - Starting API call setup');
        const baseUrl = 'https://sis.paragonisc.edu.kh/mobile-api';
        const endpoint = '/notifications/list';
        console.log('📱 NOTIFICATION: Step 2 - URL components ready');

        const queryParams = new URLSearchParams({
          authCode,
          page: '1',
          limit: '20',
        });
        console.log('📱 NOTIFICATION: Step 3 - Query params created');

        const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;
        console.log(
          '📱 NOTIFICATION: Step 4 - Making API call to:',
          url.replace(authCode, authCode.substring(0, 8) + '...')
        );

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('📱 NOTIFICATION: Step 5 - Fetch completed');

        if (response.ok) {
          const data = await response.json();
          if (data?.success) {
            // Transform API notifications to match expected format
            const transformedNotifications = (data.notifications || []).map(
              (notification) => ({
                ...notification,
                // Ensure consistent field mapping
                id:
                  notification.notification_id?.toString() ||
                  notification.id?.toString() ||
                  Date.now().toString(),
                read: !!notification.read_at || !!notification.is_read,
                // Keep original API data for reference
                _apiData: notification,
              })
            );

            setContextNotifications(transformedNotifications);
            setContextUnreadCount(
              data.unread_count ||
                transformedNotifications.filter((n) => !n.read).length
            );
            console.log(
              '📱 NOTIFICATION: Loaded and transformed',
              transformedNotifications.length,
              'notifications for',
              userType
            );
          } else {
            console.warn(
              '📱 NOTIFICATION: API returned success=false for',
              userType
            );
            setContextNotifications([]);
            setContextUnreadCount(0);
          }
        } else {
          console.warn(
            '📱 NOTIFICATION: API request failed with status:',
            response.status,
            'for',
            userType
          );
          setContextNotifications([]);
          setContextUnreadCount(0);
        }
      } else {
        console.warn('📱 NOTIFICATION: No auth code found for', userType);
        setContextNotifications([]);
        setContextUnreadCount(0);
      }
    } catch (error) {
      console.error(
        '📱 NOTIFICATION: Error loading notifications for',
        userType,
        ':',
        error.message || error
      );
      console.error('📱 NOTIFICATION: Full error details:', error);
      setContextNotifications([]);
      setContextUnreadCount(0);
    } finally {
      setContextLoading(false);
    }
  };

  // Get user type from route params or AsyncStorage
  useEffect(() => {
    const getUserType = async () => {
      try {
        console.log('📱 NOTIFICATION: Starting getUserType function');
        console.log(
          '📱 NOTIFICATION: Route params:',
          JSON.stringify(route?.params, null, 2)
        );

        // First check route params (if passed from parent screen)
        if (route?.params?.userType) {
          console.log(
            '📱 NOTIFICATION: User type from route params:',
            route.params.userType
          );
          console.log(
            '📱 NOTIFICATION: Setting userType state immediately for faster UI response'
          );

          // Set userType immediately so UI can render faster
          setUserType(route.params.userType);

          // Load notifications asynchronously (don't await to avoid blocking UI)
          console.log(
            '📱 NOTIFICATION: Starting async notification loading for:',
            route.params.userType
          );
          loadNotificationsForUserType(route.params.userType)
            .then(() => {
              console.log(
                '📱 NOTIFICATION: Async loading completed for:',
                route.params.userType
              );
            })
            .catch((error) => {
              console.error(
                '📱 NOTIFICATION: Async loading failed for:',
                route.params.userType,
                error
              );
            });

          // If this is a parent viewing student notifications
          if (route.params.userType === 'parent' && route?.params?.authCode) {
            const studentAuthCode = route.params.authCode;
            console.log(
              '📱 NOTIFICATION: Parent viewing student notifications for authCode:',
              studentAuthCode
            );

            // Set the current student context for parent view
            setCurrentStudent(studentAuthCode);

            // In parent proxy system, all notifications come through parent's authCode
            console.log(
              '📱 NOTIFICATION: Parent proxy system - using parent notifications for student:',
              studentAuthCode
            );
          }
          // If this is a student accessing directly (not through parent),
          // notifications are handled by the main notification context
          else if (route.params.userType === 'student') {
            console.log(
              '📱 NOTIFICATION: Direct student access - using main notification context'
            );
          }
          console.log(
            '📱 NOTIFICATION: Early return - route params userType found'
          );
          return;
        }

        console.log(
          '📱 NOTIFICATION: No userType in route params, determining from storage...'
        );

        // Otherwise determine user type from available user data
        // Check which user types are logged in and determine the active one
        const allUsers = await getAllLoggedInUsers(AsyncStorage);
        const loggedInUserTypes = Object.keys(allUsers);

        console.log(
          '📱 NOTIFICATION: Available user types:',
          loggedInUserTypes
        );

        if (loggedInUserTypes.length === 0) {
          // No user data found - user is not logged in
          console.warn(
            '⚠️ NOTIFICATION: No user data found, user not logged in'
          );
          console.log('🔄 NOTIFICATION: Redirecting to home screen...');

          // Navigate back to home screen since no user is logged in
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
          return;
        }

        // Determine the active user type based on navigation context
        // If we have multiple users logged in, we need to determine which one is currently active
        // This should be based on which screen the user came from, not just service priority
        let activeUserType = null;

        // Check if we can determine from navigation state or current screen context
        // For now, we'll use a simple heuristic: if only one user type is logged in, use that
        if (loggedInUserTypes.length === 1) {
          activeUserType = loggedInUserTypes[0];
        } else {
          // Multiple users logged in - we need to make an educated guess
          // Since the user navigated to NotificationScreen without explicit userType,
          // we'll check the most recent user data to see which screen they likely came from
          const mostRecentUser = await getMostRecentUser(AsyncStorage);
          if (mostRecentUser && allUsers[mostRecentUser.userType]) {
            activeUserType = mostRecentUser.userType;
          } else {
            // Fallback to service priority: parent -> teacher -> student
            if (allUsers.parent) {
              activeUserType = 'parent';
            } else if (allUsers.teacher) {
              activeUserType = 'teacher';
            } else if (allUsers.student) {
              activeUserType = 'student';
            }
          }
        }

        if (activeUserType) {
          console.log(
            '📱 NOTIFICATION: Determined active user type:',
            activeUserType,
            'from available types:',
            loggedInUserTypes
          );

          // Set userType immediately for faster UI response
          setUserType(activeUserType);

          // Load notifications asynchronously
          console.log(
            '📱 NOTIFICATION: Starting async notification loading for determined type:',
            activeUserType
          );
          loadNotificationsForUserType(activeUserType)
            .then(() => {
              console.log(
                '📱 NOTIFICATION: Async loading completed for determined type:',
                activeUserType
              );
            })
            .catch((error) => {
              console.error(
                '📱 NOTIFICATION: Async loading failed for determined type:',
                activeUserType,
                error
              );
            });
        } else {
          console.warn('⚠️ NOTIFICATION: Could not determine active user type');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
          return;
        }
      } catch (error) {
        console.error('❌ NOTIFICATION: Error getting user type:', error);
        // Navigate back to home screen on error
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    };

    getUserType();
  }, [route?.params?.userType, route?.params?.authCode, navigation]);

  const styles = createStyles(theme);

  useEffect(() => {
    // Load notifications when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      refreshNotifications();
    });

    return unsubscribe;
  }, [navigation, refreshNotifications]);

  // Load notifications on component mount
  useEffect(() => {
    refreshNotifications();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh both global notifications and context-specific notifications
    await refreshNotifications();
    if (userType) {
      await loadNotificationsForUserType(userType);
    }
    setRefreshing(false);
  };

  const handleClearAll = () => {
    Alert.alert(t('clearAllNotifications'), t('clearAllNotificationsConfirm'), [
      {
        text: t('cancel'),
        style: 'cancel',
      },
      {
        text: t('clearAll'),
        style: 'destructive',
        onPress: async () => {
          const success = await clearAll();
          if (success) {
            Alert.alert(t('success'), t('allNotificationsCleared'));
          } else {
            Alert.alert(t('error'), t('failedToClearNotifications'));
          }
        },
      },
    ]);
  };

  const handleMarkAllAsRead = async () => {
    try {
      let apiResponse;

      // Use appropriate API method based on user type and context
      if (userType === 'parent' && currentStudentAuthCode) {
        // In parent context, mark student notifications as read
        apiResponse = await markAllStudentNotificationsAsRead(
          currentStudentAuthCode
        );
      } else {
        // For teachers and students, mark their own notifications as read
        apiResponse = await markAllAPINotificationsAsRead();
      }

      if (apiResponse?.success) {
        Alert.alert(t('success'), t('allNotificationsMarkedRead'));
        await refreshNotifications(); // Refresh to get updated data
        return;
      }

      // Fallback to local method
      const activeNotifications = getActiveNotifications();
      const unreadNotifications = activeNotifications.filter((n) => !n.read);

      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }

      Alert.alert(t('success'), t('allNotificationsMarkedRead'));
    } catch (error) {
      Alert.alert(t('error'), t('failedToMarkAsRead'));
    }
  };

  // Determine which notifications to show based on user type and context
  const getActiveNotifications = () => {
    console.log('📱 NOTIFICATION: getActiveNotifications called with:', {
      userType,
      currentStudentAuthCode,
      routeAuthCode: route?.params?.authCode,
      studentNotificationsKeys: Object.keys(studentNotifications),
      contextNotificationsCount: contextNotifications.length,
      globalNotificationsCount: notifications.length,
    });

    // For teachers: Use context-specific notifications, but allow global fallback while loading
    if (userType === 'teacher') {
      if (contextNotifications.length > 0) {
        console.log(
          '📱 NOTIFICATION: Teacher - using context-specific notifications, count:',
          contextNotifications.length
        );
        return contextNotifications;
      } else if (contextLoading && notifications.length > 0) {
        console.log(
          '📱 NOTIFICATION: Teacher - context loading, showing global notifications temporarily, count:',
          notifications.length
        );
        return notifications;
      } else {
        console.log(
          '📱 NOTIFICATION: Teacher - no notifications available, count: 0'
        );
        return contextNotifications; // Return empty array
      }
    }

    // For students: Use context-specific notifications if available
    if (userType === 'student') {
      // If we have context notifications loaded specifically for this student, use them
      if (contextNotifications.length > 0) {
        console.log(
          '📱 NOTIFICATION: Student context - using context-specific notifications, count:',
          contextNotifications.length
        );
        return contextNotifications;
      }

      // If we have student-specific notifications from route params, use those
      if (route?.params?.authCode) {
        const studentAuthCode = route.params.authCode;
        const studentNotifs = studentNotifications[studentAuthCode];
        if (studentNotifs && studentNotifs.length > 0) {
          console.log(
            '📱 NOTIFICATION: Student - using route-specific notifications, count:',
            studentNotifs.length
          );
          return studentNotifs;
        }
      }

      // Fallback to global notifications for students only if no context notifications
      console.log(
        '📱 NOTIFICATION: Student - fallback to global notifications, count:',
        notifications.length
      );
      return notifications;
    }

    // For parents: Use context-specific notifications if available, otherwise global
    if (userType === 'parent') {
      if (contextNotifications.length > 0) {
        console.log(
          '📱 NOTIFICATION: Parent - using context-specific notifications, count:',
          contextNotifications.length
        );
        return contextNotifications;
      }

      console.log(
        '📱 NOTIFICATION: Parent - fallback to global notifications, count:',
        notifications.length
      );
      return notifications;
    }

    // Default fallback (should not reach here normally)
    console.log(
      '📱 NOTIFICATION: Default fallback to context notifications, count:',
      contextNotifications.length
    );
    return contextNotifications;
  };

  // Get active unread count
  const getActiveUnreadCount = () => {
    // For teachers: ALWAYS use context-specific unread count
    if (userType === 'teacher') {
      console.log(
        '📱 NOTIFICATION: Teacher - using context-specific unread count:',
        contextUnreadCount
      );
      return contextUnreadCount;
    }

    // For students: Use context-specific unread count if available
    if (userType === 'student') {
      if (contextUnreadCount > 0) {
        console.log(
          '📱 NOTIFICATION: Student - using context-specific unread count:',
          contextUnreadCount
        );
        return contextUnreadCount;
      }

      // If we have student-specific unread count from route params, use that
      if (route?.params?.authCode) {
        const studentAuthCode = route.params.authCode;
        const studentUnreadCount = studentUnreadCounts[studentAuthCode] || 0;
        console.log(
          '📱 NOTIFICATION: Student - using route-specific unread count:',
          studentUnreadCount
        );
        return studentUnreadCount;
      }

      // Fallback to global unread count for students
      console.log(
        '📱 NOTIFICATION: Student - fallback to global unread count:',
        unreadCount
      );
      return unreadCount;
    }

    // For parents: Use context-specific unread count if available, otherwise global
    if (userType === 'parent') {
      if (contextUnreadCount > 0) {
        console.log(
          '📱 NOTIFICATION: Parent - using context-specific unread count:',
          contextUnreadCount
        );
        return contextUnreadCount;
      }

      console.log(
        '📱 NOTIFICATION: Parent - fallback to global unread count:',
        unreadCount
      );
      return unreadCount;
    }

    // Default fallback
    console.log(
      '📱 NOTIFICATION: Default fallback to context unread count:',
      contextUnreadCount
    );
    return contextUnreadCount;
  };

  // Determine if we should show loading indicator
  const shouldShowLoading = () => {
    // If we don't have a userType yet, show loading
    if (!userType) {
      console.log('📱 NOTIFICATION: Loading - no userType yet');
      return true;
    }

    // Get all available notifications to check if we have anything to show
    const activeNotifications = getActiveNotifications();
    const hasNotificationsToShow = activeNotifications.length > 0;

    // For teachers: show loading only if context is loading AND we have no notifications to show
    if (userType === 'teacher') {
      const shouldLoad = contextLoading && !hasNotificationsToShow;
      console.log('📱 NOTIFICATION: Teacher loading state:', {
        contextLoading,
        contextNotificationsCount: contextNotifications.length,
        globalNotificationsCount: notifications.length,
        hasNotificationsToShow,
        shouldLoad,
      });
      return shouldLoad;
    }

    // For students and parents: show loading only if context is loading AND we have no notifications to show
    const shouldLoad = contextLoading && !hasNotificationsToShow;
    console.log('📱 NOTIFICATION: Loading state for', userType, ':', {
      contextLoading,
      activeNotificationsCount: activeNotifications.length,
      hasNotificationsToShow,
      shouldLoad,
    });
    return shouldLoad;
  };

  const getFilteredNotifications = () => {
    const activeNotifications = getActiveNotifications();

    switch (filter) {
      case 'unread':
        return activeNotifications.filter((n) => !n.read);
      case 'behavior':
        return activeNotifications.filter((n) =>
          [
            'behavior',
            'bps_record',
            'bps',
            'discipline',
            'behavior_positive',
            'behavior_negative',
          ].includes(n.type)
        );
      case 'attendance':
        return activeNotifications.filter((n) =>
          [
            'attendance',
            'attendance_absent',
            'attendance_late',
            'attendance_present',
            'attendance_reminder',
          ].includes(n.type)
        );
      case 'grade':
        return activeNotifications.filter((n) =>
          [
            'assessment',
            'grade',
            'grade_updated',
            'assessment_published',
            'grade_released',
            'test_result',
          ].includes(n.type)
        );
      case 'homework':
        return activeNotifications.filter((n) =>
          [
            'homework',
            'homework_assigned',
            'homework_due',
            'homework_submitted',
            'homework_graded',
          ].includes(n.type)
        );
      case 'messaging':
        return activeNotifications.filter((n) =>
          [
            'message',
            'messaging',
            'new_message',
            'message_received',
            'conversation',
            'chat',
          ].includes(n.type)
        );
      case 'announcement':
        return activeNotifications.filter((n) =>
          ['announcement', 'general', 'news', 'event', 'reminder'].includes(
            n.type
          )
        );
      default:
        return activeNotifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  const renderNotificationItem = ({ item }) => {
    console.log(
      '📱 NOTIFICATION: Rendering notification item with userType:',
      userType
    );
    console.log('📱 NOTIFICATION: Notification type:', item.type);
    return (
      <NotificationItem
        notification={item}
        userType={userType}
        // NotificationItem will handle navigation automatically
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesomeIcon icon={faBell} size={64} color={theme.colors.textLight} />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateSubtitle}>
        {filter === 'unread'
          ? t('noUnreadNotifications')
          : t('noNotificationsYet')}
      </Text>
      {!loading && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refreshNotifications()}
        >
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFilterButton = (filterType, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {getActiveUnreadCount() > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {getActiveUnreadCount()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {getActiveUnreadCount() > 0 && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleMarkAllAsRead}
              >
                <FontAwesomeIcon icon={faCheckDouble} size={18} color='#fff' />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleClearAll}
            >
              <FontAwesomeIcon icon={faTrash} size={18} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Buttons Subheader */}
        <View style={styles.subHeader}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {renderFilterButton('all', t('all'))}
            {renderFilterButton('unread', t('unread'))}
            {renderFilterButton('behavior', t('behavior'))}
            {renderFilterButton('attendance', t('attendance'))}
            {renderFilterButton('grade', t('grades'))}
            {renderFilterButton('homework', t('homework'))}
            {renderFilterButton('messaging', t('messages'))}
            {renderFilterButton('announcement', t('announcements'))}
          </ScrollView>
        </View>
      </View>

      {/* Notifications List */}
      <View style={styles.contentContainer}>
        {shouldShowLoading() ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('loadingNotifications')}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Compact Header Styles
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      overflow: 'hidden',
      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 5,
      paddingBottom: 5,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Legacy header style (keeping for compatibility)
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...theme.shadows.medium,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      color: theme.colors.headerText,
      fontSize: 22,
      fontWeight: 'bold',
      marginRight: 8,
    },
    unreadBadge: {
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 10,
    },
    headerActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterContainer: {
      paddingHorizontal: 8,
      paddingVertical: 12,
      backgroundColor: 'transparent',
    },
    filterButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      marginHorizontal: 4,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeFilterButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    filterButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.text,
    },
    activeFilterButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    contentContainer: {
      flex: 1,
    },
    listContainer: {
      paddingVertical: 8,
      flexGrow: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 16,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default NotificationScreen;
