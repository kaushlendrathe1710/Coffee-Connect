import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        { icon: 'bell', label: 'Push Notifications', type: 'toggle', value: true },
        { icon: 'message-circle', label: 'Message Notifications', type: 'toggle', value: true },
        { icon: 'heart', label: 'Match Notifications', type: 'toggle', value: true },
      ],
    },
    {
      title: 'Privacy',
      items: [
        { icon: 'eye-off', label: 'Hide Online Status', type: 'toggle', value: false },
        { icon: 'map-pin', label: 'Show Distance', type: 'toggle', value: true },
        { icon: 'check-circle', label: 'Read Receipts', type: 'toggle', value: true },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'shield', label: 'Blocked Users', type: 'link' },
        { icon: 'file-text', label: 'Terms of Service', type: 'link' },
        { icon: 'lock', label: 'Privacy Policy', type: 'link' },
      ],
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </ThemedText>
            <View style={[styles.sectionContent, { backgroundColor: theme.cardBackground }, Shadows.small]}>
              {section.items.map((item, index) => (
                <View
                  key={item.label}
                  style={[
                    styles.settingItem,
                    index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                  ]}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: theme.backgroundSecondary }]}>
                      <Feather name={item.icon as any} size={18} color={theme.text} />
                    </View>
                    <ThemedText style={styles.settingLabel}>{item.label}</ThemedText>
                  </View>
                  {item.type === 'toggle' ? (
                    <Switch
                      value={item.value}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor="#FFFFFF"
                    />
                  ) : (
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.dangerSection}>
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              { backgroundColor: theme.error + '15', opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleDeleteAccount}
          >
            <Feather name="trash-2" size={18} color={theme.error} />
            <ThemedText style={[styles.deleteText, { color: theme.error }]}>Delete Account</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
          Coffee Date v1.0.0
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
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    ...Typography.body,
  },
  dangerSection: {
    marginTop: Spacing.xl,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
  },
  deleteText: {
    ...Typography.body,
    fontWeight: '600',
  },
  version: {
    ...Typography.small,
    textAlign: 'center',
    marginTop: Spacing['2xl'],
  },
});
