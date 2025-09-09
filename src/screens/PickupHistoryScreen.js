/**
 * Pickup History Screen
 * Shows pickup history for both parents and guardians
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FontAwesome5 } from '@expo/vector-icons';

// Services
import {
  getParentPickupHistory,
  getGuardianPickupHistory,
} from '../services/pickupRequestService';

// Components
import { createMediumShadow } from '../utils/commonStyles';
import {
  PickupHistoryList,
  PickupHistorySummary,
  PickupHistoryActions,
} from '../components/PickupHistoryComponents';

const PickupHistoryScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Route params
  const { authCode, userType, children, selectedChildId } = route.params || {};

  // State
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: null,
    end_date: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const styles = createStyles(theme);

  // Initialize selected child
  useEffect(() => {
    if (selectedChildId && children) {
      const child = children.find((c) => c.id === selectedChildId);
      setSelectedChild(child);
    }
  }, [selectedChildId, children]);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadPickupHistory();
    }, [authCode, userType, selectedChild])
  );

  const loadPickupHistory = async (page = 1, append = false) => {
    if (!authCode) {
      Alert.alert(t('error'), 'Authentication required');
      navigation.goBack();
      return;
    }

    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const options = {
        page,
        limit: 20,
        ...dateRange,
        ...(selectedChild &&
          userType === 'parent' && { student_id: selectedChild.id }),
      };

      let response;
      if (userType === 'parent') {
        response = await getParentPickupHistory(authCode, options);
      } else if (userType === 'guardian') {
        response = await getGuardianPickupHistory(authCode, options);
      } else {
        throw new Error('Invalid user type');
      }

      if (response.success) {
        if (append && historyData) {
          // Append new data for pagination
          setHistoryData({
            ...response,
            pickup_history: [
              ...historyData.pickup_history,
              ...response.pickup_history,
            ],
          });
        } else {
          // Replace data for initial load or refresh
          setHistoryData(response);
        }
        setCurrentPage(page);
      } else {
        throw new Error(response.message || 'Failed to load pickup history');
      }
    } catch (error) {
      console.error('Error loading pickup history:', error);
      Alert.alert(t('error'), error.message || 'Failed to load pickup history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadPickupHistory(1, false);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (historyData?.pagination?.has_next_page && !loadingMore && !loading) {
      loadPickupHistory(currentPage + 1, true);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5
            name='arrow-left'
            size={18}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup History</Text>
      </View>

      {/* Summary Card */}
      <PickupHistorySummary
        summary={historyData?.summary}
        userType={userType}
      />
    </View>
  );

  if (loading && !historyData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading pickup history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {renderHeader()}

      <View style={styles.contentContainer}>
        <PickupHistoryList
          data={historyData?.pickup_history}
          loading={loading}
          refreshing={refreshing}
          loadingMore={loadingMore}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          onItemPress={(item) => console.log('Item pressed:', item)}
          emptyMessage={
            userType === 'parent'
              ? 'No pickup records found for your children'
              : 'No pickup records found for your account'
          }
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingBottom: 16,
      marginHorizontal: 16,
      borderRadius: 16,
      ...createMediumShadow(theme),
    },
    navigationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 8,
      marginBottom: 16,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.headerText,
    },
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
    contentContainer: {
      flex: 1,
      padding: 16,
    },
    listContent: {
      paddingBottom: 20,
    },
    scrollContent: {
      flexGrow: 1,
    },
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
  });

export default PickupHistoryScreen;
