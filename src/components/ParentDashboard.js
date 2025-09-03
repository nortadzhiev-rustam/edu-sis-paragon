/**
 * Parent Dashboard Component
 * Main dashboard for parents to access their children's academic data
 * Uses the Parent Proxy Access System
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import parent service
import {
  getParentChildren,
  getChildComprehensiveData,
  saveChildrenData,
  getChildrenData,
  formatChildForDisplay,
} from '../services/parentService';

// Import theme
import { useTheme } from '../context/ThemeContext';

const ParentDashboard = ({ navigation, parentAuthCode }) => {
  const { theme, fontSizes } = useTheme();
  const styles = createStyles(theme, fontSizes);

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childData, setChildData] = useState(null);
  const [loadingChildData, setLoadingChildData] = useState(false);

  // Load parent's children on component mount
  useEffect(() => {
    loadChildren();
  }, []);

  /**
   * Load parent's children from API
   */
  const loadChildren = async () => {
    try {
      setLoading(true);
      console.log('👨‍👩‍👧‍👦 PARENT DASHBOARD: Loading children...');

      const authCode =
        parentAuthCode || (await AsyncStorage.getItem('authCode'));
      if (!authCode) {
        Alert.alert('Error', 'No authentication found. Please login again.');
        return;
      }

      const response = await getParentChildren(authCode);

      if (response.success && response.children) {
        const formattedChildren = response.children.map(formatChildForDisplay);
        setChildren(formattedChildren);

        // Save children data locally
        await saveChildrenData(formattedChildren);

        // Auto-select first child if available
        if (formattedChildren.length > 0) {
          setSelectedChild(formattedChildren[0]);
        }

        console.log('✅ PARENT DASHBOARD: Children loaded successfully');
      } else {
        console.warn('⚠️ PARENT DASHBOARD: No children found');
        Alert.alert('Info', 'No children found for this parent account.');
      }
    } catch (error) {
      console.error('❌ PARENT DASHBOARD: Error loading children:', error);

      // Try to load cached children data
      const cachedChildren = await getChildrenData();
      if (cachedChildren.length > 0) {
        setChildren(cachedChildren);
        setSelectedChild(cachedChildren[0]);
        console.log('📦 PARENT DASHBOARD: Using cached children data');
      } else {
        Alert.alert('Error', 'Failed to load children data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load comprehensive data for selected child
   */
  const loadChildData = async (child) => {
    try {
      setLoadingChildData(true);
      console.log(
        '📊 PARENT DASHBOARD: Loading child data for:',
        child.displayName
      );

      const authCode =
        parentAuthCode || (await AsyncStorage.getItem('authCode'));
      if (!authCode) {
        Alert.alert('Error', 'No authentication found. Please login again.');
        return;
      }

      const response = await getChildComprehensiveData(
        authCode,
        child.student_id
      );

      if (response.success) {
        setChildData(response.data);
        console.log('✅ PARENT DASHBOARD: Child data loaded successfully');
      } else {
        console.warn('⚠️ PARENT DASHBOARD: Failed to load child data');
        Alert.alert(
          'Warning',
          'Some data could not be loaded. Please try again.'
        );
      }
    } catch (error) {
      console.error('❌ PARENT DASHBOARD: Error loading child data:', error);
      Alert.alert('Error', 'Failed to load child data. Please try again.');
    } finally {
      setLoadingChildData(false);
    }
  };

  /**
   * Handle child selection
   */
  const handleChildSelection = (child) => {
    setSelectedChild(child);
    setChildData(null); // Clear previous data
    loadChildData(child);
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    if (selectedChild) {
      await loadChildData(selectedChild);
    }
    setRefreshing(false);
  };

  /**
   * Navigate to specific child data screen
   */
  const navigateToChildScreen = (screenName, data) => {
    navigation.navigate(screenName, {
      childData: selectedChild,
      parentAuthCode: parentAuthCode,
      specificData: data,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading children...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Parent Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {children.length} {children.length === 1 ? 'child' : 'children'}
          </Text>
        </View>

        {/* Children Selection */}
        {children.length > 0 && (
          <View style={styles.childrenSection}>
            <Text style={styles.sectionTitle}>Select Child</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.student_id}
                  style={[
                    styles.childCard,
                    selectedChild?.student_id === child.student_id &&
                      styles.selectedChildCard,
                  ]}
                  onPress={() => handleChildSelection(child)}
                >
                  <Text
                    style={[
                      styles.childName,
                      selectedChild?.student_id === child.student_id &&
                        styles.selectedChildName,
                    ]}
                  >
                    {child.displayName}
                  </Text>
                  <Text
                    style={[
                      styles.childClass,
                      selectedChild?.student_id === child.student_id &&
                        styles.selectedChildClass,
                    ]}
                  >
                    {child.displayClass}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Selected Child Data */}
        {selectedChild && (
          <View style={styles.childDataSection}>
            <Text style={styles.sectionTitle}>
              {selectedChild.displayName}'s Academic Data
            </Text>

            {loadingChildData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading academic data...</Text>
              </View>
            ) : (
              <View style={styles.dataGrid}>
                {/* Timetable Card */}
                <TouchableOpacity
                  style={styles.dataCard}
                  onPress={() =>
                    navigateToChildScreen(
                      'ChildTimetable',
                      childData?.timetable
                    )
                  }
                >
                  <Text style={styles.dataCardTitle}>📅 Timetable</Text>
                  <Text style={styles.dataCardSubtitle}>
                    {childData?.timetable ? 'View schedule' : 'Loading...'}
                  </Text>
                </TouchableOpacity>

                {/* Homework Card */}
                <TouchableOpacity
                  style={styles.dataCard}
                  onPress={() =>
                    navigateToChildScreen('ChildHomework', childData?.homework)
                  }
                >
                  <Text style={styles.dataCardTitle}>📚 Homework</Text>
                  <Text style={styles.dataCardSubtitle}>
                    {childData?.homework ? 'View assignments' : 'Loading...'}
                  </Text>
                </TouchableOpacity>

                {/* Attendance Card */}
                <TouchableOpacity
                  style={styles.dataCard}
                  onPress={() =>
                    navigateToChildScreen(
                      'ChildAttendance',
                      childData?.attendance
                    )
                  }
                >
                  <Text style={styles.dataCardTitle}>📊 Attendance</Text>
                  <Text style={styles.dataCardSubtitle}>
                    {childData?.attendance ? 'View records' : 'Loading...'}
                  </Text>
                </TouchableOpacity>

                {/* Grades Card */}
                <TouchableOpacity
                  style={styles.dataCard}
                  onPress={() =>
                    navigateToChildScreen('ChildGrades', childData?.grades)
                  }
                >
                  <Text style={styles.dataCardTitle}>📈 Grades</Text>
                  <Text style={styles.dataCardSubtitle}>
                    {childData?.grades ? 'View performance' : 'Loading...'}
                  </Text>
                </TouchableOpacity>

                {/* Assessment Card */}
                <TouchableOpacity
                  style={styles.dataCard}
                  onPress={() =>
                    navigateToChildScreen(
                      'ChildAssessment',
                      childData?.assessment
                    )
                  }
                >
                  <Text style={styles.dataCardTitle}>📝 Assessment</Text>
                  <Text style={styles.dataCardSubtitle}>
                    {childData?.assessment ? 'View tests' : 'Loading...'}
                  </Text>
                </TouchableOpacity>

                {/* BPS Profile Card */}
                <TouchableOpacity
                  style={styles.dataCard}
                  onPress={() =>
                    navigateToChildScreen('ChildBPS', childData?.bps_profile)
                  }
                >
                  <Text style={styles.dataCardTitle}>🎯 Behavior</Text>
                  <Text style={styles.dataCardSubtitle}>
                    {childData?.bps_profile ? 'View BPS profile' : 'Loading...'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* No Children Message */}
        {children.length === 0 && (
          <View style={styles.noChildrenContainer}>
            <Text style={styles.noChildrenText}>No children found</Text>
            <Text style={styles.noChildrenSubtext}>
              Please contact the school if this is incorrect.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Styles
 */
const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 10,
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
    },
    header: {
      padding: 20,
      backgroundColor: theme.colors.primary,
    },
    headerTitle: {
      fontSize: fontSizes.title,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: fontSizes.body,
      color: '#fff',
      opacity: 0.9,
    },
    childrenSection: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    childCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 15,
      marginRight: 15,
      minWidth: 120,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedChildCard: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    childName: {
      fontSize: fontSizes.body,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 5,
    },
    selectedChildName: {
      color: '#fff',
    },
    childClass: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    selectedChildClass: {
      color: '#fff',
      opacity: 0.9,
    },
    childDataSection: {
      padding: 20,
    },
    dataGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    dataCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      width: '48%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    dataCardTitle: {
      fontSize: fontSizes.body,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    dataCardSubtitle: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    noChildrenContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    noChildrenText: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    noChildrenSubtext: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

export default ParentDashboard;
