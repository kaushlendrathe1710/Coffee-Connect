import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, TextInput, FlatList, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList, MessageData } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ICE_BREAKERS = [
  "What's your go-to coffee order?",
  "Best cafe you've ever been to?",
  "Morning coffee or afternoon pick-me-up?",
  "Do you prefer cozy cafes or modern ones?",
];

const MOCK_MESSAGES: MessageData[] = [
  {
    id: '1',
    matchId: '1',
    senderId: 'other',
    text: "Hey! I noticed you're a latte lover too!",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: true,
  },
  {
    id: '2',
    matchId: '1',
    senderId: 'me',
    text: "Hi! Yes, I can't start my day without one. What's your favorite cafe?",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    read: true,
  },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const { matchId, matchName, matchPhoto } = route.params;
  const [messages, setMessages] = useState<MessageData[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showIceBreakers, setShowIceBreakers] = useState(messages.length < 3);

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newMessage: MessageData = {
      id: `msg_${Date.now()}`,
      matchId,
      senderId: 'me',
      text: inputText.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setShowIceBreakers(false);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

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
    navigation.navigate('DatePlanning', { matchId, matchName });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item }: { item: MessageData }) => {
    const isMe = item.senderId === 'me';

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        {!isMe && (
          <Image source={{ uri: matchPhoto }} style={styles.messageAvatar} contentFit="cover" />
        )}
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
            {item.text}
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

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {messages.length >= 3 && (
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
        )}

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

        {showIceBreakers && (
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
        )}

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
            disabled={!inputText.trim()}
          >
            <Feather
              name="send"
              size={20}
              color={inputText.trim() ? theme.buttonText : theme.textSecondary}
            />
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
