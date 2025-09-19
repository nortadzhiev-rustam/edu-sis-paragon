/**
 * ParentProfileEditScreen
 *
 * Screen for editing parent profile information including personal details,
 * photo upload, password change, and profile completeness tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faSave,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faKey,
} from '@fortawesome/free-solid-svg-icons';

// Import components
import ProfileFormField from '../components/ProfileFormField';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import PasswordChangeForm from '../components/PasswordChangeForm';
import ProfileCompletenessIndicator from '../components/ProfileCompletenessIndicator';

// Import services
import profileService from '../services/profileService';
import { getUserData, saveUserData } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ParentProfileEditScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);

  // User data
  const [userData, setUserData] = useState(null);
  const [authCode, setAuthCode] = useState(null);

  // Form data - Parent specific fields (simpler than student)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [completenessData, setCompletenessData] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      console.log('👤 PARENT PROFILE EDIT: Loading user data...');

      // Get current user data
      const currentUserData = await getUserData('parent', AsyncStorage);
      if (!currentUserData || !currentUserData.authCode) {
        Alert.alert('Error', 'Unable to load user data. Please login again.');
        navigation.goBack();
        return;
      }

      setUserData(currentUserData);
      setAuthCode(currentUserData.authCode);

      // Load profile data from API
      await loadProfileData(currentUserData.authCode);
    } catch (error) {
      console.error('❌ PARENT PROFILE EDIT: Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileData = async (authCode) => {
    try {
      console.log('📊 PARENT PROFILE EDIT: Loading profile data...');

      // Load profile and completeness data in parallel
      const [profileResponse, completenessResponse] = await Promise.allSettled([
        profileService.getProfile(authCode),
        profileService.getProfileCompleteness(authCode),
      ]);

      // Handle profile data
      if (
        profileResponse.status === 'fulfilled' &&
        profileResponse.value.success
      ) {
        const profile = profileResponse.value.data;
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
        });
        setProfilePhoto(profile.profile_photo);
        console.log('✅ PARENT PROFILE EDIT: Profile data loaded');
      } else {
        console.warn('⚠️ PARENT PROFILE EDIT: Failed to load profile data');
        // Use existing user data as fallback
        setFormData({
          name: userData?.name || '',
          email: userData?.email || '',
          phone: userData?.mobile_phone || '',
          address: '',
        });
        setProfilePhoto(userData?.photo);
      }

      // Handle completeness data
      if (
        completenessResponse.status === 'fulfilled' &&
        completenessResponse.value.success
      ) {
        setCompletenessData(completenessResponse.value.data);
        console.log('✅ PARENT PROFILE EDIT: Completeness data loaded');
      }
    } catch (error) {
      console.error(
        '❌ PARENT PROFILE EDIT: Error loading profile data:',
        error
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData(authCode);
    setRefreshing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleInputBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const validateForm = () => {
    const validation = profileService.validateProfileData(formData, 'parent');
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSave = async () => {
    try {
      // Mark all fields as touched
      setTouched({
        name: true,
        email: true,
        phone: true,
        address: true,
      });

      if (!validateForm()) {
        Alert.alert('Validation Error', 'Please fix the errors before saving.');
        return;
      }

      setSaving(true);
      console.log('💾 PARENT PROFILE EDIT: Saving profile...');

      const response = await profileService.updateProfile(authCode, formData);

      if (response.success) {
        // Persist updated fields to AsyncStorage so other screens see changes immediately
        try {
          const mergedUserData = {
            ...userData,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            mobile_phone: formData.phone,
            address: formData.address,
            // Preserve current photo data in all possible field locations
            photo: profilePhoto || userData.photo,
            profile_photo: profilePhoto || userData.profile_photo,
            parent_photo: profilePhoto || userData.parent_photo,
            user_photo: profilePhoto || userData.user_photo,
            // Also update parent_info if it exists
            parent_info: userData.parent_info
              ? {
                  ...userData.parent_info,
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  address: formData.address,
                  photo: profilePhoto || userData.parent_info.photo,
                  parent_photo:
                    profilePhoto || userData.parent_info.parent_photo,
                  user_photo: profilePhoto || userData.parent_info.user_photo,
                }
              : userData.parent_info,
          };
          await saveUserData(mergedUserData, AsyncStorage);
          setUserData(mergedUserData);
          console.log(
            '✅ PARENT PROFILE EDIT: Persisted updated user data to AsyncStorage with all photo fields'
          );
        } catch (persistError) {
          console.warn(
            '⚠️ PARENT PROFILE EDIT: Failed to persist updated user data:',
            persistError
          );
        }

        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to Parent Profile screen
              navigation.goBack();
            },
          },
        ]);
      } else {
        if (response.errors) {
          setErrors(response.errors);
          Alert.alert(
            'Validation Error',
            'Please fix the errors and try again.'
          );
        } else {
          Alert.alert('Error', response.message || 'Failed to update profile.');
        }
      }
    } catch (error) {
      console.error('❌ PARENT PROFILE EDIT: Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelected = async (photo) => {
    try {
      setPhotoUploading(true);
      console.log('📸 PARENT PROFILE EDIT: Uploading photo...');

      const response = await profileService.uploadProfilePhoto(authCode, photo);

      if (response.success) {
        setProfilePhoto(response.photo_url);

        try {
          const updatedUserData = {
            ...userData,
            photo: response.photo_url,
            profile_photo: response.photo_url,
            parent_photo: response.photo_url,
            user_photo: response.photo_url,
            // Also update parent_info if it exists
            parent_info: userData.parent_info
              ? {
                  ...userData.parent_info,
                  photo: response.photo_url,
                  parent_photo: response.photo_url,
                  user_photo: response.photo_url,
                }
              : userData.parent_info,
          };
          await saveUserData(updatedUserData, AsyncStorage);
          console.log(
            '✅ PARENT PROFILE EDIT: Updated photo in AsyncStorage with all possible field names'
          );
        } catch (storageError) {
          console.warn(
            '⚠️ PARENT PROFILE EDIT: Failed to update AsyncStorage:',
            storageError
          );
        }

        Alert.alert('Success', 'Profile photo updated successfully!');
        // Refresh completeness data
        loadProfileData(authCode);
      } else {
        Alert.alert('Error', response.error || 'Failed to upload photo.');
      }
    } catch (error) {
      console.error('❌ PARENT PROFILE EDIT: Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemoved = async () => {
    setProfilePhoto(null);

    try {
      const updatedUserData = {
        ...userData,
        photo: null,
        profile_photo: null,
        parent_photo: null,
        user_photo: null,
        // Also update parent_info if it exists
        parent_info: userData.parent_info
          ? {
              ...userData.parent_info,
              photo: null,
              parent_photo: null,
              user_photo: null,
            }
          : userData.parent_info,
      };
      await saveUserData(updatedUserData, AsyncStorage);
      console.log(
        '✅ PARENT PROFILE EDIT: Removed photo from AsyncStorage with all possible field names'
      );
    } catch (storageError) {
      console.warn(
        '⚠️ PARENT PROFILE EDIT: Failed to update AsyncStorage:',
        storageError
      );
    }

    Alert.alert('Success', 'Profile photo removed successfully!');
  };

  const handlePasswordChange = async (
    currentPassword,
    newPassword,
    confirmPassword
  ) => {
    try {
      setPasswordChanging(true);
      console.log('🔐 PARENT PROFILE EDIT: Changing password...');

      const response = await profileService.changePassword(
        authCode,
        currentPassword,
        newPassword,
        confirmPassword
      );

      if (response.success) {
        Alert.alert('Success', 'Password changed successfully!', [
          {
            text: 'OK',
            onPress: () => setShowPasswordForm(false),
          },
        ]);
      } else {
        if (response.errors) {
          // Handle validation errors in the password form component
          Alert.alert(
            'Error',
            Object.values(response.errors).flat().join('\n')
          );
        } else {
          Alert.alert(
            'Error',
            response.message || 'Failed to change password.'
          );
        }
      }
    } catch (error) {
      console.error('❌ PARENT PROFILE EDIT: Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleCompletenessFieldPress = (fieldName) => {
    if (fieldName === 'overview') {
      // Scroll to top to show completeness indicator
      return;
    }

    // Focus on specific field based on fieldName
    const fieldMap = {
      name: 'name',
      email: 'email',
      phone: 'phone',
      address: 'address',
      profile_photo: 'photo',
    };

    const targetField = fieldMap[fieldName];
    if (targetField === 'photo') {
      // Trigger photo upload
      handlePhotoSelected();
    } else if (targetField) {
      // You could implement field focusing here
      Alert.alert(
        'Info',
        `Please update your ${fieldName.replace(/_/g, ' ')}.`
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size='small' color={theme.colors.primary} />
          ) : (
            <FontAwesomeIcon
              icon={faSave}
              size={20}
              color={theme.colors.primary}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Profile Completeness Indicator */}
        {completenessData && (
          <ProfileCompletenessIndicator
            completenessData={completenessData}
            onFieldPress={handleCompletenessFieldPress}
            theme={theme}
            style={styles.completenessIndicator}
          />
        )}

        {/* Profile Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <ProfilePhotoUpload
            currentPhoto={profilePhoto}
            onPhotoSelected={handlePhotoSelected}
            onPhotoRemoved={handlePhotoRemoved}
            uploading={photoUploading}
            theme={theme}
            size='large'
          />
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <ProfileFormField
            label='Full Name'
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            onBlur={() => handleInputBlur('name')}
            placeholder='Enter your full name'
            icon={faUser}
            error={touched.name ? errors.name : null}
            theme={theme}
            maxLength={255}
            required
          />

          <ProfileFormField
            label='Email Address'
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            onBlur={() => handleInputBlur('email')}
            placeholder='Enter your email address'
            icon={faEnvelope}
            keyboardType='email-address'
            error={touched.email ? errors.email : null}
            theme={theme}
            maxLength={255}
            required
          />

          <ProfileFormField
            label='Phone Number'
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            onBlur={() => handleInputBlur('phone')}
            placeholder='Enter your phone number'
            icon={faPhone}
            keyboardType='phone-pad'
            error={touched.phone ? errors.phone : null}
            theme={theme}
            maxLength={20}
            required
          />

          <ProfileFormField
            label='Address'
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            onBlur={() => handleInputBlur('address')}
            placeholder='Enter your address'
            icon={faMapMarkerAlt}
            multiline={true}
            error={touched.address ? errors.address : null}
            theme={theme}
            maxLength={500}
            required
          />
        </View>

        {/* Password Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Security</Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowPasswordForm(!showPasswordForm)}
            >
              <FontAwesomeIcon
                icon={faKey}
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.toggleButtonText}>
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPasswordForm && (
            <PasswordChangeForm
              onPasswordChange={handlePasswordChange}
              loading={passwordChanging}
              theme={theme}
            />
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButtonLarge, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size='small' color={theme.colors.surface} />
          ) : (
            <>
              <FontAwesomeIcon
                icon={faSave}
                size={16}
                color={theme.colors.surface}
                style={styles.saveButtonIcon}
              />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textLight,
      marginTop: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      borderRadius: 16,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.headerText,
      flex: 1,
      textAlign: 'center',
    },
    saveButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    completenessIndicator: {
      marginTop: 16,
    },
    section: {
      marginTop: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.primary + '15',
      borderRadius: 6,
    },
    toggleButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: 6,
    },
    saveButtonLarge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 32,
    },
    saveButtonDisabled: {
      backgroundColor: theme.colors.disabled,
    },
    saveButtonIcon: {
      marginRight: 8,
    },
    saveButtonText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    bottomSpacing: {
      height: 32,
    },
  });

export default ParentProfileEditScreen;
