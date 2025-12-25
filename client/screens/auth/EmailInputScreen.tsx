import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { AuthStackParamList } from '@/types/navigation';
import { apiRequest } from '@/lib/query-client';
import { TextInput } from 'react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'EmailInput'>;

export default function EmailInputScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOTP = async () => {
    if (!isValidEmail) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);
    setError('');

    try {
      await apiRequest('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      navigation.navigate('OTPVerification', { email: email.toLowerCase().trim() });
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
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
          <Image
            source={require('@assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText style={styles.title}>Welcome to Coffee Date</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter your email to get started
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary, borderColor: error ? theme.error : theme.border }]}>
              <Feather name="mail" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {error ? (
              <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: isValidEmail && !isLoading ? theme.primary : theme.backgroundTertiary,
                opacity: pressed && isValidEmail ? 0.8 : 1,
              },
            ]}
            onPress={handleSendOTP}
            disabled={!isValidEmail || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <ThemedText
                style={[
                  styles.buttonText,
                  { color: isValidEmail ? theme.buttonText : theme.textSecondary },
                ]}
              >
                Continue
              </ThemedText>
            )}
          </Pressable>

          <ThemedText style={[styles.disclaimer, { color: theme.textSecondary }]}>
            We'll send you a verification code to sign in securely without a password
          </ThemedText>
        </View>
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
  logo: {
    width: 80,
    height: 80,
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
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: Spacing.buttonHeight,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
  },
  errorText: {
    ...Typography.caption,
    marginLeft: Spacing.xs,
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
  disclaimer: {
    ...Typography.caption,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
