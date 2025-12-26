import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';

export default function TermsOfServiceScreen() {
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

        <ThemedText style={styles.sectionTitle}>1. Acceptance of Terms</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          By accessing or using Coffee Date, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>2. Eligibility</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          You must be at least 18 years old to use Coffee Date. By using the app, you represent and warrant that you are at least 18 years of age.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>3. Account Registration</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to provide accurate and complete information during registration.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>4. User Conduct</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          You agree not to use Coffee Date to: harass, abuse, or harm others; impersonate any person or entity; post false or misleading information; engage in any illegal activities; or violate any applicable laws or regulations.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>5. Payments</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          Guests may add funds to their wallet to pay for coffee dates with Hosts. All payments are processed through secure third-party payment processors. Refunds are subject to our refund policy.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>6. Host Responsibilities</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          Hosts agree to conduct themselves professionally during coffee dates, provide accurate profile information, and respect the safety and privacy of Guests.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>7. Termination</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          We reserve the right to suspend or terminate your account at any time for violating these terms or for any other reason at our sole discretion.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>8. Disclaimer</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          Coffee Date is provided "as is" without warranties of any kind. We are not responsible for the conduct of users or the outcome of any dates arranged through the app.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>9. Contact</ThemedText>
        <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
          For questions about these Terms, please contact us at support@coffeedate.app
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
