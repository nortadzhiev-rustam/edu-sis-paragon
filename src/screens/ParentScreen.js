import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  getResponsiveHeaderFontSize,
  createCustomShadow,
  createMediumShadow,
} from '../utils/commonStyles';

import {
  faChild,
  faBook,
  faCalendarAlt,
  faChartLine,
  faClipboardCheck,
  faComments,
  faScaleBalanced,
  faBell,
  faBookOpen,
  faHeartbeat,
  faClock,
  faSignOutAlt,
  faUserShield,
  faArrowLeft,
  faUser,
  faEdit,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useParentNotifications } from '../hooks/useParentNotifications';
import ParentNotificationBadge from '../components/ParentNotificationBadge';
import MessageBadge from '../components/MessageBadge';
import { QuickActionTile, ComingSoonBadge } from '../components';
import { cleanupStudentData, performLogout } from '../services/logoutService';
import { getUserData } from '../services/authService';
import { isIPad, isTablet } from '../utils/deviceDetection';
import DemoModeIndicator from '../components/DemoModeIndicator';
import { updateLastLogin } from '../services/deviceService';

// Import Parent Proxy Access System
import {
  getParentChildren,
  saveChildrenData,
  getChildrenData,
  formatChildForDisplay,
} from '../services/parentService';

import { useFocusEffect } from '@react-navigation/native';

// Menu items configuration
const getMenuItems = (t) => [
  {
    id: 'assessments',
    title: t('assessments'),
    icon: faChartLine,
    backgroundColor: '#FF9500',
    iconColor: '#fff',
    action: 'grades',
  },
  {
    id: 'attendance',
    title: t('attendance'),
    icon: faClipboardCheck,
    backgroundColor: '#34C759',
    iconColor: '#fff',
    action: 'attendance',
  },
  {
    id: 'assignments',
    title: t('homework'),
    icon: faBook,
    backgroundColor: '#007AFF',
    iconColor: '#fff',
    action: 'assignments',
  },
  {
    id: 'schedule',
    title: t('timetable'),
    icon: faClock,
    backgroundColor: '#AF52DE',
    iconColor: '#fff',
    action: 'schedule',
  },
  {
    id: 'calendar',
    title: t('calendar'),
    icon: faCalendarAlt,
    backgroundColor: '#5856D6',
    iconColor: '#fff',
    action: 'calendar',
  },
  {
    id: 'discipline',
    title: t('behavior'),
    icon: faScaleBalanced,
    backgroundColor: '#5856D6',
    iconColor: '#fff',
    action: 'discipline',
  },
  {
    id: 'library',
    title: t('library'),
    icon: faBookOpen,
    backgroundColor: '#FF6B35',
    iconColor: '#fff',
    action: 'library',
  },
  // Health
  {
    id: 'health',
    title: t('health'),
    icon: faHeartbeat,
    backgroundColor: '#028090',
    iconColor: '#fff',
    action: 'health',
    disabled: false,
    comingSoon: false,
  },
  // Messaging
  {
    id: 'messages',
    title: t('messages'),
    icon: faComments,
    backgroundColor: '#d90429',
    iconColor: '#fff',
    disabled: false,
    action: 'messages',
    comingSoon: false,
  },
  // {
  //   id: 'materials',
  //   title: t('materials'),
  //   icon: faFileAlt,
  //   backgroundColor: '#4CAF50',
  //   iconColor: '#fff',
  //   action: 'materials',
  //   disabled: false,
  //   comingSoon: false,
  // },
  {
    id: 'guardian-pickup',
    title: 'Guardian & Pickup',
    icon: faUserShield,
    backgroundColor: '#8B5CF6',
    iconColor: '#fff',
    action: 'guardian-pickup',
    disabled: false,
    comingSoon: false,
  },
  // {
  //   id: 'reports',
  //   title: t('reports'),
  //   icon: faChartLine,
  //   backgroundColor: '#3498db',
  //   iconColor: '#fff',
  //   action: 'reports',
  //   disabled: false,
  //   comingSoon: false,
  // },
];

