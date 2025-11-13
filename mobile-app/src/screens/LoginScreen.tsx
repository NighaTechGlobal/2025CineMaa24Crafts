import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../styles/tokens';
import { sendOtp, verifyOtp, sessionLogin } from '../services/api';
import { storeUser, storeSessionId, storeToken } from '../services/authStorage';
import { useAuth } from '../providers/AuthProvider';
import ModernDialog from '../components/ModernDialog';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const { setSessionAuthenticated } = useAuth();
  const { width: winW, height: winH } = useWindowDimensions();
  const isSmallDevice = winH < 640 || winW < 360;
  const topSectionHeight = Math.max(220, Math.min(winH * 0.4, 380));
  const heroPadTop = isSmallDevice ? winH * 0.06 : winH * 0.08;
  const blob1Size = Math.max(140, Math.min(winW * 0.55, 260));
  const blob2Size = Math.max(120, Math.min(winW * 0.45, 220));
  const blob3Size = Math.max(110, Math.min(winW * 0.38, 200));
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [userType, setUserType] = useState<'Artist' | 'Recruiter'>('Artist');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Modern dialog state and helper
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message?: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    primaryLabel?: string;
    onPrimaryPress?: () => void;
    secondaryLabel?: string;
    onSecondaryPress?: () => void;
  }>({ title: '' });

  const showDialog = (cfg: {
    title: string;
    message?: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    primaryLabel?: string;
    onPrimaryPress?: () => void;
    secondaryLabel?: string;
    onSecondaryPress?: () => void;
  }) => {
    setDialogConfig(cfg);
    setDialogVisible(true);
  };

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Toggle animation
  const slideIndicator = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle tilt loop for 3D-like hero blobs
    Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Animate toggle when userType changes (indicator only; form stays static)
  useEffect(() => {
    Animated.spring(slideIndicator, {
      toValue: userType === 'Artist' ? 0 : 1,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [userType]);

  // Smoothly transition between phone form and OTP form
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(formSlide, {
          toValue: showOtpInput ? 20 : -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(formSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [showOtpInput]);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    let cleaned = text.replace(/\D/g, '');
    
    // If starts with 91 (country code), remove it
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    }
    
    // Return clean 10-digit number (no country code)
    return cleaned;
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      showDialog({
        title: 'Invalid Phone',
        message: 'Please enter a valid 10-digit mobile number',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: () => setDialogVisible(false),
      });
      return;
    }

    if (mode === 'register' && !agreeTerms) {
      showDialog({
        title: 'Terms & Conditions',
        message: 'Please agree to the terms and conditions',
        type: 'warning',
        primaryLabel: 'OK',
        onPrimaryPress: () => setDialogVisible(false),
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const result = await sendOtp(formattedPhone);
      
      if (result.success) {
        setShowOtpInput(true);
        setResendTimer(30);
        showDialog({
          title: 'OTP Sent',
          message: 'We sent a 6-digit code to your mobile number',
          type: 'success',
          primaryLabel: 'OK',
          onPrimaryPress: () => {
            setDialogVisible(false);
            setTimeout(() => otpRefs.current[0]?.focus(), 300);
          },
        });
      } else {
        showDialog({
          title: 'Error',
          message: result.message || 'Failed to send OTP',
          type: 'error',
          primaryLabel: 'OK',
          onPrimaryPress: () => setDialogVisible(false),
        });
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      showDialog({
        title: 'Network Error',
        message: 'Failed to send OTP. Please check your connection.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: () => setDialogVisible(false),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showDialog({
        title: 'Invalid OTP',
        message: 'Please enter the complete 6-digit OTP',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: () => setDialogVisible(false),
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const result = await verifyOtp(formattedPhone, otpCode);

      // Check if user is new (needs to signup)
      if (result.isNewUser) {
        showDialog({
          title: 'Welcome!',
          message: 'Please complete your profile',
          type: 'info',
          primaryLabel: 'Continue',
          onPrimaryPress: () => {
            setDialogVisible(false);
            if (userType === 'Artist') {
              navigation.navigate('ArtistSignup', { phone: formattedPhone, otp: otpCode });
            } else {
              navigation.navigate('RecruiterSignup', { phone: formattedPhone, otp: otpCode });
            }
          },
        });
      } else if (result.success && result.user) {
        // Existing user - create persistent session
        const loginRes = await sessionLogin(formattedPhone, otpCode, Platform.OS);

        // Store session id
        if (loginRes.session_id) {
          await storeSessionId(loginRes.session_id);
        }

        // Store JWT token from verifyOtp response for JWT-only endpoints
        if (result.access_token) {
          await storeToken(result.access_token);
        }

        // Store user data
        const u = loginRes.user || result.user;
        await storeUser({
          id: u.id,
          phone: u.phone,
          email: u.email,
          role: u.role,
          firstName: u.firstName,
          lastName: u.lastName,
        });

        // Set authenticated via session
        await setSessionAuthenticated();
        showDialog({
          title: 'Login Successful',
          message: 'Welcome back!',
          type: 'success',
          primaryLabel: 'Continue',
          onPrimaryPress: () => {
            setDialogVisible(false);
            // AppNavigator will switch to the authenticated stack based on provider state
          },
        });
      } else {
        showDialog({
          title: 'Error',
          message: result.message || 'Invalid OTP',
          type: 'error',
          primaryLabel: 'OK',
          onPrimaryPress: () => setDialogVisible(false),
        });
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      showDialog({
        title: 'Error',
        message: 'Failed to verify OTP',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: () => setDialogVisible(false),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Don't auto-submit, let user click verify button
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace') return;
    const current = otp[index];
    if (current) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }
    if (index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const floatingTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const indicatorTranslate = slideIndicator.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (width - spacing.xl * 2 - 8) / 2],
  });

  const tiltRotate = tiltAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '8deg'],
  });
  // Continuous falling movie-themed icons
  const movieEmojis = ['🎬', '🎥', '🎞️', '📽️', '🎭', '🎬'];
  const FALLER_COUNT = 8;
  const fallersRef = useRef(
    Array.from({ length: FALLER_COUNT }).map(() => ({
      emoji: movieEmojis[Math.floor(Math.random() * movieEmojis.length)],
      left: Math.floor(Math.random() * (width - 60)) + 10,
      size: Math.floor(Math.random() * 12) + 26,
      duration: Math.floor(Math.random() * 3000) + 4500,
    }))
  ).current;
  const fallYAnims = useRef(Array.from({ length: FALLER_COUNT }).map(() => new Animated.Value(-60))).current;

  useEffect(() => {
    // Start continuous fall loops
    fallYAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: topSectionHeight + 80,
            duration: fallersRef[i].duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: -60,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topSectionHeight]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Modern Purple Gradient Background */}
        <View style={[styles.topSection, { height: topSectionHeight }]}>
          <View
            style={[styles.skyGradient, { paddingTop: heroPadTop }]}
          >
            {/* Removed decorative curves and 3D blobs to eliminate square/box visuals */}

            {/* Logo without 3D card (keep only movie-related visuals) */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={require('../assets/logo.png')}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Falling movie-themed icons */}
            {fallersRef.map((f, i) => (
              <Animated.Text
                key={`faller-${i}`}
                style={[
                  styles.fallerIcon,
                  {
                    left: f.left,
                    fontSize: f.size,
                    transform: [{ translateY: fallYAnims[i] }],
                    opacity: 0.28,
                  },
                ]}
              >
                {f.emoji}
              </Animated.Text>
            ))}
          </View>

          {/* Bottom white curve */}
          <View style={styles.bottomCurveContainer}>
            <View style={styles.bottomCurve} />
          </View>
        </View>

        {/* Form Section */}
        <Animated.View
          style={[
            styles.formSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* User Type Toggle with Animated Indicator */}
          <View style={styles.typeToggleContainer}>
            <View style={styles.typeToggle}>
              {/* Modern Animated sliding indicator */}
              <Animated.View
                style={[
                  styles.toggleIndicator,
                  {
                    transform: [{ translateX: indicatorTranslate }],
                  },
                ]}
              >
                <View style={styles.indicatorGradient} />
              </Animated.View>

              {/* Toggle Buttons */}
              <TouchableOpacity
                style={styles.typeButton}
                onPress={() => setUserType('Artist')}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    userType === 'Artist' && styles.typeButtonTextActive,
                  ]}
                >
                  🎭 Artist
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.typeButton}
                onPress={() => setUserType('Recruiter')}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    userType === 'Recruiter' && styles.typeButtonTextActive,
                  ]}
                >
                  💼 Recruiter
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Animated Form Content */}
          <Animated.View
            style={{
              opacity: formOpacity,
              transform: [{ translateX: formSlide }],
            }}
          >
            {!showOtpInput ? (
              <>
                {/* Phone Input */}
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="call" size={20} color="#4A90E2" />
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter mobile number"
                    placeholderTextColor={colors.textLight}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={10}
                  />
                </View>

                {/* Terms Checkbox */}
                {mode === 'register' && (
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAgreeTerms(!agreeTerms)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        agreeTerms && styles.checkboxChecked,
                      ]}
                    >
                      {agreeTerms && (
                        <Ionicons name="checkmark" size={16} color={colors.white} />
                      )}
                    </View>
                    <Text style={styles.checkboxText}>
                      I agree to the terms and conditions
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.disabledButton]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to send OTP"
                  hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
                >
                  <View style={styles.buttonGradient}>
                    {loading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {mode === 'register' ? 'Continue' : 'Send OTP'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>


              </>
            ) : (
              <>
                {/* OTP Input Section */}
                <View style={styles.otpSection}>
                  <Text style={styles.otpTitle}>Enter Verification Code</Text>
                  <Text style={styles.otpSubtitle}>
                    We sent a code to +91 {phone}
                  </Text>

                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => { otpRefs.current[index] = ref; }}
                        style={[styles.otpBox, digit && styles.otpBoxFilled]}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) =>
                          handleOtpKeyPress(nativeEvent.key, index)
                        }
                        keyboardType="number-pad"
                        maxLength={1}
                        
                      />
                    ))}
                  </View>

                  {/* Verify OTP Button */}
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleVerifyOtp}
                    disabled={loading || otp.join('').length !== 6}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Verify one-time password"
                    hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
                  >
                    <View style={styles.verifyButtonGradient}>
                      {loading ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <Text style={styles.verifyButtonText}>Verify OTP</Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {resendTimer > 0 ? (
                    <Text style={styles.timerText}>
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                      <Text style={styles.resendButton}>Resend Code</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      setShowOtpInput(false);
                      setOtp(['', '', '', '', '', '']);
                    }}
                    style={styles.changeNumberButton}
                  >
                    <Text style={styles.changeNumberText}>Change Number</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
      {/* Modern dialog for user feedback */}
      <ModernDialog
        visible={dialogVisible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        primaryLabel={dialogConfig.primaryLabel}
        onPrimaryPress={dialogConfig.onPrimaryPress}
        secondaryLabel={dialogConfig.secondaryLabel}
        onSecondaryPress={dialogConfig.onSecondaryPress}
        onClose={() => setDialogVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  topSection: {
    height: height * 0.4,
    position: 'relative',
  },
  skyGradient: {
    flex: 1,
    alignItems: 'center',
    paddingTop: height * 0.08,
    backgroundColor: colors.primary,
  },
  /* Removed hero3dContainer, mesh blobs, and topCurve styles */
  logoCard: {
    width: 110,
    height: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xl,
    zIndex: 10,
  },
  logoNumber: {
    fontSize: 36,
    color: '#4A90E2',
    marginTop: -5,
  },
  logoSubtext: {
    fontSize: 12,
    color: '#4A90E2',
    letterSpacing: 1,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 36,
  },
  bottomCurveContainer: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 50,
    overflow: 'hidden',
  },
  bottomCurve: {
    width: width,
    height: 100,
    backgroundColor: colors.white,
    borderTopLeftRadius: width / 2,
    borderTopRightRadius: width / 2,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  typeToggleContainer: {
    marginBottom: spacing.xl,
  },
  typeToggle: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  toggleIndicator: {
    position: 'absolute',
    left: 5,
    top: 5,
    bottom: 5,
    width: (width - spacing.xl * 2 - 10) / 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...shadows.medium,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    zIndex: 1,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  typeButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: spacing.md + 2,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  inputIconContainer: {
    marginRight: spacing.sm + 2,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 6,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  checkboxText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.xl,
    marginBottom: spacing.lg,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
  },
  verifyButtonGradient: {
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    ...shadows.xl,
    backgroundColor: colors.primary,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.white,
    letterSpacing: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modeSwitchButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  modeSwitchText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A90E2',
  },
  otpSection: {
    alignItems: 'center',
  },
  otpTitle: {
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    justifyContent: 'center',
  },
  otpBox: {
    width: 50,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: borderRadius.md,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    ...shadows.small,
  },
  otpBoxFilled: {
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: colors.white,
    borderWidth: 2.5,
  },
  timerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  resendButton: {
    fontSize: 16,
    color: '#4A90E2',
    marginTop: spacing.md,
    textDecorationLine: 'underline',
  },
  changeNumberButton: {
    marginTop: spacing.xl,
  },
  changeNumberText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  fallerIcon: {
    position: 'absolute',
    top: -60,
    fontSize: 32,
  },
});







