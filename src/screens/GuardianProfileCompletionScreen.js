/**
 * Guardian Profile Completion Screen
 * Required form for first-time guardian login
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CommonButton } from '../components';
import guardianService from '../services/guardianService';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCamera, faImage, faUser } from '@fortawesome/free-solid-svg-icons';

const GuardianProfileCompletionScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { authCode, guardian, child } = route.params;

  const [formData, setFormData] = useState({
    email: guardian?.email || '',
    national_id: guardian?.national_id || '',
    emergency_contact: guardian?.emergency_contact || '',
    address: guardian?.address || '',
  });
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const styles = createStyles(theme);

  const validateForm = () => {
    const newErrors = {};

    // Check guardian basic info (should be available from route params)
    if (!guardian?.name?.trim()) {
      newErrors.guardian = t('guardianInfoMissing');
    }

    // Check if we have either guardian phone or emergency contact for phone field
    const hasPhoneNumber =
      guardian?.phone?.trim() || formData.emergency_contact?.trim();
    if (!hasPhoneNumber) {
      newErrors.emergency_contact = t('phoneOrEmergencyContactRequired');
    }

    if (!guardian?.relation?.trim()) {
      newErrors.guardian = t('guardianInfoMissing');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('invalidEmailFormat');
    }

    if (!formData.national_id.trim()) {
      newErrors.national_id = t('nationalIdRequired');
    }

    if (!formData.emergency_contact.trim()) {
      newErrors.emergency_contact = t('emergencyContactRequired');
    }

    if (!formData.address.trim()) {
      newErrors.address = t('addressRequired');
    } else if (formData.address.trim().length < 10) {
      newErrors.address = t('addressTooShort');
    }

    if (!photo) {
      newErrors.photo = t('photoRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(t('selectPhoto'), t('choosePhotoSource'), [
      { text: t('camera'), onPress: openCamera },
      { text: t('gallery'), onPress: openGallery },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const openCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('error'), t('cameraPermissionRequired'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0]);
        if (errors.photo) {
          setErrors((prev) => ({ ...prev, photo: null }));
        }
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert(t('error'), t('failedToOpenCamera'));
    }
  };

  const openGallery = async () => {
    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('error'), t('galleryPermissionRequired'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0]);
        if (errors.photo) {
          setErrors((prev) => ({ ...prev, photo: null }));
        }
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert(t('error'), t('failedToOpenGallery'));
    }
  };

  const uploadPhoto = async () => {
    if (!photo) return null;

    setUploadingPhoto(true);
    try {
      const response = await guardianService.uploadGuardianPhoto(
        authCode,
        photo,
        guardian?.qr_token // Pass the guardian's qr_token
      );
      return response.success ? response.photo_path : null;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(t('validationError'), t('pleaseFixErrors'));
      return;
    }

    setLoading(true);

    try {
      // Upload photo first if provided
      let photoPath = null;
      if (photo) {
        photoPath = await uploadPhoto();
        if (!photoPath) {
          throw new Error('Failed to upload photo');
        }
      }

      // Complete profile - include all required fields
      // Use emergency contact as phone if guardian phone is not available
      const phoneNumber =
        guardian?.phone?.trim() || formData.emergency_contact?.trim();

      console.log(
        '📞 PROFILE COMPLETION: Phone logic - Guardian phone:',
        guardian?.phone,
        'Emergency contact:',
        formData.emergency_contact,
        'Using phone:',
        phoneNumber
      );

      const profileSubmissionData = {
        name: guardian?.name,
        phone: phoneNumber,
        relation: guardian?.relation,
        qr_token: guardian?.qr_token, // Include qr_token in profile completion
        ...formData,
        photo_path: photoPath,
      };

      console.log(
        '📝 PROFILE COMPLETION: Submitting data:',
        profileSubmissionData
      );
      console.log(
        '📝 PROFILE COMPLETION: QR Token being sent:',
        guardian?.qr_token ? 'available' : 'not available'
      );
      const response = await guardianService.completeGuardianProfile(
        authCode,
        profileSubmissionData
      );

      if (response.success) {
        Alert.alert(t('success'), t('profileCompletedSuccessfully'), [
          {
            text: t('continue'),
            onPress: () => {
              // Navigate to main guardian dashboard
              navigation.replace('GuardianDashboard', {
                authCode,
                guardian: response.guardian,
                child,
              });
            },
          },
        ]);
      } else {
        Alert.alert(
          t('error'),
          response.message || t('failedToCompleteProfile')
        );
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      Alert.alert(t('error'), t('failedToCompleteProfile'));
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (label, field, placeholder, options = {}) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, errors[field] && styles.textInputError]}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        {...options}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderPhotoSection = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{t('guardianPhoto')} *</Text>

      <TouchableOpacity
        style={[
          styles.photoContainer,
          errors.photo && styles.photoContainerError,
        ]}
        onPress={showPhotoOptions}
      >
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <FontAwesomeIcon
              icon={faUser}
              size={40}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.photoPlaceholderText}>
              {t('tapToAddPhoto')}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}

      <View style={styles.photoActions}>
        <TouchableOpacity style={styles.photoActionButton} onPress={openCamera}>
          <FontAwesomeIcon
            icon={faCamera}
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.photoActionText}>{t('camera')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.photoActionButton}
          onPress={openGallery}
        >
          <FontAwesomeIcon
            icon={faImage}
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.photoActionText}>{t('gallery')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Compact Header */}
        <View style={styles.compactHeaderContainer}>
          <View style={styles.navigationHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{t('completeYourProfile')}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
        >
          {/* Guardian Info */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>{t('guardianInformation')}</Text>
            <Text style={styles.infoText}>
              {t('name')}: {guardian?.name}
            </Text>
            <Text style={styles.infoText}>
              {t('phone')}: {guardian?.phone || t('willUseEmergencyContact')}
            </Text>
            <Text style={styles.infoText}>
              {t('relation')}: {guardian?.relation}
            </Text>
            <Text style={styles.infoText}>
              {t('childName')}: {child?.name}
            </Text>
            {errors.guardian && (
              <Text style={styles.errorText}>{errors.guardian}</Text>
            )}
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>
              {t('additionalInformation')}
            </Text>

            {renderFormField(
              t('emailAddress') + ' *',
              'email',
              t('enterEmailAddress'),
              {
                keyboardType: 'email-address',
                autoCapitalize: 'none',
                autoCorrect: false,
              }
            )}

            {renderFormField(
              t('nationalIdPassport') + ' *',
              'national_id',
              t('enterNationalId'),
              {
                autoCapitalize: 'characters',
              }
            )}

            {renderFormField(
              t('emergencyContact') +
                ' *' +
                (!guardian?.phone ? ` (${t('willBeUsedAsPhone')})` : ''),
              'emergency_contact',
              t('enterEmergencyContact'),
              {
                keyboardType: 'phone-pad',
              }
            )}

            {renderFormField(
              t('fullAddress') + ' *',
              'address',
              t('enterFullAddress'),
              {
                multiline: true,
                numberOfLines: 3,
                textAlignVertical: 'top',
              }
            )}

            {renderPhotoSection()}
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <CommonButton
              title={
                loading || uploadingPhoto
                  ? t('completing')
                  : t('completeProfile')
              }
              onPress={handleSubmit}
              disabled={loading || uploadingPhoto}
              loading={loading || uploadingPhoto}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    flex: {
      flex: 1,
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
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.headerText,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    infoSection: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    formContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    fieldContainer: {
      marginBottom: 20,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    textInputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginTop: 4,
    },
    photoContainer: {
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 12,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderStyle: 'dashed',
    },
    photoContainerError: {
      borderColor: theme.colors.error,
    },
    photoPreview: {
      width: '100%',
      height: '100%',
      borderRadius: 10,
    },
    photoPlaceholder: {
      alignItems: 'center',
    },
    photoPlaceholderText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    photoActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      marginTop: 12,
    },
    photoActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      gap: 8,
    },
    photoActionText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    buttonContainer: {
      marginTop: 8,
    },
    submitButton: {
      paddingVertical: 16,
    },
  });

export default GuardianProfileCompletionScreen;
