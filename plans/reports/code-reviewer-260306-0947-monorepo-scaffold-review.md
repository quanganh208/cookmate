# Code Review: Cookmate Monorepo Scaffolding

**Score: 7.5 / 10**

## Scope

- Files reviewed: 30+ (all scaffolded files)
- Focus: Full codebase review of initial scaffold
- LOC: ~500 (config + source combined)

## Overall Assessment

Solid scaffold with well-structured monorepo layout, good Docker multi-stage build, proper Spring Boot config, and clean Expo Router setup. Several issues found -- most notably missing dev tool dependencies and missing asset files -- but nothing architecturally broken.

---

## Critical Issues

### 1. ESLint + Prettier Not Installed (BLOCKING CI)

**Impact:** Frontend CI workflow will fail. `pnpm lint` and `pnpm format:check` will throw "command not found" errors.

The root `package.json` defines lint/format scripts, `.eslintrc.js` references `@typescript-eslint/parser` and `plugin:@typescript-eslint/recommended`, but **no ESLint or Prettier packages appear in any `package.json` or the lockfile**.

Missing from root `package.json` `devDependencies`:
```json
{
  "devDependencies": {
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0"
  }
}
```

Or alternatively in `apps/mobile/package.json` devDependencies for workspace-scoped linting.

### 2. Missing Asset Files Referenced in app.json

`app.json` references these files that do NOT exist (only `.gitkeep` in `assets/`):
- `./assets/icon.png`
- `./assets/splash-icon.png`
- `./assets/adaptive-icon.png`
- `./assets/favicon.png`

Expo build will warn/fail when these are missing. Provide placeholder assets or remove references.

---

## High Priority

### 3. CorsConfig Allows Wildcard Headers

`CorsConfig.java` line 19: `.allowedHeaders("*")` is acceptable for dev but should be restricted in production. Currently there is no profile-conditional CORS config -- the same wide-open policy applies in prod.

**Recommendation:** Make CORS config profile-aware via `@Profile("dev")` for the permissive config and a stricter one for prod.

### 4. MongoDB Has No Authentication

Both `docker-compose.yml` and `application.yml` connect to MongoDB **without credentials**. The `mongo-init.js` also has no auth setup.

Fine for local dev, but:
- `.env.example` should document `MONGODB_USERNAME` / `MONGODB_PASSWORD` placeholders
- `application-prod.yml` should use a URI with credentials
- `docker-compose.yml` should have `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` environment vars commented out or documented

### 5. Dockerfile Health Check Uses wget on Alpine

`Dockerfile.backend` line 18: `CMD wget -qO- http://localhost:8080/actuator/health || exit 1`

The `eclipse-temurin:21-jre-alpine` image may not include `wget`. Use `curl` instead, or install `wget` explicitly:

```dockerfile
RUN apk add --no-cache wget
```

Or switch to:
```dockerfile
HEALTHCHECK CMD curl -f http://localhost:8080/actuator/health || exit 1
```

Note: Alpine minimal images may also lack `curl`. Safest to install explicitly.

### 6. CookmateApplicationTests Will Fail Without MongoDB

The test class uses `@SpringBootTest` with a hardcoded MongoDB URI (`mongodb://localhost:27017/cookmate-test`). In CI this works because of the MongoDB service container. But locally, running `./mvnw verify` without Docker will fail.

