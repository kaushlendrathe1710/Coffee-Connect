import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Modal, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { apiRequest } from '@/lib/query-client';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  coffeeDateId: string;
  reviewerId: string;
  reviewedId: string;
  reviewedName: string;
}

export function ReviewModal({
  visible,
  onClose,
  coffeeDateId,
  reviewerId,
  reviewedId,
  reviewedName,
}: ReviewModalProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/reviews', {
        coffeeDateId,
        reviewerId,
        reviewedId,
        rating,
        comment: comment.trim() || undefined,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit review');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coffee-dates'] });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onClose();
      setRating(5);
      setComment('');
    },
    onError: (error: Error) => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  const handleStarPress = (starNumber: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRating(starNumber);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Rate your coffee date</ThemedText>
            <Pressable onPress={onClose} hitSlop={20}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            How was your date with {reviewedName}?
          </ThemedText>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => handleStarPress(star)} hitSlop={10}>
                <Feather
                  name="star"
                  size={40}
                  color={star <= rating ? '#F59E0B' : theme.border}
                />
              </Pressable>
            ))}
          </View>

          <ThemedText style={styles.ratingLabel}>
            {rating === 1
              ? 'Poor'
              : rating === 2
              ? 'Fair'
              : rating === 3
              ? 'Good'
              : rating === 4
              ? 'Great'
              : 'Excellent'}
          </ThemedText>

          <TextInput
            style={[
              styles.commentInput,
              { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Share your experience (optional)"
            placeholderTextColor={theme.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          <View style={styles.buttons}>
            <Pressable
              style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={onClose}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Submit Review</ThemedText>
              )}
            </Pressable>
          </View>

          {submitMutation.isError ? (
            <ThemedText style={[styles.errorText, { color: theme.error }]}>
              {submitMutation.error?.message || 'Failed to submit review'}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ratingLabel: {
    ...Typography.body,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  commentInput: {
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    ...Typography.small,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
