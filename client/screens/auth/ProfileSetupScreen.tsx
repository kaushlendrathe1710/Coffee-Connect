import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { AuthStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>;
type ProfileSetupRouteProp = RouteProp<AuthStackParamList, 'ProfileSetup'>;

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProfileSetupRouteProp>();
  const { theme } = useTheme();
  const role = route.params.role;

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<string>('');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

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

  const handleContinue = () => {
    if (!isValid) {
      setShowErrors(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('CoffeePreferences');
  };

  const getValidationMessage = () => {
    if (photos.length === 0) return 'Please add at least one photo';
    if (!name.trim()) return 'Please enter your name';
    if (!age) return 'Please enter your age';
    if (parseInt(age) < 18) return 'You must be 18 or older';
    if (!gender) return 'Please select your gender';
    return '';
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isValid = name.trim() && age && parseInt(age) >= 18 && gender && photos.length > 0;

  const genderOptions = ['Male', 'Female', 'Non-binary', 'Other'];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleBack}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: '25%' }]} />
          </View>
        </View>
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <ThemedText style={styles.title}>Create your profile</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Let others know who you are
        </ThemedText>

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
                    <Feather
                      name={index === 0 ? 'camera' : 'plus'}
                      size={24}
                      color={theme.textSecondary}
                    />
                    {index === 0 && (
                      <ThemedText style={[styles.addPhotoText, { color: theme.textSecondary }]}>
                        Add photo
                      </ThemedText>
                    )}
                  </View>
                )}
                {index === 0 && photos[index] && (
                  <View style={[styles.mainBadge, { backgroundColor: theme.primary }]}>
                    <ThemedText style={[styles.mainBadgeText, { color: theme.buttonText }]}>
                      Main
                    </ThemedText>
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
          <ThemedText style={styles.label}>Age</ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
            ]}
            value={age}
            onChangeText={setAge}
            placeholder="Your age"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <View style={styles.inputSection}>
          <ThemedText style={styles.label}>Gender</ThemedText>
          <View style={styles.genderOptions}>
            {genderOptions.map((option) => (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.genderOption,
                  {
                    backgroundColor: gender === option ? theme.primary : theme.backgroundSecondary,
                    borderColor: gender === option ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => setGender(option)}
              >
                <ThemedText
                  style={[
                    styles.genderOptionText,
                    { color: gender === option ? theme.buttonText : theme.text },
                  ]}
                >
                  {option}
                </ThemedText>
              </Pressable>
            ))}
          </View>
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
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl, backgroundColor: theme.backgroundRoot }]}>
        {showErrors && !isValid ? (
          <ThemedText style={[styles.errorText, { color: theme.error }]}>
            {getValidationMessage()}
          </ThemedText>
        ) : null}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: isValid ? theme.primary : theme.backgroundTertiary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={handleContinue}
        >
          <ThemedText
            style={[styles.buttonText, { color: isValid ? theme.buttonText : theme.textSecondary }]}
          >
            Continue
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
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.xl,
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
    gap: Spacing.xs,
  },
  addPhotoText: {
    ...Typography.caption,
  },
  mainBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  mainBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
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
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genderOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  genderOptionText: {
    ...Typography.small,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.small,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
});
