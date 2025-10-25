import React, {useState, useEffect, useRef} from 'react';
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
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
    getResponsiveHeaderFontSize,
    createCustomShadow,
    createMediumShadow,
} from '../utils/commonStyles';

import {
    faChild,
    faTrash,
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
} from '@fortawesome/free-solid-svg-icons';
import {useTheme, getLanguageFontSizes} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useParentNotifications} from '../hooks/useParentNotifications';
import ParentNotificationBadge from '../components/ParentNotificationBadge';
import MessageBadge from '../components/MessageBadge';
import ProfileDropdownMenu from '../components/ProfileDropdownMenu';
import {QuickActionTile, ComingSoonBadge} from '../components';
import {cleanupStudentData, performLogout} from '../services/logoutService';
import {getUserData} from '../services';
import {isIPad, isTablet} from '../utils/deviceDetection';
import DemoModeIndicator from '../components/DemoModeIndicator';
import {updateLastLogin} from '../services/deviceService';
import {Config} from '../config/env';
// Import Parent Proxy Access System
import {
    getParentChildren,
    getChildTimetable,
    getChildHomework,
    getChildAttendance,
    getChildGrades,
    getChildAssessment,
    getChildBpsProfile,
    saveChildrenData,
    getChildrenData,
    formatChildForDisplay,
} from '../services/parentService';

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

