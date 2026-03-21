<h1 align="center">Cookmate</h1>
<p align="center">Your recipe sharing companion — discover, create, and share recipes with a vibrant community.</p>
<p align="center">
  <a href="https://github.com/quanganh208/cookmate/actions/workflows/frontend-ci.yml"><img alt="Frontend CI" src="https://github.com/quanganh208/cookmate/actions/workflows/frontend-ci.yml/badge.svg"></a>
  <a href="https://github.com/quanganh208/cookmate/actions/workflows/backend-ci.yml"><img alt="Backend CI" src="https://github.com/quanganh208/cookmate/actions/workflows/backend-ci.yml/badge.svg"></a>
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="Expo SDK 55" src="https://img.shields.io/badge/Expo-SDK%2055-black">
  <img alt="Spring Boot 3.5" src="https://img.shields.io/badge/Spring%20Boot-3.5-green">
  <img alt="MongoDB 8.0" src="https://img.shields.io/badge/MongoDB-8.0-00c917">
</p>

## Features

- Discover recipes shared by the community
- Create and publish your own recipes
- Search and filter recipes by cuisine, ingredients, difficulty
- Save favorite recipes for quick access
- View detailed nutritional information
- Connect with other food enthusiasts

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile | React Native Expo (Expo Router) | SDK 55 |
| Backend | Spring Boot | 4.0.3 |
| Language (BE) | Java | 21 LTS |
| Database | MongoDB | 8.0 |
| Build (FE) | pnpm workspaces | 10.x |
| Build (BE) | Maven wrapper | 3.9.x |

## Prerequisites

- **Node.js** 22+ — [nodejs.org](https://nodejs.org)
- **pnpm** 10+ — `npm install -g pnpm`
- **Java** 21 LTS — [Adoptium Temurin](https://adoptium.net)
- **Docker** — [docker.com](https://www.docker.com)
- **Xcode** 16+ (iOS) or **Android Studio** (Android) — required for development builds

> **Note:** This project uses native modules (`react-native-mmkv`, `react-native-reanimated`) that are **not compatible with Expo Go**. You must use a [development build](https://docs.expo.dev/develop/development-builds/introduction/).

## Quick Start

```bash
# Clone the repository
git clone <repo-url> cookmate && cd cookmate

# Install dependencies
pnpm install

# Start backend (Docker + Spring Boot)
pnpm dev

# In a separate terminal — build and run the mobile app
pnpm mobile:prebuild          # Generate native projects (first time only)
pnpm mobile:ios               # Build & run on iOS simulator
# or
pnpm mobile:android           # Build & run on Android emulator
```

## Project Structure

```
cookmate/
├── apps/
│   └── mobile/              # React Native Expo app
│       ├── app/             # Expo Router pages
│       ├── app.json         # Expo configuration
│       └── package.json
├── backend/                 # Spring Boot API
│   ├── src/main/java/com/cookmate/
│   │   ├── controller/      # REST endpoints
│   │   ├── service/         # Business logic
│   │   ├── repository/      # MongoDB access
│   │   ├── model/           # Domain entities
│   │   ├── dto/             # Data transfer objects
│   │   ├── config/          # Configuration
│   │   └── exception/       # Error handling
│   └── pom.xml
├── docker/                  # Docker configurations
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Docker + backend + mobile all at once |
| `pnpm backend` | Start Spring Boot backend server |
| `pnpm backend:test` | Run backend tests |
| `pnpm mobile` | Start Expo dev server (requires prior prebuild) |
| `pnpm mobile:prebuild` | Generate native iOS/Android projects |
| `pnpm mobile:ios` | Build & run on iOS simulator |
| `pnpm mobile:android` | Build & run on Android emulator |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm docker:up` | Start Docker services |
| `pnpm docker:down` | Stop Docker services |
| `pnpm docker:logs` | View Docker logs |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/cookmate` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `dev` |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, commit conventions, and pull request guidelines.

## License

[MIT](./LICENSE)
