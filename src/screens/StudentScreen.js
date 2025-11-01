import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Image,
    ScrollView,
    Dimensions,
    RefreshControl,
    ActivityIndicator, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
    getResponsiveHeaderFontSize,
    createMediumShadow,
    createSmallShadow,
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
    faTrophy,
    faCheckCircle,
    faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import {useTheme, getLanguageFontSizes} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useNotifications} from '../contexts/NotificationContext';
import {Config, buildApiUrl} from '../config/env';
import ParentNotificationBadge from '../components/ParentNotificationBadge';
import MessageBadge from '../components/MessageBadge';
import {QuickActionTile, ComingSoonBadge} from '../components';
import QuickStatsCard from '../components/QuickStatsCard';
import TodayScheduleCard from '../components/TodayScheduleCard';
import PerformanceChart from '../components/PerformanceChart';
import ActivityFeed from '../components/ActivityFeed';
import ProfileDropdownMenu from '../components/ProfileDropdownMenu';
import CompactQuickActions from '../components/CompactQuickActions';
import {performLogout} from '../services/logoutService';
import {isIPad, isTablet} from '../utils/deviceDetection';
import DemoModeIndicator from '../components/DemoModeIndicator';
import {updateLastLogin} from '../services/deviceService';
import {isDemoMode} from '../services/authService';

import {useFocusEffect} from '@react-navigation/native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

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

