import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';

const DISTANCE_OPTIONS = ['5 km', '10 km', '25 km', '50 km', 'Any'];
const AGE_RANGES = ['18-25', '25-35', '35-45', '45+', 'Any'];

export default function FiltersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [distance, setDistance] = useState('25 km');
  const [ageRange, setAgeRange] = useState('Any');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const handleApply = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.goBack();
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDistance('25 km');
    setAgeRange('Any');
    setShowVerifiedOnly(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Distance</ThemedText>
          <View style={styles.optionsRow}>
            {DISTANCE_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: distance === option ? theme.primary : theme.backgroundSecondary,
                    borderColor: distance === option ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setDistance(option);
                }}
              >
                <ThemedText
                  style={[
                    styles.optionText,
                    { color: distance === option ? theme.buttonText : theme.text },
                  ]}
                >
                  {option}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Age Range</ThemedText>
          <View style={styles.optionsRow}>
            {AGE_RANGES.map((option) => (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: ageRange === option ? theme.primary : theme.backgroundSecondary,
                    borderColor: ageRange === option ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setAgeRange(option);
                }}
              >
                <ThemedText
                  style={[
                    styles.optionText,
                    { color: ageRange === option ? theme.buttonText : theme.text },
                  ]}
                >
                  {option}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.toggleRow,
              { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setShowVerifiedOnly(!showVerifiedOnly);
            }}
          >
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, { backgroundColor: theme.secondary }]}>
                <Feather name="check-circle" size={20} color={theme.primary} />
              </View>
              <View>
                <ThemedText style={styles.toggleLabel}>Verified Only</ThemedText>
                <ThemedText style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                  Only show verified profiles
                </ThemedText>
              </View>
            </View>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: showVerifiedOnly ? theme.primary : 'transparent',
                  borderColor: showVerifiedOnly ? theme.primary : theme.border,
                },
              ]}
            >
              {showVerifiedOnly && <Feather name="check" size={16} color={theme.buttonText} />}
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.backgroundRoot, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.resetButton,
            { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleReset}
        >
          <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.applyButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleApply}
        >
          <ThemedText style={[styles.applyButtonText, { color: theme.buttonText }]}>
            Apply Filters
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
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  option: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  optionText: {
    ...Typography.body,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleLabel: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleDescription: {
    ...Typography.small,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  resetButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
