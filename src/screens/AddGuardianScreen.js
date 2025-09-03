/**
 * Add Guardian Screen
 * Form for parents to add new guardians for their children
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CommonButton } from '../components';
import guardianService from '../services/guardianService';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const AddGuardianScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { children, selectedChildId, authCode, onGuardianAdded } = route.params;

  const [formData, setFormData] = useState({
    student_id: selectedChildId || (children.length > 0 ? children[0].id : ''),
    name: '',
    relation: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    // Set default student if provided
    if (selectedChildId) {
      setFormData((prev) => ({ ...prev, student_id: selectedChildId }));
    }
  }, [selectedChildId]);

  const validateForm = () => {
    const validationErrors = guardianService.validateGuardianData(formData);
    const errorObj = {};

    validationErrors.forEach((error) => {
      if (error.includes('name')) {
        errorObj.name = error;
      } else if (error.includes('relation')) {
        errorObj.relation = error;
      } else if (error.includes('phone')) {
        errorObj.phone = error;
      } else if (error.includes('Student')) {
        errorObj.student_id = error;
      }
    });

    setErrors(errorObj);
    return Object.keys(errorObj).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(t('validationError'), t('pleaseFixErrors'));
      return;
    }

    setLoading(true);

    try {
      const response = await guardianService.createGuardian(authCode, formData);

      if (response.success) {
        Alert.alert(t('success'), t('guardianCreatedSuccessfully'), [
          {
            text: t('ok'),
            onPress: () => {
              if (onGuardianAdded) {
                onGuardianAdded();
              }
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert(
          t('error'),
          response.message || t('failedToCreateGuardian')
        );
      }
    } catch (error) {
      console.error('Error creating guardian:', error);
      Alert.alert(t('error'), t('failedToCreateGuardian'));
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
        placeholderTextColor={theme.textSecondary}
        {...options}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderChildSelection = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{t('selectChild')}</Text>
      <View style={styles.childListContainer}>
        {children.map((child, index) => (
          <TouchableOpacity
            key={child.id}
            style={[
              styles.childItem,
              index === children.length - 1 && styles.childItemLast,
              formData.student_id === child.id && styles.childItemSelected,
              errors.student_id && styles.childItemError,
            ]}
            onPress={() => handleInputChange('student_id', child.id)}
          >
            <View style={styles.childItemContent}>
              <View
                style={[
                  styles.radioButton,
                  formData.student_id === child.id &&
                    styles.radioButtonSelected,
                ]}
              >
                {formData.student_id === child.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text
                style={[
                  styles.childName,
                  formData.student_id === child.id && styles.childNameSelected,
                ]}
              >
                {child.name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      {errors.student_id && (
        <Text style={styles.errorText}>{errors.student_id}</Text>
      )}
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
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('addGuardian')}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
        >
          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              {t('addGuardianInstructions')}
            </Text>
            <Text style={styles.instructionsText}>
              {t('addGuardianInstructionsText')}
            </Text>
            <Text style={styles.instructionsText}>
              • You can enter any relation (e.g., driver, aunt, uncle,
              grandparent, family friend)
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Student Selection */}
            {children.length > 1 && renderChildSelection()}

            {/* Guardian Name */}
            {renderFormField(
              t('guardianName'),
              'name',
              t('enterGuardianName'),
              {
                autoCapitalize: 'words',
                maxLength: 100,
              }
            )}

            {/* Relation */}
            {renderFormField(
              t('relationToStudent'),
              'relation',
              t('enterRelation'),
              {
                autoCapitalize: 'words',
                maxLength: 50,
              }
            )}

            {/* Phone Number */}
            {renderFormField(
              t('phoneNumber') + ' (' + t('optional') + ')',
              'phone',
              t('enterPhoneNumber'),
              {
                keyboardType: 'phone-pad',
                maxLength: 20,
              }
            )}
          </View>

          {/* Important Notes */}
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>{t('importantNotes')}:</Text>
            <Text style={styles.noteText}>• {t('guardianLimitNote')}</Text>
            <Text style={styles.noteText}>• {t('qrCodeSecurityNote')}</Text>
            <Text style={styles.noteText}>
              • {t('guardianVerificationNote')}
            </Text>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <CommonButton
              title={loading ? t('creating') : t('createGuardian')}
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
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
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    instructionsContainer: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 5,
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    instructionsText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    formContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 5,
    },
    fieldContainer: {
      marginBottom: 10,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
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
    childListContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    },
    childItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    childItemLast: {
      borderBottomWidth: 0,
    },
    childItemSelected: {
      backgroundColor: theme.colors.primary + '15',
      borderColor: theme.colors.primary,
    },
    childItemError: {
      borderColor: theme.colors.error,
    },
    childItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonSelected: {
      borderColor: theme.colors.primary,
    },
    radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    childName: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    childNameSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginTop: 4,
    },
    notesContainer: {
      backgroundColor: theme.colors.warning + '20',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.warning,
    },
    notesTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    noteText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      lineHeight: 18,
    },
    buttonContainer: {
      marginTop: 8,
    },
    submitButton: {
      paddingVertical: 16,
    },
  });

export default AddGuardianScreen;
