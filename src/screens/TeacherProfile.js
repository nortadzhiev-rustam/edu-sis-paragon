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

export default function TeacherProfile({ route, navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const styles = createStyles(theme, fontSizes);

  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setRefreshing(true);
      console.log('🔍 TEACHER PROFILE: Loading teacher data...');

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

  const formatUserRoles = (userData) => {
    if (
      userData.roles &&
      Array.isArray(userData.roles) &&
      userData.roles.length > 0
    ) {
      // Get unique role names across all branches
      const uniqueRoles = [
        ...new Set(userData.roles.map((role) => role.role_name)),
      ];

      if (uniqueRoles.length === 1) {
        // Single unique role - just show the role name
        return uniqueRoles[0];
      } else {
        // Multiple unique roles - show them separated by dashes
        return uniqueRoles.join(' - ');
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

    return userData.position || 'Teacher';
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
            {userData.photo ? (
              <Image
                source={{ uri: userData.photo }}
                style={styles.avatar}
                resizeMode='cover'
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
          <Text style={styles.userRole}>{formatUserRoles(userData)}</Text>
          <Text style={styles.userId}>ID: {userData.id || 'N/A'}</Text>
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

        {/* Roles Section */}
        {userData.roles && userData.roles.length > 0 && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>
              {t('rolesResponsibilities')}
            </Text>
            {userData.roles.map((role, index) => (
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
                    <Text style={styles.roleBranch}>{role.branch_name}</Text>
                  )}
                  {role.role_id && (
                    <Text style={styles.roleBranch}>ID: {role.role_id}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
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
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...theme.shadows.medium,
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
      ...theme.shadows.medium,
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
    profileSection: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      marginTop: 0,
      borderRadius: 16,
      padding: 20,
      ...theme.shadows.medium,
    },
    sectionTitle: {
      fontSize: fontSizes.sectionTitle,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
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
