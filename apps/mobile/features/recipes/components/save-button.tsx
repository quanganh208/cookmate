import { StyleSheet, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { AnimatedPressable } from '@/shared/components/animated-pressable';
import { useIsSaved } from '@/features/favorites/hooks/use-is-saved';
import { useToggleSave } from '@/features/favorites/hooks/use-toggle-save';

interface SaveButtonProps {
  recipeId: string;
  size?: number;
}

/** Heart toggle wired to the per-recipe `['favorites','contains',id]` query. */
export function SaveButton({ recipeId, size = 20 }: SaveButtonProps) {
  const { data } = useIsSaved(recipeId);
  const toggle = useToggleSave();
  const saved = data?.saved ?? false;

  return (
    <AnimatedPressable
      onPress={() => toggle.mutate({ recipeId, nextSaved: !saved })}
      style={styles.button}
      accessibilityLabel={saved ? 'Remove from favorites' : 'Save to favorites'}
    >
      <View>
        <FontAwesome6
          name="heart"
          size={size}
          color={saved ? Colors.primary : Colors.textSecondary}
          iconStyle={saved ? 'solid' : 'regular'}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
});
