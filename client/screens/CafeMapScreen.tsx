import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { RootStackParamList, CafeData } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CafeMap'>;
type CafeMapRouteProp = RouteProp<RootStackParamList, 'CafeMap'>;

const MOCK_CAFES: CafeData[] = [
  {
    id: '1',
    name: 'Blue Bottle Coffee',
    address: '123 Main St',
    rating: 4.5,
    priceLevel: 2,
    latitude: 37.7749,
    longitude: -122.4194,
    distance: 0.3,
  },
  {
    id: '2',
    name: 'Stumptown Coffee Roasters',
    address: '456 Oak Ave',
    rating: 4.7,
    priceLevel: 3,
    latitude: 37.7759,
    longitude: -122.4184,
    distance: 0.5,
  },
  {
    id: '3',
    name: 'Philz Coffee',
    address: '789 Pine Blvd',
    rating: 4.4,
    priceLevel: 2,
    latitude: 37.7739,
    longitude: -122.4204,
    distance: 0.8,
  },
  {
    id: '4',
    name: 'Ritual Coffee Roasters',
    address: '101 Valencia St',
    rating: 4.6,
    priceLevel: 2,
    latitude: 37.7729,
    longitude: -122.4214,
    distance: 1.2,
  },
];

export default function CafeMapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CafeMapRouteProp>();
  const { theme } = useTheme();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [cafes, setCafes] = useState<CafeData[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<CafeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocationAndCafes();
  }, []);

  const loadLocationAndCafes = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } else {
        // Use default location
        setLocation({ latitude: 37.7749, longitude: -122.4194 });
      }

      // For MVP, use mock data
      // In production, this would call Google Places API
      setCafes(MOCK_CAFES);
    } catch (error) {
      console.error('Error loading location:', error);
      setLocation({ latitude: 37.7749, longitude: -122.4194 });
      setCafes(MOCK_CAFES);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCafe = (cafe: CafeData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCafe(cafe);
  };

  const handleConfirmCafe = () => {
    if (!selectedCafe) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Navigate back to DatePlanning with the selected cafe and preserved state
    const { returnTo, matchId, matchName, matchPhoto, selectedDateISO, selectedTime, notes } = route.params;
    navigation.replace('DatePlanning', {
      matchId,
      matchName,
      matchPhoto,
      selectedCafe,
      selectedDateISO,
      selectedTime,
      notes,
    });
  };

  const renderCafeItem = ({ item }: { item: CafeData }) => (
    <Pressable
      style={({ pressed }) => [
        styles.cafeItem,
        {
          backgroundColor: selectedCafe?.id === item.id ? theme.secondary : theme.cardBackground,
          borderColor: selectedCafe?.id === item.id ? theme.primary : 'transparent',
          opacity: pressed ? 0.9 : 1,
        },
        Shadows.small,
      ]}
      onPress={() => handleSelectCafe(item)}
    >
      <View style={[styles.cafeIcon, { backgroundColor: theme.secondary }]}>
        <Feather name="coffee" size={20} color={theme.primary} />
      </View>
      <View style={styles.cafeInfo}>
        <ThemedText style={styles.cafeName}>{item.name}</ThemedText>
        <View style={styles.cafeDetails}>
          <View style={styles.cafeDetail}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.cafeDetailText, { color: theme.textSecondary }]}>
              {item.distance} km
            </ThemedText>
          </View>
          {item.rating && (
            <View style={styles.cafeDetail}>
              <Feather name="star" size={12} color={theme.warning} />
              <ThemedText style={[styles.cafeDetailText, { color: theme.text }]}>
                {item.rating}
              </ThemedText>
            </View>
          )}
          {item.priceLevel && (
            <ThemedText style={[styles.priceLevel, { color: theme.textSecondary }]}>
              {'$'.repeat(item.priceLevel)}
            </ThemedText>
          )}
        </View>
      </View>
      {selectedCafe?.id === item.id && (
        <View style={[styles.checkIcon, { backgroundColor: theme.primary }]}>
          <Feather name="check" size={16} color={theme.buttonText} />
        </View>
      )}
    </Pressable>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Finding nearby cafes...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {location && Platform.OS !== 'web' && (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
        >
          {cafes.map((cafe) => (
            <Marker
              key={cafe.id}
              coordinate={{ latitude: cafe.latitude, longitude: cafe.longitude }}
              title={cafe.name}
              description={cafe.address}
              onPress={() => handleSelectCafe(cafe)}
            />
          ))}
        </MapView>
      )}

      {Platform.OS === 'web' && (
        <View style={[styles.webMapPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="map" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.webMapText, { color: theme.textSecondary }]}>
            Map view available on mobile
          </ThemedText>
        </View>
      )}

      <View style={[styles.bottomSheet, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.bottomSheetHandle}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
        </View>
        <ThemedText style={styles.bottomSheetTitle}>Nearby Cafes</ThemedText>
        <FlatList
          data={cafes}
          renderItem={renderCafeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.cafeList}
          showsVerticalScrollIndicator={false}
        />
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              {
                backgroundColor: selectedCafe ? theme.primary : theme.backgroundTertiary,
                opacity: pressed && selectedCafe ? 0.8 : 1,
              },
            ]}
            onPress={handleConfirmCafe}
            disabled={!selectedCafe}
          >
            <ThemedText
              style={[
                styles.confirmButtonText,
                { color: selectedCafe ? theme.buttonText : theme.textSecondary },
              ]}
            >
              {selectedCafe ? `Select ${selectedCafe.name}` : 'Select a cafe'}
            </ThemedText>
          </Pressable>
        </View>
      </View>
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
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  map: {
    flex: 0.5,
  },
  webMapPlaceholder: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  webMapText: {
    ...Typography.body,
  },
  bottomSheet: {
    flex: 0.6,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    marginTop: -BorderRadius.lg,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  bottomSheetTitle: {
    ...Typography.h4,
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
  },
  cafeList: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  cafeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
  },
  cafeIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cafeInfo: {
    flex: 1,
  },
  cafeName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  cafeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cafeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cafeDetailText: {
    ...Typography.caption,
  },
  priceLevel: {
    ...Typography.caption,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
  },
  confirmButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
