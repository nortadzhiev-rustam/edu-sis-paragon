/**
 * Guardian Pickup Request Screen
 * Allows guardians to create pickup requests for their assigned student
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
  createGuardianPickupRequest,
  validatePickupRequest,
} from '../services/pickupRequestService';
import {
  requestLocationPermission,
  formatDistance,
  getCurrentLocation,
} from '../services/locationService';

// Components
import PickupRequestMap from '../components/PickupRequestMap';

const GuardianPickupRequestScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();

  // Get auth code and child info from route params
  const { authCode, child, guardian } = route.params || {};

  const styles = createStyles(theme);

  // State management
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [canMakeRequest, setCanMakeRequest] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);

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

      // Get initial location
      await getInitialLocation();

      // Validate pickup request eligibility
      await validateRequest();
    } catch (error) {
      console.error('❌ GUARDIAN PICKUP: Error loading initial data:', error);
      Alert.alert(
        'Error',
        'Failed to load pickup request data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getInitialLocation = async () => {
    try {
      console.log('📍 GUARDIAN PICKUP: Getting initial location...');
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        console.log('✅ GUARDIAN PICKUP: Initial location set:', location);
      }
    } catch (error) {
      console.error(
        '❌ GUARDIAN PICKUP: Error getting initial location:',
        error
      );
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
      console.error('❌ GUARDIAN PICKUP: Error validating request:', error);
      setCanMakeRequest(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await validateRequest();
    } catch (error) {
      console.error('❌ GUARDIAN PICKUP: Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLocationUpdate = async () => {
    try {
      console.log('🔄 GUARDIAN PICKUP: Updating location...');

      // Get fresh location
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        console.log('✅ GUARDIAN PICKUP: Location updated:', location);
      }

      // Also validate the request with new location
      await validateRequest();
    } catch (error) {
      console.error('❌ GUARDIAN PICKUP: Error updating location:', error);
    }
  };

  const toggleMapView = () => {
    setShowMap(!showMap);
  };

  const handleCreatePickupRequest = async () => {
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

      const response = await createGuardianPickupRequest(authCode);

      if (response.success) {
        Alert.alert('Pickup Request Created', response.message, [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error(response.message || 'Failed to create pickup request');
      }
    } catch (error) {
      console.error('❌ GUARDIAN PICKUP: Error creating request:', error);
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

  const renderStudentInfo = () => {
    if (!child) return null;

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <FontAwesome5
            name='user-graduate'
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.studentTitle}>Student Information</Text>
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {child.student_name || child.name}
          </Text>
          <Text style={styles.studentDetails}>
            Student ID: {child.student_id}
          </Text>
          {(child.classroom_name || child.class_name) && (
            <Text style={styles.studentDetails}>
              Class: {child.classroom_name || child.class_name}
            </Text>
          )}
          {child.branch_name && (
            <Text style={styles.studentDetails}>
              Division: {child.branch_name}
            </Text>
          )}
          {child.academic_year && (
            <Text style={styles.studentDetails}>
              Academic Year: {child.academic_year}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderGuardianInfo = () => {
    if (!guardian) return null;

    return (
      <View style={styles.guardianCard}>
        <View style={styles.guardianHeader}>
          <FontAwesome5 name='id-card' size={20} color={theme.colors.primary} />
          <Text style={styles.guardianTitle}>Guardian Information</Text>
        </View>

        <View style={styles.guardianInfo}>
          <Text style={styles.guardianName}>{guardian.name}</Text>
          <Text style={styles.guardianDetails}>
            Relation: {guardian.relation}
          </Text>
          {guardian.phone && (
            <Text style={styles.guardianDetails}>Phone: {guardian.phone}</Text>
          )}
        </View>
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
          {renderStudentInfo()}
          {renderGuardianInfo()}

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <FontAwesome5
              name='info-circle'
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.instructionsText}>
              You must be within 150 meters of the school campus to create a
              pickup request. Make sure your location services are enabled and
              you have a clear GPS signal.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Create Request Button - Always visible */}
      <TouchableOpacity
        style={[
          styles.createButton,
          {
            backgroundColor: canMakeRequest
              ? theme.colors.primary
              : theme.colors.disabled,
          },
        ]}
        onPress={handleCreatePickupRequest}
        disabled={!canMakeRequest || loading}
      >
        {loading ? (
          <ActivityIndicator size='small' color='#fff' />
        ) : (
          <>
            <FontAwesome5
              name='car'
              size={16}
              color={canMakeRequest ? '#fff' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.createButtonText,
                {
                  color: canMakeRequest ? '#fff' : theme.colors.textSecondary,
                },
              ]}
            >
              Create Pickup Request
            </Text>
          </>
        )}
      </TouchableOpacity>
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
    studentCard: {
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
    studentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    studentTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
      color: theme.colors.text,
    },
    studentInfo: {
      marginLeft: 4,
    },
    studentName: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 4,
      color: theme.colors.text,
    },
    studentDetails: {
      fontSize: 14,
      marginBottom: 2,
      color: theme.colors.textSecondary,
    },
    guardianCard: {
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
    guardianHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    guardianTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
      color: theme.colors.text,
    },
    guardianInfo: {
      marginLeft: 4,
    },
    guardianName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      color: theme.colors.text,
    },
    guardianDetails: {
      fontSize: 14,
      marginBottom: 2,
      color: theme.colors.textSecondary,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      margin: 16,
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    instructionsCard: {
      backgroundColor: theme.colors.card,
      flexDirection: 'row',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    instructionsText: {
      fontSize: 12,
      marginLeft: 8,
      flex: 1,
      lineHeight: 16,
      color: theme.colors.textSecondary,
    },
  });

export default GuardianPickupRequestScreen;
