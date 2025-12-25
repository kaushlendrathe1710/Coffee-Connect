import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { AuthStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'AvailabilitySetup'>;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];

interface AvailabilitySlot {
  day: string;
  time: string;
}

export default function AvailabilitySetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

  const toggleSlot = (day: string, time: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const exists = availability.find((slot) => slot.day === day && slot.time === time);
    if (exists) {
      setAvailability((prev) => prev.filter((slot) => !(slot.day === day && slot.time === time)));
    } else {
      setAvailability((prev) => [...prev, { day, time }]);
    }
  };

  const isSelected = (day: string, time: string) => {
    return availability.some((slot) => slot.day === day && slot.time === time);
  };

  const handleContinue = () => {
    if (availability.length === 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('TermsConsent');
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
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: '85%' }]} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.title}>When are you available?</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Let guests know when you're free for coffee dates.
        </ThemedText>

        <View style={styles.timeHeader}>
          <View style={styles.dayColumn} />
          {TIME_SLOTS.map((time) => (
            <View key={time} style={styles.timeColumn}>
              <ThemedText style={[styles.timeLabel, { color: theme.textSecondary }]}>
                {time}
              </ThemedText>
            </View>
          ))}
        </View>

        {DAYS.map((day) => (
          <View key={day} style={styles.dayRow}>
            <View style={styles.dayColumn}>
              <ThemedText style={styles.dayLabel}>{day.slice(0, 3)}</ThemedText>
            </View>
            {TIME_SLOTS.map((time) => (
              <View key={`${day}-${time}`} style={styles.timeColumn}>
                <Pressable
                  style={({ pressed }) => [
                    styles.slot,
                    {
                      backgroundColor: isSelected(day, time) ? theme.primary : theme.backgroundSecondary,
                      borderColor: isSelected(day, time) ? theme.primary : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => toggleSlot(day, time)}
                >
                  {isSelected(day, time) && (
                    <Feather name="check" size={18} color={theme.buttonText} />
                  )}
                </Pressable>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl, backgroundColor: theme.backgroundRoot }]}>
        <ThemedText style={[styles.selectedCount, { color: theme.textSecondary }]}>
          {availability.length} time slots selected
        </ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: availability.length > 0 ? theme.primary : theme.backgroundTertiary,
              opacity: pressed && availability.length > 0 ? 0.8 : 1,
            },
          ]}
          onPress={handleContinue}
          disabled={availability.length === 0}
        >
          <ThemedText
            style={[
              styles.buttonText,
              { color: availability.length > 0 ? theme.buttonText : theme.textSecondary },
            ]}
          >
            Continue
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
  timeHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  dayColumn: {
    width: 50,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    ...Typography.caption,
    fontWeight: '500',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dayLabel: {
    ...Typography.small,
    fontWeight: '600',
  },
  slot: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  selectedCount: {
    ...Typography.small,
    textAlign: 'center',
    marginBottom: Spacing.sm,
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
