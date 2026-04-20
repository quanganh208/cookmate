import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';

interface RecipeImagePickerProps {
  previewUri: string | null;
  imageUrl: string | null;
  phase: 'idle' | 'picking' | 'resizing' | 'uploading' | 'done' | 'error';
  errorMessage?: string | null;
  onPickLibrary: () => void;
  onTakePhoto: () => void;
  onReset: () => void;
}

function phaseLabel(phase: RecipeImagePickerProps['phase']): string {
  switch (phase) {
    case 'picking':
      return 'Opening picker…';
    case 'resizing':
      return 'Preparing image…';
    case 'uploading':
      return 'Uploading…';
    default:
      return '';
  }
}

/** Image input: empty state with "pick / camera" buttons, preview + replace once selected. */
export function RecipeImagePicker({
  previewUri,
  imageUrl,
  phase,
  errorMessage,
  onPickLibrary,
  onTakePhoto,
  onReset,
}: RecipeImagePickerProps) {
  const busy = phase === 'picking' || phase === 'resizing' || phase === 'uploading';

  if (previewUri) {
    return (
      <View style={styles.previewWrap}>
        <Image source={previewUri} style={styles.preview} contentFit="cover" />
        {busy ? (
          <View style={styles.overlay}>
            <ActivityIndicator color="#fff" />
            <Text style={[Typography.caption, { color: '#fff' }]}>{phaseLabel(phase)}</Text>
          </View>
        ) : null}
        {phase === 'done' && imageUrl ? (
          <View style={styles.doneBadge}>
            <FontAwesome6 name="check" size={12} color="#fff" />
          </View>
        ) : null}
        <Pressable style={styles.replace} onPress={onReset} accessibilityLabel="Replace image">
          <FontAwesome6 name="rotate" size={14} color={Colors.textPrimary} />
          <Text style={[Typography.meta, { color: Colors.textPrimary }]}>Replace</Text>
        </Pressable>
        {phase === 'error' && errorMessage ? (
          <Text style={[Typography.caption, styles.error]}>{errorMessage}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.empty}>
      <FontAwesome6 name="camera" size={28} color={Colors.primary} />
      <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center' }]}>
        Add a picture of your dish
      </Text>
      <View style={styles.emptyRow}>
        <Pressable style={styles.emptyButton} onPress={onPickLibrary} accessibilityRole="button">
          <FontAwesome6 name="images" size={14} color={Colors.primary} />
          <Text style={[Typography.meta, { color: Colors.primary }]}>Library</Text>
        </Pressable>
        <Pressable style={styles.emptyButton} onPress={onTakePhoto} accessibilityRole="button">
          <FontAwesome6 name="camera" size={14} color={Colors.primary} />
          <Text style={[Typography.meta, { color: Colors.primary }]}>Camera</Text>
        </Pressable>
      </View>
      {phase === 'error' && errorMessage ? (
        <Text style={[Typography.caption, styles.error]}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.divider,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
  },
  emptyRow: { flexDirection: 'row', gap: 12 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  previewWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  doneBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replace: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  error: { color: Colors.error, marginTop: 4 },
});
