import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronRight,
  faTimes,
  faGripVertical,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import DraggableTile from './DraggableTile';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * CompactQuickActions Component
 *
 * Displays 4 compact action tiles with a "See All" button
 * that opens a modal with all actions. Supports drag-and-drop reordering.
 *
 * @param {Object} props
 * @param {Array} props.actions - Array of action objects
 * @param {number} props.visibleCount - Number of actions to show (default: 4)
 * @param {string} props.userType - User type (teacher, student, parent) for separate storage
 */
export default function CompactQuickActions({
  actions = [],
  visibleCount = 4,
  userType = 'default',
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);
  const [showAllModal, setShowAllModal] = useState(false);
  const [orderedActions, setOrderedActions] = useState(actions);
  const [isEditMode, setIsEditMode] = useState(false);

  // Create a user-type-specific storage key to prevent mixing between different user types
  const STORAGE_KEY = `@quick_actions_order_${userType}`;

  console.log(`🔑 COMPACT QUICK ACTIONS: Using storage key: ${STORAGE_KEY} for userType: ${userType}`);

  // Animated values for draggable modal
  const translateY = useSharedValue(0);

  // Close modal function
  const closeModal = () => {
    setShowAllModal(false);
    setIsEditMode(false);
  };

  // Reset modal position when opened
  useEffect(() => {
    if (showAllModal) {
      translateY.value = 0;
    }
  }, [showAllModal]);

  // Pan gesture for dragging modal (Reanimated v3 API)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow dragging down
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      // If dragged down more than 100 px or velocity is high, close modal
      if (translateY.value > 100 || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
        // Use a timeout to close the modal after animation
        setTimeout(() => {
          closeModal();
        }, 200);
      } else {
        // Otherwise, spring back to the original position
        translateY.value = withSpring(0);
      }
    });

  // Animated style for modal content
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // Load saved order on mount
  useEffect(() => {
    loadSavedOrder();
  }, []);

  // Update ordered actions when actions prop changes
  useEffect(() => {
    if (actions.length > 0) {
      loadSavedOrder();
    }
  }, [actions]);

  const loadSavedOrder = async () => {
    try {
      console.log(`📂 COMPACT QUICK ACTIONS: Loading order from ${STORAGE_KEY}`);
      const savedOrder = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        console.log(`✅ COMPACT QUICK ACTIONS: Found saved order for ${userType}:`, orderIds);
        // Reorder actions based on saved order
        const reordered = orderIds
          .map((id) => actions.find((action) => action.id === id))
          .filter(Boolean); // Remove any null/undefined

        // Add any new actions that weren't in saved order
        const newActions = actions.filter(
          (action) => !orderIds.includes(action.id)
        );

        setOrderedActions([...reordered, ...newActions]);
      } else {
        console.log(`ℹ️ COMPACT QUICK ACTIONS: No saved order found for ${userType}, using default`);
        setOrderedActions(actions);
      }
    } catch (error) {
      console.error(`❌ COMPACT QUICK ACTIONS: Error loading saved order for ${userType}:`, error);
      setOrderedActions(actions);
    }
  };

  const saveOrder = async (newOrder) => {
    try {
      const orderIds = newOrder.map((action) => action.id);
      console.log(`💾 COMPACT QUICK ACTIONS: Saving order to ${STORAGE_KEY}:`, orderIds);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orderIds));
      console.log(`✅ COMPACT QUICK ACTIONS: Order saved successfully for ${userType}`);
    } catch (error) {
      console.error(`❌ COMPACT QUICK ACTIONS: Error saving order for ${userType}:`, error);
    }
  };

  const handleReorder = (fromIndex, toIndex) => {
    const newOrder = [...orderedActions];
    // Swap items instead of moving them
    const temp = newOrder[fromIndex];
    newOrder[fromIndex] = newOrder[toIndex];
    newOrder[toIndex] = temp;
    setOrderedActions(newOrder);
    saveOrder(newOrder);
  };

  const visibleActions = orderedActions.slice(0, visibleCount);
  const hiddenCount = Math.max(0, orderedActions.length - visibleCount);

  const renderCompactTile = (action, isModal = false) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.compactTile, isModal && styles.modalTile]}
      onPress={() => {
        setShowAllModal(false);
        action.onPress?.();
      }}
      disabled={action.disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.compactIconContainer,
          {
            backgroundColor: action.disabled
              ? '#B0B0B0'
              : action.backgroundColor,
          },
        ]}
      >
        <FontAwesomeIcon
          icon={action.icon}
          size={isModal ? 32 : 30}
          color={action.iconColor || '#fff'}
        />
      </View>
      <Text style={styles.compactLabel} numberOfLines={2}>
        {action.title}
      </Text>
      {action.badge && (
        <View style={styles.badgeContainer}>{action.badge}</View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>⚡ {t('quickActions')}</Text>
          {hiddenCount > 0 && (
            <TouchableOpacity
              onPress={() => setShowAllModal(true)}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>{t('seeAll')} ({actions.length})</Text>
              <FontAwesomeIcon
                icon={faChevronRight}
                size={12}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tilesGrid}>
          {visibleActions.map((action) => renderCompactTile(action, false))}
        </View>
      </View>

      {/* All Actions Modal */}
      <Modal
        visible={showAllModal}
        animationType='slide'
        transparent={true}
        onRequestClose={() => {
          setShowAllModal(false);
          setIsEditMode(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.modalContent, animatedStyle]}>
              {/* Drag Handle */}
              <View style={styles.dragHandle}>
                <View style={styles.dragHandleLine} />
              </View>

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('allQuickActions')}</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={() => setIsEditMode(!isEditMode)}
                  style={[
                    styles.editButton,
                    isEditMode && styles.editButtonActive,
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faGripVertical}
                    size={18}
                    color={isEditMode ? '#fff' : theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.editButtonText,
                      isEditMode && styles.editButtonTextActive,
                    ]}
                  >
                    {isEditMode ? t('done') : t('edit')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowAllModal(false);
                    setIsEditMode(false);
                  }}
                  style={styles.closeButton}
                >
                  <FontAwesomeIcon
                    icon={faTimes}
                    size={24}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {isEditMode && (
              <View style={styles.editModeHint}>
                <FontAwesomeIcon
                  icon={faGripVertical}
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.editModeHintText}>
                  {t('longPressDragReorder')}
                </Text>
              </View>
            )}

            <GestureHandlerRootView style={{ flex: 1 }}>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!isEditMode}
              >
                <View style={styles.modalGrid}>
                  {orderedActions.map((action, index) => (
                    <DraggableTile
                      key={action.id}
                      action={action}
                      index={index}
                      isEditMode={isEditMode}
                      onReorder={handleReorder}
                      onPress={() => {
                        if (!isEditMode) {
                          setShowAllModal(false);
                          action.onPress?.();
                        }
                      }}
                      theme={theme}
                    />
                  ))}
                </View>
              </ScrollView>
            </GestureHandlerRootView>
            </Animated.View>
          </GestureDetector>
        </View>
      </Modal>
    </>
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
    tilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    compactTile: {
      width: '22%',
      minWidth: 75,
      alignItems: 'center',
      marginBottom: 8,
    },
    modalTile: {
      width: '22%',
      minWidth: 80,
      marginBottom: 20,
    },
    compactIconContainer: {
      width: 70,
      height: 70,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    compactLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 13,
    },
    badgeContainer: {
      position: 'absolute',
      top: -4,
      right: 8,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'transparent', // No backdrop
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      height: '60%',
      paddingTop: 8,
    },
    dragHandle: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingBottom: 12,
    },
    dragHandleLine: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.textSecondary,
      borderRadius: 2,
      opacity: 0.3,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    editButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    editButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    editButtonTextActive: {
      color: '#fff',
    },
    editModeHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.colors.card,
      marginHorizontal: 20,
      marginTop: 12,
      borderRadius: 8,
    },
    editModeHintText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalScroll: {
      flex: 1,
    },
    modalScrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    modalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
        gap: 10,
    },
  });
