import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions, Platform} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
} from 'react-native-reanimated';

const {width: screenWidth} = Dimensions.get('window');

/**
 * QuickStatsCard Component
 *
 * A colorful gradient card displaying a single statistic
 * with icon, number, and label.
 *
 * @param {Object} props
 * @param {Object} props.icon - FontAwesome icon
 * @param {string|number} props.value - The stat value
 * @param {string} props.label - The stat label
 * @param {Array} props.colors - Gradient colors [start, end]
 * @param {number} props.delay - Animation delay in ms
 */
export default function QuickStatsCard({
                                           icon,
                                           value,
                                           label,
                                           colors,
                                           delay = 0,
                                       }) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(
            delay,
            withSpring(1, {
                damping: 15,
                stiffness: 150,
            })
        );
        opacity.value = withDelay(delay, withSpring(1));
    }, [delay]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{scale: scale.value}],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <LinearGradient
                colors={colors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.gradient}
            >
                <View style={styles.topRow}>
                    <View style={styles.iconContainer}>
                        <FontAwesomeIcon
                            icon={icon}
                            size={18}
                            color='rgba(255, 255, 255, 0.9)'
                        />
                    </View>
                    <Text style={styles.label} numberOfLines={2}>
                        {label}
                    </Text>
                </View>
                <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                    {value}
                </Text>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        borderRadius: 16,
        padding: 6,
        minHeight: 130,
        justifyContent: 'flex-start',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        alignItems: 'center',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginRight: 20,
        marginLeft: 10,
        marginTop: 10,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 12,
        flex: 1,
        marginLeft: 4,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    value: {
        //make font dynamic based on screen width
        fontSize: Math.max(screenWidth * 0.08, 18),
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
        marginVertical: 10,
        marginRight: 15
    },
});
