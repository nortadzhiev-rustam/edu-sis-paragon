/**
 * Guardian QR Scanner Fallback Screen
 * Simple manual entry screen when camera scanning is not available
 */

import React, {useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform, ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
    faQrcode,
    faArrowLeft,
    faKey,
} from '@fortawesome/free-solid-svg-icons';
import guardianService from '../services/guardianService';
import guardianStorageService from '../services/guardianStorageService';
import {getDeviceToken} from '../utils/messaging';
import * as Device from 'expo-device';

const GuardianQRScannerFallbackScreen = ({navigation}) => {
    const {theme} = useTheme();
    const {t} = useLanguage();

    const [qrToken, setQrToken] = useState('');
    const [loading, setLoading] = useState(false);

    const styles = createStyles(theme);

    const handleManualLogin = async () => {
        if (!qrToken.trim()) {
            Alert.alert(t('error'), t('pleaseEnterQrToken'));
            return;
        }

        setLoading(true);

        try {
            console.log('📱 QR FALLBACK: Manual QR login with token:', qrToken);

            // Get device information
            let actualDeviceToken = '';

            try {
                // Get the actual Firebase device token
                actualDeviceToken = await getDeviceToken();
                console.log(
                    '🎫 GUARDIAN FALLBACK: Got device token:',
                    actualDeviceToken ? 'available' : 'not available'
                );
            } catch (error) {
                console.error(
                    '❌ GUARDIAN FALLBACK: Failed to get device token:',
                    error
                );
                // Continue with empty token - the API should handle this gracefully
            }

            const deviceInfo = {
                deviceToken: actualDeviceToken || '', // Use actual Firebase token
                deviceType: Platform.OS,
                deviceName: Device.deviceName || `${Platform.OS} Device`,
            };

            // Attempt guardian login
            const response = await guardianService.guardianQrLogin(
                qrToken.trim(),
                deviceInfo
            );

            if (response.success) {
                // Store guardian data for persistent login
                console.log(
                    '💾 QR FALLBACK: Storing guardian data for persistent login...'
                );
                const storeSuccess = await guardianStorageService.storeGuardianData(
                    response.guardian,
                    response.auth_code,
                    response.child
                );

                if (storeSuccess) {
                    console.log('✅ QR FALLBACK: Guardian data stored successfully');
                } else {
                    console.warn('⚠️ QR FALLBACK: Failed to store guardian data');
                }

                if (response.requires_profile_completion) {
                    // Navigate to profile completion
                    navigation.replace('GuardianProfileCompletion', {
                        authCode: response.auth_code,
                        guardian: response.guardian,
                        child: response.child,
                        firstTimeLogin: response.first_time_login,
                    });
                } else {
                    // Navigate to guardian dashboard
                    navigation.replace('GuardianDashboard', {
                        authCode: response.auth_code,
                        guardian: response.guardian,
                        child: response.child,
                    });
                }
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('❌ QR FALLBACK: Login error:', error);
            Alert.alert(t('loginFailed'), error.message || t('invalidQrToken'), [
                {
                    text: t('tryAgain'),
                    onPress: () => {
                        setQrToken('');
                        setLoading(false);
                    },
                },
            ]);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            size={18}
                            color={theme.colors.headerText}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('guardianLogin')}</Text>
                    <View style={styles.headerSpacer}/>
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps='handled'
                >
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <FontAwesomeIcon
                            icon={faQrcode}
                            size={80}
                            color={theme.colors.primary}
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{t('enterQrToken')}</Text>
                    <Text style={styles.subtitle}>{t('enterQrTokenManually')}</Text>

                    {/* Input */}
                    <View style={styles.inputContainer}>
                        <FontAwesomeIcon
                            icon={faKey}
                            size={20}
                            color={theme.colors.textSecondary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.textInput}
                            value={qrToken}
                            onChangeText={setQrToken}
                            placeholder={t('qrTokenPlaceholder')}
                            placeholderTextColor={theme.colors.textSecondary}
                            autoCapitalize='none'
                            autoCorrect={false}
                            multiline={true}
                            numberOfLines={3}
                            textAlignVertical='top'
                        />
                    </View>

                    {/* Instructions */}
                    <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsTitle}>{t('instructions')}:</Text>
                        <Text style={styles.instructionText}>
                            • {t('copyQrTokenFromParent')}
                        </Text>
                        <Text style={styles.instructionText}>
                            • {t('pasteTokenInFieldAbove')}
                        </Text>
                        <Text style={styles.instructionText}>
                            • {t('tapLoginToAuthenticate')}
                        </Text>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            (!qrToken.trim() || loading) && styles.loginButtonDisabled,
                        ]}
                        onPress={handleManualLogin}
                        disabled={!qrToken.trim() || loading}
                    >
                        <Text
                            style={[
                                styles.loginButtonText,
                                (!qrToken.trim() || loading) && styles.loginButtonTextDisabled,
                            ]}
                        >
                            {loading ? t('authenticating') : t('login')}
                        </Text>
                    </TouchableOpacity>

                    {/* Help */}
                    <View style={styles.helpContainer}>
                        <Text style={styles.helpTitle}>{t('needHelp')}?</Text>
                        <Text style={styles.helpText}>{t('qrTokenHelpMessage')}</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        flex: {
            flex: 1,
        },
        header: {
            backgroundColor: theme.colors.primary,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        backButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerTitle: {
            flex: 1,
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.headerText,
            textAlign: 'center',
        },
        headerSpacer: {
            width: 36,
        },
        scrollContainer: {
            flex: 1,
        },
        content: {
            flex: 1,
            padding: 20,
        },
        iconContainer: {
            alignItems: 'center',
            marginTop: 40,
            marginBottom: 30,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 16,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: 40,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        inputIcon: {
            marginTop: 2,
            marginRight: 12,
        },
        textInput: {
            flex: 1,
            fontSize: 16,
            color: theme.colors.text,
            minHeight: 80,
        },
        instructionsContainer: {
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
        },
        instructionsTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 12,
        },
        instructionText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 6,
            lineHeight: 20,
        },
        loginButton: {
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 24,
        },
        loginButtonDisabled: {
            backgroundColor: theme.colors.textSecondary,
            opacity: 0.5,
        },
        loginButtonText: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.headerText,
        },
        loginButtonTextDisabled: {
            opacity: 0.7,
        },
        helpContainer: {
            backgroundColor: theme.colors.warning + '20',
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.warning,
        },
        helpTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 8,
        },
        helpText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            lineHeight: 20,
        },
    });

export default GuardianQRScannerFallbackScreen;