**Recommendation:** Add `spring-boot-testcontainers` and `testcontainers-mongodb` for reliable test isolation:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
```

---

## Medium Priority

### 7. Root .gitignore Missing Some Entries

Missing patterns:
- `*.env.local` variant already covered, but `.env.production` / `.env.staging` are not
- No `backend/target/` is already covered -- good
- Missing: `apps/mobile/ios/`, `apps/mobile/android/` (Expo prebuild output dirs)
- Missing: `.turbo/` (if Turborepo added later)

### 8. No .dockerignore File

Without a `.dockerignore` in the backend context, the Docker build sends `target/`, `.git`, and IDE files to the daemon. Creates larger build context and slower builds.

Create `backend/.dockerignore`:
```
target/
.git
.idea
*.iml
*.log
```

### 9. app.json References icon.png But Expo SDK 52 Prefers Expo Config Plugin

Expo SDK 52 works fine with `app.json`, but consider migrating to `app.config.ts` for dynamic configuration (e.g., environment-based API URLs). Not urgent for scaffold phase.

### 10. No .env Loading Mechanism in Mobile App

The mobile app has no way to read `API_BASE_URL` or other env vars. For Expo, consider:
- `expo-constants` (already installed) with `extra` config in `app.json`
- Or `react-native-dotenv` / `expo-env` for `.env` file support

### 11. README Lists Directories That Don't Exist Yet

README project structure shows `service/`, `repository/`, `model/`, `dto/`, `exception/` under backend -- these don't exist yet. Acceptable for a scaffold README showing target structure, but could confuse newcomers.

---

## Low Priority

### 12. Lockfile Version

`pnpm-lock.yaml` uses lockfileVersion 9.0, compatible with pnpm 10.x. Root `package.json` pins `pnpm@10.7.0` via `packageManager` field -- good.

### 13. EditorConfig Covers Makefile But No Makefile Exists

Harmless, but unnecessarily suggests a Makefile might be created.

### 14. Backend .gitignore Duplicates Root .gitignore

Some patterns (`.idea/`, `*.iml`, `target/`) are in both root and backend `.gitignore`. Functional but redundant.

---

## Positive Observations

- **Multi-stage Docker build** -- properly separates build (JDK) and runtime (JRE-Alpine) stages
- **Maven dependency caching** -- `dependency:go-offline` before `COPY src/` maximizes Docker layer caching
- **Spring profiles** -- clean separation of dev/prod configs
- **Actuator** -- included with health endpoint exposed; prod profile correctly limits to health only
- **pnpm workspaces** -- proper monorepo structure with workspace protocol
- **Expo Router** -- file-based routing setup is correct with `_layout.tsx`, `index.tsx`, `+not-found.tsx`
- **MongoDB indexes** -- `mongo-init.js` creates sensible indexes (unique email, text search, compound indexes)
- **CI workflow** -- MongoDB service container with health check in backend CI, correct paths filters
- **Healthcheck on both containers** -- Docker compose (MongoDB) and Dockerfile (API) both have health checks
- **Lombok excluded from fat jar** -- correct maven plugin config
- **Validation starter included** -- ready for `@Valid` annotations

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Install ESLint, Prettier, and @typescript-eslint packages in root devDependencies
2. **[CRITICAL]** Add placeholder asset files (icon.png, splash-icon.png, etc.) or remove app.json references
3. **[HIGH]** Fix Dockerfile healthcheck -- ensure wget or curl is available in Alpine image
4. **[HIGH]** Add `.dockerignore` for backend build context
5. **[MEDIUM]** Document MongoDB auth setup for production in `.env.example`
6. **[MEDIUM]** Consider profile-conditional CORS configuration
7. **[MEDIUM]** Add testcontainers for local test reliability
8. **[LOW]** Add Expo prebuild output dirs to .gitignore

---

## Metrics

| Metric | Value |
|--------|-------|
| Type Coverage | N/A (strict mode enabled, no app logic yet) |
| Test Coverage | Minimal (1 context-loads test) |
| Linting Issues | Cannot run (ESLint not installed) |
| Build (Backend) | Likely passes (standard Spring Boot) |
| Build (Frontend) | Likely fails on lint step (missing deps) |
| CI | Backend CI: likely passes; Frontend CI: will fail |

---

## Unresolved Questions

- Will the project use JWT or OAuth for auth in Phase 2? This affects whether `spring-boot-starter-security` should be added now
- Should the mobile app use a shared `packages/` workspace for common types/utilities between potential future web and mobile apps?
- Is there a preference for state management (Zustand, Redux Toolkit, React Context) for the mobile app?
