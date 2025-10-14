# Maintenance Banner Control Guide

## Overview
The maintenance banner is now globally integrated into your app and appears on all screens.

## Location
The banner is implemented in `App.js` inside the `NavigationContainer`, making it visible across all screens.

## Current Status
✅ **Banner is currently ENABLED and showing**

## How to Control the Banner

### Option 1: Simple Toggle (Current Implementation)

In `App.js`, find the `GlobalMaintenanceBanner` component (around line 110):

```javascript
const GlobalMaintenanceBanner = () => {
  // Control visibility here - set to false to hide the banner
  const showMaintenance = true;  // ← Change this to false to hide

  if (!showMaintenance) return null;

  return (
    <View style={styles.maintenanceBannerContainer}>
      <MaintenanceBanner />
    </View>
  );
};
```

**To hide the banner:**
```javascript
const showMaintenance = false;  // Banner will not show
```

**To show the banner:**
```javascript
const showMaintenance = true;  // Banner will show
```

### Option 2: Custom Message

You can customize the message and type:

```javascript
const GlobalMaintenanceBanner = () => {
  const showMaintenance = true;

  if (!showMaintenance) return null;

  return (
    <View style={styles.maintenanceBannerContainer}>
      <MaintenanceBanner 
        type="warning"  // or "info" or "error"
        message="Scheduled maintenance from 2:00 AM to 4:00 AM. We apologize for the inconvenience."
      />
    </View>
  );
};
```

### Option 3: Control via AsyncStorage

For persistent control across app restarts:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const GlobalMaintenanceBanner = () => {
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const status = await AsyncStorage.getItem('maintenanceMode');
      const message = await AsyncStorage.getItem('maintenanceMessage');
      setShowMaintenance(status === 'true');
      setMaintenanceMessage(message || '');
    } catch (error) {
      console.error('Error checking maintenance:', error);
    }
  };

  if (!showMaintenance) return null;

  return (
    <View style={styles.maintenanceBannerContainer}>
      <MaintenanceBanner message={maintenanceMessage} />
    </View>
  );
};
```

Then you can control it from anywhere in your app:
```javascript
// Enable maintenance mode
await AsyncStorage.setItem('maintenanceMode', 'true');
await AsyncStorage.setItem('maintenanceMessage', 'Your custom message');

// Disable maintenance mode
await AsyncStorage.removeItem('maintenanceMode');
await AsyncStorage.removeItem('maintenanceMessage');
```

### Option 4: Control via API

For remote control from your backend:

```javascript
const GlobalMaintenanceBanner = () => {
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState({});

  useEffect(() => {
    checkMaintenanceStatus();
    // Check every 5 minutes
    const interval = setInterval(checkMaintenanceStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const response = await fetch('YOUR_API_URL/maintenance-status');
      const data = await response.json();
      setShowMaintenance(data.isUnderMaintenance);
      setMaintenanceData(data);
    } catch (error) {
      console.error('Error checking maintenance:', error);
    }
  };

  if (!showMaintenance) return null;

  return (
    <View style={styles.maintenanceBannerContainer}>
      <MaintenanceBanner 
        type={maintenanceData.type || 'warning'}
        message={maintenanceData.message}
      />
    </View>
  );
};
```

Expected API response format:
```json
{
  "isUnderMaintenance": true,
  "type": "warning",
  "message": "App is under maintenance. We apologize for the inconvenience."
}
```

### Option 5: Time-Based Display

Show banner only during specific times:

```javascript
const GlobalMaintenanceBanner = () => {
  const [showMaintenance, setShowMaintenance] = useState(false);

  useEffect(() => {
    checkMaintenanceWindow();
    // Check every minute
    const interval = setInterval(checkMaintenanceWindow, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceWindow = () => {
    const now = new Date();
    const hour = now.getHours();
    
    // Show banner between 2 AM and 4 AM
    const isMaintenanceTime = hour >= 2 && hour < 4;
    setShowMaintenance(isMaintenanceTime);
  };

  if (!showMaintenance) return null;

  return (
    <View style={styles.maintenanceBannerContainer}>
      <MaintenanceBanner 
        message="Scheduled maintenance in progress (2:00 AM - 4:00 AM)"
      />
    </View>
  );
};
```

## Banner Types

### Warning (Orange) - Default
```javascript
<MaintenanceBanner type="warning" />
```
Use for: General maintenance notifications

### Info (Blue)
```javascript
<MaintenanceBanner type="info" />
```
Use for: Informational messages, scheduled updates

### Error (Red)
```javascript
<MaintenanceBanner type="error" />
```
Use for: Critical issues, service unavailable

## Customization

### Change Position
The banner is currently positioned at the top. To change position, edit `styles.maintenanceBannerContainer` in `App.js`:

```javascript
maintenanceBannerContainer: {
  position: 'absolute',
  top: 0,        // Change to 'bottom: 0' for bottom position
  left: 0,
  right: 0,
  zIndex: 9999,
  elevation: 9999,
},
```

### Add Padding for Safe Area
If the banner overlaps with status bar or notch:

```javascript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GlobalMaintenanceBanner = () => {
  const insets = useSafeAreaInsets();
  const showMaintenance = true;

  if (!showMaintenance) return null;

  return (
    <View style={[
      styles.maintenanceBannerContainer,
      { paddingTop: insets.top }
    ]}>
      <MaintenanceBanner />
    </View>
  );
};
```

## Multi-Language Support

The banner automatically uses the app's current language. Default messages are available in:
- English
- Myanmar
- Chinese
- Thai
- Khmer

To use default translated messages, don't pass a `message` prop:
```javascript
<MaintenanceBanner />  // Uses translated default message
```

To use custom message (not translated):
```javascript
<MaintenanceBanner message="Your custom message" />
```

## Quick Actions

### Hide Banner Immediately
Set `showMaintenance = false` in `App.js` line ~113

### Show Banner Immediately
Set `showMaintenance = true` in `App.js` line ~113

### Change Message
Add `message` prop to `<MaintenanceBanner />` in `App.js` line ~119

### Change Color/Type
Add `type` prop: `<MaintenanceBanner type="info" />` or `type="error"`

## Testing

To test the banner:
1. Make sure `showMaintenance = true` in `App.js`
2. Reload the app
3. The banner should appear at the top of all screens
4. Navigate between screens to verify it stays visible

## Production Deployment

Before deploying:
1. Decide on control method (simple toggle, API, AsyncStorage)
2. Set `showMaintenance = false` if no maintenance is planned
3. Implement API endpoint if using remote control
4. Test banner visibility on all screens
5. Test in both light and dark modes

## Support

For issues or questions, refer to:
- `MAINTENANCE_BANNER_USAGE.md` - Detailed usage examples
- `src/components/MaintenanceBanner.js` - Component source code
- `src/contexts/LanguageContext.js` - Translation strings