// Animated Pagination Dot Component - manages its own shared value
const AnimatedPaginationDot = ({isActive, theme, onPress, dotStyle, touchableStyle}) => {
    const animValue = useSharedValue(isActive ? 1 : 0);

    // Update animation when isActive changes
    React.useEffect(() => {
        animValue.value = withSpring(isActive ? 1 : 0, {
            damping: 15,
            stiffness: 150,
            mass: 0.8,
        });
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => {
        const width = interpolate(animValue.value, [0, 1], [8, 24]);
        const opacity = interpolate(animValue.value, [0, 1], [0.5, 1]);

        return {
            width,
            opacity,
        };
    });

    return (
        <TouchableOpacity onPress={onPress} style={touchableStyle}>
            <Animated.View
                style={[
                    dotStyle,
                    animatedStyle,
                    {
                        backgroundColor: isActive ? theme.colors.primary : theme.colors.border,
                    },
                ]}
            />
        </TouchableOpacity>
    );
};

export default function ParentScreen({navigation}) {
    const {theme} = useTheme();
    const {t, currentLanguage} = useLanguage();
    const fontSizes = getLanguageFontSizes(currentLanguage);

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

    // Parent notifications hook
    const {selectStudent, refreshAllStudents} = useParentNotifications();

    const styles = createStyles(theme, fontSizes);

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
            loadStudents();
            // Also refresh parent profile data in case it was updated
            loadParentProfileData();
        });


        return unsubscribe;
    }, [navigation]);

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
                            userType: 'parent', // Specify that this is a parent logout
                            clearDeviceToken: false, // Keep device token for future logins
                            clearAllData: false, // Keep student accounts for parent dashboard
                        });

                        if (logoutResult.success) {
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
        try {
            const authCode = student.authCode || student.auth_code;
            if (authCode) {
                const updateResult = await updateLastLogin(authCode);
                if (updateResult.success) {

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
                    navigation.navigate('UserCalendar', {mode: 'combined'});
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
            case 'guardian-pickup':
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
            default:
                break;
        }
    };

    // Load parent profile data separately to refresh after profile edits
    const loadParentProfileData = async () => {
        try {

            // Use the same logic as loadStudents but only update currentUserData
            const parentData = await getUserData('parent', AsyncStorage);
            const studentData = await getUserData('student', AsyncStorage);

            let parsedUserData = null;
            if (parentData && parentData.userType === 'parent') {
                parsedUserData = parentData;
            } else if (studentData && studentData.userType === 'student') {
                parsedUserData = studentData;
            } else {
                // Fallback to generic userData for backward compatibility
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    parsedUserData = JSON.parse(userData);
                }
            }

            if (parsedUserData) {

                setCurrentUserData(parsedUserData);
            }
        } catch (error) {
            console.error('❌ PARENT: Error refreshing parent profile data:', error);
        }
    };

    // Extract loadStudents function to make it reusable
    const loadStudents = React.useCallback(async () => {
        try {

            // First check for parent-specific data
            const parentData = await getUserData('parent', AsyncStorage);
            const studentData = await getUserData('student', AsyncStorage);


            // Use parent data if available, otherwise student data, otherwise fallback to generic
            let parsedUserData = null;
            if (parentData && parentData.userType === 'parent') {
                parsedUserData = parentData;
            } else if (studentData && studentData.userType === 'student') {
                parsedUserData = studentData;
            } else {
                // Fallback to generic userData for backward compatibility
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    parsedUserData = JSON.parse(userData);

                }
            }

            if (parsedUserData) {


                setCurrentUserData(parsedUserData); // Set current user data for demo mode indicator

                // Check if we have teacher data but no parent/student data
                if (
                    parsedUserData.userType === 'teacher' &&
                    !parentData &&
                    !studentData
                ) {

                    setLoading(false);
                    // The screen will show empty state, which is appropriate
                    return;
                }

                // Handle parent login from unified login endpoint
                if (parsedUserData.userType === 'parent') {


                    try {
                        // First try to use children from login response if available
                        if (parsedUserData.children && parsedUserData.children.length > 0) {

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

                    // Update last login timestamp for demo student user

                    try {
                        const updateResult = await updateLastLogin(
                            parsedUserData.authCode || parsedUserData.auth_code
                        );
                        if (updateResult.success) {
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

            } else {

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

    // Debug function to help troubleshoot parent photo issue
    const debugParentData = async () => {
        try {

            // Check all possible storage keys
            const parentData = await getUserData('parent', AsyncStorage);
            const studentData = await getUserData('student', AsyncStorage);
            const genericUserData = await AsyncStorage.getItem('userData');


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
                            const cleanupResult = await cleanupStudentData(studentToDelete);

                            if (cleanupResult.success) {

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

    const renderStudentItem = ({item}) => {
        const isSelected = selectedStudent && selectedStudent.id === item.id;

        return (
            <View style={styles.studentTileContainer}>
                <TouchableOpacity
                    style={[styles.studentTile, isSelected && styles.selectedStudentTile]}
                    onPress={() => handleStudentPress(item)}
                >
                    {item.photo ? (
                        <Image
                            source={{uri: item.student_photo}}
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
                            <FontAwesomeIcon icon={faChild} size={24} color='#fff'/>
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
                            fontSize: getResponsiveHeaderFontSize(2, t('parentDashboard')),
                        },
                    ]}
                >
                    {t('parentDashboard')}
                </Text>

                <View style={styles.headerActions}>
                    {currentUserData && (
                        <ProfileDropdownMenu
                            userData={currentUserData}
                            userType="parent"
                            onMessagesPress={() => {
                                // Navigate to parent-specific messaging screen
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
                                        children: students,
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
                            onNotificationsPress={() => {
                                // Navigate to notification screen with selected student context
                                if (selectedStudent) {
                                    navigation.navigate('NotificationScreen', {
                                        userType: 'parent',
                                        authCode: selectedStudent.authCode,
                                        studentName: selectedStudent.name,
                                        studentId: selectedStudent.id,
                                    });
                                } else {
                                    // If no student selected, navigate to first student
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
                            onProfilePress={() => navigation.navigate('ParentProfile')}
                            onLogoutPress={handleLogout}
                        />
                    )}
                </View>
            </View>

            {/* Demo Mode Indicator */}
            {currentUserData?.demo_mode && (
                <DemoModeIndicator
                    userData={currentUserData}
                    style={{marginHorizontal: 16}}
                />
            )}

            <View style={styles.content}>
                {/* Content Section (Children + Menu) */}
                <View style={styles.contentSection}>
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
                                            // Scroll to the next item
                                            const currentIndex = selectedStudent
                                                ? students.findIndex(
                                                    (s) => s.id === selectedStudent.id
                                                )
                                                : 0;
                                            const nextIndex = (currentIndex + 1) % students.length;
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
                            <EmptyListComponent/>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={students}
                                renderItem={renderStudentItem}
                                keyExtractor={(_, index) => `student-${index}`}
                                contentContainerStyle={[
                                    styles.listContainer,
                                    {paddingHorizontal: 24}, // Shift content right for better centering
                                ]}
                                horizontal={true}
                                showsHorizontalScrollIndicator={false}
                                ItemSeparatorComponent={() => <View style={{width: 16}}/>}
                                snapToInterval={346} // Card width (330) + separator (16)
                                snapToAlignment='center'
                                decelerationRate='fast'
                                getItemLayout={(data, index) => ({
                                    length: 346, // Card width + separator
                                    offset: 346 * index,
                                    index,
                                })}
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
                                {students.map((_, index) => (
                                    <AnimatedPaginationDot
                                        key={index}
                                        isActive={index === currentIndex}
                                        theme={theme}
                                        onPress={() => {
                                            setCurrentIndex(index);
                                            flatListRef.current?.scrollToIndex({
                                                index,
                                                animated: true,
                                            });
                                        }}
                                        dotStyle={styles.paginationDot}
                                        touchableStyle={styles.paginationDotTouchable}
                                    />
                                ))}
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
                                {alignItems: 'center'}, // Centers the content horizontally within the scroll view
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
                                const shouldExpand =
                                    isLastRow && isLastInRow && isIncompleteRow;

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
        },
        // Compact Header Styles
        compactHeaderContainer: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            marginHorizontal: 16,
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
            marginBottom: 2,
            color: theme.colors.text,
            marginLeft: 15,
        },
        listContainer: {
            paddingVertical: 5,
            paddingHorizontal: 16,
        },
        studentTileContainer: {
            position: 'relative',
            marginVertical: 5,
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
                shadowOffset: {width: 0, height: 0},
                shadowOpacity: 0.15,
                shadowRadius: 8,
            }),
        },
        selectedStudentIcon: {
            backgroundColor: theme.colors.primary,
        },
        selectedStudentText: {
            color: theme.colors.primary,
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
            color: theme.colors.text,
            marginBottom: 4,
        },
        studentDetails: {
            fontSize: fontSizes.small,
            color: theme.colors.textSecondary,
            marginBottom: 2,
        },
        studentClass: {
            fontSize: fontSizes.small,
            color: theme.colors.primary,
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
            borderRadius: 18,
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
            borderRadius: 14,
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
        disabledTile: {
            opacity: 0.7,
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
        tabletTileIconContainer: {
            width: 42,
            height: 42,
            borderRadius: 21,
            marginBottom: 10,
        },
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
            borderRadius: 11,
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
            borderRadius: 8,
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
            borderRadius: 9,
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
            width: 45,
            height: 45,
            borderRadius: 22.5,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
        },
        // iPad-specific menu icon container - smaller
        iPadMenuIconContainer: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginBottom: 8,
        },
        // Tablet-specific menu icon container
        tabletMenuIconContainer: {
            width: 45,
            height: 45,
            borderRadius: 22.5,
            marginBottom: 9,
        },
        // iPad landscape-specific menu icon container - even smaller for 6 per row
        iPadLandscapeMenuIconContainer: {
            width: 32,
            height: 32,
            borderRadius: 16,
            marginBottom: 6,
        },
        // Tablet landscape-specific menu icon container
        tabletLandscapeMenuIconContainer: {
            width: 36,
            height: 36,
            borderRadius: 18,
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
