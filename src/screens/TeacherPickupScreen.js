import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faQrcode,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getResponsiveHeaderFontSize } from '../utils/commonStyles';
import {
  getStaffPickupRequests,
  staffPickupScanQr,
  staffPickupProcess,
} from '../services/staffService';

const TeacherPickupScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const authCode = route?.params?.authCode;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('waiting');
  const [qrToken, setQrToken] = useState('');
  const [processing, setProcessing] = useState(false);
  const [validatedGuardian, setValidatedGuardian] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);

  const styles = createStyles(theme);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getStaffPickupRequests(authCode, {
        status: statusFilter,
      });
      if (res?.success) {
        setRequests(res.requests || []);
      } else {
        console.log('Pickup list error:', res);
      }
    } catch (e) {
      console.error('Error loading pickup requests:', e);
      Alert.alert('Error', 'Failed to load pickup requests');
    } finally {
      setLoading(false);
    }
  }, [authCode, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Step 1: Validate QR immediately after scan
  const handleQRScanned = async (token) => {
    if (!token?.trim()) {
      Alert.alert('Invalid QR', 'QR token is empty or invalid.');
      return;
    }

    try {
      setProcessing(true);
      console.log('📱 PICKUP: Validating QR token:', token);

      const res = await staffPickupScanQr(token.trim(), authCode);

      if (!res?.success) {
        Alert.alert(
          'Scan Failed',
          res?.message || 'Invalid or inactive QR token'
        );
        setQrToken('');
        return;
      }

      const guardian = res.guardian;
      const student = res.student;
      const pending = res.pending_request;

      if (!pending?.request_id || !guardian?.card_id) {
        Alert.alert(
          'No Pending Request',
          'No pending pickup request found for this guardian.'
        );
        setQrToken('');
        return;
      }

      // Store validated data
      setQrToken(token.trim());
      setValidatedGuardian(guardian);
      setPendingRequest(pending);

      // Show guardian verification screen
      showGuardianVerification(guardian, student, pending);
    } catch (error) {
      console.error('❌ PICKUP QR Validation error:', error);
      Alert.alert(
        'Validation Error',
        'Failed to validate QR token. Please try again.'
      );
      setQrToken('');
    } finally {
      setProcessing(false);
    }
  };

  // Step 2: Show guardian info for staff verification
  const showGuardianVerification = (guardian, student, pending) => {
    const guardianInfo = `
Guardian: ${guardian.name || 'Unknown'}
Relation: ${guardian.relation || 'Unknown'}
Phone: ${guardian.phone || 'N/A'}

Student: ${student.name || 'Unknown'}
Classroom: ${student.classroom || 'N/A'}

Request Time: ${pending.created_at || 'Unknown'}
Distance: ${pending.distance || 'N/A'}`;

    Alert.alert('Verify Guardian Identity', guardianInfo, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          // Clear validated data
          setValidatedGuardian(null);
          setPendingRequest(null);
          setQrToken('');
        },
      },
      {
        text: 'Verify & Process Pickup',
        onPress: () => processVerifiedPickup(),
      },
    ]);
  };

  // Step 3: Process pickup after staff verification
  const processVerifiedPickup = async () => {
    if (!validatedGuardian || !pendingRequest) {
      Alert.alert('Error', 'Missing guardian or request information.');
      return;
    }

    try {
      setProcessing(true);
      console.log('📱 PICKUP: Processing verified pickup...');

      const result = await staffPickupProcess({
        authCode,
        guardian_card_id: validatedGuardian.card_id,
        request_id: pendingRequest.request_id,
        staff_notes: '', // Could add notes input later
      });

      if (result?.success) {
        Alert.alert(
          'Success',
          result?.message || 'Pickup processed successfully'
        );

        // Clear all data and refresh
        setQrToken('');
        setValidatedGuardian(null);
        setPendingRequest(null);
        loadRequests();
      } else {
        Alert.alert(
          'Processing Failed',
          result?.message || 'Failed to process pickup'
        );
      }
    } catch (error) {
      console.error('❌ PICKUP Processing error:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process pickup. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  // Manual QR token processing (for manual entry)
  const handleManualProcess = async () => {
    if (!qrToken?.trim()) {
      Alert.alert('QR Token', 'Enter a guardian QR token to validate.');
      return;
    }
    // Use the same validation flow as QR scan
    await handleQRScanned(qrToken.trim());
  };

  const renderItem = ({ item }) => {
    const student = item.student || {};
    const requester = item.requester || {};
    const info = item.request_info || {};
    const processingInfo = item.processing_info || {};

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.studentName}>{student.name || 'Student'}</Text>
          <Text style={styles.classroomText}>{student.classroom || ''}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.metaText}>
            Requester: {requester.type || '-'}
            {requester.name ? ` (${requester.name})` : ''}
          </Text>
          {!!requester.qr_token && (
            <Text style={[styles.metaText, styles.qrText]}>
              QR: {`${String(requester.qr_token).slice(0, 8)}...`}
            </Text>
          )}
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.metaText}>Created: {info.created_at || '-'}</Text>
          {!!info.distance && (
            <Text style={styles.metaText}>Distance: {info.distance}</Text>
          )}
        </View>
        {statusFilter === 'completed' && (
          <View style={styles.cardRow}>
            {!!processingInfo.processed_by_staff && (
              <Text style={[styles.metaText, { color: theme.colors.success }]}>
                Staff: {processingInfo.processed_by_staff}
              </Text>
            )}
            {!!processingInfo.staff_notes && (
              <Text
                style={[styles.metaText, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                Notes: {processingInfo.staff_notes}
              </Text>
            )}
          </View>
        )}
        {statusFilter === 'waiting' && (
          <TouchableOpacity
            style={styles.processButton}
            onPress={() => {
              if (requester.qr_token) {
                handleQRScanned(requester.qr_token);
              } else {
                Alert.alert(
                  'No QR Token',
                  'This request does not have a QR token available.'
                );
              }
            }}
          >
            <FontAwesomeIcon icon={faCheckCircle} color={'#fff'} size={14} />
            <Text style={styles.processButtonText}>Process</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} color={'#fff'} size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('pickupManagement') || 'Pickup Management'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* QR input */}
      <View style={styles.qrInputRow}>
        <TextInput
          placeholder={'Enter guardian QR token'}
          value={qrToken}
          onChangeText={setQrToken}
          style={styles.qrInput}
          autoCapitalize='none'
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => {
            navigation.navigate('TeacherQRScannerScreen', {
              onScanned: (token) => {
                if (token) handleQRScanned(String(token));
              },
            });
          }}
          disabled={processing}
        >
          <FontAwesomeIcon icon={faQrcode} color={'#fff'} size={16} />
          <Text style={styles.scanButtonText}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scanButton, { marginLeft: 8 }]}
          onPress={handleManualProcess}
          disabled={processing}
        >
          <Text style={styles.scanButtonText}>
            {processing ? 'Processing...' : 'Validate'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {['waiting', 'completed'].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[
              styles.filterChip,
              statusFilter === s && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === s && styles.filterChipTextActive,
              ]}
            >
              {s === 'waiting' ? 'Waiting' : 'Completed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={'large'} color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.request_id || Math.random())}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No requests</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#fff',
      fontSize: getResponsiveHeaderFontSize(3, 'Pickup'),
      fontWeight: 'bold',
    },
    qrInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      gap: 8,
      backgroundColor: theme.colors.surface,
    },
    qrInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.colors.text,
    },
    scanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
    },
    scanButtonText: { color: '#fff', fontWeight: '600' },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary + '15',
      borderColor: theme.colors.primary,
    },
    filterChipText: { color: theme.colors.textSecondary, fontWeight: '600' },
    filterChipTextActive: { color: theme.colors.primary },

    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    studentName: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    classroomText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    metaText: { fontSize: 12, color: theme.colors.textSecondary },
    qrText: { color: '#b58900' },

    processButton: {
      marginTop: 10,
      alignSelf: 'flex-end',
      flexDirection: 'row',
      gap: 6,
      backgroundColor: theme.colors.success,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },

    processButtonText: { color: '#fff', fontWeight: '700' },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: { padding: 24, alignItems: 'center' },
    emptyText: { color: theme.colors.textSecondary },
  });

export default TeacherPickupScreen;
