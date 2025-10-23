import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronRight,
  faFileAlt,
  faComments,
  faCheckCircle,
  faScaleBalanced,
  faChartLine,
  faBell,
  faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * ActivityFeed Component
 * 
 * Displays recent activities and events
 * 
 * @param {Object} props
 * @param {Array} props.activities - Array of activity objects
 * @param {Function} props.onSeeAll - Callback for "See All" button
 * @param {Function} props.onActivityPress - Callback when activity is pressed
 */
export default function ActivityFeed({ activities = [], onSeeAll, onActivityPress }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'homework':
        return { icon: faFileAlt, color: '#FF9500' };
      case 'message':
        return { icon: faComments, color: '#007AFF' };
      case 'attendance':
        return { icon: faCheckCircle, color: '#34C759' };
      case 'bps':
        return { icon: faScaleBalanced, color: '#AF52DE' };
      case 'grade':
      case 'assessment':
        return { icon: faClipboardCheck, color: '#FF3B30' };
      case 'notification':
        return { icon: faBell, color: '#5856D6' };
      default:
        return { icon: faBell, color: theme.colors.textSecondary };
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return `${diffMins} ${diffMins > 1 ? t('minsAgo') : t('minAgo')}`;
    if (diffHours < 24) return `${diffHours} ${diffHours > 1 ? t('hoursAgo') : t('hourAgo')}`;
    if (diffDays < 7) return `${diffDays} ${diffDays > 1 ? t('daysAgo') : t('dayAgo')}`;
    return activityTime.toLocaleDateString();
  };

  const renderActivityItem = (activity, index) => {
    const { icon, color } = getActivityIcon(activity.type);

    return (
      <TouchableOpacity
        key={activity.id || index}
        style={[
          styles.activityItem,
          index === activities.length - 1 && styles.activityItemLast,
        ]}
        onPress={() => onActivityPress?.(activity)}
        activeOpacity={0.7}
      >
        <View style={[styles.activityIconContainer, { backgroundColor: `${color}15` }]}>
          <FontAwesomeIcon icon={icon} size={18} color={color} />
        </View>

        <View style={styles.activityContent}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {activity.title}
          </Text>
          <View style={styles.activityMeta}>
            <Text style={styles.activitySubtitle} numberOfLines={1}>
              {activity.subtitle}
            </Text>
            <Text style={styles.activitySeparator}>•</Text>
            <Text style={styles.activityTime}>{formatTimestamp(activity.timestamp)}</Text>
          </View>
        </View>

        <FontAwesomeIcon
          icon={faChevronRight}
          size={14}
          color={theme.colors.textSecondary}
          style={styles.chevron}
        />
      </TouchableOpacity>
    );
  };

  if (!activities || activities.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔔 {t('recentActivity')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('noRecentActivity')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 {t('recentActivity')}</Text>
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>{t('seeAll')}</Text>
          <FontAwesomeIcon icon={faChevronRight} size={12} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.activityList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {activities.slice(0, 4).map(renderActivityItem)}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginRight: 4,
    },
    activityList: {
      maxHeight: 280,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 12,
    },
    activityItemLast: {
      borderBottomWidth: 0,
    },
    activityIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activityContent: {
      flex: 1,
      gap: 4,
    },
    activityTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    activityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    activitySubtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      flex: 1,
    },
    activitySeparator: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    activityTime: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    chevron: {
      marginLeft: 8,
    },
    emptyContainer: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
  });

