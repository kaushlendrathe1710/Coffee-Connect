import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';

export default function BlockedUsersScreen() {
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
        <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="slash" size={32} color={theme.textSecondary} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Blocked Users</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            When you block someone, they will appear here. Blocked users cannot see your profile or send you messages.
          </ThemedText>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={styles.infoTitle}>How blocking works</ThemedText>
          <View style={styles.infoItem}>
            <Feather name="eye-off" size={16} color={theme.primary} />
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              Blocked users cannot see your profile
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <Feather name="message-circle" size={16} color={theme.primary} />
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              They cannot send you messages
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <Feather name="heart" size={16} color={theme.primary} />
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              Any existing matches will be removed
            </ThemedText>
          </View>
        </View>
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
  emptyState: {
    alignItems: 'center',
    padding: Spacing['3xl'],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h4,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoText: {
    ...Typography.small,
    flex: 1,
  },
});
