/**
 * StudentProfileEditScreen
 *
 * Screen for editing student profile information including personal details,
 * photo upload, and profile completeness tracking
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
  faUserFriends,
} from '@fortawesome/free-solid-svg-icons';

// Import components
import ProfileFormField from '../components/ProfileFormField';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import ProfileCompletenessIndicator from '../components/ProfileCompletenessIndicator';

// Import services
import profileService from '../services/profileService';
import { getUserData, saveUserData } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StudentProfileEditScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // User data
  const [userData, setUserData] = useState(null);
  const [authCode, setAuthCode] = useState(null);

  // Form data - Student specific fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    emergency_contact: '',
    emergency_phone: '',
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [completenessData, setCompletenessData] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      console.log('👤 STUDENT PROFILE EDIT: Loading user data...');

      // Get current user data
      const currentUserData = await getUserData('student', AsyncStorage);
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
      console.error('❌ STUDENT PROFILE EDIT: Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileData = async (authCode) => {
    try {
      console.log('📊 STUDENT PROFILE EDIT: Loading profile data...');

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
          date_of_birth: profile.date_of_birth || '',
          gender: profile.gender || '',
          emergency_contact: profile.emergency_contact || '',
          emergency_phone: profile.emergency_phone || '',
        });
        setProfilePhoto(profile.profile_photo);
        console.log('✅ STUDENT PROFILE EDIT: Profile data loaded');
      } else {
        console.warn('⚠️ STUDENT PROFILE EDIT: Failed to load profile data');
        // Use existing user data as fallback
        setFormData({
          name: userData?.name || '',
          email: userData?.email || '',
          phone: userData?.mobile_phone || '',
          address: '',
          date_of_birth: '',
          gender: '',
          emergency_contact: '',
          emergency_phone: '',
        });
        setProfilePhoto(userData?.photo);
      }

      // Handle completeness data
      if (
        completenessResponse.status === 'fulfilled' &&
        completenessResponse.value.success
      ) {
        setCompletenessData(completenessResponse.value.data);
        console.log('✅ STUDENT PROFILE EDIT: Completeness data loaded');
      }
    } catch (error) {
      console.error(
        '❌ STUDENT PROFILE EDIT: Error loading profile data:',
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
    const validation = profileService.validateProfileData(formData, 'student');
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
        emergency_contact: true,
        emergency_phone: true,
      });

      if (!validateForm()) {
        Alert.alert('Validation Error', 'Please fix the errors before saving.');
        return;
      }

      setSaving(true);
      console.log('💾 STUDENT PROFILE EDIT: Saving profile...');

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
            emergency_contact: formData.emergency_contact,
            emergency_phone: formData.emergency_phone,
          };
          await saveUserData(mergedUserData, AsyncStorage);
          setUserData(mergedUserData);
          console.log(
            '✅ STUDENT PROFILE EDIT: Persisted updated user data to AsyncStorage'
          );
        } catch (persistError) {
          console.warn(
            '⚠️ STUDENT PROFILE EDIT: Failed to persist updated user data:',
            persistError
          );
        }

        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to Student Profile screen
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
      console.error('❌ STUDENT PROFILE EDIT: Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelected = async (photo) => {
    try {
      setPhotoUploading(true);
      console.log('📸 STUDENT PROFILE EDIT: Uploading photo...');

      const response = await profileService.uploadProfilePhoto(authCode, photo);

      if (response.success) {
        setProfilePhoto(response.photo_url);

        try {
          const updatedUserData = {
            ...userData,
            photo: response.photo_url,
            profile_photo: response.photo_url,
            user_photo: response.photo_url,
            // Also update personal_info if it exists
            personal_info: userData.personal_info
              ? {
                  ...userData.personal_info,
                  profile_photo: response.photo_url,
                }
              : userData.personal_info,
          };
          await saveUserData(updatedUserData, AsyncStorage);
          console.log(
            '✅ STUDENT PROFILE EDIT: Updated photo in AsyncStorage with all photo fields'
          );
        } catch (storageError) {
          console.warn(
            '⚠️ STUDENT PROFILE EDIT: Failed to update AsyncStorage:',
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
      console.error('❌ STUDENT PROFILE EDIT: Error uploading photo:', error);
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
        user_photo: null,
        // Also update personal_info if it exists
        personal_info: userData.personal_info
          ? {
              ...userData.personal_info,
              profile_photo: null,
            }
          : userData.personal_info,
      };
      await saveUserData(updatedUserData, AsyncStorage);
      console.log(
        '✅ STUDENT PROFILE EDIT: Removed photo from AsyncStorage with all photo fields'
      );
    } catch (storageError) {
      console.warn(
        '⚠️ STUDENT PROFILE EDIT: Failed to update AsyncStorage:',
        storageError
      );
    }

    Alert.alert('Success', 'Profile photo removed successfully!');
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
      emergency_contact: 'emergency_contact',
      emergency_phone: 'emergency_phone',
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
            label='Date of Birth'
            value={formData.date_of_birth}
            onChangeText={(value) => handleInputChange('date_of_birth', value)}
            onBlur={() => handleInputBlur('date_of_birth')}
            placeholder='YYYY-MM-DD'
            icon={faCalendarAlt}
            error={touched.date_of_birth ? errors.date_of_birth : null}
            theme={theme}
            required
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

        {/* Emergency Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          <ProfileFormField
            label='Emergency Contact Name'
            value={formData.emergency_contact}
            onChangeText={(value) =>
              handleInputChange('emergency_contact', value)
            }
            onBlur={() => handleInputBlur('emergency_contact')}
            placeholder='Enter emergency contact name'
            icon={faUserFriends}
            error={touched.emergency_contact ? errors.emergency_contact : null}
            theme={theme}
            maxLength={255}
            required
          />

          <ProfileFormField
            label='Emergency Contact Phone'
            value={formData.emergency_phone}
            onChangeText={(value) =>
              handleInputChange('emergency_phone', value)
            }
            onBlur={() => handleInputBlur('emergency_phone')}
            placeholder='Enter emergency contact phone'
            icon={faPhone}
            keyboardType='phone-pad'
            error={touched.emergency_phone ? errors.emergency_phone : null}
            theme={theme}
            maxLength={20}
            required
          />
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
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

export default StudentProfileEditScreen;
