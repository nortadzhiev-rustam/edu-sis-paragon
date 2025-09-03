/**
 * Guardian Management Screen
 * Allows parents to view and manage guardians for their children
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { EmptyState } from '../components';
import { GuardianCard } from '../components/guardian';
import guardianService from '../services/guardianService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const GuardianManagementScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authCode, setAuthCode] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  const styles = createStyles(theme);

  // Get auth code and children data
  useEffect(() => {
    const getAuthData = async () => {
      try {
        // First try to get from route params (passed from ParentScreen)
        const routeAuthCode = route.params?.authCode;
        const routeChildren = route.params?.children;

        if (routeAuthCode) {
          console.log(
            '📱 GUARDIAN MANAGEMENT: Using auth code from route params'
          );
          setAuthCode(routeAuthCode);
        } else {
          // Fallback to AsyncStorage
          const storedAuthCode = await AsyncStorage.getItem('authCode');
          if (storedAuthCode) {
            console.log(
              '📱 GUARDIAN MANAGEMENT: Using auth code from AsyncStorage'
            );
            setAuthCode(storedAuthCode);
          }
        }

        if (routeChildren && routeChildren.length > 0) {
          console.log(
            '📱 GUARDIAN MANAGEMENT: Using children from route params:',
            routeChildren.length
          );
          setChildren(routeChildren);

          // Set default selected child if passed from route params
          if (route.params?.selectedChildId) {
            const child = routeChildren.find(
              (c) => c.id === route.params.selectedChildId
            );
            setSelectedChild(child);
          } else if (routeChildren.length > 0) {
            setSelectedChild(routeChildren[0]);
          }
        } else {
          // Fallback to AsyncStorage
          const storedChildren = await AsyncStorage.getItem('children');
          if (storedChildren) {
            console.log(
              '📱 GUARDIAN MANAGEMENT: Using children from AsyncStorage'
            );
            const parsedChildren = JSON.parse(storedChildren);
            setChildren(parsedChildren);

            if (parsedChildren.length > 0) {
              setSelectedChild(parsedChildren[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error getting auth data:', error);
      }
    };

    getAuthData();
  }, [route.params]);

  // Fetch guardians when screen focuses
  useFocusEffect(
    useCallback(() => {
      console.log('📱 GUARDIAN MANAGEMENT: useFocusEffect triggered', {
        authCode: !!authCode,
        selectedChild: selectedChild?.name,
      });
      if (authCode) {
        fetchGuardians();
      } else {
        console.log(
          '📱 GUARDIAN MANAGEMENT: No authCode available, stopping loading'
        );
        setLoading(false);
      }
    }, [authCode, selectedChild])
  );

  const fetchGuardians = async () => {
    if (!authCode) {
      console.log(
        '📱 GUARDIAN MANAGEMENT: fetchGuardians called but no authCode'
      );
      setLoading(false);
      return;
    }

    try {
      console.log('📱 GUARDIAN MANAGEMENT: Starting to fetch guardians', {
        authCode: authCode.substring(0, 10) + '...',
        studentId: selectedChild?.id,
      });
      setLoading(true);
      const studentId = selectedChild?.id || null;
      const response = await guardianService.listGuardians(authCode, studentId);

      console.log(
        '📱 GUARDIAN MANAGEMENT: Guardian service response:',
        response
      );

      if (response.success) {
        console.log(
          '📱 GUARDIAN MANAGEMENT: Successfully loaded guardians:',
          response.guardians?.length || 0
        );
        setGuardians(response.guardians || []);
      } else {
        console.error(
          '📱 GUARDIAN MANAGEMENT: Failed to load guardians:',
          response.message
        );
        Alert.alert(t('error'), response.message || t('failedToLoadGuardians'));
      }
    } catch (error) {
      console.error('📱 GUARDIAN MANAGEMENT: Error fetching guardians:', error);
      Alert.alert(t('error'), t('failedToLoadGuardians'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGuardians();
    setRefreshing(false);
  };

  const handleGuardianPress = (guardian) => {
    navigation.navigate('GuardianDetail', {
      guardian,
      authCode,
      onGuardianUpdated: fetchGuardians,
    });
  };

  const handleRotateQR = async (pickupCardId) => {
    try {
      const response = await guardianService.rotateQrToken(
        authCode,
        pickupCardId
      );

      if (response.success) {
        Alert.alert(t('success'), t('qrTokenRotated'));
        await fetchGuardians(); // Refresh the list
      } else {
        Alert.alert(t('error'), response.message || t('failedToRotateToken'));
      }
    } catch (error) {
      console.error('Error rotating QR token:', error);
      Alert.alert(t('error'), t('failedToRotateToken'));
    }
  };

  const handleAddGuardian = () => {
    navigation.navigate('AddGuardian', {
      children,
      selectedChildId: selectedChild?.id,
      authCode,
      onGuardianAdded: fetchGuardians,
    });
  };

  const handleChildSelection = () => {
    if (children.length <= 1) return;

    const childOptions = children.map((child) => ({
      text: child.name,
      onPress: () => setSelectedChild(child),
    }));

    childOptions.push({
      text: t('allChildren'),
      onPress: () => setSelectedChild(null),
    });

    childOptions.push({
      text: t('cancel'),
      style: 'cancel',
    });

    Alert.alert(
      t('selectChild'),
      t('selectChildToViewGuardians'),
      childOptions
    );
  };

  const getGuardianStats = () => {
    const activeGuardians = guardians.filter((g) => g.status === 1);
    const totalLimit = selectedChild ? 5 : children.length * 5;

    return {
      active: activeGuardians.length,
      total: guardians.length,
      limit: totalLimit,
      remaining: Math.max(0, totalLimit - activeGuardians.length),
    };
  };

  const renderGuardianItem = ({ item }) => (
    <GuardianCard
      guardian={item}
      onPress={handleGuardianPress}
      onRotateQR={handleRotateQR}
      showActions={true}
    />
  );

  const renderHeader = () => {
    const stats = getGuardianStats();

    return (
      <View style={styles.headerContainer}>
        {/* Child Selector */}
        {children.length > 1 && (
          <TouchableOpacity
            style={styles.childSelector}
            onPress={handleChildSelection}
          >
            <Text style={styles.childSelectorLabel}>
              {t('viewingGuardiansFor')}:
            </Text>
            <Text style={styles.childSelectorValue}>
              {selectedChild ? selectedChild.name : t('allChildren')}
            </Text>
            <Text style={styles.childSelectorArrow}>▼</Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>{t('activeGuardians')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('totalGuardians')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.remaining}</Text>
            <Text style={styles.statLabel}>{t('remainingSlots')}</Text>
          </View>
        </View>

        {/* Add Guardian Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddGuardian}>
          <Text style={styles.addButtonText}>+ {t('addGuardian')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      title={t('noGuardians')}
      message={t('noGuardiansMessage')}
      actionText={t('addFirstGuardian')}
      onAction={handleAddGuardian}
    />
  );

  if (loading && guardians.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Compact Header */}
        <View style={styles.compactHeaderContainer}>
          <View style={styles.navigationHeader}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <FontAwesomeIcon
                  icon={faArrowLeft}
                  size={18}
                  color={theme.colors.headerText}
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('guardianManagement')}</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.primary} />
          <Text style={styles.loadingText}>{t('loadingGuardians')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        <View style={styles.navigationHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('guardianManagement')}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={guardians}
        renderItem={renderGuardianItem}
        keyExtractor={(item) => item.pickup_card_id.toString()}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Compact Header Styles
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      overflow: 'hidden',
      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      color: theme.colors.headerText,
      fontSize: 18,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    headerContainer: {
      marginBottom: 20,
    },
    childSelector: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    childSelectorLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginRight: 8,
    },
    childSelectorValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    childSelectorArrow: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
    },
    addButtonText: {
      color: theme.colors.headerText,
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default GuardianManagementScreen;
