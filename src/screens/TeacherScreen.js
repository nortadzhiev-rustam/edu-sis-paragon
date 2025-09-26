import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config, buildApiUrl } from '../config/env';
import {
  getResponsiveHeaderFontSize,
  createSmallShadow,
  createMediumShadow,
  createCustomShadow,
} from '../utils/commonStyles';
import {
  faUser,
  faSignOutAlt,
  faArrowLeft,
  faCalendarAlt,
  faScaleBalanced,
  faChartLine,
  faBuilding,
  faChevronRight,
  faBookOpen,
  faBell,
  faClipboardList,
  faHome,
  faComments,
  faHeartbeat,
  faDoorOpen,
  faClock,
  faQrcode, // added for Pickup
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useMessaging } from '../contexts/MessagingContext';
import NotificationBadge from '../components/NotificationBadge';
import MessageBadge from '../components/MessageBadge';
import { QuickActionTile } from '../components';
import { performLogout } from '../services/logoutService';
import { getUserData, isDemoMode } from '../services/authService';
import DemoModeIndicator from '../components/DemoModeIndicator';
import {
  switchBranch,
  getCurrentBranchInfo,
} from '../services/branchSelectionService';

import { isIPad, isTablet } from '../utils/deviceDetection';
import { useFocusEffect } from '@react-navigation/native';

import {
  getDemoTimetableData,
  getDemoTeacherClassesData,
} from '../services/demoModeService';

