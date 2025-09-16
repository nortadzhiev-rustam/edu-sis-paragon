import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faEdit } from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getResponsiveHeaderFontSize } from '../utils/commonStyles';

export default function StudentProfileScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);

  const student = route.params?.student || {};

  const styles = createStyles(theme, fontSizes);

  // Debug logging for photo URI
  console.log('📸 STUDENT PROFILE: Student data received:', {
    hasStudent: !!student,
    studentName: student.name,
    hasPersonalInfo: !!student.personal_info,
    personalInfoPhoto: student?.personal_info?.profile_photo,
    normalizedPhoto: student.photo,
  });

  const photoUri = student?.personal_info?.profile_photo
    ? student.personal_info.profile_photo
    : student.photo || null;

  console.log('📸 STUDENT PROFILE: Final photo URI:', photoUri);

  // Format last login timestamp
  const formatLastLogin = (timestamp) => {
    if (!timestamp) return '-';

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now - date;
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      // If less than 1 minute ago
      if (diffInMinutes < 1) {
        return t('justNow') || 'Just now';
      }
      // If less than 1 hour ago
      else if (diffInMinutes < 60) {
        return `${diffInMinutes} ${t('minutesAgo') || 'minutes ago'}`;
      }
      // If less than 24 hours ago
      else if (diffInHours < 24) {
        return `${diffInHours} ${t('hoursAgo') || 'hours ago'}`;
      }
      // If less than 7 days ago
      else if (diffInDays < 7) {
        return `${diffInDays} ${t('daysAgo') || 'days ago'}`;
      }
      // Otherwise show formatted date
      else {
        return date.toLocaleDateString(
          currentLanguage === 'en' ? 'en-US' : currentLanguage,
          {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }
        );
      }
    } catch (error) {
      console.error('Error formatting last login timestamp:', error);
      return timestamp; // Return original if formatting fails
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('StudentProfileEdit');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
            <Text
              style={[
                styles.headerTitle,
                {
                  fontSize: getResponsiveHeaderFontSize(
                    2,
                    t('studentProfile') || 'Student Profile'
                  ),
                },
              ]}
            >
              {t('studentProfile') || 'Student Profile'}
            </Text>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.photo}
              onLoad={() =>
                console.log('📸 STUDENT PROFILE: Image loaded successfully')
              }
              onError={(error) =>
                console.log('❌ STUDENT PROFILE: Image load error:', error)
              }
              onLoadStart={() =>
                console.log('📸 STUDENT PROFILE: Image load started')
              }
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]} />
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{student.name}</Text>
            <Text style={styles.subText}>
              {student?.academic_info?.classroom_name ||
                student.class_name ||
                t('student')}
            </Text>
            {student?.academic_info?.branch_name && (
              <Text style={styles.subText}>
                {student.academic_info.branch_name}
              </Text>
            )}

            {/* Edit Profile Button */}
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleEditProfile}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon
                icon={faEdit}
                size={14}
                color={theme.colors.primary}
              />
              <Text style={styles.editProfileText}>
                {t('editProfile') || 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('personalInformation') || 'Personal Information'}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t('studentId') || 'Student ID'}</Text>
            <Text style={styles.value}>
              {student.user_id || student.id || '-'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('username') || 'Username'}</Text>
            <Text style={styles.value}>{student.username || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('email') || 'Email'}</Text>
            <Text style={styles.value}>{student.email || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('gender') || 'Gender'}</Text>
            <Text style={styles.value}>
              {student?.personal_info?.gender || '-'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t('nationality') || 'Nationality'}
            </Text>
            <Text style={styles.value}>
              {student?.personal_info?.nationality || '-'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('phone') || 'Phone'}</Text>
            <Text style={styles.value}>
              {student?.personal_info?.phone || '-'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('address') || 'Address'}</Text>
            <Text style={styles.value}>
              {student?.personal_info?.address || '-'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('academicInformation') || 'Academic Information'}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t('academicYear') || 'Academic Year'}
            </Text>
            <Text style={styles.value}>
              {student?.academic_info?.academic_year || '-'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('branch') || 'Branch'}</Text>
            <Text style={styles.value}>
              {student?.academic_info?.branch_name || '-'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('class') || 'Class'}</Text>
            <Text style={styles.value}>
              {student?.academic_info?.classroom_name || '-'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t('homeroomTeacher') || 'Homeroom Teacher'}
            </Text>
            <Text style={styles.value}>
              {student?.academic_info?.homeroom_teacher || '-'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('status') || 'Status'}</Text>
            <Text style={styles.value}>
              {student?.academic_info?.student_status === 1
                ? t('active') || 'Active'
                : t('inactive') || 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('system') || 'System'}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t('lastLogin') || 'Last Login'}</Text>
            <Text style={styles.value}>
              {formatLastLogin(student?.system_info?.last_login)}
            </Text>
          </View>
          {student?.system_info?.profile_complete && (
            <View style={styles.row}>
              <Text style={styles.label}>
                {t('profileCompletion') || 'Profile Completion'}
              </Text>
              <Text style={styles.value}>
                {student.system_info.profile_complete.completion_percentage}%
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
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
    content: { padding: 16 },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    photo: { width: 72, height: 72, borderRadius: 36, marginRight: 16 },
    photoPlaceholder: { backgroundColor: theme.colors.primary + '33' },
    headerInfo: { flex: 1 },
    name: {
      fontSize: fontSizes.subtitle,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subText: { fontSize: fontSizes.body, color: theme.colors.textSecondary },
    editProfileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '15',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    editProfileText: {
      fontSize: fontSizes.small,
      color: theme.colors.primary,
      fontWeight: '600',
      marginLeft: 4,
    },

    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    label: { fontSize: fontSizes.body, color: theme.colors.textSecondary },
    value: {
      fontSize: fontSizes.body,
      color: theme.colors.text,
      maxWidth: '60%',
      textAlign: 'right',
    },
  });
