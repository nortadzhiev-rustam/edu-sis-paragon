/**
 * Pickup QR Code Modal Component
 * Displays QR code for parent pickup verification
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Clipboard from '@react-native-clipboard/clipboard';

// Context
import { useTheme } from '../contexts/ThemeContext';

const PickupQRCodeModal = ({
  visible,
  onClose,
  qrData,
  parentInfo,
  childrenData = [],
  onRefresh,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (!qrData) return null;

  const handleCopyToken = async () => {
    try {
      await Clipboard.setString(qrData.qr_token);
      Alert.alert('Token Copied', 'QR token copied to clipboard');
    } catch (error) {
      console.error('Error copying QR token:', error);
      Alert.alert('Error', 'Failed to copy QR token');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome5 name='times' size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pickup QR Code</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <QRCode
                value={qrData.qr_url || qrData.qr_token}
                size={200}
                color={theme.colors.text}
                backgroundColor={theme.colors.surface}
              />
            </View>

            <Text style={styles.qrTitle}>Show this QR code to staff</Text>
            <Text style={styles.qrSubtitle}>
              {qrData.instructions || 'Present this code during pickup'}
            </Text>
          </View>

          {/* Parent Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Parent Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <FontAwesome5
                  name='user'
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.infoText}>{parentInfo?.name || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <FontAwesome5
                  name='phone'
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.infoText}>
                  {parentInfo?.phone || 'N/A'}
                </Text>
              </View>
              {parentInfo?.email && (
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name='envelope'
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.infoText}>{parentInfo.email}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Children Information */}
          {childrenData.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Children</Text>
              {childrenData.map((child, index) => (
                <View key={child.id || index} style={styles.childCard}>
                  <View style={styles.childInfo}>
                    <FontAwesome5
                      name='graduation-cap'
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.childName}>{child.name}</Text>
                  </View>
                  <Text style={styles.childId}>ID: {child.id}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Token Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>QR Token</Text>
            <View style={styles.tokenCard}>
              <Text style={styles.tokenText}>{qrData.qr_token}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyToken}
              >
                <FontAwesome5
                  name='copy'
                  size={14}
                  color={theme.colors.primary}
                />
                <Text style={styles.copyText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <View style={styles.instructionItem}>
              <FontAwesome5 name='check-circle' size={16} color='#34C759' />
              <Text style={styles.instructionText}>
                Make sure you have pending pickup requests
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <FontAwesome5 name='check-circle' size={16} color='#34C759' />
              <Text style={styles.instructionText}>
                Show this QR code to school staff
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <FontAwesome5 name='check-circle' size={16} color='#34C759' />
              <Text style={styles.instructionText}>
                Wait for staff verification
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {onRefresh && (
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <FontAwesome5
                name='sync-alt'
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.refreshButtonText}>Refresh QR</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    headerRight: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    qrSection: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    qrContainer: {
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginBottom: 20,
      ...theme.shadows.medium,
    },
    qrTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    qrSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    infoSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      ...theme.shadows.small,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 12,
      flex: 1,
    },
    childCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      ...theme.shadows.small,
    },
    childInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    childName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginLeft: 12,
    },
    childId: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 28,
    },
    tokenCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...theme.shadows.small,
    },
    tokenText: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: theme.colors.text,
      flex: 1,
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.primaryLight,
      borderRadius: 8,
    },
    copyText: {
      fontSize: 12,
      color: theme.colors.primary,
      marginLeft: 4,
      fontWeight: '500',
    },
    instructionsSection: {
      marginBottom: 20,
    },
    instructionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    instructionText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 12,
      flex: 1,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      gap: 12,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      gap: 8,
      flex: 1,
      maxWidth: '48%'
    },
    refreshButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    doneButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      ...theme.shadows.small,
      flex: 1,
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });

export default PickupQRCodeModal;
