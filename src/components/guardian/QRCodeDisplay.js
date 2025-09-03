/**
 * QR Code Display Component
 * Displays QR codes for guardian pickup authentication
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Clipboard from '@react-native-clipboard/clipboard';
const { width } = Dimensions.get('window');

const QRCodeDisplay = ({
  qrToken,
  qrUrl,
  guardianName,
  onRotateToken,
  showActions = true,
  size = 200,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [isRotating, setIsRotating] = useState(false);
  const qrRef = useRef(null);

  const styles = createStyles(theme);

  const handleCopyToken = async () => {
    try {
      await Clipboard.setString(qrToken);
      Alert.alert(t('success'), t('qrTokenCopied'));
    } catch (error) {
      console.error('Error copying QR token:', error);
      Alert.alert(t('error'), t('failedToCopyToken'));
    }
  };

  const handleCopyUrl = async () => {
    try {
      const urlToCopy =
        qrUrl || `https://school.com/pickup/qr/login?token=${qrToken}`;
      await Clipboard.setString(urlToCopy);
      Alert.alert(t('success'), t('qrUrlCopied'));
    } catch (error) {
      console.error('Error copying QR URL:', error);
      Alert.alert(t('error'), t('failedToCopyUrl'));
    }
  };

  const handleShareQR = async () => {
    try {
      console.log('🔄 Starting QR code sharing process...');
      console.log('📋 QR ref current:', qrRef.current);

      // Try to generate QR code as base64 PNG and share it
      if (qrRef.current) {
        console.log('✅ QR ref is available');
        console.log('🔍 Available methods:', Object.keys(qrRef.current));

        // Check if toDataURL method exists
        if (typeof qrRef.current.toDataURL === 'function') {
          console.log('✅ toDataURL method is available');

          qrRef.current.toDataURL((dataURL) => {
            console.log(
              '📸 Generated dataURL:',
              dataURL ? 'Success' : 'Failed'
            );
            console.log('📏 DataURL length:', dataURL ? dataURL.length : 0);
            console.log(
              '🔍 DataURL format check:',
              dataURL ? dataURL.substring(0, 50) : 'No data'
            );
            console.log(
              '🔍 Starts with data:image?',
              dataURL ? dataURL.startsWith('data:image') : false
            );
            console.log(
              '🔍 Starts with data:?',
              dataURL ? dataURL.startsWith('data:') : false
            );

            if (dataURL && dataURL.length > 0) {
              // The react-native-qrcode-svg library might return different formats
              // Let's try to share whatever format we get
              shareImageData(dataURL);
            } else {
              console.log('❌ No dataURL generated, falling back to text');
              shareAsText();
            }
          });
        } else {
          console.log(
            '❌ toDataURL method not available, checking other methods'
          );

          // Try alternative methods
          if (typeof qrRef.current.toSVG === 'function') {
            console.log('✅ toSVG method available, trying SVG approach');
            const svgString = qrRef.current.toSVG();
            console.log('📄 SVG generated:', svgString ? 'Success' : 'Failed');
            // For now, fall back to text since SVG to PNG conversion is complex
            await shareAsText();
          } else {
            console.log('❌ No suitable methods available, using text sharing');
            await shareAsText();
          }
        }
      } else {
        console.log('❌ QR ref not available, using text sharing');
        await shareAsText();
      }
    } catch (error) {
      console.error('❌ Error in handleShareQR:', error);
      await shareAsText();
    }
  };

  const shareImageData = async (dataURL) => {
    try {
      console.log('🖼️ Attempting to share image data...');
      console.log('📋 Raw dataURL format:', dataURL.substring(0, 100) + '...');

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        console.log('✅ Sharing is available');

        // Handle different data formats
        let processedDataURL = dataURL;
        let base64Data = '';

        if (dataURL.startsWith('data:image')) {
          console.log('✅ Standard data:image format detected');
          base64Data = dataURL.replace(/^data:image\/[a-z]+;base64,/, '');
          processedDataURL = dataURL;
        } else if (dataURL.startsWith('data:')) {
          console.log('✅ Data URI format detected');
          // Extract base64 part
          const base64Match = dataURL.match(/base64,(.+)$/);
          if (base64Match) {
            base64Data = base64Match[1];
            processedDataURL = `data:image/png;base64,${base64Data}`;
          } else {
            processedDataURL = dataURL;
          }
        } else {
          console.log('🔄 Raw base64 data detected, formatting as PNG');
          // Assume it's raw base64 data
          base64Data = dataURL;
          processedDataURL = `data:image/png;base64,${base64Data}`;
        }

        console.log('📋 Processed base64 data length:', base64Data.length);
        console.log(
          '📋 Final dataURL format:',
          processedDataURL.substring(0, 50) + '...'
        );

        // Share options
        const shareOptions = {
          mimeType: 'image/png',
          dialogTitle: `Guardian Pickup QR Code - ${guardianName}`,
          UTI: 'public.png',
        };

        console.log('📤 Attempting to share with options:', shareOptions);

        // Try multiple sharing approaches
        const sharingMethods = [
          // Method 1: Try React Native Share API (supports data URIs)
          async () => {
            console.log('🔄 Trying React Native Share API...');
            await Share.share({
              message: `Guardian Pickup QR Code for ${guardianName}`,
              url: processedDataURL,
              title: shareOptions.dialogTitle,
            });
          },
          // Method 2: Try expo-sharing with data URI (might work on some platforms)
          () => Sharing.shareAsync(processedDataURL, shareOptions),
          // Method 3: Try expo-sharing with minimal options
          () =>
            Sharing.shareAsync(processedDataURL, {
              dialogTitle: shareOptions.dialogTitle,
            }),
          // Method 4: Try expo-sharing with no options
          () => Sharing.shareAsync(processedDataURL),
        ];

        let shareSuccess = false;
        for (let i = 0; i < sharingMethods.length && !shareSuccess; i++) {
          try {
            console.log(`🔄 Trying sharing method ${i + 1}...`);
            await sharingMethods[i]();
            console.log(`✅ QR Code shared successfully with method ${i + 1}`);
            shareSuccess = true;
          } catch (methodError) {
            console.log(
              `⚠️ Sharing method ${i + 1} failed:`,
              methodError.message
            );
          }
        }

        if (!shareSuccess) {
          console.log('❌ All sharing methods failed, falling back to text');
          await shareAsText();
        }
      } else {
        console.log('❌ Image sharing not available, using text sharing');
        await shareAsText();
      }
    } catch (error) {
      console.error('❌ Error in shareImageData:', error);
      await shareAsText();
    }
  };

  const shareAsText = async () => {
    const urlToShare =
      qrUrl || `https://school.com/pickup/qr/login?token=${qrToken}`;
    const message = `Guardian Pickup QR Code for ${guardianName}\n\nToken: ${qrToken}\nURL: ${urlToShare}\n\nUse this QR code for school pickup authentication.`;

    await Share.share({
      message,
      title: 'Guardian Pickup QR Code',
    });
  };

  const handleRotateToken = async () => {
    if (!onRotateToken) return;

    Alert.alert(t('rotateQrToken'), t('rotateQrTokenConfirmation'), [
      {
        text: t('cancel'),
        style: 'cancel',
      },
      {
        text: t('rotate'),
        style: 'destructive',
        onPress: async () => {
          setIsRotating(true);
          try {
            await onRotateToken();
            Alert.alert(t('success'), t('qrTokenRotated'));
          } catch (error) {
            console.error('Error rotating QR token:', error);
            Alert.alert(t('error'), t('failedToRotateToken'));
          } finally {
            setIsRotating(false);
          }
        },
      },
    ]);
  };

  if (!qrToken) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('noQrTokenAvailable')}</Text>
        </View>
      </View>
    );
  }

  // Generate qrUrl if missing
  const finalQrUrl =
    qrUrl || `https://school.com/pickup/qr/login?token=${qrToken}`;

  // Debug logging
  console.log('🔍 QR CODE DEBUG - qrToken:', qrToken);
  console.log('🔍 QR CODE DEBUG - qrUrl:', qrUrl);
  console.log('🔍 QR CODE DEBUG - finalQrUrl:', finalQrUrl);

  return (
    <View style={styles.container}>
      {/* QR Code */}
      <View style={styles.qrContainer}>
        <QRCode
          value={finalQrUrl}
          size={size}
          color={theme.text}
          backgroundColor={theme.card}
          logo={null}
          logoSize={30}
          logoBackgroundColor='transparent'
          getRef={(c) => (qrRef.current = c)}
        />
      </View>

      {/* Guardian Name */}
      {guardianName && <Text style={styles.guardianName}>{guardianName}</Text>}

      {/* Token Display */}
      <View style={styles.tokenContainer}>
        <Text style={styles.tokenLabel}>{t('qrToken')}:</Text>
        <Text style={styles.tokenText}>{qrToken}</Text>
      </View>

      {/* Action Buttons */}
      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.copyButton]}
            onPress={handleCopyToken}
          >
            <Text style={styles.actionButtonText}>{t('copyToken')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShareQR}
          >
            <Text style={styles.actionButtonText}>{t('shareQr')}</Text>
          </TouchableOpacity>

          {onRotateToken && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rotateButton]}
              onPress={handleRotateToken}
              disabled={isRotating}
            >
              <Text style={styles.actionButtonText}>
                {isRotating ? t('rotating') : t('rotateToken')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>{t('howToUse')}:</Text>
        <Text style={styles.instructionsText}>
          1. {t('shareQrWithGuardian')}
        </Text>
        <Text style={styles.instructionsText}>
          2. {t('guardianScansAtSchool')}
        </Text>
        <Text style={styles.instructionsText}>
          3. {t('staffVerifiesIdentity')}
        </Text>
        <Text style={[styles.instructionsText, styles.lastInstructionText]}>
          4. {t('studentIsReleased')}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: 20,
      
    },
    qrContainer: {
      padding: 20,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      marginBottom: 16,
      ...theme.shadows.medium
    },
    guardianName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    tokenContainer: {
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
      width: '100%',
      maxWidth: 300,
      ...theme.shadows.small
    },
    tokenLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      fontWeight: '500',
    },
    tokenText: {
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: 'monospace',
      textAlign: 'center',
    },
    actionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    actionButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      minWidth: 100,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 8,
      marginVertical: 4,
    },
    copyButton: {
      backgroundColor: theme.colors.primary,
    },
    shareButton: {
      backgroundColor: theme.colors.success,
    },
    rotateButton: {
      backgroundColor: theme.colors.warning,
    },
    actionButtonText: {
      color: theme.colors.headerText,
      fontSize: 14,
      fontWeight: '600',
    },
    instructionsContainer: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
      borderRadius: 16,
      width: '100%',
      maxWidth: 350,
      alignSelf: 'center',
      maxHeight: 140
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    instructionsText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      lineHeight: 18,
    },
    lastInstructionText: {
      marginBottom: 0, // Remove bottom margin from last instruction
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
    },
  });

export default QRCodeDisplay;
