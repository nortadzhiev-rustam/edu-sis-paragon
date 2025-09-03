import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, Camera } from 'expo-camera';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faQrcode,
  faBolt,
  faImage,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

const { width, height } = Dimensions.get('window');

const TeacherQRScannerScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { onScanned } = route.params || {};

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;

    setScanned(true);

    try {
      console.log('📱 QR SCANNER: Scanned QR code:', data);

      // Extract token from QR code data
      let token = data;

      // If it's a full URL, extract the token parameter
      if (data.includes('token=')) {
        console.log('📱 QR SCANNER: Found URL with token parameter');
        const urlParams = new URLSearchParams(data.split('?')[1]);
        token = urlParams.get('token');
        console.log('📱 QR SCANNER: Extracted token:', token);
      } else {
        console.log('📱 QR SCANNER: Using raw data as token:', token);
      }

      if (!token) {
        throw new Error('Invalid QR code format');
      }

      // Call the callback with the scanned token
      if (onScanned) {
        onScanned(token);
      }

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('❌ QR SCANNER: Scan error:', error);
      Alert.alert(
        t('scanFailed') || 'Scan Failed',
        error.message || t('invalidQrCode') || 'Invalid QR Code',
        [
          {
            text: t('tryAgain') || 'Try Again',
            onPress: () => {
              setScanned(false);
            },
          },
        ]
      );
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const handleManualEntry = () => {
    Alert.prompt(
      t('enterQrToken') || 'Enter QR Token',
      t('enterQrTokenManually') || 'Enter the QR token manually',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('submit') || 'Submit',
          onPress: (token) => {
            if (token && token.trim()) {
              if (onScanned) {
                onScanned(token.trim());
              }
              navigation.goBack();
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>
            {t('requestingCameraPermission') ||
              'Requesting camera permission...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <FontAwesomeIcon
            icon={faQrcode}
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.messageTitle}>
            {t('cameraPermissionRequired') || 'Camera Permission Required'}
          </Text>
          <Text style={styles.messageText}>
            {t('cameraPermissionMessage') ||
              'Please grant camera permission to scan QR codes'}
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={getCameraPermissions}
          >
            <Text style={styles.permissionButtonText}>
              {t('grantPermission') || 'Grant Permission'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={handleManualEntry}
          >
            <Text style={styles.manualButtonText}>
              {t('enterManually') || 'Enter Manually'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.navigationHeader}>
          <View style={styles.headerLeft}>
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
            <Text style={styles.headerTitle}>
              {t('scanQrCode') || 'Scan QR Code'}
            </Text>
          </View>
        </View>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing='back'
          enableTorch={flashOn}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417'],
          }}
        />

        {/* Scanning Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.scanCorner} />
            <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
            <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
            <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
          <FontAwesomeIcon
            icon={faBolt}
            size={24}
            color={flashOn ? theme.colors.warning : theme.colors.textSecondary}
          />
          <Text style={styles.controlButtonText}>{t('flash') || 'Flash'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleManualEntry}
        >
          <FontAwesomeIcon
            icon={faImage}
            size={24}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.controlButtonText}>
            {t('manual') || 'Manual'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          {t('qrScannerInstructions') ||
            'Position the QR code within the frame to scan automatically'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    // Header Styles
    headerContainer: {
      backgroundColor: theme.colors.surface,
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
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.headerText,
      marginLeft: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraContainer: {
      flex: 1,
      position: 'relative',
    },
    camera: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanArea: {
      width: 250,
      height: 250,
      position: 'relative',
    },
    scanCorner: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderColor: theme.colors.primary,
      borderWidth: 4,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      top: 0,
      left: 0,
    },
    scanCornerTopRight: {
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
      top: 0,
      right: 0,
      left: 'auto',
    },
    scanCornerBottomLeft: {
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderTopWidth: 0,
      borderRightWidth: 0,
      bottom: 0,
      left: 0,
      top: 'auto',
    },
    scanCornerBottomRight: {
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderTopWidth: 0,
      borderLeftWidth: 0,
      bottom: 0,
      right: 0,
      top: 'auto',
      left: 'auto',
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 20,
      backgroundColor: theme.colors.surface,
    },
    controlButton: {
      alignItems: 'center',
      padding: 10,
    },
    controlButtonText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    instructions: {
      padding: 20,
      backgroundColor: theme.colors.card,
    },
    instructionsText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    messageTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 20,
      marginBottom: 12,
      textAlign: 'center',
    },
    messageText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    permissionButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    permissionButtonText: {
      color: theme.colors.headerText,
      fontSize: 16,
      fontWeight: '600',
    },
    manualButton: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    manualButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
  });

export default TeacherQRScannerScreen;
