/**
 * Pickup Request UI Components
 * Reusable components for pickup request screens
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Context and utilities
import { useTheme } from '../contexts/ThemeContext';
import { createMediumShadow } from '../utils/commonStyles';
import { formatDistance } from '../services/locationService';

/**
 * Location Status Card Component
 * Shows current location status and distance from campus
 */
export const LocationStatusCard = ({ locationStatus, canMakeRequest }) => {
  const { theme } = useTheme();

  if (!locationStatus) return null;

  const statusColor = canMakeRequest ? theme.colors.success : theme.colors.error;
  const statusIcon = canMakeRequest ? 'check-circle' : 'exclamation-triangle';

  return (
    <View style={[styles.statusCard, createMediumShadow(), { backgroundColor: theme.colors.surface }]}>
      <View style={styles.statusHeader}>
        <FontAwesome5 name="map-marker-alt" size={20} color={theme.colors.primary} />
        <Text style={[styles.statusTitle, { color: theme.colors.onSurface }]}>
          Location Status
        </Text>
      </View>
      
      <View style={styles.statusContent}>
        <FontAwesome5 name={statusIcon} size={16} color={statusColor} />
        <Text style={[styles.statusMessage, { color: statusColor }]}>
          {locationStatus.message}
        </Text>
      </View>

      {locationStatus.distance && (
        <Text style={[styles.distanceText, { color: theme.colors.onSurfaceVariant }]}>
          Distance from campus: {formatDistance(locationStatus.distance)}
        </Text>
      )}
    </View>
  );
};

/**
 * Student Info Card Component
 * Displays student information for pickup requests
 */
export const StudentInfoCard = ({ student, title = "Student Information" }) => {
  const { theme } = useTheme();

  if (!student) return null;

  return (
    <View style={[styles.infoCard, createMediumShadow(), { backgroundColor: theme.colors.surface }]}>
      <View style={styles.infoHeader}>
        <FontAwesome5 name="user-graduate" size={20} color={theme.colors.primary} />
        <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
      </View>
      
      <View style={styles.infoContent}>
        <Text style={[styles.primaryText, { color: theme.colors.onSurface }]}>
          {student.name}
        </Text>
        <Text style={[styles.secondaryText, { color: theme.colors.onSurfaceVariant }]}>
          Student ID: {student.student_id}
        </Text>
        {student.grade && student.class_name && (
          <Text style={[styles.secondaryText, { color: theme.colors.onSurfaceVariant }]}>
            Grade {student.grade} • Class {student.class_name}
          </Text>
        )}
      </View>
    </View>
  );
};

/**
 * Guardian Info Card Component
 * Displays guardian information for pickup requests
 */
export const GuardianInfoCard = ({ guardian, title = "Guardian Information" }) => {
  const { theme } = useTheme();

  if (!guardian) return null;

  return (
    <View style={[styles.infoCard, createMediumShadow(), { backgroundColor: theme.colors.surface }]}>
      <View style={styles.infoHeader}>
        <FontAwesome5 name="id-card" size={20} color={theme.colors.primary} />
        <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
      </View>
      
      <View style={styles.infoContent}>
        <Text style={[styles.primaryText, { color: theme.colors.onSurface }]}>
          {guardian.name}
        </Text>
        <Text style={[styles.secondaryText, { color: theme.colors.onSurfaceVariant }]}>
          Relation: {guardian.relation}
        </Text>
        {guardian.phone && (
          <Text style={[styles.secondaryText, { color: theme.colors.onSurfaceVariant }]}>
            Phone: {guardian.phone}
          </Text>
        )}
      </View>
    </View>
  );
};

/**
 * Child Selection Component
 * Allows parents to select which child to create pickup request for
 */