export default function ParentScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  // Dynamic screen dimensions that update with orientation changes
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Extract dimensions for easier use
  const { width: screenWidth, height: screenHeight } = screenDimensions;

  // Device and orientation detection
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();
  const isLandscape = screenWidth > screenHeight;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = React.useRef(null);
  const notificationsLoadedRef = React.useRef(new Set());
  // Create a reasonable number of shared values for pagination (max 10 students)
  const paginationSharedValues = Array.from({ length: 10 }, (_, i) =>
    useSharedValue(i === 0 ? 1 : 0)
  );

  // Create animated styles for all possible pagination dots (outside of render)
  const paginationAnimatedStyles = paginationSharedValues.map((sharedValue) =>
    useAnimatedStyle(() => {
      if (!sharedValue) return {};

      return {
        width: interpolate(sharedValue.value, [0, 1], [8, 24]),
        opacity: interpolate(sharedValue.value, [0, 1], [0.5, 1]),
        backgroundColor: interpolateColor(
          sharedValue.value,
          [0, 1],
          [theme.colors.border, theme.colors.primary]
        ),
      };
    })
  );
  // Parent profile animation states
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [hintProfileVisible, setHintProfileVisible] = useState(false); // Separate state for hint text
  const [showInitialHint, setShowInitialHint] = useState(true);
  const [hintAutoHideTimeout, setHintAutoHideTimeout] = useState(null);
  const [isHintVisible, setIsHintVisible] = useState(false);

  const profileVisibilityRef = useRef(false); // Immediate reference for hint text
  const profileTranslateY = useSharedValue(-120); // Start hidden (negative value)
  const profileOpacity = useSharedValue(0);
  const hintOpacity = useSharedValue(1); // Start visible when profile is hidden
  const hintArrowBounce = useSharedValue(0); // For bouncing arrow animation
  const hintBounceAnimRef = useRef(null); // Holds current bounce animation loop instance
  const contentTranslateY = useSharedValue(-80); // Start moved up when profile is hidden (affects all content)
  const isProfileVisibleShared = useSharedValue(false); // Shared value for worklet access
  const gestureCompletedShared = useSharedValue(0); // Triggers when gesture completes (increments)

  // Parent notifications hook
  const { selectStudent, refreshAllStudents } = useParentNotifications();

  const styles = createStyles(theme, fontSizes, screenWidth, screenHeight);

  // Animated styles for reanimated
  const profileAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: profileTranslateY.value }],
      opacity: profileOpacity.value,
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: contentTranslateY.value }],
    };
  });

  const hintAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: hintOpacity.value,
    };
  });

  const hintArrowAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: hintArrowBounce.value * (isProfileVisible ? -3 : 3),
        },
      ],
    };
  });

  // Sync React state with shared value changes from gestures
  useEffect(() => {
    const checkSharedValue = () => {
      if (isProfileVisibleShared.value !== isProfileVisible) {
        setIsProfileVisible(isProfileVisibleShared.value);
      }
    };

    const interval = setInterval(checkSharedValue, 100);
    return () => clearInterval(interval);
  }, [isProfileVisible]);

  // Initialize shared value with React state
  useEffect(() => {
    isProfileVisibleShared.value = isProfileVisible;
  }, [isProfileVisible]);

  // Update pagination dots when students change or current index changes
  useEffect(() => {
    // Reset all dots to inactive, then set current one to active
    paginationSharedValues.forEach((sharedValue, index) => {
      if (index < students.length) {
        sharedValue.value = withSpring(index === currentIndex ? 1 : 0, {
          damping: 25,
          stiffness: 400,
        });
      }
    });
  }, [students.length, currentIndex]);

  // Update current index when selected student changes
  useEffect(() => {
    if (selectedStudent && students.length > 0) {
      const studentIndex = students.findIndex(
        (s) => s.id === selectedStudent.id
      );
      if (studentIndex !== -1 && studentIndex !== currentIndex) {
        setCurrentIndex(studentIndex);
      }
    }
  }, [selectedStudent, students]);

  // Watch for gesture completion and sync React state with shared values
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if profile visibility changed via gesture
      if (isProfileVisibleShared.value !== isProfileVisible) {
        const newVisibility = isProfileVisibleShared.value;
        console.log('Gesture changed profile visibility to:', newVisibility);
        setIsProfileVisible(newVisibility);
        setHintProfileVisible(newVisibility); // Update hint state immediately
        profileVisibilityRef.current = newVisibility; // Update ref immediately

        // Show hint when profile is hidden via gesture, hide when shown
        if (!newVisibility) {
          console.log('Profile hidden via gesture, showing hint');
          setTimeout(() => {
            showHintTemporarily(3000);
          }, 500);
        } else {
          console.log('Profile shown via gesture, hiding hint');
          hintOpacity.value = withTiming(0, { duration: 300 });
          stopHintBounce();
          setIsHintVisible(false);
        }
      }
    }, 16); // Check every 16ms (60fps) for immediate response

    return () => clearInterval(interval);
  }, [isProfileVisible]);

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we have students and they haven't been loaded recently
      if (students.length > 0) {
        const studentIds = students
          .map((s) => s.id)
          .sort()
          .join(',');
        if (!notificationsLoadedRef.current.has(studentIds)) {
          // Add a small delay to prevent immediate execution
          const timeoutId = setTimeout(() => {
            refreshAllStudents(students);
          }, 500);

          return () => clearTimeout(timeoutId);
        }
      }
    }, [students, refreshAllStudents])
  );

  useEffect(() => {
    // Load saved student accounts
    loadStudents();

    // Add listener for when we come back from adding a student or editing profile
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 PARENT SCREEN: Screen focused, refreshing data...');
      loadStudents();
      // Also refresh parent profile data in case it was updated
      loadParentProfileData();
    });

    // Start initial hint animation after component mounts
    startInitialHintAnimation();

    return unsubscribe;
  }, [navigation]);

  // Helpers to manage chevron bounce animation for the hint
  const stopHintBounce = () => {
    if (hintBounceAnimRef.current) {
      try {
        hintBounceAnimRef.current.stop();
      } catch (e) {}
      hintBounceAnimRef.current = null;
    }
    hintArrowBounce.value = 0;
  };

  const startHintBounce = (iterations) => {
    // iterations: number | undefined (undefined = infinite)
    stopHintBounce();

    // Simple spring animation for bounce effect
    hintArrowBounce.value = withSpring(1, {
      damping: 2,
      stiffness: 100,
    });

    // Reset after animation
    setTimeout(() => {
      hintArrowBounce.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    }, 300);
  };

  // Helper function to show hint temporarily (with bouncing chevrons)
  const showHintTemporarily = (duration = 2000) => {
    console.log('showHintTemporarily called with duration:', duration);
    console.log('Current hintOpacity value:', hintOpacity.value);

    // Clear any existing timeout
    if (hintAutoHideTimeout) {
      clearTimeout(hintAutoHideTimeout);
    }

    // Force stop any existing animations and reset opacity
    stopHintBounce();

    // Show hint and start chevron bounce
    console.log('Setting hintOpacity to 1');
    setIsHintVisible(true);
    hintOpacity.value = 1; // Set immediately first
    hintOpacity.value = withTiming(1, { duration: 250 }); // Then animate to ensure it's visible
    startHintBounce(); // start infinite bounce while hint is visible

    // Set timeout to hide hint and stop bounce
    const timeout = setTimeout(() => {
      console.log('Hiding hint after timeout');
      hintOpacity.value = withTiming(0, { duration: 400 });
      stopHintBounce();
      setIsHintVisible(false);
    }, duration);

    setHintAutoHideTimeout(timeout);
  };

  // Initial hint animation that shows bouncing and then hides
  const startInitialHintAnimation = () => {
    // Wait a bit for the screen to settle, then start bouncing animation
    setTimeout(() => {
      // Start limited bounce for initial hint (3 cycles), then hide
      setIsHintVisible(true);
      startHintBounce(3);
      // After bouncing, hide the hint (add a short pause before hiding)
      setTimeout(() => {
        hintOpacity.value = withTiming(0, { duration: 500 });
        stopHintBounce();
        setShowInitialHint(false);
        setIsHintVisible(false);
      }, 1000 + 3 * 300);
    }, 1000); // Wait 1 second after component mount
  };

  // Restore selected student when students are loaded
  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      restoreSelectedStudent();
    }
  }, [students, selectedStudent, restoreSelectedStudent]);

  // Ensure first dot is selected when students are first loaded
  useEffect(() => {
    if (students.length > 0 && currentIndex !== 0 && !selectedStudent) {
      setCurrentIndex(0);
    }
  }, [students.length, selectedStudent]);

  // Note: In parent proxy system, notifications are loaded through main notification context
  // No need to load individual student notifications

  // Cleanup hint timeout on unmount
  useEffect(() => {
    return () => {
      if (hintAutoHideTimeout) {
        clearTimeout(hintAutoHideTimeout);
      }
    };
  }, [hintAutoHideTimeout]);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const handleLogout = async () => {
    Alert.alert(t('logout'), t('confirmLogout'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🚪 PARENT: Starting logout process...');

            // Use the comprehensive logout service
            const logoutResult = await performLogout({
              userType: 'parent', // Specify that this is a parent logout
              clearDeviceToken: false, // Keep device token for future logins
              clearAllData: false, // Keep student accounts for parent dashboard
            });

            if (logoutResult.success) {
              console.log('✅ PARENT: Logout completed successfully');
              navigation.replace('Home');
            } else {
              console.error('❌ PARENT: Logout failed:', logoutResult.error);
              // Fallback to basic logout
              await AsyncStorage.multiRemove([
                'userData',
                'selectedStudent',
                'calendarUserData',
              ]);
              navigation.replace('Home');
            }
          } catch (error) {
            console.error('❌ PARENT: Error during logout:', error);
            // Fallback to basic logout
            try {
              await AsyncStorage.multiRemove([
                'userData',
                'selectedStudent',
                'calendarUserData',
              ]);
              navigation.replace('Home');
            } catch (fallbackError) {
              console.error(
                '❌ PARENT: Fallback logout also failed:',
                fallbackError
              );
              Alert.alert(t('error'), t('logoutFailed'));
            }
          }
        },
      },
    ]);
  };

  const handleStudentPress = async (student) => {
    // Set the selected student
    setSelectedStudent(student);

    // Find the index of the selected student and center it
    const studentIndex = students.findIndex((s) => s.id === student.id);
    if (studentIndex !== -1) {
      setCurrentIndex(studentIndex);
      flatListRef.current?.scrollToIndex({
        index: studentIndex,
        animated: true,
      });
    }

    // Save selected student to AsyncStorage for persistence
    try {
      await AsyncStorage.setItem('selectedStudent', JSON.stringify(student));
    } catch (error) {
      console.error('Error saving selected student:', error);
    }

    // Update last login timestamp when student is selected/starts using the app
    console.log('⏰ PARENT: Updating last login for selected student...');
    try {
      const authCode = student.authCode || student.auth_code;
      if (authCode) {
        const updateResult = await updateLastLogin(authCode);
        if (updateResult.success) {
          console.log(
            '✅ PARENT: Last login updated successfully for student:',
            student.name
          );
        } else {
          console.warn(
            '⚠️ PARENT: Failed to update last login for student:',
            updateResult.error
          );
          // Continue with selection even if update fails
        }
      } else {
        console.warn(
          '⚠️ PARENT: No auth code found for student:',
          student.name
        );
      }
    } catch (updateError) {
      console.error(
        '❌ PARENT: Error updating last login for student:',
        updateError
      );
      // Continue with selection even if update fails
    }

    // Also select student for notifications
    selectStudent(student);
  };

  const handleMenuItemPress = async (action) => {
    if (!selectedStudent) {
      Alert.alert(t('noStudentSelected'), t('pleaseSelectStudent'));
      return;
    }

    // Get parent's auth code for proxy access
    const parentAuthCode =
      currentUserData?.auth_code || currentUserData?.authCode;

    if (!parentAuthCode) {
      Alert.alert(t('authenticationError'), t('parentAuthenticationRequired'));
      return;
    }

    // Handle different menu actions using Parent Proxy Access System
    switch (action) {
      case 'grades':
        navigation.navigate('GradesScreen', {
          studentName: selectedStudent.name,
          authCode: parentAuthCode, // Use parent's auth code
          studentId: selectedStudent.student_id, // Pass student ID for proxy access
          useParentProxy: true, // Flag to indicate proxy access
          parentData: currentUserData,
        });
        break;
      case 'attendance':
        navigation.navigate('AttendanceScreen', {
          studentName: selectedStudent.name,
          authCode: parentAuthCode, // Use parent's auth code
          studentId: selectedStudent.student_id, // Pass student ID for proxy access
          useParentProxy: true, // Flag to indicate proxy access
          parentData: currentUserData,
        });
        break;
      case 'assignments':
        navigation.navigate('AssignmentsScreen', {
          studentName: selectedStudent.name,
          authCode: parentAuthCode, // Use parent's auth code
          studentId: selectedStudent.student_id, // Pass student ID for proxy access
          useParentProxy: true, // Flag to indicate proxy access
          parentData: currentUserData,
        });
        break;
      case 'schedule':
        navigation.navigate('TimetableScreen', {
          studentName: selectedStudent.name,
          authCode: parentAuthCode, // Use parent's auth code
          studentId: selectedStudent.student_id, // Pass student ID for proxy access
          useParentProxy: true, // Flag to indicate proxy access
          parentData: currentUserData,
        });
        break;
      case 'discipline':
        navigation.navigate('BehaviorScreen', {
          studentName: selectedStudent.name,
          authCode: parentAuthCode, // Use parent's auth code
          studentId: selectedStudent.student_id, // Pass student ID for proxy access
          useParentProxy: true, // Flag to indicate proxy access
          parentData: currentUserData,
        });
        break;
      case 'messages':
        // Parent messaging already uses parent auth code

        if (parentAuthCode) {
          navigation.navigate('ParentMessagingScreen', {
            authCode: parentAuthCode,
            parentName:
              currentUserData?.name || currentUserData?.user_name || 'Parent',
            userType: 'parent',
            children: students, // Pass children data for context
          });
        } else {
          Alert.alert(
            'Error',
            'Unable to access messaging. Please try logging in again.'
          );
        }
        break;
      case 'library':
        navigation.navigate('LibraryScreen', {
          studentName: selectedStudent.name,
          authCode: parentAuthCode, // Use parent's auth code
          studentId: selectedStudent.student_id, // Pass student ID for proxy access
          useParentProxy: true, // Flag to indicate proxy access
          parentData: currentUserData,
        });
        break;
      case 'health':
        navigation.navigate('StudentHealthScreen', {
          studentName: selectedStudent.name,
          authCode: parentAuthCode, // Use parent's auth code
          studentId: selectedStudent.student_id, // Pass student ID for proxy access
          useParentProxy: true, // Flag to indicate proxy access
          parentData: currentUserData,
        });
        break;
      case 'calendar':
        // Save selected student as temporary calendar user data (don't overwrite main userData)
        try {
          await AsyncStorage.setItem(
            'calendarUserData',
            JSON.stringify(selectedStudent)
          );
          // Navigate to combined calendar from parent screen (includes personal events)
          navigation.navigate('UserCalendar', { mode: 'combined' });
        } catch (error) {
          console.error('Error saving student data for calendar:', error);
          Alert.alert(t('error'), t('failedToAccessCalendar'));
        }
        break;
      case 'materials':
        if (selectedStudent) {
          navigation.navigate('WorkspaceScreen', {
            userData: {
              ...selectedStudent,
              userType: 'parent',
            },
            studentData: selectedStudent,
          });
        }
        break;
      case 'reports':
        navigation.navigate('StudentReports', {
          userData: {
            ...selectedStudent,
            name: selectedStudent.name,
            authCode: parentAuthCode, // Use parent's auth code
            studentId: selectedStudent.student_id, // Pass student ID for proxy access
            useParentProxy: true, // Flag to indicate proxy access
            parentData: currentUserData,
          },
        });
        break;
      case 'guardian-pickup': {
        // Navigate to unified guardian & pickup management screen
        const guardianPickupAuthCode =
          currentUserData?.auth_code || currentUserData?.authCode;

        if (guardianPickupAuthCode) {
          navigation.navigate('GuardianPickupManagement', {
            authCode: guardianPickupAuthCode,
            children: students,
            selectedChildId: selectedStudent?.id,
          });
        } else {
          Alert.alert(
            t('error'),
            'Unable to access guardian & pickup management. Please try logging in again.'
          );
        }
        break;
      }
      default:
        break;
    }
  };

  // Load parent profile data separately to refresh after profile edits
  const loadParentProfileData = async () => {
    try {
      console.log('🔄 PARENT: Refreshing parent profile data...');

      // Use the same logic as loadStudents but only update currentUserData
      const parentData = await getUserData('parent', AsyncStorage);
      const studentData = await getUserData('student', AsyncStorage);

      let parsedUserData = null;
      if (parentData && parentData.userType === 'parent') {
        parsedUserData = parentData;
        console.log('✅ PARENT: Refreshed parent-specific data');
      } else if (studentData && studentData.userType === 'student') {
        parsedUserData = studentData;
        console.log('✅ PARENT: Refreshed student-specific data');
      } else {
        // Fallback to generic userData for backward compatibility
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          parsedUserData = JSON.parse(userData);
          console.log('⚠️ PARENT: Refreshed generic userData as fallback');
        }
      }

      if (parsedUserData) {
        console.log(
          '🔄 PARENT: Updated currentUserData with refreshed profile data'
        );
        setCurrentUserData(parsedUserData);
      }
    } catch (error) {
      console.error('❌ PARENT: Error refreshing parent profile data:', error);
    }
  };

  // Extract loadStudents function to make it reusable
  const loadStudents = React.useCallback(async () => {
    try {
      console.log('👨‍👩‍👧‍👦 PARENT: Starting loadStudents...');

      // First check for parent-specific data
      const parentData = await getUserData('parent', AsyncStorage);
      const studentData = await getUserData('student', AsyncStorage);

      console.log('👨‍👩‍👧‍👦 PARENT: Data check:', {
        hasParentData: !!parentData,
        hasStudentData: !!studentData,
        parentUserType: parentData?.userType,
        studentUserType: studentData?.userType,
      });

      // Use parent data if available, otherwise student data, otherwise fallback to generic
      let parsedUserData = null;
      if (parentData && parentData.userType === 'parent') {
        parsedUserData = parentData;
        console.log('✅ PARENT: Using parent-specific data');
      } else if (studentData && studentData.userType === 'student') {
        parsedUserData = studentData;
        console.log('✅ PARENT: Using student-specific data');
      } else {
        // Fallback to generic userData for backward compatibility
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          parsedUserData = JSON.parse(userData);
          console.log(
            '⚠️ PARENT: Using generic userData as fallback:',
            parsedUserData.userType
          );
        }
      }

      if (parsedUserData) {
        // Debug logging to see what data we're setting
        console.log(
          '🖼️ PARENT: Setting currentUserData with keys:',
          Object.keys(parsedUserData)
        );
        console.log('🖼️ PARENT: Photo fields in parsedUserData:', {
          photo: parsedUserData.photo,
          parent_photo: parsedUserData.parent_photo,
          user_photo: parsedUserData.user_photo,
          parent_info: parsedUserData.parent_info
            ? Object.keys(parsedUserData.parent_info)
            : 'no parent_info',
        });

        setCurrentUserData(parsedUserData); // Set current user data for demo mode indicator

        // Check if we have teacher data but no parent/student data
        if (
          parsedUserData.userType === 'teacher' &&
          !parentData &&
          !studentData
        ) {
          console.log(
            '⚠️ PARENT: Teacher data found but no parent/student data available'
          );
          setLoading(false);
          // The screen will show empty state, which is appropriate
          return;
        }

        // Handle parent login from unified login endpoint
        if (parsedUserData.userType === 'parent') {
          console.log(
            '👨‍👩‍👧‍👦 PARENT: Loading children data using Parent Proxy Access System'
          );

          try {
            // First try to use children from login response if available
            if (parsedUserData.children && parsedUserData.children.length > 0) {
              console.log('📦 PARENT: Using children from login response');

              // Map backend response format to mobile app format
              const mappedChildren = parsedUserData.children.map((child) => ({
                id: child.student_id,
                name: child.student_name,
                student_id: child.student_id,
                student_name: child.student_name, // Keep original API property
                username:
                  child.student_email?.split('@')[0] ||
                  `student_${child.student_id}`,
                authCode: parsedUserData.auth_code, // Use parent's auth code for proxy access
                auth_code: parsedUserData.auth_code,
                userType: 'student',
                class_name: child.classroom_name || child.grade_name,
                classroom_name: child.classroom_name, // Keep original API property
                grade_level: child.grade_name,
                academic_year: child.academic_year,
                branch_name: child.branch_name,
                branch_id: child.branch_id,
                email: child.student_email,
                student_email: child.student_email, // Keep original API property
                phone: child.student_phone,
                student_phone: child.student_phone, // Keep original API property
                photo: child.student_photo,
                student_photo: child.student_photo, // Keep original API property
                birth_date: child.birth_date,
                gender: child.gender,
                nationality: child.nationality,
                address: child.address,
              }));

              setStudents(mappedChildren);

              // Save children data for offline access
              await saveChildrenData(mappedChildren.map(formatChildForDisplay));

              setLoading(false);
              return;
            } else {
              // If no children in login response, fetch using Parent Proxy API
              console.log(
                '🔄 PARENT: Fetching children using Parent Proxy API'
              );

              const parentAuthCode =
                parsedUserData.auth_code || parsedUserData.authCode;
              if (parentAuthCode) {
                const childrenResponse = await getParentChildren(
                  parentAuthCode
                );

                if (childrenResponse.success && childrenResponse.children) {
                  // Map API response to mobile app format
                  const mappedChildren = childrenResponse.children.map(
                    (child) => ({
                      id: child.student_id,
                      name: child.student_name,
                      student_id: child.student_id,
                      student_name: child.student_name, // Keep original API property
                      username: `student_${child.student_id}`,
                      authCode: parentAuthCode, // Use parent's auth code for proxy access
                      auth_code: parentAuthCode,
                      userType: 'student',
                      class_name: child.classroom_name,
                      classroom_name: child.classroom_name, // Keep original API property
                      grade_level: child.grade_level,
                      academic_year: child.academic_year,
                      branch_name: child.branch_name, // Keep original API property
                      student_photo: child.student_photo, // Keep original API property
                      student_email: child.student_email, // Keep original API property
                      birth_date: child.birth_date, // Keep original API property
                      gender: child.gender, // Keep original API property
                      nationality: child.nationality, // Keep original API property
                      address: child.address, // Keep original API property
                      branch_id: child.branch_id, // Keep original API property
                    })
                  );

                  setStudents(mappedChildren);

                  // Save children data for offline access
                  await saveChildrenData(
                    childrenResponse.children.map(formatChildForDisplay)
                  );

                  setLoading(false);
                  return;
                } else {
                  console.warn('⚠️ PARENT: No children found in API response');
                }
              }
            }
          } catch (error) {
            console.error('❌ PARENT: Error loading children data:', error);

            // Try to load cached children data as fallback
            const cachedChildren = await getChildrenData();
            if (cachedChildren.length > 0) {
              console.log('📦 PARENT: Using cached children data');

              // Map cached data to mobile app format
              const mappedChildren = cachedChildren.map((child) => ({
                id: child.student_id,
                name: child.displayName,
                student_id: child.student_id,
                username: `student_${child.student_id}`,
                authCode: parsedUserData.auth_code, // Use parent's auth code for proxy access
                auth_code: parsedUserData.auth_code,
                userType: 'student',
                class_name: child.displayClass,
                grade_level: child.grade_level,
                academic_year: child.displayYear,
              }));

              setStudents(mappedChildren);
              setLoading(false);
              return;
            }
          }
        }

        // Handle demo mode (existing logic)
        if (parsedUserData.demo_mode && parsedUserData.userType === 'student') {
          console.log('🎭 DEMO MODE: Loading demo parent children data');

          // Update last login timestamp for demo student user
          console.log(
            '⏰ PARENT: Updating last login for existing demo student user...'
          );
          try {
            const updateResult = await updateLastLogin(
              parsedUserData.authCode || parsedUserData.auth_code
            );
            if (updateResult.success) {
              console.log('✅ PARENT: Last login updated successfully');
            } else {
              console.warn(
                '⚠️ PARENT: Failed to update last login:',
                updateResult.error
              );
              // Continue with loading even if update fails
            }
          } catch (updateError) {
            console.error('❌ PARENT: Error updating last login:', updateError);
            // Continue with loading even if update fails
          }

          // Load demo children data
          setStudents(parsedUserData.children || []);
          setLoading(false);
          return;
        }
      }

      // Normal mode: load from AsyncStorage (manually added student accounts)
      const savedStudents = await AsyncStorage.getItem('studentAccounts');
      if (savedStudents) {
        setStudents(JSON.parse(savedStudents));
      }
    } catch (error) {
      // Handle error silently
      console.error('Error loading student accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore the previously selected student or select first student automatically
  const restoreSelectedStudent = React.useCallback(async () => {
    try {
      if (students.length === 0) return;

      const savedSelectedStudentId = await AsyncStorage.getItem(
        'selectedStudentId'
      );

      let studentToSelect = null;

      // Try to restore previously selected student
      if (savedSelectedStudentId) {
        studentToSelect = students.find(
          (s) => s.id.toString() === savedSelectedStudentId
        );
      }

      // If no previously selected student found, automatically select the first one
      if (!studentToSelect) {
        studentToSelect = students[0];
        console.log(
          '📋 PARENT: Auto-selecting first student:',
          studentToSelect.name
        );
      } else {
        console.log(
          '📋 PARENT: Restored previously selected student:',
          studentToSelect.name
        );
      }

      if (studentToSelect) {
        setSelectedStudent(studentToSelect);
        // Save the selection for next time
        await AsyncStorage.setItem(
          'selectedStudentId',
          studentToSelect.id.toString()
        );
        // Also select student for notifications to ensure badges show correct counts
        selectStudent(studentToSelect);
      }
    } catch (error) {
      console.error('Error restoring selected student:', error);
    }
  }, [students]);

  // Student cleanup is now handled by the logoutService

  // Helper function to update React state and show hint (called from worklet)
  const updateProfileStateAndShowHint = (willBeVisible) => {
    console.log(
      'updateProfileStateAndShowHint called, willBeVisible:',
      willBeVisible
    );

    // Update React state
    setIsProfileVisible(willBeVisible);

    // Show hint logic (only when hiding profile)
    if (!willBeVisible) {
      console.log(
        'Profile being hidden via gesture, will show hint after delay'
      );
      setTimeout(() => {
        console.log('Showing hint now via gesture');
        showHintTemporarily(3000);
      }, 500);
    }
  };

  // Animation functions for parent profile
  const toggleProfileVisibility = () => {
    const wasVisible = isProfileVisible;
    const willBeVisible = !wasVisible;
    const toValue = wasVisible ? -120 : 0;
    const opacityValue = wasVisible ? 0 : 1;
    const contentToValue = wasVisible ? -80 : 0; // Move entire content up when profile is hidden, down when shown

    // Clear any existing hint timeout and stop any bounce
    if (hintAutoHideTimeout) {
      clearTimeout(hintAutoHideTimeout);
      setHintAutoHideTimeout(null);
    }
    // Only disable initial hint when profile is being shown, re-enable when hiding
    if (willBeVisible) {
      console.log('Profile being shown - disabling hint');
      setShowInitialHint(false); // Disable hint when showing profile
    } else {
      console.log('Profile being hidden - re-enabling hint');
      setShowInitialHint(true); // Re-enable hint when hiding profile
    }

    // Update visibility state immediately
    setIsProfileVisible(willBeVisible);
    setHintProfileVisible(willBeVisible); // Update hint state immediately
    profileVisibilityRef.current = willBeVisible; // Update ref immediately
    isProfileVisibleShared.value = willBeVisible; // Sync shared value

    // Use reanimated animations
    profileTranslateY.value = withSpring(toValue, {
      damping: 15,
      stiffness: 150,
    });

    profileOpacity.value = withSpring(opacityValue, {
      damping: 15,
      stiffness: 150,
    });

    contentTranslateY.value = withSpring(contentToValue, {
      damping: 12,
      stiffness: 120,
    });

    // Show hint briefly after transition (text and chevron direction adapt automatically)
    // Only show hint when profile is being hidden
    if (!willBeVisible) {
      console.log('Profile being hidden, will show hint after delay');
      setTimeout(() => {
        console.log('Showing hint now, hintOpacity before:', hintOpacity.value);
        showHintTemporarily(3000); // Show hint for 3 seconds when profile is hidden
        console.log(
          'showHintTemporarily called, hintOpacity after:',
          hintOpacity.value
        );
      }, 500); // Small delay after profile hide animation
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .failOffsetX([-15, 15])
    .onBegin(() => {
      'worklet';
      // Store the starting position when gesture begins
    })
    .onUpdate((event) => {
      'worklet';
      // Update the profile position in real-time during gesture
      const startValue = isProfileVisibleShared.value ? 0 : -120;
      profileTranslateY.value = startValue + event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      const { translationY, velocityY } = event;

      // Determine if we should show or hide based on gesture
      const shouldShow = translationY > 30 || velocityY > 500;
      const shouldHide = translationY < -30 || velocityY < -500;

      if (shouldShow && !isProfileVisibleShared.value) {
        // Show profile
        isProfileVisibleShared.value = true;
        profileTranslateY.value = withSpring(0, {
          damping: 15,
          stiffness: 150,
        });
        profileOpacity.value = withSpring(1, { damping: 15, stiffness: 150 });
        contentTranslateY.value = withSpring(0, {
          damping: 12,
          stiffness: 120,
        });
        // React state will be synced via useEffect polling
      } else if (shouldHide && isProfileVisibleShared.value) {
        // Hide profile
        isProfileVisibleShared.value = false;
        profileTranslateY.value = withSpring(-120, {
          damping: 15,
          stiffness: 150,
        });
        profileOpacity.value = withSpring(0, { damping: 15, stiffness: 150 });
        contentTranslateY.value = withSpring(-80, {
          damping: 12,
          stiffness: 120,
        });
        // React state will be synced via useEffect polling
      } else {
        // Snap back to current state
        profileTranslateY.value = withSpring(
          isProfileVisibleShared.value ? 0 : -120,
          { damping: 15, stiffness: 150 }
        );
      }
    });

  // Debug function to help troubleshoot parent photo issue
  const debugParentData = async () => {
    try {
      console.log('🔍 DEBUG: Checking all stored parent data...');

      // Check all possible storage keys
      const parentData = await getUserData('parent', AsyncStorage);
      const studentData = await getUserData('student', AsyncStorage);
      const genericUserData = await AsyncStorage.getItem('userData');

      console.log('🔍 DEBUG: Parent data:', parentData);
      console.log('🔍 DEBUG: Student data:', studentData);
      console.log(
        '🔍 DEBUG: Generic userData:',
        genericUserData ? JSON.parse(genericUserData) : null
      );
      console.log('🔍 DEBUG: Current currentUserData:', currentUserData);

      // Check if there's any photo data anywhere
      const allPhotoFields = {
        'parentData.photo': parentData?.photo,
        'parentData.parent_photo': parentData?.parent_photo,
        'parentData.user_photo': parentData?.user_photo,
        'studentData.photo': studentData?.photo,
        'studentData.parent_photo': studentData?.parent_photo,
        'currentUserData.photo': currentUserData?.photo,
        'currentUserData.parent_photo': currentUserData?.parent_photo,
        'currentUserData.parent_info.parent_photo':
          currentUserData?.parent_info?.parent_photo,
      };

      console.log('🖼️ DEBUG: All photo fields:', allPhotoFields);

      Alert.alert(
        'Debug Info',
        `Check console for detailed parent data information. Photo fields found: ${
          Object.entries(allPhotoFields)
            .filter(([key, value]) => value)
            .map(([key]) => key)
            .join(', ') || 'None'
        }`
      );
    } catch (error) {
      console.error('❌ DEBUG: Error checking parent data:', error);
      Alert.alert('Debug Error', error.message);
    }
  };

  const handleDeleteStudent = (studentToDelete) => {
    Alert.alert(
      t('deleteStudent'),
      `${t('areYouSure')} ${studentToDelete.name || t('student')}?`,
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from state first for immediate UI update
              const updatedStudents = students.filter(
                (s) => s.id !== studentToDelete.id
              );
              setStudents(updatedStudents);

              // If the deleted student was selected, clear selection
              if (
                selectedStudent &&
                selectedStudent.id === studentToDelete.id
              ) {
                setSelectedStudent(null);
              }

              // Comprehensive cleanup of student-related data from AsyncStorage
              console.log('🧹 PARENT: Starting student data cleanup...');
              const cleanupResult = await cleanupStudentData(studentToDelete);

              if (cleanupResult.success) {
                console.log(
                  '✅ PARENT: Student data cleanup completed successfully'
                );
              } else {
                console.error(
                  '❌ PARENT: Student data cleanup failed:',
                  cleanupResult.error
                );
              }

              // Update student accounts list in AsyncStorage
              await AsyncStorage.setItem(
                'studentAccounts',
                JSON.stringify(updatedStudents)
              );

              // Show success message
              Alert.alert(t('success'), t('studentRemoved'));
            } catch (error) {
              Alert.alert(t('error'), t('failedToRemove'));

              // Reload the original list if there was an error
              console.error('Error removing student:', error);
              loadStudents();
            }
          },
        },
      ]
    );
  };

  // Render parent profile section
  const renderParentProfile = () => {
    if (!currentUserData) return null;

    const parentName =
      currentUserData?.name || currentUserData?.user_name || 'Parent';

    // Check multiple possible photo field names and log for debugging
    const parentPhoto =
      currentUserData?.photo ||
      currentUserData?.parent_photo ||
      currentUserData?.profile_photo ||
      currentUserData?.user_photo ||
      currentUserData?.parent_info?.photo ||
      currentUserData?.parent_info?.parent_photo ||
      currentUserData?.parent_info?.parent_info?.parent_photo ||
      currentUserData?.parent_info?.user_photo;

    // Debug logging to help identify the issue
    console.log('🖼️ PARENT PROFILE: Photo debug info:', {
      hasCurrentUserData: !!currentUserData,
      photo: currentUserData?.photo,
      parent_photo: currentUserData?.parent_photo,
      parent_info_photo: currentUserData?.parent_info?.parent_photo,
      user_photo: currentUserData?.user_photo,
      finalParentPhoto: parentPhoto,
      currentUserDataKeys: currentUserData ? Object.keys(currentUserData) : [],
    });

    return (
      <Animated.View
        style={[
          styles.parentProfileContainer,
          styles.parentProfileSection,
          profileAnimatedStyle,
          {
            height: isProfileVisible ? 'auto' : 0, // Collapse height when hidden
            overflow: 'hidden', // Hide content when collapsed
            marginTop: isProfileVisible ? 0 : 40,
            marginBottom: isProfileVisible ? 0 : 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('ParentProfile')}
          onLongPress={debugParentData} // Long press to debug parent data
          activeOpacity={0.7}
          style={styles.parentProfileTouchable}
        >
          <View style={styles.parentProfileCard}>
            <View style={styles.parentAvatarContainer}>
              {parentPhoto ? (
                <Image
                  source={{
                    uri: parentPhoto.startsWith('http')
                      ? parentPhoto
                      : `${Config.API_DOMAIN}${parentPhoto}`,
                  }}
                  style={styles.parentAvatar}
                  resizeMode='cover'
                  onError={(error) => {
                    console.log(
                      '❌ PARENT PROFILE: Image load error:',
                      error.nativeEvent.error
                    );
                    console.log(
                      '🔗 PARENT PROFILE: Failed image URL:',
                      parentPhoto.startsWith('http')
                        ? parentPhoto
                        : `${Config.API_DOMAIN}${parentPhoto}`
                    );
                  }}
                  onLoad={() => {
                    console.log('✅ PARENT PROFILE: Image loaded successfully');
                  }}
                />
              ) : (
                <View style={styles.parentAvatarPlaceholder}>
                  <FontAwesomeIcon
                    icon={faUser}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
              )}
            </View>

            <View style={styles.parentInfo}>
              <Text style={styles.parentName}>{parentName}</Text>
              <Text style={styles.parentEmail}>
                ID: {currentUserData?.parent_info?.parent_id}
              </Text>
              <Text style={styles.parentRole}>{t('tapToViewProfile')}</Text>
            </View>

            <FontAwesomeIcon
              icon={faEdit}
              size={14}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderStudentItem = ({ item }) => {
    const isSelected = selectedStudent && selectedStudent.id === item.id;

    return (
      <View style={styles.studentTileContainer}>
        <TouchableOpacity
          style={[styles.studentTile, isSelected && styles.selectedStudentTile]}
          onPress={() => handleStudentPress(item)}
        >
          {item.photo ? (
            <Image
              source={{ uri: item.photo }}
              style={[
                styles.studentPhoto,
                isSelected && styles.selectedStudentPhoto,
              ]}
              resizeMode='cover'
            />
          ) : (
            <View
              style={[
                styles.studentIconContainer,
                isSelected && styles.selectedStudentIcon,
              ]}
            >
              <FontAwesomeIcon icon={faChild} size={24} color='#fff' />
            </View>
          )}

          <View style={styles.studentInfoContainer}>
            <Text
              style={[
                styles.studentName,
                isSelected && styles.selectedStudentText,
              ]}
            >
              {item.name || t('student')}
            </Text>
            <Text style={styles.studentClass}>
              Class:{' '}
              {item.class_name || item.grade_name || t('classNotAvailable')}
            </Text>
            <Text style={styles.studentDetails}>
              {t('id')}: {item.id || t('notAvailable')}
            </Text>

            <Text style={styles.studentEmail}>
              Branch: {item.branch_name || t('notAvailable')}
            </Text>
          </View>

          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{t('selected')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>{t('noStudentAccounts')}</Text>
        <Text style={styles.emptySubtext}>{t('tapToAdd')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}

        <View style={styles.navigationHeader}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              {
                fontSize: getResponsiveHeaderFontSize(2, t('parentDashboard')),
              },
            ]}
          >
            {t('parentDashboard')}
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => {
                // Navigate to parent-specific messaging screen
                // Use parent's auth code from unified login or current user data
                const parentAuthCode =
                  currentUserData?.auth_code || currentUserData?.authCode;

                if (parentAuthCode) {
                  navigation.navigate('ParentMessagingScreen', {
                    authCode: parentAuthCode,
                    parentName:
                      currentUserData?.name ||
                      currentUserData?.user_name ||
                      'Parent',
                    userType: 'parent',
                    children: students, // Pass children data for context
                  });
                } else {
                  // Fallback to student messaging if no parent auth code
                  if (selectedStudent) {
                    navigation.navigate('StudentMessagingScreen', {
                      authCode: selectedStudent.authCode,
                      studentName: selectedStudent.name,
                    });
                  } else if (students.length > 0) {
                    navigation.navigate('StudentMessagingScreen', {
                      authCode: students[0].authCode,
                      studentName: students[0].name,
                    });
                  } else {
                    Alert.alert(t('noStudents'), t('pleaseAddStudent'));
                  }
                }
              }}
            >
              <FontAwesomeIcon icon={faComments} size={18} color='#fff' />
              <MessageBadge
                userType='parent'
                selectedStudent={selectedStudent}
                showAllStudents={false}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => {
                // Navigate to notification screen with selected student context
                if (selectedStudent) {
                  navigation.navigate('NotificationScreen', {
                    userType: 'parent',
                    authCode: selectedStudent.authCode,
                    studentName: selectedStudent.name,
                    studentId: selectedStudent.id,
                  });
                } else {
                  // If no student selected, show alert or navigate to first student
                  if (students.length > 0) {
                    navigation.navigate('NotificationScreen', {
                      userType: 'parent',
                      authCode: students[0].authCode,
                      studentName: students[0].name,
                      studentId: students[0].id,
                    });
                  } else {
                    Alert.alert(t('noStudents'), t('pleaseAddStudent'));
                  }
                }
              }}
            >
              <FontAwesomeIcon icon={faBell} size={18} color='#fff' />
              <ParentNotificationBadge
                selectedStudent={selectedStudent}
                showAllStudents={false}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleLogout}
            >
              <FontAwesomeIcon icon={faSignOutAlt} size={18} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Demo Mode Indicator */}
      {currentUserData?.demo_mode && (
        <DemoModeIndicator
          userData={currentUserData}
          style={{ marginHorizontal: 16 }}
        />
      )}

      <View style={styles.content}>
        {/* Parent Profile Section */}
        {renderParentProfile()}

        {/* Swipe Hint - Positioned absolutely, moves with profile visibility */}
        <Animated.View
          pointerEvents='box-none'
          style={[
            styles.swipeHintFixed,
            hintAnimatedStyle,
            {
              top: hintProfileVisible ? 90 : -20, // Move further down when profile is visible
            },
          ]}
        >
          <TouchableOpacity
            onPress={toggleProfileVisibility}
            style={styles.swipeHintTouchable}
            activeOpacity={0.7}
          >
            <Text style={styles.swipeHintText}>
              {hintProfileVisible
                ? t('swipeUpToHide') || 'Swipe up to hide profile'
                : t('swipeDownToShow') || 'Swipe down to see profile'}
            </Text>
            {/* Double Chevron Animation */}
            <Animated.View
              style={[styles.doubleChevronContainer, hintArrowAnimatedStyle]}
            >
              <FontAwesomeIcon
                icon={isProfileVisible ? faChevronUp : faChevronDown}
                size={10}
                color={theme.colors.textSecondary}
                style={styles.chevronFirst}
              />
              <FontAwesomeIcon
                icon={isProfileVisible ? faChevronUp : faChevronDown}
                size={10}
                color={theme.colors.textSecondary}
                style={styles.chevronSecond}
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Animated Content Section (Children + Menu) with Swipe Gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.contentSection,
              contentAnimatedStyle,
              {
                paddingTop: isHintVisible ? 20 : 0,
              },
            ]}
          >
            {/* Children Section */}
            <View style={styles.childrenSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {students.length > 1 ? t('yourChildren') : t('yourChild')}
                </Text>
                {students.length > 2 && (
                  <TouchableOpacity
                    style={styles.scrollIndicator}
                    onPress={() => {
                      if (students.length > 2 && flatListRef.current) {
                        // Find current student index
                        const currentIndex = selectedStudent
                          ? students.findIndex(
                              (s) => s.id === selectedStudent.id
                            )
                          : 0;
                        const nextIndex = (currentIndex + 1) % students.length;
                        const nextStudent = students[nextIndex];

                        // Select the next student using the proper handler
                        if (nextStudent) {
                          handleStudentPress(nextStudent);
                        }

                        // Scroll to the next item
                        flatListRef.current.scrollToIndex({
                          index: nextIndex,
                          animated: true,
                        });
                      }
                    }}
                  >
                    <Text style={styles.scrollIndicatorText}>
                      {t('scrollForMore')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text>Loading student accounts...</Text>
                </View>
              ) : students.length === 0 ? (
                <EmptyListComponent />
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={students}
                  renderItem={renderStudentItem}
                  keyExtractor={(_, index) => `student-${index}`}
                  contentContainerStyle={[
                    styles.listContainer,
                    { paddingHorizontal: 24 }, // Shift content right for better centering
                  ]}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                  snapToInterval={346} // Card width (330) + separator (16)
                  snapToAlignment='center'
                  decelerationRate='fast'
                  getItemLayout={(data, index) => ({
                    length: 346, // Card width + separator
                    offset: 346 * index,
                    index,
                  })}
                  onScroll={(event) => {
                    const contentOffset = event.nativeEvent.contentOffset.x;
                    const index = Math.round(contentOffset / 346);
                    const newIndex = Math.max(
                      0,
                      Math.min(index, students.length - 1)
                    );

                    // Update pagination dots immediately during scroll
                    if (newIndex !== currentIndex) {
                      setCurrentIndex(newIndex);
                    }
                  }}
                  scrollEventThrottle={16} // Update at 60fps for smooth pagination
                  onMomentumScrollEnd={(event) => {
                    const contentOffset = event.nativeEvent.contentOffset.x;
                    const index = Math.round(contentOffset / 346);
                    setCurrentIndex(
                      Math.max(0, Math.min(index, students.length - 1))
                    );
                  }}
                  onScrollToIndexFailed={(info) => {
                    // Handle the failure by scrolling to a nearby item
                    setTimeout(() => {
                      if (flatListRef.current && students.length > 0) {
                        flatListRef.current.scrollToIndex({
                          index: Math.min(
                            info.highestMeasuredFrameIndex,
                            students.length - 1
                          ),
                          animated: true,
                        });
                      }
                    }, 100);
                  }}
                />
              )}

              {/* Dotted Pagination Indicator */}
              {students.length > 1 && (
                <View style={styles.paginationContainer}>
                  {students.map((_, index) => {
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setCurrentIndex(index);
                          flatListRef.current?.scrollToIndex({
                            index,
                            animated: true,
                          });
                        }}
                        style={styles.paginationDotTouchable}
                      >
                        <Animated.View
                          style={[
                            styles.paginationDot,
                            paginationAnimatedStyles[index],
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Menu Section */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{t('menu')}</Text>

              <ScrollView
                style={styles.menuScrollView}
                contentContainerStyle={[
                  styles.actionTilesGrid,
                  isIPadDevice && styles.iPadActionTilesGrid,
                  isIPadDevice &&
                    isLandscape &&
                    styles.iPadLandscapeActionTilesGrid,
                  isTabletDevice && styles.tabletActionTilesGrid,
                  isTabletDevice &&
                    isLandscape &&
                    styles.tabletLandscapeActionTilesGrid,
                  { alignItems: 'center' }, // Centers the content horizontally within the scroll view
                ]}
                showsVerticalScrollIndicator={false}
              >
                {getMenuItems(t).map((item, index) => {
                  const menuItems = getMenuItems(t);
                  const totalItems = menuItems.length;

                  // Calculate columns per row based on device type
                  let itemsPerRow = 3; // Default for mobile
                  if (isIPadDevice && isLandscape) {
                    itemsPerRow = 6;
                  } else if (isTabletDevice && isLandscape) {
                    itemsPerRow = 6;
                  } else if (isIPadDevice) {
                    itemsPerRow = 4;
                  } else if (isTabletDevice) {
                    itemsPerRow = 4;
                  }

                  // Check if this is the last item in an incomplete row
                  const isLastRow =
                    Math.floor(index / itemsPerRow) ===
                    Math.floor((totalItems - 1) / itemsPerRow);
                  const isLastInRow =
                    (index + 1) % itemsPerRow === 0 || index === totalItems - 1;
                  const isIncompleteRow = totalItems % itemsPerRow !== 0;
                  // Disable expansion for iPad/tablet in both orientations to maintain consistent tile sizes
                  const shouldExpand =
                    isLastRow &&
                    isLastInRow &&
                    isIncompleteRow &&
                    !isIPadDevice &&
                    !isTabletDevice;

                  // Calculate minimum height based on device type
                  let minHeight = (screenWidth - 30) / 3 - 8; // Default mobile
                  if (isIPadDevice && isLandscape) {
                    minHeight = (screenWidth - 100) / 6 - 6;
                  } else if (isTabletDevice && isLandscape) {
                    minHeight = (screenWidth - 90) / 6 - 8;
                  } else if (isIPadDevice) {
                    minHeight = (screenWidth - 80) / 4 - 8;
                  } else if (isTabletDevice) {
                    minHeight = (screenWidth - 70) / 4 - 10;
                  }

                  return (
                    <QuickActionTile
                      key={item.id}
                      title={item.title}
                      subtitle='' // Parent menu items don't have subtitles
                      icon={item.icon}
                      backgroundColor={item.backgroundColor}
                      iconColor={item.iconColor}
                      onPress={
                        item.disabled
                          ? undefined
                          : () => handleMenuItemPress(item.action)
                      }
                      disabled={item.disabled}
                      badge={
                        item.comingSoon ? (
                          <ComingSoonBadge
                            text={t('soon')}
                            theme={theme}
                            fontSizes={fontSizes}
                          />
                        ) : undefined
                      }
                      styles={styles}
                      isLandscape={isLandscape}
                      additionalStyle={
                        shouldExpand
                          ? {
                              flex: 1,
                              marginRight: 0,
                              aspectRatio: undefined, // Remove aspect ratio constraint for expanding tiles
                              height: minHeight, // Set exact height to match other tiles
                            }
                          : {}
                      }
                    />
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes, screenWidth, screenHeight) =>
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
      marginBottom: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,

      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 16,
    },
    // Legacy header style (keeping for compatibility)
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    headerActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageButton: {
      // width: 36,
      // height: 36,
      // borderRadius: 18,
      // backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    messageBadge: {
      badge: {
        backgroundColor: '#FF3B30',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',

        position: 'absolute',
        top: -10,
        right: -10,
        borderWidth: 2,
        borderColor: theme.colors.background,
      },
    },
    messageBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    notificationButton: {
      // width: 36,
      // height: 36,
      // borderRadius: 18,
      // backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // No longer needed with FontAwesome icon
    content: {
      flex: 1,
      padding: 10,
    },
    // Parent Profile Styles
    parentProfileSection: {
      marginHorizontal: 8,
    },
    parentProfileCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      ...createMediumShadow(theme),
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    parentAvatarContainer: {
      marginRight: 12,
    },
    parentAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    parentAvatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    parentInfo: {
      flex: 1,
    },
    parentName: {
      fontSize: fontSizes.body,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    parentRole: {
      marginTop: 3,
      fontSize: fontSizes.caption,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    parentStatsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    parentStat: {
      alignItems: 'center',
      flex: 1,
    },
    parentStatNumber: {
      fontSize: fontSizes.medium,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    parentStatLabel: {
      fontSize: fontSizes.extraSmall,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    parentStatDivider: {
      width: 1,
      height: 30,
      backgroundColor: theme.colors.border,
      marginHorizontal: 12,
    },
    childrenSection: {
      marginBottom: 5,
    },
    scrollIndicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 8,
    },
    scrollIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.1,
        radius: 4,
        elevation: 2,
      }),
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    scrollIndicatorText: {
      fontSize: fontSizes.extraSmall,
      color: theme.colors.textSecondary,
      marginLeft: 6,
      fontWeight: '500',
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 20,
    },
    paginationDotTouchable: {
      paddingHorizontal: 4,

      justifyContent: 'center',
      alignItems: 'center',
    },
    paginationDot: {
      height: 8,
      borderRadius: 4,
      marginHorizontal: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },

    menuSection: {
      flex: 1,
    },
    menuScrollView: {
      flex: 1,
      minHeight: 600,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      marginBottom: 10,
      color: theme.colors.text,
      marginLeft: 15,
    },
    listContainer: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    studentTileContainer: {
      position: 'relative',
      marginVertical: 6,
      width: 330,
      minHeight: 120,
    },
    studentTile: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      width: '100%',
      minHeight: 120,
      flexDirection: 'row',
      alignItems: 'center',
      // Platform-specific shadow
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 1,
      }),
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
    },
    deleteButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: theme.colors.surface,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      // Platform-specific shadow
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 1,
      }),
    },
    selectedStudentTile: {
      borderColor: theme.colors.primary,
      // Platform-specific background: semi-transparent on iOS, clean on Android
      backgroundColor:
        Platform.OS === 'ios'
          ? theme.colors.primary + '0D'
          : theme.colors.surface,
      // Add a subtle inner glow effect for Android
      ...(Platform.OS === 'android' && {
        elevation: 3,
      }),
      // iOS-specific glow effect
      ...(Platform.OS === 'ios' && {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      }),
    },
    selectedStudentIcon: {
      backgroundColor: theme.colors.primary,
    },
    selectedStudentText: {
      color: theme.colors.text,
    },
    selectedBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 10,
    },
    selectedBadgeText: {
      color: '#fff',
      fontSize: fontSizes.badgeText,
      fontWeight: 'bold',
    },
    studentIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    studentPhoto: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedStudentPhoto: {
      borderColor: theme.colors.primary,
    },
    studentInfoContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    studentName: {
      fontSize: fontSizes.medium,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    studentDetails: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    studentClass: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      marginBottom: 2,
    },
    studentEmail: {
      fontSize: fontSizes.caption,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    emptyContainer: {
      width: '100%',
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    emptyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      // Platform-specific shadow
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 1,
      }),
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Quick Actions - Tile Layout (3 per row on mobile)
    actionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start', // Changed from space-between to support flex expansion
      paddingBottom: 170, // Add padding for scrollable content
      paddingHorizontal: 3, // Add padding for scrollable content
    },
    // iPad-specific grid layout - 4 tiles per row, wraps to next row for additional tiles
    iPadActionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(8, (screenWidth - 80 - ((screenWidth - 80) / 4) * 4) / 3), // Dynamic gap calculation
    },
    // Tablet-specific grid layout - 4 tiles per row, wraps to next row for additional tiles
    tabletActionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(10, (screenWidth - 80 - ((screenWidth - 80) / 4) * 4) / 3), // Dynamic gap calculation
    },
    // iPad landscape-specific grid layout - 6 tiles per row, wraps for additional tiles
    iPadLandscapeActionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(6, (screenWidth - 80 - ((screenWidth - 80) / 6) * 6) / 5), // Dynamic gap for 6 tiles
    },
    // Tablet landscape-specific grid layout - 6 tiles per row, wraps for additional tiles
    tabletLandscapeActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(8, (screenWidth - 90 - ((screenWidth - 90) / 6) * 6) / 5), // Dynamic gap for 6 tiles
    },
    actionTile: {
      width: (screenWidth - 30) / 3 - 8, // 3 tiles per row: screen width - padding (24*2) - margins (8*3) / 3
      minWidth: (screenWidth - 30) / 3 - 8, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 20, // Slightly smaller border radius for smaller tiles
      padding: 14, // Reduced padding for smaller tiles
      justifyContent: 'center', // Center content vertically for better balance
      alignItems: 'center', // Center content horizontally for smaller tiles
      position: 'relative',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      marginHorizontal: 4, // Add horizontal margin for spacing
      marginBottom: 8, // Add bottom margin for vertical spacing
      ...createMediumShadow(theme),
    },
    // iPad-specific action tile - optimized for 4 per row, wraps for additional tiles
    iPadActionTile: {
      width: (screenWidth - 80) / 4 - 8, // Optimized for 4 tiles per row with wrapping support
      minWidth: (screenWidth - 80) / 4 - 8, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 16,
      padding: 12,
      marginHorizontal: 4,
      marginBottom: 8,
      ...createCustomShadow(theme, {
        height: 3,
        opacity: 0.15,
        radius: 8,
        elevation: 4,
      }),
    },
    // Tablet-specific action tile - optimized for 4 per row, wraps for additional tiles
    tabletActionTile: {
      width: (screenWidth - 70) / 4 - 10, // Optimized for 4 tiles per row with wrapping support
      minWidth: (screenWidth - 70) / 4 - 10, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 24,
      padding: 14,
      marginHorizontal: 5,
      marginBottom: 10,
      ...createCustomShadow(theme, {
        height: 4,
        opacity: 0.18,
        radius: 10,
        elevation: 6,
      }),
    },
    // iPad landscape-specific action tile - optimized for 6 per row
    iPadLandscapeActionTile: {
      width: (screenWidth - 100) / 6 - 6, // 6 tiles per row in landscape with wrapping support
      minWidth: (screenWidth - 100) / 6 - 6, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 24,
      padding: 10,
      marginHorizontal: 3,
      marginBottom: 6,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.12,
        radius: 6,
        elevation: 3,
      }),
    },
    // Tablet landscape-specific action tile - optimized for 6 per row
    tabletLandscapeActionTile: {
      width: (screenWidth - 90) / 6 - 8, // 6 tiles per row in landscape with wrapping support
      minWidth: (screenWidth - 90) / 6 - 8, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 24,
      padding: 12,
      marginHorizontal: 4,
      marginBottom: 8,
      ...createCustomShadow(theme, {
        height: 3,
        opacity: 0.15,
        radius: 8,
        elevation: 4,
      }),
    },
    disabledTile: {
      opacity: 0.7,
    },
    tileIconContainer: {
      width: 50, // Smaller icon container for 3-per-row layout
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 5, // Reduced margin for smaller tiles
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      marginTop: 20,
    },
    tileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 5, 10), // Smaller font for 3-per-row layout
      fontWeight: '700',
      color: '#fff',
      marginBottom: 3, // Reduced margin
      letterSpacing: 0.2,
      textAlign: 'center', // Center text for better balance in smaller tiles
    },
    tileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1, 10), // Smaller subtitle font
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
      marginBottom: 6, // Reduced margin
      textAlign: 'center', // Center text for better balance
    },
    // iPad-specific tile text styles - smaller
    iPadTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 2, 12),
      marginBottom: 2,
    },
    iPadTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1, 10),
      marginBottom: 4,
    },
    // Tablet-specific tile text styles
    tabletTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 1, 13),
      marginBottom: 3,
    },
    tabletTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 0.5, 11),
      marginBottom: 6,
    },
    // iPad landscape-specific tile text styles - even smaller for 6 per row
    iPadLandscapeTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 3, 10),
      marginBottom: 1,
    },
    iPadLandscapeTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 2, 8),
      marginBottom: 2,
    },
    // Tablet landscape-specific tile text styles
    tabletLandscapeTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 2, 11),
      marginBottom: 2,
    },
    tabletLandscapeTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1.5, 9),
      marginBottom: 3,
    },
    // iPad-specific tile icon container - smaller
    iPadTileIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginBottom: 8,
    },
    // Tablet-specific tile icon container
    // tabletTileIconContainer: {
    //   width: 70,
    //   height: 70,
    //   borderRadius: 21,
    //   marginBottom: 10,
    // },
    // iPad landscape-specific tile icon container - even smaller for 6 per row
    iPadLandscapeTileIconContainer: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginBottom: 6,
    },
    // Tablet landscape-specific tile icon container
    tabletLandscapeTileIconContainer: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginBottom: 8,
    },
    menuItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      width: (screenWidth - 48) / 3 - 8, // 3 tiles per row: screen width - padding (24*2) - margins (8*3) / 3
      aspectRatio: 1, // Square items
      alignItems: 'center',
      justifyContent: 'center', // Center content vertically
      marginHorizontal: 4, // Add horizontal margin for spacing
      marginBottom: 8, // Add bottom margin for vertical spacing
      // Platform-specific shadow
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 1,
      }),
    },
    // iPad-specific menu item - optimized for 4 per row, wraps for additional items
    iPadMenuItem: {
      width: (screenWidth - 80) / 4 - 8, // Optimized for 4 items per row with wrapping support
      minWidth: 160, // Minimum width to ensure items don't get too small
      aspectRatio: 1, // Square items
      borderRadius: 10,
      padding: 12,
      marginHorizontal: 4,
      marginBottom: 8,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.06,
        radius: 4,
        elevation: 2,
      }),
    },
    // Tablet-specific menu item - optimized for 4 per row, wraps for additional items
    tabletMenuItem: {
      width: (screenWidth - 70) / 4 - 10, // Optimized for 4 items per row with wrapping support
      minWidth: 150, // Minimum width to ensure items don't get too small
      aspectRatio: 1, // Square items
      borderRadius: 18,
      padding: 13,
      marginHorizontal: 5,
      marginBottom: 10,
      ...createCustomShadow(theme, {
        height: 1.5,
        opacity: 0.07,
        radius: 3.5,
        elevation: 1.5,
      }),
    },
    // iPad landscape-specific menu item - optimized for 6 per row
    iPadLandscapeMenuItem: {
      width: (screenWidth - 100) / 6 - 6, // 6 items per row in landscape with wrapping support
      minWidth: 120, // Minimum width for landscape items
      aspectRatio: 1, // Square items
      borderRadius: 18,
      padding: 10,
      marginHorizontal: 3,
      marginBottom: 6,
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.05,
        radius: 3,
        elevation: 1,
      }),
    },
    // Tablet landscape-specific menu item - optimized for 6 per row
    tabletLandscapeMenuItem: {
      width: (screenWidth - 90) / 6 - 8, // 6 items per row in landscape with wrapping support
      minWidth: 110, // Minimum width for landscape items
      aspectRatio: 1, // Square items
      borderRadius: 18,
      padding: 11,
      marginHorizontal: 4,
      marginBottom: 8,
      ...createCustomShadow(theme, {
        height: 1.2,
        opacity: 0.06,
        radius: 3.2,
        elevation: 1.2,
      }),
    },
    menuIconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    // iPad-specific menu icon container - smaller
    iPadMenuIconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    // Tablet-specific menu icon container
    tabletMenuIconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 9,
    },
    // iPad landscape-specific menu icon container - even smaller for 6 per row
    iPadLandscapeMenuIconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    // Tablet landscape-specific menu icon container
    tabletLandscapeMenuIconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 7,
    },
    menuItemText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 16,
    },
    // iPad-specific menu item text - smaller
    iPadMenuItemText: {
      fontSize: Math.max(fontSizes.bodySmall - 2, 11),
      marginBottom: 2,
    },
    // Tablet-specific menu item text
    tabletMenuItemText: {
      fontSize: Math.max(fontSizes.bodySmall - 1, 12),
      marginBottom: 3,
    },
    // iPad landscape-specific menu item text - even smaller for 6 per row
    iPadLandscapeMenuItemText: {
      fontSize: Math.max(fontSizes.bodySmall - 3, 9),
      marginBottom: 1,
    },
    parentEmail: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    // Animated Parent Profile Styles
    parentProfileContainer: {
      marginTop: 40,
      paddingHorizontal: 8,
      paddingBottom: 20,
    },
    swipeHint: {
      backgroundColor: 'transparent', // Transparent background
      marginBottom: 4,
    },
    swipeHintFixed: {
      backgroundColor: 'transparent', // Transparent background
      position: 'absolute',
      top: 0, // Right under the header
      left: 0,
      right: 0,
      zIndex: 10, // Ensure it's above other content (in front of children)
      paddingVertical: 8, // Vertical padding for better touch area
    },
    swipeHintTouchable: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      flexDirection: 'column', // Stack text and chevrons vertically
      alignItems: 'center',
      justifyContent: 'center',
    },
    swipeHintText: {
      fontSize: fontSizes.badgeText, // Smaller text for subtle hint
      color: theme.colors.textSecondary,
      fontWeight: '400', // Lighter weight
      marginBottom: 4, // Less space between text and chevrons
      textAlign: 'center',
      opacity: 0.8, // Slightly transparent for subtlety
    },
    doubleChevronContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevronFirst: {
      marginBottom: -2, // Overlap the chevrons slightly
    },
    chevronSecond: {
      opacity: 0.7, // Make second chevron slightly transparent
    },
    parentProfileTouchable: {
      width: '100%',
    },
    // Content section that includes both children and menu
    contentSection: {
      flex: 1,
      paddingTop: 40, // Ensure content doesn't go behind header
    },
    // Tablet landscape-specific menu item text
    tabletLandscapeMenuItemText: {
      fontSize: Math.max(fontSizes.bodySmall - 2, 10),
      marginBottom: 2,
    },
    disabledMenuItem: {
      opacity: 0.6,
      backgroundColor: theme.colors.disabled,
    },
    disabledMenuText: {
      color: theme.colors.textSecondary,
    },
    comingSoonBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#FF9500',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    comingSoonText: {
      color: '#fff',
      fontSize: 3,
      fontWeight: 'bold',
    },
  });
