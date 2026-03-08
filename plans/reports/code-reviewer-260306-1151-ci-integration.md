# Code Review: CI Integration

## Scope
- **Files:** 8 (2 workflows, 2 new configs, 1 new test, package.json, pom.xml, tsconfig.json, lockfile)
- **LOC changed:** ~1900 (mostly lockfile; ~120 meaningful)
- **Focus:** CI pipeline correctness, security, caching, edge cases

## Overall Assessment

Solid CI integration. Workflow structure is correct, caching strategy is well-thought-out, and the phased rollout (warn-only Checkstyle, build-only Docker) is pragmatic. A few issues found, one high priority.

---

## Critical Issues

None.

---

## High Priority

### 1. `@testing-library/jest-native` is deprecated

**File:** `apps/mobile/package.json` line 30

The `@testing-library/jest-native` package has been deprecated. Its matchers are now built into `@testing-library/react-native` (v12.4+). Since you already depend on `@testing-library/react-native@^13.3.3`, the jest-native package is unnecessary dead weight.

**Impact:** Pulling in an unmaintained package; future security/compat risk.

**Fix:** Remove `@testing-library/jest-native` from devDependencies. Use matchers from `@testing-library/react-native` directly when writing real tests. If you need the extended matchers, add this to jest setup:
```js
// jest-setup.js
import '@testing-library/react-native/extend-expect';
```

### 2. `tsconfig.json` removed Expo type includes

**File:** `apps/mobile/tsconfig.json`

The diff removed `.expo/types/**/*.ts` and `expo-env.d.ts` from the `include` array. These are Expo-generated type declaration files that provide ambient types (e.g., `process.env.EXPO_*` typings, module resolution for assets). While these files don't exist until `expo start` generates them, removing them from `include` means:
- TypeScript won't pick up Expo's ambient type declarations after they're generated
- May cause type errors in future code that relies on Expo environment types

**Fix:** Restore the removed entries:
```json
"include": [
  "**/*.ts",
  "**/*.tsx",
  ".expo/types/**/*.ts",
  "expo-env.d.ts"
]
```

### 3. `react-native-web` version may be incompatible with Expo 55

**File:** `apps/mobile/package.json` line 27

`react-native-web@^0.21.0` is added as a production dependency. Expo SDK 55 typically expects a specific version of `react-native-web` (likely `~0.20.x` or whatever the SDK pins). Using `^0.21.0` with a caret range could pull in breaking versions.

**Impact:** `expo export --platform web` (the build job) may fail or produce unexpected output if there's a version mismatch.

**Fix:** Check Expo SDK 55's expected version:
```bash
npx expo install react-native-web --check
```
Use the tilde range that Expo recommends, consistent with other Expo deps in this file.

---

## Medium Priority

### 4. Sample test provides zero value

**File:** `apps/mobile/__tests__/app.test.tsx`

The test `expect(true).toBe(true)` is a tautology that tests nothing. Combined with `--passWithNoTests`, the test job will always pass regardless of app correctness. This is fine as CI scaffolding but should be replaced with a real smoke test soon.

**Recommendation:** Replace with a minimal render test once setup is stable:
```tsx
import { render } from '@testing-library/react-native';
import App from '../app/index';

describe('App', () => {
  it('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
```

### 5. Repeated setup steps across 3 frontend jobs

**File:** `.github/workflows/frontend-ci.yml`

The pnpm/node/install sequence is duplicated across `lint`, `test`, and `build` jobs (lines 18-28, 42-52, 63-73). While each job runs in its own runner, this is verbose.

**Recommendation (low urgency):** Consider a reusable composite action or a matrix strategy to reduce duplication. Not blocking -- current approach is clearer for debugging.

### 6. Checkstyle config is minimal

**File:** `backend/checkstyle.xml`

Only 5 rules enabled: IndentationCheck, NeedBraces, UnusedImports, RedundantImport, FileLength, LineLength. This is a very light set. Notable omissions: naming conventions, cyclomatic complexity, magic numbers.

**Recommendation:** Acceptable for initial rollout with `failOnViolation=false`. Plan to expand rules incrementally once the team is comfortable.

### 7. `checkstyle.xml` LineLength outside TreeWalker

**File:** `backend/checkstyle.xml` line 22-23

