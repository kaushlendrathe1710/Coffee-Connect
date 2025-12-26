import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform, TextInput, FlatList, KeyboardAvoidingView, ActivityIndicator, Alert } from 'react-native';
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

interface CoffeeDate {
  id: string;
  matchId: string;
  guestId: string;
  hostId: string;
  status: string;
  guestConfirmed: boolean;
  hostConfirmed: boolean;
  paymentStatus: string;
  scheduledDate: string;
  cafeName?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

interface TypingStatus {
  matchId: string;
  userId: string;
  isTyping: boolean;
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch messages
  const { data: messagesData, isLoading, refetch } = useQuery<{ messages: Message[] }>({
    queryKey: ['/api/messages', matchId, `?userId=${user?.id}`],
    enabled: !!matchId && !!user?.id,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  const messages = messagesData?.messages || [];

  // Fetch coffee dates for this match
  const { data: datesData, refetch: refetchDates } = useQuery<{ dates: CoffeeDate[] }>({
    queryKey: ['/api/coffee-dates/match', matchId],
    enabled: !!matchId,
    refetchInterval: 5000, // Poll to check if other party confirmed
  });

  // Fetch typing status
  const { data: typingData } = useQuery<{ status: TypingStatus | null }>({
    queryKey: ['/api/typing', matchId],
    enabled: !!matchId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const isPartnerTyping = typingData?.status?.isTyping && typingData?.status?.userId !== user?.id;

  // Typing status mutation
  const updateTypingMutation = useMutation({
    mutationFn: async (isTyping: boolean) => {
      if (!user?.id) return;
      await apiRequest('PATCH', '/api/typing', {
        matchId,
        userId: user.id,
        isTyping,
      });
    },
  });

  // Cleanup typing status on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Reset typing status on unmount
      if (user?.id) {
        updateTypingMutation.mutate(false);
      }
    };
  }, []);

  // Mark messages as read mutation with deduplication
  const markReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await apiRequest('POST', `/api/messages/${matchId}/read`, {
        userId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
    },
  });

  // Ref to track if we've already marked read for current message count
  const lastMarkedReadRef = useRef<number>(0);

  // Mark messages as read when viewing chat (deduplicated)
  useEffect(() => {
    if (matchId && user?.id && messages.length > lastMarkedReadRef.current && !markReadMutation.isPending) {
      lastMarkedReadRef.current = messages.length;
      markReadMutation.mutate();
    }
  }, [matchId, user?.id, messages.length]);

  // Get the most recent accepted date (only show confirmation UI for accepted dates)
  const activeDate = datesData?.dates?.find(
    (d) => d.status === 'accepted' && d.paymentStatus !== 'paid'
  );

  const isGuest = user?.role === 'guest';
  const hasUserConfirmed = isGuest ? activeDate?.guestConfirmed : activeDate?.hostConfirmed;
  const hasOtherConfirmed = isGuest ? activeDate?.hostConfirmed : activeDate?.guestConfirmed;

