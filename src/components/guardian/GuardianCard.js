/**
 * Guardian Card Component
 * Displays guardian information in a card format
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const GuardianCard = ({
  guardian,
  onPress,
  onRotateQR,
  showActions = true,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const styles = createStyles(theme);

  const handleRotateQR = () => {
    if (!onRotateQR) return;

    Alert.alert(t('rotateQrToken'), t('rotateQrTokenConfirmation'), [
      {
        text: t('cancel'),
        style: 'cancel',
      },
      {
        text: t('rotate'),
        style: 'destructive',
        onPress: () => onRotateQR(guardian.pickup_card_id),
      },
    ]);
  };

  const formatRelation = (relation) => {
    return (
      relation.charAt(0).toUpperCase() + relation.slice(1).replace('_', ' ')
    );
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress && onPress(guardian)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{guardian.name}</Text>
          <Text style={styles.relation}>
            {formatRelation(guardian.relation)}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor:
                  guardian.status === 1 ? theme.colors.success : theme.colors.error,
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

      {/* Contact Info */}
      {guardian.phone && (
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>{t('guardianPhone')}:</Text>
          <Text style={styles.contactValue}>{guardian.phone}</Text>
        </View>
      )}

      {/* QR Token Info */}
      <View style={styles.qrRow}>
        <Text style={styles.qrLabel}>{t('qrToken')}:</Text>
        <Text style={styles.qrToken}>{guardian.qr_token}</Text>
      </View>

      {/* Dates */}
      <View style={styles.datesContainer}>
        <Text style={styles.dateText}>
          {t('guardianCreated')}: {formatDate(guardian.created_at)}
        </Text>
        {guardian.updated_at !== guardian.created_at && (
          <Text style={styles.dateText}>
            {t('updated')}: {formatDate(guardian.updated_at)}
          </Text>
        )}
      </View>

      {/* Actions */}
      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => onPress && onPress(guardian)}
          >
            <Text style={styles.actionButtonText}>{t('viewQr')}</Text>
          </TouchableOpacity>

          {onRotateQR && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rotateButton]}
              onPress={handleRotateQR}
            >
              <Text style={styles.actionButtonText}>{t('rotateQr')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    nameContainer: {
      flex: 1,
    },
    name: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    relation: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    contactLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      minWidth: 60,
    },
    contactValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    qrRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    qrLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      minWidth: 60,
    },
    qrToken: {
      fontSize: 12,
      color: theme.colors.text,
      fontFamily: 'monospace',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      flex: 1,
    },
    datesContainer: {
      marginBottom: 12,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    viewButton: {
      backgroundColor: theme.colors.primary,
    },
    rotateButton: {
      backgroundColor: theme.colors.warning,
    },
    actionButtonText: {
      color: theme.colors.headerText,
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default GuardianCard;
