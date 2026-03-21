import { TextStyle } from 'react-native';

/** Font family constants — loaded via useFonts in root layout */
export const Fonts = {
  heading: 'Lora_600SemiBold',
  headingBold: 'Lora_700Bold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
} as const;

/** Typography presets for consistent text styling */
export const Typography: Record<string, TextStyle> = {
  appTitle: { fontFamily: Fonts.headingBold, fontSize: 24 },
  sectionTitle: { fontFamily: Fonts.heading, fontSize: 18 },
  recipeTitle: { fontFamily: Fonts.heading, fontSize: 16 },
  body: { fontFamily: Fonts.body, fontSize: 15 },
  meta: { fontFamily: Fonts.bodyMedium, fontSize: 13 },
  caption: { fontFamily: Fonts.body, fontSize: 12 },
  chip: { fontFamily: Fonts.bodySemiBold, fontSize: 14 },
};
