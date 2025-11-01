import React, {useState, useMemo, useEffect} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Image,
    StyleSheet,
    Dimensions,
    ScrollView,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
    faUser,
    faComments,
    faBell,
    faDoorOpen,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useNotifications} from '../contexts/NotificationContext';
import {useMessaging} from '../contexts/MessagingContext';
import {getUnreadConversationsCount} from '../services/messagingService';
import {Config} from '../config/env';
import NotificationBadge from './NotificationBadge';
import MessageBadge from './MessageBadge';
import ParentNotificationBadge from './ParentNotificationBadge';
import {createLargeShadow, createMediumShadow} from "../utils/commonStyles";

const {width: screenWidth} = Dimensions.get('window');

// Animated Menu Item Component
function AnimatedMenuItem({item, index, isDanger, theme, isVisible}) {
    const translateX = useSharedValue(50);
    const opacity = useSharedValue(0);

    React.useEffect(() => {
        if (isVisible) {
            // Staggered animation for each item
            const delay = index * 50;
            setTimeout(() => {
                translateX.value = withSpring(0, {
                    damping: 20,
                    stiffness: 200,
                    mass: 0.5,
                });
                opacity.value = withTiming(1, {duration: 300});
            }, delay);
        } else {
            translateX.value = 50;
            opacity.value = 0;
        }
    }, [isVisible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{translateX: translateX.value}],
            opacity: opacity.value,
        };
    });

    const styles = createStyles(theme);

    return (
        <Animated.View style={animatedStyle}>
            <TouchableOpacity
                style={[
                    styles.menuItem,
                    isDanger && styles.menuItemDanger,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
            >
                <View style={styles.menuItemContent}>
                    <FontAwesomeIcon
                        icon={item.icon}
                        size={18}
                        color={isDanger ? theme.colors.error : theme.colors.text}
                    />
                    <Text
                        style={[
                            styles.menuItemLabel,
                            isDanger && styles.menuItemLabelDanger,
                        ]}
                    >
                        {item.label}
                    </Text>
                </View>
                <View style={styles.menuItemRight}>
                    {item.badge && <View style={styles.badgeContainer}>{item.badge}</View>}
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        size={14}
                        color={isDanger ? theme.colors.error : theme.colors.textSecondary}
                    />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function ProfileDropdownMenu({
                                                userData,
                                                onMessagesPress,
                                                onNotificationsPress,
                                                onLogoutPress,
                                                onProfilePress,
                                                userType = 'teacher', // 'teacher' or 'student'
                                            }) {
    const {theme} = useTheme();
    const {t} = useLanguage();
    const [showMenu, setShowMenu] = useState(false);

    // Get notification and message counts
    const {unreadCount: notificationUnreadCount} = useNotifications();
    const {totalUnreadMessages} = useMessaging();
    const [studentUnreadCount, setStudentUnreadCount] = useState(0);

    // Load unread count for specific student (parent view)
    useEffect(() => {
        if (userType === 'student' && userData?.authCode) {
            const loadStudentUnreadCount = async () => {
                try {
                    const response = await getUnreadConversationsCount(userData.authCode);
                    if (response.success && response.data) {
                        setStudentUnreadCount(response.data.total_unread_messages || 0);
                    }
                } catch (error) {
                    console.error('Error loading student unread count:', error);
                    setStudentUnreadCount(0);
                }
            };
            loadStudentUnreadCount();
        }
    }, [userType, userData?.authCode]);

    // Calculate total badge count
    const totalBadgeCount = useMemo(() => {
        const messageCount = userType === 'student' ? studentUnreadCount : totalUnreadMessages;
        const notifCount = notificationUnreadCount || 0;
        return messageCount + notifCount;
    }, [userType, studentUnreadCount, totalUnreadMessages, notificationUnreadCount]);

    // Reanimated shared values
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-20);
    const buttonScale = useSharedValue(1);

    const toggleMenu = () => {
        // Button bounce animation
        buttonScale.value = withSpring(0.85, {
            damping: 10,
            stiffness: 400,
        });
        setTimeout(() => {
            buttonScale.value = withSpring(1, {
                damping: 8,
                stiffness: 300,
            });
        }, 100);

        if (showMenu) {
            // Close animation
            scale.value = withTiming(0, {duration: 200});
            opacity.value = withTiming(0, {duration: 200});
            translateY.value = withTiming(-20, {duration: 200});
            setTimeout(() => setShowMenu(false), 200);
        } else {
            // Open animation with spring
            setShowMenu(true);
            scale.value = withSpring(1, {
                damping: 15,
                stiffness: 150,
                mass: 0.8,
            });
            opacity.value = withTiming(1, {duration: 200});
            translateY.value = withSpring(0, {
                damping: 15,
                stiffness: 150,
                mass: 0.8,
            });
        }
    };

    const handleMenuItemPress = (callback) => {
        toggleMenu();
        setTimeout(() => callback(), 200);
    };

    const menuItems = [
        {
            id: 'profile',
            label: t('profile') || 'Profile',
            icon: faUser,
            onPress: () => handleMenuItemPress(onProfilePress),
        },
        {
            id: 'messages',
            label: t('messages') || 'Messages',
            icon: faComments,
            onPress: () => handleMenuItemPress(onMessagesPress),
            badge: userType === 'student' ? (
                <MessageBadge userType='student' selectedStudent={userData} showAllStudents={false} />
            ) : (
                <MessageBadge userType='teacher' />
            ),
        },
        {
            id: 'notifications',
            label: t('notifications') || 'Notifications',
            icon: faBell,
            onPress: () => handleMenuItemPress(onNotificationsPress),
            badge: userType === 'student' ? (
                <NotificationBadge userType="student" />
            ) : userType === 'teacher' ? (
                <NotificationBadge userType="teacher" />
            ) : (
                <ParentNotificationBadge selectedStudent={userData} showAllStudents={false} />
            ),
        },
        {
            id: 'logout',
            label: t('logout') || 'Sign Out',
            icon: faDoorOpen,
            onPress: () => handleMenuItemPress(onLogoutPress),
            isDanger: true,
        },
    ];

    // Animated styles
    const animatedMenuStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {scale: scale.value},
                {translateY: translateY.value},
            ],
            opacity: opacity.value,
        };
    });

    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [{scale: buttonScale.value}],
        };
    });

    const styles = createStyles(theme);

    // Get photo URL with proper domain handling
    const getPhotoUri = (photoPath) => {
        if (!photoPath) return null;

        // If it's already a full URL, check if it has the wrong domain (0.0.0.0)
        if (photoPath.startsWith('http')) {
            // Replace 0.0.0.0 with the correct API domain
            if (photoPath.includes('0.0.0.0')) {
                const correctedUrl = photoPath.replace(/http:\/\/0\.0\.0\.0:\d+/, Config.API_DOMAIN);
                console.log('📸 PROFILE DROPDOWN: Corrected 0.0.0.0 URL:', photoPath, '->', correctedUrl);
                return correctedUrl;
            }
            // URL is already correct
            return photoPath;
        }
        // Otherwise, prepend the API domain
        return `${Config.API_DOMAIN}${photoPath}`;
    };

    const photoPath = userData?.photo ||
                      userData?.profile_photo ||
                      userData?.parent_photo ||
                      userData?.user_photo ||
                      userData?.parent_info?.photo ||
                      userData?.parent_info?.parent_photo ||
                      userData?.parent_info?.profile_photo ||
                      userData?.personal_info?.profile_photo;
    const photoUri = getPhotoUri(photoPath);

    console.log('📸 PROFILE DROPDOWN: Photo path:', photoPath);
    console.log('📸 PROFILE DROPDOWN: Photo URI:', photoUri);

    return (
        <View style={styles.container}>
            {/* Profile Picture Button */}
            <Animated.View style={animatedButtonStyle}>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={toggleMenu}
                    activeOpacity={1}
                >
                    {photoUri ? (
                        <Image
                            source={{uri: photoUri}}
                            style={styles.profileImage}
                            resizeMode='cover'
                            onError={(error) => {
                                console.error('❌ PROFILE DROPDOWN: Image load error:', error.nativeEvent.error);
                                console.error('🔗 PROFILE DROPDOWN: Failed image URL:', photoUri);
                            }}
                            onLoad={() => {
                                console.log('✅ PROFILE DROPDOWN: Image loaded successfully');
                            }}
                        />
                    ) : (
                        <View style={styles.profilePlaceholder}>
                            <FontAwesomeIcon icon={faUser} size={20} color='#fff'/>
                        </View>
                    )}
                    {/* Total Badge Count */}
                    {totalBadgeCount > 0 && (
                        <View style={styles.profileBadge}>
                            <Text style={styles.profileBadgeText}>
                                {totalBadgeCount > 99 ? '99+' : totalBadgeCount.toString()}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {/* Dropdown Menu Modal */}
            <Modal
                visible={showMenu}
                transparent
                animationType='none'
                onRequestClose={toggleMenu}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={toggleMenu}
                >
                    <Animated.View
                        style={[
                            styles.menuContainer,
                            animatedMenuStyle,
                        ]}
                    >
                        {/* User Info Header */}
                        <View style={styles.menuHeader}>
                            <View style={styles.headerAvatar}>
                                {photoUri ? (
                                    <Image
                                        source={{uri: photoUri}}
                                        style={styles.headerAvatarImage}
                                        resizeMode='cover'
                                        onError={(error) => {
                                            console.error('❌ PROFILE DROPDOWN HEADER: Image load error:', error.nativeEvent.error);
                                        }}
                                    />
                                ) : (
                                    <FontAwesomeIcon icon={faUser} size={24} color='#fff'/>
                                )}
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerName} numberOfLines={1}>
                                    {userData?.name || (userType === 'student' ? t('student') : t('teacher'))}
                                </Text>
                                <Text style={styles.headerRole} numberOfLines={1}>
                                    {userType === 'student'
                                        ? (userData?.class_name || userData?.className || t('student'))
                                        : userType === 'parent'
                                            ? (userData.parent_info.parent_email || t('parent'))
                                            : (userData?.email || t('teacher'))
                                    }
                                </Text>
                            </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider}/>

                        {/* Menu Items */}
                        <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
                            {menuItems.map((item, index) => (
                                <AnimatedMenuItem
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    isDanger={item.isDanger}
                                    theme={theme}
                                    isVisible={showMenu}
                                />
                            ))}
                        </ScrollView>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const createStyles = (theme) =>
    StyleSheet.create({
        container: {
            position: 'relative',
        },
        profileButton: {
            width: 40,
            height: 40,
            borderRadius: 20,

            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: theme.colors.primary + '30',
            ...theme.shadows.small,
        },
        profileImage: {
            width: 40,
            height: 40,
            borderRadius: 20,
            ...createLargeShadow(theme)
        },
        profilePlaceholder: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        profileBadge: {
            position: 'absolute',
            top: -10,
            right: -10,
            backgroundColor: '#FF3B30',
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: theme.colors.surface || '#fff',
        },
        profileBadgeText: {
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 'bold',
            textAlign: 'center',
        },
        backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-start',
            paddingTop: 60,
            paddingHorizontal: 0,
        },
        menuContainer: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            marginHorizontal: 16,
            marginTop: 0,
            width: screenWidth - 32,
            maxHeight: 400,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
        },
        menuHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: theme.colors.primary + '10',
        },
        headerAvatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            overflow: 'hidden',
        },
        headerAvatarImage: {
            width: 48,
            height: 48,
            borderRadius: 24,
        },
        headerInfo: {
            flex: 1,
        },
        headerName: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 2,
        },
        headerRole: {
            fontSize: 12,
            fontWeight: '500',
            color: theme.colors.textSecondary,
        },
        divider: {
            height: 1,
            backgroundColor: theme.colors.border,
        },
        menuItems: {
            maxHeight: 300,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        menuItemLast: {
            borderBottomWidth: 0,
        },
        menuItemDanger: {
            backgroundColor: theme.colors.error + '10',
        },
        menuItemContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        menuItemLabel: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.colors.text,
            marginLeft: 12,
        },
        menuItemLabelDanger: {
            color: theme.colors.error,
        },
        menuItemRight: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        },
        badgeContainer: {
            marginRight: 4,
            marginBottom: 15,
        },
    });

