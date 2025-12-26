import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { apiRequest } from '@/lib/query-client';

const DISTANCE_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: 'Any', value: 999 },
];

const AGE_MIN_OPTIONS = [18, 21, 25, 30, 35, 40];
const AGE_MAX_OPTIONS = [25, 30, 35, 40, 50, 99];

interface Filters {
  minAge: number;
  maxAge: number;
  maxDistance: number;
  interests: string[];
  availabilityDays: string[];
}

const DEFAULT_FILTERS: Filters = {
  minAge: 18,
  maxAge: 99,
  maxDistance: 50,
  interests: [],
  availabilityDays: [],
};

export default function FiltersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [minAge, setMinAge] = useState(DEFAULT_FILTERS.minAge);
  const [maxAge, setMaxAge] = useState(DEFAULT_FILTERS.maxAge);
  const [maxDistance, setMaxDistance] = useState(DEFAULT_FILTERS.maxDistance);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const { data: filtersData, isLoading } = useQuery<{ filters: Filters }>({
    queryKey: ['/api/filters', user?.id],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (filtersData?.filters) {
      setMinAge(filtersData.filters.minAge || DEFAULT_FILTERS.minAge);
      setMaxAge(filtersData.filters.maxAge || DEFAULT_FILTERS.maxAge);
      setMaxDistance(filtersData.filters.maxDistance || DEFAULT_FILTERS.maxDistance);
    }
  }, [filtersData]);

  const saveMutation = useMutation({
    mutationFn: async (filters: Partial<Filters>) => {
      const res = await apiRequest('POST', `/api/filters/${user?.id}`, filters);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/discover'] });
    },
  });

  const handleApply = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    saveMutation.mutate({
      minAge,
      maxAge,
      maxDistance,
    });
    navigation.goBack();
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMinAge(DEFAULT_FILTERS.minAge);
    setMaxAge(DEFAULT_FILTERS.maxAge);
    setMaxDistance(DEFAULT_FILTERS.maxDistance);
    setShowVerifiedOnly(false);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Maximum Distance</ThemedText>
          <View style={styles.optionsRow}>
            {DISTANCE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: maxDistance === option.value ? theme.primary : theme.backgroundSecondary,
                    borderColor: maxDistance === option.value ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setMaxDistance(option.value);
                }}
              >
                <ThemedText
                  style={[
                    styles.optionText,
                    { color: maxDistance === option.value ? theme.buttonText : theme.text },
                  ]}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Minimum Age</ThemedText>
          <View style={styles.optionsRow}>
            {AGE_MIN_OPTIONS.map((age) => (
              <Pressable
                key={age}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: minAge === age ? theme.primary : theme.backgroundSecondary,
                    borderColor: minAge === age ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setMinAge(age);
                  if (maxAge < age) {
                    setMaxAge(age);
                  }
                }}
              >
                <ThemedText
                  style={[
                    styles.optionText,
                    { color: minAge === age ? theme.buttonText : theme.text },
                  ]}
                >
                  {age}+
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Maximum Age</ThemedText>
          <View style={styles.optionsRow}>
            {AGE_MAX_OPTIONS.map((age) => (
              <Pressable
                key={age}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: maxAge === age ? theme.primary : theme.backgroundSecondary,
                    borderColor: maxAge === age ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setMaxAge(age);
                  if (minAge > age) {
                    setMinAge(age);
                  }
                }}
              >
                <ThemedText
                  style={[
                    styles.optionText,
                    { color: maxAge === age ? theme.buttonText : theme.text },
                  ]}
                >
                  {age === 99 ? 'Any' : `${age}`}
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
              {showVerifiedOnly ? <Feather name="check" size={16} color={theme.buttonText} /> : null}
            </View>
          </Pressable>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.summaryTitle, { color: theme.textSecondary }]}>
            Current Filters
          </ThemedText>
          <ThemedText style={styles.summaryText}>
            Age: {minAge} - {maxAge === 99 ? 'Any' : maxAge}
          </ThemedText>
          <ThemedText style={styles.summaryText}>
            Distance: {maxDistance === 999 ? 'Any' : `Up to ${maxDistance} km`}
          </ThemedText>
          {showVerifiedOnly ? (
            <ThemedText style={styles.summaryText}>Verified profiles only</ThemedText>
          ) : null}
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
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color={theme.buttonText} />
          ) : (
            <ThemedText style={[styles.applyButtonText, { color: theme.buttonText }]}>
              Apply Filters
            </ThemedText>
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  summaryTitle: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryText: {
    ...Typography.body,
    marginBottom: 4,
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
