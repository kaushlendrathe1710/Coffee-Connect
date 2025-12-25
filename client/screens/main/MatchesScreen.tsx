import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList, MatchData } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MOCK_MATCHES: MatchData[] = [
  {
    id: '1',
    userId: 'user1',
    name: 'Sarah',
    age: 28,
    bio: 'Coffee addict and book lover.',
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'],
    coffeePreferences: ['Latte'],
    interests: ['Reading', 'Travel'],
    distance: 2.3,
    matchedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    lastMessage: 'Hey! How are you?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: 2,
  },
  {
    id: '2',
    userId: 'user2',
    name: 'Michael',
    age: 32,
    bio: 'Entrepreneur and coffee enthusiast.',
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'],
    coffeePreferences: ['Espresso'],
    interests: ['Tech', 'Fitness'],
    distance: 1.5,
    matchedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 0,
  },
  {
    id: '3',
    userId: 'user3',
    name: 'Emma',
    age: 26,
    bio: 'Photographer and matcha lover.',
    photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'],
    coffeePreferences: ['Matcha'],
    interests: ['Photography', 'Art'],
    distance: 3.8,
    matchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    lastMessage: 'Would love to grab coffee sometime!',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    unreadCount: 0,
  },
];

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [matches] = useState<MatchData[]>(MOCK_MATCHES);

  const handleMatchPress = (match: MatchData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('Chat', {
      matchId: match.id,
      matchName: match.name,
      matchPhoto: match.photos[0],
    });
  };

  const newMatches = matches.filter((m) => !m.lastMessage);
  const conversations = matches.filter((m) => m.lastMessage);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const renderNewMatch = ({ item }: { item: MatchData }) => (
    <Pressable
      style={({ pressed }) => [styles.newMatchItem, { opacity: pressed ? 0.8 : 1 }]}
      onPress={() => handleMatchPress(item)}
    >
      <View style={[styles.newMatchImageContainer, Shadows.small]}>
        <Image source={{ uri: item.photos[0] }} style={styles.newMatchImage} contentFit="cover" />
      </View>
      <ThemedText style={styles.newMatchName} numberOfLines={1}>
        {item.name}
      </ThemedText>
    </Pressable>
  );

  const renderConversation = ({ item }: { item: MatchData }) => (
    <Pressable
      style={({ pressed }) => [
        styles.conversationItem,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
        Shadows.small,
      ]}
      onPress={() => handleMatchPress(item)}
    >
      <View style={styles.conversationImageContainer}>
        <Image source={{ uri: item.photos[0] }} style={styles.conversationImage} contentFit="cover" />
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
            <ThemedText style={[styles.unreadText, { color: theme.buttonText }]}>
              {item.unreadCount}
            </ThemedText>
          </View>
        )}
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <ThemedText style={styles.conversationName}>{item.name}</ThemedText>
          {item.lastMessageAt && (
            <ThemedText style={[styles.conversationTime, { color: theme.textSecondary }]}>
              {formatTime(item.lastMessageAt)}
            </ThemedText>
          )}
        </View>
        <ThemedText
          style={[
            styles.conversationMessage,
            { color: item.unreadCount > 0 ? theme.text : theme.textSecondary },
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  if (matches.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: insets.top + Spacing['5xl'] }]}>
          <Image
            source={require('@assets/images/empty-matches.png')}
            style={styles.emptyImage}
            contentFit="contain"
          />
          <ThemedText style={styles.emptyTitle}>No matches yet</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Keep swiping to find your coffee match!
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText style={styles.headerTitle}>Matches</ThemedText>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {newMatches.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>New Matches</ThemedText>
                <FlatList
                  data={newMatches}
                  renderItem={renderNewMatch}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.newMatchesList}
                />
              </View>
            )}

            {conversations.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Messages</ThemedText>
                {conversations.map((item) => (
                  <View key={item.id}>{renderConversation({ item })}</View>
                ))}
              </View>
            )}
          </>
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      />
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  newMatchesList: {
    gap: Spacing.md,
  },
  newMatchItem: {
    alignItems: 'center',
    width: 80,
  },
  newMatchImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  newMatchImage: {
    width: '100%',
    height: '100%',
  },
  newMatchName: {
    ...Typography.small,
    fontWeight: '500',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  conversationImageContainer: {
    position: 'relative',
  },
  conversationImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: {
    ...Typography.body,
    fontWeight: '600',
  },
  conversationTime: {
    ...Typography.caption,
  },
  conversationMessage: {
    ...Typography.small,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
});