export const ChildSelectionCard = ({ children, selectedChild, onChildSelect, title = "Select Child for Pickup" }) => {
  const { theme } = useTheme();

  if (!children || children.length === 0) return null;

  return (
    <View style={[styles.selectionCard, createMediumShadow(), { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.selectionTitle, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      
      {children.map((child) => (
        <TouchableOpacity
          key={child.student_id}
          style={[
            styles.selectionOption,
            {
              backgroundColor: selectedChild?.student_id === child.student_id 
                ? theme.colors.primaryContainer 
                : theme.colors.surface,
              borderColor: selectedChild?.student_id === child.student_id 
                ? theme.colors.primary 
                : theme.colors.outline,
            }
          ]}
          onPress={() => onChildSelect(child)}
        >
          <View style={styles.selectionInfo}>
            <Text style={[
              styles.selectionName, 
              { 
                color: selectedChild?.student_id === child.student_id 
                  ? theme.colors.onPrimaryContainer 
                  : theme.colors.onSurface 
              }
            ]}>
              {child.name}
            </Text>
            <Text style={[
              styles.selectionDetails, 
              { 
                color: selectedChild?.student_id === child.student_id 
                  ? theme.colors.onPrimaryContainer 
                  : theme.colors.onSurfaceVariant 
              }
            ]}>
              Grade {child.grade} • Class {child.class_name}
            </Text>
          </View>
          
          {selectedChild?.student_id === child.student_id && (
            <FontAwesome5 name="check" size={16} color={theme.colors.onPrimaryContainer} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

/**
 * Pickup Request Button Component
 * Main action button for creating pickup requests
 */
export const PickupRequestButton = ({ 
  onPress, 
  disabled, 
  loading, 
  text = "Create Pickup Request",
  icon = "car" 
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        {
          backgroundColor: !disabled 
            ? theme.colors.primary 
            : theme.colors.surfaceVariant,
        }
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.onPrimary} />
      ) : (
        <>
          <FontAwesome5 name={icon} size={16} color={
            !disabled 
              ? theme.colors.onPrimary 
              : theme.colors.onSurfaceVariant
          } />
          <Text style={[
            styles.actionButtonText,
            {
              color: !disabled 
                ? theme.colors.onPrimary 
                : theme.colors.onSurfaceVariant
            }
          ]}>
            {text}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

/**
 * Instructions Card Component
 * Shows helpful instructions for pickup requests
 */
export const InstructionsCard = ({ 
  text = "You must be within 150 meters of the school campus to create a pickup request. Make sure your location services are enabled and you have a clear GPS signal.",
  icon = "info-circle" 
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.instructionsCard, { backgroundColor: theme.colors.surfaceVariant }]}>
      <FontAwesome5 name={icon} size={16} color={theme.colors.primary} />
      <Text style={[styles.instructionsText, { color: theme.colors.onSurfaceVariant }]}>
        {text}
      </Text>
    </View>
  );
};

/**
 * Distance Display Component
 * Shows formatted distance with appropriate styling
 */
export const DistanceDisplay = ({ distance, threshold = 150, showStatus = true }) => {
  const { theme } = useTheme();

  if (distance === null || distance === undefined) return null;

  const isWithinRange = distance <= threshold;
  const statusColor = isWithinRange ? theme.colors.success : theme.colors.error;
  const statusIcon = isWithinRange ? 'check-circle' : 'exclamation-triangle';

  return (
    <View style={styles.distanceContainer}>
      <Text style={[styles.distanceValue, { color: theme.colors.onSurface }]}>
        {formatDistance(distance)}
      </Text>
      {showStatus && (
        <View style={styles.distanceStatus}>
          <FontAwesome5 name={statusIcon} size={14} color={statusColor} />
          <Text style={[styles.distanceStatusText, { color: statusColor }]}>
            {isWithinRange ? 'Within range' : 'Too far'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContent: {
    marginLeft: 4,
  },
  primaryText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 14,
    marginBottom: 2,
  },
  selectionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectionDetails: {
    fontSize: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  distanceContainer: {
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  distanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceStatusText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default {
  LocationStatusCard,
  StudentInfoCard,
  GuardianInfoCard,
  ChildSelectionCard,
  PickupRequestButton,
  InstructionsCard,
  DistanceDisplay,
};
