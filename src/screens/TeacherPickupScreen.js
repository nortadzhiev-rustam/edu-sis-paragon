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
import { createMediumShadow } from '../utils/commonStyles';
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

  const [qrToken, setQrToken] = useState('');
  const [processing, setProcessing] = useState(false);
  const [validatedGuardian, setValidatedGuardian] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('waiting'); // 'waiting' or 'processed'

  const styles = createStyles(theme);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      // Call API with status based on active tab
      const status = activeTab === 'waiting' ? 'waiting' : 'completed';
      const res = await getStaffPickupRequests(authCode, {
        status: status,
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
  }, [authCode, activeTab]);

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

      console.log(
        '📱 PICKUP: Full API response:',
        JSON.stringify(res, null, 2)
      );

      if (!res?.success) {
        console.log('📱 PICKUP: API returned failure:', res?.message);
        Alert.alert(
          'Scan Failed',
          res?.message || 'Invalid or inactive QR token'
        );
        setQrToken('');
        return;
      }

      const guardian = res.guardian;
      const pickupPerson = res.pickup_person;

      // Handle both API response formats:
      // - New format: res.pending_request (singular) + res.student (direct)
      // - Old format: res.pending_requests (plural array) with student inside
      let pending = null;
      let student = null;
      let pendingRequests = [];

      if (res.pending_request) {
        // New API format
        pending = res.pending_request;
        student = res.student;
        pendingRequests = [pending];
      } else if (res.pending_requests && res.pending_requests.length > 0) {
        // Old API format
        pendingRequests = res.pending_requests;
        pending = pendingRequests[0];
        student = pending?.student;
      }

      console.log(
        '📱 PICKUP: Guardian data:',
        JSON.stringify(guardian, null, 2)
      );
      console.log(
        '📱 PICKUP: Pickup person data:',
        JSON.stringify(pickupPerson, null, 2)
      );
      console.log('📱 PICKUP: Student data:', JSON.stringify(student, null, 2));
      console.log(
        '📱 PICKUP: Pending request data:',
        JSON.stringify(pending, null, 2)
      );
      console.log('📱 PICKUP: Total pending requests:', pendingRequests.length);

      // Additional debugging for validation issues
      console.log('📱 PICKUP: Validation debugging:');
      console.log('  - res.guardian exists:', !!guardian);
      console.log('  - res.pickup_person exists:', !!pickupPerson);
      console.log('  - res.pending_request exists:', !!res.pending_request);
      console.log('  - res.pending_requests exists:', !!res.pending_requests);
      console.log('  - res.student exists:', !!res.student);
      console.log('  - pending request exists:', !!pending);
      console.log('  - student exists:', !!student);

      // Check what's missing
      console.log('📱 PICKUP: Validation checks:');
      console.log('  - pending?.request_id:', pending?.request_id);
      console.log('  - pickupPerson?.auth_code:', pickupPerson?.auth_code);
      console.log('  - pickupPerson?.card_type:', pickupPerson?.card_type);

      // For parents, we only need request_id and auth_code
      // For guardians, we might need additional fields
      const isParent = pickupPerson?.card_type === 'parent';

      if (!pending?.request_id) {
        console.log('📱 PICKUP: Missing pending request');
        Alert.alert('No Pending Request', 'No pending pickup requests found.');
        setQrToken('');
        return;
      }

      // Validate required fields based on pickup person type
      if (isParent) {
        if (!pickupPerson?.auth_code) {
          console.log('📱 PICKUP: Missing parent auth code');
          Alert.alert(
            'Authentication Error',
            'Parent authentication information is missing.'
          );
          setQrToken('');
          return;
        }
      } else {
        // For guardians, check for card_id or similar identifier
        const hasGuardianId =
          pickupPerson?.card_id ||
          pickupPerson?.pickup_card_id ||
          pickupPerson?.guardian_card_id ||
          guardian?.card_id ||
          guardian?.pickup_card_id ||
          guardian?.guardian_card_id;

        console.log('📱 PICKUP: Guardian ID check:', {
          'pickupPerson.card_id': pickupPerson?.card_id,
          'guardian.card_id': guardian?.card_id,
          hasGuardianId: hasGuardianId,
        });

        if (!hasGuardianId) {
          console.log('📱 PICKUP: Missing guardian card ID');
          Alert.alert(
            'Authentication Error',
            'Guardian card information is missing.'
          );
          setQrToken('');
          return;
        }
      }

      console.log(
        '📱 PICKUP: Validation passed for',
        isParent ? 'parent' : 'guardian'
      );

      // Store validated data
      const combinedGuardianData = { ...guardian, ...pickupPerson };

      console.log(
        '📱 PICKUP: Setting state with combined data:',
        JSON.stringify(combinedGuardianData, null, 2)
      );
      console.log(
        '📱 PICKUP: Setting pending request:',
        JSON.stringify(pending, null, 2)
      );

      setQrToken(token.trim());
      setValidatedGuardian(combinedGuardianData);
      setPendingRequest(pending);

      // Show guardian verification screen with the actual data (not relying on state)
      showGuardianVerification(combinedGuardianData, student, pending);
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

