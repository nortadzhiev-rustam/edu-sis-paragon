/**
 * Guardian & Pickup Management Screen
 * Unified screen combining guardian management and pickup request functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faPlus } from '@fortawesome/free-solid-svg-icons';

// Services
import guardianService from '../services/guardianService';
import {
  createParentPickupRequest,
  getPendingPickupRequests,
  validatePickupRequest,
  generateParentPickupQR,
} from '../services/pickupRequestService';
import {
  requestLocationPermission,
  getCurrentLocation,
} from '../services/locationService';

// Components
import { GuardianCard } from '../components/guardian';
import {
  QuickActionsGrid,
  PickupStatusCard,
  LocationStatusBanner,
  GuardianEmptyState,
} from '../components/guardian/GuardianPickupComponents';
import PickupRequestMap from '../components/PickupRequestMap';
import PickupQRCodeModal from '../components/PickupQRCodeModal';
import { createMediumShadow } from '../utils/commonStyles';

const GuardianPickupManagementScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Route params
  const { authCode, children, selectedChildId } = route.params || {};

  // State
  const [guardians, setGuardians] = useState([]);
  const [pendingPickups, setPendingPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [canMakeRequest, setCanMakeRequest] = useState(false);
  const [activeTab, setActiveTab] = useState('guardians'); // 'guardians' or 'pickup'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);

  const styles = createStyles(theme);

  // Initialize selected child
  useEffect(() => {
    console.log('🔄 GUARDIAN-PICKUP: Initializing selected child...');
    console.log('🔄 GUARDIAN-PICKUP: selectedChildId:', selectedChildId);
    console.log('🔄 GUARDIAN-PICKUP: children:', children);

    if (selectedChildId && children) {
      const child = children.find((c) => c.id === selectedChildId);
      console.log('🔄 GUARDIAN-PICKUP: Found child by ID:', child);
      setSelectedChild(child || children[0]);
    } else if (children && children.length > 0) {
      console.log(
        '🔄 GUARDIAN-PICKUP: Setting first child as default:',
        children[0]
      );
      setSelectedChild(children[0]);
    }
  }, [selectedChildId, children]);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [authCode, selectedChild])
  );

  const loadAllData = async () => {
    if (!authCode) {
      Alert.alert(t('error'), 'Authentication required');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      await Promise.all([
        fetchGuardians(),
        fetchPendingPickups(),
        validatePickupEligibility(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(t('error'), 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuardians = async () => {
    return await fetchGuardiansForChild(selectedChild);
  };

  const fetchGuardiansForChild = async (child) => {
    try {
      console.log('🔍 GUARDIAN-PICKUP: Fetching guardians...');
      console.log(
        '🔍 GUARDIAN-PICKUP: Target child:',
        child?.name || 'All Children'
      );

      let response;

      if (child) {
        // Fetch guardians for specific child
        console.log(
          '🔍 GUARDIAN-PICKUP: Fetching guardians for specific child:',
          child.id
        );
        response = await guardianService.listGuardians(authCode, child.id);
      } else {
        // Fetch all guardians (no student filter)
        console.log('🔍 GUARDIAN-PICKUP: Fetching all guardians');
        response = await guardianService.listGuardians(authCode);
      }

      if (response.success && response.guardians) {
        console.log(
          '🔍 GUARDIAN-PICKUP: Guardians received:',
          response.guardians.length
        );

        // Debug: Log guardian data structure
        if (response.guardians.length > 0) {
          console.log('🔍 GUARDIAN-PICKUP: Sample guardian structure:', {
            student_id: response.guardians[0].student_id,
            student_name: response.guardians[0].student_name,
            name: response.guardians[0].name,
            keys: Object.keys(response.guardians[0]),
          });
        }

        // Set guardians directly (no client-side filtering needed since API handles it)
        setGuardians(response.guardians);

        console.log(
          '🔍 GUARDIAN-PICKUP: Final guardians count:',
          response.guardians.length
        );
      } else {
        console.log('🔍 GUARDIAN-PICKUP: No guardians found or API error');
        setGuardians([]);
      }
    } catch (error) {
      console.error('Error fetching guardians:', error);
      setGuardians([]);
    }
  };

  const fetchPendingPickups = async () => {
    try {
      const response = await getPendingPickupRequests(authCode);
      if (response.success && response.pending_requests) {
        setPendingPickups(response.pending_requests);
      }
    } catch (error) {
      console.error('Error fetching pending pickups:', error);
    }
  };

  const validatePickupEligibility = async () => {
    try {
      console.log('🗺️ MAP DEBUG: Starting location validation...');

      const hasPermission = await requestLocationPermission();
      console.log('🗺️ MAP DEBUG: Permission granted:', hasPermission);

      if (!hasPermission) {
        setCanMakeRequest(false);
        return;
      }

      // Try to get current location directly first
      const directLocation = await getCurrentLocation();
      console.log('🗺️ MAP DEBUG: Direct location call result:', directLocation);

      if (directLocation) {
        setCurrentLocation(directLocation);
      }

      const validation = await validatePickupRequest(authCode);
      console.log('🗺️ MAP DEBUG: Validation result:', validation);
      console.log('🗺️ MAP DEBUG: Validation location:', validation?.location);
      console.log('🗺️ MAP DEBUG: School location:', validation?.schoolLocation);

      setLocationStatus(validation);
      setCanMakeRequest(validation.canRequest);

      // Store current location for map display (prefer direct location)
      if (directLocation) {
        setCurrentLocation(directLocation);
      } else if (validation.location) {
        setCurrentLocation(validation.location);
      }
    } catch (error) {
      console.error('Error validating pickup eligibility:', error);
      setCanMakeRequest(false);
    }
  };

  const handleAddGuardian = () => {
    navigation.navigate('AddGuardian', {
      children,
      selectedChildId: selectedChild?.id,
      authCode,
    });
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

    if (!selectedChild) {
      console.log('❌ PICKUP REQUEST: No child selected');
      Alert.alert('No Child Selected', 'Please select a child for pickup.');
      return;
    }

    // Validate selectedChild has required fields
    if (!selectedChild.student_id) {
      console.log(
        '❌ PICKUP REQUEST: Selected child missing student_id:',
        selectedChild
      );
      Alert.alert(
        'Invalid Child Data',
        'Selected child data is incomplete. Please try selecting the child again.'
      );
      return;
    }

    // Debug logging
    console.log('🚗 PICKUP REQUEST: Creating pickup request...');
    console.log('🚗 PICKUP REQUEST: Selected child:', selectedChild);
    console.log('🚗 PICKUP REQUEST: Selected child ID:', selectedChild.id);
    console.log(
      '🚗 PICKUP REQUEST: Selected child student_id:',
      selectedChild.student_id
    );
    console.log('🚗 PICKUP REQUEST: Selected child name:', selectedChild.name);

    try {
      setLoading(true);

      // Final verification before API call
      console.log('🔍 PICKUP REQUEST: Final verification before API call...');
      console.log('🔍 PICKUP REQUEST: authCode:', authCode);
      console.log(
        '🔍 PICKUP REQUEST: selectedChild.student_id:',
        selectedChild.student_id
      );
      console.log(
        '🔍 PICKUP REQUEST: About to call createParentPickupRequest with student_id:',
        selectedChild.student_id
      );

      const response = await createParentPickupRequest(
        authCode,
        selectedChild.student_id
      );

      console.log('🔍 PICKUP REQUEST: Server response:', response);

      if (response.success) {
        // Check if the server created the request for the correct student
        const requestMessage = response.message || '';
        const selectedStudentName = selectedChild.name;

        console.log(
          '🔍 PICKUP REQUEST: Expected student:',
          selectedStudentName
        );
        console.log(
          '🔍 PICKUP REQUEST: Server response message:',
          requestMessage
        );

        // Check if the response message contains the expected student name
        if (requestMessage.includes(selectedStudentName)) {
          console.log(
            '✅ PICKUP REQUEST: Server created request for correct student'
          );
        } else {
          console.log(
            '⚠️ PICKUP REQUEST: Server may have created request for wrong student'
          );
          console.log('⚠️ PICKUP REQUEST: Expected:', selectedStudentName);
          console.log('⚠️ PICKUP REQUEST: Server message:', requestMessage);
        }

        Alert.alert('Pickup Request Created', response.message, [
          {
            text: 'OK',
            onPress: () => fetchPendingPickups(),
          },
        ]);
      } else {
        throw new Error(response.message || 'Failed to create pickup request');
      }
    } catch (error) {
      console.error('Error creating pickup request:', error);
      Alert.alert(
        'Request Failed',
        error.message || 'Failed to create pickup request'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyPickup = () => {
    Alert.alert(
      'Emergency Pickup',
      'This will create a temporary guardian and immediate pickup request. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // Navigate to emergency pickup flow
            navigation.navigate('AddGuardian', {
              children,
              selectedChildId: selectedChild?.id,
              authCode,
              isEmergency: true,
            });
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Guardian & Pickup</Text>
      </View>

      {/* Child Selector */}
      {children && children.length > 1 && (
        <View style={styles.childSelectorContainer}>
          <TouchableOpacity
            style={styles.childSelector}
            onPress={toggleChildDropdown}
          >
            <Text style={styles.childSelectorLabel}>
              {t('managingFor') || 'Managing for:'}
            </Text>
            <Text style={styles.childSelectorValue}>
              {selectedChild
                ? selectedChild.name
                : t('allChildren') || 'All Children'}
            </Text>
            {loading ? (
              <ActivityIndicator
                size='small'
                color={theme.colors.primary}
                style={styles.childSelectorLoader}
              />
            ) : (
              <Text
                style={[
                  styles.childSelectorArrow,
                  showChildDropdown && styles.childSelectorArrowUp,
                ]}
              >
                ▼
              </Text>
            )}
          </TouchableOpacity>

          {/* Dropdown positioned below selector */}
          {renderChildDropdown()}
        </View>
      )}

      {/* Tab Bar in Header */}
      <View style={styles.headerTabBar}>
        <TouchableOpacity
          style={[
            styles.headerTabButton,
            activeTab === 'guardians' && styles.activeHeaderTabButton,
          ]}
          onPress={() => setActiveTab('guardians')}
        >
          <Text
            style={[
              styles.headerTabButtonText,
              activeTab === 'guardians' && styles.activeHeaderTabButtonText,
            ]}
          >
            {t('guardians') || 'Guardians'} ({guardians.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.headerTabButton,
            activeTab === 'pickup' && styles.activeHeaderTabButton,
          ]}
          onPress={() => setActiveTab('pickup')}
        >
          <Text
            style={[
              styles.headerTabButtonText,
              activeTab === 'pickup' && styles.activeHeaderTabButtonText,
            ]}
          >
            {t('pickup') || 'Pickup'} ({pendingPickups.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleViewHistory = () => {
    navigation.navigate('PickupHistory', {
      authCode,
      userType: 'parent',
      children,
      selectedChildId: selectedChild?.id,
    });
  };

  const handleLocationUpdate = async () => {
    try {
      console.log('🎯 GUARDIAN-PICKUP: Refreshing location...');
      await validatePickupEligibility();
    } catch (error) {
      console.error('❌ GUARDIAN-PICKUP: Error updating location:', error);
      Alert.alert(
        'Location Error',
        'Failed to update location. Please try again.'
      );
    }
  };

  const handleChildSelection = async (child) => {
    console.log(
      '👶 GUARDIAN-PICKUP: Child selected:',
      child?.name || 'All Children'
    );
    console.log('👶 GUARDIAN-PICKUP: Child data:', child);
    console.log('👶 GUARDIAN-PICKUP: Child ID:', child?.id);
    console.log('👶 GUARDIAN-PICKUP: Child student_id:', child?.student_id);
    console.log('👶 GUARDIAN-PICKUP: Previous selectedChild:', selectedChild);

    setSelectedChild(child);
    setShowChildDropdown(false);

    console.log('👶 GUARDIAN-PICKUP: Updated selectedChild to:', child);

    // Add a timeout to check if state was actually updated
    setTimeout(() => {
      console.log(
        '👶 GUARDIAN-PICKUP: selectedChild state after timeout:',
        selectedChild
      );
    }, 100);

    // Show loading state and reload data with the new child selection
    setLoading(true);

    try {
      console.log('👶 GUARDIAN-PICKUP: Reloading data for child selection...');
      await Promise.all([
        fetchGuardiansForChild(child),
        fetchPendingPickups(),
        validatePickupEligibility(),
      ]);
    } catch (error) {
      console.error('👶 GUARDIAN-PICKUP: Error reloading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChildDropdown = () => {
    if (!children || children.length <= 1) return;
    setShowChildDropdown(!showChildDropdown);
  };

  const handleGenerateQR = async () => {
    // If QR data already exists, just show the modal
    if (qrData && qrData.success) {
      console.log('📱 GUARDIAN PICKUP: Using cached QR data');
      setShowQRModal(true);
      return;
    }

    // Generate new QR code if not cached
    await generateNewQR();
  };

  const generateNewQR = async () => {
    try {
      setLoading(true);
      console.log('📱 GUARDIAN PICKUP: Generating new QR code...');
      const response = await generateParentPickupQR(authCode);

      if (response.success) {
        setQrData(response);
        setShowQRModal(true);
        console.log('✅ GUARDIAN PICKUP: QR code generated and cached');
      } else {
        throw new Error(response.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('❌ GUARDIAN PICKUP: Error generating QR:', error);
      Alert.alert(
        'QR Generation Failed',
        error.message || 'Failed to generate QR code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQR = async () => {
    console.log('🔄 GUARDIAN PICKUP: Refreshing QR code...');
    setQrData(null); // Clear cached data
    await generateNewQR();
  };

  const handleDeactivateGuardian = async (pickupCardId) => {
    try {
      setLoading(true);
      console.log('🟡 GUARDIAN PICKUP: Deactivating guardian:', pickupCardId);

      const response = await guardianService.deactivateGuardian(
        authCode,
        pickupCardId
      );

      if (response.success) {
        Alert.alert('Guardian Deactivated', response.message, [
          {
            text: 'OK',
            onPress: () => fetchGuardians(), // Refresh the list
          },
        ]);
      } else {
        throw new Error(response.message || 'Failed to deactivate guardian');
      }
    } catch (error) {
      console.error('❌ GUARDIAN PICKUP: Error deactivating guardian:', error);
      Alert.alert(
        'Deactivation Failed',
        error.message || 'Failed to deactivate guardian. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGuardian = async (pickupCardId) => {
    try {
      setLoading(true);
      console.log('🔴 GUARDIAN PICKUP: Deleting guardian:', pickupCardId);

      const response = await guardianService.deleteGuardian(
        authCode,
        pickupCardId
      );

      if (response.success) {
        Alert.alert('Guardian Deleted', response.message, [
          {
            text: 'OK',
            onPress: () => fetchGuardians(), // Refresh the list
          },
        ]);
      } else {
        throw new Error(response.message || 'Failed to delete guardian');
      }
    } catch (error) {
      console.error('❌ GUARDIAN PICKUP: Error deleting guardian:', error);
      Alert.alert(
        'Deletion Failed',
        error.message || 'Failed to delete guardian. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateGuardian = async (pickupCardId) => {
    try {
      setLoading(true);
      console.log('🟢 GUARDIAN PICKUP: Reactivating guardian:', pickupCardId);

      const response = await guardianService.reactivateGuardian(
        authCode,
        pickupCardId
      );

      if (response.success) {
        let message = response.message;

        // Add guardian limit info if provided
        if (response.guardian_limit_check) {
          const { current_active, limit, remaining } =
            response.guardian_limit_check;
          message += `\n\nGuardian Limit Status:\n• Active: ${current_active}/${limit}\n• Remaining slots: ${remaining}`;
        }

        Alert.alert('Guardian Reactivated', message, [
          {
            text: 'OK',
            onPress: () => fetchGuardians(), // Refresh the list
          },
        ]);
      } else {
        throw new Error(response.message || 'Failed to reactivate guardian');
      }
    } catch (error) {
      console.error('❌ GUARDIAN PICKUP: Error reactivating guardian:', error);
      Alert.alert(
        'Reactivation Failed',
        error.message || 'Failed to reactivate guardian. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderChildDropdown = () => {
    if (!showChildDropdown) return null;

    return (
      <View style={styles.dropdownContainer}>
        <View style={styles.dropdownContent}>
          {/* All Children Option */}
          <TouchableOpacity
            style={[
              styles.dropdownOption,
              !selectedChild && styles.selectedDropdownOption,
            ]}
            onPress={() => handleChildSelection(null)}
          >
            <View style={styles.dropdownOptionContent}>
              <Text
                style={[
                  styles.dropdownOptionName,
                  {
                    color: !selectedChild
                      ? theme.colors.primary
                      : theme.colors.onSurface,
                  },
                ]}
              >
                {t('allChildren') || 'All Children'}
              </Text>
              <Text
                style={[
                  styles.dropdownOptionDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t('manageAllChildren') || 'Manage guardians for all children'}
              </Text>
            </View>
            {!selectedChild && (
              <Text
                style={[
                  styles.selectedIndicator,
                  { color: theme.colors.primary },
                ]}
              >
                ✓
              </Text>
            )}
          </TouchableOpacity>

          {/* Individual Children */}
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.dropdownOption,
                selectedChild?.id === child.id && styles.selectedDropdownOption,
              ]}
              onPress={() => handleChildSelection(child)}
            >
              <View style={styles.dropdownOptionContent}>
                <Text
                  style={[
                    styles.dropdownOptionName,
                    {
                      color:
                        selectedChild?.id === child.id
                          ? theme.colors.primary
                          : theme.colors.onSurface,
                    },
                  ]}
                >
                  {child.name}
                </Text>
                <Text
                  style={[
                    styles.dropdownOptionDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {child.grade ? `Grade ${child.grade}` : 'Student'}
                  {child.class_name ? ` • ${child.class_name}` : ''}
                </Text>
              </View>
              {selectedChild?.id === child.id && (
                <Text
                  style={[
                    styles.selectedIndicator,
                    { color: theme.colors.primary },
                  ]}
                >
                  ✓
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderGuardiansTab = () => (
    <View style={styles.tabContent}>
      {/* Quick Actions for Guardians - Fixed at top */}
      <View style={styles.quickActionsSection}>
        <QuickActionsGrid
          onAddGuardian={handleAddGuardian}
          onCreatePickup={() => setActiveTab('pickup')}
          onEmergencyPickup={handleEmergencyPickup}
          onViewHistory={handleViewHistory}
          canMakeRequest={canMakeRequest}
          loading={loading}
        />
      </View>

      {/* Scrollable Guardians List */}
      <View style={styles.guardiansListContainer}>
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Authorized Guardians
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddGuardian}
          >
            <FontAwesomeIcon
              icon={faPlus}
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.guardiansScrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {guardians.length > 0 ? (
            guardians.map((guardian) => (
              <GuardianCard
                key={guardian.pickup_card_id}
                guardian={guardian}
                onPress={(guardian) => {
                  navigation.navigate('GuardianDetail', {
                    guardian,
                    authCode,
                  });
                }}
                onDeactivate={handleDeactivateGuardian}
                onDelete={handleDeleteGuardian}
                onReactivate={handleReactivateGuardian}
                showActions={true}
                showPickupAction={true}
                onPickupRequest={() => setActiveTab('pickup')}
              />
            ))
          ) : (
            <GuardianEmptyState onAddGuardian={handleAddGuardian} />
          )}
        </ScrollView>
      </View>
    </View>
  );

  const renderPickupTab = () => (
    <View style={styles.tabContent}>
      {/* Pickup Request Map */}
      {currentLocation && locationStatus?.schoolLocation ? (
        <View style={styles.mapContainer}>
          <PickupRequestMap
            userLocation={currentLocation}
            schoolLocation={locationStatus.schoolLocation}
            locationStatus={locationStatus}
            onLocationUpdate={handleLocationUpdate}
            style={styles.mapStyle}
          />
        </View>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text
            style={[
              styles.mapPlaceholderText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {!currentLocation
              ? 'Getting your location...'
              : !locationStatus?.schoolLocation
              ? 'Loading school location...'
              : 'Map loading...'}
          </Text>
          {loading && (
            <ActivityIndicator
              size='small'
              color={theme.colors.primary}
              style={{ marginTop: 8 }}
            />
          )}
          <TouchableOpacity
            style={styles.refreshLocationButton}
            onPress={validatePickupEligibility}
          >
            <Text
              style={[
                styles.refreshLocationText,
                { color: theme.colors.primary },
              ]}
            >
              Refresh Location
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Location Status */}
      <LocationStatusBanner
        locationStatus={locationStatus}
        canMakeRequest={canMakeRequest}
      />

      {/* Quick Pickup Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              {
                backgroundColor: canMakeRequest
                  ? theme.colors.success
                  : theme.colors.textSecondary,
              },
            ]}
            onPress={handleCreatePickupRequest}
            disabled={!canMakeRequest || loading}
          >
            {loading ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <>
                <Text style={styles.quickActionText}>Request Pickup</Text>
                {selectedChild && (
                  <Text style={styles.quickActionSubtext}>
                    for {selectedChild.name}
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: theme.colors.warning },
            ]}
            onPress={handleEmergencyPickup}
            disabled={loading}
          >
            <Text style={styles.quickActionText}>Emergency Pickup</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Pickup Requests */}
      {pendingPickups.length > 0 ? (
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Active Pickup Requests
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
            style={styles.horizontalScroll}
          >
            {pendingPickups.map((pickup) => (
              <View key={pickup.request_id} style={styles.pickupCardContainer}>
                <PickupStatusCard
                  pickup={pickup}
                  onPress={(pickup) => {
                    Alert.alert(
                      'Pickup Request',
                      `Request for ${pickup.student_name}\nStatus: ${pickup.status}`
                    );
                  }}
                  onGenerateQR={handleGenerateQR}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyPickupContainer}>
          <Text
            style={[
              styles.emptyPickupText,
              { color: theme.colors.textSecondary },
            ]}
          >
            No active pickup requests
          </Text>
          <Text
            style={[
              styles.emptyPickupSubtext,
              { color: theme.colors.textSecondary },
            ]}
          >
            Create a pickup request to get started
          </Text>
        </View>
      )}
    </View>
  );

  if (loading && guardians.length === 0 && pendingPickups.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            Loading guardian and pickup data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {renderHeader()}

      {/* Tab Content */}
      <View
        style={styles.contentContainer}
        onTouchStart={() => setShowChildDropdown(false)}
      >
        {activeTab === 'guardians' ? renderGuardiansTab() : renderPickupTab()}
      </View>

      {/* QR Code Modal */}
      <PickupQRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrData={qrData}
        onRefresh={handleRefreshQR}
      />
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
      overflow: 'visible', // Allow dropdown to extend beyond header
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
    childSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
    },
    childSelectorLabel: {
      fontSize: 14,
      color: theme.colors.headerText,
      opacity: 0.8,
    },
    childSelectorValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.headerText,
      marginLeft: 8,
      flex: 1,
    },
    childSelectorArrow: {
      fontSize: 12,
      color: theme.colors.headerText,
      opacity: 0.6,
      transform: [{ rotate: '0deg' }],
    },
    childSelectorArrowUp: {
      transform: [{ rotate: '180deg' }],
    },
    childSelectorLoader: {
      marginLeft: 8,
    },
    childSelectorContainer: {
      position: 'relative',
      zIndex: 9999,
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
    contentContainer: {
      flex: 1,
      padding: 16,
    },
    scrollContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    section: {
      marginTop: 12,
      marginBottom: 24,
    },
    horizontalScroll: {
      marginTop: 12,
    },
    horizontalScrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    pickupCardContainer: {
      width: 345,
      marginRight: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textOnSurface,
      marginBottom: 12,
    },
    addButton: {
      padding: 8,
    },

    pickupCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...createMediumShadow(theme),
    },
    pickupInfo: {
      flex: 1,
    },
    pickupStudentName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    pickupDetails: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    pickupTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    pickupAction: {
      padding: 8,
      justifyContent: 'center',
    },
    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      ...createMediumShadow(theme),
    },
    statusText: {
      fontSize: 14,
      marginLeft: 12,
      flex: 1,
    },

    tabContent: {
      flex: 1,
    },
    quickActionsSection: {
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: 16,
    },
    guardiansListContainer: {
      flex: 1,
    },
    guardiansScrollView: {
      flex: 1,
    },
    // Quick Action Styles for Pickup Tab
    quickActionsContainer: {
      // Remove marginBottom to prevent unwanted spacing
    },
    quickActionsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    quickActionButton: {
      flex: 1,
      padding: 8,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
      ...createMediumShadow(theme),
    },
    quickActionText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
    },
    quickActionSubtext: {
      fontSize: 10,
      color: '#fff',
      opacity: 0.8,
      marginTop: 4,
      textAlign: 'center',
    },
    // Empty Pickup State
    emptyPickupContainer: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyPickupText: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyPickupSubtext: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    // Map Styles
    mapContainer: {
      height: 200,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      ...createMediumShadow(theme),
    },
    mapStyle: {
      flex: 1,
    },
    mapPlaceholder: {
      height: 200,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    mapPlaceholderText: {
      fontSize: 16,
      textAlign: 'center',
    },
    refreshLocationButton: {
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    refreshLocationText: {
      fontSize: 14,
      fontWeight: '600',
    },
    // Dropdown Styles
    dropdownContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 10000,
      marginTop: 4,
      elevation: 10, // For Android
    },
    dropdownContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      maxHeight: 300,
      ...createMediumShadow(theme),
      borderWidth: 1,
      borderColor: theme.colors.border || theme.colors.textSecondary + '20',
      elevation: 15, // Higher elevation for Android
      shadowOpacity: 0.25, // Stronger shadow for iOS
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        theme.colors.border || theme.colors.textSecondary + '10',
    },
    selectedDropdownOption: {
      backgroundColor: theme.colors.primaryLight || theme.colors.primary + '10',
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    dropdownOptionContent: {
      flex: 1,
    },
    dropdownOptionName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    dropdownOptionDescription: {
      fontSize: 14,
    },
    selectedIndicator: {
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 12,
    },
  });

export default GuardianPickupManagementScreen;
