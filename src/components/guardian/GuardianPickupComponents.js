/**
 * Guardian & Pickup Management Components
 * Reusable components for the unified guardian and pickup management screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUserShield,
  faCar,
  faExclamationTriangle,
  faHistory,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faQrcode,
} from '@fortawesome/free-solid-svg-icons';

// Context and utilities
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  createMediumShadow,
  createSmallShadow,
} from '../../utils/commonStyles';

/**
 * Quick Actions Grid Component
 * Displays quick action buttons for common operations
 */
export const QuickActionsGrid = ({
  onAddGuardian,
  onCreatePickup,
  onEmergencyPickup,
  onViewHistory,
  canMakeRequest = false,
  loading = false,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const quickActions = [
    {
      id: 'add-guardian',
      title: t('addGuardian') || 'Add Guardian',
      icon: faUserShield,
      backgroundColor: theme.colors.primary,
      onPress: onAddGuardian,
      disabled: loading,
    },
    {
      id: 'create-pickup',
      title: t('requestPickup') || 'Request Pickup',
      icon: faCar,
      backgroundColor: canMakeRequest
        ? theme.colors.success
        : theme.colors.textSecondary,
      onPress: onCreatePickup,
      disabled: !canMakeRequest || loading,
    },
    {
      id: 'emergency',
      title: t('emergency') || 'Emergency',
      icon: faExclamationTriangle,
      backgroundColor: theme.colors.warning,
      onPress: onEmergencyPickup,
      disabled: loading,
    },
    {
      id: 'history',
      title: t('history') || 'History',
      icon: faHistory,
      backgroundColor: theme.colors.info,
      onPress: onViewHistory,
      disabled: loading,
    },
  ];

  return (
    <View style={[styles.quickActionsContainer, { marginBottom: 0 }]}>
      <Text
        style={[styles.quickActionsTitle, { color: theme.colors.onSurface }]}
      >
        {t('quickActions') || 'Quick Actions'}
      </Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.quickActionButton,
              { backgroundColor: action.backgroundColor },
              action.disabled && styles.disabledButton,
              createMediumShadow(theme),
            ]}
            onPress={action.onPress}
            disabled={action.disabled}
          >
            {loading && action.id === 'create-pickup' ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <FontAwesomeIcon icon={action.icon} size={20} color='#fff' />
            )}
            <Text style={styles.quickActionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

/**
 * Pickup Status Card Component
 * Shows current pickup request status
 */
export const PickupStatusCard = ({ pickup, onPress, onGenerateQR }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'waiting':
        return { icon: faClock, color: theme.colors.warning };
      case 'approved':
      case 'ready':
        return { icon: faCheckCircle, color: theme.colors.success };
      case 'completed':
        return { icon: faCheckCircle, color: theme.colors.success };
      case 'cancelled':
      case 'rejected':
        return { icon: faTimesCircle, color: theme.colors.error };
      default:
        return { icon: faClock, color: theme.colors.textSecondary };
    }
  };

  const statusInfo = getStatusIcon(pickup.status);

  return (
    <TouchableOpacity
      style={[
        styles.pickupStatusCard,
        { backgroundColor: theme.colors.surface },
        createMediumShadow(theme),
      ]}
      onPress={() => onPress && onPress(pickup)}
    >
      <View style={styles.pickupStatusHeader}>
        <View style={styles.pickupStatusInfo}>
          <FontAwesomeIcon
            icon={statusInfo.icon}
            size={16}
            color={statusInfo.color}
          />
          <Text
            style={[styles.pickupStatusText, { color: theme.colors.onSurface }]}
          >
            {pickup.student_name}
          </Text>
        </View>
        <Text style={[styles.pickupStatusBadge, { color: statusInfo.color }]}>
          {pickup.status?.toUpperCase()}
        </Text>
      </View>

      <View style={styles.pickupStatusDetails}>
        <Text
          style={[
            styles.pickupDetailText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t('requestTime')}:{' '}
          {pickup.created_at ||
            new Date(pickup.request_time).toLocaleTimeString()}
        </Text>
        {pickup.distance && (
          <Text
            style={[
              styles.pickupDetailText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {t('distance')}: {pickup.distance}
          </Text>
        )}
      </View>

      {onGenerateQR && (
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => onGenerateQR(pickup)}
        >
          <FontAwesomeIcon
            icon={faQrcode}
            size={16}
            color={theme.colors.primary}
          />
          <Text style={[styles.qrButtonText, { color: theme.colors.primary }]}>
            {t('generateQR') || 'QR Code'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

/**
 * Location Status Banner Component
 * Shows pickup eligibility status
 */
export const LocationStatusBanner = ({ locationStatus, canMakeRequest }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  if (!locationStatus) return null;

  const statusColor = canMakeRequest
    ? theme.colors.success
    : theme.colors.error;
  const statusIcon = canMakeRequest ? faCheckCircle : faExclamationTriangle;
  const backgroundColor = canMakeRequest
    ? theme.colors.successLight || `${theme.colors.success}20`
    : theme.colors.errorLight || `${theme.colors.error}20`;

  return (
    <View
      style={[
        styles.locationStatusBanner,
        { backgroundColor },
        createSmallShadow(theme),
      ]}
    >
      <FontAwesomeIcon icon={statusIcon} size={20} color={statusColor} />
      <View style={styles.locationStatusContent}>
        <Text style={[styles.locationStatusTitle, { color: statusColor }]}>
          {canMakeRequest
            ? t('eligibleForPickup') || 'Eligible for Pickup'
            : t('notEligible') || 'Not Eligible'}
        </Text>
        <Text
          style={[
            styles.locationStatusMessage,
            { color: theme.colors.textSecondary },
          ]}
        >
          {locationStatus.message}
        </Text>
      </View>
    </View>
  );
};

/**
 * Guardian Summary Card Component
 * Shows summary of guardians for a child
 */
export const GuardianSummaryCard = ({
  guardians,
  selectedChild,
  onManageGuardians,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const activeGuardians = guardians.filter((g) => g.status === 1);
  const totalGuardians = guardians.length;

  return (
    <TouchableOpacity
      style={[
        styles.summaryCard,
        { backgroundColor: theme.colors.surface },
        createMediumShadow(),
      ]}
      onPress={onManageGuardians}
    >
      <View style={styles.summaryHeader}>
        <FontAwesomeIcon
          icon={faUserShield}
          size={20}
          color={theme.colors.primary}
        />
        <Text style={[styles.summaryTitle, { color: theme.colors.onSurface }]}>
          {t('authorizedGuardians') || 'Authorized Guardians'}
        </Text>
      </View>

      <View style={styles.summaryContent}>
        <Text style={[styles.summaryCount, { color: theme.colors.primary }]}>
          {activeGuardians.length}
        </Text>
        <Text
          style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}
        >
          {t('activeGuardians') || 'Active'}
        </Text>
      </View>

      {selectedChild && (
        <Text
          style={[styles.summarySubtext, { color: theme.colors.textSecondary }]}
        >
          {t('for')} {selectedChild.name}
        </Text>
      )}
    </TouchableOpacity>
  );
};

/**
 * Empty State Component for Guardians
 */
export const GuardianEmptyState = ({ onAddGuardian }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <View
      style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}
    >
      <FontAwesomeIcon
        icon={faUserShield}
        size={48}
        color={theme.colors.textSecondary}
      />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
        {t('noGuardiansAdded') || 'No Guardians Added'}
      </Text>
      <Text
        style={[
          styles.emptyStateMessage,
          { color: theme.colors.textSecondary },
        ]}
      >
        {t('addGuardiansMessage') ||
          'Add authorized guardians who can pick up your child'}
      </Text>
      <TouchableOpacity
        style={[
          styles.emptyStateButton,
          { backgroundColor: theme.colors.primary },
        ]}
        onPress={onAddGuardian}
      >
        <FontAwesomeIcon icon={faUserShield} size={16} color='#fff' />
        <Text style={styles.emptyStateButtonText}>
          {t('addGuardian') || 'Add Guardian'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Quick Actions Styles
  quickActionsContainer: {
    // Remove any default margins that might be causing spacing issues
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12, // Space between title and grid
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12, // Restore original margin for other components
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12, // Add spacing between rows only, not after last row
  },
  quickActionButton: {
    width: '48%',
    aspectRatio: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column', // Stack icon and text vertically
    paddingVertical: 8,
    marginBottom: 0, // Remove bottom margin to prevent unwanted spacing
  },
  disabledButton: {
    opacity: 0.6,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 6, // Proper spacing between icon and text
    textAlign: 'center', // Center the text
  },

  // Pickup Status Card Styles
  pickupStatusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pickupStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickupStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickupStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pickupStatusBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickupStatusDetails: {
    marginBottom: 12,
  },
  pickupDetailText: {
    fontSize: 14,
    marginBottom: 2,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'currentColor',
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Location Status Banner Styles
  locationStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  locationStatusContent: {
    marginLeft: 12,
    flex: 1,
  },
  locationStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationStatusMessage: {
    fontSize: 10,
  },

  // Summary Card Styles
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summarySubtext: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    marginVertical: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default {
  QuickActionsGrid,
  PickupStatusCard,
  LocationStatusBanner,
  GuardianSummaryCard,
  GuardianEmptyState,
};
