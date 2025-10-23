import React, {useRef, useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList, Animated} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faClock, faChevronRight, faMapMarkerAlt} from '@fortawesome/free-solid-svg-icons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';

/**
 * Animated Pagination Dot Component
 */
const AnimatedPaginationDot = ({isActive, theme, onPress, styles}) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animValue, {
            toValue: isActive ? 1 : 0,
            damping: 15,
            stiffness: 150,
            useNativeDriver: false,
        }).start();
    }, [isActive, animValue]);

    const width = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 24],
    });

    const opacity = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1],
    });

    return (
        <TouchableOpacity onPress={onPress} style={styles.paginationDotTouchable}>
            <Animated.View
                style={[
                    styles.paginationDot,
                    {
                        width,
                        opacity,
                        backgroundColor: isActive ? theme.colors.primary : theme.colors.border,
                    },
                ]}
            />
        </TouchableOpacity>
    );
};

/**
 * TodayScheduleCard Component
 *
 * Displays today's upcoming classes with current/next indicators
 *
 * @param {Object} props
 * @param {Array} props.classes - Array of class objects
 * @param {Function} props.onSeeAll - Callback for "See All" button
 * @param {Function} props.onClassPress - Callback when class is pressed
 */
export default function TodayScheduleCard({classes = [], onSeeAll, onClassPress}) {
    const {theme} = useTheme();
    const {t} = useLanguage();
    const styles = createStyles(theme);
    const flatListRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const [currentIndex, setCurrentIndex] = useState(0);

    // Get current time to determine current/next class
    const getCurrentTime = () => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
    };

    const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Calculate end time based on 40-minute duration
    const calculateEndTime = (startTimeStr) => {
        if (!startTimeStr) return '';
        const startMinutes = parseTime(startTimeStr);
        const endMinutes = startMinutes + 40;
        const hours = Math.floor(endMinutes / 60);
        const minutes = endMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const currentTime = getCurrentTime();

    // Determine class status
    const getClassStatus = (classItem, index) => {
        const startTime = parseTime(classItem.start_time);
        const endTime = parseTime(classItem.end_time);

        // Check if currently in class (40 minutes duration)
        if (currentTime >= startTime && currentTime < startTime + 40) {
            return 'current';
        }

        // Find if there's a current class
        const hasCurrentClass = classes.some((cls, idx) => {
            const clsStartTime = parseTime(cls.start_time);
            return currentTime >= clsStartTime && currentTime < clsStartTime + 40;
        });

        // If no current class, mark the next upcoming class as 'next'
        if (!hasCurrentClass) {
            // Find the first class that hasn't started yet
            const nextClassIndex = classes.findIndex((cls) => {
                const clsStartTime = parseTime(cls.start_time);
                return currentTime < clsStartTime;
            });

            if (nextClassIndex === index) {
                return 'next';
            }
        }

        return 'upcoming';
    };

    // Find the index of current or next class
    const findFocusedClassIndex = () => {
        for (let i = 0; i < classes.length; i++) {
            const status = getClassStatus(classes[i], i);
            if (status === 'current' || status === 'next') {
                return i;
            }
        }
        return 0;
    };

    // Pulse animation for current class
    useEffect(() => {
        const hasCurrent = classes.some((classItem, index) => getClassStatus(classItem, index) === 'current');

        if (hasCurrent) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }

        return () => {
            pulseAnim.setValue(1);
        };
    }, [classes, currentTime]);

    // Auto-scroll to current/next class
    useEffect(() => {
        if (classes.length > 0 && flatListRef.current) {
            const focusedIndex = findFocusedClassIndex();
            setCurrentIndex(focusedIndex);

            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: focusedIndex,
                    animated: true,
                });
            }, 300);
        }
    }, [classes]);

    // Handle scroll events to update pagination
    const onViewableItemsChanged = useRef(({viewableItems}) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index;
            if (index !== null && index !== undefined) {
                setCurrentIndex(index);
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const renderClassItem = (classItem, index) => {
        const status = getClassStatus(classItem, index);
        const isFocused = status === 'current' || status === 'next';

        const CardWrapper = status === 'current' ? Animated.View : View;
        const cardWrapperProps = status === 'current'
            ? {style: {transform: [{scale: pulseAnim}]}}
            : {};

        return (
            <CardWrapper key={index} {...cardWrapperProps}>
                <TouchableOpacity
                    style={[
                        styles.classCard,
                        status === 'current' && styles.classCardCurrent,
                        status === 'next' && styles.classCardNext,
                    ]}
                    onPress={() => onClassPress?.(classItem)}
                    activeOpacity={0.7}
                >
                    {/* Visual Indicator Line - Similar to parent screen selection */}
                    {isFocused && (
                        <View style={[
                            styles.focusIndicator,
                            status === 'current' && styles.focusIndicatorCurrent,
                            status === 'next' && styles.focusIndicatorNext,
                        ]}/>
                    )}

                    {/* Status Badge */}
                    {status === 'current' && (
                        <View style={styles.nowBadge}>
                            <Text style={styles.nowBadgeText}>{t('now')}</Text>
                        </View>
                    )}
                    {status === 'next' && (
                        <View style={styles.nextBadge}>
                            <Text style={styles.nextBadgeText}>{t('next')}</Text>
                        </View>
                    )}

                    {/* Time */}
                    <View style={styles.timeContainer}>
                        <FontAwesomeIcon
                            icon={faClock}
                            size={14}
                            color={status === 'current' ? theme.colors.primary : theme.colors.textSecondary}
                        />
                        <Text style={[styles.timeText, status === 'current' && styles.timeTextCurrent]}>
                            {classItem.start_time} - {calculateEndTime(classItem.start_time)}
                        </Text>
                    </View>

                    {/* Subject Name */}
                    <Text
                        style={[styles.subjectName, status === 'current' && styles.subjectNameCurrent]}
                        numberOfLines={2}
                    >
                        {classItem.subject_name || classItem.class_name}
                    </Text>

                    {/* Grade/Class Code */}
                    <Text style={styles.gradeText} numberOfLines={1}>
                        {classItem.grade_name || classItem.class_code}
                    </Text>

                    {/* Room */}
                    {classItem.room && (
                        <View style={styles.roomContainer}>
                            <FontAwesomeIcon
                                icon={faMapMarkerAlt}
                                size={10}
                                color={theme.colors.textSecondary}
                            />
                            <Text style={styles.roomText} numberOfLines={1}>
                                {classItem.room}
                            </Text>
                        </View>
                    )}

                    {/* Duration Info */}
                    <Text style={styles.durationText}>
                        40 {t('minutes')}
                    </Text>
                </TouchableOpacity>
            </CardWrapper>
        );
    };

    if (!classes || classes.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>📅 {t('todaysSchedule')}</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t('noClassesToday')}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>📅 {t('todaysSchedule')}</Text>
                <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
                    <Text style={styles.seeAllText}>{t('seeAll')}</Text>
                    <FontAwesomeIcon icon={faChevronRight} size={12} color={theme.colors.primary}/>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={classes}
                renderItem={({item, index}) => renderClassItem(item, index)}
                keyExtractor={(item, index) => `class-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
                snapToInterval={172} // Card width (160) + gap (12)
                snapToAlignment="start"
                decelerationRate="fast"
                getItemLayout={(data, index) => ({
                    length: 172,
                    offset: 172 * index,
                    index,
                })}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        if (flatListRef.current && classes.length > 0) {
                            flatListRef.current.scrollToIndex({
                                index: Math.min(info.highestMeasuredFrameIndex, classes.length - 1),
                                animated: true,
                            });
                        }
                    }, 100);
                }}
            />

            {/* Pagination Dots */}
            {classes.length > 1 && (
                <View style={styles.paginationContainer}>
                    {classes.map((_, index) => (
                        <AnimatedPaginationDot
                            key={index}
                            isActive={index === currentIndex}
                            theme={theme}
                            styles={styles}
                            onPress={() => {
                                setCurrentIndex(index);
                                flatListRef.current?.scrollToIndex({
                                    index,
                                    animated: true,
                                });
                            }}
                        />
                    ))}
                </View>
            )}
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
            shadowOffset: {width: 0, height: 2},
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
        scrollView: {
            marginHorizontal: -8,
        },
        scrollContent: {
            paddingHorizontal: 8,
            paddingVertical: 8,
            gap: 12,
        },
        classCard: {
            width: 160,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.05,
            shadowRadius: 4,
            // elevation: 2,
            overflow: 'visible',
            position: 'relative',
            zIndex: 1,
        },
        classCardCurrent: {
            backgroundColor: `${theme.colors.primary}15`,
            borderColor: theme.colors.primary,
            borderWidth: 3,
            // shadowColor: theme.colors.primary,
            // shadowOffset: {width: 0, height: 4},
            // shadowOpacity: 0.3,
            // shadowRadius: 8,
            // elevation: 8,
            zIndex: 1,
        },
        classCardNext: {
            backgroundColor: `${theme.colors.success}10`,
            borderColor: theme.colors.success,
            borderWidth: 2,
            shadowColor: theme.colors.success,
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
        },
        focusIndicator: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            zIndex: 10,
        },
        focusIndicatorCurrent: {
            backgroundColor: theme.colors.primary,
        },
        focusIndicatorNext: {
            backgroundColor: theme.colors.success,
        },
        nowBadge: {
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            zIndex: 1,
        },
        nowBadgeText: {
            fontSize: 9,
            fontWeight: '800',
            color: '#fff',
            letterSpacing: 0.5,
        },
        nextBadge: {
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: theme.colors.success,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            zIndex: 1,
        },
        nextBadgeText: {
            fontSize: 9,
            fontWeight: '800',
            color: '#fff',
            letterSpacing: 0.5,
        },
        timeContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginBottom: 8,
        },
        timeText: {
            fontSize: 12,
            fontWeight: '700',
            color: theme.colors.textSecondary,
        },
        timeTextCurrent: {
            color: theme.colors.primary,
            fontSize: 13,
        },
        subjectName: {
            fontSize: 15,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 6,
            minHeight: 36,
        },
        subjectNameCurrent: {
            color: theme.colors.primary,
            fontWeight: '800',
        },
        gradeText: {
            fontSize: 12,
            fontWeight: '500',
            color: theme.colors.textSecondary,
            marginBottom: 4,
        },
        roomContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            marginBottom: 6,
        },
        roomText: {
            fontSize: 11,
            fontWeight: '500',
            color: theme.colors.textSecondary,
        },
        durationText: {
            fontSize: 11,
            fontWeight: '600',
            color: theme.colors.textLight,
            marginTop: 'auto',
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: theme.colors.divider,
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
        paginationContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 5,
            paddingHorizontal: 20,
        },
        paginationDotTouchable: {
            paddingHorizontal: 4,
            paddingVertical: 8,
            justifyContent: 'center',
            alignItems: 'center',
        },
        paginationDot: {
            height: 8,
            borderRadius: 4,
            marginHorizontal: 2,
        },
    });