export default function TeacherScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();

  // Dynamic screen dimensions that update with orientation changes
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Extract dimensions for easier use
  const { width: screenWidth, height: screenHeight } = screenDimensions;

  const { refreshNotifications, clearAll: clearNotifications } =
    useNotifications();
  const { cleanup: cleanupMessaging } = useMessaging();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  // Device and orientation detection
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();
  const isLandscape = screenWidth > screenHeight;

  // Helper function to format user roles (branch-specific)
  const formatUserRoles = (userData) => {
    // If user has roles array, format it based on current branch
    if (
      userData.roles &&
      Array.isArray(userData.roles) &&
      userData.roles.length > 0
    ) {
      // If a branch is selected, show only roles for that branch
      if (selectedBranchId) {
        const currentBranchRoles = userData.roles.filter(
          (role) => role.branch_id === selectedBranchId
        );

        if (currentBranchRoles.length > 0) {
          const roleNames = currentBranchRoles.map((role) => role.role_name);
          const uniqueRoles = [...new Set(roleNames)];

          if (uniqueRoles.length === 1) {
            return uniqueRoles[0];
          } else {
            // Show only first 3 roles, add "..." if there are more
            const displayRoles = uniqueRoles.slice(0, 3);
            const hasMoreRoles = uniqueRoles.length > 3;
            const rolesText = displayRoles.join(' - ');
            return hasMoreRoles ? `${rolesText}...` : rolesText;
          }
        } else {
          // No roles in current branch, show "No Role in Branch"
          return `No Role in ${currentBranchInfo?.branch_name || 'Branch'}`;
        }
      }

      // No branch selected, show only first 3 unique roles
      const uniqueRoles = [
        ...new Set(userData.roles.map((role) => role.role_name)),
      ];

      if (uniqueRoles.length === 1) {
        // Single unique role - just show the role name
        return uniqueRoles[0];
      } else {
        // Show only first 3 roles, add "..." if there are more
        const displayRoles = uniqueRoles.slice(0, 3);
        const hasMoreRoles = uniqueRoles.length > 3;
        const rolesText = displayRoles.join(' - ');
        return hasMoreRoles ? `${rolesText}...` : rolesText;
      }
    }

    // Fallback to new API response fields
    if (userData.profession_position) {
      return userData.profession_position;
    }

    if (userData.role) {
      return userData.role;
    }

    if (userData.staff_category_name) {
      return userData.staff_category_name;
    }

    // Final fallback
    return userData.position || 'Teacher';
  };

  // Function to handle role tap - show all roles if multiple
  const handleRoleTap = () => {
    if (
      userData.roles &&
      Array.isArray(userData.roles) &&
      userData.roles.length > 1
    ) {
      // Get unique role names to check if there are multiple unique roles
      const uniqueRoles = [
        ...new Set(userData.roles.map((role) => role.role_name)),
      ];
      if (uniqueRoles.length > 1) {
        setShowAllRoles(true);
      }
    }
  };

  // Function to render all roles modal
  const renderAllRolesModal = () => {
    if (
      !userData.roles ||
      !Array.isArray(userData.roles) ||
      userData.roles.length <= 1
    ) {
      return null;
    }

    // Filter roles for current branch only
    let rolesToShow = userData.roles;
    let modalTitle = 'All Roles';

    if (selectedBranchId) {
      rolesToShow = userData.roles.filter(
        (role) => role.branch_id === selectedBranchId
      );
      modalTitle = `Roles in ${
        currentBranchInfo?.branch_name || 'Current Branch'
      }`;
    }

    // If no roles in current branch, show message
    if (rolesToShow.length === 0) {
      return (
        <Modal
          visible={showAllRoles}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setShowAllRoles(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <View style={styles.rolesContainer}>
                <Text style={styles.noRolesText}>
                  No roles found in{' '}
                  {currentBranchInfo?.branch_name || 'this branch'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAllRoles(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }

    return (
      <Modal
        visible={showAllRoles}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowAllRoles(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <ScrollView
              style={styles.rolesContainer}
              showsVerticalScrollIndicator={false}
            >
              {rolesToShow.map((role, index) => (
                <View key={index} style={styles.roleItem}>
                  <Text style={styles.roleName}>{role.role_name}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAllRoles(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };
  // Get user data from navigation params or AsyncStorage
  const [userData, setUserData] = useState(route?.params?.userData || {});
  const [loading, setLoading] = useState(true);
  const [showAllRoles, setShowAllRoles] = useState(false);

  // Teacher dashboard data
  const [timetableData, setTimetableData] = useState(null);
  const [teacherClassesData, setTeacherClassesData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [branchStudentCounts, setBranchStudentCounts] = useState({}); // Store unique student counts per branch
  const [dashboardStats, setDashboardStats] = useState({
    totalClasses: 0,
    attendanceTaken: 0,
    branches: 0,
  });

  // Branch selection state - now using branch_id instead of array index
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [showBranchSelector, setShowBranchSelector] = useState(false);

  // Enhanced branch selection state
  const [currentBranchInfo, setCurrentBranchInfo] = useState(null);
  const [accessibleBranches, setAccessibleBranches] = useState([]);
  const [branchSwitching, setBranchSwitching] = useState(false);

  const styles = createStyles(theme, fontSizes, screenWidth, screenHeight);

  // Fetch teacher timetable data
  const fetchTeacherTimetable = async () => {
    if (!userData.authCode) return null;

    // Check if user is in demo mode
    if (isDemoMode(userData)) {
      console.log('🎭 DEMO MODE: Using demo timetable data');
      const demoData = getDemoTimetableData('teacher');
      setTimetableData(demoData);

      // Calculate stats from demo data
      if (demoData.success && demoData.branches) {
        const totalClasses = demoData.branches.reduce(
          (sum, branch) => sum + branch.timetable.length,
          0
        );
        const attendanceTaken = demoData.branches.reduce(
          (sum, branch) =>
            sum +
            branch.timetable.filter((item) => item.attendance_taken).length,
          0
        );

        setDashboardStats((prev) => ({
          ...prev,
          totalClasses,
          attendanceTaken,
          branches: demoData.total_branches,
        }));
      }

      return demoData;
    }

    try {
      const url = buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_TIMETABLE, {
        authCode: userData.authCode,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTimetableData(data);

        // Calculate stats
        if (data.success && data.branches) {
          const totalClasses = data.branches.reduce(
            (sum, branch) => sum + branch.timetable.length,
            0
          );
          const attendanceTaken = data.branches.reduce(
            (sum, branch) =>
              sum +
              branch.timetable.filter((item) => item.attendance_taken).length,
            0
          );

          setDashboardStats((prev) => ({
            ...prev,
            totalClasses,
            attendanceTaken,
            branches: data.total_branches,
          }));
        }

        return data;
      }
    } catch (error) {
      // Handle error silently
    }

    return null;
  };

  // Fetch teacher classes with comprehensive student data
  const fetchTeacherClasses = async () => {
    if (!userData.authCode) return null;

    // Check if user is in demo mode
    if (isDemoMode(userData)) {
      console.log('🎭 DEMO MODE: Using demo teacher classes data');
      const demoData = getDemoTeacherClassesData();
      setTeacherClassesData(demoData.data);

      // Calculate student counts from the demo data
      if (demoData.data?.branches) {
        const branchCounts = {};
        let totalUniqueStudents = new Set();

        demoData.data.branches.forEach((branch) => {
          let branchUniqueStudents = new Set();

          branch.classes.forEach((classItem) => {
            if (classItem.students && Array.isArray(classItem.students)) {
              classItem.students.forEach((student) => {
                if (student.student_id) {
                  branchUniqueStudents.add(student.student_id);
                  totalUniqueStudents.add(student.student_id);
                }
              });
            }
          });

          branchCounts[branch.branch_id] = branchUniqueStudents.size;
        });

        setBranchStudentCounts(branchCounts);
      }

      return demoData.data;
    }

    try {
      const response = await fetch(
        buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_CLASSES, {
          auth_code: userData.authCode,
        }),
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTeacherClassesData(data.data);

          // Calculate student counts from the comprehensive data
          if (data.data?.branches) {
            const branchCounts = {};
            let totalUniqueStudents = new Set();

            data.data.branches.forEach((branch) => {
              let branchUniqueStudents = new Set();

              branch.classes.forEach((classItem) => {
                if (classItem.students && Array.isArray(classItem.students)) {
                  classItem.students.forEach((student) => {
                    if (student.student_id) {
                      branchUniqueStudents.add(student.student_id);
                      totalUniqueStudents.add(student.student_id);
                    }
                  });
                }
              });

              branchCounts[branch.branch_id] = branchUniqueStudents.size;
            });

            setBranchStudentCounts(branchCounts);
          }

          return data.data;
        } else {
          console.error('Failed to fetch teacher classes:', data.message);
        }
      } else {
        console.error('Failed to fetch teacher classes:', response.status);
      }
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
    }

    return null;
  };

  // Load branch information from API first, fallback to user data
  const loadBranchInfo = async () => {
    try {
      console.log('🌿 TEACHER SCREEN: Loading branch information from API');

      // First try to get current branch info from API
      try {
        const apiResponse = await getCurrentBranchInfo(userData.authCode);

        if (apiResponse.success && apiResponse.accessible_branches) {
          console.log('✅ TEACHER SCREEN: Branch info loaded from API');
          console.log(
            '📍 API Current branch:',
            apiResponse.current_branch?.branch_name
          );
          console.log(
            '🏢 API Accessible branches:',
            apiResponse.accessible_branches.length
          );

          // Set accessible branches from API response
          const branchesWithActiveFlag = apiResponse.accessible_branches.map(
            (branch) => ({
              ...branch,
              is_active:
                branch.branch_id === apiResponse.current_branch?.branch_id,
            })
          );

          setAccessibleBranches(branchesWithActiveFlag);
          setCurrentBranchInfo(apiResponse.current_branch);

          if (apiResponse.current_branch) {
            setSelectedBranchId(apiResponse.current_branch.branch_id);
          }

          return; // Successfully loaded from API, exit function
        }
      } catch (apiError) {
        console.log(
          '⚠️ TEACHER SCREEN: API call failed, falling back to user data:',
          apiError.message
        );
      }

      // Fallback to user data if API fails
      console.log(
        '🔄 TEACHER SCREEN: Loading branch information from user data'
      );
      console.log('🔍 TEACHER SCREEN: User data structure:', {
        hasAccessibleBranches: !!userData.accessible_branches,
        accessibleBranchesLength: userData.accessible_branches?.length || 0,
        hasBranch: !!userData.branch,
        branchName: userData.branch?.branch_name,
        branches: userData.branches?.length || 0,
      });

      // Use accessible_branches or branches from user data
      const userBranches =
        userData.accessible_branches || userData.branches || [];

      if (userBranches && userBranches.length > 0) {
        console.log(
          '📍 TEACHER SCREEN: Found branches in user data:',
          userBranches.length
        );

        // Set accessible branches with is_active flag
        const branchesWithActiveFlag = userBranches.map((branch, index) => ({
          ...branch,
          is_active: selectedBranchId
            ? branch.branch_id === selectedBranchId
            : index === 0,
        }));

        setAccessibleBranches(branchesWithActiveFlag);

        // Set current branch info
        const currentBranch =
          branchesWithActiveFlag.find((b) => b.is_active) ||
          branchesWithActiveFlag[0];
        setCurrentBranchInfo(currentBranch);

        // Update selected branch ID if not set
        if (!selectedBranchId && currentBranch) {
          setSelectedBranchId(currentBranch.branch_id);
        }

        console.log('✅ TEACHER SCREEN: Branch info loaded from user data');
        console.log('📍 Current branch:', currentBranch?.branch_name);
        console.log('🏢 Accessible branches:', branchesWithActiveFlag.length);
      } else if (userData.branch) {
        // Fallback to single branch from user data
        console.log('📍 TEACHER SCREEN: Using single branch from user data');
        const singleBranch = { ...userData.branch, is_active: true };
        setAccessibleBranches([singleBranch]);
        setCurrentBranchInfo(singleBranch);
        setSelectedBranchId(singleBranch.branch_id);
      } else {
        console.log(
          '⚠️ TEACHER SCREEN: No branch information found in user data'
        );
      }
    } catch (error) {
      console.error('❌ TEACHER SCREEN: Error loading branch info:', error);
    }
  };

  // Load all teacher data
  const loadTeacherData = async () => {
    setRefreshing(true);
    try {
      // Load comprehensive teacher classes data (includes student counts)
      const classesData = await fetchTeacherClasses();

      // Also load timetable data for attendance information
      if (classesData) {
        await fetchTeacherTimetable();
      }
    } catch (error) {
      // Handle error silently
      console.error('Error loading teacher data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh notifications when screen comes into focus (with debouncing)
  const lastNotificationRefresh = React.useRef(0);
  const isRefreshingNotifications = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Only refresh notifications if:
      // 1. It's been more than 30 seconds since last refresh
      // 2. We're not currently refreshing notifications
      if (
        now - lastNotificationRefresh.current > 30000 &&
        !isRefreshingNotifications.current
      ) {
        lastNotificationRefresh.current = now;
        isRefreshingNotifications.current = true;

        refreshNotifications().finally(() => {
          isRefreshingNotifications.current = false;
        });
      }
    }, [refreshNotifications])
  );

  useEffect(() => {
    // If no userData from params, try to get from AsyncStorage
    const loadUserData = async () => {
      if (Object.keys(userData).length === 0) {
        try {
          console.log(
            '🔍 TEACHER SCREEN: Loading teacher data from storage...'
          );

          // First try to get teacher-specific data
          const teacherData = await getUserData('teacher', AsyncStorage);

          if (teacherData && teacherData.userType === 'teacher') {
            console.log(
              '✅ TEACHER SCREEN: Found teacher data:',
              teacherData.name
            );
            setUserData(teacherData);
          } else {
            console.log(
              '❌ TEACHER SCREEN: No valid teacher data found, redirecting to login'
            );
            navigation.replace('Login');
          }
        } catch (error) {
          console.error('❌ TEACHER SCREEN: Error loading user data:', error);
          navigation.replace('Login');
        }
      }
      setLoading(false);
    };

    loadUserData();
  }, [userData]);

  // Load teacher data when userData is available
  useEffect(() => {
    if (userData.authCode && !loading) {
      loadTeacherData();
    }
  }, [userData.authCode, loading]);

  // Load branch info when userData changes
  useEffect(() => {
    if (userData && Object.keys(userData).length > 0) {
      loadBranchInfo();
    }
  }, [userData]);

  // Load saved branch selection when branch data is available
  useEffect(() => {
    const branches = teacherClassesData?.branches || timetableData?.branches;
    if (branches && branches.length > 0) {
      loadSavedBranchSelection();
    }
  }, [teacherClassesData, timetableData]);

  // Monitor selectedBranchId changes
  useEffect(() => {
    console.log(
      '🔄 TEACHER SCREEN: selectedBranchId changed to:',
      selectedBranchId
    );
    console.log(
      '🔄 TEACHER SCREEN: currentBranchInfo:',
      currentBranchInfo?.branch_name
    );
  }, [selectedBranchId, currentBranchInfo]);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Get current branch data (prioritize teacher classes data, fallback to timetable)
  const getCurrentBranch = () => {
    // Try teacher classes data first (more comprehensive)
    if (
      teacherClassesData?.branches &&
      teacherClassesData.branches.length > 0
    ) {
      if (selectedBranchId) {
        const branch = teacherClassesData.branches.find(
          (b) => b.branch_id === selectedBranchId
        );
        return branch || teacherClassesData.branches[0];
      }
      return teacherClassesData.branches[0];
    }

    // Fallback to timetable data
    if (timetableData?.branches && timetableData.branches.length > 0) {
      if (selectedBranchId) {
        const branch = timetableData.branches.find(
          (b) => b.branch_id === selectedBranchId
        );
        return branch || timetableData.branches[0];
      }
      return timetableData.branches[0];
    }

    return null;
  };

  // Handle branch selection - using API
  const handleBranchSelection = async (branchId) => {
    if (branchSwitching) return; // Prevent multiple simultaneous switches

    setBranchSwitching(true);
    setShowBranchSelector(false);

    try {
      console.log('🔄 TEACHER SCREEN: Switching to branch via API:', branchId);

      // Call the branch switch API
      const response = await switchBranch(userData.authCode, branchId);

      if (response.success) {
        console.log('✅ TEACHER SCREEN: Branch switch API successful');
        console.log('✅ TEACHER SCREEN: API Response:', response);

        // Update local state with API response
        if (response.current_branch) {
          console.log(
            '🔄 TEACHER SCREEN: Setting selectedBranchId to:',
            response.current_branch.branch_id
          );
          console.log(
            '🔄 TEACHER SCREEN: Previous selectedBranchId was:',
            selectedBranchId
          );

          setSelectedBranchId(response.current_branch.branch_id);
          setCurrentBranchInfo(response.current_branch);

          // Update userData.current_branch to reflect the switch
          const updatedUserData = {
            ...userData,
            current_branch: response.current_branch,
          };
          setUserData(updatedUserData);
          console.log(
            '🔄 TEACHER SCREEN: Updated userData.current_branch to:',
            response.current_branch.branch_name
          );

          // Update accessible branches with new active state
          const updatedBranches = accessibleBranches.map((branch) => ({
            ...branch,
            is_active: branch.branch_id === response.current_branch.branch_id,
          }));
          setAccessibleBranches(updatedBranches);

          console.log(
            '✅ TEACHER SCREEN: State updated with new branch:',
            response.current_branch.branch_name
          );
        }

        // Save to local storage for persistence BEFORE refreshing data
        try {
          await AsyncStorage.setItem(
            'selectedBranchId',
            response.current_branch.branch_id.toString()
          );

          // Also save the updated userData with new current_branch
          const updatedUserData = {
            ...userData,
            current_branch: response.current_branch,
          };
          await AsyncStorage.setItem(
            'teacherData',
            JSON.stringify(updatedUserData)
          );

          console.log(
            '✅ TEACHER SCREEN: Branch switched via API to:',
            response.current_branch?.branch_name
          );
          console.log(
            '💾 TEACHER SCREEN: Saved to AsyncStorage:',
            response.current_branch.branch_id.toString()
          );
          console.log('💾 TEACHER SCREEN: Updated userData in AsyncStorage');
        } catch (error) {
          console.error('Error saving selected branch:', error);
        }

        // Refresh data for the new branch
        console.log(
          '🔄 TEACHER SCREEN: About to refresh data for branch:',
          response.current_branch.branch_id
        );
        await loadTeacherData();
      } else {
        console.error(
          '❌ TEACHER SCREEN: Branch switch API failed:',
          response.error
        );
        // Fallback to local switching if API fails
        await handleLocalBranchSelection(branchId);
      }
    } catch (error) {
      console.error(
        '❌ TEACHER SCREEN: Error switching branch via API:',
        error
      );
      // Fallback to local switching if API fails
      await handleLocalBranchSelection(branchId);
    } finally {
      setBranchSwitching(false);
    }
  };

  // Fallback local branch selection (when API fails)
  const handleLocalBranchSelection = async (branchId) => {
    try {
      console.log(
        '🔄 TEACHER SCREEN: Fallback to local branch switching:',
        branchId
      );

      // Find the selected branch in accessible branches
      const selectedBranch = accessibleBranches.find(
        (branch) => branch.branch_id === branchId
      );

      if (selectedBranch) {
        // Update branch selection state
        setSelectedBranchId(branchId);
        setCurrentBranchInfo(selectedBranch);

        // Update userData.current_branch for consistency
        const updatedUserData = {
          ...userData,
          current_branch: selectedBranch,
        };
        setUserData(updatedUserData);

        // Update accessible branches with new active state
        const updatedBranches = accessibleBranches.map((branch) => ({
          ...branch,
          is_active: branch.branch_id === branchId,
        }));
        setAccessibleBranches(updatedBranches);

        // Save to local storage for persistence
        try {
          await AsyncStorage.setItem('selectedBranchId', branchId.toString());
          console.log(
            '✅ TEACHER SCREEN: Branch switched locally to:',
            selectedBranch.branch_name
          );
        } catch (error) {
          console.error('Error saving selected branch:', error);
        }

        // Refresh data for the new branch
        await loadTeacherData();
      } else {
        console.error(
          '❌ TEACHER SCREEN: Selected branch not found in accessible branches'
        );
      }
    } catch (error) {
      console.error(
        '❌ TEACHER SCREEN: Error in local branch selection:',
        error
      );
    }
  };

  // Load saved branch selection - now using branch_id
  const loadSavedBranchSelection = async () => {
    try {
      console.log('📖 TEACHER SCREEN: Loading saved branch selection...');
      console.log(
        '📖 TEACHER SCREEN: Current selectedBranchId before load:',
        selectedBranchId
      );

      // First try to load by branch_id (new method)
      const savedBranchId = await AsyncStorage.getItem('selectedBranchId');
      console.log(
        '📖 TEACHER SCREEN: Read from AsyncStorage selectedBranchId:',
        savedBranchId
      );

      if (savedBranchId !== null) {
        // Try multiple sources for branches data
        let branches = teacherClassesData?.branches || timetableData?.branches;

        // If no branches found, try accessible_branches from API response
        if (!branches && accessibleBranches?.length > 0) {
          branches = accessibleBranches;
          console.log(
            '📖 TEACHER SCREEN: Using accessibleBranches as fallback'
          );
        }

        console.log(
          '📖 TEACHER SCREEN: Available branches:',
          branches?.map((b) => ({
            id: b.branch_id,
            name: b.branch_name,
            idType: typeof b.branch_id,
          }))
        );
        console.log(
          '📖 TEACHER SCREEN: Looking for savedBranchId:',
          savedBranchId,
          'type:',
          typeof savedBranchId
        );

        if (branches) {
          const branchExists = branches.find(
            (branch) => branch.branch_id.toString() === savedBranchId
          );
          console.log('📖 TEACHER SCREEN: Branch search result:', branchExists);

          if (branchExists) {
            console.log(
              '📖 TEACHER SCREEN: Setting selectedBranchId from AsyncStorage to:',
              parseInt(savedBranchId, 10)
            );
            setSelectedBranchId(parseInt(savedBranchId, 10));
            return;
          } else {
            console.log(
              '📖 TEACHER SCREEN: Saved branch ID not found in available branches - keeping current selection:',
              selectedBranchId
            );
            // Don't change selectedBranchId if the saved branch isn't available
            // This happens when switching to a branch that doesn't have classes data
            return;
          }
        }
      } else {
        console.log(
          '📖 TEACHER SCREEN: No saved branch ID found in AsyncStorage'
        );
      }

      // Fallback: try to load by old index method and convert to branch_id
      const savedBranchIndex = await AsyncStorage.getItem(
        'selectedBranchIndex'
      );
      if (savedBranchIndex !== null) {
        const branches =
          teacherClassesData?.branches || timetableData?.branches;
        if (branches) {
          const branchIndex = parseInt(savedBranchIndex, 10);
          if (branchIndex >= 0 && branchIndex < branches.length) {
            const branchId = branches[branchIndex].branch_id;
            setSelectedBranchId(branchId);
            // Save the new format and remove old format
            await AsyncStorage.setItem('selectedBranchId', branchId.toString());
            await AsyncStorage.removeItem('selectedBranchIndex');
            return;
          }
        }
      }

      // If no saved selection, default to first branch
      const branches = teacherClassesData?.branches || timetableData?.branches;
      if (branches && branches.length > 0) {
        setSelectedBranchId(branches[0].branch_id);
      }
    } catch (error) {
      console.error('Error loading saved branch selection:', error);
    }
  };

  // Note: Student counts are now fetched directly in fetchTeacherTimetable
  // This eliminates race conditions and ensures data consistency

  const handleLogout = () => {
    Alert.alert(t('logout'), t('confirmLogout'), [
      {
        text: t('cancel'),
        style: 'cancel',
      },
      {
        text: t('logout'),
        onPress: async () => {
          try {
            console.log('🚪 TEACHER LOGOUT: Starting logout process...');

            // Perform comprehensive logout cleanup
            const result = await performLogout({
              userType: 'teacher', // Specify that this is a teacher logout
              clearDeviceToken: false, // Keep device token for future logins
              clearAllData: false, // Keep device-specific settings
              messagingCleanup: cleanupMessaging, // Clean up messaging context
              notificationCleanup: clearNotifications, // Clean up notification context
            });

            if (result.success) {
              console.log('✅ TEACHER LOGOUT: Logout completed successfully');
              // Navigate back to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } else {
              console.error('❌ TEACHER LOGOUT: Logout failed:', result.error);
              // Still navigate even if cleanup failed
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }
          } catch (error) {
            console.error('❌ TEACHER LOGOUT: Error during logout:', error);
            // Fallback: still navigate to login screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        },
        style: 'destructive',
      },
    ]);
  };

  // Helper function to check if user has access to a feature in current branch
  const hasAccessInCurrentBranch = (featureId) => {
    // If no branch is selected, allow all features
    if (!selectedBranchId) {
      return true;
    }

    // Basic features are always available
    const basicFeatures = ['messaging', 'calendar', 'materials'];
    if (basicFeatures.includes(featureId)) {
      return true;
    }

    // For pickup, use a more flexible approach based on actual user data
    if (featureId === 'pickup') {
      // Check if user has any teaching/staff role or position
      const hasTeachingRole = userData.is_teacher || userData.is_staff;
      const hasStaffCategory = userData.staff_category_name;
      const hasProfessionPosition = userData.profession_position;
      const hasRoleInBranch = userData.roles?.some(
        (r) => r.branch_id === selectedBranchId
      );

      console.log('🚚 PICKUP FLEXIBLE ACCESS DEBUG:', {
        featureId,
        selectedBranchId,
        hasTeachingRole,
        hasStaffCategory,
        hasProfessionPosition,
        hasRoleInBranch,
        staff_category_name: userData.staff_category_name,
        profession_position: userData.profession_position,
        userRoles: userData.roles
          ?.filter((r) => r.branch_id === selectedBranchId)
          ?.map((r) => r.role_name),
      });

      // Allow pickup access if user has any staff/teaching role or position
      return (
        hasTeachingRole ||
        hasStaffCategory ||
        hasProfessionPosition ||
        hasRoleInBranch
      );
    }

    // For other features, use a more permissive approach
    // If user has roles array, check if they have any role in current branch
    if (userData.roles && Array.isArray(userData.roles)) {
      const hasRoleInBranch = userData.roles.some(
        (role) => role.branch_id === selectedBranchId
      );

      // If user has any role in current branch, allow most features
      if (hasRoleInBranch) {
        return true;
      }
    }

    // If user has staff/teacher flags, allow access
    if (userData.is_teacher || userData.is_staff) {
      return true;
    }

    // If user has staff category or profession position, allow access
    if (userData.staff_category_name || userData.profession_position) {
      return true;
    }

    // Default: allow access (more permissive fallback)
    return true;
  };

  // Get quick actions array (filtered by branch-specific roles)
  const getQuickActions = () => {
    console.log(
      '🎯 TEACHER SCREEN: getQuickActions called with selectedBranchId:',
      selectedBranchId
    );
    console.log(
      '🎯 TEACHER SCREEN: currentBranchInfo:',
      currentBranchInfo?.branch_name
    );

    const allActions = [
      {
        id: 'timetable',
        title: t('viewTimetable'),
        subtitle: t('scheduleAttendance'),
        icon: faClock,
        backgroundColor: theme.colors.primary,
        iconColor: theme.colors.headerText,
        disabled: false,
        onPress: () =>
          navigation.navigate('TeacherTimetable', {
            authCode: userData.authCode,
            teacherName: userData.name,
            timetableData: timetableData,
            selectedBranchId: selectedBranchId,
          }),
      },
      {
        id: 'bps',
        title: t('manageBPS'),
        subtitle: t('behaviorPoints'),
        icon: faScaleBalanced,
        backgroundColor: '#AF52DE',
        iconColor: '#fff',
        disabled: false,
        onPress: () =>
          navigation.navigate('TeacherBPS', {
            authCode: userData.authCode,
            teacherName: userData.name,
            selectedBranchId: selectedBranchId,
          }),
      },
      {
        id: 'homework',
        title: t('homework'),
        subtitle: t('assignmentsReview'),
        icon: faClipboardList,
        backgroundColor: '#34C759',
        iconColor: '#fff',
        disabled: false,
        onPress: () =>
          navigation.navigate('TeacherHomework', {
            authCode: userData.authCode,
            teacherName: userData.name,
            selectedBranchId: selectedBranchId,
          }),
      },
      {
        id: 'messaging',
        title: t('messages'),
        subtitle: t('chatCommunication'),
        icon: faComments,
        backgroundColor: '#d90429',
        iconColor: '#fff',
        disabled: false,
        // badge: (
        //   <ComingSoonBadge
        //     text={t('comingSoon')}
        //     theme={theme}
        //     fontSizes={fontSizes}
        //   />
        // ),
        onPress: () =>
          navigation.navigate('TeacherMessagingScreen', {
            authCode: userData.authCode,
            teacherName: userData.name,
          }),
      },
      {
        id: 'calendar',
        title: t('myCalendar'),
        subtitle: t('personalSchoolEvents'),
        icon: faCalendarAlt,
        backgroundColor: '#5856D6',
        iconColor: '#fff',
        disabled: false,
        onPress: async () => {
          try {
            // Clear any previous calendar user data to ensure teacher's own data is used
            await AsyncStorage.removeItem('calendarUserData');
            // Set teacher's own data as calendar user data
            await AsyncStorage.setItem(
              'teacherCalendarData',
              JSON.stringify(userData)
            );
            navigation.navigate('UserCalendar', {
              mode: 'combined',
              userType: 'teacher',
            });
          } catch (error) {
            console.error('Error setting teacher calendar data:', error);
            navigation.navigate('UserCalendar', {
              mode: 'combined',
              userType: 'teacher',
            });
          }
        },
      },
      // Health quick action
      {
        id: 'health',
        title: t('health'),
        subtitle: t('teacherStudentWellbeing'),
        icon: faHeartbeat,
        backgroundColor: '#028090',
        iconColor: '#fff',
        disabled: false,
        onPress: () => {
          navigation.navigate('TeacherHealthScreen', {
            authCode: userData.authCode,
            userData: userData,
          });
        },
      },
      {
        id: 'materials',
        title: t('materials'),
        subtitle: t('resourcesFiles'),
        icon: faBookOpen,
        backgroundColor: '#4CAF50',
        iconColor: '#fff',
        disabled: false,
        onPress: () => {
          navigation.navigate('WorkspaceScreen', {
            userData: userData,
          });
        },
      },
      // {
      //   id: 'reports',
      //   title: t('reports'),
      //   subtitle: t('analyticsStats'),
      //   icon: faChartLine,
      //   backgroundColor: '#3498db',
      //   iconColor: '#fff',
      //   disabled: false,
      //   onPress: () => {
      //     navigation.navigate('StaffReports', {
      //       userData: userData,
      //     });
      //   },
      // },
    ];

    // Filter actions based on branch-specific role access
    const filteredActions = allActions.filter((action) =>
      hasAccessInCurrentBranch(action.id)
    );

    // Add homeroom action conditionally (if user has homeroom role in current branch)
    if (userData.is_homeroom && hasAccessInCurrentBranch('homeroom')) {
      const homeroomAction = {
        id: 'homeroom',
        title: t('homeroom'),
        subtitle: t('classManagement'),
        icon: faHome,
        backgroundColor: '#FF6B35',
        iconColor: '#fff',
        disabled: false,
        onPress: () =>
          navigation.navigate('HomeroomScreen', {
            authCode: userData.authCode,
            teacherName: userData.name,
            selectedBranchId: selectedBranchId,
          }),
      };

      // Insert homeroom action at position 3 (after homework)
      const insertIndex = Math.min(3, filteredActions.length);
      filteredActions.splice(insertIndex, 0, homeroomAction);
    }

    // Staff Pickup Management - Check permissions and branch access
    const hasPickupAccess =
      userData.permissions?.pickup?.has_pickup_access ||
      userData.permissions?.pickup?.can_view_requests ||
      userData.permissions?.pickup?.can_process_pickup ||
      userData.permissions?.pickup?.can_scan_qr;

    const hasPickupRoleAccess = hasAccessInCurrentBranch('pickup');

    console.log('🚚 PICKUP DEBUG:', {
      hasPickupAccess,
      hasPickupRoleAccess,
      selectedBranchId,
      userRoles: userData.roles
        ?.filter((r) => r.branch_id === selectedBranchId)
        ?.map((r) => r.role_name),
      pickupPermissions: userData.permissions?.pickup,
    });

    // Show pickup if user has permissions OR role access (more permissive)
    // Also show if user has any role in current branch and pickup permissions
    const shouldShowPickup =
      hasPickupAccess ||
      hasPickupRoleAccess ||
      (hasPickupAccess &&
        userData.roles?.some((r) => r.branch_id === selectedBranchId));

    if (shouldShowPickup) {
      const pickupAction = {
        id: 'pickup',
        title: t('pickupManagement') || 'Pickup Management',
        subtitle: t('scanAndProcess') || 'Scan & process requests',
        icon: faQrcode,
        backgroundColor: '#f39c12',
        iconColor: '#fff',
        disabled: false,
        onPress: () =>
          navigation.navigate('TeacherPickupScreen', {
            authCode: userData.authCode,
            permissions: userData.permissions?.pickup,
          }),
      };

      // Insert pickup action at position 4 (after homeroom if it exists)
      const insertIndex = Math.min(4, filteredActions.length);
      filteredActions.splice(insertIndex, 0, pickupAction);
    }

    console.log(
      '🎯 TEACHER SCREEN: Filtered actions for branch',
      selectedBranchId,
      ':',
      filteredActions.map((a) => a.id)
    );

    return filteredActions;
  };

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
                fontSize: getResponsiveHeaderFontSize(3, t('teacherDashboard')),
              },
            ]}
          >
            {t('teacherDashboard')}
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() =>
                navigation.navigate('TeacherMessagingScreen', {
                  authCode: userData.authCode,
                  teacherName: userData.name,
                })
              }
            >
              <FontAwesomeIcon icon={faComments} size={18} color='#fff' />
              <MessageBadge userType='teacher' />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() =>
                navigation.navigate('NotificationScreen', {
                  userType: 'teacher',
                })
              }
            >
              <FontAwesomeIcon icon={faBell} size={18} color='#fff' />
              <NotificationBadge />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleLogout}
            >
              <FontAwesomeIcon icon={faDoorOpen} size={18} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Teacher & Branch Info Subheader */}
        <View style={styles.subHeader}>
          {/* Teacher Info Section */}
          <View style={styles.teacherSection}>
            <View style={styles.teacherAvatar}>
              {userData.photo || userData.profile_photo ? (
                <Image
                  source={{ uri: userData.photo || userData.profile_photo }}
                  style={styles.avatarImage}
                  resizeMode='cover'
                  onError={(error) => {
                    console.log('❌ TEACHER SCREEN: Image load error:', error);
                  }}
                />
              ) : (
                <FontAwesomeIcon
                  icon={faUser}
                  size={20}
                  color={theme.colors.primary}
                />
              )}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('TeacherProfile')}
            >
              <View style={styles.teacherInfo}>
                <Text style={styles.compactTeacherName}>
                  {userData.name || t('teacher')}
                </Text>
                <TouchableOpacity
                  onPress={handleRoleTap}
                  activeOpacity={(() => {
                    if (
                      userData.roles &&
                      Array.isArray(userData.roles) &&
                      userData.roles.length > 1
                    ) {
                      const uniqueRoles = [
                        ...new Set(
                          userData.roles.map((role) => role.role_name)
                        ),
                      ];
                      return uniqueRoles.length > 1 ? 0.7 : 1;
                    }
                    return 1;
                  })()}
                >
                  <Text
                    numberOfLines={2}
                    ellipsizeMode='tail'
                    style={[
                      styles.compactTeacherRole,
                      (() => {
                        if (
                          userData.roles &&
                          Array.isArray(userData.roles) &&
                          userData.roles.length > 1
                        ) {
                          const uniqueRoles = [
                            ...new Set(
                              userData.roles.map((role) => role.role_name)
                            ),
                          ];
                          return uniqueRoles.length > 1
                            ? styles.clickableRole
                            : null;
                        }
                        return null;
                      })(),
                    ]}
                  >
                    {formatUserRoles(userData)} {/* Demo Mode Indicator */}
                    <DemoModeIndicator userData={userData} />
                  </Text>
                  <Text style={styles.compactTeacherId}>
                    {t('id')}: {userData.id || t('notAvailable')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>

          {/* Branch Summary Section */}
          {((teacherClassesData?.branches &&
            teacherClassesData.branches.length > 0) ||
            (timetableData?.branches && timetableData.branches.length > 0)) && (
            <View style={styles.branchSummarySection}>
              <View style={styles.branchSummaryHeader}>
                <View style={styles.branchIconWrapper}>
                  <FontAwesomeIcon
                    icon={faBuilding}
                    size={16}
                    color={theme.colors.success}
                  />
                </View>
                <View style={styles.branchSummaryInfo}>
                  <TouchableOpacity
                    onPress={() => {
                      // Prioritize API data, fall back to local data
                      const branches =
                        accessibleBranches.length > 0
                          ? accessibleBranches
                          : teacherClassesData?.branches ||
                            timetableData?.branches ||
                            [];

                      if (branches.length > 1) {
                        setShowBranchSelector(!showBranchSelector);
                      }
                    }}
                    activeOpacity={(() => {
                      // Prioritize API data, fall back to local data
                      const branches =
                        accessibleBranches.length > 0
                          ? accessibleBranches
                          : teacherClassesData?.branches ||
                            timetableData?.branches ||
                            [];
                      return branches.length > 1 ? 0.7 : 1;
                    })()}
                    style={styles.branchTitleContainer}
                  >
                    <Text style={styles.branchSummaryTitle}>
                      {(() => {
                        // Prioritize API current branch info
                        if (currentBranchInfo?.branch_name) {
                          return currentBranchInfo.branch_name;
                        }

                        // Fall back to existing logic
                        const branches =
                          teacherClassesData?.branches ||
                          timetableData?.branches ||
                          [];
                        if (branches.length === 1) {
                          return branches[0].branch_name;
                        }
                        return (
                          getCurrentBranch()?.branch_name || t('selectBranch')
                        );
                      })()}
                    </Text>
                    {(() => {
                      // Prioritize API data, fall back to local data
                      const branches =
                        accessibleBranches.length > 0
                          ? accessibleBranches
                          : teacherClassesData?.branches ||
                            timetableData?.branches ||
                            [];

                      return (
                        branches.length > 1 && (
                          <FontAwesomeIcon
                            icon={faChevronRight}
                            size={12}
                            color={theme.colors.textSecondary}
                            style={[
                              styles.branchChevron,
                              showBranchSelector && styles.branchChevronRotated,
                            ]}
                          />
                        )
                      );
                    })()}
                  </TouchableOpacity>
                  <Text style={styles.branchSummarySubtitle}>
                    {t('academicYear')}:{' '}
                    {timetableData?.global_academic_year?.academic_year ||
                      t('notAvailable')}{' '}
                    / {t('week')}:{' '}
                    {timetableData?.branches?.[0]?.current_week ||
                      t('notAvailable')}
                    {(() => {
                      const branches =
                        teacherClassesData?.branches ||
                        timetableData?.branches ||
                        [];
                      if (branches.length > 1 && selectedBranchId) {
                        const currentIndex = branches.findIndex(
                          (b) => b.branch_id === selectedBranchId
                        );
                        return (
                          <Text style={styles.branchCount}>
                            {' '}
                            • {currentIndex + 1} of {branches.length}
                          </Text>
                        );
                      }
                      return null;
                    })()}
                  </Text>
                </View>
              </View>

              {/* Branch Selector Dropdown */}
              {showBranchSelector &&
                (() => {
                  // Prioritize API data, fall back to local data
                  const branches =
                    accessibleBranches.length > 0
                      ? accessibleBranches
                      : teacherClassesData?.branches ||
                        timetableData?.branches ||
                        [];

                  return (
                    branches.length > 1 && (
                      <View style={styles.branchSelectorDropdown}>
                        {branchSwitching && (
                          <View style={styles.branchSwitchingIndicator}>
                            <ActivityIndicator
                              size='small'
                              color={theme.colors.primary}
                            />
                            <Text style={styles.branchSwitchingText}>
                              {t('switchingBranch') || 'Switching branch...'}
                            </Text>
                          </View>
                        )}
                        <ScrollView
                          style={styles.branchSelectorScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {branches.map((branch) => {
                            // Handle both API format and local data format
                            const branchId = branch.branch_id;
                            const branchName = branch.branch_name;
                            const isActive =
                              branch.is_active || selectedBranchId === branchId;

                            return (
                              <TouchableOpacity
                                key={branchId}
                                style={[
                                  styles.branchSelectorItem,
                                  isActive && styles.branchSelectorItemSelected,
                                ]}
                                onPress={() => handleBranchSelection(branchId)}
                                disabled={branchSwitching}
                              >
                                <View style={styles.branchSelectorItemContent}>
                                  <Text
                                    style={[
                                      styles.branchSelectorItemText,
                                      isActive &&
                                        styles.branchSelectorItemTextSelected,
                                      branchSwitching &&
                                        styles.branchSelectorItemTextDisabled,
                                    ]}
                                  >
                                    {branchName}
                                  </Text>
                                  {isActive && (
                                    <FontAwesomeIcon
                                      icon={faChevronRight}
                                      size={14}
                                      color={
                                        branchSwitching
                                          ? theme.colors.textSecondary
                                          : theme.colors.primary
                                      }
                                    />
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )
                  );
                })()}

              {/* Quick Stats Row */}
              <View style={styles.quickStatsRow}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>
                    {dashboardStats.totalClasses}
                  </Text>
                  <Text style={styles.quickStatLabel}>Weekly Lessons</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>
                    {(() => {
                      const currentBranch = getCurrentBranch();
                      if (!currentBranch) return 0;
                      const branchStudentCount =
                        branchStudentCounts[currentBranch.branch_id];
                      return branchStudentCount !== undefined
                        ? branchStudentCount
                        : '...';
                    })()}
                  </Text>
                  <Text style={styles.quickStatLabel}>Students</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>
                    {(() => {
                      // Get attendance taken from current branch
                      const currentBranch = getCurrentBranch();
                      if (currentBranch?.timetable) {
                        return currentBranch.timetable.filter(
                          (item) => item.attendance_taken
                        ).length;
                      } else if (currentBranch?.classes) {
                        // For teacherClassesData, we don't have attendance_taken info
                        // So we'll show the timetable data if available
                        const timetableBranch = timetableData?.branches?.find(
                          (b) => b.branch_id === currentBranch.branch_id
                        );
                        if (timetableBranch?.timetable) {
                          return timetableBranch.timetable.filter(
                            (item) => item.attendance_taken
                          ).length;
                        }
                      }
                      return 0;
                    })()}
                  </Text>
                  <Text style={styles.quickStatLabel}>Attendance Taken</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadTeacherData}
              colors={['#007AFF']}
              tintColor='#007AFF'
            />
          }
        >
          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <View
              style={[
                styles.actionTilesGrid,
                isIPadDevice && styles.iPadActionTilesGrid,
                isIPadDevice &&
                  isLandscape &&
                  styles.iPadLandscapeActionTilesGrid3Col,
                isTabletDevice && styles.tabletActionTilesGrid,
                isTabletDevice &&
                  isLandscape &&
                  styles.tabletLandscapeActionTilesGrid3Col,
              ]}
            >
              {getQuickActions().map((action, index) => {
                const quickActions = getQuickActions();
                const totalItems = quickActions.length;

                // Helper function to calculate items per row for landscape tablets/iPads
                const getLandscapeItemsPerRow = (totalItems) => {
                  if (totalItems <= 6) {
                    return 3; // 3x2 layout for 6 or fewer items
                  } else if (totalItems <= 9) {
                    return 3; // 3x3 layout for 7-9 items
                  } else {
                    return 4; // 4 per row for more items
                  }
                };

                // Calculate columns per row based on device type and total items
                let itemsPerRow = 2; // Default for mobile (TeacherScreen uses 2 per row)
                if (isIPadDevice && isLandscape) {
                  itemsPerRow = getLandscapeItemsPerRow(totalItems);
                } else if (isTabletDevice && isLandscape) {
                  itemsPerRow = getLandscapeItemsPerRow(totalItems);
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

                // Calculate minimum height based on device type and actual itemsPerRow
                let minHeight = (screenWidth - 52) / 2; // Default mobile (2 per row, accounting for margins and gap)
                if (isIPadDevice && isLandscape) {
                  minHeight = (screenWidth - 80) / itemsPerRow - 12;
                } else if (isTabletDevice && isLandscape) {
                  minHeight = (screenWidth - 80) / itemsPerRow - 12;
                } else if (isIPadDevice) {
                  20;
                } else if (isTabletDevice) {
                  minHeight = (screenWidth - 80) / 4 - 12;
                }

                return (
                  <QuickActionTile
                    key={action.id}
                    title={action.title}
                    subtitle={action.subtitle}
                    icon={action.icon}
                    backgroundColor={action.backgroundColor}
                    iconColor={action.iconColor}
                    disabled={action.disabled}
                    badge={action.badge}
                    onPress={action.onPress}
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
            </View>
          </View>
        </ScrollView>
      )}

      {/* All Roles Modal */}
      {renderAllRolesModal()}
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
      marginTop: 8,
      marginBottom: 8,
      ...theme.shadows.small,
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
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
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
    // Legacy header button style (keeping for compatibility)
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    messageButton: {
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    notificationButton: {
      // width: 40,
      // height: 40,
      // borderRadius: 20,
      // backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    logoutButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 2,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 15,
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },

    // Scroll View
    scrollView: {
      flex: 1,
    },

    // Compact Teacher & Branch Header
    compactTeacherHeader: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      marginBottom: 15,
      borderRadius: 16,
      padding: 16,
      ...createSmallShadow(theme),
    },

    // Teacher Section
    teacherSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    teacherAvatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarImage: {
      width: 70,
      height: 70,
      borderRadius: 35,
    },
    teacherInfo: {
      flex: 1,
    },
    compactTeacherName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    compactTeacherRole: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      flexShrink: 1,
    },
    compactTeacherId: {
      marginTop: 2,
      marginBottom: 10,
      fontSize: 12,
      color: theme.colors.textLight,
      fontWeight: '500',
    },
    clickableRole: {
      color: theme.colors.textSecondary,
    },

    // Branch Summary Section
    branchSummarySection: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 10,
      marginTop: 5,
    },
    branchSummaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    branchIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.success + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    branchSummaryInfo: {
      flex: 1,
    },
    branchTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    branchSummaryTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    branchChevron: {
      marginLeft: 6,
      transform: [{ rotate: '0deg' }],
    },
    branchChevronRotated: {
      transform: [{ rotate: '90deg' }],
    },
    branchSummarySubtitle: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    branchCount: {
      fontSize: 10,
      color: theme.colors.primary,
      fontWeight: '600',
    },

    // Branch Selector Dropdown
    branchSelectorDropdown: {
      marginTop: 12,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      maxHeight: 200,
      ...createSmallShadow(theme),
    },
    branchSelectorScroll: {
      maxHeight: 200,
    },
    branchSelectorItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    branchSelectorItemSelected: {
      backgroundColor: theme.colors.primary + '10',
    },
    branchSelectorItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    branchSelectorItemText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
      flex: 1,
    },
    branchSelectorItemTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    branchSelectorItemTextDisabled: {
      color: theme.colors.textSecondary,
      opacity: 0.6,
    },

    // Branch Switching Indicator
    branchSwitchingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.primary + '05',
    },
    branchSwitchingText: {
      marginLeft: 8,
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
    },

    // Quick Stats Row
    quickStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    quickStat: {
      alignItems: 'center',
      flex: 1,
    },
    quickStatNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    quickStatLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
    },

    // Stats Container
    statsContainer: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    sectionTitle: {
      marginLeft: 30,
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      width: (screenWidth - 60) / 2,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      alignItems: 'center',
      ...createMediumShadow(theme),
    },
    statIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary, // Changed from '#666'
      fontWeight: '500',
      textAlign: 'center',
    },

    // Quick Actions - Tile Layout
    quickActionsContainer: {
      marginHorizontal: 20,
      marginBottom: 25,
      alignItems: 'center', // Centers the grid horizontally within the container
    },
    actionTilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start', // Changed from space-between to support flex expansion
      gap: 12,
    },
    // iPad-specific grid layout - 4 tiles per row, wraps to next row for additional tiles
    iPadActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Math.max(12, (screenWidth - 80 - ((screenWidth - 80) / 4) * 4) / 3), // Dynamic gap calculation
    },
    // Tablet-specific grid layout - 4 tiles per row, wraps to next row for additional tiles
    tabletActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(12, (screenWidth - 80 - ((screenWidth - 80) / 4) * 4) / 3), // Dynamic gap calculation
    },
    // iPad landscape-specific grid layout - 6 tiles per row (legacy), wraps for additional tiles
    iPadLandscapeActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(6, (screenWidth - 80 - ((screenWidth - 80) / 6) * 6) / 5), // Dynamic gap for 6 tiles
    },
    // iPad landscape-specific grid layout - 3 tiles per row for better balance (current)
    iPadLandscapeActionTilesGrid3Col: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-evenly',
      alignItems: 'flex-start',
      gap: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    // Tablet landscape-specific grid layout - 6 tiles per row (legacy), wraps for additional tiles
    tabletLandscapeActionTilesGrid: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: Math.max(12, (screenWidth - 80 - ((screenWidth - 80) / 6) * 6) / 5), // Dynamic gap for 6 tiles
    },
    // Tablet landscape-specific grid layout - 3 tiles per row for better balance (current)
    tabletLandscapeActionTilesGrid3Col: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start200200300',
      alignItems: 'flex-start',
      gap: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    actionTile: {
      width: (screenWidth - 52) / 2, // 2 tiles per row with margins and gap
      minWidth: (screenWidth - 52) / 2, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 24,
      padding: 20,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      ...createMediumShadow(theme),
      position: 'relative',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    // iPad-specific action tile - optimized for 4 per row, wraps for additional tiles
    iPadActionTile: {
      width: (screenWidth - 80) / 4 - 2, // Optimized for 4 tiles per row with wrapping support
      minWidth: (screenWidth - 80) / 4 - 2, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 24,
      padding: 12,
      ...createCustomShadow(theme, {
        height: 3,
        opacity: 0.15,
        radius: 8,
        elevation: 4,
      }),
    },
    // Tablet-specific action tile - optimized for 4 per row, wraps for additional tiles
    tabletActionTile: {
      width: (screenWidth - 70) / 4 - 2, // Optimized for 4 tiles per row with wrapping support
      minWidth: (screenWidth - 70) / 4 - 2, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 24,
      padding: 14,
      ...createCustomShadow(theme, {
        height: 4,
        opacity: 0.18,
        radius: 10,
        elevation: 6,
      }),
    },
    // iPad landscape-specific action tile - optimized for 6 per row (legacy)
    iPadLandscapeActionTile: {
      width: (screenWidth - 100) / 6 - 2, // 6 tiles per row in landscape with wrapping support
      minWidth: (screenWidth - 100) / 6 - 2, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 14,
      padding: 10,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.12,
        radius: 6,
        elevation: 3,
      }),
    },
    // iPad landscape-specific action tile - optimized for 3 per row (current)
    iPadLandscapeActionTile3Col: {
      width: 300, // Fixed width for consistent sizing
      height: 300, // Fixed height instead of aspectRatio
      minWidth: 300,
      maxWidth: 300,
      borderRadius: 14,
      padding: 10,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.12,
        radius: 6,
        elevation: 3,
      }),
    },
    // Tablet landscape-specific action tile - optimized for 6 per row (legacy)
    tabletLandscapeActionTile: {
      width: (screenWidth - 90) / 6 - 2, // 6 tiles per row in landscape with wrapping support
      minWidth: (screenWidth - 90) / 6 - 2, // Minimum width for flex expansion
      aspectRatio: 1, // Square tiles
      borderRadius: 16,
      padding: 12,
      ...createCustomShadow(theme, {
        height: 3,
        opacity: 0.15,
        radius: 8,
        elevation: 4,
      }),
    },
    // Tablet landscape-specific action tile - optimized for 3 per row (current)
    tabletLandscapeActionTile3Col: {
      width: 210, // Fixed width for consistent sizing
      height: 210, // Fixed height instead of aspectRatio
      minWidth: 210,
      maxWidth: 210,
      borderRadius: 24,
      padding: 12,
      ...createCustomShadow(theme, {
        height: 3,
        opacity: 0.15,
        radius: 8,
        elevation: 4,
      }),
    },
    tileIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    // iPad-specific tile icon container - smaller
    iPadTileIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: 8,
    },
    // Tablet-specific tile icon container
    tabletTileIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: 10,
    },
    // iPad landscape-specific tile icon container - even smaller for 6 per row (legacy)
    iPadLandscapeTileIconContainer: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginBottom: 6,
    },
    // iPad landscape-specific tile icon container - optimized for 3 per row (current)
    iPadLandscapeTileIconContainer3Col: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginBottom: 8,
    },
    // Tablet landscape-specific tile icon container (legacy)
    tabletLandscapeTileIconContainer: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginBottom: 8,
    },
    // Tablet landscape-specific tile icon container - optimized for 3 per row (current)
    tabletLandscapeTileIconContainer3Col: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginBottom: 8,
    },
    tileTitle: {
      fontSize: fontSizes.tileTitle,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    tileSubtitle: {
      fontSize: fontSizes.tileSubtitle,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
      marginBottom: 8,
    },
    // iPad-specific tile text styles - smaller
    iPadTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 2, 20),
      marginBottom: 2,
    },
    iPadTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1, 14),
      marginBottom: 4,
    },
    // Tablet-specific tile text styles
    tabletTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 1, 20),
      marginBottom: 3,
    },
    tabletTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 0.5, 14),
      marginBottom: 6,
    },
    // iPad landscape-specific tile text styles - even smaller for 6 per row (legacy)
    iPadLandscapeTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 3, 10),
      marginBottom: 1,
    },
    iPadLandscapeTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 2, 8),
      marginBottom: 2,
    },
    // iPad landscape-specific tile text styles - optimized for 3 per row (current)
    iPadLandscapeTileTitle3Col: {
      fontSize: Math.max(fontSizes.tileTitle - 1, 20),
      marginBottom: 2,
    },
    iPadLandscapeTileSubtitle3Col: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1, 16),
      marginBottom: 3,
    },
    // Tablet landscape-specific tile text styles (legacy)
    tabletLandscapeTileTitle: {
      fontSize: Math.max(fontSizes.tileTitle - 2, 11),
      marginBottom: 2,
    },
    tabletLandscapeTileSubtitle: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1.5, 9),
      marginBottom: 3,
    },
    // Tablet landscape-specific tile text styles - optimized for 3 per row (current)
    tabletLandscapeTileTitle3Col: {
      fontSize: Math.max(fontSizes.tileTitle - 1, 20),
      marginBottom: 2,
    },
    tabletLandscapeTileSubtitle3Col: {
      fontSize: Math.max(fontSizes.tileSubtitle - 1, 16),
      marginBottom: 3,
    },
    tileBadge: {
      position: 'absolute',
      top: 16,
      right: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 14,
      minWidth: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.1,
        radius: 4,
        elevation: 3,
      }),
    },
    tileBadgeText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#333',
      letterSpacing: 0.2,
    },

    // Disabled tile styles
    disabledTile: {
      opacity: 0.7,
    },
    comingSoonBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: '#FF9500',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.2,
        radius: 4,
        elevation: 3,
      }),
    },
    comingSoonText: {
      color: '#fff',
      fontSize: fontSizes.comingSoonText,
      fontWeight: 'bold',
      letterSpacing: 0.3,
    },

    // Legacy Quick Actions (keeping for backward compatibility)
    actionGrid: {
      gap: 15,
    },
    actionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.1,
        radius: 8,
        elevation: 4,
      }),
    },
    actionIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    actionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 6,
    },
    actionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    actionBadge: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      borderColor: theme.colors.info,
      borderWidth: 1,
    },
    actionBadgeText: {
      fontSize: 12,
      color: theme.colors.info,
      fontWeight: '600',
    },

    // Features
    featuresContainer: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    featuresList: {
      backgroundColor: theme.colors.surface, // Changed from '#fff'
      borderRadius: 16,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.1,
        radius: 8,
        elevation: 4,
      }),
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border, // Changed from '#f0f0f0'
    },
    featureIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: fontSizes.featureTitle,
      fontWeight: '600',
      color: theme.colors.text, // Changed from '#1a1a1a'
      marginBottom: 4,
    },
    featureSubtitle: {
      fontSize: fontSizes.featureSubtitle,
      color: theme.colors.textSecondary, // Changed from '#666'
    },

    // Disabled feature styles
    disabledFeatureItem: {
      opacity: 0.6,
    },
    disabledFeatureText: {
      color: '#B0B0B0',
    },
    featureComingSoonBadge: {
      backgroundColor: '#FF9500',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      marginLeft: 8,
    },
    featureComingSoonText: {
      color: '#fff',
      fontSize: fontSizes.comingSoonText,
      fontWeight: 'bold',
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    rolesContainer: {
      maxHeight: 300,
    },
    branchRoleGroup: {
      marginBottom: 16,
    },
    branchRoleGroupTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    roleItem: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 6,
      marginLeft: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    roleName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    noRolesText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      paddingVertical: 20,
    },
    modalCloseButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      alignItems: 'center',
    },
    modalCloseText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