  // Confirm date mutation
  const confirmDateMutation = useMutation({
    mutationFn: async (dateId: string) => {
      const response = await apiRequest('POST', `/api/coffee-dates/${dateId}/confirm`, {
        userId: user?.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm date');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/coffee-dates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
      refetchDates();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (data.bothConfirmed && data.paymentProcessed) {
        Alert.alert('Date Confirmed!', 'Both of you have confirmed. The date is now set and payment has been processed.');
      } else {
        const waitingFor = isGuest ? matchName : 'your date';
        Alert.alert('Confirmed!', `Waiting for ${waitingFor} to also confirm.`);
      }
    },
    onError: (error: any) => {
      if (error.message.includes('Insufficient')) {
        Alert.alert('Insufficient Balance', 'You need to add more funds to your wallet before confirming.');
      } else {
        Alert.alert('Error', error.message || 'Failed to confirm date');
      }
    },
  });

  const handleConfirmDate = () => {
    if (!activeDate) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      'Confirm Date is Set',
      `Confirm that your coffee date is happening. ${isGuest ? 'Once both confirm, payment will be processed.' : 'Once both confirm, you will receive payment.'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => confirmDateMutation.mutate(activeDate.id) },
      ]
    );
  };

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

    // Stop typing indicator
    updateTypingMutation.mutate(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendMessageMutation.mutate(inputText.trim());
    setInputText('');
    setShowIceBreakers(false);
  }, [inputText, sendMessageMutation, updateTypingMutation]);

  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    
    // Guard against undefined user
    if (!user?.id) return;

    // Send typing indicator
    if (text.length > 0) {
      updateTypingMutation.mutate(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingMutation.mutate(false);
      }, 3000);
    } else {
      updateTypingMutation.mutate(false);
    }
  }, [updateTypingMutation, user?.id]);

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
    const isRead = item.read || item.readAt;

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
          <View style={styles.messageFooter}>
            <ThemedText
              style={[
                styles.messageTime,
                { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
              ]}
            >
              {formatTime(item.createdAt)}
            </ThemedText>
            {isMe ? (
              <Feather 
                name={isRead ? "check-circle" : "check"} 
                size={12} 
                color={isRead ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'} 
                style={styles.readReceipt}
              />
            ) : null}
          </View>
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
        {activeDate ? (
          <View style={[styles.dateConfirmBanner, { backgroundColor: theme.success + '15', borderColor: theme.success }]}>
            <View style={styles.dateConfirmInfo}>
              <View style={styles.dateConfirmHeader}>
                <Feather name="calendar" size={18} color={theme.success} />
                <ThemedText style={[styles.dateConfirmTitle, { color: theme.success }]}>
                  Coffee Date Planned
                </ThemedText>
              </View>
              {activeDate.cafeName ? (
                <ThemedText style={[styles.dateConfirmDetails, { color: theme.textSecondary }]}>
                  {activeDate.cafeName}
                </ThemedText>
              ) : null}
              <View style={styles.confirmStatusRow}>
                <View style={styles.confirmStatus}>
                  <Feather 
                    name={hasUserConfirmed ? "check-circle" : "circle"} 
                    size={14} 
                    color={hasUserConfirmed ? theme.success : theme.textSecondary} 
                  />
                  <ThemedText style={[styles.confirmStatusText, { color: hasUserConfirmed ? theme.success : theme.textSecondary }]}>
                    You {hasUserConfirmed ? 'confirmed' : 'not confirmed'}
                  </ThemedText>
                </View>
                <View style={styles.confirmStatus}>
                  <Feather 
                    name={hasOtherConfirmed ? "check-circle" : "circle"} 
                    size={14} 
                    color={hasOtherConfirmed ? theme.success : theme.textSecondary} 
                  />
                  <ThemedText style={[styles.confirmStatusText, { color: hasOtherConfirmed ? theme.success : theme.textSecondary }]}>
                    {matchName.split(' ')[0]} {hasOtherConfirmed ? 'confirmed' : 'not confirmed'}
                  </ThemedText>
                </View>
              </View>
            </View>
            {!hasUserConfirmed ? (
              <Pressable
                style={({ pressed }) => [
                  styles.dateConfirmButton,
                  { backgroundColor: theme.success, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handleConfirmDate}
                disabled={confirmDateMutation.isPending}
              >
                {confirmDateMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.dateConfirmButtonText}>Date is Set</ThemedText>
                  </>
                )}
              </Pressable>
            ) : (
              <View style={[styles.confirmedBadge, { backgroundColor: theme.success }]}>
                <Feather name="check" size={14} color="#FFFFFF" />
              </View>
            )}
          </View>
        ) : messages.length >= 3 ? (
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
          {isPartnerTyping ? (
            <View style={[styles.typingIndicator, { backgroundColor: theme.backgroundSecondary }]}>
              <Image source={{ uri: matchPhoto }} style={styles.typingAvatar} contentFit="cover" />
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
                <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
                <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
              </View>
              <ThemedText style={[styles.typingText, { color: theme.textSecondary }]}>
                {matchName.split(' ')[0]} is typing...
              </ThemedText>
            </View>
          ) : null}
          <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={inputText}
              onChangeText={handleTextChange}
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
  dateConfirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginHorizontal: Spacing.screenPadding,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dateConfirmInfo: {
    flex: 1,
  },
  dateConfirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  dateConfirmTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  dateConfirmDetails: {
    ...Typography.small,
    marginBottom: Spacing.sm,
  },
  confirmStatusRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  confirmStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmStatusText: {
    ...Typography.caption,
  },
  dateConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  dateConfirmButtonText: {
    ...Typography.small,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
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
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  readReceipt: {
    marginLeft: 2,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
    marginLeft: Spacing.sm,
    gap: Spacing.sm,
  },
  typingAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 3,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  typingText: {
    ...Typography.caption,
    fontStyle: 'italic',
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