Request Time: ${pending.request_time || pending.created_at || 'Unknown'}
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
        onPress: () => processVerifiedPickup(guardian, pending),
      },
    ]);
  };

  // Step 3: Process pickup after staff verification
  const processVerifiedPickup = async (
    guardianData = null,
    requestData = null
  ) => {
    console.log('📱 PICKUP: Processing verified pickup...');

    // Use passed parameters or fall back to state
    const guardian = guardianData || validatedGuardian;
    const request = requestData || pendingRequest;

    console.log('📱 PICKUP: Guardian data:', JSON.stringify(guardian, null, 2));
    console.log('📱 PICKUP: Request data:', JSON.stringify(request, null, 2));

    if (!guardian || !request) {
      console.log(
        '📱 PICKUP: Missing data - guardian:',
        !!guardian,
        'request:',
        !!request
      );
      Alert.alert('Error', 'Missing guardian or request information.');
      return;
    }

    // Additional validation for required fields
    if (!request.request_id) {
      console.log('📱 PICKUP: Missing request_id in request data');
      Alert.alert('Error', 'Missing pickup request ID.');
      return;
    }

    const isParent = guardian.card_type === 'parent';
    if (isParent && !guardian.auth_code) {
      console.log('📱 PICKUP: Missing auth_code for parent');
      Alert.alert('Error', 'Missing parent authentication code.');
      return;
    }

    if (
      !isParent &&
      !guardian.card_id &&
      !guardian.pickup_card_id &&
      !guardian.guardian_card_id
    ) {
      console.log('📱 PICKUP: Missing card_id for guardian');
      Alert.alert('Error', 'Missing guardian card ID.');
      return;
    }

    try {
      setProcessing(true);
      console.log('📱 PICKUP: Processing verified pickup...');

      // For parents, use auth_code as the identifier
      // For guardians, use card_id or similar
      const isParent = guardian.card_type === 'parent';

      let requestPayload = {
        authCode,
        request_id: request.request_id,
        staff_notes: '', // Could add notes input later
      };

      if (isParent) {
        // For parents, send parent_auth_code instead of guardian_card_id
        const parentAuthCode =
          guardian.auth_code || guardian.parent_info?.user_id;
        requestPayload.parent_auth_code = parentAuthCode;

        console.log('📱 PICKUP: Processing for parent');
        console.log('📱 PICKUP: Using parent_auth_code:', parentAuthCode);
      } else {
        // For guardians, use traditional guardian_card_id
        const guardianCardId =
          guardian.card_id ||
          guardian.pickup_card_id ||
          guardian.guardian_card_id;
        requestPayload.guardian_card_id = guardianCardId;

        console.log('📱 PICKUP: Processing for guardian');
        console.log('📱 PICKUP: Using guardian_card_id:', guardianCardId);
      }

      const result = await staffPickupProcess(requestPayload);

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

  // Handle tab change and reload data
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Data will be reloaded automatically due to useEffect dependency on activeTab
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.navigationHeader}>
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
        <Text style={styles.headerTitle}>
          {t('pickupManagement') || 'Pickup Management'}
        </Text>
      </View>

      {/* Tab Bar in Header */}
      <View style={styles.headerTabBar}>
        <TouchableOpacity
          style={[
            styles.headerTabButton,
            activeTab === 'waiting' && styles.activeHeaderTabButton,
          ]}
          onPress={() => handleTabChange('waiting')}
        >
          <Text
            style={[
              styles.headerTabButtonText,
              activeTab === 'waiting' && styles.activeHeaderTabButtonText,
            ]}
          >
            {t('waiting') || 'Waiting'} (
            {activeTab === 'waiting' ? requests.length : '...'})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.headerTabButton,
            activeTab === 'processed' && styles.activeHeaderTabButton,
          ]}
          onPress={() => handleTabChange('processed')}
        >
          <Text
            style={[
              styles.headerTabButtonText,
              activeTab === 'processed' && styles.activeHeaderTabButtonText,
            ]}
          >
            {t('processed') || 'Processed'} (
            {activeTab === 'processed' ? requests.length : '...'})
          </Text>
        </TouchableOpacity>
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
          style={[styles.scanButton]}
          onPress={handleManualProcess}
          disabled={processing}
        >
          <Text style={styles.scanButtonText}>
            {processing ? 'Processing...' : 'Validate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        {(item.status === 'processed' || item.status === 'completed') && (
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
        {(item.status === 'waiting' || item.status === 'pending') && (
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
      {renderHeader()}

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
              <Text style={styles.emptyText}>
                {activeTab === 'waiting'
                  ? 'No waiting requests'
                  : 'No processed requests'}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      overflow: 'visible',
    },
    headerContainer: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingBottom: 16,
      marginHorizontal: 16,
      borderRadius: 16,
      ...createMediumShadow(theme),
      overflow: 'visible',
      zIndex: 9998,
    },
    navigationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 8,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.headerText,
    },
    // Header Tab Bar Styles
    headerTabBar: {
      flexDirection: 'row',
      marginTop: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
      padding: 4,
    },
    headerTabButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
      borderRadius: 6,
    },
    activeHeaderTabButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerTabButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.headerText,
      opacity: 0.8,
    },
    activeHeaderTabButtonText: {
      opacity: 1,
      fontWeight: '600',
    },
    qrInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      padding: 4,
      gap: 8,
      backgroundColor: theme.colors.surface + '20',
      borderRadius: 12,
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
      backgroundColor: theme.colors.surface + '20',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
    },
    scanButtonText: { color: '#fff', fontWeight: '600' },

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
