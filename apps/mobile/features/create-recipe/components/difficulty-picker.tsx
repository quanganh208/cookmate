import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
const OPTIONS: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

interface DifficultyPickerProps {
  value: Difficulty | undefined;
  onChange: (v: Difficulty) => void;
}

export function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                Typography.meta,
                { color: active ? '#fff' : Colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
