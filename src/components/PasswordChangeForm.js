/**
 * PasswordChangeForm Component
 * 
 * A reusable component for changing user passwords with validation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faLock,
  faKey,
  faCheck,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import ProfileFormField from './ProfileFormField';
import { validatePassword } from '../services/profileService';

const PasswordChangeForm = ({
  onPasswordChange,
  loading = false,
  theme,
  style = {},
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const styles = createStyles(theme);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleInputBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));

    // Validate on blur
    validateField(field);
  };

  const validateField = (field) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'currentPassword':
        if (!formData.currentPassword) {
          newErrors.currentPassword = ['Current password is required'];
        } else {
          delete newErrors.currentPassword;
        }
        break;

      case 'newPassword':
        if (!formData.newPassword) {
          newErrors.newPassword = ['New password is required'];
        } else if (formData.newPassword.length < 8) {
          newErrors.newPassword = ['Password must be at least 8 characters long'];
        } else if (formData.newPassword === formData.currentPassword) {
          newErrors.newPassword = ['New password must be different from current password'];
        } else {
          delete newErrors.newPassword;
        }
        break;

      case 'confirmPassword':
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = ['Password confirmation is required'];
        } else if (formData.confirmPassword !== formData.newPassword) {
          newErrors.confirmPassword = ['Password confirmation does not match'];
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const validation = validatePassword(formData.newPassword, formData.confirmPassword);
    const newErrors = { ...validation.errors };

    if (!formData.currentPassword) {
      newErrors.currentPassword = ['Current password is required'];
    }

    if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = ['New password must be different from current password'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    // Mark all fields as touched
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }

    onPasswordChange(
      formData.currentPassword,
      formData.newPassword,
      formData.confirmPassword
    );
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const isFormValid = () => {
    return (
      formData.currentPassword &&
      formData.newPassword &&
      formData.confirmPassword &&
      formData.newPassword === formData.confirmPassword &&
      formData.newPassword.length >= 8 &&
      formData.newPassword !== formData.currentPassword &&
      Object.keys(errors).length === 0
    );
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: theme.colors.textLight };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    strength = checks.filter(Boolean).length;

    const strengthMap = {
      0: { label: 'Very Weak', color: theme.colors.error },
      1: { label: 'Weak', color: theme.colors.error },
      2: { label: 'Fair', color: theme.colors.warning },
      3: { label: 'Good', color: theme.colors.info },
      4: { label: 'Strong', color: theme.colors.success },
      5: { label: 'Very Strong', color: theme.colors.success },
    };

    return { strength, ...strengthMap[strength] };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.subtitle}>
        Enter your current password and choose a new secure password
      </Text>

      {/* Current Password */}
      <ProfileFormField
        label="Current Password"
        value={formData.currentPassword}
        onChangeText={(value) => handleInputChange('currentPassword', value)}
        onBlur={() => handleInputBlur('currentPassword')}
        placeholder="Enter your current password"
        icon={faLock}
        secureTextEntry={!showPasswords.current}
        showPasswordToggle={true}
        onTogglePassword={() => togglePasswordVisibility('current')}
        error={touched.currentPassword ? errors.currentPassword : null}
        theme={theme}
        required
      />

      {/* New Password */}
      <ProfileFormField
        label="New Password"
        value={formData.newPassword}
        onChangeText={(value) => handleInputChange('newPassword', value)}
        onBlur={() => handleInputBlur('newPassword')}
        placeholder="Enter your new password"
        icon={faKey}
        secureTextEntry={!showPasswords.new}
        showPasswordToggle={true}
        onTogglePassword={() => togglePasswordVisibility('new')}
        error={touched.newPassword ? errors.newPassword : null}
        theme={theme}
        required
      />

      {/* Password Strength Indicator */}
      {formData.newPassword && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBar}>
            {[1, 2, 3, 4, 5].map((level) => (
              <View
                key={level}
                style={[
                  styles.strengthSegment,
                  {
                    backgroundColor:
                      level <= passwordStrength.strength
                        ? passwordStrength.color
                        : theme.colors.border,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
            {passwordStrength.label}
          </Text>
        </View>
      )}

      {/* Confirm Password */}
      <ProfileFormField
        label="Confirm New Password"
        value={formData.confirmPassword}
        onChangeText={(value) => handleInputChange('confirmPassword', value)}
        onBlur={() => handleInputBlur('confirmPassword')}
        placeholder="Confirm your new password"
        icon={faCheck}
        secureTextEntry={!showPasswords.confirm}
        showPasswordToggle={true}
        onTogglePassword={() => togglePasswordVisibility('confirm')}
        error={touched.confirmPassword ? errors.confirmPassword : null}
        theme={theme}
        required
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !isFormValid() && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!isFormValid() || loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.surface} />
        ) : (
          <>
            <FontAwesomeIcon
              icon={faKey}
              size={16}
              color={theme.colors.surface}
              style={styles.submitButtonIcon}
            />
            <Text style={styles.submitButtonText}>Change Password</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      padding: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textLight,
      marginBottom: 24,
      lineHeight: 20,
    },
    strengthContainer: {
      marginBottom: 16,
      marginTop: -12,
    },
    strengthBar: {
      flexDirection: 'row',
      height: 4,
      borderRadius: 2,
      marginBottom: 4,
      gap: 2,
    },
    strengthSegment: {
      flex: 1,
      borderRadius: 2,
    },
    strengthLabel: {
      fontSize: 12,
      fontWeight: '500',
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.disabled,
    },
    submitButtonIcon: {
      marginRight: 8,
    },
    submitButtonText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default PasswordChangeForm;
