import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { useIngredientsSearch } from '../hooks/use-ingredients-search';

export interface IngredientDraft {
  name: string;
  amount?: number;
  unit?: string;
}

interface IngredientInputProps {
  items: IngredientDraft[];
  onChange: (items: IngredientDraft[]) => void;
}

/** Dynamic list of ingredients with type-ahead autocomplete backed by the full catalog. */
export function IngredientInput({ items, onChange }: IngredientInputProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeQuery, setActiveQuery] = useState('');
  const { matches } = useIngredientsSearch(activeQuery);

  const updateName = (index: number, value: string) => {
    const next = items.map((it, i) => (i === index ? { ...it, name: value } : it));
    onChange(next);
    setActiveIndex(index);
    setActiveQuery(value);
  };
  const updateAmount = (index: number, value: string) => {
    const parsed = value.trim() === '' ? undefined : Number(value);
    const next = items.map((it, i) =>
      i === index ? { ...it, amount: Number.isFinite(parsed) ? parsed : undefined } : it,
    );
    onChange(next);
  };
  const updateUnit = (index: number, value: string) => {
    const next = items.map((it, i) => (i === index ? { ...it, unit: value } : it));
    onChange(next);
  };
  const selectSuggestion = (index: number, name: string, unit?: string) => {
    const next = items.map((it, i) => (i === index ? { ...it, name, unit: unit ?? it.unit } : it));
    onChange(next);
    setActiveIndex(null);
    setActiveQuery('');
  };
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setActiveIndex(null);
  };
  const add = () => onChange([...items, { name: '', amount: undefined, unit: '' }]);

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={index} style={{ gap: 6 }}>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              value={item.name}
              onChangeText={(v) => updateName(index, v)}
              onFocus={() => {
                setActiveIndex(index);
                setActiveQuery(item.name);
              }}
              placeholder="Ingredient"
              placeholderTextColor={Colors.textSecondary}
            />
            <TextInput
              style={[styles.input, { flex: 0.7 }]}
              value={item.amount != null ? String(item.amount) : ''}
              onChangeText={(v) => updateAmount(index, v)}
              placeholder="Qty"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, { flex: 0.7 }]}
              value={item.unit ?? ''}
              onChangeText={(v) => updateUnit(index, v)}
              placeholder="Unit"
              placeholderTextColor={Colors.textSecondary}
            />
            {items.length > 1 ? (
              <Pressable
                onPress={() => remove(index)}
                hitSlop={10}
                accessibilityLabel="Remove ingredient"
              >
                <FontAwesome6 name="xmark" size={14} color={Colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          {activeIndex === index && matches.length > 0 ? (
            <View style={styles.suggestBox}>
              {matches.map((s) => (
                <Pressable
                  key={s.id}
                  style={styles.suggestRow}
                  onPress={() => selectSuggestion(index, s.name, s.unitDefault)}
                  accessibilityRole="button"
                >
                  <Text style={[Typography.body, { color: Colors.textPrimary }]}>{s.name}</Text>
                  {s.unitDefault ? (
                    <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
                      {s.unitDefault}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ))}
      <Pressable style={styles.addButton} onPress={add} accessibilityRole="button">
        <FontAwesome6 name="plus" size={14} color={Colors.primary} />
        <Text style={[Typography.meta, { color: Colors.primary }]}>Add ingredient</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  suggestBox: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    maxHeight: 200,
  },
  suggestRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
