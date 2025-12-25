import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, CoffeePreferences, InterestTags } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [photos, setPhotos] = useState<string[]>(user?.photos || []);
  const [coffeePrefs, setCoffeePrefs] = useState<string[]>(user?.coffeePreferences || []);
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      setPhotos(newPhotos.filter(Boolean));
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const toggleCoffeePref = (pref: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCoffeePrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const toggleInterest = (interest: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        bio: bio.trim(),
        photos,
        coffeePreferences: coffeePrefs,
        interests,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.photosSection}>
          <ThemedText style={styles.sectionTitle}>Photos</ThemedText>
          <View style={styles.photosGrid}>
            {[0, 1, 2, 3, 4].map((index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.photoSlot,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => handlePickImage(index)}
              >
                {photos[index] ? (
                  <Image source={{ uri: photos[index] }} style={styles.photo} contentFit="cover" />
                ) : (
                  <View style={styles.addPhotoContent}>
                    <Feather name={index === 0 ? 'camera' : 'plus'} size={24} color={theme.textSecondary} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.inputSection}>
          <ThemedText style={styles.label}>Bio</ThemedText>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
            ]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell others about yourself..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputSection}>
          <ThemedText style={styles.label}>Coffee Preferences</ThemedText>
          <View style={styles.tagsContainer}>
            {CoffeePreferences.map((pref) => (
              <Pressable
                key={pref}
                style={({ pressed }) => [
                  styles.tag,
                  {
                    backgroundColor: coffeePrefs.includes(pref) ? theme.primary : theme.backgroundSecondary,
                    borderColor: coffeePrefs.includes(pref) ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => toggleCoffeePref(pref)}
              >
                <ThemedText
                  style={[
                    styles.tagText,
                    { color: coffeePrefs.includes(pref) ? theme.buttonText : theme.text },
                  ]}
                >
                  {pref}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <ThemedText style={styles.label}>Interests</ThemedText>
          <View style={styles.tagsContainer}>
            {InterestTags.map((interest) => (
              <Pressable
                key={interest}
                style={({ pressed }) => [
                  styles.tag,
                  {
                    backgroundColor: interests.includes(interest) ? theme.primary : theme.backgroundSecondary,
                    borderColor: interests.includes(interest) ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <ThemedText
                  style={[
                    styles.tagText,
                    { color: interests.includes(interest) ? theme.buttonText : theme.text },
                  ]}
                >
                  {interest}
                </ThemedText>
              </Pressable>
            ))}
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
            styles.saveButton,
            { backgroundColor: theme.primary, opacity: pressed || isSaving ? 0.8 : 1 },
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <ThemedText style={[styles.saveButtonText, { color: theme.buttonText }]}>
            {isSaving ? 'Saving...' : 'Save Changes'}
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
  photosSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 0.8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  addPhotoContent: {
    alignItems: 'center',
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  textArea: {
    height: 100,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderWidth: 1,
    ...Typography.body,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    ...Typography.small,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
