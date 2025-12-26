import React from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AnimatedEmptyState } from '@/components/AnimatedEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CoffeeDateData {
  id: string;
  matchId: string;
  scheduledDate: string;
  cafeName: string | null;
  cafeAddress: string | null;
  cafeLocation: { latitude: number; longitude: number } | null;
  status: 'proposed' | 'accepted' | 'declined' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentAmount: number | null;
  notes: string | null;
  proposedBy: string;
  host: { id: string; name: string; photos: string[] } | null;
  guest: { id: string; name: string; photos: string[] } | null;
  createdAt: string;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();

  const { data, isLoading, refetch, isRefetching } = useQuery<{ dates: CoffeeDateData[] }>({
    queryKey: ['/api/coffee-dates', user?.id],
    enabled: !!user?.id,
  });

  const dates = data?.dates || [];

  const upcomingDates = dates.filter(
    (d) => d.status === 'proposed' || d.status === 'accepted' || d.status === 'confirmed'
  );
  const pastDates = dates.filter((d) => d.status === 'completed' || d.status === 'cancelled' || d.status === 'declined');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: CoffeeDateData['status']) => {
    switch (status) {
      case 'confirmed':
        return theme.success;
      case 'proposed':
      case 'accepted':
        return theme.warning;
      case 'completed':
        return theme.textSecondary;
      case 'cancelled':
      case 'declined':
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: CoffeeDateData['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'proposed':
        return 'Pending Response';
      case 'accepted':
        return 'Accepted';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'declined':
        return 'Declined';
      default:
        return status;
    }
  };

  const handleDatePress = (date: CoffeeDateData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const otherUser = user?.role === 'host' ? date.guest : date.host;
    if (otherUser) {
      navigation.navigate('Chat', {
        matchId: date.matchId,
        matchName: otherUser.name,
        matchPhoto: otherUser.photos?.[0] || '',
      });
    }
  };

  const getOtherUser = (date: CoffeeDateData) => {
    return user?.role === 'host' ? date.guest : date.host;
  };

  const renderDateCard = (date: CoffeeDateData) => {
    const otherUser = getOtherUser(date);
    if (!otherUser) return null;
    
    return (
      <Pressable
        key={date.id}
        style={({ pressed }) => [
          styles.dateCard,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
          Shadows.small,
        ]}
        onPress={() => handleDatePress(date)}
      >
        <Image 
          source={{ uri: otherUser.photos?.[0] || 'https://via.placeholder.com/56' }} 
          style={styles.dateImage} 
          contentFit="cover" 
        />
        <View style={styles.dateContent}>
          <View style={styles.dateHeader}>
            <ThemedText style={styles.dateName}>{otherUser.name}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(date.status) + '20' }]}>
              <ThemedText style={[styles.statusText, { color: getStatusColor(date.status) }]}>
                {getStatusLabel(date.status)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.dateDetails}>
            <View style={styles.dateDetail}>
              <Feather name="calendar" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.dateDetailText, { color: theme.textSecondary }]}>
                {formatDate(date.scheduledDate)}
              </ThemedText>
            </View>
            <View style={styles.dateDetail}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.dateDetailText, { color: theme.textSecondary }]}>
                {formatTime(date.scheduledDate)}
              </ThemedText>
            </View>
          </View>
          {date.cafeName ? (
            <View style={styles.cafeInfo}>
              <Feather name="map-pin" size={14} color={theme.primary} />
              <ThemedText style={styles.cafeName} numberOfLines={1}>
                {date.cafeName}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.cafeInfo}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.cafeName, { color: theme.textSecondary }]} numberOfLines={1}>
                Cafe to be decided
              </ThemedText>
            </View>
          )}
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
          <ThemedText style={styles.headerTitle}>My Dates</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  if (dates.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
          <ThemedText style={styles.headerTitle}>My Dates</ThemedText>
        </View>
        <View style={styles.emptyState}>
          <AnimatedEmptyState
            icon="calendar"
            title="No dates scheduled"
            subtitle="Match with someone and plan your first coffee date!"
            action={
              <Pressable
                style={[styles.discoverButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('Main', { screen: 'DiscoverTab' })}
              >
                <Feather name="search" size={20} color="#FFFFFF" />
                <ThemedText style={styles.discoverButtonText}>Find Matches</ThemedText>
              </Pressable>
            }
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText style={styles.headerTitle}>My Dates</ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      >
        {upcomingDates.length > 0 ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Upcoming</ThemedText>
            {upcomingDates.map(renderDateCard)}
          </View>
        ) : null}

        {pastDates.length > 0 ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Past Dates</ThemedText>
            {pastDates.map(renderDateCard)}
          </View>
        ) : null}

        {upcomingDates.length === 0 && pastDates.length === 0 ? (
          <View style={styles.noUpcoming}>
            <Feather name="coffee" size={32} color={theme.textSecondary} />
            <ThemedText style={[styles.noUpcomingText, { color: theme.textSecondary }]}>
              No upcoming dates. Start a conversation with a match to plan one!
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>
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
  },
  headerTitle: {
    ...Typography.h2,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  dateImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  dateContent: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dateName: {
    ...Typography.body,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  dateDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  dateDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateDetailText: {
    ...Typography.caption,
  },
  cafeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cafeName: {
    ...Typography.small,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  discoverButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noUpcoming: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  noUpcomingText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
