import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faEdit,
  faArrowLeft,
  faIdCard,
  faMapMarkerAlt,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { createMediumShadow } from '../utils/commonStyles';
import { Config } from '../config/env';
import { getUserData } from '../services/authService';

const ParentProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const fontSizes = getLanguageFontSizes();
  const [currentUserData, setCurrentUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const styles = createStyles(theme, fontSizes);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      console.log('🔍 PARENT PROFILE SCREEN: Loading parent data...');

      // Use the same logic as ParentScreen to load user data
      const parentData = await getUserData('parent', AsyncStorage);
      const studentData = await getUserData('student', AsyncStorage);

      console.log('🔍 PARENT PROFILE SCREEN: Data check:', {
        hasParentData: !!parentData,
        hasStudentData: !!studentData,
        parentUserType: parentData?.userType,
        studentUserType: studentData?.userType,
      });

      // Use parent data if available, otherwise student data, otherwise fallback to generic
      let parsedUserData = null;
      if (parentData && parentData.userType === 'parent') {
        parsedUserData = parentData;
        console.log('✅ PARENT PROFILE SCREEN: Using parent-specific data');
      } else if (studentData && studentData.userType === 'student') {
        parsedUserData = studentData;
        console.log('✅ PARENT PROFILE SCREEN: Using student-specific data');
      } else {
        // Fallback to generic userData for backward compatibility
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          parsedUserData = JSON.parse(userData);
          console.log(
            '⚠️ PARENT PROFILE SCREEN: Using generic userData as fallback:',
            parsedUserData.userType
          );
        }
      }

      if (parsedUserData) {
        // Debug logging to see what data we're setting
        console.log(
          '🖼️ PARENT PROFILE SCREEN: Setting currentUserData with keys:',
          Object.keys(parsedUserData)
        );
        console.log(
          '🖼️ PARENT PROFILE SCREEN: Photo fields in parsedUserData:',
          {
            photo: parsedUserData.photo,
            parent_photo: parsedUserData.parent_photo,
            user_photo: parsedUserData.user_photo,
            parent_info: parsedUserData.parent_info
              ? Object.keys(parsedUserData.parent_info)
              : 'no parent_info',
          }
        );

        setCurrentUserData(parsedUserData);
      } else {
        console.log('❌ PARENT PROFILE SCREEN: No user data found');
      }
    } catch (error) {
      console.error(
        '❌ PARENT PROFILE SCREEN: Error loading parent data:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('ParentProfileEdit');
  };

  const renderProfileHeader = () => {
    const parentName =
      currentUserData?.name || currentUserData?.user_name || 'Parent';

    // Check multiple possible photo field names to match ParentScreen.js
    const parentPhoto =
      currentUserData?.photo ||
      currentUserData?.parent_photo ||
      currentUserData?.parent_info?.parent_photo ||
      currentUserData?.user_photo;

    // Debug logging to help identify the issue
    console.log('🖼️ PARENT PROFILE SCREEN: Photo debug info:', {
      hasCurrentUserData: !!currentUserData,
      photo: currentUserData?.photo,
      parent_photo: currentUserData?.parent_photo,
      parent_info_photo: currentUserData?.parent_info?.parent_photo,
      user_photo: currentUserData?.user_photo,
      finalParentPhoto: parentPhoto,
      currentUserDataKeys: currentUserData ? Object.keys(currentUserData) : [],
    });

    const photoUri = parentPhoto?.startsWith('http')
      ? parentPhoto
      : parentPhoto
      ? `${Config.API_DOMAIN}${parentPhoto}`
      : null;

    return (
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.avatar}
              resizeMode='cover'
              onError={(error) => {
                console.log(
                  '❌ PARENT PROFILE SCREEN: Image load error:',
                  error.nativeEvent.error
                );
                console.log(
                  '🔗 PARENT PROFILE SCREEN: Failed image URL:',
                  photoUri
                );
              }}
              onLoad={() => {
                console.log(
                  '✅ PARENT PROFILE SCREEN: Image loaded successfully'
                );
              }}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesomeIcon
                icon={faUser}
                size={40}
                color={theme.colors.primary}
              />
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.parentName}>{parentName}</Text>
          <Text style={styles.parentRole}>{t('parentAccount')}</Text>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <FontAwesomeIcon
            icon={faEdit}
            size={18}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderInfoSection = () => {
    const parentEmail = currentUserData?.email || currentUserData?.parent_email;
    const parentPhone = currentUserData?.phone || currentUserData?.parent_phone;
    const authCode = currentUserData?.auth_code || currentUserData?.authCode;
    const address = currentUserData?.address;
    const joinDate = currentUserData?.created_at || currentUserData?.join_date;

    return (
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>{t('contactInformation')}</Text>

        {parentEmail && (
          <View style={styles.infoItem}>
            <FontAwesomeIcon
              icon={faEnvelope}
              size={16}
              color={theme.colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('email')}</Text>
              <Text style={styles.infoValue}>{parentEmail}</Text>
            </View>
          </View>
        )}

        {parentPhone && (
          <View style={styles.infoItem}>
            <FontAwesomeIcon
              icon={faPhone}
              size={16}
              color={theme.colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('phone')}</Text>
              <Text style={styles.infoValue}>{parentPhone}</Text>
            </View>
          </View>
        )}

        {address && (
          <View style={styles.infoItem}>
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              size={16}
              color={theme.colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('address')}</Text>
              <Text style={styles.infoValue}>{address}</Text>
            </View>
          </View>
        )}

        {authCode && (
          <View style={styles.infoItem}>
            <FontAwesomeIcon
              icon={faIdCard}
              size={16}
              color={theme.colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('accountId')}</Text>
              <Text style={styles.infoValue}>{authCode}</Text>
            </View>
          </View>
        )}

        {joinDate && (
          <View style={styles.infoItem}>
            <FontAwesomeIcon
              icon={faCalendarAlt}
              size={16}
              color={theme.colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('memberSince')}</Text>
              <Text style={styles.infoValue}>
                {new Date(joinDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
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
        <Text style={styles.headerTitle}>{t('parentProfile')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderInfoSection()}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginHorizontal: 16,
      borderRadius: 16,
      ...createMediumShadow(theme),
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: fontSizes.large,
      fontWeight: 'bold',
      color: theme.colors.headerText,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: fontSizes.medium,
      color: theme.colors.textSecondary,
    },
    headerSection: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      ...createMediumShadow(theme),
    },
    avatarContainer: {
      marginRight: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    headerInfo: {
      flex: 1,
    },
    parentName: {
      fontSize: fontSizes.large,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    parentRole: {
      fontSize: fontSizes.medium,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    editButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    infoSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      ...createMediumShadow(theme),
    },
    sectionTitle: {
      fontSize: fontSizes.large,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    infoContent: {
      flex: 1,
      marginLeft: 12,
    },
    infoLabel: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: fontSizes.medium,
      color: theme.colors.text,
      fontWeight: '500',
    },
  });

export default ParentProfileScreen;
