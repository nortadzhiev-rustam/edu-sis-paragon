/**
 * Guardian Detail Screen
 * Shows detailed information about a guardian including QR code
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { QRCodeDisplay } from '../components/guardian';
import guardianService from '../services/guardianService';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const GuardianDetailScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const {
    guardian: initialGuardian,
    authCode,
    onGuardianUpdated,
  } = route.params;

  const [guardian, setGuardian] = useState(initialGuardian);
  const [isRotating, setIsRotating] = useState(false);

  const styles = createStyles(theme);

  const handleRotateToken = async () => {
    setIsRotating(true);
    try {
      const response = await guardianService.rotateQrToken(
        authCode,
        guardian.pickup_card_id
      );

      if (response.success) {
        // Update local guardian data
        const updatedGuardian = {
          ...guardian,
          qr_token: response.qr_token,
          qr_url: response.qr_url,
          updated_at: new Date().toISOString(),
        };

        setGuardian(updatedGuardian);

        // Notify parent screen
        if (onGuardianUpdated) {
          onGuardianUpdated();
        }

        return response;
      } else {
        throw new Error(response.message || 'Failed to rotate token');
      }
    } catch (error) {
      console.error('Error rotating QR token:', error);
      throw error;
    } finally {
      setIsRotating(false);
    }
  };

  const handleShareGuardian = async () => {
    try {
      const message = `Guardian Pickup Information

Name: ${guardian.name}
Relation: ${guardian.relation}
Phone: ${guardian.phone || 'Not provided'}

QR Token: ${guardian.qr_token}
QR URL: ${guardian.qr_url}

This QR code can be used for school pickup authentication.`;

      await Share.share({
        message,
        title: 'Guardian Pickup Information',
        url: guardian.qr_url,
      });
    } catch (error) {
      console.error('Error sharing guardian info:', error);
      Alert.alert(t('error'), t('failedToShareGuardian'));
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      return dateString;
    }
  };

  const formatRelation = (relation) => {
    return (
      relation.charAt(0).toUpperCase() + relation.slice(1).replace('_', ' ')
    );
  };

  const renderInfoSection = () => (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>{t('guardianInformation')}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('guardianName')}:</Text>
        <Text style={styles.infoValue}>{guardian.name}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('guardianRelation')}:</Text>
        <Text style={styles.infoValue}>
          {formatRelation(guardian.relation)}
        </Text>
      </View>

      {guardian.phone && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('guardianPhone')}:</Text>
          <Text style={styles.infoValue}>{guardian.phone}</Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('guardianStatus')}:</Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor:
                  guardian.status === 1 ? theme.success : theme.error,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: guardian.status === 1 ? theme.colors.success : theme.colors.error },
            ]}
          >
            {guardian.status === 1
              ? t('guardianActive')
              : t('guardianInactive')}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('guardianCreated')}:</Text>
        <Text style={styles.infoValue}>{formatDate(guardian.created_at)}</Text>
      </View>

      {guardian.updated_at !== guardian.created_at && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('lastUpdated')}:</Text>
          <Text style={styles.infoValue}>
            {formatDate(guardian.updated_at)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionsSection}>
      <TouchableOpacity
        style={[styles.actionButton, styles.shareButton]}
        onPress={handleShareGuardian}
      >
        <Text style={styles.actionButtonText}>{t('shareGuardianInfo')}</Text>
      </TouchableOpacity>
    </View>
  );

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
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={18}
                color={theme.colors.headerText}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('guardianDetails')}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Guardian Information */}
        {renderInfoSection()}

        {/* QR Code Display */}
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>{t('pickupQrCode')}</Text>
          <View style={styles.qrDisplayWrapper}>
            <QRCodeDisplay
              qrToken={guardian.qr_token}
              qrUrl={guardian.qr_url}
              guardianName={guardian.name}
              onRotateToken={handleRotateToken}
              showActions={true}
              size={250}
            />
          </View>
        </View>

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityTitle}>{t('securityNotice')}</Text>
          <Text style={styles.securityText}>• {t('keepQrCodeSecure')}</Text>
          <Text style={styles.securityText}>• {t('rotateTokenRegularly')}</Text>
          <Text style={styles.securityText}>
            • {t('verifyGuardianIdentity')}
          </Text>
          <Text style={styles.securityText}>
            • {t('reportSuspiciousActivity')}
          </Text>
        </View>
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
      backgroundColor: theme.colors.headerBackground,
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
      color: theme.colors.headerText,
      fontSize: 18,
      fontWeight: '600',
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    infoSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      minWidth: 80,
    },
    infoValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
      marginLeft: 12,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginLeft: 12,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
    },
    qrSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
    },
    qrDisplayWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
    },
    actionsSection: {
      marginBottom: 20,
    },
    actionButton: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    shareButton: {
      backgroundColor: theme.colors.success,
    },
    actionButtonText: {
      color: theme.colors.headerText,
      fontSize: 16,
      fontWeight: '600',
    },
    securityNotice: {
      backgroundColor: theme.colors.error + '20',
      padding: 16,
      
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.error,
    },
    securityTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    securityText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      lineHeight: 18,
    },
  });

export default GuardianDetailScreen;
