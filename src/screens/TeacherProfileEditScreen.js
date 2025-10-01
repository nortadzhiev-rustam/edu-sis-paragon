/**
 * TeacherProfileEditScreen
 *
 * Screen for editing teacher profile information including personal details,
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
  faCalendarAlt,
  faVenusMars,
  faKey,
  faChartLine,
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

const TeacherProfileEditScreen = ({ navigation, route }) => {
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

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [initialPhotoLoaded, setInitialPhotoLoaded] = useState(false);
  const [completenessData, setCompletenessData] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Load initial photo as soon as possible
  useEffect(() => {
    const loadInitialPhoto = async () => {
      try {
        const cachedUserData = await getUserData('teacher', AsyncStorage);
        const existingPhoto =
          cachedUserData?.photo || cachedUserData?.profile_photo;
        if (existingPhoto && !initialPhotoLoaded) {
          console.log(
            '🚀 TEACHER PROFILE EDIT: Setting initial photo from useEffect:',
            existingPhoto
          );
          setProfilePhoto(existingPhoto);
          setInitialPhotoLoaded(true);
        }
      } catch (error) {
        console.log(
          '⚠️ TEACHER PROFILE EDIT: Could not load initial photo in useEffect'
        );
      }
    };

    loadInitialPhoto();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      console.log('👤 TEACHER PROFILE EDIT: Loading user data...');

      // Get current user data
      const currentUserData = await getUserData('teacher', AsyncStorage);
      console.log('📋 TEACHER PROFILE EDIT: Current user data:', {
        name: currentUserData?.name,
        email: currentUserData?.email,
        photo: currentUserData?.photo,
        profile_photo: currentUserData?.profile_photo,
        hasAuthCode: !!currentUserData?.authCode,
      });

      if (!currentUserData?.authCode) {
        Alert.alert('Error', 'Unable to load user data. Please login again.');
        navigation.goBack();
        return;
      }

      setUserData(currentUserData);
      setAuthCode(currentUserData.authCode);

      // Set photo IMMEDIATELY from existing user data
      const existingPhoto =
        currentUserData.photo || currentUserData.profile_photo;
      if (existingPhoto) {
        setProfilePhoto(existingPhoto);
        setInitialPhotoLoaded(true);
        console.log(
          '📸 TEACHER PROFILE EDIT: Set initial photo immediately:',
          existingPhoto
        );
      }

      // Set form data from existing user data
      setFormData({
        name: currentUserData.name || '',
        email: currentUserData.email || '',
        phone: currentUserData.mobile_phone || currentUserData.phone || '',
        address: currentUserData.address || '',
        date_of_birth: currentUserData.date_of_birth || '',
        gender: currentUserData.gender || '',
      });

      console.log(
        '📸 TEACHER PROFILE EDIT: Form and photo state set, photo should be visible now'
      );

      // Load additional profile data from API (for completeness tracking)
      await loadProfileData(currentUserData.authCode);
    } catch (error) {
      console.error('❌ TEACHER PROFILE EDIT: Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileData = async (authCode) => {
    try {
      console.log('📊 TEACHER PROFILE EDIT: Loading profile data...');

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

        // Update form data with API data, but keep existing values if API doesn't provide them
        setFormData((prevData) => ({
          name: profile.name || prevData.name,
          email: profile.email || prevData.email,
          phone: profile.phone || prevData.phone,
          address: profile.address || prevData.address,
          date_of_birth: profile.date_of_birth || prevData.date_of_birth,
          gender: profile.gender || prevData.gender,
        }));

        // Only update photo if API provides one and we haven't already loaded initial photo
        if (profile.profile_photo && !initialPhotoLoaded) {
          setProfilePhoto(profile.profile_photo);
          console.log(
            '📸 TEACHER PROFILE EDIT: Updated photo from API:',
            profile.profile_photo
          );
        } else {
          console.log(
            '📸 TEACHER PROFILE EDIT: Keeping existing photo (initial photo loaded):',
            profilePhoto
          );
        }

        console.log('✅ TEACHER PROFILE EDIT: Profile data loaded from API');
      } else {
        console.warn(
          '⚠️ TEACHER PROFILE EDIT: API call failed, using existing user data'
        );
      }

      // Handle completeness data
      if (
        completenessResponse.status === 'fulfilled' &&
        completenessResponse.value.success
      ) {
        setCompletenessData(completenessResponse.value.data);
        console.log('✅ TEACHER PROFILE EDIT: Completeness data loaded');
      }
    } catch (error) {
      console.error(
        '❌ TEACHER PROFILE EDIT: Error loading profile data:',
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
    const validation = profileService.validateProfileData(formData, 'teacher');
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
        date_of_birth: true,
        gender: true,
      });

      if (!validateForm()) {
        Alert.alert('Validation Error', 'Please fix the errors before saving.');
        return;
      }

      setSaving(true);
      console.log('💾 TEACHER PROFILE EDIT: Saving profile...');

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
            date_of_birth: formData.date_of_birth,
            gender: formData.gender,
          };
          await saveUserData(mergedUserData, AsyncStorage);
          setUserData(mergedUserData);
          console.log(
            '✅ TEACHER PROFILE EDIT: Persisted updated user data to AsyncStorage'
          );
        } catch (persistError) {
          console.warn(
            '⚠️ TEACHER PROFILE EDIT: Failed to persist updated user data:',
            persistError
          );
        }

        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to Teacher Profile screen
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
      console.error('❌ TEACHER PROFILE EDIT: Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelected = async (photo) => {
    try {
      setPhotoUploading(true);
      console.log('📸 TEACHER PROFILE EDIT: Uploading photo...');

      const response = await profileService.uploadProfilePhoto(authCode, photo);

      if (response.success) {
        setProfilePhoto(response.photo_url);

        // Update the userData in AsyncStorage so other screens can see the new photo
        try {
          const updatedUserData = {
            ...userData,
            photo: response.photo_url,
            profile_photo: response.photo_url,
            user_photo: response.photo_url,
          };
          await saveUserData(updatedUserData, AsyncStorage);
          console.log(
            '✅ TEACHER PROFILE EDIT: Updated photo in AsyncStorage with all photo fields'
          );
        } catch (storageError) {
          console.warn(
            '⚠️ TEACHER PROFILE EDIT: Failed to update AsyncStorage:',
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
      console.error('❌ TEACHER PROFILE EDIT: Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemoved = async () => {
    setProfilePhoto(null);

    // Update the userData in AsyncStorage to remove the photo
    try {
      const updatedUserData = {
        ...userData,
        photo: null,
        profile_photo: null,
        user_photo: null,
      };
      await saveUserData(updatedUserData, AsyncStorage);
      console.log(
        '✅ TEACHER PROFILE EDIT: Removed photo from AsyncStorage with all photo fields'
      );
    } catch (storageError) {
      console.warn(
        '⚠️ TEACHER PROFILE EDIT: Failed to update AsyncStorage:',
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
      console.log('🔐 TEACHER PROFILE EDIT: Changing password...');

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
      console.error('❌ TEACHER PROFILE EDIT: Error changing password:', error);
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
      date_of_birth: 'date_of_birth',
      gender: 'gender',
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
            editable={false}
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
          />

          <ProfileFormField
            label='Date of Birth'
            value={formData.date_of_birth}
            onChangeText={(value) => handleInputChange('date_of_birth', value)}
            onBlur={() => handleInputBlur('date_of_birth')}
            placeholder='YYYY-MM-DD'
            icon={faCalendarAlt}
            error={touched.date_of_birth ? errors.date_of_birth : null}
            theme={theme}
          />

          <ProfileFormField
            label='Gender'
            value={formData.gender}
            onChangeText={(value) => handleInputChange('gender', value)}
            onBlur={() => handleInputBlur('gender')}
            placeholder='male, female, or other'
            icon={faVenusMars}
            error={touched.gender ? errors.gender : null}
            theme={theme}
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

export default TeacherProfileEditScreen;
