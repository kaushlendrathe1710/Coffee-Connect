import React from 'react';
import { View, StyleSheet, Pressable, Platform, FlatList, ActivityIndicator } from 'react-native';
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
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MatchData {
  id: string;
  matchedAt: string;
  otherUser: {
    id: string;
    name: string;
    photos: string[];
    bio: string;
    coffeePreferences: string[];
  } | null;
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();

  const { data: matchesData, isLoading, refetch } = useQuery<{ matches: MatchData[] }>({
    queryKey: ['/api/matches', user?.id],
    enabled: !!user?.id,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const matches = matchesData?.matches || [];

  const handleMatchPress = (match: MatchData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (match.otherUser) {
      navigation.navigate('Chat', {
        matchId: match.id,
        matchName: match.otherUser.name,
        matchPhoto: match.otherUser.photos?.[0] || '',
      });
    }
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

  const renderNewMatch = ({ item }: { item: MatchData }) => {
    if (!item.otherUser) return null;
    
    return (
      <Pressable
        style={({ pressed }) => [styles.newMatchItem, { opacity: pressed ? 0.8 : 1 }]}
        onPress={() => handleMatchPress(item)}
      >
        <View style={[styles.newMatchImageContainer, Shadows.small]}>
          <Image 
            source={{ uri: item.otherUser.photos?.[0] || 'https://via.placeholder.com/72' }} 
            style={styles.newMatchImage} 
            contentFit="cover" 
          />
        </View>
        <ThemedText style={styles.newMatchName} numberOfLines={1}>
          {item.otherUser.name}
        </ThemedText>
      </Pressable>
    );
  };

  const renderConversation = ({ item }: { item: MatchData }) => {
    if (!item.otherUser) return null;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.conversationItem,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
          Shadows.small,
        ]}
        onPress={() => handleMatchPress(item)}
      >
        <View style={styles.conversationImageContainer}>
          <Image 
            source={{ uri: item.otherUser.photos?.[0] || 'https://via.placeholder.com/56' }} 
            style={styles.conversationImage} 
            contentFit="cover" 
          />
          {item.unreadCount > 0 ? (
            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
              <ThemedText style={[styles.unreadText, { color: theme.buttonText }]}>
                {item.unreadCount}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <ThemedText style={styles.conversationName}>{item.otherUser.name}</ThemedText>
            {item.lastMessage?.createdAt ? (
              <ThemedText style={[styles.conversationTime, { color: theme.textSecondary }]}>
                {formatTime(item.lastMessage.createdAt)}
              </ThemedText>
            ) : null}
          </View>
          <ThemedText
            style={[
              styles.conversationMessage,
              { color: item.unreadCount > 0 ? theme.text : theme.textSecondary },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage?.senderId === user?.id ? 'You: ' : ''}{item.lastMessage?.content}
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
          <ThemedText style={styles.headerTitle}>Matches</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  if (matches.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
          <ThemedText style={styles.headerTitle}>Matches</ThemedText>
        </View>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="heart" size={64} color={theme.primary} />
          </View>
          <ThemedText style={styles.emptyTitle}>No matches yet</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Keep swiping to find your perfect coffee match!
          </ThemedText>
          <Pressable
            style={[styles.discoverButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Main', { screen: 'DiscoverTab' })}
          >
            <Feather name="search" size={20} color="#FFFFFF" />
            <ThemedText style={styles.discoverButtonText}>Start Discovering</ThemedText>
          </Pressable>
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
            {newMatches.length > 0 ? (
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
            ) : null}

            {conversations.length > 0 ? (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Messages</ThemedText>
                {conversations.map((item) => (
                  <View key={item.id}>{renderConversation({ item })}</View>
                ))}
              </View>
            ) : null}

            {newMatches.length > 0 && conversations.length === 0 ? (
              <View style={styles.tipContainer}>
                <Feather name="message-circle" size={24} color={theme.textSecondary} />
                <ThemedText style={[styles.tipText, { color: theme.textSecondary }]}>
                  Tap on a match to start chatting!
                </ThemedText>
              </View>
            ) : null}
          </>
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
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
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  discoverButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  tipText: {
    ...Typography.body,
  },
});
