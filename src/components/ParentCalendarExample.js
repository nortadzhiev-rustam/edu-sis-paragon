/**
 * Parent Calendar Example Component
 * Demonstrates how to use the new parent calendar endpoints
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import parent calendar services
import {
  getParentCalendarData,
  getParentCalendarUpcoming,
  getParentCalendarPersonal,
} from '../services/parentService';

const ParentCalendarExample = ({ parentAuthCode }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'personal'
  
  // Calendar data state
  const [calendarData, setCalendarData] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);

  useEffect(() => {
    loadCalendarData();
  }, []);

  /**
   * Load all calendar data
   */
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      if (!parentAuthCode) {
        Alert.alert('Error', 'No parent authentication found');
        return;
      }

      console.log('📅 Loading parent calendar data...');

      // Load all calendar data in parallel
      const [calendarResponse, upcomingResponse, personalResponse] = await Promise.allSettled([
        getParentCalendarData(parentAuthCode),
        getParentCalendarUpcoming(parentAuthCode),
        getParentCalendarPersonal(parentAuthCode),
      ]);

      // Handle calendar data response
      if (calendarResponse.status === 'fulfilled' && calendarResponse.value.success) {
        setCalendarData(calendarResponse.value.calendar);
        console.log('✅ Calendar data loaded:', calendarResponse.value.calendar?.total_events || 0, 'events');
      } else {
        console.warn('⚠️ Failed to load calendar data:', calendarResponse.reason);
      }

      // Handle upcoming events response
      if (upcomingResponse.status === 'fulfilled' && upcomingResponse.value.success) {
        setUpcomingEvents(upcomingResponse.value.upcoming_events || []);
        console.log('✅ Upcoming events loaded:', upcomingResponse.value.upcoming_events?.length || 0, 'events');
      } else {
        console.warn('⚠️ Failed to load upcoming events:', upcomingResponse.reason);
      }

      // Handle personal events response
      if (personalResponse.status === 'fulfilled' && personalResponse.value.success) {
        setPersonalEvents(personalResponse.value.personal_events || []);
        console.log('✅ Personal events loaded:', personalResponse.value.personal_events?.length || 0, 'events');
      } else {
        console.warn('⚠️ Failed to load personal events:', personalResponse.reason);
      }

    } catch (error) {
      console.error('❌ Error loading calendar data:', error);
      Alert.alert('Error', 'Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCalendarData();
    setRefreshing(false);
  };

  /**
   * Render event item
   */
  const renderEventItem = (event, index) => (
    <View key={event.id || index} style={styles.eventItem}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDate}>{event.date}</Text>
      </View>
      
      {event.time && (
        <Text style={styles.eventTime}>⏰ {event.time}</Text>
      )}
      
      {event.description && (
        <Text style={styles.eventDescription}>{event.description}</Text>
      )}
      
      {event.location && (
        <Text style={styles.eventLocation}>📍 {event.location}</Text>
      )}
      
      {event.student_name && (
        <Text style={styles.eventStudent}>👤 {event.student_name}</Text>
      )}
      
      {event.teacher_name && (
        <Text style={styles.eventTeacher}>👨‍🏫 {event.teacher_name}</Text>
      )}
      
      <View style={styles.eventFooter}>
        <Text style={[styles.eventType, { backgroundColor: getEventTypeColor(event.type) }]}>
          {event.type || 'event'}
        </Text>
        {event.priority && (
          <Text style={[styles.eventPriority, { color: getPriorityColor(event.priority) }]}>
            {event.priority}
          </Text>
        )}
      </View>
    </View>
  );

  /**
   * Get event type color
   */
  const getEventTypeColor = (type) => {
    switch (type) {
      case 'meeting': return '#007AFF';
      case 'holiday': return '#34C759';
      case 'event': return '#FF9500';
      case 'appointment': return '#AF52DE';
      case 'reminder': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  /**
   * Render tab content
   */
  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading calendar data...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'all':
        const allEvents = calendarData?.events || [];
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>All Calendar Events ({allEvents.length})</Text>
            {allEvents.length > 0 ? (
              allEvents.map(renderEventItem)
            ) : (
              <Text style={styles.emptyText}>No calendar events found</Text>
            )}
          </View>
        );

      case 'upcoming':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Upcoming Events ({upcomingEvents.length})</Text>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(renderEventItem)
            ) : (
              <Text style={styles.emptyText}>No upcoming events</Text>
            )}
          </View>
        );

      case 'personal':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Personal Events ({personalEvents.length})</Text>
            {personalEvents.length > 0 ? (
              personalEvents.map(renderEventItem)
            ) : (
              <Text style={styles.emptyText}>No personal events</Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parent Calendar</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Events
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            Personal
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  eventItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  eventTime: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#3A3A3C',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#34C759',
    marginBottom: 4,
  },
  eventStudent: {
    fontSize: 14,
    color: '#AF52DE',
    marginBottom: 4,
  },
  eventTeacher: {
    fontSize: 14,
    color: '#FF9500',
    marginBottom: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  eventType: {
    fontSize: 12,
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  eventPriority: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ParentCalendarExample;
