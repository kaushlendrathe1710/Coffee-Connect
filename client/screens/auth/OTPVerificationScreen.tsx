import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, TextInput as RNTextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { AuthStackParamList } from '@/types/navigation';
import { apiRequest } from '@/lib/query-client';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type RoutePropType = RouteProp<AuthStackParamList, 'OTPVerification'>;

const OTP_LENGTH = 6;

export default function OTPVerificationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { theme } = useTheme();
  const { login, completeOnboarding } = useAuth();

  const { email } = route.params;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    
    if (value.length > 1) {
      const digits = value.slice(0, OTP_LENGTH - index).split('');
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    setError('');
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isComplete = otp.every((digit) => digit !== '');

  const handleVerify = async () => {
    if (!isComplete) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code: otp.join('') }),
      });

      const data = await response;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await login({
        id: data.user.id,
        name: data.user.name || '',
        age: parseInt(data.user.age) || 0,
        gender: data.user.gender || '',
        bio: data.user.bio || '',
        photos: data.user.photos || [],
        coffeePreferences: data.user.coffeePreferences || [],
        interests: data.user.interests || [],
        availability: data.user.availability || [],
        role: data.user.role || 'guest',
        location: data.user.location,
        verified: data.user.verified || false,
        createdAt: data.user.createdAt || new Date().toISOString(),
        email: data.user.email,
      });

      if (!data.isNewUser && data.user.onboardingCompleted) {
        await completeOnboarding();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await apiRequest('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setResendCountdown(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing['3xl'], paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.secondary }]}>
            <Feather name="mail" size={32} color={theme.primary} />
          </View>
          <ThemedText style={styles.title}>Check your email</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            We sent a 6-digit code to
          </ThemedText>
          <ThemedText style={styles.email}>{email}</ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <RNTextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: error ? theme.error : digit ? theme.primary : theme.border,
                    color: theme.text,
                  },
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                selectTextOnFocus
                editable={!isLoading}
              />
            ))}
          </View>

          {error ? (
            <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: isComplete && !isLoading ? theme.primary : theme.backgroundTertiary,
                opacity: pressed && isComplete ? 0.8 : 1,
              },
            ]}
            onPress={handleVerify}
            disabled={!isComplete || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <ThemedText
                style={[
                  styles.buttonText,
                  { color: isComplete ? theme.buttonText : theme.textSecondary },
                ]}
              >
                Verify
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            style={styles.resendButton}
            onPress={handleResend}
            disabled={resendCountdown > 0}
          >
            <ThemedText
              style={[
                styles.resendText,
                { color: resendCountdown > 0 ? theme.textSecondary : theme.primary },
              ]}
            >
              {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Didn't receive code? Resend"}
            </ThemedText>
          </Pressable>
        </View>

        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={theme.textSecondary} />
          <ThemedText style={[styles.backText, { color: theme.textSecondary }]}>
            Use a different email
          </ThemedText>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  email: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    gap: Spacing.lg,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  resendText: {
    ...Typography.body,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: 'auto',
    paddingVertical: Spacing.md,
  },
  backText: {
    ...Typography.body,
  },
});
