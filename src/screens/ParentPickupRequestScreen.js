/**
 * Parent Pickup Request Screen
 * Allows parents to create pickup requests for their children
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';

// Context and utilities
import { useTheme } from '../contexts/ThemeContext';

// Services
import {
  createParentPickupRequest,
  createMultipleParentPickupRequests,
  validatePickupRequest,
  generateParentPickupQR,
  getPendingPickupRequests,
} from '../services/pickupRequestService';
import { getParentChildren } from '../services/parentService';
import {
  requestLocationPermission,
  formatDistance,
  getCurrentLocation,
} from '../services/locationService';

// Components
import PickupRequestMap from '../components/PickupRequestMap';
import PickupQRCodeModal from '../components/PickupQRCodeModal';

const ParentPickupRequestScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();

  // Get auth code from route params
  const { authCode } = route.params || {};

  const styles = createStyles(theme);

  // State management
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState([]);
  const [selectedChildren, setSelectedChildren] = useState(new Set());
  const [selectedChild, setSelectedChild] = useState(null); // Keep for backward compatibility
  const [pendingRequests, setPendingRequests] = useState([]);
  const [locationStatus, setLocationStatus] = useState(null);
  const [canMakeRequest, setCanMakeRequest] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [parentInfo, setParentInfo] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Request location permission
      const locationPermission = await requestLocationPermission();
      if (!locationPermission) {
        Alert.alert(
          'Location Required',
          'Location access is required for pickup requests. Please enable location services.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Load children data
      await loadChildren();

      // Load pending requests
      await loadPendingRequests();

      // Get initial location
      await getInitialLocation();

      // Validate pickup request eligibility
      await validateRequest();
    } catch (error) {
      console.error('❌ PARENT PICKUP: Error loading initial data:', error);
      Alert.alert(
        'Error',
        'Failed to load pickup request data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async () => {
    try {
      const response = await getParentChildren(authCode);
      if (response.success && response.children) {
        setChildren(response.children);
        // Auto-select if only one child
        if (response.children.length === 1) {
          setSelectedChild(response.children[0]);
        }
      }
    } catch (error) {
      console.error('❌ PARENT PICKUP: Error loading children:', error);
      throw error;
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await getPendingPickupRequests(authCode);
      if (response.success && response.pending_requests) {
        setPendingRequests(response.pending_requests);
        if (response.parent_info) {
          setParentInfo(response.parent_info);
        }
      }
    } catch (error) {
      console.error('❌ PARENT PICKUP: Error loading pending requests:', error);
      // Don't throw error as this is not critical for the main functionality
    }
  };

  const getInitialLocation = async () => {
    try {
      console.log('📍 PARENT PICKUP: Getting initial location...');
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        console.log('✅ PARENT PICKUP: Initial location set:', location);
      }
    } catch (error) {
      console.error('❌ PARENT PICKUP: Error getting initial location:', error);
    }
  };

  const validateRequest = async () => {
    try {
      const validation = await validatePickupRequest(authCode);
      setLocationStatus(validation);
      setCanMakeRequest(validation.canRequest);

      // Store current location for map display
      if (validation.location) {
        setCurrentLocation(validation.location);
      }
    } catch (error) {
      console.error('❌ PARENT PICKUP: Error validating request:', error);
      setCanMakeRequest(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await validateRequest();
      await loadPendingRequests();
    } catch (error) {
      console.error('❌ PARENT PICKUP: Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLocationUpdate = async () => {
    try {
      console.log('🔄 PARENT PICKUP: Updating location...');

      // Get fresh location
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        console.log('✅ PARENT PICKUP: Location updated:', location);
      }

      // Also validate the request with new location
      await validateRequest();
    } catch (error) {
      console.error('❌ PARENT PICKUP: Error updating location:', error);
    }
  };

  const toggleMapView = () => {
    setShowMap(!showMap);
  };

  const handleChildSelection = (child) => {
    setSelectedChild(child);
  };

  const handleMultipleChildSelection = (childId) => {
    const newSelection = new Set(selectedChildren);
    if (newSelection.has(childId)) {
      newSelection.delete(childId);
    } else {
      newSelection.add(childId);
    }
    setSelectedChildren(newSelection);
  };

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      const response = await generateParentPickupQR(authCode);

      if (response.success) {
        setQrData(response);
        setShowQRModal(true);
      } else {
        throw new Error(response.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('❌ PARENT PICKUP: Error generating QR:', error);
      Alert.alert(
        'QR Generation Failed',
        error.message || 'Failed to generate QR code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePendingRequestPress = (request) => {
    const requestTime = request.created_at || request.request_time;
    const displayTime =
      requestTime && requestTime.includes(':')
        ? requestTime
        : new Date(requestTime).toLocaleTimeString();

    Alert.alert(
      'Pending Pickup Request',
      `Request for ${request.student_name}\nTime: ${displayTime}\nStatus: ${request.status}\nDistance: ${request.distance}`,
      [
        {
          text: 'Generate QR Code',
          onPress: () => handleGenerateQR(),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCreatePickupRequest = async () => {
    const selectedChildrenArray = Array.from(selectedChildren);

    // Check if any children are selected (either new multi-select or legacy single select)
    if (selectedChildrenArray.length === 0 && !selectedChild) {
      Alert.alert(
        'Select Child',
        'Please select at least one child for the pickup request.'
      );
      return;
    }

    if (!canMakeRequest) {
      Alert.alert(
        'Cannot Create Request',
        locationStatus?.message ||
          'You are not eligible to create a pickup request at this time.'
      );
      return;
    }

    try {
      setLoading(true);

      let response;

      // Use multiple pickup request if multiple children selected
      if (selectedChildrenArray.length > 1) {
        response = await createMultipleParentPickupRequests(
          authCode,
          selectedChildrenArray
        );

        if (response.success) {
          // Show summary of results
          const { summary } = response;
          Alert.alert(
            'Pickup Requests Created',
            `Successfully created ${summary.successful} pickup requests${
              summary.failed > 0 ? ` (${summary.failed} failed)` : ''
            }`,
            [
              {
                text: 'Generate QR Code',
                onPress: () => handleGenerateQR(),
              },
              {
                text: 'OK',
                onPress: () => {
                  // Refresh pending requests
                  loadPendingRequests();
                },
              },
            ]
          );
        }
      } else {
        // Single child pickup request (legacy support)
        const studentId =
          selectedChildrenArray.length > 0
            ? selectedChildrenArray[0]
            : selectedChild.student_id;

        response = await createParentPickupRequest(authCode, studentId);

        if (response.success) {
          Alert.alert('Pickup Request Created', response.message, [
            {
              text: 'Generate QR Code',
              onPress: () => handleGenerateQR(),
            },
            {
              text: 'OK',
              onPress: () => {
                // Refresh pending requests
                loadPendingRequests();
              },
            },
          ]);
        }
      }

      if (!response.success) {
        throw new Error(response.message || 'Failed to create pickup request');
      }
    } catch (error) {
      console.error('❌ PARENT PICKUP: Error creating request:', error);
      Alert.alert(
        'Request Failed',
        error.message || 'Failed to create pickup request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderLocationStatus = () => {
    if (!locationStatus) return null;

    const statusColor = canMakeRequest ? '#34C759' : '#FF3B30';
    const statusIcon = canMakeRequest ? 'check-circle' : 'exclamation-triangle';

    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <FontAwesome5
            name='map-marker-alt'
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.statusTitle}>Location Status</Text>
        </View>

        {/* School Information */}
        {locationStatus.schoolLocation && (
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>
              📍 {locationStatus.schoolLocation.branch_name}
            </Text>
            {locationStatus.schoolLocation.address && (
              <Text style={styles.schoolAddress}>
                {locationStatus.schoolLocation.address}
              </Text>
            )}
            <Text style={styles.pickupRadius}>
              Pickup radius:{' '}
              {locationStatus.schoolLocation.pickup_radius_meters || 150}m
            </Text>
          </View>
        )}

        <View style={styles.statusContent}>
          <FontAwesome5 name={statusIcon} size={16} color={statusColor} />
          <Text style={[styles.statusMessage, { color: statusColor }]}>
            {locationStatus.message}
          </Text>
        </View>

        {locationStatus.distance && (
          <Text style={styles.distanceText}>
            Distance: {formatDistance(locationStatus.distance)}
          </Text>
        )}
      </View>
    );
  };

  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) return null;

    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Pending Pickup Requests</Text>
        <Text style={styles.sectionSubtitle}>
          Tap on a request to generate QR code for staff verification
        </Text>

        {pendingRequests.map((request) => (
          <TouchableOpacity
            key={request.request_id}
            style={styles.pendingRequestItem}
            onPress={() => handlePendingRequestPress(request)}
          >
            <View style={styles.pendingRequestInfo}>
              <Text style={styles.pendingRequestName}>
                {request.student_name}
              </Text>
              <Text style={styles.pendingRequestDetails}>
                Request Time:{' '}
                {request.created_at ||
                  new Date(request.request_time).toLocaleTimeString()}
              </Text>
              <Text style={styles.pendingRequestStatus}>
                Status: {request.status} • Distance: {request.distance}
              </Text>
            </View>
            <View style={styles.pendingRequestActions}>
              <FontAwesome5
                name='qrcode'
                size={20}
                color={theme.colors.primary}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderChildSelection = () => {
    if (children.length === 0) return null;

    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Select Child for Pickup</Text>
        <Text style={styles.sectionSubtitle}>
          {children.length > 1
            ? 'Select multiple children for batch pickup'
            : 'Select your child'}
        </Text>

        {children.map((child) => {
          const isSelected =
            selectedChildren.has(child.student_id) ||
            selectedChild?.student_id === child.student_id;

          return (
            <TouchableOpacity
              key={child.student_id}
              style={[
                styles.childOption,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary + '20'
                    : theme.colors.card,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={() => {
                if (children.length > 1) {
                  handleMultipleChildSelection(child.student_id);
                } else {
                  handleChildSelection(child);
                }
              }}
            >
              <View style={styles.childInfo}>
                <Text
                  style={[
                    styles.childName,
                    {
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.text,
                    },
                  ]}
                >
                  {child.student_name || child.name}
                </Text>
                <Text
                  style={[
                    styles.childDetails,
                    {
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  Class: {child.classroom_name || child.class_name}
                  {child.branch_name && ` • ${child.branch_name}`}
                </Text>
              </View>

              {isSelected && (
                <FontAwesome5
                  name={children.length > 1 ? 'check-square' : 'check'}
                  size={16}
                  color={theme.colors.primary}
                />
              )}

              {!isSelected && children.length > 1 && (
                <FontAwesome5
                  name='square'
                  size={16}
                  color={theme.colors.border}
                />
              )}
            </TouchableOpacity>
          );
        })}

        {children.length > 1 && selectedChildren.size > 0 && (
          <View style={styles.selectionSummary}>
            <Text style={styles.selectionSummaryText}>
              {selectedChildren.size} child
              {selectedChildren.size > 1 ? 'ren' : ''} selected
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading pickup request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <FontAwesome5
            name='arrow-left'
            size={20}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup Request</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={toggleMapView} style={styles.headerButton}>
            <FontAwesome5
              name={showMap ? 'list' : 'map'}
              size={18}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
            <FontAwesome5
              name='sync-alt'
              size={18}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
        </View>
      </View>

      {showMap ? (
        <View style={styles.mapContainer}>
          <PickupRequestMap
            userLocation={currentLocation}
            schoolLocation={locationStatus?.schoolLocation}
            locationStatus={locationStatus}
            onLocationUpdate={handleLocationUpdate}
            style={styles.map}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {renderLocationStatus()}
          {renderPendingRequests()}
          {renderChildSelection()}
        </ScrollView>
      )}

      {/* Create Request Button - Always visible */}
      <TouchableOpacity
        style={[
          styles.createButton,
          {
            backgroundColor:
              canMakeRequest && (selectedChild || selectedChildren.size > 0)
                ? theme.colors.primary
                : theme.colors.disabled,
          },
        ]}
        onPress={handleCreatePickupRequest}
        disabled={
          !canMakeRequest ||
          (!selectedChild && selectedChildren.size === 0) ||
          loading
        }
      >
        {loading ? (
          <ActivityIndicator size='small' color='#fff' />
        ) : (
          <>
            <FontAwesome5
              name='car'
              size={16}
              color={
                canMakeRequest && selectedChildren.size > 0
                  ? theme.colors.headerText
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.createButtonText,
                {
                  color:
                    canMakeRequest && selectedChildren.size > 0
                      ? theme.colors.headerText
                      : theme.colors.textSecondary,
                },
              ]}
            >
              Create Pickup Request
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* QR Code Modal */}
      <PickupQRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrData={qrData}
        parentInfo={parentInfo || qrData?.parent_info}
        childrenData={qrData?.children || []}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    header: {
      backgroundColor: theme.colors.headerBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      elevation: 2,
      ...theme.shadows.small,
      marginHorizontal: 16,
      borderRadius: 16,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.headerText,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      padding: 8,
      marginLeft: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    statusCard: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
      color: theme.colors.text,
    },
    statusContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusMessage: {
      fontSize: 14,
      marginLeft: 8,
      flex: 1,
    },
    distanceText: {
      fontSize: 12,
      fontStyle: 'italic',
      color: theme.colors.textSecondary,
    },
    schoolInfo: {
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    schoolName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    schoolAddress: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    pickupRadius: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    mapContainer: {
      flex: 1,
      margin: 16,
    },
    map: {
      flex: 1,
      minHeight: 300,
    },
    sectionCard: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      color: theme.colors.text,
    },
    childOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
    },
    childInfo: {
      flex: 1,
    },
    childName: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    childDetails: {
      fontSize: 14,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 16,
      marginHorizontal: 16,
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    pendingRequestItem: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    pendingRequestInfo: {
      flex: 1,
    },
    pendingRequestName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    pendingRequestDetails: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    pendingRequestStatus: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    pendingRequestActions: {
      marginLeft: 12,
    },
    selectionSummary: {
      backgroundColor: theme.colors.primary + '10',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      alignItems: 'center',
    },
    selectionSummaryText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
  });

export default ParentPickupRequestScreen;
