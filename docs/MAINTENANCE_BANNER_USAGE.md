# Maintenance Banner Usage Guide

## Overview
The `MaintenanceBanner` component displays an in-app notification for maintenance messages.

## Component Location
`src/components/MaintenanceBanner.js`

## Usage Examples

### 1. Basic Usage (Default Warning)
```javascript
import MaintenanceBanner from '../components/MaintenanceBanner';

// In your screen component
<MaintenanceBanner />
```
This displays: "App is under maintenance. We apologize for the inconvenience."

### 2. Custom Message
```javascript
<MaintenanceBanner 
  type="warning"
  message="Scheduled maintenance from 2:00 AM to 4:00 AM. We apologize for the inconvenience."
/>
```

### 3. Different Types

#### Warning (Orange - Default)
```javascript
<MaintenanceBanner type="warning" />
```

#### Info (Blue)
```javascript
<MaintenanceBanner 
  type="info"
  message="System upgrade in progress. Some features may be temporarily unavailable."
/>
```

#### Error (Red)
```javascript
<MaintenanceBanner 
  type="error"
  message="Service temporarily unavailable. Please try again later."
/>
```

### 4. Custom Styling
```javascript
<MaintenanceBanner 
  type="warning"
  customStyle={{ marginTop: 20, marginHorizontal: 0 }}
/>
```

## Integration Examples

### Option A: Add to Specific Screens

#### Example: Add to GradesScreen
```javascript
// In src/screens/GradesScreen.js
import MaintenanceBanner from '../components/MaintenanceBanner';

// Inside the render, after the header:
<SafeAreaView style={styles.container}>
  <CustomHeader title={t('grades')} showBackButton={true} />
  
  {/* Add maintenance banner here */}
  <MaintenanceBanner />
  
  <ScrollView>
    {/* Rest of your content */}
  </ScrollView>
</SafeAreaView>
```

### Option B: Add to All Screens (Global)

#### Method 1: Add to App.js or Main Navigator

```javascript
// In App.js or your main navigator
import MaintenanceBanner from './MaintenanceBanner';

function App() {
    return (
        <NavigationContainer>
            {/* Add banner at the top level */}
            <MaintenanceBanner/>

            <Stack.Navigator>
                {/* Your screens */}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
```

#### Method 2: Add to CustomHeader Component
```javascript
// In src/components/CustomHeader.js
import MaintenanceBanner from './MaintenanceBanner';

const CustomHeader = ({ title, showBackButton }) => {
  return (
    <>
      <View style={styles.header}>
        {/* Header content */}
      </View>
      
      {/* Add banner below header */}
      <MaintenanceBanner />
    </>
  );
};
```

### Option C: Conditional Display (Controlled by API/Config)

```javascript
import { useState, useEffect } from 'react';
import MaintenanceBanner from '../components/MaintenanceBanner';

const YourScreen = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    // Check maintenance status from API or AsyncStorage
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      // Option 1: From API
      const response = await fetch('YOUR_API/maintenance-status');
      const data = await response.json();
      setMaintenanceMode(data.isUnderMaintenance);
      setMaintenanceMessage(data.message);

      // Option 2: From AsyncStorage (set by admin)
      // const status = await AsyncStorage.getItem('maintenanceMode');
      // setMaintenanceMode(status === 'true');
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Your Screen" />
      
      {/* Conditionally show banner */}
      {maintenanceMode && (
        <MaintenanceBanner 
          type="warning"
          message={maintenanceMessage}
        />
      )}
      
      {/* Rest of your content */}
    </SafeAreaView>
  );
};
```

### Option D: Create a Global Maintenance Context

```javascript
// src/contexts/MaintenanceContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MaintenanceContext = createContext();

export const MaintenanceProvider = ({ children }) => {
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('warning');

  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const status = await AsyncStorage.getItem('maintenanceMode');
      const message = await AsyncStorage.getItem('maintenanceMessage');
      const type = await AsyncStorage.getItem('maintenanceType');
      
      setIsUnderMaintenance(status === 'true');
      setMaintenanceMessage(message || '');
      setMaintenanceType(type || 'warning');
    } catch (error) {
      console.error('Error checking maintenance:', error);
    }
  };

  const enableMaintenance = async (message, type = 'warning') => {
    await AsyncStorage.setItem('maintenanceMode', 'true');
    await AsyncStorage.setItem('maintenanceMessage', message);
    await AsyncStorage.setItem('maintenanceType', type);
    setIsUnderMaintenance(true);
    setMaintenanceMessage(message);
    setMaintenanceType(type);
  };

  const disableMaintenance = async () => {
    await AsyncStorage.removeItem('maintenanceMode');
    await AsyncStorage.removeItem('maintenanceMessage');
    await AsyncStorage.removeItem('maintenanceType');
    setIsUnderMaintenance(false);
    setMaintenanceMessage('');
  };

  return (
    <MaintenanceContext.Provider
      value={{
        isUnderMaintenance,
        maintenanceMessage,
        maintenanceType,
        enableMaintenance,
        disableMaintenance,
        checkMaintenanceStatus,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => useContext(MaintenanceContext);
```

Then use it in any screen:
```javascript
import { useMaintenance } from '../contexts/MaintenanceContext';
import MaintenanceBanner from '../components/MaintenanceBanner';

const YourScreen = () => {
  const { isUnderMaintenance, maintenanceMessage, maintenanceType } = useMaintenance();

  return (
    <SafeAreaView>
      {isUnderMaintenance && (
        <MaintenanceBanner 
          type={maintenanceType}
          message={maintenanceMessage}
        />
      )}
      {/* Rest of content */}
    </SafeAreaView>
  );
};
```

## Translations

The component supports multi-language translations. Default messages are available in:
- English (en)
- Myanmar (my)
- Chinese (zh)
- Thai (th)
- Khmer (km)

Translation keys:
- `maintenanceWarning` - Default warning message
- `maintenanceInfo` - Info message
- `maintenanceError` - Error message

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | `'warning'` | Banner type: `'warning'`, `'info'`, or `'error'` |
| `message` | string | (from translations) | Custom message to display |
| `customStyle` | object | `{}` | Additional styles for the banner container |

## Styling

The banner automatically adapts to:
- Light/Dark theme
- Different screen sizes
- RTL languages (if configured)

## Quick Start - Recommended Approach

For immediate use, add to your main screens:

```javascript
// In src/screens/ParentScreen.js, TeacherScreen.js, etc.
import MaintenanceBanner from '../components/MaintenanceBanner';

// Add right after the header:
<CustomHeader title={t('home')} />
<MaintenanceBanner />
```

This will show the maintenance banner on all main screens with the default message.

