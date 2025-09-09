/**
 * Location Service
 * Handles GPS location functionality for pickup requests
 */

import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';
import Config from '../config/env';
import { buildApiUrl, makeApiRequest } from '../utils/apiHelpers';

// Default school campus coordinates (fallback if API fails)
let SCHOOL_CAMPUS_COORDINATES = {
  latitude: 11.5564, // Phnom Penh, Cambodia (default fallback)
  longitude: 104.9282,
};

// Default distance threshold in meters (will be updated from API)
let PICKUP_DISTANCE_THRESHOLD = 150;

// Cache for school location data
let schoolLocationCache = null;
let schoolLocationCacheTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch school location from API
 * @param {string} authCode - User authentication code
 * @returns {Promise<Object|null>} - School location data or null if failed
 */
export const getSchoolLocation = async (authCode) => {
  try {
    console.log('🏫 LOCATION SERVICE: Fetching school location from API...');

    // Check cache first
    const now = Date.now();
    if (
      schoolLocationCache &&
      schoolLocationCacheTime &&
      now - schoolLocationCacheTime < CACHE_DURATION
    ) {
      console.log('📦 LOCATION SERVICE: Using cached school location');
      return schoolLocationCache;
    }

    // Fetch from API
    const url = buildApiUrl(Config.API_ENDPOINTS.GET_SCHOOL_LOCATION, {
      authCode,
    });

    const response = await makeApiRequest(url);

    if (response.success && response.school_location) {
      const schoolLocation = response.school_location;

      // Update global coordinates and threshold
      SCHOOL_CAMPUS_COORDINATES.latitude = schoolLocation.latitude;
      SCHOOL_CAMPUS_COORDINATES.longitude = schoolLocation.longitude;
      PICKUP_DISTANCE_THRESHOLD = schoolLocation.pickup_radius_meters || 150;

      // Cache the response
      schoolLocationCache = {
        ...schoolLocation,
        user_info: response.user_info,
      };
      schoolLocationCacheTime = now;

      console.log('✅ LOCATION SERVICE: School location updated:', {
        branch: schoolLocation.branch_name,
        coordinates: `${schoolLocation.latitude}, ${schoolLocation.longitude}`,
        radius: `${schoolLocation.pickup_radius_meters}m`,
      });

      return schoolLocationCache;
    } else {
      console.warn('⚠️ LOCATION SERVICE: Invalid school location response');
      return null;
    }
  } catch (error) {
    console.error(
      '❌ LOCATION SERVICE: Error fetching school location:',
      error
    );
    return null;
  }
};

/**
 * Request location permissions from the user
 * @returns {Promise<boolean>} - True if permission granted, false otherwise
 */
export const requestLocationPermission = async () => {
  try {
    console.log('📍 LOCATION SERVICE: Requesting location permission...');

    // Check if location services are enabled
    const locationServicesEnabled = await Location.hasServicesEnabledAsync();
    if (!locationServicesEnabled) {
      Alert.alert(
        'Location Services Disabled',
        'Please enable location services in your device settings to use pickup requests.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Request foreground location permission
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to verify you are near the school campus for pickup requests.',
        [{ text: 'OK' }]
      );
      return false;
    }

    console.log('✅ LOCATION SERVICE: Location permission granted');
    return true;
  } catch (error) {
    console.error('❌ LOCATION SERVICE: Error requesting permission:', error);
    Alert.alert(
      'Location Error',
      'Failed to request location permission. Please try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Get current device location
 * @returns {Promise<Object|null>} - Location object or null if failed
 */
export const getCurrentLocation = async () => {
  try {
    console.log('📍 LOCATION SERVICE: Getting current location...');

    // Check permission first
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('❌ LOCATION SERVICE: Permission not granted');
      return null;
    }

    // Get current position with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 15000, // 15 seconds timeout
      maximumAge: 10000, // Accept cached location up to 10 seconds old
    });

    console.log('✅ LOCATION SERVICE: Got current location:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('❌ LOCATION SERVICE: Error getting location:', error);

    // Provide user-friendly error messages
    if (error.code === 'E_LOCATION_TIMEOUT') {
      Alert.alert(
        'Location Timeout',
        'Unable to get your location. Please make sure you have a clear view of the sky and try again.',
        [{ text: 'OK' }]
      );
    } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
      Alert.alert(
        'Location Unavailable',
        'Location services are currently unavailable. Please check your device settings.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Location Error',
        'Failed to get your current location. Please try again.',
        [{ text: 'OK' }]
      );
    }

    return null;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} - Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance); // Return distance in meters, rounded
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} - Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if current location is within pickup distance of school
 * @param {Object} currentLocation - Current location object
 * @param {Object} schoolLocation - School location data (optional)
 * @returns {Object} - Validation result with distance and status
 */
export const validatePickupLocation = (
  currentLocation,
  schoolLocation = null
) => {
  if (!currentLocation) {
    return {
      isValid: false,
      distance: null,
      message: 'Unable to get your current location',
      schoolInfo: null,
    };
  }

  // Use provided school location or fallback to cached coordinates
  const schoolCoords = schoolLocation || SCHOOL_CAMPUS_COORDINATES;
  const threshold =
    schoolLocation?.pickup_radius_meters || PICKUP_DISTANCE_THRESHOLD;

  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    schoolCoords.latitude,
    schoolCoords.longitude
  );

  const isValid = distance <= threshold;

  return {
    isValid,
    distance,
    threshold,
    schoolInfo: schoolLocation
      ? {
          branch_name: schoolLocation.branch_name,
          address: schoolLocation.address,
        }
      : null,
    message: isValid
      ? `You are ${formatDistance(distance)} from ${
          schoolLocation?.branch_name || 'campus'
        } - within pickup range`
      : `You are ${formatDistance(distance)} from ${
          schoolLocation?.branch_name || 'campus'
        } - please get closer (within ${formatDistance(threshold)})`,
  };
};

/**
 * Get formatted distance string
 * @param {number} distance - Distance in meters
 * @returns {string} - Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined) {
    return 'Unknown distance';
  }

  if (distance < 1000) {
    return `${distance}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
};

/**
 * Set school campus coordinates (for configuration)
 * @param {number} latitude - School latitude
 * @param {number} longitude - School longitude
 */
export const setSchoolCoordinates = (latitude, longitude) => {
  SCHOOL_CAMPUS_COORDINATES.latitude = latitude;
  SCHOOL_CAMPUS_COORDINATES.longitude = longitude;
  console.log(
    '📍 LOCATION SERVICE: School coordinates updated:',
    SCHOOL_CAMPUS_COORDINATES
  );
};

/**
 * Get school campus coordinates
 * @returns {Object} - School coordinates
 */
export const getSchoolCoordinates = () => {
  return { ...SCHOOL_CAMPUS_COORDINATES };
};

/**
 * Location Service Export
 */
export default {
  getSchoolLocation,
  requestLocationPermission,
  getCurrentLocation,
  calculateDistance,
  validatePickupLocation,
  formatDistance,
  setSchoolCoordinates,
  getSchoolCoordinates,
  PICKUP_DISTANCE_THRESHOLD,
};
