import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';

export interface StepDraft {
  number: number;
  description: string;
}

interface StepInputProps {
  steps: StepDraft[];
  onChange: (steps: StepDraft[]) => void;
}

/** Controlled dynamic list of recipe steps. Add / remove / edit inline. */
export function StepInput({ steps, onChange }: StepInputProps) {
  const update = (index: number, value: string) => {
    const next = steps.map((s, i) => (i === index ? { ...s, description: value } : s));
    onChange(next);
  };
  const remove = (index: number) => {
    const next = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, number: i + 1 }));
    onChange(next);
  };
  const add = () => {
    onChange([...steps, { number: steps.length + 1, description: '' }]);
  };

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{step.number}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={step.description}
            onChangeText={(v) => update(index, v)}
            placeholder={`Step ${step.number}`}
            placeholderTextColor={Colors.textSecondary}
            multiline
          />
          {steps.length > 1 ? (
            <Pressable onPress={() => remove(index)} hitSlop={10} accessibilityLabel="Remove step">
              <FontAwesome6 name="xmark" size={14} color={Colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      ))}
      <Pressable style={styles.addButton} onPress={add} accessibilityRole="button">
        <FontAwesome6 name="plus" size={14} color={Colors.primary} />
        <Text style={[Typography.meta, { color: Colors.primary }]}>Add step</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  numberText: { color: '#fff', fontWeight: '700' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    minHeight: 44,
    backgroundColor: Colors.surface,
  },
  addButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
  },
});
