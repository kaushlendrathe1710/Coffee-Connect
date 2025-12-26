import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.lastUpdated}>Last updated: December 2025</ThemedText>

        <ThemedText style={styles.sectionTitle}>1. Information We Collect</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          We collect information you provide directly, including: email address, name, age, photos, bio, location data, and coffee preferences. We also collect usage data to improve our services.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>2. How We Use Your Information</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          We use your information to: provide and improve our services, match you with compatible users, process payments, send notifications, and ensure platform safety.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>3. Information Sharing</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          We share limited profile information with other users to facilitate matches. We do not sell your personal information to third parties. We may share data with service providers who assist in operating our platform.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>4. Location Data</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          With your permission, we collect location data to show nearby users and cafes. You can disable location services at any time through your device settings.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>5. Data Security</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>6. Data Retention</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          We retain your data for as long as your account is active. Upon account deletion, we will delete or anonymize your data within 30 days, except where required by law.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>7. Your Rights</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          You have the right to: access your data, correct inaccuracies, delete your account, export your data, and opt out of marketing communications.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>8. Cookies</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          We use cookies and similar technologies to enhance your experience, analyze usage, and deliver personalized content.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>9. Contact</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          For privacy-related inquiries, please contact us at privacy@coffeedate.app
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
  },
  lastUpdated: {
    ...Typography.small,
    fontStyle: 'italic',
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    ...Typography.body,
    lineHeight: 24,
  },
});
