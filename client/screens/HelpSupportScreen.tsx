import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const faqItems = [
    {
      question: 'How do I add funds to my wallet?',
      answer: 'Go to your Profile tab and tap on "My Wallet". You can add funds using your credit/debit card through our secure payment partner.',
    },
    {
      question: 'How do I schedule a coffee date?',
      answer: 'Once you match with someone, start a conversation in the Chat screen. You can then propose a coffee date by tapping the calendar icon.',
    },
    {
      question: 'How does payment work?',
      answer: 'Guests add funds to their wallet. When both users confirm a date, the payment is automatically transferred to the Host.',
    },
    {
      question: 'Can I get a refund?',
      answer: 'Refunds are available if a date is cancelled before the scheduled time. Contact support for assistance with refund requests.',
    },
    {
      question: 'How do I report a user?',
      answer: 'You can report inappropriate behavior by going to the user\'s profile and tapping the report button, or by contacting support.',
    },
    {
      question: 'How do I become a verified Host?',
      answer: 'Submit your verification request through the Profile settings. Our team will review your application within 24-48 hours.',
    },
  ];

  const contactOptions = [
    {
      icon: 'mail',
      title: 'Email Support',
      subtitle: 'support@coffeedate.app',
      onPress: () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Linking.openURL('mailto:support@coffeedate.app');
      },
    },
    {
      icon: 'message-circle',
      title: 'Live Chat',
      subtitle: 'Available 9 AM - 6 PM IST',
      onPress: () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
    },
    {
      icon: 'twitter',
      title: 'Twitter',
      subtitle: '@CoffeeDateApp',
      onPress: () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Linking.openURL('https://twitter.com/CoffeeDateApp');
      },
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerCard, { backgroundColor: theme.primary }]}>
          <Feather name="help-circle" size={32} color="#FFF" />
          <ThemedText style={styles.headerTitle}>How can we help?</ThemedText>
          <ThemedText style={styles.headerText}>
            Find answers to common questions or reach out to our support team
          </ThemedText>
        </View>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Contact Us
        </ThemedText>

        <View style={[styles.contactCard, { backgroundColor: theme.cardBackground }, Shadows.small]}>
          {contactOptions.map((option, index) => (
            <Pressable
              key={index}
              style={[
                styles.contactItem,
                index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
              ]}
              onPress={option.onPress}
            >
              <View style={[styles.contactIcon, { backgroundColor: theme.primary + '20' }]}>
                <Feather name={option.icon as any} size={18} color={theme.primary} />
              </View>
              <View style={styles.contactInfo}>
                <ThemedText style={styles.contactTitle}>{option.title}</ThemedText>
                <ThemedText style={[styles.contactSubtitle, { color: theme.textSecondary }]}>
                  {option.subtitle}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Frequently Asked Questions
        </ThemedText>

        {faqItems.map((item, index) => (
          <View
            key={index}
            style={[styles.faqCard, { backgroundColor: theme.cardBackground }, Shadows.small]}
          >
            <ThemedText style={styles.faqQuestion}>{item.question}</ThemedText>
            <ThemedText style={[styles.faqAnswer, { color: theme.textSecondary }]}>
              {item.answer}
            </ThemedText>
          </View>
        ))}
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
  headerCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: '#FFF',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  headerText: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  contactCard: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  contactSubtitle: {
    ...Typography.small,
  },
  faqCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  faqQuestion: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  faqAnswer: {
    ...Typography.small,
    lineHeight: 20,
  },
});
