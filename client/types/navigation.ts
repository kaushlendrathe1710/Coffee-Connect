import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Chat: { matchId: string; matchName: string; matchPhoto: string };
  DatePlanning: { matchId: string; matchName: string; matchPhoto?: string; selectedCafe?: CafeData; selectedDateISO?: string; selectedTime?: string; notes?: string };
  CafeMap: { returnTo: 'DatePlanning'; matchId: string; matchName: string; matchPhoto?: string; selectedDateISO?: string; selectedTime?: string; notes?: string };
  UserProfile: { userId: string };
  EditProfile: undefined;
  Settings: undefined;
  Filters: undefined;
};

export type AuthStackParamList = {
  EmailInput: undefined;
  OTPVerification: { email: string };
  Welcome: undefined;
  RoleSelection: undefined;
  ProfileSetup: { role: 'host' | 'guest' };
  CoffeePreferences: undefined;
  InterestsSelection: undefined;
  AvailabilitySetup: undefined;
  LocationPermission: undefined;
  TermsConsent: undefined;
};

export type MainTabParamList = {
  DiscoverTab: undefined;
  MatchesTab: undefined;
  CalendarTab: undefined;
  ProfileTab: undefined;
};

export interface CafeData {
  id: string;
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export interface MatchData {
  id: string;
  userId: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  coffeePreferences: string[];
  interests: string[];
  distance: number;
  matchedAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface DateData {
  id: string;
  matchId: string;
  matchName: string;
  matchPhoto: string;
  cafe: CafeData;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  notes?: string;
}

export interface MessageData {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
}

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;
