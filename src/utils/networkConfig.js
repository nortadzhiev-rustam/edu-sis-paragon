/**
 * Network Configuration Helper
 * Helps detect and configure proper network settings for physical devices
 */

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Get the device's network information
 */
export const getNetworkInfo = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    console.log('📡 NETWORK INFO:', {
      type: netInfo.type,
      isConnected: netInfo.isConnected,
      isInternetReachable: netInfo.isInternetReachable,
      details: netInfo.details,
    });
    return netInfo;
  } catch (error) {
    console.error('❌ NETWORK INFO ERROR:', error);
    return null;
  }
};

/**
 * Test API connectivity
 */
export const testApiConnectivity = async (apiUrl) => {
  try {
    console.log('🔍 TESTING API CONNECTIVITY:', apiUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    console.log('✅ API CONNECTIVITY TEST:', {
      status: response.status,
      statusText: response.statusText,
      url: apiUrl,
    });
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    console.error('❌ API CONNECTIVITY TEST FAILED:', {
      error: error.message,
      name: error.name,
      url: apiUrl,
    });
    
    return {
      success: false,
      error: error.message,
      errorType: error.name,
    };
  }
};

/**
 * Get suggested API URLs for testing
 */
export const getSuggestedApiUrls = () => {
  const commonIPs = [
    '127.0.0.1:8000',      // Localhost (simulator only)
    '10.0.2.2:8000',       // Android emulator host
    '192.168.1.100:8000',  // Common local network IP
    '192.168.0.100:8000',  // Common local network IP
    '172.16.0.100:8000',   // Common local network IP
  ];
  
  return commonIPs.map(ip => ({
    url: `http://${ip}/mobile-api`,
    description: getIpDescription(ip),
  }));
};

/**
 * Get description for IP address
 */
const getIpDescription = (ip) => {
  if (ip.includes('127.0.0.1')) return 'Localhost (Simulator only)';
  if (ip.includes('10.0.2.2')) return 'Android Emulator Host';
  if (ip.includes('192.168.1')) return 'Local Network (192.168.1.x)';
  if (ip.includes('192.168.0')) return 'Local Network (192.168.0.x)';
  if (ip.includes('172.16')) return 'Local Network (172.16.x.x)';
  return 'Custom IP';
};

/**
 * Diagnose network connectivity issues
 */
export const diagnoseNetworkIssues = async (currentApiUrl) => {
  console.log('🔍 STARTING NETWORK DIAGNOSIS...');
  
  const diagnosis = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    currentApiUrl,
    issues: [],
    suggestions: [],
  };
  
  // Check network connectivity
  const netInfo = await getNetworkInfo();
  if (!netInfo?.isConnected) {
    diagnosis.issues.push('Device is not connected to any network');
    diagnosis.suggestions.push('Check WiFi or mobile data connection');
    return diagnosis;
  }
  
  if (!netInfo?.isInternetReachable) {
    diagnosis.issues.push('Device has network connection but no internet access');
    diagnosis.suggestions.push('Check internet connectivity and firewall settings');
  }
  
  // Test current API URL
  const apiTest = await testApiConnectivity(currentApiUrl);
  if (!apiTest.success) {
    diagnosis.issues.push(`Cannot reach API at ${currentApiUrl}: ${apiTest.error}`);
    
    if (currentApiUrl.includes('127.0.0.1') && Platform.OS !== 'web') {
      diagnosis.issues.push('Using localhost (127.0.0.1) on physical device');
      diagnosis.suggestions.push('Replace 127.0.0.1 with your computer\'s actual IP address');
      diagnosis.suggestions.push('Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)');
    }
    
    if (currentApiUrl.includes('http://') && !currentApiUrl.includes('127.0.0.1')) {
      diagnosis.suggestions.push('Ensure your development server allows connections from other devices');
      diagnosis.suggestions.push('Check firewall settings on your development machine');
    }
  }
  
  console.log('📊 NETWORK DIAGNOSIS COMPLETE:', diagnosis);
  return diagnosis;
};

/**
 * Get platform-specific network recommendations
 */
export const getPlatformNetworkRecommendations = () => {
  const recommendations = {
    common: [
      'Ensure both device and development server are on the same WiFi network',
      'Check that your development server is running and accessible',
      'Verify firewall settings allow connections on port 8000',
    ],
  };
  
  if (Platform.OS === 'android') {
    recommendations.android = [
      'For Android emulator, use 10.0.2.2 instead of 127.0.0.1',
      'For physical Android device, use your computer\'s IP address',
      'Enable "Allow HTTP traffic" in network security config if using HTTP',
    ];
  }
  
  if (Platform.OS === 'ios') {
    recommendations.ios = [
      'For iOS simulator, 127.0.0.1 should work',
      'For physical iOS device, use your computer\'s IP address',
      'Ensure ATS (App Transport Security) allows HTTP connections if needed',
    ];
  }
  
  return recommendations;
};
