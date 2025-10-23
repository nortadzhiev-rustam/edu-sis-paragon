import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');
const TILE_WIDTH = (screenWidth - 80) / 4; // 4 tiles per row with margins
const TILE_HEIGHT = 120;

/**
 * DraggableTile Component
 *
 * A tile that can be dragged and reordered when in edit mode
 */
export default function DraggableTile({
  action,
  index,
  isEditMode,
  onReorder,
  onPress,
  theme,
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const startIndex = useRef(index);

  // Callback to trigger reorder from worklet
  const triggerReorder = (fromIdx, toIdx) => {
    if (onReorder && fromIdx !== toIdx) {
      onReorder(fromIdx, toIdx);
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(isEditMode)
    .minDistance(0)
    .onStart(() => {
      'worklet';
      startX.current = translateX.value;
      startY.current = translateY.value;
      startIndex.current = index;
      isDragging.value = true;
      scale.value = withTiming(1.1, { duration: 150 });
      zIndex.value = 1000;
    })
    .onUpdate((event) => {
      'worklet';
      if (isDragging.value) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      'worklet';
      if (isDragging.value) {
        const fromIdx = startIndex.current;

        // Calculate new position
        const movedX = Math.round(translateX.value / TILE_WIDTH);
        const movedY = Math.round(translateY.value / TILE_HEIGHT);

        const tilesPerRow = 4;
        const currentRow = Math.floor(fromIdx / tilesPerRow);
        const currentCol = fromIdx % tilesPerRow;

        const newRow = Math.max(0, currentRow + movedY);
        const newCol = Math.max(
          0,
          Math.min(tilesPerRow - 1, currentCol + movedX)
        );
        const toIdx = newRow * tilesPerRow + newCol;

        isDragging.value = false;
        scale.value = withTiming(1, { duration: 150 });
        zIndex.value = 0;

        // Reset position
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });

        // Trigger reorder on JS thread using runOnJS
        if (toIdx !== fromIdx) {
          runOnJS(triggerReorder)(fromIdx, toIdx);
        }
      }
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart(() => {
      'worklet';
      if (isEditMode) {
        isDragging.value = true;
        scale.value = withTiming(1.1, { duration: 150 });
        zIndex.value = 1000;
      }
    });

  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
      opacity: isDragging.value ? withTiming(0.8) : withTiming(1),
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Pressable
          onPress={onPress}
          disabled={action.disabled || isEditMode}
          style={styles.pressable}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: action.disabled
                  ? '#B0B0B0'
                  : action.backgroundColor,
              },
            ]}
          >
            {isEditMode && (
              <View style={styles.dragHandle}>
                <FontAwesomeIcon
                  icon={faGripVertical}
                  size={16}
                  color='rgba(255, 255, 255, 0.7)'
                />
              </View>
            )}
            <FontAwesomeIcon
              icon={action.icon}
              size={32}
              color={action.iconColor || '#fff'}
            />
          </View>
          <Text
            style={[styles.label, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {action.title}
          </Text>
          {action.badge && (
            <View style={styles.badgeContainer}>{action.badge}</View>
          )}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '22%',
    minWidth: 80,
    marginBottom: 20,
  },
  pressable: {
    alignItems: 'center',
  },
  iconContainer: {
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
    position: 'relative',
  },
  dragHandle: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
    padding: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: 8,
  },
});
