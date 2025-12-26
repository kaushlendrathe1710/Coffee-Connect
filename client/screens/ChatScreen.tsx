import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform, TextInput, FlatList, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/query-client';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Message {
  id: string;
  content: string;
  senderId: string;
  read: boolean;
  createdAt: string;
}

const ICE_BREAKERS = [
  "What's your go-to coffee order?",
  "Best cafe you've ever been to?",
  "Morning coffee or afternoon pick-me-up?",
  "Do you prefer cozy cafes or modern ones?",
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const { matchId, matchName, matchPhoto } = route.params;
  const [inputText, setInputText] = useState('');
  const [showIceBreakers, setShowIceBreakers] = useState(true);

  // Fetch messages
  const { data: messagesData, isLoading, refetch } = useQuery<{ messages: Message[] }>({
    queryKey: ['/api/messages', matchId, `?userId=${user?.id}`],
    enabled: !!matchId && !!user?.id,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  const messages = messagesData?.messages || [];

  // Hide ice breakers after first few messages
  useEffect(() => {
    if (messages.length >= 3) {
      setShowIceBreakers(false);
    }
  }, [messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', '/api/messages', {
        matchId,
        senderId: user?.id,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      // Refetch messages
      refetch();
      // Invalidate matches to update last message
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
    },
  });

  const handleSend = useCallback(() => {
    if (!inputText.trim() || sendMessageMutation.isPending) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    sendMessageMutation.mutate(inputText.trim());
    setInputText('');
    setShowIceBreakers(false);
  }, [inputText, sendMessageMutation]);

  const handleIceBreaker = (text: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInputText(text);
    setShowIceBreakers(false);
  };

  const handlePlanDate = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('DatePlanning', { matchId, matchName, matchPhoto });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        {!isMe ? (
          <Image source={{ uri: matchPhoto }} style={styles.messageAvatar} contentFit="cover" />
        ) : null}
        <View
          style={[
            styles.messageBubble,
            isMe
              ? { backgroundColor: theme.primary }
              : { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ThemedText
            style={[styles.messageText, { color: isMe ? theme.buttonText : theme.text }]}
          >
            {item.content}
          </ThemedText>
          <ThemedText
            style={[
              styles.messageTime,
              { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
            ]}
          >
            {formatTime(item.createdAt)}
          </ThemedText>
        </View>
      </View>
    );
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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {messages.length >= 3 ? (
          <Pressable
            style={({ pressed }) => [
              styles.planDateBanner,
              { backgroundColor: theme.secondary, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handlePlanDate}
          >
            <Feather name="calendar" size={18} color={theme.primary} />
            <ThemedText style={[styles.planDateText, { color: theme.primary }]}>
              Plan a coffee date
            </ThemedText>
            <Feather name="chevron-right" size={18} color={theme.primary} />
          </Pressable>
        ) : null}

        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Image source={{ uri: matchPhoto }} style={styles.emptyChatPhoto} contentFit="cover" />
            <ThemedText style={styles.emptyChatTitle}>
              You matched with {matchName}!
            </ThemedText>
            <ThemedText style={[styles.emptyChatSubtitle, { color: theme.textSecondary }]}>
              Send a message to start the conversation
            </ThemedText>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              { paddingBottom: showIceBreakers ? 80 : Spacing.md },
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {showIceBreakers && messages.length < 3 ? (
          <View style={styles.iceBreakersContainer}>
            <ThemedText style={[styles.iceBreakersTitle, { color: theme.textSecondary }]}>
              Ice breakers
            </ThemedText>
            <FlatList
              data={ICE_BREAKERS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.iceBreaker,
                    { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => handleIceBreaker(item)}
                >
                  <ThemedText style={styles.iceBreakerText}>{item}</ThemedText>
                </Pressable>
              )}
              contentContainerStyle={styles.iceBreakersList}
            />
          </View>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.backgroundRoot, paddingBottom: insets.bottom + Spacing.sm },
          ]}
        >
          <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? theme.primary : theme.backgroundSecondary,
                opacity: pressed && inputText.trim() ? 0.8 : 1,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color={theme.buttonText} />
            ) : (
              <Feather
                name="send"
                size={20}
                color={inputText.trim() ? theme.buttonText : theme.textSecondary}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginHorizontal: Spacing.screenPadding,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  planDateText: {
    ...Typography.body,
    fontWeight: '600',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  emptyChatPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.lg,
  },
  emptyChatTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyChatSubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    maxWidth: '100%',
  },
  messageText: {
    ...Typography.body,
  },
  messageTime: {
    ...Typography.caption,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  iceBreakersContainer: {
    paddingVertical: Spacing.sm,
  },
  iceBreakersTitle: {
    ...Typography.caption,
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.sm,
  },
  iceBreakersList: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  iceBreaker: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  iceBreakerText: {
    ...Typography.small,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  input: {
    ...Typography.body,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
