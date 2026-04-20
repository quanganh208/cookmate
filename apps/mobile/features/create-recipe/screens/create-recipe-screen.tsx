import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { AuthGate } from '@/features/auth/components/auth-gate';
import { ApiError } from '@/shared/api/api-error';
import { RecipeImagePicker } from '../components/recipe-image-picker';
import { DifficultyPicker } from '../components/difficulty-picker';
import { StepInput, type StepDraft } from '../components/step-input';
import { IngredientInput, type IngredientDraft } from '../components/ingredient-input';
import { useUploadImage } from '../hooks/use-upload-image';
import { useCreateRecipe } from '../hooks/use-create-recipe';
import { createRecipeSchema } from '../schemas/create-recipe-schema';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

function CreateRecipeForm() {
  const router = useRouter();
  const upload = useUploadImage();
  const mutation = useCreateRecipe();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [category, setCategory] = useState('');
  const [serving, setServing] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>('MEDIUM');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { name: '', amount: undefined, unit: '' },
  ]);
  const [steps, setSteps] = useState<StepDraft[]>([{ number: 1, description: '' }]);
  const [firstError, setFirstError] = useState<string | null>(null);

  const submit = async (status: 'DRAFT' | 'PUBLISHED') => {
    const parseOptionalInt = (v: string) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
    };
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      imageUrl: upload.imageUrl ?? '',
      serving: parseOptionalInt(serving),
      prepTime: parseOptionalInt(prepTime) ?? 0,
      cookTime: parseOptionalInt(cookTime) ?? 0,
      difficulty: difficulty ?? 'MEDIUM',
      cuisine: cuisine.trim() || undefined,
      category: category.trim() || undefined,
      status,
      steps: steps.filter((s) => s.description.trim().length > 0),
      ingredients: ingredients.filter((i) => i.name.trim().length > 0),
    };

    const parsed = createRecipeSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setFirstError(issue.message);
      return;
    }
    setFirstError(null);

    try {
      const created = await mutation.mutateAsync(parsed.data);
      router.replace(`/recipe/${created.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to save recipe';
      Alert.alert('Could not save', message);
    }
  };

  const submitting = mutation.isPending;
  const uploading = upload.phase === 'uploading' || upload.phase === 'resizing';
  const disabled = submitting || uploading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[Typography.appTitle, { color: Colors.textPrimary }]}>New Recipe</Text>

        <Section title="Picture">
          <RecipeImagePicker
            previewUri={upload.previewUri}
            imageUrl={upload.imageUrl}
            phase={upload.phase}
            errorMessage={upload.error}
            onPickLibrary={upload.pickFromLibrary}
            onTakePhoto={upload.takePhoto}
            onReset={upload.reset}
          />
        </Section>

        <Section title="Title">
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Phở Bò Hà Nội"
            placeholderTextColor={Colors.textSecondary}
          />
        </Section>

        <Section title="Description (optional)">
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Short description of your recipe"
            placeholderTextColor={Colors.textSecondary}
            multiline
          />
        </Section>

        <Section title="Cook time">
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={prepTime}
              onChangeText={setPrepTime}
              placeholder="Prep (min)"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={cookTime}
              onChangeText={setCookTime}
              placeholder="Cook (min)"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={serving}
              onChangeText={setServing}
              placeholder="Servings"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
            />
          </View>
        </Section>

        <Section title="Difficulty">
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        </Section>

        <Section title="Cuisine / Category (optional)">
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={cuisine}
              onChangeText={setCuisine}
              placeholder="Cuisine (e.g. Vietnamese)"
              placeholderTextColor={Colors.textSecondary}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={category}
              onChangeText={setCategory}
              placeholder="Category (e.g. Dinner)"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </Section>

        <Section title="Ingredients">
          <IngredientInput items={ingredients} onChange={setIngredients} />
        </Section>

        <Section title="Steps">
          <StepInput steps={steps} onChange={setSteps} />
        </Section>

        {firstError ? <Text style={styles.error}>{firstError}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.btnSecondary, disabled && styles.btnDisabled]}
            onPress={() => submit('DRAFT')}
            disabled={disabled}
          >
            <Text style={[Typography.body, { color: Colors.primary, fontWeight: '600' }]}>
              Save Draft
            </Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnPrimary, disabled && styles.btnDisabled]}
            onPress={() => submit('PUBLISHED')}
            disabled={disabled}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[Typography.body, { color: '#fff', fontWeight: '600' }]}>Publish</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[Typography.sectionTitle, { color: Colors.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

/** Create-recipe screen. Guests see the login prompt via AuthGate. */
export function CreateRecipeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AuthGate reason="Sign in to share your recipes with the community.">
        <CreateRecipeForm />
      </AuthGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  section: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnSecondary: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  btnDisabled: { opacity: 0.5 },
  error: {
    color: Colors.error,
    textAlign: 'center',
  },
});
