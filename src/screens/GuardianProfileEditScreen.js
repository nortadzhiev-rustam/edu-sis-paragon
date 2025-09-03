/**
 * Guardian Profile Edit Screen
 * Allows guardians to edit their profile information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faSave,
  faUser,
  faPhone,
  faEnvelope,
  faIdCard,
  faMapMarkerAlt,
  faUserFriends,
  faCamera,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import guardianService from '../services/guardianService';
import guardianStorageService from '../services/guardianStorageService';
import * as ImagePicker from 'expo-image-picker';

const GuardianProfileEditScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { authCode, guardian, child } = route.params;

  const styles = createStyles(theme);

  // Form state
  const [formData, setFormData] = useState({
    name: guardian?.name || '',
    phone: guardian?.phone || '',
    email: guardian?.email || '',
    national_id: guardian?.national_id || '',
    emergency_contact: guardian?.emergency_contact || '',
    address: guardian?.address || '',
    relation: guardian?.relation || '',
  });

  // Photo state - check for existing guardian_photo first, then photo_url
  const [profilePhoto, setProfilePhoto] = useState(
    guardian?.guardian_photo_url || guardian?.photo_url || null
  );
  const [photoUploading, setPhotoUploading] = useState(false);
  const [hasNewPhoto, setHasNewPhoto] = useState(false); // Track if user uploaded a new photo

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }

    // Check for changes after state update
    checkForChanges();
  };

  // Check if there are any changes in form data or photo
  const checkForChanges = () => {
    const hasFormChanges = Object.keys(formData).some(
      (key) => formData[key] !== (guardian?.[key] || '')
    );
    // Check if photo has changed from the original
    const originalPhoto =
      guardian?.guardian_photo_url ||
      guardian?.guardian_photo ||
      guardian?.photo_url ||
      null;
    const hasPhotoChanges = hasNewPhoto || profilePhoto !== originalPhoto;
    setHasChanges(hasFormChanges || hasPhotoChanges);
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t('nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('nameTooShort');
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = t('phoneRequired');
    } else {
      const phoneRegex = /^[+]?[1-9]\d{0,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s-()]/g, ''))) {
        newErrors.phone = t('invalidPhoneFormat');
      }
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = t('invalidEmailFormat');
      }
    }

    // Relation validation
    if (!formData.relation.trim()) {
      newErrors.relation = t('relationRequired');
    }

    // National ID validation (optional but must be valid if provided)
    if (formData.national_id.trim()) {
      if (formData.national_id.trim().length < 5) {
        newErrors.national_id = t('nationalIdTooShort');
      }
    }

    // Emergency contact validation (optional but must be valid if provided)
    if (formData.emergency_contact.trim()) {
      const phoneRegex = /^[+]?[1-9]\d{0,15}$/;
      if (
        !phoneRegex.test(formData.emergency_contact.replace(/[\s-()]/g, ''))
      ) {
        newErrors.emergency_contact = t('invalidPhoneFormat');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('📝 PROFILE EDIT: Updating guardian profile...');
      console.log('📝 PROFILE EDIT: Form data:', formData);
      console.log('📝 PROFILE EDIT: Profile photo:', profilePhoto);

      // Include photo information in the update
      const profileUpdateData = {
        ...formData,
        // Include photo URL - either new photo or preserve existing one
        guardian_photo: hasNewPhoto
          ? profilePhoto
          : guardian?.guardian_photo_url ||
            guardian?.guardian_photo ||
            guardian?.photo_url ||
            profilePhoto,
      };

      const response = await guardianService.updateGuardianProfile(
        authCode,
        profileUpdateData
      );

      if (response.success) {
        console.log('✅ PROFILE EDIT: Profile updated successfully');
        console.log(
          '✅ PROFILE EDIT: Updated guardian data:',
          response.guardian
        );

        // Use the complete guardian data from the response
        const updatedGuardian = response.guardian || {
          ...guardian,
          ...profileUpdateData,
          // Ensure photo is included
          photo_url: profilePhoto || guardian?.photo_url,
          guardian_photo: profilePhoto || guardian?.guardian_photo,
        };

        // Update stored guardian data
        const updateStorageSuccess =
          await guardianStorageService.updateStoredGuardianData(
            updatedGuardian
          );

        if (updateStorageSuccess) {
          console.log(
            '✅ PROFILE EDIT: Stored guardian data updated successfully'
          );
        } else {
          console.warn(
            '⚠️ PROFILE EDIT: Failed to update stored guardian data'
          );
        }

        // Show success message with photo confirmation if new photo was uploaded
        const successMessage = hasNewPhoto
          ? t('profileAndPhotoUpdatedSuccessfully')
          : response.message || t('profileUpdatedSuccessfully');

        Alert.alert(t('success'), successMessage, [
          {
            text: t('ok'),
            onPress: () => {
              // Navigate back to dashboard with updated data
              navigation.navigate('GuardianDashboard', {
                authCode,
                guardian: updatedGuardian,
                child,
              });
            },
          },
        ]);
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('❌ PROFILE EDIT: Error updating profile:', error);

      let errorMessage = t('failedToUpdateProfile');

      // Handle different types of errors
      if (error.message) {
        if (error.message.includes('Network')) {
          errorMessage = t('networkError');
        } else if (error.message.includes('timeout')) {
          errorMessage = t('requestTimeout');
        } else if (
          error.message.includes('401') ||
          error.message.includes('unauthorized')
        ) {
          errorMessage = t('sessionExpired');
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert(t('error'), errorMessage, [
        {
          text: t('tryAgain'),
          onPress: () => handleSave(),
        },
        {
          text: t('cancel'),
          style: 'cancel',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(t('unsavedChanges'), t('unsavedChangesMessage'), [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('discard'),
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  // Photo upload functions
  const handlePhotoUpload = () => {
    Alert.alert(t('selectPhoto'), t('choosePhotoSource'), [
      {
        text: t('camera'),
        onPress: handleCamera,
      },
      {
        text: t('gallery'),
        onPress: handleGallery,
      },
      {
        text: t('cancel'),
        style: 'cancel',
      },
    ]);
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permissionRequired'), t('cameraPermissionRequired'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(t('error'), t('failedToTakePhoto'));
    }
  };

  const handleGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permissionRequired'), t('galleryPermissionRequired'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert(t('error'), t('failedToSelectPhoto'));
    }
  };

  const uploadPhoto = async (photo) => {
    try {
      setPhotoUploading(true);

      const response = await guardianService.uploadGuardianPhoto(authCode, {
        uri: photo.uri,
        type: photo.mimeType || 'image/jpeg',
        fileName: photo.fileName || 'guardian_photo.jpg',
      });

      if (response.success) {
        setProfilePhoto(response.photo_url);
        setHasNewPhoto(true); // Mark that user uploaded a new photo
        // Check for changes after photo upload
        setTimeout(checkForChanges, 100); // Small delay to ensure state is updated
        // Don't show success message here - will show when profile is saved
        console.log('✅ Photo uploaded successfully, ready to save profile');
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert(t('error'), t('failedToUploadPhoto'));
    } finally {
      setPhotoUploading(false);
    }
  };

  const renderFormField = (
    field,
    icon,
    placeholder,
    keyboardType = 'default',
    multiline = false
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <FontAwesomeIcon icon={icon} size={16} color={theme.colors.primary} />
        <Text style={styles.fieldLabel}>{placeholder}</Text>
      </View>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          errors[field] && styles.textInputError,
        ]}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        <View style={styles.navigationHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={20}
                color={theme.colors.headerText}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('editProfile')}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                loading && styles.saveButtonDisabled,
                !hasChanges && styles.saveButtonInactive,
              ]}
              onPress={handleSave}
              disabled={loading || !hasChanges}
            >
              {loading ? (
                <ActivityIndicator
                  size='small'
                  color={theme.colors.headerText}
                />
              ) : (
                <FontAwesomeIcon
                  icon={faSave}
                  size={18}
                  color={
                    hasChanges
                      ? theme.colors.headerText
                      : theme.colors.textSecondary
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Child Info */}
        <View style={styles.childInfoSection}>
          <Text style={styles.sectionTitle}>{t('authorizedFor')}</Text>
          <View style={styles.childCard}>
            <Text style={styles.childName}>{child?.name}</Text>
            <Text style={styles.childDetails}>
              {t('studentId')}: {child?.student_id}
            </Text>
          </View>
        </View>

        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>{t('profilePhoto')}</Text>
          <View style={styles.photoContainer}>
            <TouchableOpacity
              style={styles.photoUploadButton}
              onPress={handlePhotoUpload}
              disabled={photoUploading}
            >
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <FontAwesomeIcon
                    icon={faCamera}
                    size={32}
                    color={theme.colors.textSecondary}
                  />
                </View>
              )}
              {photoUploading && (
                <View style={styles.photoUploadOverlay}>
                  <ActivityIndicator
                    size='small'
                    color={theme.colors.primary}
                  />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handlePhotoUpload}
              disabled={photoUploading}
            >
              <FontAwesomeIcon
                icon={faImage}
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.changePhotoText}>
                {profilePhoto ? t('changePhoto') : t('addPhoto')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t('guardianInformation')}</Text>

          {renderFormField('name', faUser, t('fullName'))}
          {renderFormField('relation', faUserFriends, t('relationToChild'))}
          {renderFormField('phone', faPhone, t('phoneNumber'), 'phone-pad')}
          {renderFormField(
            'email',
            faEnvelope,
            t('emailAddress'),
            'email-address'
          )}
          {renderFormField('national_id', faIdCard, t('nationalId'))}
          {renderFormField(
            'emergency_contact',
            faPhone,
            t('emergencyContact'),
            'phone-pad'
          )}
          {renderFormField(
            'address',
            faMapMarkerAlt,
            t('address'),
            'default',
            true
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButtonLarge,
            loading && styles.saveButtonDisabled,
            !hasChanges && styles.saveButtonInactive,
          ]}
          onPress={handleSave}
          disabled={loading || !hasChanges}
        >
          {loading ? (
            <ActivityIndicator size='small' color={theme.colors.headerText} />
          ) : (
            <>
              <FontAwesomeIcon
                icon={faSave}
                size={20}
                color={
                  hasChanges
                    ? theme.colors.headerText
                    : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.saveButtonText,
                  !hasChanges && styles.saveButtonTextInactive,
                ]}
              >
                {hasChanges ? t('saveChanges') : t('noChangesToSave')}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
      overflow: 'hidden',
      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.headerText,
      marginLeft: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    saveButtonInactive: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    childInfoSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    childCard: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    childName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    childDetails: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    formSection: {
      marginBottom: 24,
    },
    fieldContainer: {
      marginBottom: 16,
    },
    fieldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginLeft: 8,
    },
    textInput: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    textInputMultiline: {
      height: 80,
      textAlignVertical: 'top',
    },
    textInputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 4,
    },
    saveButtonLarge: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 16,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.headerText,
      marginLeft: 8,
    },
    saveButtonTextInactive: {
      color: theme.colors.textSecondary,
    },

    // Photo Section Styles
    photoSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    photoContainer: {
      alignItems: 'center',
      marginTop: 16,
    },
    photoUploadButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.background,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      position: 'relative',
    },
    profileImage: {
      width: 116,
      height: 116,
      borderRadius: 58,
    },
    photoPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoUploadOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    changePhotoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 20,
    },
    changePhotoText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
      marginLeft: 8,
    },
  });

export default GuardianProfileEditScreen;
