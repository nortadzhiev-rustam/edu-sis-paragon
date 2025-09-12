# Mobile Branch Selection Integration

## Overview

This document describes the implementation of the mobile branch selection system in the React Native app, which integrates with the backend API endpoints for branch switching functionality.

## 🔧 Implementation Components

### 1. API Configuration (`src/config/env.js`)

Added new API endpoints:
```javascript
// Branch Selection API Endpoints
SWITCH_BRANCH: '/switch-branch/',
GET_CURRENT_BRANCH: '/get-current-branch/',
```

### 2. Branch Selection Service (`src/services/branchSelectionService.js`)

Core service that handles all branch-related API calls:

#### Key Functions:
- `switchBranch(authCode, branchId)` - Switch to a different branch
- `getCurrentBranchInfo(authCode)` - Get current branch and accessible branches
- `hasMultipleBranches(authCode)` - Check if user has multiple branch access
- `getAccessibleBranches(authCode)` - Get list of accessible branches
- `switchBranchWithStorage(authCode, branchId, callback)` - Switch branch and update local storage

#### Usage Example:
```javascript
import { switchBranchWithStorage, getCurrentBranchInfo } from '../services/branchSelectionService';

// Get current branch information
const branchInfo = await getCurrentBranchInfo(authCode);
console.log('Current branch:', branchInfo.current_branch.branch_name);
console.log('Accessible branches:', branchInfo.accessible_branches);

// Switch to a different branch
const response = await switchBranchWithStorage(authCode, branchId);
if (response.success) {
  console.log('Switched to:', response.current_branch.branch_name);
}
```

### 3. Enhanced TeacherScreen (`src/screens/TeacherScreen.js`)

Updated the teacher screen to integrate with the branch selection API:

#### New State Variables:
```javascript
const [currentBranchInfo, setCurrentBranchInfo] = useState(null);
const [accessibleBranches, setAccessibleBranches] = useState([]);
const [branchSwitching, setBranchSwitching] = useState(false);
```

#### Enhanced Functions:
- `loadBranchInfo()` - Loads branch information from API
- `handleBranchSelection()` - Enhanced with API integration and fallback
- Branch selector UI now shows loading states and uses API data

### 4. Demo Component (`src/components/BranchSelectorDemo.js`)

A standalone demo component that showcases the branch selection functionality:

```javascript
import BranchSelectorDemo from '../components/BranchSelectorDemo';

<BranchSelectorDemo 
  authCode={userData.authCode}
  onBranchChange={(newBranch) => {
    console.log('Branch changed to:', newBranch.branch_name);
  }}
/>
```

## 🎯 API Integration Flow

### 1. Login Flow Enhancement
```
1. User logs in → Receives accessible_branches and current_branch in login response
2. App stores branch information locally
3. App calls getCurrentBranchInfo() to get latest branch status
4. App shows branch selector if user has multiple branches
```

### 2. Branch Selection Flow
```
1. User selects different branch from dropdown
2. App calls switchBranchWithStorage(authCode, branchId)
3. API updates user's active branch on server
4. App receives updated branch information
5. App refreshes current screen data with new branch context
6. Local storage is updated with new branch selection
```

### 3. Data Fetching Flow
```
1. App loads branch info from API first
2. App prioritizes API branch data over local data
3. App falls back to existing local branch logic if API fails
4. All data fetching uses current active branch context
```

## 🛡️ Error Handling & Fallbacks

### API Failure Handling
- If branch API calls fail, the app falls back to existing local storage logic
- Users can still switch branches locally even if API is unavailable
- Error messages are logged but not shown to users to maintain UX

### Backward Compatibility
- All existing branch selection logic remains intact
- New API integration is additive, not replacing existing functionality
- Apps work normally even if backend doesn't support new endpoints yet

## 🎨 UI/UX Enhancements

### Loading States
- Branch switching shows loading indicator
- Dropdown items are disabled during switching
- Visual feedback for current active branch

### Enhanced Branch Display
- Prioritizes API current branch info over local data
- Shows branch switching status
- Maintains existing visual design with enhanced functionality

## 🔧 Testing

### Manual Testing Steps
1. Login as a teacher with multiple branch access
2. Verify branch selector appears in teacher dashboard
3. Switch between branches and verify:
   - API calls are made correctly
   - UI updates with new branch information
   - Local storage is updated
   - Data refreshes for new branch context

### Demo Component Testing
Add the BranchSelectorDemo component to any screen to test the API integration:

```javascript
// Add to any screen for testing
{__DEV__ && (
  <BranchSelectorDemo 
    authCode={userData.authCode}
    onBranchChange={(newBranch) => {
      Alert.alert('Branch Changed', `Now viewing: ${newBranch.branch_name}`);
    }}
  />
)}
```

## 📋 Next Steps

### Backend Requirements
Ensure the following API endpoints are implemented on the backend:

1. **POST /mobile-api/switch-branch/**
   - Request: `{ authCode, branch_id }`
   - Response: `{ success, current_branch, message }`

2. **POST /mobile-api/get-current-branch/**
   - Request: `{ authCode }`
   - Response: `{ success, current_branch, accessible_branches }`

### Mobile App Integration
1. Test with real backend API endpoints
2. Update other screens to use branch-aware data fetching
3. Add branch context to navigation parameters where needed
4. Implement branch selection for parent/student screens if required

### Performance Optimization
1. Cache branch information to reduce API calls
2. Implement branch change notifications for real-time updates
3. Add offline support for branch selection

## 🚀 Deployment Checklist

- [ ] Backend API endpoints implemented and tested
- [ ] Mobile app updated with branch selection service
- [ ] TeacherScreen enhanced with API integration
- [ ] Error handling and fallbacks tested
- [ ] UI/UX enhancements verified
- [ ] Demo component tested (remove from production)
- [ ] Documentation updated
- [ ] Performance testing completed

The mobile branch selection system is now ready for integration with the backend API!
