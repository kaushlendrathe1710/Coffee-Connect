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

export default function SafetyPrivacyScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const safetyTips = [
    {
      icon: 'map-pin',
      title: 'Meet in Public Places',
      description: 'Always meet your coffee date at a public cafe or restaurant. Avoid private locations for first meetings.',
    },
    {
      icon: 'users',
      title: 'Tell Someone',
      description: 'Let a friend or family member know where you\'re going and who you\'re meeting.',
    },
    {
      icon: 'shield',
      title: 'Protect Your Information',
      description: 'Don\'t share personal details like your home address, workplace, or financial information.',
    },
    {
      icon: 'phone',
      title: 'Keep Your Phone Charged',
      description: 'Make sure your phone is fully charged before your date in case you need to call for help.',
    },
    {
      icon: 'alert-triangle',
      title: 'Trust Your Instincts',
      description: 'If something feels wrong, leave immediately. Your safety is more important than being polite.',
    },
    {
      icon: 'x-circle',
      title: 'Report Suspicious Behavior',
      description: 'Report any users who make you uncomfortable or behave inappropriately.',
    },
  ];

  const handleEmergencyCall = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Linking.openURL('tel:112');
    }
  };

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
          <Feather name="shield" size={32} color="#FFF" />
          <ThemedText style={styles.headerTitle}>Your Safety Matters</ThemedText>
          <ThemedText style={styles.headerText}>
            Follow these guidelines to stay safe while using Coffee Date
          </ThemedText>
        </View>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Safety Tips
        </ThemedText>

        {safetyTips.map((tip, index) => (
          <View
            key={index}
            style={[styles.tipCard, { backgroundColor: theme.cardBackground }, Shadows.small]}
          >
            <View style={[styles.tipIcon, { backgroundColor: theme.primary + '20' }]}>
              <Feather name={tip.icon as any} size={20} color={theme.primary} />
            </View>
            <View style={styles.tipContent}>
              <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
              <ThemedText style={[styles.tipDescription, { color: theme.textSecondary }]}>
                {tip.description}
              </ThemedText>
            </View>
          </View>
        ))}

        {Platform.OS !== 'web' ? (
          <Pressable
            style={({ pressed }) => [
              styles.emergencyButton,
              { backgroundColor: theme.error, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleEmergencyCall}
          >
            <Feather name="phone-call" size={20} color="#FFF" />
            <ThemedText style={styles.emergencyText}>Emergency: Call 112</ThemedText>
          </Pressable>
        ) : null}
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
  tipCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  tipDescription: {
    ...Typography.small,
    lineHeight: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  emergencyText: {
    ...Typography.body,
    fontWeight: '700',
    color: '#FFF',
  },
});
