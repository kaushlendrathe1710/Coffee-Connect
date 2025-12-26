import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList, CafeData } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/query-client';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatePlanning'>;
type DatePlanningRouteProp = RouteProp<RootStackParamList, 'DatePlanning'>;

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
];

export default function DatePlanningScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DatePlanningRouteProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { matchId, matchName, matchPhoto, selectedCafe: routeCafe, selectedDateISO, selectedTime: routeTime, notes: routeNotes } = route.params;

  const [selectedDate, setSelectedDate] = useState<Date | null>(selectedDateISO ? new Date(selectedDateISO) : null);
  const [selectedTime, setSelectedTime] = useState<string | null>(routeTime || null);
  const [selectedCafe, setSelectedCafe] = useState<CafeData | null>(routeCafe || null);
  const [notes, setNotes] = useState(routeNotes || '');

  const proposeDateMutation = useMutation({
    mutationFn: async (data: {
      matchId: string;
      proposedBy: string;
      scheduledDate: string;
      cafeName?: string;
      cafeAddress?: string;
      cafeLatitude?: string;
      cafeLongitude?: string;
      notes?: string;
    }) => {
      return apiRequest('POST', '/api/coffee-dates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coffee-dates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', matchId] });
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Date Proposed!',
        `Your coffee date proposal has been sent to ${matchName}. They'll be notified to accept or suggest a different time.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to propose date. Please try again.');
      console.error('Propose date error:', error);
    },
  });

  const generateNextDays = () => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const nextDays = generateNextDays();

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDayNumber = (date: Date) => {
    return date.getDate().toString();
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const isSameDay = (date1: Date | null, date2: Date) => {
    if (!date1) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const handleSelectCafe = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('CafeMap', {
      returnTo: 'DatePlanning',
      matchId,
      matchName,
      matchPhoto,
      selectedDateISO: selectedDate?.toISOString(),
      selectedTime: selectedTime || undefined,
      notes: notes || undefined,
    });
  };

  const handlePropose = () => {
    if (!selectedDate || !selectedTime || !user?.id) {
      Alert.alert('Missing Information', 'Please select a date and time for your coffee date.');
      return;
    }

    const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(hours, minutes, 0, 0);

    proposeDateMutation.mutate({
      matchId,
      proposedBy: user.id,
      scheduledDate: scheduledDate.toISOString(),
      cafeName: selectedCafe?.name || undefined,
      cafeAddress: selectedCafe?.address || undefined,
      cafeLatitude: selectedCafe?.latitude?.toString() || undefined,
      cafeLongitude: selectedCafe?.longitude?.toString() || undefined,
      notes: notes || undefined,
    });
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const isValid = selectedDate && selectedTime;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Plan a Date</ThemedText>
        <View style={styles.closeButton} />
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.matchInfo}>
          <Image
            source={{ uri: matchPhoto || 'https://via.placeholder.com/64' }}
            style={styles.matchImage}
            contentFit="cover"
          />
          <ThemedText style={styles.matchName}>Coffee date with {matchName}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select a Day</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysContainer}
          >
            {nextDays.map((date, index) => (
              <Pressable
                key={index}
                style={[
                  styles.dayCard,
                  { 
                    backgroundColor: isSameDay(selectedDate, date) ? theme.primary : theme.cardBackground,
                    borderColor: isSameDay(selectedDate, date) ? theme.primary : theme.border,
                  },
                  Shadows.small,
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
                    styles.dayName, 
                    { color: isSameDay(selectedDate, date) ? '#FFFFFF' : theme.textSecondary }
                  ]}
                >
                  {formatDayName(date)}
                </ThemedText>
                <ThemedText 
                  style={[
                    styles.dayNumber, 
                    { color: isSameDay(selectedDate, date) ? '#FFFFFF' : theme.text }
                  ]}
                >
                  {formatDayNumber(date)}
                </ThemedText>
                <ThemedText 
                  style={[
                    styles.monthName, 
                    { color: isSameDay(selectedDate, date) ? '#FFFFFF' : theme.textSecondary }
                  ]}
                >
                  {formatMonth(date)}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select a Time</ThemedText>
          <View style={styles.timeSlotsGrid}>
            {TIME_SLOTS.map((time) => (
              <Pressable
                key={time}
                style={[
                  styles.timeSlot,
                  { 
                    backgroundColor: selectedTime === time ? theme.primary : theme.cardBackground,
                    borderColor: selectedTime === time ? theme.primary : theme.border,
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
                    styles.timeText, 
                    { color: selectedTime === time ? '#FFFFFF' : theme.text }
                  ]}
                >
                  {time}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Choose a cafe (Optional)</ThemedText>
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
                {selectedCafe.rating ? (
                  <View style={styles.cafeRating}>
                    <Feather name="star" size={12} color={theme.warning} />
                    <ThemedText style={styles.ratingText}>{selectedCafe.rating}</ThemedText>
                  </View>
                ) : null}
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
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Add a Note (Optional)</ThemedText>
          <View style={[styles.notesContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <TextInput
              style={[styles.notesInput, { color: theme.text }]}
              placeholder="Looking forward to meeting you..."
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>

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
              opacity: (pressed && isValid) || proposeDateMutation.isPending ? 0.8 : 1,
            },
          ]}
          onPress={handlePropose}
          disabled={!isValid || proposeDateMutation.isPending}
        >
          <Feather
            name="send"
            size={20}
            color={isValid ? '#FFFFFF' : theme.textSecondary}
          />
          <ThemedText
            style={[
              styles.confirmButtonText,
              { color: isValid ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            {proposeDateMutation.isPending ? 'Sending...' : 'Propose Date'}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h3,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
  },
  matchInfo: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  matchImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
  },
  matchName: {
    ...Typography.h4,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  daysContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dayCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 70,
  },
  dayName: {
    ...Typography.caption,
    fontWeight: '500',
    marginBottom: 2,
  },
  dayNumber: {
    ...Typography.h3,
    fontWeight: '700',
  },
  monthName: {
    ...Typography.caption,
    marginTop: 2,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  timeText: {
    ...Typography.small,
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
  notesContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  notesInput: {
    ...Typography.body,
    minHeight: 80,
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
