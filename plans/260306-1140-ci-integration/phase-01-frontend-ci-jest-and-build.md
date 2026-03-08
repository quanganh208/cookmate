# Phase 01: Frontend CI — Jest + Expo Export

## Context Links
- Current workflow: `.github/workflows/frontend-ci.yml`
- Mobile app: `apps/mobile/package.json`
- Babel config: `apps/mobile/babel.config.js`

## Overview
- **Priority:** High
- **Status:** Complete
- **Description:** Add Jest testing framework and expo export build check to frontend CI

## Key Insights
- No Jest setup exists — need jest, jest-expo, @testing-library/react-native
- No test files exist — create sample test to validate CI pipeline
- `expo export --platform web` is fast and verifies JS bundle compiles
- pnpm workspace filter: `pnpm --filter mobile`

## Requirements

### Functional
- Jest runs with jest-expo preset for React Native compatibility
- At least 1 sample test passes in CI
- `expo export` verifies JS bundle compiles successfully

### Non-functional
- CI step should complete in < 3 min
- Clear error messages on test failures

## Related Code Files

### Modify
- `apps/mobile/package.json` — add jest deps + test script
- `.github/workflows/frontend-ci.yml` — add test + build steps

### Create
- `apps/mobile/jest.config.ts` — Jest configuration
- `apps/mobile/__tests__/app.test.tsx` — Sample test

## Implementation Steps

1. Install Jest dependencies in mobile app:
   ```
   pnpm --filter mobile add -D jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
   ```

2. Create `apps/mobile/jest.config.ts`:
   ```ts
   import type { Config } from 'jest';

   const config: Config = {
     preset: 'jest-expo',
     transformIgnorePatterns: [
       'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)'
     ],
   };

   export default config;
   ```

3. Add test script to `apps/mobile/package.json`:
   ```json
   "test": "jest --passWithNoTests"
   ```

4. Create sample test `apps/mobile/__tests__/app.test.tsx`:
   ```tsx
   import { render } from '@testing-library/react-native';

   describe('App', () => {
     it('should pass basic sanity check', () => {
       expect(true).toBe(true);
     });
   });
   ```

5. Update `.github/workflows/frontend-ci.yml`:
   - Add `test` job: `pnpm --filter mobile test`
   - Add `build` job: `npx expo export --platform web`
   - Keep existing lint job

## Todo List
- [x] Install Jest + testing-library deps
- [x] Create jest.config.ts
- [x] Add test script to package.json
- [x] Create sample test file
- [x] Update frontend-ci.yml with test + build steps
- [x] Verify CI passes locally

## Success Criteria
- `pnpm --filter mobile test` passes locally
- `npx expo export --platform web` completes without error
- GitHub Actions workflow runs all 4 steps: lint → tsc → test → build

## Risk Assessment
- **Jest transform issues:** RN modules need transformIgnorePatterns — mitigated with comprehensive pattern
- **Expo export web:** May require `react-dom` (already in deps) and `react-native-web` — verify if needed

## Next Steps
- Phase 3 adds pnpm store caching
