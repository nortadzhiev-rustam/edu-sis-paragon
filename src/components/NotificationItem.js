import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from 'prop-types';
import {
  faBell,
  faGraduationCap,
  faCalendarCheck,
  faBullhorn,
  faCircle,
  faUserCheck,
  faBookOpen,
  faExclamationTriangle,
  faComments,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { createCustomShadow } from '../utils/commonStyles';

const NotificationItem = ({ notification, onPress, userType, authCode }) => {
  const { theme } = useTheme();
  const { markAsRead } = useNotifications();
  const navigation = useNavigation();
  const styles = createStyles(theme);

  const getNotificationIcon = (type, body = '') => {
    switch (type) {
      // Behavior notifications - dynamic icon based on body content
      case 'behavior':
      case 'bps_record':
      case 'bps':
      case 'discipline':
      case 'behavior_positive':
      case 'behavior_negative':
        // Check if body contains dps/DPS for warning icon
        if (body.toLowerCase().includes('dps')) {
          return faExclamationTriangle;
        }
        // Default to positive icon for prs/PRS or other behavior notifications
        return faUserCheck;

      // Attendance notifications
      case 'attendance':
      case 'attendance_absent':
      case 'attendance_late':
      case 'attendance_present':
      case 'attendance_reminder':
        return faCalendarCheck;

      // Grade notifications
      case 'grade':
      case 'assessment':
      case 'grade_updated':
      case 'assessment_published':
      case 'grade_released':
      case 'test_result':
        return faGraduationCap;

      // Homework notifications
      case 'homework':
      case 'homework_assigned':
      case 'homework_due':
      case 'homework_submitted':
      case 'homework_graded':
        return faBookOpen;

      // Announcement notifications
      case 'announcement':
      case 'general':
      case 'news':
      case 'event':
      case 'reminder':
        return faBullhorn;

      case 'timetable':
        return faCalendarCheck;
      // Messaging notifications
      case 'message':
      case 'messaging':
      case 'new_message':
      case 'message_received':
      case 'conversation':
      case 'chat':
        return faComments;
      default:
        return faBell;
    }
  };

  const getNotificationColor = (type, body = '') => {
    switch (type) {
      // Behavior notifications - dynamic color based on body content
      case 'behavior':
      case 'bps_record':
      case 'bps':
      case 'discipline':
      case 'behavior_positive':
      case 'behavior_negative':
        // Check if body contains dps/DPS for red warning color
        if (
          body.toLowerCase().includes('dps') ||
          body.toLowerCase().includes('negative')
        ) {
          return '#FF3B30'; // Red for negative behavior (DPS)
        }
        // Check if body contains prs/PRS for green positive color
        if (
          body.toLowerCase().includes('prs') ||
          body.toLowerCase().includes('positive')
        ) {
          return '#34C759'; // Green for positive behavior (PRS)
        }
        // Default red for other behavior notifications
        return '#FF3B30';

      // Attendance notifications - Orange
      case 'attendance':
      case 'attendance_absent':
      case 'attendance_late':
      case 'attendance_present':
      case 'attendance_reminder':
        return '#FF9500';

      // Grade notifications - Green
      case 'grade':
      case 'assessment':
      case 'grade_updated':
      case 'assessment_published':
      case 'grade_released':
      case 'test_result':
        return '#34C759';

      // Homework notifications - Purple
      case 'homework':
      case 'homework_assigned':
      case 'homework_due':
      case 'homework_submitted':
      case 'homework_graded':
        return '#5856D6';

      // Announcement notifications - Blue
      case 'announcement':
      case 'general':
      case 'news':
      case 'event':
      case 'reminder':
        return '#007AFF';

      case 'timetable':
        return '#AF52DE'; // Purple for timetable
      // Messaging notifications - Pink
      case 'message':
      case 'messaging':
      case 'new_message':
      case 'message_received':
      case 'conversation':
      case 'chat':
        return '#FF2D55';
      default:
        return '#8E8E93'; // Gray for others
    }
  };

  const formatTimestamp = (notification) => {
    // First, try to use the pre-calculated time_ago field if available
    if (notification.time_ago) {
      return notification.time_ago;
    }

    // Fallback to calculating from timestamp fields
    let timestamp = notification.timestamp || notification.created_at;

    if (!timestamp) {
      return 'Unknown time';
    }

    try {
      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return diffInMinutes <= 0 ? 'Just now' : `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Unknown time';
    }
  };

  const handlePress = async () => {
    if (!notification.read) {
      console.log('📱 NOTIFICATION ITEM: Marking notification as read:', {
        id: notification.id,
        userType: userType,
      });
      await markAsRead(notification.id, userType);
    }

    if (onPress) {
      onPress(notification);
    } else {
      // Navigate to appropriate screen based on notification type
      navigateToScreen(notification.type);
    }
  };

  const getNavigationParams = async () => {
    try {
      let navAuthCode = null;
      let studentName = null;
      let parentAuthCode = null;

      console.log(
        '📱 NOTIFICATION: Getting navigation params for notification:',
        {
          type: notification.type,
          hasStudentAuthCode: !!notification.studentAuthCode,
          userType: userType,
          passedAuthCode: authCode ? authCode.substring(0, 8) + '...' : null,
        }
      );

      // Debug: Log the full notification object to see its structure
      console.log(
        '📱 NOTIFICATION: Full notification object:',
        JSON.stringify(notification, null, 2)
      );

      // Check if this is a parent viewing a child's notification
      // Look for various ways the notification might contain student information
      let parsedData = null;
      try {
        // Try to parse the data field which often contains student information as JSON string
        if (notification.data && typeof notification.data === 'string') {
          parsedData = JSON.parse(notification.data);
        } else if (
          notification._apiData?.data &&
          typeof notification._apiData.data === 'string'
        ) {
          parsedData = JSON.parse(notification._apiData.data);
        }
      } catch (error) {
        console.log(
          '📱 NOTIFICATION: Could not parse notification data:',
          error
        );
      }

      const hasStudentInfo =
        notification.studentAuthCode ||
        notification.student_id ||
        notification.studentId ||
        notification._apiData?.student_id ||
        notification._apiData?.studentId ||
        parsedData?.student_id ||
        parsedData?.studentId ||
        (notification._apiData &&
          (notification._apiData.student_name ||
            notification._apiData.studentName)) ||
        parsedData?.student_name;

      console.log('📱 NOTIFICATION: Student info check:', {
        hasStudentInfo,
        studentAuthCode: notification.studentAuthCode,
        student_id:
          notification.student_id || notification._apiData?.student_id,
        studentId: notification.studentId || notification._apiData?.studentId,
        student_name:
          notification._apiData?.student_name ||
          notification._apiData?.studentName,
        parsedData: parsedData,
        userType,
      });

      // Check if this is a parent viewing a child's notification (either via studentAuthCode or parsed data)
      if (
        notification.studentAuthCode ||
        (hasStudentInfo && userType === 'parent')
      ) {
        // This is a child's notification being viewed by a parent

        // If we have studentAuthCode, use it; otherwise use parent's authCode for API calls
        if (notification.studentAuthCode) {
          navAuthCode = notification.studentAuthCode;
          console.log(
            '📱 NOTIFICATION: Using student authCode from notification'
          );
        } else if (authCode) {
          // Use the authCode passed from NotificationScreen (route params)
          navAuthCode = authCode;
          console.log(
            '📱 NOTIFICATION: Using authCode from route params (passed from NotificationScreen)'
          );
        } else {
          // For notifications with parsed student data, we'll use parent's authCode for API calls
          try {
            // Import getUserData to get user-type-specific data
            const { getUserData } = require('../services/authService');
            const parentData = await getUserData('parent', AsyncStorage);
            if (parentData) {
              navAuthCode = parentData.authCode || parentData.auth_code;
              console.log(
                '📱 NOTIFICATION: Using parent authCode for API calls'
              );
            }
          } catch (error) {
            console.log('Could not get parent authCode for API calls:', error);
          }
        }

        // Get parent's authCode for context
        try {
          // Import getUserData to get user-type-specific data
          const { getUserData } = require('../services/authService');
          const parentData = await getUserData('parent', AsyncStorage);
          if (parentData) {
            parentAuthCode = parentData.authCode || parentData.auth_code;
          }
        } catch (error) {
          console.log('Could not get parent authCode:', error);
        }

        // Try to get student name from parsed data first, then from stored accounts
        if (parsedData?.student_name) {
          studentName = parsedData.student_name;
          console.log(
            '📱 NOTIFICATION: Found student name in parsed data:',
            studentName
          );
        } else {
          try {
            const savedStudents = await AsyncStorage.getItem('studentAccounts');
            if (savedStudents) {
              const students = JSON.parse(savedStudents);
              const student = students.find((s) => s.authCode === navAuthCode);
              if (student) {
                studentName = student.name;
                console.log(
                  '📱 NOTIFICATION: Found student name for child notification:',
                  studentName
                );
              }
            }
          } catch (error) {
            console.log('Could not get student name:', error);
          }
        }
      } else {
        // Use the authCode passed from NotificationScreen (route params) if available
        if (authCode) {
          navAuthCode = authCode;
          console.log(
            '📱 NOTIFICATION: Using authCode from route params for',
            userType
          );
        } else {
          // Get the current user's authCode from user-type-specific storage
          try {
            // Import getUserData to get user-type-specific data
            const { getUserData } = require('../services/authService');
            const userData = await getUserData(userType, AsyncStorage);
            if (userData) {
              navAuthCode = userData.authCode || userData.auth_code;
              studentName = userData.name; // Use current user's name if available
              console.log(
                '📱 NOTIFICATION: Using authCode from user-type-specific storage for',
                userType
              );
            }
          } catch (error) {
            console.log('Could not get user authCode:', error);
          }
        }

        // Get user name if not already set
        if (!studentName) {
          try {
            const { getUserData } = require('../services/authService');
            const userData = await getUserData(userType, AsyncStorage);
            if (userData) {
              studentName = userData.name;
            }
          } catch (error) {
            console.log('Could not get user name:', error);
          }
        }
      }

      // Create navigation params object
      const params = {};
      if (navAuthCode) params.authCode = navAuthCode;
      if (studentName) params.studentName = studentName;

      // Add userType context for proper screen behavior
      if (userType) params.userType = userType;

      // If this is a parent viewing a child's notification, add parent proxy parameters
      // Check for various indicators that this is a child's notification
      const isChildNotification =
        (notification.studentAuthCode || hasStudentInfo) &&
        userType === 'parent';

      if (isChildNotification && parentAuthCode) {
        // This is parent proxy access - parent viewing child's notification
        params.authCode = parentAuthCode; // Use parent's authCode for API calls
        params.studentName = studentName; // Child's name for display
        params.useParentProxy = true; // Flag to indicate proxy access
        params.parentData = { authCode: parentAuthCode }; // Parent data for context

        // Extract student ID from notification or try to find it
        let studentId = null;

        // First try to get studentId from notification directly (check multiple possible fields)
        if (notification.studentId) {
          studentId = notification.studentId;
          console.log(
            '📱 NOTIFICATION: Found studentId in notification:',
            studentId
          );
        } else if (notification.student_id) {
          studentId = notification.student_id;
          console.log(
            '📱 NOTIFICATION: Found student_id in notification:',
            studentId
          );
        } else if (parsedData?.student_id) {
          studentId = parsedData.student_id;
          console.log(
            '📱 NOTIFICATION: Found student_id in parsed data:',
            studentId
          );
        } else if (parsedData?.studentId) {
          studentId = parsedData.studentId;
          console.log(
            '📱 NOTIFICATION: Found studentId in parsed data:',
            studentId
          );
        } else if (notification._apiData?.student_id) {
          studentId = notification._apiData.student_id;
          console.log(
            '📱 NOTIFICATION: Found student_id in _apiData:',
            studentId
          );
        } else if (notification._apiData?.studentId) {
          studentId = notification._apiData.studentId;
          console.log(
            '📱 NOTIFICATION: Found studentId in _apiData:',
            studentId
          );
        } else {
          // Try to find student ID from stored student accounts
          try {
            const savedStudents = await AsyncStorage.getItem('studentAccounts');
            if (savedStudents) {
              const students = JSON.parse(savedStudents);
              console.log(
                '📱 NOTIFICATION: Searching in saved students:',
                students.length,
                'students'
              );
              const student = students.find(
                (s) => s.authCode === notification.studentAuthCode
              );
              if (student) {
                studentId = student.student_id || student.studentId;
                console.log(
                  '📱 NOTIFICATION: Found student in saved accounts:',
                  {
                    name: student.name,
                    studentId: studentId,
                    authCode: student.authCode?.substring(0, 8) + '...',
                  }
                );
              } else {
                console.log(
                  '📱 NOTIFICATION: No matching student found for authCode:',
                  notification.studentAuthCode?.substring(0, 8) + '...'
                );
              }
            } else {
              console.log('📱 NOTIFICATION: No saved student accounts found');
            }
          } catch (error) {
            console.log('Could not get student ID for parent proxy:', error);
          }

          // Last resort: try to extract student info from notification content
          if (!studentId && userType === 'parent') {
            console.log(
              '📱 NOTIFICATION: Attempting to extract student info from notification content'
            );

            // First try to use student name from parsed data to find student ID
            if (parsedData?.student_name) {
              try {
                const savedStudents = await AsyncStorage.getItem(
                  'studentAccounts'
                );
                if (savedStudents) {
                  const students = JSON.parse(savedStudents);
                  const matchingStudent = students.find((student) => {
                    return student.name === parsedData.student_name;
                  });

                  if (matchingStudent) {
                    studentId =
                      matchingStudent.student_id || matchingStudent.studentId;
                    console.log(
                      '📱 NOTIFICATION: Found student by exact name match from parsed data:',
                      {
                        name: matchingStudent.name,
                        studentId: studentId,
                      }
                    );
                  }
                }
              } catch (error) {
                console.log(
                  'Error trying to match student by parsed name:',
                  error
                );
              }
            }

            // If still no studentId, try to find student name in notification title or body
            if (!studentId) {
              const notificationText =
                `${notification.title} ${notification.body}`.toLowerCase();

              try {
                const savedStudents = await AsyncStorage.getItem(
                  'studentAccounts'
                );
                if (savedStudents) {
                  const students = JSON.parse(savedStudents);
                  const matchingStudent = students.find((student) => {
                    const studentName = (student.name || '').toLowerCase();
                    return (
                      studentName && notificationText.includes(studentName)
                    );
                  });

                  if (matchingStudent) {
                    studentId =
                      matchingStudent.student_id || matchingStudent.studentId;
                    console.log(
                      '📱 NOTIFICATION: Found student by name matching in content:',
                      {
                        name: matchingStudent.name,
                        studentId: studentId,
                      }
                    );
                  }
                }
              } catch (error) {
                console.log('Error trying to match student by name:', error);
              }
            }
          }
        }

        if (studentId) {
          params.studentId = studentId;
          console.log(
            '📱 NOTIFICATION: Set studentId for parent proxy:',
            studentId
          );
        } else {
          console.warn(
            '📱 NOTIFICATION: Could not determine studentId for parent proxy - navigation may fail'
          );
        }

        console.log('📱 NOTIFICATION: Parent proxy navigation params:', params);
      }

      console.log('📱 NOTIFICATION: Final navigation params created:', params);

      return params;
    } catch (error) {
      console.error('Error getting navigation params:', error);
      return {};
    }
  };

  const showNotificationAlert = (
    title = notification.title,
    body = notification.body
  ) => {
    Alert.alert(title, body, [{ text: 'OK', style: 'default' }]); // TODO: Replace 'OK' with t('ok') when context is available
  };

  const navigateToScreen = async (type) => {
    try {
      const navigationParams = await getNavigationParams();

      console.log('📱 NOTIFICATION: Navigating to screen:', type);
      console.log('📱 NOTIFICATION: Navigation params:', navigationParams);
      console.log('📱 NOTIFICATION: User type:', userType);
      console.log(
        '📱 NOTIFICATION: Notification has studentAuthCode:',
        !!notification.studentAuthCode
      );

      switch (type) {
        // Behavior notifications
        case 'behavior':
        case 'bps_record':
        case 'bps':
        case 'discipline':
        case 'behavior_positive':
        case 'behavior_negative':
          // Navigate to Behavior screen
          navigation.navigate('BehaviorScreen', navigationParams);
          break;

        // Attendance notifications
        case 'attendance':
        case 'attendance_absent':
        case 'attendance_late':
        case 'attendance_present':
        case 'attendance_reminder':
          // Navigate to Attendance screen
          navigation.navigate('AttendanceScreen', navigationParams);
          break;

        // Grade notifications
        case 'grade':
        case 'assessment':
        case 'grade_updated':
        case 'assessment_published':
        case 'grade_released':
        case 'test_result':
          // Navigate to Grades screen
          navigation.navigate('GradesScreen', navigationParams);
          break;

        // Homework notifications
        case 'homework':
        case 'homework_assigned':
        case 'homework_due':
        case 'homework_submitted':
        case 'homework_graded': {
          // Navigate to appropriate homework screen based on user context
          const homeworkUserData = await AsyncStorage.getItem('userData');

          // Check if this notification has a specific student auth code (from parent context)
          const isStudentNotification = notification.studentAuthCode;

          // Determine the effective user type (prioritize passed userType prop)
          let effectiveUserType = userType;
          if (!effectiveUserType && homeworkUserData) {
            const user = JSON.parse(homeworkUserData);
            effectiveUserType = user.userType || user.user_type || user.type;
          }

          console.log('📚 NOTIFICATION: Homework navigation context:', {
            effectiveUserType,
            isStudentNotification,
            hasStudentAuthCode: !!notification.studentAuthCode,
            passedUserType: userType,
          });

          // If this is a student-specific notification (from parent screen) or user is a student,
          // always navigate to AssignmentsScreen
          if (
            isStudentNotification ||
            effectiveUserType === 'student' ||
            effectiveUserType === 'parent'
          ) {
            console.log(
              '📚 NOTIFICATION: Navigating to student assignments screen'
            );
            navigation.navigate('AssignmentsScreen', navigationParams);
          }
          // Only navigate to teacher homework screen if user is actually a teacher AND
          // this is not a student-specific notification
          else if (
            (effectiveUserType === 'teacher' ||
              effectiveUserType === 'staff') &&
            !isStudentNotification
          ) {
            console.log(
              '📚 NOTIFICATION: Navigating to teacher homework screen'
            );

            // Get additional teacher data if available
            let teacherName = navigationParams.studentName;
            let selectedBranchId = null;

            if (homeworkUserData) {
              const user = JSON.parse(homeworkUserData);
              teacherName = teacherName || user.name;
              selectedBranchId = user.branches?.[0]?.branch_id || null;
            }

            navigation.navigate('TeacherHomework', {
              authCode: navigationParams.authCode,
              teacherName,
              selectedBranchId,
            });
          } else {
            // Default to student assignments screen for any other case
            console.log(
              '📚 NOTIFICATION: Defaulting to student assignments screen'
            );
            navigation.navigate('AssignmentsScreen', navigationParams);
          }
          break;
        }

        // Announcement notifications
        case 'announcement':
        case 'general':
        case 'news':
        case 'event':
        case 'reminder':
          // For announcements, show alert since there's no dedicated announcements screen
          showNotificationAlert();
          break;

        case 'timetable':
          // Navigate to Timetable screen
          navigation.navigate('TimetableScreen', navigationParams);
          break;

        // Messaging notifications
        case 'message':
        case 'messaging':
        case 'new_message':
        case 'message_received':
        case 'conversation':
        case 'chat': {
          console.log(
            '📱 NOTIFICATION: Message navigation - userType prop:',
            userType
          );

          // First try to use the userType prop passed from parent component
          let effectiveUserType = userType;
          let userName = null;

          // If no userType prop, fall back to AsyncStorage
          if (!effectiveUserType) {
            console.log(
              '📱 NOTIFICATION: No userType prop, checking AsyncStorage...'
            );
            const messagingUserData = await AsyncStorage.getItem('userData');
            if (messagingUserData) {
              const user = JSON.parse(messagingUserData);
              effectiveUserType = user.user_type || user.type;
              userName = user.name;
              console.log(
                '📱 NOTIFICATION: Message navigation - userData userType:',
                effectiveUserType
              );
              console.log(
                '📱 NOTIFICATION: Message navigation - userData:',
                JSON.stringify(user, null, 2)
              );
            } else {
              console.log('📱 NOTIFICATION: No userData found in AsyncStorage');
            }
          } else {
            console.log(
              '📱 NOTIFICATION: Using userType prop:',
              effectiveUserType
            );
          }

          console.log(
            '📱 NOTIFICATION: Message navigation - effective userType:',
            effectiveUserType
          );
          console.log(
            '📱 NOTIFICATION: Message navigation - navigationParams:',
            navigationParams
          );

          if (
            effectiveUserType === 'teacher' ||
            effectiveUserType === 'staff'
          ) {
            console.log(
              '📱 NOTIFICATION: Navigating to TeacherMessagingScreen'
            );

            // For teachers, get the teacher's own authCode and name, not from the notification
            let teacherAuthCode = null;
            let teacherName = null;

            try {
              // Import getUserData function
              const { getUserData } = require('../services/authService');

              // Get teacher-specific data using the proper function
              const teacherData = await getUserData('teacher', AsyncStorage);

              if (teacherData && teacherData.userType === 'teacher') {
                teacherAuthCode = teacherData.authCode || teacherData.auth_code;
                teacherName = teacherData.name;
                console.log(
                  '📱 NOTIFICATION: Using teacher-specific data for navigation:',
                  {
                    teacherAuthCode: teacherAuthCode?.substring(0, 8) + '...',
                    teacherName,
                    userType: teacherData.userType,
                  }
                );
              } else {
                console.warn(
                  '📱 NOTIFICATION: No valid teacher data found, using fallback'
                );
                // Fallback to notification params if teacher data not available
                teacherAuthCode = navigationParams.authCode;
                teacherName = navigationParams.studentName || userName;
              }
            } catch (error) {
              console.error(
                '📱 NOTIFICATION: Error getting teacher data:',
                error
              );
              // Fallback to notification params if teacher data not available
              teacherAuthCode = navigationParams.authCode;
              teacherName = navigationParams.studentName || userName;
            }

            navigation.navigate('TeacherMessagingScreen', {
              authCode: teacherAuthCode,
              teacherName: teacherName,
            });
          } else if (effectiveUserType === 'student') {
            console.log(
              '📱 NOTIFICATION: Navigating to StudentMessagingScreen'
            );
            navigation.navigate('StudentMessagingScreen', {
              authCode: navigationParams.authCode,
              studentName: navigationParams.studentName || userName,
            });
          } else {
            console.warn(
              '📱 NOTIFICATION: Unknown or missing userType for messaging:',
              effectiveUserType
            );
            // Fallback for unknown user types
            showNotificationAlert(
              'Messaging',
              'Please check your messages in the app.'
            );
          }
          break;
        }

        default:
          // Show notification details in alert for unknown types
          showNotificationAlert();
          break;
      }
    } catch (error) {
      console.log('Navigation error:', error);
      // Fallback to showing alert if navigation fails
      showNotificationAlert();
    }
  };

  const iconColor = getNotificationColor(notification.type, notification.body);

  return (
    <TouchableOpacity
      style={[styles.container, !notification.read && styles.unreadContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View
          style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}
        >
          <FontAwesomeIcon
            icon={getNotificationIcon(notification.type, notification.body)}
            size={20}
            color={iconColor}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.header}>
            <Text
              style={[styles.title, !notification.read && styles.unreadTitle]}
            >
              {notification.title}
            </Text>
            {!notification.read && (
              <FontAwesomeIcon
                icon={faCircle}
                size={8}
                color='#007AFF'
                style={styles.unreadDot}
              />
            )}
          </View>

          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>

          <Text style={styles.timestamp}>{formatTimestamp(notification)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginVertical: 4,
      marginHorizontal: 16,
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.1,
        radius: 3,
        elevation: 2,
      }),
    },
    unreadContainer: {
      borderLeftWidth: 4,
      borderLeftColor: '#007AFF',
    },
    content: {
      flexDirection: 'row',
      padding: 16,
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    unreadTitle: {
      fontWeight: '700',
    },
    unreadDot: {
      marginLeft: 8,
    },
    body: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.textLight,
      fontWeight: '500',
    },
  });

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_at: PropTypes.string,
    time_ago: PropTypes.string,
    read: PropTypes.bool.isRequired,
    studentAuthCode: PropTypes.string,
  }).isRequired,
  onPress: PropTypes.func,
  userType: PropTypes.string,
  authCode: PropTypes.string, // AuthCode passed from NotificationScreen route params
};

export default NotificationItem;
