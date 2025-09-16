/**
 * ProfileCompletenessIndicator Component
 * 
 * A component that shows profile completion status with progress bar and missing fields
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCheckCircle,
  faExclamationCircle,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCalendarAlt,
  faVenusMars,
  faImage,
  faUserFriends,
} from '@fortawesome/free-solid-svg-icons';

const ProfileCompletenessIndicator = ({
  completenessData,
  onFieldPress,
  theme,
  style = {},
  compact = false,
}) => {
  const styles = createStyles(theme);

  if (!completenessData) {
    return null;
  }

  const {
    completeness_percentage = 0,
    is_complete = false,
    missing_field_names = [],
    completed_field_names = [],
  } = completenessData;

  const getFieldIcon = (fieldName) => {
    const iconMap = {
      name: faUser,
      email: faEnvelope,
      phone: faPhone,
      address: faMapMarkerAlt,
      date_of_birth: faCalendarAlt,
      gender: faVenusMars,
      profile_photo: faImage,
      emergency_contact: faUserFriends,
      emergency_phone: faPhone,
    };
    return iconMap[fieldName] || faUser;
  };

  const getFieldLabel = (fieldName) => {
    const labelMap = {
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      address: 'Address',
      date_of_birth: 'Date of Birth',
      gender: 'Gender',
      profile_photo: 'Profile Photo',
      emergency_contact: 'Emergency Contact',
      emergency_phone: 'Emergency Phone',
    };
    return labelMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getProgressColor = () => {
    if (completeness_percentage >= 90) return theme.colors.success;
    if (completeness_percentage >= 70) return theme.colors.info;
    if (completeness_percentage >= 50) return theme.colors.warning;
    return theme.colors.error;
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${completeness_percentage}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {Math.round(completeness_percentage)}% Complete
      </Text>
    </View>
  );

  const renderCompactView = () => (
    <TouchableOpacity
      style={[styles.compactContainer, style]}
      onPress={() => onFieldPress && onFieldPress('overview')}
      activeOpacity={0.7}
    >
      <View style={styles.compactLeft}>
        <FontAwesomeIcon
          icon={is_complete ? faCheckCircle : faExclamationCircle}
          size={20}
          color={is_complete ? theme.colors.success : theme.colors.warning}
        />
        <View style={styles.compactText}>
          <Text style={styles.compactTitle}>
            Profile {is_complete ? 'Complete' : 'Incomplete'}
          </Text>
          <Text style={styles.compactSubtitle}>
            {Math.round(completeness_percentage)}% complete
            {missing_field_names.length > 0 && ` • ${missing_field_names.length} missing`}
          </Text>
        </View>
      </View>
      <View style={styles.compactProgress}>
        <View style={styles.miniProgressBar}>
          <View
            style={[
              styles.miniProgressFill,
              {
                width: `${completeness_percentage}%`,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFullView = () => (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesomeIcon
            icon={is_complete ? faCheckCircle : faExclamationCircle}
            size={24}
            color={is_complete ? theme.colors.success : theme.colors.warning}
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Profile {is_complete ? 'Complete' : 'Incomplete'}
            </Text>
            <Text style={styles.subtitle}>
              {is_complete
                ? 'Your profile is fully completed'
                : `${missing_field_names.length} field${missing_field_names.length !== 1 ? 's' : ''} remaining`}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Missing Fields */}
      {missing_field_names.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Missing Information</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fieldsContainer}
          >
            {missing_field_names.map((fieldName) => (
              <TouchableOpacity
                key={fieldName}
                style={styles.fieldItem}
                onPress={() => onFieldPress && onFieldPress(fieldName)}
                activeOpacity={0.7}
              >
                <View style={[styles.fieldIcon, styles.fieldIconMissing]}>
                  <FontAwesomeIcon
                    icon={getFieldIcon(fieldName)}
                    size={16}
                    color={theme.colors.error}
                  />
                </View>
                <Text style={styles.fieldLabel}>{getFieldLabel(fieldName)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Completed Fields */}
      {completed_field_names.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed Information</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fieldsContainer}
          >
            {completed_field_names.slice(0, 6).map((fieldName) => (
              <View key={fieldName} style={styles.fieldItem}>
                <View style={[styles.fieldIcon, styles.fieldIconCompleted]}>
                  <FontAwesomeIcon
                    icon={getFieldIcon(fieldName)}
                    size={16}
                    color={theme.colors.success}
                  />
                </View>
                <Text style={styles.fieldLabel}>{getFieldLabel(fieldName)}</Text>
              </View>
            ))}
            {completed_field_names.length > 6 && (
              <View style={styles.fieldItem}>
                <View style={[styles.fieldIcon, styles.fieldIconCompleted]}>
                  <Text style={styles.moreText}>+{completed_field_names.length - 6}</Text>
                </View>
                <Text style={styles.fieldLabel}>More</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return compact ? renderCompactView() : renderFullView();
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    compactContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerText: {
      marginLeft: 12,
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textLight,
      marginTop: 2,
    },
    compactLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    compactText: {
      marginLeft: 12,
      flex: 1,
    },
    compactTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    compactSubtitle: {
      fontSize: 12,
      color: theme.colors.textLight,
      marginTop: 2,
    },
    compactProgress: {
      width: 60,
      alignItems: 'flex-end',
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    miniProgressBar: {
      width: 60,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    miniProgressFill: {
      height: '100%',
      borderRadius: 2,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    fieldsContainer: {
      paddingHorizontal: 4,
    },
    fieldItem: {
      alignItems: 'center',
      marginRight: 16,
      minWidth: 60,
    },
    fieldIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    fieldIconMissing: {
      backgroundColor: theme.colors.error + '15',
      borderWidth: 1,
      borderColor: theme.colors.error + '30',
    },
    fieldIconCompleted: {
      backgroundColor: theme.colors.success + '15',
      borderWidth: 1,
      borderColor: theme.colors.success + '30',
    },
    fieldLabel: {
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 16,
    },
    moreText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.success,
    },
  });

export default ProfileCompletenessIndicator;