export default function StudentScreen({navigation}) {

    const {theme} = useTheme();
    const {t, currentLanguage} = useLanguage();
    const {refreshNotifications, unreadCount, notifications, clearNotificationsForCurrentUser} = useNotifications();
    const fontSizes = getLanguageFontSizes(currentLanguage);

    // Debug notification state
    React.useEffect(() => {
        console.log('📱 STUDENT SCREEN: Notification state updated:', {
            unreadCount,
            notificationsCount: notifications?.length || 0,
            firstNotification: notifications?.[0]?.title || 'none',
        });
    }, [unreadCount, notifications]);

    // Device and orientation detection
    const isIPadDevice = isIPad();
    const isTabletDevice = isTablet();
    const isLandscape = screenWidth > screenHeight;

    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastLoginUpdateTime, setLastLoginUpdateTime] = useState(null);

    // Dashboard data states
    const [dashboardStats, setDashboardStats] = useState({
        attendanceRate: 0,
        averageGrade: 0,
        pendingAssignments: 0,
        behaviorPoints: 0,
    });
    const [todayClasses, setTodayClasses] = useState([]);
    const [performanceData, setPerformanceData] = useState([0, 0, 0, 0, 0]);
    const [recentActivities, setRecentActivities] = useState([]);

    const styles = createStyles(theme, fontSizes);

    // Load student data on component mount and when screen comes into focus
    // Using only useFocusEffect to avoid duplicate calls
    useFocusEffect(
        React.useCallback(() => {
            console.log('🔔 STUDENT SCREEN: Screen focused, loading student data and refreshing notifications...');
            loadStudentData();
            // Also refresh notifications immediately to ensure student notifications are shown
            // Explicitly pass 'student' userType to ensure student notifications are loaded
            refreshNotifications('student');
        }, [refreshNotifications])
    );

    // Refresh notifications when studentData is loaded
    React.useEffect(() => {
        if (studentData?.authCode) {
            console.log('📱 STUDENT SCREEN: Refreshing notifications for student:', {
                authCode: studentData.authCode.substring(0, 8) + '...',
                studentName: studentData.name,
            });

            // Pass student's authCode directly to refreshNotifications
            refreshNotifications(studentData.authCode);
        }
    }, [studentData?.authCode, refreshNotifications]);

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

    // Helper functions for fetching data
    const fetchTimetable = async (authCode) => {
        try {
            if (isDemoMode({authCode})) {
                return null; // Demo data would be handled separately
            }
            const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_TIMETABLE, {authCode});
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching timetable:', error);
        }
        return null;
    };

    const fetchGrades = async (authCode) => {
        try {
            if (isDemoMode({authCode})) {
                return null;
            }
            const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_GRADES, {authCode});
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
        return null;
    };

    const fetchAttendance = async (authCode) => {
        try {
            if (isDemoMode({authCode})) {
                return null;
            }
            const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_ATTENDANCE, {authCode});
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
        return null;
    };

    const fetchHomework = async (authCode) => {
        try {
            if (isDemoMode({authCode})) {
                return null;
            }
            const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_HOMEWORK, {authCode});
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching homework:', error);
        }
        return null;
    };

    const fetchBehaviorPoints = async (authCode) => {
        try {
            if (isDemoMode({authCode})) {
                return null;
            }
            const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_BPS, {authCode});
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching behavior points:', error);
        }
        return null;
    };

    // Helper functions for processing data
    const getTodayClassesFromTimetable = (timetableData) => {
        if (!timetableData || !timetableData.timetable) return [];

        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const todayWeekDay = today === 0 ? 7 : today;

        return timetableData.timetable
            .filter(item => item.week_day === todayWeekDay)
            .map(item => ({
                ...item,
                subject_name: item.subject_name || item.subject,
                start_time: item.start_time || '08:00',
                end_time: item.end_time || '09:00',
                class_name: item.class_name || item.classroom_name,
            }))
            .sort((a, b) => {
                const timeA = a.start_time?.split(':').map(Number) || [0, 0];
                const timeB = b.start_time?.split(':').map(Number) || [0, 0];
                return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
            });
    };

    const calculateAverageGrade = (gradesData) => {
        if (!gradesData || !gradesData.assessments) return 0;

        const gradedAssessments = gradesData.assessments.filter(a => a.grade !== null && a.grade !== undefined);
        if (gradedAssessments.length === 0) return 0;

        const sum = gradedAssessments.reduce((acc, a) => acc + parseFloat(a.grade || 0), 0);
        return Math.round(sum / gradedAssessments.length);
    };

    const getWeeklyGradesTrend = (gradesData) => {
        // Return last 5 assessment grades or zeros
        if (!gradesData || !gradesData.assessments) return [0, 0, 0, 0, 0];

        const recentGrades = gradesData.assessments
            .filter(a => a.grade !== null && a.grade !== undefined)
            .slice(-5)
            .map(a => parseFloat(a.grade || 0));

        while (recentGrades.length < 5) {
            recentGrades.unshift(0);
        }

        return recentGrades;
    };

    const calculateAttendanceRate = (attendanceData) => {
        if (!attendanceData || !attendanceData.attendance_summary) return 0;

        const summary = attendanceData.attendance_summary;
        const totalDays = summary.total_days || 0;
        const presentDays = summary.present_days || 0;

        if (totalDays === 0) return 0;
        return Math.round((presentDays / totalDays) * 100);
    };

    const countPendingAssignments = (homeworkData) => {
        if (!homeworkData || !Array.isArray(homeworkData)) return 0;

        return homeworkData.filter(hw =>
            hw.status === 'pending' || hw.status === 'assigned' || !hw.is_completed
        ).length;
    };

    const calculateBehaviorPoints = (bpsData) => {
        if (!bpsData || !bpsData.behavior_points) return 0;

        return bpsData.behavior_points.net_points || 0;
    };

    const generateRecentActivities = (gradesData, homeworkData, bpsData) => {
        const activities = [];
        const now = new Date();

        // Add recent grades
        if (gradesData && gradesData.assessments) {
            gradesData.assessments.slice(-3).forEach((assessment, index) => {
                if (assessment.grade) {
                    activities.push({
                        id: `grade-${index}`,
                        type: 'grade',
                        title: t('newGradePosted') || 'New grade posted',
                        subtitle: `${assessment.subject_name}: ${assessment.grade}%`,
                        timestamp: new Date(now.getTime() - (index + 1) * 24 * 60 * 60 * 1000),
                    });
                }
            });
        }

        // Add recent homework
        if (homeworkData && Array.isArray(homeworkData)) {
            homeworkData.slice(-2).forEach((hw, index) => {
                activities.push({
                    id: `homework-${index}`,
                    type: 'homework',
                    title: t('newAssignment') || 'New assignment',
                    subtitle: hw.title || hw.subject,
                    timestamp: new Date(hw.assigned_date || now.getTime() - (index + 3) * 24 * 60 * 60 * 1000),
                });
            });
        }

        // Add recent BPS
        if (bpsData && bpsData.recent_entries) {
            bpsData.recent_entries.slice(0, 2).forEach((entry, index) => {
                activities.push({
                    id: `bps-${index}`,
                    type: 'bps',
                    title: entry.type === 'positive' ? t('positivePoints') || 'Positive points' : t('negativePoints') || 'Negative points',
                    subtitle: `${entry.title}: ${entry.points > 0 ? '+' : ''}${entry.points}`,
                    timestamp: new Date(entry.date || now.getTime() - (index + 5) * 24 * 60 * 60 * 1000),
                });
            });
        }

        // Sort by timestamp and return top 5
        return activities
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
    };

    // Fetch dashboard data
    const fetchDashboardData = async (authCode) => {
        try {
            // Fetch all dashboard data in parallel
            const [timetableRes, gradesRes, attendanceRes, homeworkRes, bpsRes] = await Promise.allSettled([
                fetchTimetable(authCode),
                fetchGrades(authCode),
                fetchAttendance(authCode),
                fetchHomework(authCode),
                fetchBehaviorPoints(authCode),
            ]);

            // Process timetable data
            if (timetableRes.status === 'fulfilled' && timetableRes.value) {
                const classes = getTodayClassesFromTimetable(timetableRes.value);
                setTodayClasses(classes);
            }

            // Process grades data
            if (gradesRes.status === 'fulfilled' && gradesRes.value) {
                const avgGrade = calculateAverageGrade(gradesRes.value);
                const weeklyGrades = getWeeklyGradesTrend(gradesRes.value);
                setDashboardStats(prev => ({...prev, averageGrade: avgGrade}));
                setPerformanceData(weeklyGrades);
            }

            // Process attendance data
            if (attendanceRes.status === 'fulfilled' && attendanceRes.value) {
                const rate = calculateAttendanceRate(attendanceRes.value);
                setDashboardStats(prev => ({...prev, attendanceRate: rate}));
            }

            // Process homework data
            if (homeworkRes.status === 'fulfilled' && homeworkRes.value) {
                const pending = countPendingAssignments(homeworkRes.value);
                setDashboardStats(prev => ({...prev, pendingAssignments: pending}));
            }

            // Process BPS data
            if (bpsRes.status === 'fulfilled' && bpsRes.value) {
                const points = calculateBehaviorPoints(bpsRes.value);
                setDashboardStats(prev => ({...prev, behaviorPoints: points}));
            }

            // Generate recent activities
            const activities = generateRecentActivities(gradesRes.value, homeworkRes.value, bpsRes.value);
            setRecentActivities(activities);

        } catch (error) {
            console.error('❌ STUDENT: Error fetching dashboard data:', error);
        }
    };

    const loadStudentData = async () => {
        try {
            setLoading(true);

            // Get student data from AsyncStorage - try both generic and student-specific keys
            const userData = await AsyncStorage.getItem('userData');
            const studentUserData = await AsyncStorage.getItem('studentUserData');

            console.log('📱 STUDENT: Loading student data...');
            console.log('📱 STUDENT: userData exists:', !!userData);
            console.log('📱 STUDENT: studentUserData exists:', !!studentUserData);

            // Use student-specific data if available, otherwise fall back to generic
            const dataToUse = studentUserData || userData;
            const keyUsed = studentUserData ? 'studentUserData' : 'userData';
            console.log('📱 STUDENT: Using data from key:', keyUsed);

            if (dataToUse) {
                const parsedUserData = JSON.parse(dataToUse);

                console.log('📱 STUDENT: Parsed user data - userType:', parsedUserData.userType);
                console.log('📱 STUDENT: Parsed user data - authCode:', parsedUserData.authCode?.substring(0, 8) + '...' || parsedUserData.auth_code?.substring(0, 8) + '...' || 'NONE');
                console.log('📱 STUDENT: Parsed user data - name:', parsedUserData.name || parsedUserData.user_name);

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
                console.log('📸 STUDENT: Checking photo fields in parsedUserData:', {
                    photo: parsedUserData?.photo,
                    profile_photo: parsedUserData?.profile_photo,
                    user_photo: parsedUserData?.user_photo,
                    personal_info_profile_photo: parsedUserData?.personal_info?.profile_photo,
                    originalResponse_personal_info_profile_photo: parsedUserData?.originalResponse?.personal_info?.profile_photo,
                });

                // Normalize the data structure for consistent property names
                // Try multiple possible locations for the profile photo
                const profilePhotoPath =
                    parsedUserData?.photo ||
                    parsedUserData?.profile_photo ||
                    parsedUserData?.user_photo ||
                    parsedUserData?.personal_info?.profile_photo ||
                    parsedUserData?.originalResponse?.personal_info?.profile_photo ||
                    null;

                // Fix 0.0.0.0 domain issue in photo URLs
                let profilePhoto = profilePhotoPath;
                if (profilePhoto && profilePhoto.includes('0.0.0.0')) {
                    const correctedPhoto = profilePhoto.replace(/http:\/\/0\.0\.0\.0:\d+/, Config.API_DOMAIN);
                    console.log('📸 STUDENT: Corrected 0.0.0.0 URL:', profilePhoto, '->', correctedPhoto);
                    profilePhoto = correctedPhoto;
                }

                console.log('📸 STUDENT: Final profilePhoto value:', profilePhoto);

                const normalizedStudentData = {
                    ...parsedUserData,
                    name: parsedUserData.name || parsedUserData.user_name,
                    authCode: parsedUserData.authCode || parsedUserData.auth_code,
                    id: parsedUserData.id || parsedUserData.user_id,
                    class_name:
                        parsedUserData?.academic_info?.classroom_name ||
                        parsedUserData.className,
                    branch_name: parsedUserData?.academic_info?.branch_name,
                    branch_id: parsedUserData?.academic_info?.branch_id,
                    photo: profilePhoto,
                    profile_photo: profilePhoto, // Also set profile_photo for consistency
                };

                // Debug logging for photo data
                console.log('📸 STUDENT: normalizedStudentData.photo:', normalizedStudentData.photo);
                console.log('📸 STUDENT: normalizedStudentData.profile_photo:', normalizedStudentData.profile_photo);

                // If photo was found and it's different from what's stored, update AsyncStorage
                // This is a one-time fix for existing users who logged in before the photo fix
                if (profilePhoto && !parsedUserData.photo) {
                    console.log('🔧 STUDENT: Updating AsyncStorage with corrected photo field...');
                    const updatedUserData = {
                        ...parsedUserData,
                        photo: profilePhoto,
                        profile_photo: profilePhoto,
                    };
                    await AsyncStorage.setItem(keyUsed, JSON.stringify(updatedUserData));
                    console.log('✅ STUDENT: AsyncStorage updated with photo field');
                }

                setStudentData(normalizedStudentData);
                console.log('📸 STUDENT: studentData state updated with photo:', normalizedStudentData.photo);

                // Update last login timestamp - with validation and throttling
                // Only update if it hasn't been updated in the last 30 seconds to prevent duplicate calls
                const studentAuthCode = normalizedStudentData.authCode;
                const now = Date.now();
                const timeSinceLastUpdate = lastLoginUpdateTime ? now - lastLoginUpdateTime : Infinity;
                const shouldUpdateLogin = timeSinceLastUpdate > 30000; // 30 seconds

                if (studentAuthCode && shouldUpdateLogin) {
                    console.log('📱 STUDENT: Updating last login for student with authCode:', studentAuthCode.substring(0, 8) + '...');
                    try {
                        const updateResult = await updateLastLogin(studentAuthCode);
                        if (updateResult.success) {
                            setLastLoginUpdateTime(now);
                            console.log('✅ STUDENT: Last login updated successfully');
                        } else {
                            console.warn('⚠️ STUDENT: Failed to update last login:', updateResult.error);
                        }
                    } catch (updateError) {
                        console.error('❌ STUDENT: Error updating last login:', updateError);
                    }
                } else if (!studentAuthCode) {
                    console.warn('⚠️ STUDENT: No authCode found for student, skipping last login update');
                } else {
                    console.log('📱 STUDENT: Skipping last login update (updated', Math.round(timeSinceLastUpdate / 1000), 'seconds ago)');
                }

                // Fetch dashboard data
                await fetchDashboardData(normalizedStudentData.authCode);
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
                    navigation.navigate('UserCalendar', {mode: 'combined'});
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

    // Handle refresh
    const handleRefresh = async () => {
        if (!studentData || !studentData.authCode) return;

        setRefreshing(true);
        try {
            await fetchDashboardData(studentData.authCode);
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(t('logout'), t('confirmLogout'), [
            {text: t('cancel'), style: 'cancel'},
            {
                text: t('logout'),
                style: 'destructive',
                onPress: async () => {
                    try {


                        // Use the comprehensive logout service
                        const logoutResult = await performLogout({
                            userType: 'student', // Specify that this is a student logout
                            clearDeviceToken: false, // Keep device token for future logins
                            clearAllData: false, // Student-specific data will be cleared based on userType
                            notificationCleanup: clearNotificationsForCurrentUser, // Clean up notification context
                        });

                        if (logoutResult.success) {

                            // Verify data is cleared by checking AsyncStorage
                            const remainingData = await AsyncStorage.multiGet([
                                'userData',
                                'studentUserData',
                                'studentAccounts',
                                'selectedStudent',
                            ]);


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

    // if (loading) {
    //     return (
    //         <SafeAreaView style={styles.container}>
    //             <View style={styles.loadingContainer}>
    //                 <Text style={styles.loadingText}>{t('loading')}</Text>
    //             </View>
    //         </SafeAreaView>
    //     );
    // }

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
            {/* Navigation Header */}
            <View style={styles.navigationHeader}>
                <TouchableOpacity
                    style={styles.headerActionButton}
                    onPress={() => navigation.goBack()}
                >
                    <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff'/>
                </TouchableOpacity>
                <Text
                    style={[
                        styles.headerTitle,
                        {
                            fontSize: getResponsiveHeaderFontSize(3, t('studentDashboard')),
                        },
                    ]}
                >
                    {t('studentDashboard')}
                </Text>

                <View style={styles.headerActions}>
                    {studentData && (
                        <ProfileDropdownMenu
                            userData={studentData}
                            userType="student"
                            onMessagesPress={() =>
                                navigation.navigate('StudentMessagingScreen', {
                                    authCode: studentData.authCode,
                                    studentName: studentData.name,
                                })
                            }
                            onNotificationsPress={() =>
                                navigation.navigate('NotificationScreen', {
                                    userType: 'student',
                                    authCode: studentData.authCode,
                                    studentName: studentData.name,
                                    studentId: studentData.id,
                                })
                            }
                            onProfilePress={() =>
                                navigation.navigate('StudentProfile', {student: studentData})
                            }
                            onLogoutPress={handleLogout}
                        />
                    )}
                </View>
            </View>

            {/* Student Info Card */}
            <View style={styles.compactHeaderContainer}>

                {/* Student Info Card (tap to open profile) */}
                {studentData && (
                    <TouchableOpacity
                        style={styles.studentInfoCard}
                        activeOpacity={0.8}
                    >
                        <View style={styles.branchIconWrapper}>
                            <Image
                                source={
                                    theme.mode === 'dark'
                                        ? require('../../assets/app_logo_dark.png')
                                        : require('../../assets/app_logo.png')
                                }
                                style={styles.branchIcon}
                                resizeMode='contain'
                            />
                        </View>
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>{t('welcomeBack') + ' \n' + studentData.name}</Text>
                            <Text style={styles.studentDetails}>
                                {t('class')}:{' '}
                                {studentData.class_name ||
                                    studentData.className ||
                                    t('student')}
                            </Text>
                            <Text style={styles.branchName}>
                                {studentData.branch_name}
                            </Text>
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
                    style={{marginHorizontal: 16}}
                />
            )}

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {/* Quick Stats Section */}
                <View style={styles.statsSection}>
                    <View style={styles.statsRow}>
                        <QuickStatsCard
                            icon={faClipboardCheck}
                            value={`${dashboardStats.attendanceRate}%`}
                            label={t('attendanceRate') || 'Attendance Rate'}
                            colors={['#34C759', '#28A745']}
                            delay={0}
                        />
                        <QuickStatsCard
                            icon={faChartLine}
                            value={`${dashboardStats.averageGrade}%`}
                            label={t('averageGrade') || 'Average Grade'}
                            colors={['#007AFF', '#0056D2']}
                            delay={100}
                        />
                    </View>
                    <View style={styles.statsRow}>
                        <QuickStatsCard
                            icon={faBook}
                            value={dashboardStats.pendingAssignments}
                            label={t('pendingAssignments') || 'Pending Assignments'}
                            colors={['#FF9500', '#FF6B00']}
                            delay={200}
                        />
                        <QuickStatsCard
                            icon={faTrophy}
                            value={dashboardStats.behaviorPoints}
                            label={t('behaviorPoints') || 'Behavior Points'}
                            colors={['#AF52DE', '#8E44AD']}
                            delay={300}
                        />
                    </View>
                </View>
                {/* Compact Quick Actions */}
                <CompactQuickActions
                    actions={getMenuItems(t).map(item => ({
                        id: item.id,
                        title: item.title,
                        icon: item.icon,
                        backgroundColor: item.backgroundColor,
                        iconColor: item.iconColor,
                        disabled: item.disabled,
                        badge: item.comingSoon ? (
                            <ComingSoonBadge
                                text={t('soon')}
                                theme={theme}
                                fontSizes={fontSizes}
                            />
                        ) : undefined,
                        onPress: () => handleMenuItemPress(item.action),
                    }))}
                    visibleCount={4}
                    userType="student"
                />
                {/* Today's Schedule */}
                {todayClasses.length > 0 && (
                    <TodayScheduleCard
                        classes={todayClasses}
                        onSeeAll={() => handleMenuItemPress('schedule')}
                        onClassPress={(classItem) => {
                            // Navigate to timetable with selected class
                            handleMenuItemPress('schedule');
                        }}
                    />
                )}

                {/* Performance Chart */}
                <PerformanceChart
                    data={performanceData}
                    labels={[t('week1') || 'W1', t('week2') || 'W2', t('week3') || 'W3', t('week4') || 'W4', t('week5') || 'W5']}
                />

                {/* Recent Activities */}
                {recentActivities.length > 0 && (
                    <ActivityFeed
                        activities={recentActivities}
                        onActivityPress={(activity) => {
                            // Navigate based on activity type
                            if (activity.type === 'grade') {
                                handleMenuItemPress('grades');
                            } else if (activity.type === 'homework') {
                                handleMenuItemPress('assignments');
                            } else if (activity.type === 'bps') {
                                handleMenuItemPress('discipline');
                            }
                        }}
                    />
                )}


            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme, fontSizes) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 20,
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
            shadowOffset: {width: 0, height: 2},
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
            marginHorizontal: 16,
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
            borderRadius: 16,
        },
        branchIconWrapper: {
            width: 100,
            height: 100,
            borderRadius: 28,
            backgroundColor: theme.colors.success + '15',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            overflow: 'hidden',
        },
        branchIcon: {
            width: 100,
            height: 100,


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
        // Stats Section
        statsSection: {
            paddingHorizontal: 16,
            marginTop: 8,
            marginBottom: 8,
        },
        statsRow: {
            flexDirection: 'row',
            marginBottom: Platform.OS === 'android' && 8,
            gap: Platform.OS === 'android' && 8,
        },
        // Menu Section
        menuSection: {
            marginTop: 16,
            paddingHorizontal: 16,
        },
        sectionTitle: {
            fontSize: fontSizes.subtitle,
            fontWeight: '600',
            marginBottom: 12,
            color: theme.colors.text,
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
            justifyContent: 'flex-start',
            paddingBottom: 10,
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
