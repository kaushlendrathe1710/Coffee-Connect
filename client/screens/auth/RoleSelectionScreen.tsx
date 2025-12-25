import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
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
import { UserRole } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RoleSelection'>;

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleSelectRole = (role: UserRole) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('ProfileSetup', { role: selectedRole });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleBack}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.title}>How would you like to use Coffee Date?</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose your role. This cannot be changed later.
        </ThemedText>

        <View style={styles.options}>
          <RoleCard
            role="host"
            title="Be a Host"
            description="Offer coffee dates and earn money by sharing your time and conversation with guests."
            icon="coffee"
            isSelected={selectedRole === 'host'}
            onSelect={() => handleSelectRole('host')}
          />
          <RoleCard
            role="guest"
            title="Find a Date"
            description="Discover interesting hosts and pay for meaningful coffee date experiences."
            icon="search"
            isSelected={selectedRole === 'guest'}
            onSelect={() => handleSelectRole('guest')}
          />
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={18} color={theme.primary} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            {selectedRole === 'host'
              ? 'As a Host, you receive 75% of each date payment. Set your availability and connect with guests.'
              : selectedRole === 'guest'
              ? 'As a Guest, you pay for coffee dates. Browse hosts, match, and plan dates at nearby cafes.'
              : 'Select a role to learn more about how it works.'}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: selectedRole ? theme.primary : theme.backgroundTertiary,
              opacity: pressed && selectedRole ? 0.8 : 1,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <ThemedText
            style={[
              styles.buttonText,
              { color: selectedRole ? theme.buttonText : theme.textSecondary },
            ]}
          >
            Continue
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

function RoleCard({
  role,
  title,
  description,
  icon,
  isSelected,
  onSelect,
}: {
  role: UserRole;
  title: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.roleCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor: isSelected ? theme.primary : theme.border,
          borderWidth: isSelected ? 2 : 1,
          opacity: pressed ? 0.9 : 1,
        },
        Shadows.small,
      ]}
      onPress={onSelect}
    >
      <View style={[styles.roleIcon, { backgroundColor: isSelected ? theme.primary : theme.secondary }]}>
        <Feather name={icon as any} size={28} color={isSelected ? theme.buttonText : theme.primary} />
      </View>
      <View style={styles.roleContent}>
        <ThemedText style={styles.roleTitle}>{title}</ThemedText>
        <ThemedText style={[styles.roleDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
      <View style={[styles.radioOuter, { borderColor: isSelected ? theme.primary : theme.border }]}>
        {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing['2xl'],
  },
  options: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    ...Typography.h4,
    marginBottom: 4,
  },
  roleDescription: {
    ...Typography.small,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(111, 78, 55, 0.08)',
  },
  infoText: {
    flex: 1,
    ...Typography.small,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
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
