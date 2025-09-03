/**
 * Guardian Dashboard Screen
 * Main screen for guardians after profile completion
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUser,
  faChild,
  faQrcode,
  faSignOutAlt,
  faEdit,
  faCar,
} from '@fortawesome/free-solid-svg-icons';
import guardianStorageService from '../services/guardianStorageService';
import { QRCodeDisplay } from '../components/guardian';

const GuardianDashboardScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { authCode, guardian, child } = route.params;
  const [showQRModal, setShowQRModal] = useState(false);

  const styles = createStyles(theme);

  const handleLogout = () => {
    Alert.alert(t('logout'), t('areYouSureLogout'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🚪 GUARDIAN DASHBOARD: Logging out guardian...');

            // Clear guardian data from storage
            const clearSuccess =
              await guardianStorageService.clearGuardianData();

            if (clearSuccess) {
              console.log(
                '✅ GUARDIAN DASHBOARD: Guardian data cleared successfully'
              );
            } else {
              console.warn(
                '⚠️ GUARDIAN DASHBOARD: Failed to clear guardian data'
              );
            }

            // Navigate back to login screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            console.error('❌ GUARDIAN DASHBOARD: Error during logout:', error);
            // Still navigate to login even if clearing data fails
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate('GuardianProfileEdit', {
      authCode,
      guardian,
      child,
    });
  };

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {guardian?.guardian_photo_url ? (
            <Image
              source={{ uri: guardian.guardian_photo_url }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <FontAwesomeIcon
                icon={faUser}
                size={40}
                color={theme.colors.textSecondary}
              />
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{guardian?.name}</Text>
          <Text style={styles.profileRelation}>
            {guardian?.relation} • {t('guardian')}
          </Text>
          <Text style={styles.profileEmail}>{guardian?.email}</Text>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <FontAwesomeIcon
            icon={faEdit}
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChildSection = () => (
    <View style={styles.childSection}>
      <Text style={styles.sectionTitle}>{t('authorizedFor')}</Text>
      <View style={styles.childCard}>
        <FontAwesomeIcon
          icon={faChild}
          size={24}
          color={theme.colors.primary}
        />
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child?.name}</Text>
          <Text style={styles.childDetails}>
            {t('studentId')}: {child?.student_id}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.actionsSection}>
      <Text style={styles.sectionTitle}>{t('quickActions')}</Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          // Navigate to pickup request screen
          navigation.navigate('GuardianPickupRequest', {
            authCode: authCode,
            child: child,
            guardian: guardian,
          });
        }}
      >
        <FontAwesomeIcon icon={faCar} size={20} color={theme.colors.primary} />
        <Text style={styles.actionButtonText}>Create Pickup Request</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          // Show QR code for pickup
          if (guardian?.qr_token) {
            setShowQRModal(true);
          } else {
            Alert.alert(t('error'), t('qrCodeNotAvailable'));
          }
        }}
      >
        <FontAwesomeIcon
          icon={faQrcode}
          size={20}
          color={theme.colors.primary}
        />
        <Text style={styles.actionButtonText}>{t('showMyQrCode')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          // View pickup history
          Alert.alert(t('info'), t('pickupHistoryComingSoon'));
        }}
      >
        <FontAwesomeIcon
          icon={faChild}
          size={20}
          color={theme.colors.primary}
        />
        <Text style={styles.actionButtonText}>{t('pickupHistory')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContactInfo = () => (
    <View style={styles.contactSection}>
      <Text style={styles.sectionTitle}>{t('contactInformation')}</Text>

      <View style={styles.contactItem}>
        <Text style={styles.contactLabel}>{t('phone')}:</Text>
        <Text style={styles.contactValue}>{guardian?.phone}</Text>
      </View>

      <View style={styles.contactItem}>
        <Text style={styles.contactLabel}>{t('emergencyContact')}:</Text>
        <Text style={styles.contactValue}>{guardian?.emergency_contact}</Text>
      </View>

      <View style={styles.contactItem}>
        <Text style={styles.contactLabel}>{t('address')}:</Text>
        <Text style={styles.contactValue}>{guardian?.address}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        <View style={styles.navigationHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{t('guardianDashboard')}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <FontAwesomeIcon
                icon={faSignOutAlt}
                size={18}
                color={theme.colors.headerText}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileSection()}
        {renderChildSection()}
        {renderContactInfo()}
        {renderQuickActions()}

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>{t('guardianWelcomeMessage')}</Text>
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowQRModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('myPickupQrCode')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.qrDisplayContainer}>
              {guardian?.qr_token && (
                <QRCodeDisplay
                  qrToken={guardian.qr_token}
                  qrUrl={guardian.qr_url}
                  guardianName={guardian.name}
                  showActions={true}
                  size={250}
                />
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.headerText,
    },
    logoutButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    profileSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileImageContainer: {
      marginRight: 16,
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    profileImagePlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    profileRelation: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    profileEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    childSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    childCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 8,
    },
    childInfo: {
      marginLeft: 12,
      flex: 1,
    },
    childName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    childDetails: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    actionsSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    actionButtonText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 12,
      fontWeight: '500',
    },
    contactSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    contactItem: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    contactLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      minWidth: 120,
    },
    contactValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    welcomeSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
    },
    welcomeText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },

    // QR Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.headerText,
    },
    modalContent: {
      flex: 1,
    },
    modalScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    qrDisplayContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default GuardianDashboardScreen;
