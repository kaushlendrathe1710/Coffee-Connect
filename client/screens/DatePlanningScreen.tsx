import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList, CafeData } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatePlanning'>;
type DatePlanningRouteProp = RouteProp<RootStackParamList, 'DatePlanning'>;

const DATES = ['Today', 'Tomorrow', 'This Weekend'];
const TIMES = ['Morning (9-11am)', 'Lunch (12-2pm)', 'Afternoon (3-5pm)', 'Evening (6-8pm)'];

export default function DatePlanningScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DatePlanningRouteProp>();
  const { theme } = useTheme();

  const { matchId, matchName } = route.params;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<CafeData | null>(null);
  const [notes, setNotes] = useState('');

  const handleSelectCafe = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('CafeMap', {
      onSelectCafe: (cafe: CafeData) => {
        setSelectedCafe(cafe);
      },
    });
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime || !selectedCafe) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // In real app, save the date to backend
    navigation.goBack();
  };

  const isValid = selectedDate && selectedTime && selectedCafe;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.sectionTitle}>When would you like to meet?</ThemedText>
        <View style={styles.optionsGrid}>
          {DATES.map((date) => (
            <Pressable
              key={date}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selectedDate === date ? theme.primary : theme.backgroundSecondary,
                  borderColor: selectedDate === date ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedDate(date);
              }}
            >
              <ThemedText
                style={[
                  styles.optionText,
                  { color: selectedDate === date ? theme.buttonText : theme.text },
                ]}
              >
                {date}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>What time works best?</ThemedText>
        <View style={styles.optionsGrid}>
          {TIMES.map((time) => (
            <Pressable
              key={time}
              style={({ pressed }) => [
                styles.option,
                styles.timeOption,
                {
                  backgroundColor: selectedTime === time ? theme.primary : theme.backgroundSecondary,
                  borderColor: selectedTime === time ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedTime(time);
              }}
            >
              <ThemedText
                style={[
                  styles.optionText,
                  { color: selectedTime === time ? theme.buttonText : theme.text },
                ]}
              >
                {time}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>Choose a cafe</ThemedText>
        {selectedCafe ? (
          <Pressable
            style={({ pressed }) => [
              styles.cafeCard,
              { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
              Shadows.small,
            ]}
            onPress={handleSelectCafe}
          >
            <View style={[styles.cafeIcon, { backgroundColor: theme.secondary }]}>
              <Feather name="coffee" size={24} color={theme.primary} />
            </View>
            <View style={styles.cafeInfo}>
              <ThemedText style={styles.cafeName}>{selectedCafe.name}</ThemedText>
              <View style={styles.cafeDetails}>
                <Feather name="map-pin" size={12} color={theme.textSecondary} />
                <ThemedText style={[styles.cafeAddress, { color: theme.textSecondary }]}>
                  {selectedCafe.address}
                </ThemedText>
              </View>
              {selectedCafe.rating && (
                <View style={styles.cafeRating}>
                  <Feather name="star" size={12} color={theme.warning} />
                  <ThemedText style={styles.ratingText}>{selectedCafe.rating}</ThemedText>
                </View>
              )}
            </View>
            <Feather name="edit-2" size={18} color={theme.textSecondary} />
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.selectCafeButton,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleSelectCafe}
          >
            <Feather name="map-pin" size={24} color={theme.primary} />
            <ThemedText style={[styles.selectCafeText, { color: theme.primary }]}>
              Browse nearby cafes
            </ThemedText>
          </Pressable>
        )}

        <ThemedText style={styles.sectionTitle}>Any special requests?</ThemedText>
        <TextInput
          style={[
            styles.notesInput,
            { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g., I'd like a quiet corner..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.backgroundRoot, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.confirmButton,
            {
              backgroundColor: isValid ? theme.primary : theme.backgroundTertiary,
              opacity: pressed && isValid ? 0.8 : 1,
            },
          ]}
          onPress={handleConfirm}
          disabled={!isValid}
        >
          <Feather
            name="check"
            size={20}
            color={isValid ? theme.buttonText : theme.textSecondary}
          />
          <ThemedText
            style={[
              styles.confirmButtonText,
              { color: isValid ? theme.buttonText : theme.textSecondary },
            ]}
          >
            Send Date Request
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
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  optionsGrid: {
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
  timeOption: {
    width: '48%',
    alignItems: 'center',
  },
  optionText: {
    ...Typography.body,
    fontWeight: '500',
  },
  selectCafeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 80,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  selectCafeText: {
    ...Typography.body,
    fontWeight: '600',
  },
  cafeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  cafeIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cafeInfo: {
    flex: 1,
  },
  cafeName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  cafeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  cafeAddress: {
    ...Typography.small,
  },
  cafeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...Typography.small,
    fontWeight: '600',
  },
  notesInput: {
    height: 80,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderWidth: 1,
    ...Typography.body,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
  },
  confirmButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
