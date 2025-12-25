import { Platform } from "react-native";

const tintColorLight = "#6F4E37";
const tintColorDark = "#D4A574";

export const Colors = {
  light: {
    text: "#2C1810",
    textSecondary: "#6F5E53",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B5A4A",
    tabIconSelected: tintColorLight,
    link: "#6F4E37",
    primary: "#6F4E37",
    secondary: "#F5E6D3",
    accent: "#3E2723",
    success: "#8BC34A",
    error: "#E57373",
    warning: "#FFB74D",
    backgroundRoot: "#FAFAFA",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F5E6D3",
    backgroundTertiary: "#EDE0D4",
    border: "#E6D5C3",
    cardBackground: "#FFFFFF",
    overlay: "rgba(44, 24, 16, 0.5)",
  },
  dark: {
    text: "#F5E6D3",
    textSecondary: "#B8A99A",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8B7B6A",
    tabIconSelected: tintColorDark,
    link: "#D4A574",
    primary: "#D4A574",
    secondary: "#3E2723",
    accent: "#F5E6D3",
    success: "#8BC34A",
    error: "#E57373",
    warning: "#FFB74D",
    backgroundRoot: "#1A1412",
    backgroundDefault: "#2C241F",
    backgroundSecondary: "#3E3530",
    backgroundTertiary: "#4A4038",
    border: "#5A4A3F",
    cardBackground: "#2C241F",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  cardPadding: 16,
  screenPadding: 20,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

export const Shadows = {
  small: {
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const CoffeePreferences = [
  "Espresso",
  "Latte",
  "Cappuccino",
  "Americano",
  "Cold Brew",
  "Iced Coffee",
  "Mocha",
  "Macchiato",
  "Flat White",
  "Pour Over",
  "French Press",
  "Tea",
];

export const InterestTags = [
  "Travel",
  "Fitness",
  "Reading",
  "Music",
  "Art",
  "Cooking",
  "Photography",
  "Hiking",
  "Movies",
  "Gaming",
  "Yoga",
  "Dancing",
  "Tech",
  "Fashion",
  "Sports",
  "Writing",
  "Meditation",
  "Foodie",
  "Nature",
  "Entrepreneurship",
];