`LineLength` is placed as a direct child of `Checker` (not inside `TreeWalker`). This is actually correct for Checkstyle (LineLength is a Checker-level module), but it's a common point of confusion. The current placement is fine.

---

## Low Priority

### 8. Docker `file` path relative to repo root vs context

**File:** `.github/workflows/backend-ci.yml` line 58

`context: ./backend` with `file: docker/Dockerfile.backend`. In `docker/build-push-action`, the `file` path is relative to the repo root (not the context), so this is correct. However, it's worth noting that the Dockerfile's COPY commands reference paths relative to context (`./backend`), which is also correct.

No action needed -- just documenting for clarity.

### 9. No `--ci` flag on jest

**File:** `apps/mobile/package.json` line 12

The test script uses `jest --passWithNoTests` but not `--ci`. In CI environments, `--ci` disables interactive mode and makes snapshot behavior stricter. Consider adding it in the workflow step rather than the script (to keep local `pnpm test` interactive-friendly):
```yaml
- name: Run tests
  run: pnpm --filter mobile test -- --ci
```

---

## Edge Cases Found by Scout

1. **tsconfig.json regression:** Removal of `.expo/types/**/*.ts` and `expo-env.d.ts` from includes will break Expo ambient types once generated (High -- documented above)
2. **Dockerfile.backend exists at correct path:** Verified `docker/Dockerfile.backend` exists, COPY paths match context `./backend`
3. **Maven wrapper exists:** `backend/mvnw` and `backend/.mvn/wrapper/` confirmed present
4. **ESLint config at root:** `eslint.config.mjs` exists, ignores `backend/` and `docker/` -- `pnpm lint` in CI will lint frontend code correctly
5. **No eslint config inside mobile app:** Root config handles it via workspace resolution
6. **babel.config.js present:** Uses `babel-preset-expo`, compatible with `jest-expo` preset
7. **`react-native-web` added as prod dep:** Needed for `expo export --platform web` but version range needs verification

---

## Positive Observations

- **pnpm before node setup** is correctly ordered for cache support -- a common gotcha avoided
- **`--frozen-lockfile`** used consistently across all install steps -- prevents accidental lockfile drift in CI
- **`push: false`** on Docker build -- correctly scoped to verification only, no registry credentials needed
- **`failOnViolation=false`** on Checkstyle -- pragmatic rollout that won't break existing code
- **GHA cache for Docker layers** (`type=gha,mode=max`) -- efficient use of GitHub Actions cache backend
- **Maven cache** via `setup-java` with `cache-dependency-path` -- already configured correctly
- **`needs: [lint, test]`** on build job -- correct dependency ordering, build only runs if both pass

---

## Recommended Actions (Prioritized)

1. **[High] Remove `@testing-library/jest-native`** from devDependencies (deprecated, redundant)
2. **[High] Restore `.expo/types/**/*.ts` and `expo-env.d.ts`** in tsconfig.json includes
3. **[High] Verify `react-native-web` version** compatibility with Expo SDK 55 via `npx expo install --check`
4. **[Medium] Replace tautology test** with a minimal render smoke test
5. **[Low] Add `--ci` flag** to jest in CI workflow step
6. **[Low] Plan Checkstyle rule expansion** after baseline stabilizes

---

## Metrics

| Metric | Value |
|--------|-------|
| Type Coverage | N/A (config/CI files) |
| Test Coverage | 0% (tautology test only) |
| Linting Issues | 0 (Checkstyle warn-only) |
| Security Issues | 0 |

---

## Plan Completeness

All 3 phases marked complete in plan. TODO items all checked. Implementation matches plan spec with minor deviations:
- Plan specified `jest.config.ts` (TypeScript), implementation used `jest.config.js` (JavaScript) -- acceptable simplification
- Plan specified `transformIgnorePatterns` in jest config -- implementation relies on `jest-expo` preset defaults -- acceptable (jest-expo handles this)
- Plan specified `docker build -f` command -- implementation uses `docker/build-push-action` with Buildx + caching -- improvement over plan

---

## Unresolved Questions

1. Is `react-native-web@^0.21.0` the correct version for Expo SDK 55? Needs verification via `npx expo install --check`
2. Should `@testing-library/jest-native` removal happen now or after real tests are written?
3. Is the tsconfig.json change intentional (removing Expo types) or accidental during formatting?
