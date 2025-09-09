/**
 * Pickup History UI Components
 * Reusable components for pickup history screens
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Context and utilities
import { useTheme } from '../contexts/ThemeContext';
import { createMediumShadow } from '../utils/commonStyles';

/**
 * Pickup History Item Component
 * Displays individual pickup history record
 */
export const PickupHistoryItem = ({ item, onPress }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => onPress && onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.historyHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.student.name}</Text>
          <Text style={styles.pickupDate}>{item.formatted_date}</Text>
        </View>
        <Text style={styles.pickupTime}>{item.formatted_time}</Text>
      </View>

      <View style={styles.historyDetails}>
        <View style={styles.detailRow}>
          <FontAwesome5
            name="user"
            size={14}
            color={theme.colors.textSecondary}
            style={styles.detailIcon}
          />
          <Text style={styles.detailText}>
            {item.pickup_person.name} ({item.pickup_person.relation})
          </Text>
        </View>

        <View style={styles.detailRow}>
          <FontAwesome5
            name="user-tie"
            size={14}
            color={theme.colors.textSecondary}
            style={styles.detailIcon}
          />
          <Text style={styles.detailText}>
            Processed by: {item.processed_by.staff_name}
          </Text>
        </View>

        <View style={styles.pickupTypeContainer}>
          <View
            style={[
              styles.pickupTypeBadge,
              {
                backgroundColor:
                  item.pickup_person.type === 'parent'
                    ? theme.colors.success + '20'
                    : theme.colors.warning + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.pickupTypeText,
                {
                  color:
                    item.pickup_person.type === 'parent'
                      ? theme.colors.success
                      : theme.colors.warning,
                },
              ]}
            >
              {item.pickup_person.type === 'parent' ? 'Parent' : 'Guardian'} Pickup
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Pickup History Summary Card Component
 * Shows summary statistics for pickup history
 */
export const PickupHistorySummary = ({ summary, userType }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (!summary) return null;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>
        {userType === 'parent' ? 'Family Pickup Summary' : 'Your Pickup Summary'}
      </Text>
      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary.total_pickups}</Text>
          <Text style={styles.statLabel}>Total Pickups</Text>
        </View>
        {userType === 'parent' && (
          <>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.parent_pickups}</Text>
              <Text style={styles.statLabel}>By Parent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.guardian_pickups}</Text>
              <Text style={styles.statLabel}>By Guardian</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

/**
 * Pickup History List Component
 * Displays list of pickup history with pagination
 */
export const PickupHistoryList = ({
  data,
  loading,
  refreshing,
  loadingMore,
  onRefresh,
  onLoadMore,
  onItemPress,
  emptyMessage,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const renderItem = ({ item }) => (
    <PickupHistoryItem item={item} onPress={onItemPress} />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5
        name="history"
        size={48}
        color={theme.colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Pickup History</Text>
      <Text style={styles.emptySubtitle}>
        {emptyMessage || 'No pickup records found'}
      </Text>
    </View>
  );

  if (loading && (!data || data.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading pickup history...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.log_id.toString()}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.listContent,
        data?.length === 0 && styles.emptyListContent,
      ]}
    />
  );
};

/**
 * Pickup History Quick Actions Component
 * Quick action buttons for pickup history screen
 */
export const PickupHistoryActions = ({
  onFilterPress,
  onExportPress,
  onRefreshPress,
  loading,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        onPress={onFilterPress}
        disabled={loading}
      >
        <FontAwesome5 name="filter" size={16} color="#fff" />
        <Text style={styles.actionButtonText}>Filter</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
        onPress={onExportPress}
        disabled={loading}
      >
        <FontAwesome5 name="download" size={16} color="#fff" />
        <Text style={styles.actionButtonText}>Export</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.textSecondary }]}
        onPress={onRefreshPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <FontAwesome5 name="sync-alt" size={16} color="#fff" />
        )}
        <Text style={styles.actionButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Date Range Selector Component
 * Allows users to select date range for history
 */
export const DateRangeSelector = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClear,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.dateRangeContainer}>
      <Text style={styles.dateRangeTitle}>Select Date Range</Text>
      
      <View style={styles.dateInputsContainer}>
        <TouchableOpacity style={styles.dateInput}>
          <Text style={styles.dateInputLabel}>From</Text>
          <Text style={styles.dateInputValue}>
            {startDate || 'Select start date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateInput}>
          <Text style={styles.dateInputLabel}>To</Text>
          <Text style={styles.dateInputValue}>
            {endDate || 'Select end date'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateRangeActions}>
        <TouchableOpacity
          style={[styles.dateRangeButton, styles.clearButton]}
          onPress={onClear}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateRangeButton, styles.applyButton]}
          onPress={onApply}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    // History Item Styles
    historyItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...createMediumShadow(theme),
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    pickupDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    pickupTime: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    historyDetails: {
      gap: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailIcon: {
      marginRight: 8,
      width: 16,
    },
    detailText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    pickupTypeContainer: {
      marginTop: 8,
      alignItems: 'flex-start',
    },
    pickupTypeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    pickupTypeText: {
      fontSize: 12,
      fontWeight: '600',
    },

    // Summary Card Styles
    summaryCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      padding: 16,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.headerText,
      marginBottom: 12,
    },
    summaryStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.headerText,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.headerText,
      opacity: 0.8,
      marginTop: 4,
    },

    // List Styles
    listContent: {
      paddingBottom: 20,
    },
    emptyListContent: {
      flexGrow: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingFooter: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
    },
    loadingText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },

    // Actions Styles
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },

    // Date Range Styles
    dateRangeContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      ...createMediumShadow(theme),
    },
    dateRangeTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    dateInputsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    dateInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateInputLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    dateInputValue: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    dateRangeActions: {
      flexDirection: 'row',
      gap: 12,
    },
    dateRangeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    clearButton: {
      backgroundColor: theme.colors.textSecondary + '20',
      borderWidth: 1,
      borderColor: theme.colors.textSecondary,
    },
    clearButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    applyButton: {
      backgroundColor: theme.colors.primary,
    },
    applyButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default {
  PickupHistoryItem,
  PickupHistorySummary,
  PickupHistoryList,
  PickupHistoryActions,
  DateRangeSelector,
};
