import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  getResponsiveHeaderFontSize,
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
  faFileAlt,
  faHeartbeat,
  faClock,
  faSignOutAlt,
  faGear,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Config } from '../config/env';
import ParentNotificationBadge from '../components/ParentNotificationBadge';
import MessageBadge from '../components/MessageBadge';
import { QuickActionTile, ComingSoonBadge } from '../components';
import { performLogout } from '../services/logoutService';
import { isIPad, isTablet } from '../utils/deviceDetection';
import DemoModeIndicator from '../components/DemoModeIndicator';
import { updateLastLogin } from '../services/deviceService';
import { saveUserData } from '../services/authService';

import { useFocusEffect } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  {
    id: 'materials',
    title: t('materials'),
    icon: faFileAlt,
    backgroundColor: '#4CAF50',
    iconColor: '#fff',
    action: 'materials',
    disabled: false,
    comingSoon: false,
  },
];

export default function StudentScreen({ navigation }) {
  console.log('🎯 STUDENT SCREEN: Component is rendering...');

  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  // Device and orientation detection
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();
  const isLandscape = screenWidth > screenHeight;

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const styles = createStyles(theme, fontSizes);

  // Load student data on component mount
  useEffect(() => {
    loadStudentData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStudentData();
    }, [])
  );

  // Compute current ISO week number
  const getISOWeekNumber = (date) => {
    const tmp = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = tmp.getUTCDay() || 7; // Monday=1, Sunday=7
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum); // Nearest Thursday
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  };
  const currentWeek = getISOWeekNumber(new Date());

  const loadStudentData = async () => {
    try {
      setLoading(true);

      // Get student data from AsyncStorage - try both generic and student-specific keys
      const userData = await AsyncStorage.getItem('userData');
      const studentUserData = await AsyncStorage.getItem('studentUserData');

      console.log('🔍 STUDENT SCREEN: AsyncStorage keys check:', {
        hasUserData: !!userData,
        hasStudentUserData: !!studentUserData,
      });

      // Use student-specific data if available, otherwise fall back to generic
      const dataToUse = studentUserData || userData;
      const keyUsed = studentUserData ? 'studentUserData' : 'userData';

      if (dataToUse) {
        console.log(
          `🔍 STUDENT SCREEN: Using data from ${keyUsed}:`,
          dataToUse
        );
        const parsedUserData = JSON.parse(dataToUse);
        console.log(
          '🔍 STUDENT SCREEN: Parsed userData type:',
          typeof parsedUserData
        );

        // Check if this is actually a student user
        if (parsedUserData.userType !== 'student') {
          Alert.alert(t('error'), t('accessDenied'), [
            {
              text: t('ok'),
              onPress: () => navigation.replace('Login'),
            },
          ]);
          return;
        }

        // Debug: Log the entire parsed user data structure
        console.log('🔍 STUDENT SCREEN: Full parsed user data structure:', {
          hasPersonalInfo: !!parsedUserData?.personal_info,
          personalInfoKeys: parsedUserData?.personal_info
            ? Object.keys(parsedUserData.personal_info)
            : 'No personal_info',
          topLevelKeys: Object.keys(parsedUserData),
        });

        // Normalize the data structure for consistent property names
        // Try multiple possible locations for the profile photo
        const profilePhotoPath =
          parsedUserData?.personal_info?.profile_photo ||
          parsedUserData?.originalResponse?.personal_info?.profile_photo ||
          null;
        const profilePhoto = profilePhotoPath || null;

        const normalizedStudentData = {
          ...parsedUserData,
          name: parsedUserData.name || parsedUserData.user_name,
          authCode: parsedUserData.authCode || parsedUserData.auth_code,
          id: parsedUserData.id || parsedUserData.user_id,
          class_name:
            parsedUserData?.academic_info?.classroom_name ||
            parsedUserData.className,
          branch_name: parsedUserData?.academic_info?.branch_name,
          photo: profilePhoto,
        };

        // Debug logging for photo data
        console.log('📸 STUDENT SCREEN: Photo data processing:', {
          directPersonalInfo: parsedUserData?.personal_info?.profile_photo,
          originalResponsePersonalInfo:
            parsedUserData?.originalResponse?.personal_info?.profile_photo,
          profilePhotoPath,
          finalProfilePhoto: profilePhoto,
          normalizedPhoto: normalizedStudentData.photo,
        });

        setStudentData(normalizedStudentData);

        // Save normalized data back to AsyncStorage so other screens can access the photo
        try {
          await saveUserData(normalizedStudentData, AsyncStorage);
          console.log(
            '✅ STUDENT SCREEN: Saved normalized student data (including photo) to AsyncStorage'
          );
        } catch (saveError) {
          console.warn(
            '⚠️ STUDENT SCREEN: Failed to save normalized data:',
            saveError
          );
        }

        // Update last login timestamp
        await updateLastLogin(normalizedStudentData.authCode);
      } else {
        console.error('❌ STUDENT: No student data found');
        Alert.alert(t('error'), t('noStudentDataFound'), [
          {
            text: t('ok'),
            onPress: () => navigation.replace('Home'),
          },
        ]);
      }
    } catch (error) {
      console.error('❌ STUDENT: Error loading student data:', error);
      Alert.alert(t('error'), t('failedToLoadStudentData'), [
        {
          text: t('retry'),
          onPress: () => loadStudentData(),
        },
        {
          text: t('logout'),
          onPress: () => handleLogout(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemPress = async (action) => {
    if (!studentData) {
      Alert.alert(t('error'), t('noStudentDataFound'));
      return;
    }

    // Check if student has an authCode
    if (!studentData.authCode) {
      Alert.alert(t('authenticationError'), t('unableToAuthenticate'));
      return;
    }

    // Handle different menu actions
    switch (action) {
      case 'grades':
        navigation.navigate('GradesScreen', {
          studentName: studentData.name,
          authCode: studentData.authCode,
        });
        break;
      case 'attendance':
        navigation.navigate('AttendanceScreen', {
          studentName: studentData.name,
          authCode: studentData.authCode,
        });
        break;
      case 'assignments':
        navigation.navigate('AssignmentsScreen', {
          studentName: studentData.name,
          authCode: studentData.authCode,
        });
        break;
      case 'schedule':
        navigation.navigate('TimetableScreen', {
          studentName: studentData.name,
          authCode: studentData.authCode,
        });
        break;
      case 'discipline':
        navigation.navigate('BehaviorScreen', {
          studentName: studentData.name,
          authCode: studentData.authCode,
        });
        break;
      case 'messages':
        navigation.navigate('StudentMessagingScreen', {
          authCode: studentData.authCode,
          studentName: studentData.name,
        });
        break;
      case 'library':
        navigation.navigate('LibraryScreen', {
          studentName: studentData.name,
          authCode: studentData.authCode,
        });
        break;
      case 'health':
        navigation.navigate('StudentHealthScreen', {
          studentName: studentData.name,
          authCode: studentData.authCode,
        });
        break;
      case 'calendar':
        // Save student data as temporary calendar user data
        try {
          await AsyncStorage.setItem(
            'calendarUserData',
            JSON.stringify(studentData)
          );
          navigation.navigate('UserCalendar', { mode: 'combined' });
        } catch (error) {
          console.error('Error saving student data for calendar:', error);
          Alert.alert(t('error'), t('failedToAccessCalendar'));
        }
        break;
      case 'materials':
        navigation.navigate('WorkspaceScreen', {
          userData: studentData,
          studentData: studentData,
        });
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('logout'), t('confirmLogout'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🚪 STUDENT: Starting logout process...');
            console.log(
              '🚪 STUDENT: Current student data:',
              studentData?.username || 'No username'
            );

            // Use the comprehensive logout service
            const logoutResult = await performLogout({
              userType: 'student', // Specify that this is a student logout
              clearDeviceToken: false, // Keep device token for future logins
              clearAllData: false, // Student-specific data will be cleared based on userType
            });

            console.log('🚪 STUDENT: Logout result:', logoutResult);

            if (logoutResult.success) {
              console.log('✅ STUDENT: Logout completed successfully');

              // Verify data is cleared by checking AsyncStorage
              const remainingData = await AsyncStorage.multiGet([
                'userData',
                'studentUserData',
                'studentAccounts',
                'selectedStudent',
              ]);
              console.log(
                '🔍 STUDENT: Remaining data after logout:',
                remainingData
              );

              navigation.replace('Home');
            } else {
              console.error('❌ STUDENT: Logout failed:', logoutResult.error);
              // Fallback to comprehensive student data cleanup
              await AsyncStorage.multiRemove([
                'userData',
                'studentUserData',
                'studentAccounts',
                'selectedStudent',
                'selectedStudentId',
                'calendarUserData',
                'studentGrades',
                'attendanceData',
                'homeworkData',
                'libraryData',
                'healthData',
              ]);
              navigation.replace('Home');
            }
          } catch (error) {
            console.error('❌ STUDENT: Error during logout:', error);
            // Fallback to comprehensive student data cleanup
            try {
              await AsyncStorage.multiRemove([
                'userData',
                'studentUserData',
                'studentAccounts',
                'selectedStudent',
                'selectedStudentId',
                'calendarUserData',
                'studentGrades',
                'attendanceData',
                'homeworkData',
                'libraryData',
                'healthData',
              ]);
              navigation.replace('Home');
            } catch (fallbackError) {
              console.error(
                '❌ STUDENT: Fallback logout also failed:',
                fallbackError
              );
              // Last resort - just navigate away
              navigation.replace('Home');
            }
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!studentData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('noStudentDataFound')}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.retryButtonText}>{t('backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header with Student Info */}
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
                fontSize: getResponsiveHeaderFontSize(2, t('studentDashboard')),
              },
            ]}
          >
            {t('studentDashboard')}
          </Text>

          {studentData && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => {
                  navigation.navigate('StudentMessagingScreen', {
                    authCode: studentData.authCode,
                    studentName: studentData.name,
                  });
                }}
              >
                <FontAwesomeIcon icon={faComments} size={18} color='#fff' />
                <MessageBadge
                  userType='student'
                  selectedStudent={studentData}
                  showAllStudents={false}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => {
                  navigation.navigate('NotificationScreen', {
                    userType: 'student',
                    authCode: studentData.authCode,
                    studentName: studentData.name,
                    studentId: studentData.id,
                  });
                }}
              >
                <FontAwesomeIcon icon={faBell} size={18} color='#fff' />
                <ParentNotificationBadge
                  selectedStudent={studentData}
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
          )}
        </View>

        {/* Student Info Card (tap to open profile) */}
        {studentData && (
          <TouchableOpacity
            style={styles.studentInfoCard}
            onPress={() =>
              navigation.navigate('StudentProfile', { student: studentData })
            }
            activeOpacity={0.8}
          >
            {studentData.photo ? (
              <Image
                source={{ uri: studentData.photo }}
                style={styles.studentPhoto}
                resizeMode='cover'
                onLoad={() =>
                  console.log('📸 STUDENT SCREEN: Image loaded successfully')
                }
                onError={(error) =>
                  console.log('❌ STUDENT SCREEN: Image load error:', error)
                }
                onLoadStart={() =>
                  console.log('📸 STUDENT SCREEN: Image load started')
                }
              />
            ) : (
              <View style={styles.studentIconContainer}>
                <FontAwesomeIcon icon={faChild} size={24} color='#fff' />
              </View>
            )}
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{studentData.name}</Text>
              <Text style={styles.studentDetails}>
                Class:{' '}
                {studentData.class_name ||
                  studentData.className ||
                  t('student')}
              </Text>
              {studentData.branch_name && (
                <Text style={styles.branchName}>{studentData.branch_name}</Text>
              )}

              {/* Academic year and week */}
              <View style={styles.academicMetaRow}>
                <Text style={styles.academicMetaLabel}>
                  {t('academicYear') || 'Academic Year'}:{' '}
                </Text>
                <Text style={styles.academicMetaValue}>
                  {studentData?.academic_info?.academic_year ||
                    t('notProvided') ||
                    '-'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Demo Mode Indicator */}
      {studentData?.demo_mode && (
        <DemoModeIndicator
          userData={studentData}
          style={{ marginHorizontal: 16 }}
        />
      )}

      <View style={styles.content}>
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>

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
              const shouldExpand = isLastRow && isLastInRow && isIncompleteRow;

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
                  subtitle='' // Student menu items don't have subtitles
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
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'space-between',
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

      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
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
    // Student Info Card in Header
    studentInfoCard: {
      backgroundColor: theme.colors.surface,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    studentPhoto: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginRight: 12,
    },
    studentIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    studentDetails: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      marginBottom: 1,
    },
    branchName: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    academicMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    academicMetaLabel: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
    },
    academicMetaValue: {
      fontSize: fontSizes.small,
      color: theme.colors.text,
      fontWeight: '500',
    },
    content: {
      flex: 1,
      padding: 10,
      position: 'absolute',
      bottom: 0,
    },
    menuSection: {
      flex: 1,
    },
    menuScrollView: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      marginBottom: 10,
      color: theme.colors.text,
      marginLeft: 15,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: fontSizes.body,
      color: theme.colors.text,
      marginTop: 10,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    errorText: {
      fontSize: fontSizes.body,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: fontSizes.body,
      fontWeight: '600',
    },
    // Quick Actions - Tile Layout (3 per row on mobile)
    actionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start', // Changed from space-between to support flex expansion
      paddingBottom: 10,
      paddingHorizontal: 5, // Add padding for scrollable content
    },

    // iPad specific styles (4 per row)
    iPadActionTilesGrid: {
      justifyContent: 'flex-start',
      paddingHorizontal: 15,
    },

    // iPad landscape styles (6 per row)
    iPadLandscapeActionTilesGrid: {
      justifyContent: 'flex-start',
      paddingHorizontal: 25,
    },

    // Tablet specific styles (4 per row)
    tabletActionTilesGrid: {
      justifyContent: 'flex-start',
      paddingHorizontal: 10,
    },

    // Tablet landscape styles (6 per row)
    tabletLandscapeActionTilesGrid: {
      justifyContent: 'flex-start',
      paddingHorizontal: 20,
    },

    actionTile: {
      width: (screenWidth - 30) / 3 - 9, // 3 tiles per row: screen width - padding (24*2) - margins (8*3) / 3
      minWidth: (screenWidth - 30) / 3 - 9, // Minimum width for flex expansion
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

    // iPad specific tile styles (4 per row)
    iPadActionTile: {
      width: (screenWidth - 80) / 4 - 8,
      minWidth: (screenWidth - 80) / 4 - 8,
      padding: 16,
      borderRadius: 22,
    },

    // iPad landscape tile styles (6 per row)
    iPadLandscapeActionTile: {
      width: (screenWidth - 100) / 6 - 6,
      minWidth: (screenWidth - 100) / 6 - 6,
      padding: 12,
      borderRadius: 18,
    },

    // Tablet specific tile styles (4 per row)
    tabletActionTile: {
      width: (screenWidth - 70) / 4 - 10,
      minWidth: (screenWidth - 70) / 4 - 10,
      padding: 15,
      borderRadius: 20,
    },

    // Tablet landscape tile styles (6 per row)
    tabletLandscapeActionTile: {
      width: (screenWidth - 90) / 6 - 8,
      minWidth: (screenWidth - 90) / 6 - 8,
      padding: 11,
      borderRadius: 16,
    },

    tileIconContainer: {
      width: 44, // Smaller icon container for 3-per-row layout
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 5, // Reduced margin for smaller tiles
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      marginTop: 20,
    },

    // iPad icon container styles
    iPadTileIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginBottom: 8,
      marginTop: 15,
    },

    // iPad landscape icon container styles
    iPadLandscapeTileIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginBottom: 6,
      marginTop: 10,
    },

    // Tablet icon container styles
    tabletTileIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginBottom: 7,
      marginTop: 12,
    },

    // Tablet landscape icon container styles
    tabletLandscapeTileIconContainer: {
      width: 38,
      height: 38,
      borderRadius: 19,
      marginBottom: 5,
      marginTop: 8,
    },

    tileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 5, 10), // Smaller font for 3-per-row layout
      fontWeight: '700',
      color: '#fff',
      marginBottom: 3, // Reduced margin
      letterSpacing: 0.2,
      textAlign: 'center', // Center text for better balance in smaller tiles
    },

    // iPad title styles
    iPadTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 2, 12),
      marginBottom: 4,
    },

    // iPad landscape title styles
    iPadLandscapeTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 6, 9),
      marginBottom: 2,
    },

    // Tablet title styles
    tabletTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 3, 11),
      marginBottom: 3,
    },

    // Tablet landscape title styles
    tabletLandscapeTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 7, 8),
      marginBottom: 2,
    },

    tileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1, 10), // Smaller subtitle font
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
      marginBottom: 6, // Reduced margin
      textAlign: 'center', // Center text for better balance
    },

    // iPad subtitle styles
    iPadTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle, 11),
      marginBottom: 7,
    },

    // iPad landscape subtitle styles
    iPadLandscapeTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 2, 9),
      marginBottom: 4,
    },

    // Tablet subtitle styles
    tabletTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1, 10),
      marginBottom: 6,
    },

    // Tablet landscape subtitle styles
    tabletLandscapeTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 3, 8),
      marginBottom: 3,
    },
  });
