/**
 * Pickup Request Map Component
 * Shows user location, school location, and pickup radius on a map
 * Uses platform-appropriate map provider (Apple Maps on iOS, Google Maps on Android)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Context and utilities
import { useTheme } from '../contexts/ThemeContext';

// Check if running on simulator
const isSimulator = Constants.isDevice === false;

const PickupRequestMap = ({
  userLocation,
  schoolLocation,
  locationStatus,
  onLocationUpdate,
  style,
}) => {
  const { theme } = useTheme();
  const [MapViewComponent, setMapViewComponent] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);

  const pickupRadius = schoolLocation?.pickup_radius_meters || 150;
  const isWithinRange = locationStatus?.isValid || false;

  // Calculate distance between user and school
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Calculate map region for physical devices
  useEffect(() => {
    if (!isSimulator && userLocation && schoolLocation) {
      // Calculate distance between user and school
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        schoolLocation.latitude,
        schoolLocation.longitude
      );

      console.log('🗺️ MAP: Distance to school:', distance.toFixed(2), 'meters');

      let latitudeDelta, longitudeDelta;

      if (distance <= 150) {
        // User is within 150m - show zoomed in view
        console.log('🔍 MAP: User within 150m - showing zoomed view');
        latitudeDelta = 0.002; // ~200m view
        longitudeDelta = 0.002; // ~200m view
      } else if (distance <= 500) {
        // User is within 500m - show medium zoom
        console.log('🔍 MAP: User within 500m - showing medium zoom');
        latitudeDelta = 0.005; // ~500m view
        longitudeDelta = 0.005; // ~500m view
      } else {
        // User is far away - show wider view
        console.log('🔍 MAP: User far from school - showing wide view');
        const latDelta =
          Math.abs(userLocation.latitude - schoolLocation.latitude) * 2.5;
        const lonDelta =
          Math.abs(userLocation.longitude - schoolLocation.longitude) * 2.5;

        const minDelta = 0.01; // ~1km minimum
        latitudeDelta = Math.max(latDelta, minDelta);
        longitudeDelta = Math.max(lonDelta, minDelta);
      }

      setMapRegion({
        latitude: (userLocation.latitude + schoolLocation.latitude) / 2,
        longitude: (userLocation.longitude + schoolLocation.longitude) / 2,
        latitudeDelta,
        longitudeDelta,
      });
    }
  }, [userLocation, schoolLocation, isWithinRange]);

  // Safely load MapView only on physical devices
  useEffect(() => {
    console.log('🗺️ MAP DEBUG: Loading MapView...', {
      isSimulator,
      hasMapViewComponent: !!MapViewComponent,
      userLocation,
      schoolLocation,
      mapRegion,
    });

    if (!isSimulator && !MapViewComponent) {
      try {
        console.log('🗺️ MAP DEBUG: Attempting to import react-native-maps...');
        // Import MapView components safely
        const mapComponents = require('react-native-maps');
        const MapView = mapComponents.default;
        const Marker = mapComponents.Marker;
        const Circle = mapComponents.Circle;
        const PROVIDER_GOOGLE = mapComponents.PROVIDER_GOOGLE;
        const PROVIDER_DEFAULT = mapComponents.PROVIDER_DEFAULT;

        console.log(
          '🗺️ MAP DEBUG: Successfully imported react-native-maps components'
        );

        // Create a safe MapView component
        const SafeMapView = ({ onLocationUpdate }) => {
          const [mapRef, setMapRef] = useState(null);
          const [mapType, setMapType] = useState('standard');

          const handleMyLocationPress = () => {
            console.log('🎯 MAP: Centering on user location...');

            if (userLocation && mapRef) {
              // Center map on user location with appropriate zoom
              const distance = schoolLocation
                ? calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    schoolLocation.latitude,
                    schoolLocation.longitude
                  )
                : null;

              let latitudeDelta, longitudeDelta;
              if (distance && distance <= 150) {
                latitudeDelta = 0.002;
                longitudeDelta = 0.002;
              } else if (distance && distance <= 500) {
                latitudeDelta = 0.005;
                longitudeDelta = 0.005;
              } else {
                latitudeDelta = 0.01;
                longitudeDelta = 0.01;
              }

              mapRef.animateToRegion(
                {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta,
                  longitudeDelta,
                },
                1000
              );
            } else if (onLocationUpdate) {
              // Fallback to refreshing location if no current location
              console.log('🎯 MAP: No current location, refreshing...');
              onLocationUpdate();
            }
          };

          const handleSchoolLocationPress = () => {
            if (schoolLocation) {
              Alert.alert(
                schoolLocation.branch_name || 'School Campus',
                schoolLocation.address || 'School location',
                [{ text: 'OK' }]
              );
            }
          };

          const handleFitToCoordinates = () => {
            console.log('🎯 MAP: Fitting to show both locations...');

            if (userLocation && schoolLocation && mapRef) {
              // Calculate region to show both user and school
              const latDelta =
                Math.abs(userLocation.latitude - schoolLocation.latitude) * 2.5;
              const lonDelta =
                Math.abs(userLocation.longitude - schoolLocation.longitude) *
                2.5;

              const minDelta = 0.01; // ~1km minimum

              mapRef.animateToRegion(
                {
                  latitude:
                    (userLocation.latitude + schoolLocation.latitude) / 2,
                  longitude:
                    (userLocation.longitude + schoolLocation.longitude) / 2,
                  latitudeDelta: Math.max(latDelta, minDelta),
                  longitudeDelta: Math.max(lonDelta, minDelta),
                },
                1000
              );
            }
          };

          const handleMapTypeToggle = () => {
            const mapTypes = ['standard', 'satellite', 'hybrid'];
            const currentIndex = mapTypes.indexOf(mapType);
            const nextIndex = (currentIndex + 1) % mapTypes.length;
            const nextMapType = mapTypes[nextIndex];

            console.log('🗺️ MAP: Switching map type to:', nextMapType);
            setMapType(nextMapType);
          };

          // Calculate if user is within 150m for zoom indicator
          const distance =
            userLocation && schoolLocation
              ? calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  schoolLocation.latitude,
                  schoolLocation.longitude
                )
              : null;

          const isZoomedIn = distance && distance <= 150;

          return (
            <View style={[styles.container, style]}>
              <MapView
                ref={setMapRef}
                style={styles.map}
                provider={
                  Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
                }
                region={mapRegion}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                showsScale={true}
                showsTraffic={true}
                showsBuildings={true}
                showsIndoors={true}
                showsPointsOfInterest={true}
                mapType={mapType}
                loadingEnabled={true}
                loadingIndicatorColor={theme.colors.primary}
                loadingBackgroundColor={theme.colors.background}
              >
                {/* School Location Marker */}
                {schoolLocation && (
                  <>
                    <Marker
                      coordinate={{
                        latitude: schoolLocation.latitude,
                        longitude: schoolLocation.longitude,
                      }}
                      title={schoolLocation.branch_name || 'School Campus'}
                      description={schoolLocation.address || 'School location'}
                      onPress={handleSchoolLocationPress}
                    >
                      <View style={styles.schoolMarker}>
                        <FontAwesome5 name='school' size={10} color='#fff' />
                      </View>
                    </Marker>

                    <Circle
                      center={{
                        latitude: schoolLocation.latitude,
                        longitude: schoolLocation.longitude,
                      }}
                      radius={pickupRadius}
                      strokeColor={theme.colors.primary}
                      strokeWidth={2}
                      fillColor={`${theme.colors.primary}20`}
                    />
                  </>
                )}

                {/* User Location Marker */}
                {userLocation && (
                  <Marker
                    coordinate={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                    }}
                    title='Your Location'
                    description={
                      isWithinRange
                        ? 'Within pickup range'
                        : 'Outside pickup range'
                    }
                  >
                    <View
                      style={[
                        styles.userMarker,
                        {
                          backgroundColor: isWithinRange
                            ? '#34C759'
                            : '#FF3B30',
                        },
                      ]}
                    >
                      <FontAwesome5 name='user' size={6} color='#fff' />
                    </View>
                  </Marker>
                )}
              </MapView>

              {/* Map Controls */}
              <View style={styles.controls}>
                {/* Center on user location */}
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { backgroundColor: theme.colors.card },
                  ]}
                  onPress={handleMyLocationPress}
                >
                  <FontAwesome5
                    name='crosshairs'
                    size={16}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>

                {/* Fit both locations */}
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { backgroundColor: theme.colors.card },
                  ]}
                  onPress={handleFitToCoordinates}
                >
                  <FontAwesome5
                    name='expand-arrows-alt'
                    size={14}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>

                {/* Map type toggle */}
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { backgroundColor: theme.colors.card },
                  ]}
                  onPress={handleMapTypeToggle}
                >
                  <FontAwesome5
                    name={
                      mapType === 'satellite'
                        ? 'globe'
                        : mapType === 'hybrid'
                        ? 'layer-group'
                        : 'map'
                    }
                    size={14}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>

                {/* Zoom indicator */}
                {isZoomedIn && (
                  <View
                    style={[
                      styles.zoomIndicator,
                      { backgroundColor: theme.colors.success },
                    ]}
                  >
                    <FontAwesome5 name='search-plus' size={12} color='#fff' />
                  </View>
                )}
              </View>

              {/* Map Legend */}
              <View
                style={[styles.legend, { backgroundColor: theme.colors.card }]}
              >
                <View style={styles.legendItem}>
                  <View style={styles.schoolMarkerSmall}>
                    <FontAwesome5 name='school' size={8} color='#fff' />
                  </View>
                  <Text
                    style={[styles.legendText, { color: theme.colors.text }]}
                  >
                    School
                  </Text>
                </View>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.userMarkerSmall,
                      { backgroundColor: '#34C759' },
                    ]}
                  >
                    <FontAwesome5 name='user' size={6} color='#fff' />
                  </View>
                  <Text
                    style={[styles.legendText, { color: theme.colors.text }]}
                  >
                    You
                  </Text>
                </View>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.radiusIndicator,
                      { borderColor: theme.colors.primary },
                    ]}
                  />
                  <Text
                    style={[styles.legendText, { color: theme.colors.text }]}
                  >
                    {distance
                      ? `${Math.round(
                          distance < 1000 ? distance : distance / 1000
                        )}${distance < 1000 ? 'm' : 'km'} away`
                      : `Zone (${pickupRadius}m)`}
                  </Text>
                </View>
              </View>
            </View>
          );
        };

        console.log('🗺️ MAP DEBUG: Setting MapViewComponent...');
        setMapViewComponent(() => SafeMapView);
        console.log('🗺️ MAP DEBUG: MapViewComponent set successfully');
      } catch (error) {
        console.error('🗺️ MAP DEBUG: Failed to load MapView:', error);
        console.error(
          '🗺️ MAP DEBUG: Error details:',
          error.message,
          error.stack
        );
      }
    } else {
      console.log('🗺️ MAP DEBUG: Skipping MapView import:', {
        isSimulator,
        hasMapViewComponent: !!MapViewComponent,
      });
    }
  }, [
    mapRegion,
    userLocation,
    schoolLocation,
    isWithinRange,
    pickupRadius,
    theme,
    style,
  ]);

  // Show placeholder on simulator
  if (isSimulator) {
    return (
      <View style={[styles.simulatorPlaceholder, style]}>
        <FontAwesome5 name='map' size={48} color={theme.colors.textSecondary} />
        <Text
          style={[styles.simulatorText, { color: theme.colors.textSecondary }]}
        >
          Map not available
        </Text>
        <Text
          style={[
            styles.simulatorSubtext,
            { color: theme.colors.textSecondary },
          ]}
        >
          Location information shown below
        </Text>

        {/* Show location info if available */}
        {userLocation && schoolLocation && (
          <View style={styles.locationInfo}>
            <Text
              style={[styles.locationText, { color: theme.colors.onSurface }]}
            >
              📍 Your location: {userLocation.latitude.toFixed(4)},{' '}
              {userLocation.longitude.toFixed(4)}
            </Text>
            <Text
              style={[styles.locationText, { color: theme.colors.onSurface }]}
            >
              🏫 {schoolLocation.branch_name || 'School'}:{' '}
              {schoolLocation.latitude.toFixed(4)},{' '}
              {schoolLocation.longitude.toFixed(4)}
            </Text>
            <Text
              style={[
                styles.locationText,
                { color: isWithinRange ? '#34C759' : '#FF3B30' },
              ]}
            >
              {isWithinRange
                ? '✅ Within pickup range'
                : '❌ Outside pickup range'}{' '}
              ({pickupRadius}m)
            </Text>
          </View>
        )}

        {onLocationUpdate && (
          <TouchableOpacity
            style={[
              styles.refreshButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={onLocationUpdate}
          >
            <FontAwesome5 name='sync-alt' size={16} color='#fff' />
            <Text style={styles.refreshButtonText}>Refresh Location</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show actual map on physical devices if available
  console.log('🗺️ MAP DEBUG: Final render decision:', {
    isSimulator,
    hasMapViewComponent: !!MapViewComponent,
    hasMapRegion: !!mapRegion,
    shouldShowMap: !isSimulator && MapViewComponent && mapRegion,
  });

  if (!isSimulator && MapViewComponent && mapRegion) {
    console.log('🗺️ MAP DEBUG: Rendering actual MapView');
    return <MapViewComponent onLocationUpdate={onLocationUpdate} />;
  }

  // Show loading placeholder for physical devices
  console.log('🗺️ MAP DEBUG: Rendering loading placeholder');
  return (
    <View style={[styles.simulatorPlaceholder, style]}>
      <FontAwesome5 name='map' size={48} color={theme.colors.textSecondary} />
      <Text
        style={[styles.simulatorText, { color: theme.colors.textSecondary }]}
      >
        Map loading...
      </Text>
      <Text
        style={[styles.simulatorSubtext, { color: theme.colors.textSecondary }]}
      >
        Please wait while map initializes
      </Text>

      {/* Show location info if available */}
      {userLocation && schoolLocation && (
        <View style={styles.locationInfo}>
          <Text
            style={[styles.locationText, { color: theme.colors.onSurface }]}
          >
            📍 Your location: {userLocation.latitude.toFixed(4)},{' '}
            {userLocation.longitude.toFixed(4)}
          </Text>
          <Text
            style={[styles.locationText, { color: theme.colors.onSurface }]}
          >
            🏫 {schoolLocation.branch_name || 'School'}:{' '}
            {schoolLocation.latitude.toFixed(4)},{' '}
            {schoolLocation.longitude.toFixed(4)}
          </Text>
          <Text
            style={[
              styles.locationText,
              { color: isWithinRange ? '#34C759' : '#FF3B30' },
            ]}
          >
            {isWithinRange
              ? '✅ Within pickup range'
              : '❌ Outside pickup range'}{' '}
            ({pickupRadius}m)
          </Text>
        </View>
      )}

      {onLocationUpdate && (
        <TouchableOpacity
          style={[
            styles.refreshButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={onLocationUpdate}
        >
          <FontAwesome5 name='sync-alt' size={16} color='#fff' />
          <Text style={styles.refreshButtonText}>Refresh Location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Map styles
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginBottom: 8,
  },
  zoomIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  legend: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '70%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  legendText: {
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
  },
  schoolMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  schoolMarkerSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  // Simulator placeholder styles
  simulatorPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  simulatorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  simulatorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  locationInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    width: '100%',
  },
  locationText: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PickupRequestMap;
