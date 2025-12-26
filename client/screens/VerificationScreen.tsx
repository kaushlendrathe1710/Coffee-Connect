import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { apiRequest } from '@/lib/query-client';

interface VerificationStatus {
  verified: boolean;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  verificationPhoto: string | null;
  rejectedReason: string | null;
  latestRequest: {
    id: string;
    status: string;
    rejectedReason: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
}

export default function VerificationScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const { data: verificationData, isLoading } = useQuery<VerificationStatus>({
    queryKey: ['/api/verification', user?.id],
    enabled: !!user?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async (selfiePhoto: string) => {
      const res = await apiRequest('POST', '/api/verification/submit', {
        userId: user?.id,
        selfiePhoto,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit verification');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/verification'] });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Submitted!', 'Your verification photo has been submitted for review. You will be notified once it is reviewed.');
      setSelfieUri(null);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleTakeSelfie = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take a selfie for verification.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });

    if (!result.canceled && result.assets[0]) {
      setSelfieUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!selfieUri) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Submit Verification',
      'Make sure your face is clearly visible and matches your profile photos. Our team will review your submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => submitMutation.mutate(selfieUri) },
      ]
    );
  };

  const getStatusIcon = () => {
    switch (verificationData?.verificationStatus) {
      case 'approved':
        return { name: 'check-circle' as const, color: '#22C55E' };
      case 'pending':
        return { name: 'clock' as const, color: '#F59E0B' };
      case 'rejected':
        return { name: 'x-circle' as const, color: '#EF4444' };
      default:
        return { name: 'alert-circle' as const, color: theme.textSecondary };
    }
  };

  const getStatusText = () => {
    switch (verificationData?.verificationStatus) {
      case 'approved':
        return 'Your profile is verified!';
      case 'pending':
        return 'Your verification is under review';
      case 'rejected':
        return 'Verification was not approved';
      default:
        return 'Your profile is not verified';
    }
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

  const statusIcon = getStatusIcon();

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.statusCard, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={[styles.statusIconContainer, { backgroundColor: statusIcon.color + '20' }]}>
            <Feather name={statusIcon.name} size={40} color={statusIcon.color} />
          </View>
          <ThemedText style={styles.statusTitle}>{getStatusText()}</ThemedText>
          {verificationData?.verificationStatus === 'rejected' && verificationData?.rejectedReason ? (
            <ThemedText style={[styles.rejectedReason, { color: theme.textSecondary }]}>
              Reason: {verificationData.rejectedReason}
            </ThemedText>
          ) : null}
          {verificationData?.verificationStatus === 'approved' ? (
            <View style={[styles.verifiedBadge, { backgroundColor: '#22C55E20' }]}>
              <Feather name="shield" size={16} color="#22C55E" />
              <ThemedText style={[styles.verifiedBadgeText, { color: '#22C55E' }]}>
                Verified Profile
              </ThemedText>
            </View>
          ) : null}
        </View>

        {verificationData?.verificationStatus !== 'approved' ? (
          <>
            <View style={styles.instructionsContainer}>
              <ThemedText style={styles.instructionsTitle}>How to verify</ThemedText>
              <View style={styles.instructionRow}>
                <View style={[styles.instructionNumber, { backgroundColor: theme.primary }]}>
                  <ThemedText style={styles.instructionNumberText}>1</ThemedText>
                </View>
                <ThemedText style={[styles.instructionText, { color: theme.textSecondary }]}>
                  Take a clear selfie with good lighting
                </ThemedText>
              </View>
              <View style={styles.instructionRow}>
                <View style={[styles.instructionNumber, { backgroundColor: theme.primary }]}>
                  <ThemedText style={styles.instructionNumberText}>2</ThemedText>
                </View>
                <ThemedText style={[styles.instructionText, { color: theme.textSecondary }]}>
                  Make sure your face is clearly visible
                </ThemedText>
              </View>
              <View style={styles.instructionRow}>
                <View style={[styles.instructionNumber, { backgroundColor: theme.primary }]}>
                  <ThemedText style={styles.instructionNumberText}>3</ThemedText>
                </View>
                <ThemedText style={[styles.instructionText, { color: theme.textSecondary }]}>
                  Our team will compare it with your profile photos
                </ThemedText>
              </View>
            </View>

            {selfieUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: selfieUri }} style={styles.previewImage} contentFit="cover" />
                <View style={styles.previewActions}>
                  <Pressable
                    style={[styles.retakeButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={handleTakeSelfie}
                  >
                    <Feather name="camera" size={20} color={theme.text} />
                    <ThemedText style={styles.retakeButtonText}>Retake</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.submitButton, { backgroundColor: theme.primary }]}
                    onPress={handleSubmit}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="check" size={20} color="#FFFFFF" />
                        <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.takeSelfieButton,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handleTakeSelfie}
                disabled={verificationData?.verificationStatus === 'pending'}
              >
                <Feather name="camera" size={24} color="#FFFFFF" />
                <ThemedText style={styles.takeSelfieButtonText}>
                  {verificationData?.verificationStatus === 'pending'
                    ? 'Verification Pending...'
                    : verificationData?.verificationStatus === 'rejected'
                    ? 'Try Again'
                    : 'Take Selfie'}
                </ThemedText>
              </Pressable>
            )}

            {verificationData?.verificationStatus === 'pending' ? (
              <ThemedText style={[styles.pendingNote, { color: theme.textSecondary }]}>
                Your verification is being reviewed. This usually takes 24-48 hours.
              </ThemedText>
            ) : null}
          </>
        ) : null}

        <View style={styles.benefitsContainer}>
          <ThemedText style={styles.benefitsTitle}>Verified badge benefits</ThemedText>
          <View style={styles.benefitRow}>
            <Feather name="check" size={16} color="#22C55E" />
            <ThemedText style={[styles.benefitText, { color: theme.textSecondary }]}>
              Build trust with potential matches
            </ThemedText>
          </View>
          <View style={styles.benefitRow}>
            <Feather name="check" size={16} color="#22C55E" />
            <ThemedText style={[styles.benefitText, { color: theme.textSecondary }]}>
              Get a verified badge on your profile
            </ThemedText>
          </View>
          <View style={styles.benefitRow}>
            <Feather name="check" size={16} color="#22C55E" />
            <ThemedText style={[styles.benefitText, { color: theme.textSecondary }]}>
              Increase your visibility in discovery
            </ThemedText>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
  },
  statusCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusTitle: {
    ...Typography.h3,
    textAlign: 'center',
  },
  rejectedReason: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  verifiedBadgeText: {
    ...Typography.small,
    fontWeight: '600',
  },
  instructionsContainer: {
    marginBottom: Spacing.xl,
  },
  instructionsTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    ...Typography.small,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instructionText: {
    ...Typography.body,
    flex: 1,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: Spacing.lg,
  },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retakeButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    justifyContent: 'center',
  },
  submitButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  takeSelfieButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  takeSelfieButtonText: {
    ...Typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingNote: {
    ...Typography.small,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  benefitsContainer: {
    marginTop: Spacing.lg,
  },
  benefitsTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  benefitText: {
    ...Typography.body,
  },
});
