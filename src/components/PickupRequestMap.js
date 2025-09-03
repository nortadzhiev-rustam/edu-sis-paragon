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
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import MapView, {
  Marker,
  Circle,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import { FontAwesome5 } from '@expo/vector-icons';

// Context and utilities
import { useTheme } from '../contexts/ThemeContext';

const PickupRequestMap = ({
  userLocation,
  schoolLocation,
  locationStatus,
  onLocationUpdate,
  style,
}) => {
  const { theme } = useTheme();
  const [mapRegion, setMapRegion] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Calculate map region to show both user and school locations
  useEffect(() => {
    console.log('🗺️ MAP: Location data updated:', {
      userLocation,
      schoolLocation: schoolLocation
        ? {
            name: schoolLocation.branch_name,
            lat: schoolLocation.latitude,
            lng: schoolLocation.longitude,
          }
        : null,
    });

    if (userLocation && schoolLocation) {
      const latDelta =
        Math.abs(userLocation.latitude - schoolLocation.latitude) * 2.5;
      const lonDelta =
        Math.abs(userLocation.longitude - schoolLocation.longitude) * 2.5;

      // Ensure minimum zoom level
      const minDelta = 0.01; // ~1km

      setMapRegion({
        latitude: (userLocation.latitude + schoolLocation.latitude) / 2,
        longitude: (userLocation.longitude + schoolLocation.longitude) / 2,
        latitudeDelta: Math.max(latDelta, minDelta),
        longitudeDelta: Math.max(lonDelta, minDelta),
      });
    } else if (schoolLocation) {
      // Show only school location
      setMapRegion({
        latitude: schoolLocation.latitude,
        longitude: schoolLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else if (userLocation) {
      // Show only user location
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [userLocation, schoolLocation]);

  const handleMapReady = () => {
    setMapReady(true);
    console.log('📍 MAP: Map is ready');
  };

  const handleMapError = (error) => {
    console.error('❌ MAP: Map error:', error);
  };

  const handleMyLocationPress = () => {
    console.log('🎯 MAP: Refreshing location...');
    if (onLocationUpdate) {
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

  if (!mapRegion) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Text
          style={[styles.loadingText, { color: theme.colors.textSecondary }]}
        >
          Loading map...
        </Text>
      </View>
    );
  }

  const pickupRadius = schoolLocation?.pickup_radius_meters || 150;
  const isWithinRange = locationStatus?.isValid || false;

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        provider={
          Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        region={mapRegion}
        onMapReady={handleMapReady}
        onError={handleMapError}
        showsUserLocation={false} // We'll use custom marker
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType='standard'
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
                <FontAwesome5 name='school' size={20} color='#fff' />
              </View>
            </Marker>

            {/* Pickup Radius Circle */}
            <Circle
              center={{
                latitude: schoolLocation.latitude,
                longitude: schoolLocation.longitude,
              }}
              radius={pickupRadius}
              strokeColor={theme.colors.primary}
              strokeWidth={2}
              fillColor={`${theme.colors.primary}20`} // 20% opacity
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
              isWithinRange ? 'Within pickup range' : 'Outside pickup range'
            }
          >
            <View
              style={[
                styles.userMarker,
                { backgroundColor: isWithinRange ? '#34C759' : '#FF3B30' },
              ]}
            >
              <FontAwesome5 name='user' size={16} color='#fff' />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.card }]}
          onPress={handleMyLocationPress}
        >
          <FontAwesome5
            name='crosshairs'
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Map Legend */}
      <View style={[styles.legend, { backgroundColor: theme.colors.card }]}>
        <View style={styles.legendItem}>
          <View style={styles.schoolMarkerSmall}>
            <FontAwesome5 name='school' size={12} color='#fff' />
          </View>
          <Text style={[styles.legendText, { color: theme.colors.text }]}>
            School Campus
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[styles.userMarkerSmall, { backgroundColor: '#34C759' }]}
          >
            <FontAwesome5 name='user' size={10} color='#fff' />
          </View>
          <Text style={[styles.legendText, { color: theme.colors.text }]}>
            Your Location
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.radiusIndicator,
              { borderColor: theme.colors.primary },
            ]}
          />
          <Text style={[styles.legendText, { color: theme.colors.text }]}>
            Pickup Zone ({pickupRadius}m)
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    bottom: 16,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendText: {
    fontSize: 12,
    marginLeft: 8,
  },
  schoolMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
});

export default PickupRequestMap;
