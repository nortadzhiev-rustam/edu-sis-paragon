import React from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { isIPad, isTablet } from './deviceDetection';

/**
 * Lock screen orientation based on device type
 * - iPhones: Portrait only
 * - iPads/Tablets: Allow all orientations
 */
export const lockOrientationForDevice = async () => {
  try {
    const isIPadDevice = isIPad();
    const isTabletDevice = isTablet();

    if (isIPadDevice || isTabletDevice) {
      // Allow all orientations for tablets/iPads
      await ScreenOrientation.unlockAsync();
      console.log('📱 Orientation: Unlocked for tablet/iPad');
    } else {
      // Lock to portrait for phones with timeout protection
      const lockPromise = ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );

      // Add timeout for iOS orientation lock (can hang on iOS)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Orientation lock timeout')), 5000);
      });

      await Promise.race([lockPromise, timeoutPromise]);
      console.log('📱 Orientation: Locked to portrait for phone');
    }
  } catch (error) {
    console.warn('⚠️ Orientation lock failed:', error);
    // On iOS, orientation lock failures are common and shouldn't block the app
    if (Platform.OS === 'ios') {
      console.log('🍎 iOS: Continuing despite orientation lock failure');
    }
  }
};

/**
 * Force portrait orientation for all devices
 */
export const lockToPortrait = async () => {
  try {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
    console.log('📱 Orientation: Locked to portrait for all devices');
  } catch (error) {
    console.warn('⚠️ Portrait lock failed:', error);
  }
};

/**
 * Unlock orientation for all devices
 */
export const unlockOrientation = async () => {
  try {
    await ScreenOrientation.unlockAsync();
    console.log('📱 Orientation: Unlocked for all devices');
  } catch (error) {
    console.warn('⚠️ Orientation unlock failed:', error);
  }
};

/**
 * Get current orientation
 */
export const getCurrentOrientation = async () => {
  try {
    const orientation = await ScreenOrientation.getOrientationAsync();
    return orientation;
  } catch (error) {
    console.warn('⚠️ Get orientation failed:', error);
    return null;
  }
};

/**
 * Hook to manage orientation based on device type
 */
export const useDeviceOrientationLock = () => {
  React.useEffect(() => {
    lockOrientationForDevice();

    // Cleanup function to unlock on unmount (optional)
    return () => {
      // Uncomment if you want to unlock on component unmount
      // unlockOrientation();
    };
  }, []);
};

export default {
  lockOrientationForDevice,
  lockToPortrait,
  unlockOrientation,
  getCurrentOrientation,
  useDeviceOrientationLock,
};
