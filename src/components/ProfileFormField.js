/**
 * ProfileFormField Component
 * 
 * A reusable form field component for profile editing with validation support
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const ProfileFormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
  multiline = false,
  secureTextEntry = false,
  editable = true,
  error,
  theme,
  style = {},
  inputStyle = {},
  showPasswordToggle = false,
  onTogglePassword,
  maxLength,
  required = false,
}) => {
  const styles = createStyles(theme);

  const renderPasswordToggle = () => {
    if (!showPasswordToggle) return null;

    return (
      <TouchableOpacity
        style={styles.passwordToggle}
        onPress={onTogglePassword}
        activeOpacity={0.7}
      >
        <FontAwesomeIcon
          icon={secureTextEntry ? faEyeSlash : faEye}
          size={16}
          color={theme.colors.textLight}
        />
      </TouchableOpacity>
    );
  };

  const renderCharacterCount = () => {
    if (!maxLength || !value) return null;

    const isNearLimit = value.length > maxLength * 0.8;
    const isOverLimit = value.length > maxLength;

    return (
      <Text
        style={[
          styles.characterCount,
          isNearLimit && styles.characterCountWarning,
          isOverLimit && styles.characterCountError,
        ]}
      >
        {value.length}/{maxLength}
      </Text>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      <View style={styles.labelContainer}>
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            size={16}
            color={theme.colors.primary}
            style={styles.labelIcon}
          />
        )}
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          error && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            showPasswordToggle && styles.inputWithToggle,
            !editable && styles.inputDisabled,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textLight}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          secureTextEntry={secureTextEntry}
          editable={editable}
          maxLength={maxLength}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          autoCorrect={keyboardType !== 'email-address'}
        />
        {renderPasswordToggle()}
      </View>

      {/* Character Count */}
      {renderCharacterCount()}

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>
          {Array.isArray(error) ? error[0] : error}
        </Text>
      )}
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    labelIcon: {
      marginRight: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    required: {
      color: theme.colors.error,
      fontWeight: 'bold',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      minHeight: 48,
    },
    inputContainerError: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.error + '10',
    },
    inputContainerDisabled: {
      backgroundColor: theme.colors.disabled,
      borderColor: theme.colors.border + '50',
    },
    input: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      textAlignVertical: 'top',
    },
    inputMultiline: {
      minHeight: 100,
      maxHeight: 150,
    },
    inputWithToggle: {
      paddingRight: 50,
    },
    inputDisabled: {
      color: theme.colors.textLight,
    },
    passwordToggle: {
      position: 'absolute',
      right: 16,
      padding: 4,
    },
    characterCount: {
      fontSize: 12,
      color: theme.colors.textLight,
      textAlign: 'right',
      marginTop: 4,
    },
    characterCountWarning: {
      color: theme.colors.warning,
    },
    characterCountError: {
      color: theme.colors.error,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginTop: 4,
      marginLeft: 4,
    },
  });

export default ProfileFormField;
