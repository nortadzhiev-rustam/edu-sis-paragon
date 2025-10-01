import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUser,
  faEnvelope,
  faPhone,
  faBuilding,
  faIdCard,
  faCalendarAlt,
  faEdit,
  faSignOutAlt,
  faUserTie,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserData } from '../services/authService';
import { performLogout } from '../services/logoutService';
import { borderRadius } from '../utils/commonStyles';
import { useFocusEffect } from '@react-navigation/native';
import { Config } from '../config/env';

export default function TeacherProfile({ route, navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const styles = createStyles(theme, fontSizes);

  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from edit screen)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 TEACHER PROFILE: Screen focused, refreshing data...');
      loadUserData();
    }, [])
  );

  const loadCurrentBranchId = async () => {
    try {
      const savedBranchId = await AsyncStorage.getItem('selectedBranchId');
      if (savedBranchId) {
        const branchId = parseInt(savedBranchId, 10);
        setCurrentBranchId(branchId);
        console.log('📍 TEACHER PROFILE: Current branch ID:', branchId);
        return branchId;
      }
    } catch (error) {
      console.error(
        '❌ TEACHER PROFILE: Error loading current branch ID:',
        error
      );
    }
    return null;
  };

  const loadUserData = async () => {
    try {
      setRefreshing(true);
      console.log('🔍 TEACHER PROFILE: Loading teacher data...');

      // Load current branch ID
      await loadCurrentBranchId();

      // First try to get teacher-specific data
      const teacherData = await getUserData('teacher', AsyncStorage);

      if (teacherData && teacherData.userType === 'teacher') {
        console.log(
          '✅ TEACHER PROFILE: Found teacher data:',
          teacherData.name
        );
        setUserData(teacherData);
      } else {
        console.log('❌ TEACHER PROFILE: No valid teacher data found');
        Alert.alert('Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('❌ TEACHER PROFILE: Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('logout'), t('areYouSureLogout'), [
      {
        text: t('cancel'),
        style: 'cancel',
      },
      {
        text: t('logout'),
        onPress: async () => {
          try {
            console.log(
              '🚪 TEACHER PROFILE LOGOUT: Starting logout process...'
            );

            // Perform comprehensive logout cleanup
            const result = await performLogout({
              userType: 'teacher', // Specify that this is a teacher logout
              clearDeviceToken: false, // Keep device token for future logins
              clearAllData: false, // Keep device-specific settings
            });

            if (result.success) {
              console.log(
                '✅ TEACHER PROFILE LOGOUT: Logout completed successfully'
              );
              // Navigate back to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } else {
              console.error(
                '❌ TEACHER PROFILE LOGOUT: Logout failed:',
                result.error
              );
              // Still navigate even if cleanup failed
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          } catch (error) {
            console.error(
              '❌ TEACHER PROFILE LOGOUT: Error during logout:',
              error
            );
            // Fallback: still navigate to login screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate('TeacherProfileEdit');
  };

  const formatUserPosition = (userData) => {
    // Prioritize position-related fields over roles
    if (userData.profession_position) {
      return userData.profession_position;
    }

    if (userData.position) {
      return userData.position;
    }

    if (userData.staff_category_name) {
      return userData.staff_category_name;
    }

    if (userData.role) {
      return userData.role;
    }

    // Only use roles as fallback if no position data is available
    if (
      userData.roles &&
      Array.isArray(userData.roles) &&
      userData.roles.length > 0
    ) {
      // Just return the first role's name as position
      return userData.roles[0].role_name;
    }

    return 'Teacher';
  };

  const getCurrentBranchRoles = (userData, currentBranchId) => {
    if (
      !userData.roles ||
      !Array.isArray(userData.roles) ||
      userData.roles.length === 0
    ) {
      return [];
    }

    // If no current branch ID is available, return all roles
    if (!currentBranchId) {
      return userData.roles;
    }

    // Filter roles by current branch ID
    const currentBranchRoles = userData.roles.filter((role) => {
      // Check if role has branch_id that matches current branch
      if (role.branch_id && role.branch_id === currentBranchId) {
        return true;
      }

      // Fallback: if no branch_id but has branch_name, try to match by name
      // This is less reliable but provides fallback support
      if (!role.branch_id && role.branch_name && userData.accessible_branches) {
        const matchingBranch = userData.accessible_branches.find(
          (branch) =>
            branch.branch_id === currentBranchId &&
            branch.branch_name === role.branch_name
        );
        return !!matchingBranch;
      }

      return false;
    });

    console.log(
      `📍 TEACHER PROFILE: Filtered ${currentBranchRoles.length} roles for current branch (ID: ${currentBranchId})`
    );
    return currentBranchRoles;
  };

  const ProfileItem = ({ icon, label, value, onPress }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.profileItemIcon}>
        <FontAwesomeIcon icon={icon} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.profileItemContent}>
        <Text style={styles.profileItemLabel}>{label}</Text>
        <Text style={styles.profileItemValue}>{value || t('notProvided')}</Text>
      </View>
      {onPress && (
        <FontAwesomeIcon
          icon={faEdit}
          size={16}
          color={theme.colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={20}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('myProfile')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('loadingProfile')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            size={20}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('myProfile')}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesomeIcon
            icon={faSignOutAlt}
            size={20}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadUserData}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {userData.photo || userData.profile_photo || userData.user_photo ? (
              <Image
                source={{
                  uri: (() => {
                    const rawPhoto =
                      userData.photo ||
                      userData.profile_photo ||
                      userData.user_photo;
                    return rawPhoto.startsWith('http')
                      ? rawPhoto
                      : `${Config.API_DOMAIN}${
                          rawPhoto.startsWith('/') ? rawPhoto : '/' + rawPhoto
                        }`;
                  })(),
                }}
                style={styles.avatar}
                resizeMode='cover'
                onError={(error) => {
                  console.log('❌ TEACHER PROFILE: Image load error:', error);
                }}
                onLoad={() => {
                  console.log('✅ TEACHER PROFILE: Image loaded successfully');
                }}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesomeIcon
                  icon={faUser}
                  size={40}
                  color={theme.colors.primary}
                />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{userData.name || 'Teacher'}</Text>
          <Text style={styles.userRole}>{formatUserPosition(userData)}</Text>
          <Text style={styles.userId}>ID: {userData.id || 'N/A'}</Text>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <FontAwesomeIcon
              icon={faEdit}
              size={16}
              color={theme.colors.accent}
            />
            <Text style={styles.editProfileText}>
              {t('editProfile') || 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Information */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>{t('personalInformation')}</Text>

          <ProfileItem
            icon={faUser}
            label={t('fullName')}
            value={userData.name}
          />

          <ProfileItem
            icon={faIdCard}
            label={t('employeeId')}
            value={userData.id}
          />

          <ProfileItem
            icon={faEnvelope}
            label={t('email')}
            value={userData.email}
          />

          <ProfileItem
            icon={faPhone}
            label={t('phone')}
            value={userData.mobile_phone || userData.phone}
          />
        </View>

        {/* Work Information */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>{t('workInformation')}</Text>

          <ProfileItem
            icon={faUserTie}
            label={t('position')}
            value={
              userData.profession_position ||
              userData.role ||
              (userData.roles && userData.roles.length > 0
                ? userData.roles[0].role_name
                : userData.staff_category_name || 'Staff Member')
            }
          />

          <ProfileItem
            icon={faBuilding}
            label={t('department')}
            value={
              userData.staff_category_name ||
              userData.department ||
              'Not specified'
            }
          />

          <ProfileItem
            icon={faMapMarkerAlt}
            label={t('branch')}
            value={
              userData.branch?.branch_name ||
              (userData.roles && userData.roles.length > 0
                ? userData.roles[0].branch_name
                : 'Not specified')
            }
          />

          <ProfileItem
            icon={faCalendarAlt}
            label={t('joinDate')}
            value={userData.join_date || 'Not available'}
          />
        </View>

        {/* Staff Category Information */}
        {(userData.staff_category_name || userData.profession_position) && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>{t('staffInformation')}</Text>

            {userData.staff_category_name && (
              <ProfileItem
                icon={faUserTie}
                label={t('staffCategory')}
                value={userData.staff_category_name}
              />
            )}

            {userData.profession_position && (
              <ProfileItem
                icon={faUserTie}
                label={t('professionPosition')}
                value={userData.profession_position}
              />
            )}

            {userData.staff_category_id && (
              <ProfileItem
                icon={faIdCard}
                label={t('categoryId')}
                value={userData.staff_category_id.toString()}
              />
            )}
          </View>
        )}

        {/* Accessible Branches */}
        {userData.accessible_branches &&
          userData.accessible_branches.length > 0 && (
            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>{t('accessibleBranches')}</Text>
              {userData.accessible_branches.map((branch, index) => (
                <View key={index} style={styles.roleItem}>
                  <View style={styles.roleIcon}>
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      size={16}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.roleContent}>
                    <Text style={styles.roleName}>{branch.branch_name}</Text>
                    {branch.branch_description && (
                      <Text style={styles.roleBranch}>
                        {branch.branch_description}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

        {/* Roles Section - Only show current branch roles */}
        {(() => {
          const currentBranchRoles = getCurrentBranchRoles(
            userData,
            currentBranchId
          );
          return (
            currentBranchRoles.length > 0 && (
              <View style={styles.profileSection}>
                <Text style={styles.sectionTitle}>
                  {t('rolesResponsibilities')}
                  {currentBranchId && (
                    <Text style={styles.sectionSubtitle}>
                      {' '}
                      ({t('currentBranch')})
                    </Text>
                  )}
                </Text>
                {currentBranchRoles.map((role, index) => (
                  <View key={index} style={styles.roleItem}>
                    <View style={styles.roleIcon}>
                      <FontAwesomeIcon
                        icon={faUserTie}
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.roleContent}>
                      <Text style={styles.roleName}>{role.role_name}</Text>
                      {role.branch_name && (
                        <Text style={styles.roleBranch}>
                          {role.branch_name}
                        </Text>
                      )}
                      {role.role_id && (
                        <Text style={styles.roleBranch}>
                          ID: {role.role_id}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )
          );
        })()}
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
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      marginHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 16,
      ...theme.shadows.small,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: theme.colors.headerText,
      fontSize: fontSizes.headerTitle,
      fontWeight: 'bold',
    },
    headerRight: {
      width: 40,
    },
    logoutButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 15,
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
    },
    scrollView: {
      flex: 1,
    },
    profileHeader: {
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      padding: 30,
      margin: 20,
      borderRadius: 16,
      ...theme.shadows.small,
    },
    avatarContainer: {
      marginBottom: 20,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    userName: {
      fontSize: fontSizes.profileName,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    userRole: {
      fontSize: fontSizes.profileRole,
      color: theme.colors.primary,
      fontWeight: '600',
      marginBottom: 4,
      textAlign: 'center',
    },
    userId: {
      fontSize: fontSizes.profileId,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    editProfileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceSecondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 16,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: theme.colors.accent,
    },
    editProfileText: {
      fontSize: fontSizes.small,
      color: theme.colors.accent,
      fontWeight: '600',
      marginLeft: 6,
    },
    profileSection: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      marginTop: 0,
      borderRadius: 16,
      padding: 20,
      ...theme.shadows.small,
    },
    sectionTitle: {
      fontSize: fontSizes.sectionTitle,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
    },
    sectionSubtitle: {
      fontSize: fontSizes.bodySmall,
      fontWeight: 'normal',
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    profileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    profileItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    profileItemContent: {
      flex: 1,
    },
    profileItemLabel: {
      fontSize: fontSizes.profileItemLabel,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      fontWeight: '500',
    },
    profileItemValue: {
      fontSize: fontSizes.profileItemValue,
      color: theme.colors.text,
      fontWeight: '600',
    },
    roleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    roleIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    roleContent: {
      flex: 1,
    },
    roleName: {
      fontSize: fontSizes.body,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    roleBranch: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
  });
