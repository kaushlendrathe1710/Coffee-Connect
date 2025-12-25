import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { AuthStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'TermsConsent'>;

export default function TermsConsentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { login, completeOnboarding } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleTerms = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTermsAccepted(!termsAccepted);
  };

  const handleTogglePrivacy = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPrivacyAccepted(!privacyAccepted);
  };

  const handleCreateAccount = async () => {
    if (!termsAccepted || !privacyAccepted) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsLoading(true);

    try {
      // Create a demo user profile (in real app, this would be from auth provider)
      const demoUser = {
        id: `user_${Date.now()}`,
        name: 'Demo User',
        age: 25,
        gender: 'Other',
        bio: 'Coffee enthusiast looking for great conversations.',
        photos: [],
        coffeePreferences: ['Latte', 'Cappuccino'],
        interests: ['Travel', 'Reading', 'Music'],
        availability: [],
        role: 'guest' as const,
        verified: false,
        createdAt: new Date().toISOString(),
      };

      await login(demoUser);
      await completeOnboarding();
    } catch (error) {
      console.error('Failed to create account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isValid = termsAccepted && privacyAccepted;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleBack}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: '100%' }]} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.title}>Almost there!</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Please review and accept our terms to get started.
        </ThemedText>

        <View style={styles.consentItems}>
          <Pressable
            style={({ pressed }) => [
              styles.consentItem,
              { backgroundColor: theme.cardBackground, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
              Shadows.small,
            ]}
            onPress={handleToggleTerms}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: termsAccepted ? theme.primary : 'transparent',
                  borderColor: termsAccepted ? theme.primary : theme.border,
                },
              ]}
            >
              {termsAccepted && <Feather name="check" size={16} color={theme.buttonText} />}
            </View>
            <View style={styles.consentText}>
              <ThemedText style={styles.consentTitle}>Terms of Service</ThemedText>
              <ThemedText style={[styles.consentDescription, { color: theme.textSecondary }]}>
                I agree to the terms of service and understand how Coffee Date works.
              </ThemedText>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.consentItem,
              { backgroundColor: theme.cardBackground, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
              Shadows.small,
            ]}
            onPress={handleTogglePrivacy}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: privacyAccepted ? theme.primary : 'transparent',
                  borderColor: privacyAccepted ? theme.primary : theme.border,
                },
              ]}
            >
              {privacyAccepted && <Feather name="check" size={16} color={theme.buttonText} />}
            </View>
            <View style={styles.consentText}>
              <ThemedText style={styles.consentTitle}>Privacy Policy</ThemedText>
              <ThemedText style={[styles.consentDescription, { color: theme.textSecondary }]}>
                I consent to the collection and use of my data as described in the privacy policy.
              </ThemedText>
            </View>
          </Pressable>
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="shield" size={20} color={theme.primary} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Your data is safe with us. We never share your personal information with third parties
            without your explicit consent.
          </ThemedText>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl, backgroundColor: theme.backgroundRoot }]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: isValid ? theme.primary : theme.backgroundTertiary,
              opacity: (pressed && isValid) || isLoading ? 0.8 : 1,
            },
          ]}
          onPress={handleCreateAccount}
          disabled={!isValid || isLoading}
        >
          <ThemedText
            style={[styles.buttonText, { color: isValid ? theme.buttonText : theme.textSecondary }]}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.xl,
  },
  consentItems: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  consentText: {
    flex: 1,
  },
  consentTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  consentDescription: {
    ...Typography.small,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  infoText: {
    flex: 1,
    ...Typography.small,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
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
});
