import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';

const QRScannerModal = ({ visible, onClose, onScanned }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [permission, requestPermission] = useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (visible && permission && permission.granted === false && !isRequesting) {
      setIsRequesting(true);
      requestPermission().finally(() => setIsRequesting(false));
    }
  }, [visible, permission, requestPermission, isRequesting]);

  const handleBarcodeScanned = ({ data, type }) => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;
    if (onScanned) onScanned(data, type);
  };

  const cameraContent = () => {
    if (!permission) {
      return (
        <View style={styles.centered}> 
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.infoText}>Requesting camera permission...</Text>
        </View>
      );
    }
    if (!permission.granted) {
      return (
        <View style={styles.centered}>
          <Text style={styles.infoText}>Camera permission is required to scan QR codes.</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => requestPermission()}>
            <Text style={styles.actionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
      </CameraView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesomeIcon icon={faTimes} color={'#fff'} size={18} />
          </TouchableOpacity>
        </View>

        {/* Camera */}
        <View style={styles.cameraContainer}>{cameraContent()}</View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Align the QR code within the frame to scan</Text>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
      height: 56,
      backgroundColor: theme.colors.headerBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraContainer: { flex: 1 },
    camera: { flex: 1 },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanArea: {
      width: '70%',
      height: '35%',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 12,
      backgroundColor: 'transparent',
    },
    footer: {
      padding: 12,
      backgroundColor: '#000',
    },
    footerText: { color: '#fff', textAlign: 'center' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    infoText: { color: '#fff', marginTop: 10 },
    actionButton: { marginTop: 12, backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
    actionButtonText: { color: '#fff', fontWeight: '700' },
  });

export default QRScannerModal;

