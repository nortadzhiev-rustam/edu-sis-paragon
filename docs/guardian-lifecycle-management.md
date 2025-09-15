# Guardian Lifecycle Management Implementation

## Overview

This document describes the implementation of the Guardian Soft-Delete vs Hard-Delete system in the edu-sis-paragon React Native application. The system provides three lifecycle management operations for pickup guardians.

## System Architecture

### 🟡 Soft Delete (Deactivate Guardian)
**Purpose**: Reversible deactivation for temporary guardian suspension

**Implementation**:
- **API Endpoint**: `POST /mobile-api/pickup/guardians/deactivate`
- **Service Function**: `guardianService.deactivateGuardian(authCode, pickupCardId)`
- **Database Action**: Sets `status = 0` in `students_pickup_cards` table
- **Data Preservation**: All guardian data remains intact
- **Mobile Access**: Removes mobile device access
- **Reversibility**: ✅ Can be reactivated using `reactivateGuardian`

### 🔴 Hard Delete (Permanent Removal)
**Purpose**: Irreversible removal for permanent guardian termination

**Implementation**:
- **API Endpoint**: `DELETE /mobile-api/pickup/guardians/delete`
- **Service Function**: `guardianService.deleteGuardian(authCode, pickupCardId)`
- **Database Action**: Completely removes record from `students_pickup_cards` table
- **Data Preservation**: ❌ All data is permanently lost
- **Mobile Access**: Removes mobile device access
- **Reversibility**: ❌ Cannot be undone

### 🟢 Reactivate Guardian
**Purpose**: Restore previously deactivated guardians

**Implementation**:
- **API Endpoint**: `POST /mobile-api/pickup/guardians/reactivate`
- **Service Function**: `guardianService.reactivateGuardian(authCode, pickupCardId)`
- **Database Action**: Restores `status = 1` for deactivated guardians
- **Guardian Limit**: Enforces 5-guardian limit per student
- **Data Preservation**: ✅ All original data preserved
- **Mobile Access**: Restores mobile device access

## Frontend Implementation

### Service Layer (`src/services/guardianService.js`)

```javascript
// Soft Delete (Deactivate)
export const deactivateGuardian = async (authCode, pickupCardId) => {
  // Sets status = 0, preserves data, removes mobile access
}

// Hard Delete (Permanent)
export const deleteGuardian = async (authCode, pickupCardId) => {
  // Permanently removes record, cannot be undone
}

// Reactivate
export const reactivateGuardian = async (authCode, pickupCardId) => {
  // Restores status = 1, checks guardian limit
}
```

### UI Components (`src/components/guardian/GuardianCard.js`)

**Enhanced GuardianCard with Lifecycle Actions**:
- **Primary Actions Row**: View QR, Pickup Request, Rotate QR
- **Lifecycle Actions Row**: Context-sensitive based on guardian status
  - **Active Guardians**: Show Deactivate + Delete buttons
  - **Inactive Guardians**: Show Reactivate + Delete buttons

**User Experience Features**:
- **Confirmation Dialogs**: Different confirmation flows for each operation
- **Visual Indicators**: Color-coded buttons (🟡 Orange, 🔴 Red, 🟢 Green)
- **Safety Warnings**: Double confirmation for hard delete operations

### Screen Integration (`src/screens/GuardianPickupManagementScreen.js`)

**Handler Functions**:
```javascript
const handleDeactivateGuardian = async (pickupCardId) => {
  // Handles soft delete with user feedback
}

const handleDeleteGuardian = async (pickupCardId) => {
  // Handles hard delete with safety confirmations
}

const handleReactivateGuardian = async (pickupCardId) => {
  // Handles reactivation with guardian limit checking
}
```

## API Endpoints Configuration

### Added to `src/config/env.js`:
```javascript
// Guardian Lifecycle API Endpoints
DEACTIVATE_GUARDIAN: '/mobile-api/pickup/guardians/deactivate',
DELETE_GUARDIAN: '/mobile-api/pickup/guardians/delete',
REACTIVATE_GUARDIAN: '/mobile-api/pickup/guardians/reactivate',
```

## Security & Permissions

### Parent Authorization
- All operations require parent authentication via `authCode`
- Parents can only manage guardians for their own children
- Parent-child relationship verified via `students_family` table

### Academic Year Filtering
- Operations respect current academic year boundaries
- Parents can only manage guardians for children enrolled in current year
- Historical guardians from previous years are protected

### Guardian Limit Enforcement
- Maximum 5 active guardians per student
- Reactivation checks current active count before proceeding
- Provides detailed feedback on guardian limit status

## User Interface Design

### Action Button Layout
```
Primary Actions Row:
[View QR] [Pickup] [Rotate QR]

Lifecycle Actions Row (Active Guardian):
[🟡 Deactivate] [🔴 Delete]

Lifecycle Actions Row (Inactive Guardian):
[🟢 Reactivate] [🔴 Delete]
```

### Confirmation Dialogs

**Soft Delete Confirmation**:
- Explains reversible nature
- Highlights data preservation
- Single confirmation required

**Hard Delete Confirmation**:
- ⚠️ Strong warning about permanent deletion
- Double confirmation required
- Clear explanation of irreversibility

**Reactivate Confirmation**:
- Explains restoration of access
- Shows guardian limit information
- Single confirmation required

## Testing

### Unit Tests (`src/tests/guardianLifecycleManagement.test.js`)
- Tests all three lifecycle operations
- Validates API endpoint configuration
- Tests error handling scenarios
- Verifies guardian limit enforcement

### Demo Utilities (`src/utils/guardianLifecycleDemo.js`)
- Interactive demonstration of lifecycle operations
- Safe testing environment with detailed logging
- Separate hard delete demo with safety warnings

## Best Practices

### When to Use Each Operation

**🟡 Soft Delete (Deactivate)**:
- Temporary guardian suspension
- Driver on vacation
- Temporary relationship changes
- When you might need to restore access later

**🔴 Hard Delete**:
- Permanent guardian termination
- Fired driver or unauthorized person
- Data cleanup for privacy compliance
- Guardian created by mistake

**🟢 Reactivate**:
- Restore temporarily suspended guardian
- Driver returns from vacation
- Relationship restored
- Accidental deactivation correction

### Safety Guidelines

1. **Always use soft delete first** for temporary changes
2. **Reserve hard delete** for permanent, irreversible situations
3. **Check pickup history dependencies** before hard delete
4. **Inform parents** about the difference between operations
5. **Verify guardian limit** before reactivation

## Error Handling

### Common Error Scenarios
- Guardian not found
- Guardian already in target state
- Guardian limit exceeded (reactivation)
- Active pickup requests (deletion)
- Network connectivity issues

### User Feedback
- Clear success/error messages
- Guardian limit status information
- Operation confirmation details
- Next steps guidance

## Academic Year Impact

### Year-Specific Guardians
- Guardians are filtered by current academic year
- Previous year guardians automatically filtered out
- New guardians created for current academic year only
- Historical data preserved but not accessible for modification

This implementation provides a robust, secure, and user-friendly guardian lifecycle management system that balances data preservation with operational flexibility.
